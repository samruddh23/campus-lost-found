from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, FoundItem, User, LostItem
from ai.matcher import get_matches
from ai.notifications import notify_match_if_needed
from utils.upload import save_uploaded_image

found_bp = Blueprint('found', __name__)

@found_bp.route('', methods=['POST'])
@found_bp.route('/', methods=['POST'])
@jwt_required()
def add_item():
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
        image_file = request.files.get('image')
    else:
        data = request.json or {}
        image_file = None

    uid = int(get_jwt_identity())
    
    # Input validation
    required_fields = ['item_name', 'category', 'location']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    date_found = None
    if data.get('date_found'):
        try:
            # support ISO strings (e.g. 2026-07-13T22:30:00)
            date_found = datetime.fromisoformat(data['date_found'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"error": "Invalid date_found format. Use ISO format."}), 400

    # Save uploaded file if present
    image_filename = None
    if image_file:
        upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
        try:
            image_filename = save_uploaded_image(image_file, upload_folder)
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
    else:
        image_filename = data.get('image')

    new_item = FoundItem(
        user_id=uid,
        item_name=data['item_name'].strip(),
        category=data['category'].strip(),
        description=data.get('description', '').strip(),
        location=data['location'].strip(),
        date_found=date_found,
        image=image_filename,
        status=data.get('status', 'found').strip()
    )
    
    try:
        db.session.add(new_item)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500

    return jsonify({"msg": "Item reported", "item": new_item.to_dict()}), 201

@found_bp.route('', methods=['GET'])
@found_bp.route('/', methods=['GET'])
def get_items():
    category = request.args.get('category')
    location = request.args.get('location')
    status = request.args.get('status')
    
    query = FoundItem.query
    if category:
        query = query.filter_by(category=category)
    if location:
        query = query.filter(FoundItem.location.ilike(f"%{location}%"))
    if status:
        query = query.filter_by(status=status)
        
    return jsonify([i.to_dict() for i in query.all()])

@found_bp.route('/<int:item_id>', methods=['GET'])
def get_item(item_id):
    item = db.session.get(FoundItem, item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    return jsonify(item.to_dict()), 200

@found_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    item = db.session.get(FoundItem, item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404

    uid = int(get_jwt_identity())
    current_user = db.session.get(User, uid)
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    # Permission check: Owner or Admin
    if item.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({"error": "Permission denied"}), 403

    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
        image_file = request.files.get('image')
    else:
        data = request.json or {}
        image_file = None
    
    if 'item_name' in data:
        if not data['item_name'].strip():
            return jsonify({"error": "item_name cannot be empty"}), 400
        item.item_name = data['item_name'].strip()
        
    if 'category' in data:
        if not data['category'].strip():
            return jsonify({"error": "category cannot be empty"}), 400
        item.category = data['category'].strip()
        
    if 'location' in data:
        if not data['location'].strip():
            return jsonify({"error": "location cannot be empty"}), 400
        item.location = data['location'].strip()

    if 'description' in data:
        item.description = data['description'].strip()

    if 'date_found' in data:
        if data['date_found']:
            try:
                item.date_found = datetime.fromisoformat(data['date_found'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"error": "Invalid date_found format. Use ISO format."}), 400
        else:
            item.date_found = None

    # Handle multipart image file update if present
    if image_file:
        upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
        try:
            item.image = save_uploaded_image(image_file, upload_folder)
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
    elif 'image' in data:
        item.image = data['image']

    if 'status' in data:
        item.status = data['status'].strip()

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500

    return jsonify({"msg": "Item updated", "item": item.to_dict()}), 200

@found_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    item = db.session.get(FoundItem, item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404

    uid = int(get_jwt_identity())
    current_user = db.session.get(User, uid)
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    # Permission check: Owner or Admin
    if item.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({"error": "Permission denied"}), 403

    try:
        # Cascade delete is handled at ORM relationship level
        db.session.delete(item)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500

    return jsonify({"msg": "Item deleted"}), 200

@found_bp.route('/<int:item_id>/matches', methods=['GET'])
def get_found_matches(item_id):
    item = db.session.get(FoundItem, item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    
    matches = get_matches(item_id, 'found')
    
    for match in matches:
        lost_item = db.session.get(LostItem, match["matched_item_id"])
        if lost_item:
            notify_match_if_needed(lost_item, 'lost', item, 'found', match["confidence_score"])
            
    return jsonify(matches), 200
