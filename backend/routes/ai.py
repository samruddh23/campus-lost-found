import re
from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/parse', methods=['POST'])
def parse_report():
    data = request.json or {}
    text = data.get('text', '').strip()
    
    if not text:
        return jsonify({"error": "Missing or empty text field"}), 400

    # Rule-based field extraction
    # 1. Category extraction (matching common institutional categories)
    categories = ['wallet', 'phone', 'keys', 'card', 'laptop', 'bottle', 'umbrella', 'bag', 'watch', 'book', 'calculator']
    category = "Other"
    for cat in categories:
        if cat in text.lower():
            category = cat.title()
            break

    # 2. Item Name extraction
    item_name = "Unknown Item"
    # Matches patterns like "lost a black wallet" or "found keys"
    name_match = re.search(r'(?:lost|found)(?:\s+a|\s+an)?\s+([a-zA-Z0-9\s]+?)(?:\s+at|\s+in|\s+near|\s+on|\s+yesterday|\s+today|\.|$)', text, re.IGNORECASE)
    if name_match:
        item_name = name_match.group(1).strip().title()
    else:
        # Fallback: take the first 4 words of the text
        words = text.split()
        if words:
            item_name = " ".join(words[:4]).strip().title()

    # 3. Location extraction
    location = "Unknown Location"
    loc_match = re.search(r'(?:at|in|near|outside|inside|on)\s+([a-zA-Z0-9\s]+?)(?:\s+yesterday|\s+today|\.|$)', text, re.IGNORECASE)
    if loc_match:
        location = loc_match.group(1).strip()
        # Strip common leading article
        if location.lower().startswith("the "):
            location = location[4:]
        location = location.strip().title()

    # 4. Date extraction
    date_str = None
    if "yesterday" in text.lower():
        date_str = (date.today() - timedelta(days=1)).isoformat()
    elif "today" in text.lower():
        date_str = date.today().isoformat()
    else:
        # Search for dates formatted as YYYY-MM-DD or DD-MM-YYYY (or with slashes)
        date_match = re.search(r'(\d{4}[-/]\d{2}[-/]\d{2})|(\d{2}[-/]\d{2}[-/]\d{4})', text)
        if date_match:
            date_str = date_match.group(0)
        else:
            # Default to today if no date specified
            date_str = date.today().isoformat()

    return jsonify({
        "item_name": item_name,
        "category": category,
        "location": location,
        "date": date_str
    }), 200
