# 🕵️ Fake Internship & Job Scam Detector

An intelligent, hybrid threat-detection web application that analyzes job descriptions and flags fraudulent internship or employment opportunities using Machine Learning and rule-based heuristics.

> **Live Demo:** The app runs fully from `python web.py` — no separate frontend server needed in production.

---

## 🧠 Project Overview

With the rise of remote work, employment scams have become increasingly sophisticated. This project combines **Natural Language Processing (NLP)**, **Machine Learning**, and **regex-based rule heuristics** to act as a first line of defense. By analyzing the text of a job posting, the system calculates a scam probability score and highlights specific red flags.

---

## 🚀 Core Features

- 🤖 **ML Engine:** TF-IDF + handcrafted features fed into a pipeline trained on the Kaggle fake job postings dataset (~92% accuracy)
- 🚩 **Rule-Based Heuristics:** Instant flagging of critical warning signs (upfront fees, WhatsApp/Telegram contact, Aadhaar/PAN requests, unrealistic pay)
- 📊 **Live Analytics Dashboard:** React-powered dashboard with Recharts visualizations — trends, scam categories, impersonated companies, recent detections
- 🗞️ **Threat News Feed:** Live cybersecurity news pulled from The Hacker News RSS feed
- 📝 **Community Reporting:** Submit verified scams to a local SQLite database
- 📤 **Export:** Download raw CSV or text summary of all reports
- 🌗 **Dark/Light Mode:** Full theme toggle with system-aware defaults
- 📱 **Responsive UI:** Mobile-friendly React frontend with smooth animations

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3, Flask, SQLAlchemy, SQLite |
| **ML & Data** | Scikit-Learn, Pandas, Joblib, NumPy |
| **Frontend** | React 19, Vite, React Router v7 |
| **Charts** | Recharts, Chart.js |
| **Styling** | Vanilla CSS (custom design system, dark/light themes) |

---

## 📁 Project Structure

```
fake_job_detection/
├── web.py                  # Flask backend — serves API + React frontend
├── features.py             # Custom sklearn transformer for handcrafted features
├── model_pipeline.pkl      # Trained ML pipeline (TF-IDF + handcrafted + classifier)
├── best_threshold.txt      # Optimal decision threshold from training
├── templates/              # Legacy Jinja2 templates (fallback if dist not built)
├── static/                 # Legacy static assets (fallback)
├── frontend/               # React frontend (Vite)
│   ├── src/
│   │   ├── pages/          # Home.jsx, Analytics.jsx
│   │   ├── components/     # Navbar, AnalyzeJobPanel, ReportScamPanel, etc.
│   │   ├── styles/         # CSS modules per component
│   │   ├── data/           # Mock data for analytics charts
│   │   └── api.js          # Fetch helpers with proxy support
│   └── vite.config.js      # Dev proxy → Flask on :5000
└── package.json            # Root scripts (npm run dev / build)
```

---

## 💻 How to Run Locally

### Prerequisites
- Python 3.9+
- Node.js 18+ (for development / rebuilding the frontend)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/Fake-Internship-Detector.git
cd Fake-Internship-Detector
```

### 2. Install Python dependencies
```bash
pip install flask flask-sqlalchemy pandas scikit-learn joblib numpy
```

### 3. Build the React frontend *(one-time setup)*
```bash
npm install --prefix frontend
npm run build        # runs vite build inside frontend/
```

### 4. Start the Flask server
```bash
python web.py
```
Open [http://localhost:5000](http://localhost:5000) — Flask serves the compiled React app.

---

### Development Mode (hot-reload)
Run both servers simultaneously:

```bash
# Terminal 1 — Flask backend
python web.py

# Terminal 2 — Vite dev server (hot-reload, proxies API to Flask)
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) for the hot-reloading dev frontend.

---

## 🔌 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `POST /predict` | POST | Analyze job text → returns prediction, risk score, flags |
| `POST /report` | POST | Submit a scam report to the database |
| `GET /analytics` | GET | Aggregated stats (supports `?days=7\|30\|90`) |
| `GET /export` | GET | Download all reports as CSV |
| `GET /export-summary` | GET | Download a plain-text summary report |
| `POST /api/v1/check-job` | POST | Programmatic API (accepts `job_description`) |

---

## 🔮 Future Enhancements

- 🖼️ **Screenshot OCR:** Cloud Vision API to extract text from scam screenshots
- 🔗 **URL Scraping:** Paste a LinkedIn/Indeed URL to auto-fetch and scan the description
- 👤 **User Accounts:** Personal scan history and report tracking
- 🔔 **Alerts:** Email/browser notifications for high-risk scam patterns

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).