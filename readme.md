# 🎓 Campus Lost & Found

A comprehensive, AI-powered web-based Lost & Found Management System designed for educational institutions. This system streamlines the recovery of lost items by combining user-reported data with automated AI-assisted matching and email notifications.

---

## 🚀 Features

* **User Management:** Secure registration, login, and profile management using JWT authentication.
* **Item Reporting:** Full CRUD operations for both "Lost" and "Found" items with image upload support.
* **Smart Search:** Unified search functionality with filters (category, item name, date, location).
* **AI-Assisted Matching:**
* Image embedding extraction using PyTorch.
* Metadata similarity analysis (text/category/date).
* Weighted confidence scoring for ranked matches.


* **Automated Notifications:** Email alerts triggered by high-confidence matches via Flask-Mail.
* **AI Parser:** Free-text parsing to extract structured data (category, item, location, date).
* **Admin Dashboard:** Centralized moderation to manage reports and user roles.

---

## 🛠️ Project Architecture

```text
campus-lost-found/
├── backend/            # Flask API, AI logic, and Database
└── frontend/           # React + Vite dashboard

```

---

## 📋 Getting Started

### Prerequisites

* **Python 3.10+**
* **Node.js 18+**
* **Git**

### 1. Setup the Backend

The backend manages authentication, AI similarity matching, and storage.

1. **Clone and navigate:**
```bash
git clone <repository-url>
cd campus-lost-found

```


2. **Setup virtual environment:**
* **Windows:**
```bash
python -m venv venv
venv\Scripts\activate

```


* **macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate

```




3. **Install dependencies:**
```bash
pip install -r backend/requirements.txt

```


*(Note: This includes `torch` and `torchvision` for AI features.)*
4. **Configure:**
Create a `.env` file in the `backend/` directory by copying `backend/.env.example` and filling in your SMTP and security settings.
5. **Run the API:**
```bash
cd backend
python app.py

```


*The server will start at `[http://127.0.0.1:5000](http://127.0.0.1:5000)`.*

---

### 2. Setup the Frontend

The frontend provides a modern, dark-themed user interface.

1. **Navigate to frontend:**
```bash
cd ../frontend

```


2. **Install dependencies:**
```bash
npm install

```


3. **Launch the development server:**
```bash
npm run dev

```


*Access the dashboard via the URL provided (usually `http://localhost:5173`).*

---

## 🧪 Testing

Ensure your virtual environment is active, navigate to `backend/`, and run the test suite to verify system integrity:

* `python test_phase1_alignment.py` (Database & CRUD)
* `python test_matcher.py` (Match heuristics)
* `python test_ai_pipeline.py` (AI embedding extraction)
* `python test_notifications.py` (Email dispatchers)

---

## ⚙️ API Overview

| Feature | Endpoint | Method |
| --- | --- | --- |
| **Auth** | `/auth/login`, `/auth/register` | `POST` |
| **Reports** | `/lost` / `/found` | `GET`, `POST`, `PUT`, `DELETE` |
| **Matches** | `/<type>/<id>/matches` | `GET` |
| **AI Parsing** | `/ai/parse` | `POST` |
| **Admin** | `/admin/reports`, `/admin/users` | `GET`, `PUT`, `DELETE` |

*For protected endpoints, include the header: `Authorization: Bearer <JWT_TOKEN>*`

---

## 📜 License

Developed for educational purposes.
