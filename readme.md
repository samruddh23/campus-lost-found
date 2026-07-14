# Campus Lost & Found

A web-based Lost & Found Management System for educational institutions.  
Students can report lost/found items, search reports, and receive AI-assisted match suggestions.  
Admins can manage users and moderate reports from a centralized backend.

---

## Current Status

✅ **Phase 1 Complete** (Core backend: auth, CRUD, search, admin, uploads)  
✅ **Phase 2 Complete** (AI matching, confidence scoring, notifications, parser)  
🛠️ **Phase 3 Planned** (React frontend)

---

## Project Architecture

```text
campus-lost-found/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── models/
│   ├── routes/
│   ├── ai/
│   ├── utils/
│   ├── uploads/
│   └── database.db
│
└── frontend/   (planned)
```

---

## Backend Tech Stack

- Python
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Flask-Mail
- Werkzeug
- Pillow
- SQLite (current; MySQL-ready later)

---

## Implemented Features

### Authentication & User
- Register
- Login
- Get profile
- Update profile (`PUT /profile` and `/auth/profile`)
- JWT-protected endpoints

### Lost & Found Reports
- Create, list, retrieve, update, delete lost items
- Create, list, retrieve, update, delete found items
- Owner/admin authorization checks
- Image upload support (multipart form-data + backward-compatible image string handling)

### Search
- Unified `GET /search` endpoint
- Filters supported (combinable):
  - `category`
  - `item`
  - `date` (`YYYY-MM-DD`)
  - `location`

### Admin
- View all reports
- Remove fake reports
- Manage users (list, role update, delete with safety checks)

### AI Matching (Phase 2)
- Image embeddings (pretrained model pipeline)
- Metadata similarity (text/category/date)
- Weighted confidence scoring
- Ranked match outputs
- Endpoints:
  - `GET /lost/<id>/matches`
  - `GET /found/<id>/matches`
- Graceful metadata-only fallback when embeddings are unavailable

### Email Notifications (Phase 2)
- Threshold-based match notifications
- Flask-Mail integration
- SMTP failure-safe behavior (API does not crash)
- DB-backed deduplication to prevent repeated notifications

### AI Parser (Phase 2)
- Free-text report parsing endpoint:
  - `POST /ai/parse`
- Returns structured fields:
  - `item_name`, `category`, `location`, `date`

---

## API Overview

## Auth
- `POST /register` (alias for `/auth/register`)
- `POST /login` (alias for `/auth/login`)
- `GET /profile` (alias for `/auth/profile`)
- `PUT /profile` (alias for `/auth/profile`)

## Lost
- `POST /lost`
- `GET /lost`
- `GET /lost/<id>`
- `PUT /lost/<id>`
- `DELETE /lost/<id>`
- `GET /lost/<id>/matches`

## Found
- `POST /found`
- `GET /found`
- `GET /found/<id>`
- `PUT /found/<id>`
- `DELETE /found/<id>`
- `GET /found/<id>/matches`

## Search
- `GET /search?category=...&item=...&date=YYYY-MM-DD&location=...`

## Admin
- `GET /admin/reports`
- `DELETE /admin/reports/<item_type>/<item_id>`
- `GET /admin/users`
- `PUT /admin/users/<user_id>/role`
- `DELETE /admin/users/<user_id>`

## AI
- `POST /ai/parse`

---

## Getting Started

### Prerequisites
- Python 3.10+
- Git

### Clone
```bash
git clone <repository-url>
cd campus-lost-found
```

### Virtual Environment
```bash
python -m venv venv
```

Linux/macOS:
```bash
source venv/bin/activate
```

Windows:
```cmd
venv\Scripts\activate
```

### Install Dependencies
```bash
pip install -r backend/requirements.txt
```

---

## Configuration

Create `backend/.env`:

```env
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
DATABASE_URI=sqlite:///database.db
FLASK_DEBUG=false

# Upload settings
MAX_CONTENT_LENGTH=5242880

# Mail settings
MAIL_SERVER=smtp.example.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=your_email_username
MAIL_PASSWORD=your_email_password
MAIL_DEFAULT_SENDER=noreply@campus.edu

# Notification settings
MATCH_NOTIFY_THRESHOLD=75.0
```

---

## Run the Backend

```bash
cd backend
python app.py
```

Base URL:
```text
http://127.0.0.1:5000
```

---

## Authentication Header

For protected endpoints:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Testing

From `backend/` directory:

```bash
python test_phase1_alignment.py
python test_matcher.py
python test_ai_pipeline.py
python test_notifications.py
```

---

## Notes

- SQLite is used by default for development.
- Project is modular and prepared for frontend integration (Phase 3).
- MySQL migration can be added later without major API changes.

---

## License

Developed for educational purposes.