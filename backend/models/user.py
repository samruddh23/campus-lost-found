from datetime import datetime, timezone
from .db import db

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(20), default="user")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    lost_items = db.relationship(
        "LostItem",
        back_populates="user",
        lazy=True,
        cascade="all, delete-orphan"
    )

    found_items = db.relationship(
        "FoundItem",
        back_populates="user",
        lazy=True,
        cascade="all, delete-orphan"
    )