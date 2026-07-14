import os
import sys
import unittest
from unittest.mock import MagicMock

# Set import path for testing
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User, LostItem, FoundItem, MatchNotification
from ai.notifications import notify_match_if_needed

class TestNotifications(unittest.TestCase):
    def setUp(self):
        self.app_ctx = app.app_context()
        self.app_ctx.push()
        
        # Mock the mail instance
        from extensions import mail
        self.original_send = mail.send
        mail.send = MagicMock()
        self.mock_send = mail.send

        # Create unique dummy users
        import time
        t = int(time.time() * 1000)
        self.user1 = User(name="User One", email=f"user1_{t}@campus.edu", password="password")
        self.user2 = User(name="User Two", email=f"user2_{t}@campus.edu", password="password")
        db.session.add_all([self.user1, self.user2])
        db.session.commit()

        # Create dummy items
        self.lost_item = LostItem(
            user_id=self.user1.id,
            item_name="Lost Notification Wallet",
            category="Wallets",
            location="Main Hall"
        )
        self.found_item = FoundItem(
            user_id=self.user2.id,
            item_name="Found Notification Wallet",
            category="Wallets",
            location="Main Hall Lobby"
        )
        db.session.add_all([self.lost_item, self.found_item])
        db.session.commit()

    def tearDown(self):
        # Restore mock
        from extensions import mail
        mail.send = self.original_send

        # Clean up database records
        try:
            MatchNotification.query.delete()
            db.session.delete(self.lost_item)
            db.session.delete(self.found_item)
            db.session.delete(self.user1)
            db.session.delete(self.user2)
            db.session.commit()
        except Exception:
            db.session.rollback()
            
        self.app_ctx.pop()

    def test_notify_above_threshold(self):
        """Test that notification is sent when confidence is above the threshold (75%)."""
        self.mock_send.reset_mock()
        app.config["MATCH_NOTIFY_THRESHOLD"] = 75.0

        # Send with 80% confidence
        success = notify_match_if_needed(self.lost_item, 'lost', self.found_item, 'found', 80.0)
        
        self.assertTrue(success)
        self.mock_send.assert_called_once()

    def test_notify_below_threshold(self):
        """Test that notification is NOT sent when confidence is below the threshold (75%)."""
        self.mock_send.reset_mock()
        app.config["MATCH_NOTIFY_THRESHOLD"] = 75.0

        # Send with 70% confidence
        success = notify_match_if_needed(self.lost_item, 'lost', self.found_item, 'found', 70.0)
        
        self.assertFalse(success)
        self.mock_send.assert_not_called()

    def test_self_match_skipped(self):
        """Test that self-matches (same owner) skip notifications entirely."""
        self.mock_send.reset_mock()
        
        # Update found item owner to be the same as lost item owner
        self.found_item.user_id = self.user1.id
        db.session.commit()

        success = notify_match_if_needed(self.lost_item, 'lost', self.found_item, 'found', 80.0)
        
        self.assertFalse(success)
        self.mock_send.assert_not_called()

    def test_deduplication_prevents_repeats(self):
        """Test that the Option B DB deduplication prevents sending repeat notifications for the same match."""
        self.mock_send.reset_mock()
        app.config["MATCH_NOTIFY_THRESHOLD"] = 75.0

        # First notify trigger should succeed
        success_first = notify_match_if_needed(self.lost_item, 'lost', self.found_item, 'found', 80.0)
        self.assertTrue(success_first)
        self.assertEqual(self.mock_send.call_count, 1)

        # Second notify trigger for same pair should be skipped (deduplicated)
        success_second = notify_match_if_needed(self.lost_item, 'lost', self.found_item, 'found', 85.0)
        self.assertFalse(success_second)
        self.assertEqual(self.mock_send.call_count, 1) # Still 1 call

    def test_graceful_smtp_failure(self):
        """Test that SMTP send errors do not crash the call and return False gracefully."""
        self.mock_send.reset_mock()
        self.mock_send.side_effect = Exception("SMTP Connection Timeout")
        app.config["MATCH_NOTIFY_THRESHOLD"] = 75.0

        # Should execute without throwing, return False, and still record the try or handle it safely
        try:
            success = notify_match_if_needed(self.lost_item, 'lost', self.found_item, 'found', 80.0)
            self.assertFalse(success)
        except Exception as e:
            self.fail(f"notify_match_if_needed crashed with exception: {e}")

if __name__ == '__main__':
    unittest.main()
