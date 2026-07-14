from flask import Blueprint, request, jsonify
from datetime import datetime
from models import LostItem, FoundItem

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['GET'])
@search_bp.route('', methods=['GET'])
def search_items():
    category = request.args.get('category')
    item = request.args.get('item')
    location = request.args.get('location')
    date_str = request.args.get('date')

    # Date parsing & validation
    parsed_date = None
    if date_str:
        try:
            parsed_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Build lost items query
    lost_query = LostItem.query
    if category:
        lost_query = lost_query.filter(LostItem.category.ilike(f"%{category.strip()}%"))
    if item:
        lost_query = lost_query.filter(
            (LostItem.item_name.ilike(f"%{item.strip()}%")) | 
            (LostItem.description.ilike(f"%{item.strip()}%"))
        )
    if location:
        lost_query = lost_query.filter(LostItem.location.ilike(f"%{location.strip()}%"))
    
    # Build found items query
    found_query = FoundItem.query
    if category:
        found_query = found_query.filter(FoundItem.category.ilike(f"%{category.strip()}%"))
    if item:
        found_query = found_query.filter(
            (FoundItem.item_name.ilike(f"%{item.strip()}%")) | 
            (FoundItem.description.ilike(f"%{item.strip()}%"))
        )
    if location:
        found_query = found_query.filter(FoundItem.location.ilike(f"%{location.strip()}%"))

    lost_results = lost_query.all()
    found_results = found_query.all()

    # Filter by date matching date part of DateTime
    if parsed_date:
        lost_results = [r for r in lost_results if r.date_lost and r.date_lost.date() == parsed_date]
        found_results = [r for r in found_results if r.date_found and r.date_found.date() == parsed_date]

    # Format output
    combined = []
    for r in lost_results:
        combined.append(dict(r.to_dict(), item_type='lost'))
    for r in found_results:
        combined.append(dict(r.to_dict(), item_type='found'))

    return jsonify(combined), 200
