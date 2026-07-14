import os
import unittest
from datetime import datetime, timedelta, timezone
from PIL import Image

# Set import path for testing
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User, LostItem, FoundItem, ItemEmbedding
from ai.matcher import get_matches

class TestMatcher(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create uploads folder for dummy test images
        cls.upload_folder = 'uploads'
        with app.app_context():
            cls.upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(cls.upload_folder, exist_ok=True)
        
        # Save a couple of dummy images
        cls.img_name1 = 'test_match_red.jpg'
        cls.img_name2 = 'test_match_blue.jpg'
        Image.new('RGB', (100, 100), color='red').save(os.path.join(cls.upload_folder, cls.img_name1))
        Image.new('RGB', (100, 100), color='blue').save(os.path.join(cls.upload_folder, cls.img_name2))

    @classmethod
    def tearDownClass(cls):
        # Clean up images
        for img in [cls.img_name1, cls.img_name2]:
            path = os.path.join(cls.upload_folder, img)
            if os.path.exists(path):
                os.remove(path)

    def test_matching_engine_and_weights(self):
        """Test the combined matching engine output, sorting, and weights."""
        with app.app_context():
            import time
            user = User(
                name="Matcher Test User",
                email=f"matcher_{int(time.time())}@campus.edu",
                password="password123"
            )
            db.session.add(user)
            db.session.commit()

            try:
                # 2. Create target lost item
                target_lost = LostItem(
                    user_id=user.id,
                    item_name="Black Leather Wallet",
                    category="Wallets",
                    location="Library",
                    image=self.img_name1
                )
                db.session.add(target_lost)
                
                # 3. Create candidates:
                # Candidate 1: perfect match (same name, same category, same image)
                candidate_perfect = FoundItem(
                    user_id=user.id,
                    item_name="Black Leather Wallet",
                    category="Wallets",
                    location="Library Study Room",
                    image=self.img_name1
                )
                db.session.add(candidate_perfect)
                
                # Candidate 2: partial match (different name, same category, different image)
                candidate_partial = FoundItem(
                    user_id=user.id,
                    item_name="Brown Leather Wallet",
                    category="Wallets",
                    location="Gym",
                    image=self.img_name2
                )
                db.session.add(candidate_partial)

                # Candidate 3: poor match (different name, different category, no image)
                candidate_poor = FoundItem(
                    user_id=user.id,
                    item_name="Blue Plastic Water Bottle",
                    category="Bottles",
                    location="Campus Cafe",
                    image=None
                )
                db.session.add(candidate_poor)
                db.session.commit()

                # Get matches for our target_lost
                matches = get_matches(target_lost.id, 'lost')
                
                # Assertions
                self.assertTrue(len(matches) >= 3, "Should return at least 3 candidates.")
                
                # Confirm sort order (highest confidence first)
                confidences = [m["confidence_score"] for m in matches]
                self.assertEqual(confidences, sorted(confidences, reverse=True), "Matches must be sorted by confidence descending.")
                
                # Perfect match checks (should be very close to 100%)
                perf_match = next(m for m in matches if m["matched_item_id"] == candidate_perfect.id)
                self.assertTrue(perf_match["confidence_score"] > 90.0, f"Perfect match should have high confidence, got {perf_match['confidence_score']}%")
                self.assertIsNotNone(perf_match["image_similarity"])

                # Poor match checks (should be metadata only, no image match)
                poor_match = next(m for m in matches if m["matched_item_id"] == candidate_poor.id)
                self.assertIsNone(poor_match["image_similarity"])
                self.assertTrue(poor_match["confidence_score"] < 60.0, f"Poor match should have low confidence, got {poor_match['confidence_score']}%")

                # Clean up items in DB
                embs = ItemEmbedding.query.filter(
                    ItemEmbedding.item_id.in_([target_lost.id, candidate_perfect.id, candidate_partial.id, candidate_poor.id])
                ).all()
                for emb in embs:
                    db.session.delete(emb)
                    
                db.session.delete(target_lost)
                db.session.delete(candidate_perfect)
                db.session.delete(candidate_partial)
                db.session.delete(candidate_poor)
                db.session.delete(user)
                db.session.commit()

            except Exception as e:
                db.session.rollback()
                raise e

    def test_route_matches_endpoints(self):
        """Test the matches route API endpoints for /lost/<id>/matches and /found/<id>/matches."""
        with app.app_context():
            import time
            user = User(
                name="Route Test User",
                email=f"route_{int(time.time())}@campus.edu",
                password="password123"
            )
            db.session.add(user)
            db.session.commit()

            try:
                lost_item = LostItem(
                    user_id=user.id,
                    item_name="Matching Leather Bag",
                    category="Bags",
                    location="Main Hall"
                )
                db.session.add(lost_item)
                
                found_item = FoundItem(
                    user_id=user.id,
                    item_name="Matching Leather Bag",
                    category="Bags",
                    location="Main Hall Lobby"
                )
                db.session.add(found_item)
                db.session.commit()

                # Test Flask Client
                client = app.test_client()
                
                # 1. Lost matches endpoint
                resp_lost = client.get(f'/lost/{lost_item.id}/matches')
                self.assertEqual(resp_lost.status_code, 200)
                data_lost = resp_lost.get_json()
                self.assertTrue(isinstance(data_lost, list))
                
                # Check required fields exist in matched list
                if data_lost:
                    self.assertIn("matched_item_id", data_lost[0])
                    self.assertIn("matched_item_type", data_lost[0])
                    self.assertIn("confidence_score", data_lost[0])
                    self.assertIn("image_similarity", data_lost[0])
                    self.assertIn("metadata_similarity", data_lost[0])

                # 2. Found matches endpoint
                resp_found = client.get(f'/found/{found_item.id}/matches')
                self.assertEqual(resp_found.status_code, 200)
                data_found = resp_found.get_json()
                self.assertTrue(isinstance(data_found, list))

                # Clean up
                embs = ItemEmbedding.query.filter(
                    ItemEmbedding.item_id.in_([lost_item.id, found_item.id])
                ).all()
                for emb in embs:
                    db.session.delete(emb)
                db.session.delete(lost_item)
                db.session.delete(found_item)
                db.session.delete(user)
                db.session.commit()

            except Exception as e:
                db.session.rollback()
                raise e

    def test_ai_parse_endpoint(self):
        """Test the parse endpoint for free text conversion to structured JSON."""
        client = app.test_client()
        
        # Test valid payload
        payload = {"text": "I lost a blue water bottle yesterday at the Campus Library"}
        resp = client.post('/ai/parse', json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        
        self.assertEqual(data["category"], "Bottle")
        self.assertEqual(data["location"], "Campus Library")
        self.assertIsNotNone(data["item_name"])
        self.assertIsNotNone(data["date"])

        # Test empty payload validation
        resp_empty = client.post('/ai/parse', json={"text": ""})
        self.assertEqual(resp_empty.status_code, 400)

if __name__ == '__main__':
    unittest.main()
