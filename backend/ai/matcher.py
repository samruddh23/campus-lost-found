import numpy as np
from models import db, LostItem, FoundItem, ItemEmbedding
from ai.metadata_matcher import (
    calculate_text_similarity,
    calculate_category_similarity,
    calculate_date_similarity
)

def calculate_cosine_similarity(vec1, vec2):
    """
    Computes normalized cosine similarity [0.0, 1.0] between two vectors.
    """
    if not vec1 or not vec2:
        return 0.0
    try:
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0
        dot_product = np.dot(v1, v2)
        sim = dot_product / (norm1 * norm2)
        # Scale from [-1.0, 1.0] to [0.0, 1.0]
        return float((sim + 1.0) / 2.0)
    except Exception as e:
        print(f"Error calculating cosine similarity: {e}")
        return 0.0

def get_matches(item_id, item_type):
    """
    Finds and ranks matches for a given lost or found item.
    item_type must be either 'lost' or 'found'.
    Returns a list of dictionaries:
    {
        "matched_item_id": candidate.id,
        "matched_item_type": candidate_type,
        "confidence_score": confidence_score,
        "image_similarity": image_sim,
        "metadata_similarity": metadata_sim
    }
    """
    if item_type == 'lost':
        item = db.session.get(LostItem, item_id)
        if not item:
            return []
        candidates = FoundItem.query.all()
        candidate_type = 'found'
        target_type = 'lost'
    elif item_type == 'found':
        item = db.session.get(FoundItem, item_id)
        if not item:
            return []
        candidates = LostItem.query.all()
        candidate_type = 'lost'
        target_type = 'found'
    else:
        raise ValueError("item_type must be either 'lost' or 'found'")

    # Retrieve target embedding
    target_emb = ItemEmbedding.query.filter_by(item_id=item.id, item_type=target_type).first()
    target_vector = target_emb.vector if target_emb else None
    
    # Resolve target comparison date
    target_date = item.date_lost if item_type == 'lost' else item.date_found

    # Log warning if no embedding exists
    if not target_vector:
        print(f"Embedding warning: No embedding found for {target_type} item {item_id}. Falling back to metadata-only matching.")

    matches = []
    for candidate in candidates:
        # Retrieve candidate embedding
        candidate_emb = ItemEmbedding.query.filter_by(item_id=candidate.id, item_type=candidate_type).first()
        candidate_vector = candidate_emb.vector if candidate_emb else None
        
        # Resolve candidate comparison date
        candidate_date = candidate.date_found if candidate_type == 'found' else candidate.date_lost

        # 1. Cosine similarity
        has_image = target_vector is not None and candidate_vector is not None
        image_sim = 0.0
        if has_image:
            image_sim = calculate_cosine_similarity(target_vector, candidate_vector)

        # 2. Metadata similarity: fuzzy text + exact category + date proximity
        text_sim = calculate_text_similarity(item.item_name, candidate.item_name)
        if hasattr(item, 'description') and hasattr(candidate, 'description') and item.description and candidate.description:
            desc_sim = calculate_text_similarity(item.description, candidate.description)
            text_sim = 0.5 * text_sim + 0.5 * desc_sim

        category_sim = calculate_category_similarity(item.category, candidate.category)
        date_sim = calculate_date_similarity(target_date, candidate_date)

        # Compute metadata similarity (0-1 range)
        w_text = 0.50
        w_category = 0.30
        w_date = 0.20
        metadata_sim = (text_sim * w_text) + (category_sim * w_category) + (date_sim * w_date)

        # 3. Combined confidence score
        if has_image:
            # 0.6 * image_similarity + 0.4 * metadata_similarity
            confidence = (0.6 * image_sim) + (0.4 * metadata_sim)
        else:
            # Fallback case
            confidence = metadata_sim

        confidence_score = round(confidence * 100.0, 2)

        matches.append({
            "matched_item_id": candidate.id,
            "matched_item_type": candidate_type,
            "confidence_score": confidence_score,
            "image_similarity": round(image_sim, 4) if has_image else None,
            "metadata_similarity": round(metadata_sim, 4)
        })

    # Sort results by confidence_score descending
    matches.sort(key=lambda x: x["confidence_score"], reverse=True)
    return matches
