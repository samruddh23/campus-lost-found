from datetime import datetime, timezone
from .db import db

class MatchNotification(db.Model):
    __tablename__ = 'match_notifications'

    id = db.Column(db.Integer, primary_key=True)
    source_item_id = db.Column(db.Integer, nullable=False)
    source_item_type = db.Column(db.String(10), nullable=False)
    target_item_id = db.Column(db.Integer, nullable=False)
    target_item_type = db.Column(db.String(10), nullable=False)
    notified_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
