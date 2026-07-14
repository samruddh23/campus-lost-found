from .db import db
from datetime import datetime, timezone

class FoundItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=False)
    date_found = db.Column(db.DateTime, nullable=True)
    image = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='found')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', back_populates='found_items')

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "item_name": self.item_name,
            "category": self.category,
            "description": self.description,
            "location": self.location,
            "date_found": self.date_found.isoformat() if self.date_found else None,
            "image": self.image,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
