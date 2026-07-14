from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from sqlalchemy.exc import IntegrityError
from models import db, User

auth_bp = Blueprint('auth', __name__)
auth_alias_bp = Blueprint('auth_alias', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    
    # Input validation
    required_fields = ['name', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400
            
    name = data['name'].strip()
    email = data['email'].strip().lower()
    password = data['password']
    phone = data.get('phone', '').strip() if data.get('phone') else None
    
    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password cannot be empty"}), 400
        
    # Duplicate email handling
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400
        
    role = 'user'  # Hardcoded to prevent admin privilege escalation

    pw_hash = generate_password_hash(password)
    new_user = User(name=name, email=email, password=pw_hash, phone=phone, role=role)
    
    try:
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email already registered"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error occurred during registration"}), 500
        
    return jsonify({"msg": "Registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    
    # Input validation
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
        
    user = User.query.filter_by(email=email.strip().lower()).first()
    if user and check_password_hash(user.password, password):
        token = create_access_token(identity=str(user.id))
        return jsonify({"token": token}), 200
        
    return jsonify({"error": "Bad email or password"}), 401

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except ValueError:
        return jsonify({"error": "Invalid token identity"}), 401
        
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except ValueError:
        return jsonify({"error": "Invalid token identity"}), 401
        
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.json or {}
    
    # Update fields
    if 'name' in data:
        name_val = data['name'].strip()
        if not name_val:
            return jsonify({"error": "Name cannot be empty"}), 400
        user.name = name_val
        
    if 'phone' in data:
        phone_val = data['phone'].strip() if data['phone'] else None
        user.phone = phone_val
        
    if 'email' in data:
        email_val = data['email'].strip().lower()
        if not email_val:
            return jsonify({"error": "Email cannot be empty"}), 400
        # Check uniqueness
        if email_val != user.email:
            existing = User.query.filter_by(email=email_val).first()
            if existing:
                return jsonify({"error": "Email already registered"}), 400
            user.email = email_val
            
    if 'password' in data:
        password_val = data['password']
        if not password_val or len(password_val) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        user.password = generate_password_hash(password_val)
        
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500
        
    return jsonify({
        "msg": "Profile updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }), 200

# Root Path Aliases (without /auth prefix)
@auth_alias_bp.route('/register', methods=['POST'])
def register_alias():
    return register()

@auth_alias_bp.route('/login', methods=['POST'])
def login_alias():
    return login()

@auth_alias_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile_alias():
    return profile()

@auth_alias_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile_alias():
    return update_profile()