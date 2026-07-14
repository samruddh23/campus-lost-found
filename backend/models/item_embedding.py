from .db import db
from datetime import datetime, timezone
import json

class ItemEmbedding(db.Model):
    __tablename__ = "item_embeddings"

    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, nullable=False)
    item_type = db.Column(db.String(20), nullable=False)  # 'lost' or 'found'
    _vector = db.Column('vector', db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def vector(self):
        if not self._vector:
            return []
        return json.loads(self._vector)

    @vector.setter
    def vector(self, value):
        self._vector = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "item_id": self.item_id,
            "item_type": self.item_type,
            "vector": self.vector,
            "created_at": self.created_at.isoformat()
        }
