import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename):
    allowed = current_app.config.get("ALLOWED_EXTENSIONS", {'png', 'jpg', 'jpeg', 'webp'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed

def save_uploaded_image(file_storage, upload_folder):
    """
    Saves an uploaded file to the upload_folder after sanitizing and checking extension.
    Returns the unique saved filename.
    """
    if not file_storage or file_storage.filename == '':
        return None

    if not allowed_file(file_storage.filename):
        raise ValueError("Invalid file extension. Allowed: png, jpg, jpeg, webp.")

    # Check file size
    max_length = current_app.config.get("MAX_CONTENT_LENGTH", 5 * 1024 * 1024)
    file_storage.seek(0, os.SEEK_END)
    size = file_storage.tell()
    file_storage.seek(0) # Reset stream position

    if size > max_length:
        raise ValueError(f"File size exceeds limit of {max_length} bytes.")

    ext = file_storage.filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    
    os.makedirs(upload_folder, exist_ok=True)
    save_path = os.path.join(upload_folder, unique_name)
    file_storage.save(save_path)
    
    return unique_name
