from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, LostItem, FoundItem, ItemEmbedding

admin_bp = Blueprint('admin', __name__)

def require_admin(current_user_id):
    current_user = db.session.get(User, current_user_id)
    if not current_user or current_user.role != 'admin':
        return None, (jsonify({"error": "Admin privilege required"}), 403)
    return current_user, None

@admin_bp.route('/reports', methods=['GET'])
@jwt_required()
def get_all_reports():
    uid = int(get_jwt_identity())
    current_admin, err_resp = require_admin(uid)
    if err_resp:
        return err_resp

    lost_reports = [dict(r.to_dict(), item_type='lost') for r in LostItem.query.all()]
    found_reports = [dict(r.to_dict(), item_type='found') for r in FoundItem.query.all()]
    
    return jsonify({
        "lost": lost_reports,
        "found": found_reports,
        "total_lost": len(lost_reports),
        "total_found": len(found_reports)
    }), 200

@admin_bp.route('/reports/<string:item_type>/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_report(item_type, item_id):
    uid = int(get_jwt_identity())
    current_admin, err_resp = require_admin(uid)
    if err_resp:
        return err_resp

    if item_type == 'lost':
        item = db.session.get(LostItem, item_id)
    elif item_type == 'found':
        item = db.session.get(FoundItem, item_id)
    else:
        return jsonify({"error": "Invalid item type. Must be 'lost' or 'found'"}), 400

    if not item:
        return jsonify({"error": "Report not found"}), 404

    try:
        # Cascade delete is handled at ORM relationship level or we can delete manually
        # Delete item embedding if exists
        ItemEmbedding.query.filter_by(item_id=item_id, item_type=item_type).delete()
        db.session.delete(item)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500

    return jsonify({"msg": f"Report of type '{item_type}' with ID {item_id} removed by admin"}), 200

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    uid = int(get_jwt_identity())
    current_admin, err_resp = require_admin(uid)
    if err_resp:
        return err_resp

    users = User.query.all()
    user_list = []
    for u in users:
        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return jsonify(user_list), 200

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    uid = int(get_jwt_identity())
    current_admin, err_resp = require_admin(uid)
    if err_resp:
        return err_resp

    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    new_role = data.get('role', '').strip().lower()
    if new_role not in ['user', 'admin']:
        return jsonify({"error": "Invalid role. Must be 'user' or 'admin'"}), 400

    # Self-demotion check
    if target_user.id == current_admin.id:
        return jsonify({"error": "Cannot demote yourself to prevent self-lockout."}), 400

    # Last admin check if demoting an admin to user
    if target_user.role == 'admin' and new_role == 'user':
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            return jsonify({"error": "Cannot demote the last admin."}), 400

    target_user.role = new_role
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500

    return jsonify({
        "msg": "User role updated successfully",
        "user": {
            "id": target_user.id,
            "name": target_user.name,
            "role": target_user.role
        }
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    uid = int(get_jwt_identity())
    current_admin, err_resp = require_admin(uid)
    if err_resp:
        return err_resp

    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    # Self-deletion check
    if target_user.id == current_admin.id:
        return jsonify({"error": "Cannot delete yourself."}), 400

    # Last admin check if deleting an admin
    if target_user.role == 'admin':
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            return jsonify({"error": "Cannot delete the last admin."}), 400

    try:
        db.session.delete(target_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500

    return jsonify({"msg": f"User with ID {user_id} deleted successfully by admin"}), 200
