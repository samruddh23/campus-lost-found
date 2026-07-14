from sqlalchemy import event
from datetime import datetime, timezone
import json
import os
from flask import current_app
from .lost_item import LostItem
from .found_item import FoundItem
from .item_embedding import ItemEmbedding
from ai.embeddings import pipeline

def generate_and_save_embedding(connection, item_id, item_type, image_filename):
    if not image_filename:
        return
    
    # Resolve the uploads folder configuration dynamically if Flask context is active
    upload_folder = 'uploads'
    try:
        if current_app:
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    except RuntimeError:
        # Gracefully handle non-request contexts (like direct test running)
        pass
        
    image_path = os.path.join(upload_folder, image_filename)
    
    # Generate embedding
    vector = pipeline.get_embedding(image_path)
    if vector is not None:
        try:
            # Perform direct SQL insert to execute inside the active transaction
            # and prevent SQLAlchemy session recursion / deadlocks.
            connection.execute(
                ItemEmbedding.__table__.insert().values(
                    item_id=item_id,
                    item_type=item_type,
                    vector=json.dumps(vector),
                    created_at=datetime.now(timezone.utc)
                )
            )
            print(f"Successfully generated and saved embedding for {item_type} item {item_id}.")
        except Exception as e:
            # Degrade gracefully
            print(f"Error saving embedding for {item_type} item {item_id} to DB: {e}")
    else:
        print(f"Skipped embedding for {item_type} item {item_id} (could not generate vector).")

@event.listens_for(LostItem, 'after_insert')
def lost_item_after_insert(mapper, connection, target):
    generate_and_save_embedding(connection, target.id, 'lost', target.image)

@event.listens_for(FoundItem, 'after_insert')
def found_item_after_insert(mapper, connection, target):
    generate_and_save_embedding(connection, target.id, 'found', target.image)
