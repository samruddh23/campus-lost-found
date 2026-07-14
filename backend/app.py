import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from models.user import User
from models.lost_item import LostItem
from models.found_item import FoundItem
from routes.auth import auth_bp, auth_alias_bp
from routes.lost import lost_bp
from routes.found import found_bp
from routes.ai import ai_bp
from routes.admin import admin_bp
from routes.search import search_bp

from config import Config

from extensions import mail

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)
jwt = JWTManager(app)
mail.init_app(app)

app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(auth_alias_bp) # flat aliases
app.register_blueprint(lost_bp, url_prefix='/lost')
app.register_blueprint(found_bp, url_prefix='/found')
app.register_blueprint(ai_bp, url_prefix='/ai')
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(search_bp, url_prefix='/search')

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() in ["true", "1"]
    app.run(debug=debug_mode)