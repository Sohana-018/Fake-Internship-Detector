# 🕵️ Fake Internship & Job Scam Detector

An intelligent, hybrid threat-detection web application that analyzes job descriptions and flags fraudulent internship or employment opportunities using **Machine Learning** and **rule-based heuristics**.

> **Live Demo:** The app runs fully from `python web.py` — no separate frontend server needed in production.

---

## 🧠 Project Overview

With the rise of remote work, employment scams have become increasingly sophisticated. This project combines **Natural Language Processing (NLP)**, **Machine Learning**, and **regex-based rule heuristics** to act as a first line of defense. By analyzing the text of a job posting, the system calculates a scam probability score and highlights specific red flags — including TCS/campus phishing drives, upfront fee extortion, redirect tracking links, and identity harvesting attacks.

---

## 🚀 Core Features

- 🤖 **Hybrid ML Engine:** TF-IDF (unigrams + bigrams) + 14 handcrafted forensic features fed into a class-balanced Logistic Regression pipeline (~97.5% test accuracy)
- 🚩 **Rule-Based Heuristics:** Instant flagging of critical warning signs — upfront fees, WhatsApp/Telegram contact, Aadhaar/PAN requests, corporate brand spoofing, redirect trackers
- 🔬 **Forensic Text Profile (Informational):** Real-time linguistic stylistics — Word & character count, Vocabulary diversity (lexical richness), Punctuation urgency, and Capitalization density
- 📊 **Live Threat Intelligence Dashboard:** Interactive Recharts visualizations — timeline volume, threat vectors donut, and most spoofed corporate brands
- 🤖 **AI Model Architecture & Benchmark Lab:** Stratified 80/20 holdout evaluation comparing Logistic Regression, Random Forest, Linear SVM, and Multinomial Naive Bayes with interactive confusion matrices
- 🗞️ **Threat News Feed:** Live cybersecurity news pulled from The Hacker News RSS feed
- 📝 **Community Reporting:** Submit verified scams to a local SQLite database with CSV and TXT summary export
- 🎨 **Executive Dual-Theme Design:** Custom 4-color palette swatch for Light Theme (`#601747` Plum, `#BE547A` Rose, `#EB9E9E` Blush, `#FFECB9` Vanilla) and Obsidian Dark Mode
- 📱 **Responsive UI:** Modern React 19 + Vite single page application with glassmorphic cards and WCAG AAA contrast

---

## 🤖 ML Model Details

### Architecture: Hybrid Feature Pipeline

The core ML engine is a **scikit-learn Pipeline** combining two feature extractors via `FeatureUnion`, fed into a **Logistic Regression** classifier:

```
Input Text
    ↓
┌──────────────────────┬──────────────────────────┐
│   TF-IDF Vectorizer  │   HandcraftedFeatures     │
│  (5000 features,     │  (14 binary/numeric       │
│   unigrams+bigrams)  │   forensic signals)       │
└──────────────────────┴──────────────────────────┘
    ↓ FeatureUnion (concatenated sparse matrix)
┌─────────────────────────────────────────────────┐
│     Logistic Regression (class_weight=balanced) │
└─────────────────────────────────────────────────┘
    ↓
Scam probability score → threshold → Fake / Genuine
```

### Classifier: Logistic Regression
| Parameter | Value |
|---|---|
| Algorithm | `LogisticRegression` (scikit-learn) |
| Class weighting | `balanced` (handles dataset imbalance) |
| Max iterations | 1000 |
| Decision threshold | Tuned on validation set (F1-optimized, ~0.35–0.55 range) |
| Serialization | `joblib` → `model_pipeline.pkl` |

### Text Features: TF-IDF Vectorizer
| Parameter | Value |
|---|---|
| Max features | 5,000 |
| N-gram range | (1, 2) — unigrams + bigrams |
| Stop words | English |

### Handcrafted Forensic Features (14 signals)
These regex-based binary/numeric features capture India-specific scam patterns:

| # | Feature | What it detects |
|---|---|---|
| 1 | Fee keywords | `fee`, `deposit`, `registration`, `refundable` |
| 2 | Personal email domains | `@gmail`, `@yahoo`, `@hotmail`, `@outlook` |
| 3 | Off-platform contact | `whatsapp`, `telegram` |
| 4 | Identity harvesting | `aadhaar`, `pan`, `bank account` |
| 5 | Urgency count | `urgent`, `limited seats`, `limited vacancies`, etc. |
| 6 | No screening | `no interview`, `direct joining` |
| 7 | Unrealistic pay | ₹ amounts with `lpa` / `per month` patterns |
| 8 | Exclamation mark count | Raw count of `!` in text |
| 9 | CAPS ratio | Proportion of uppercase characters |
| 10 | Corporate email spoofing | e.g. `TCS / Google` + `@gmail.com` combo |
| 11 | Redirect/tracking URLs | `bit.ly`, `forms.gle`, `talentsjobs`, `.xyz`, `.top`, `.click`, etc. |
| 12 | Mass-eligibility phrasing | `all branches eligible`, `all batches`, `all eligible` |
| 13 | Campus drive phishing | TCS/Infosys/Wipro + `hiring drive` / `campus drive` pattern |
| 14 | CTA scam phrases | `click here`, `apply now`, `limited vacancies`, `completed profiles` |

### Dataset
- **Primary:** [Kaggle — Real or Fake Job Postings](https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobpostings) (~18,000 rows)
- **Secondary:** Custom `data/extra_india.csv` — India-specific scam samples (TCS phishing drives, fee-trap data entry posts, campus drive fraud)
- Both datasets combined and trained on full data after threshold tuning

### Training & Threshold Optimization
The decision threshold is tuned (not fixed at 0.5) to maximize **F1-score** on a held-out validation set (20% split, stratified). The best threshold is saved to `best_threshold.txt` and loaded at runtime by the Flask server.

```
Threshold sweep: 0.30 → 0.80 (step 0.05)
Metric optimized: F1-score on validation set
Final performance: 97.46% accuracy, 92.31% recall (fake class), F1-score 84.00%
```

---

## 🔬 Forensic Linguistic & Stylistic Text Profiling (Phase 1)

In addition to classifying scam probability, the system performs real-time forensic linguistic analysis across 4 structural dimensions. These signals are strictly **informational** — they provide transparent explainability without distorting the model's objective probability:

| Indicator | Metric Extracted | Forensic Meaning |
|---|---|---|
| 📝 **Message Length** | Word & char count, avg word length | Phishing emails are often abruptly short (<30 words) or artificially verbose |
| 🔤 **Vocabulary Diversity** | Type-Token Ratio (TTR % unique words) | High diversity reflects authentic job scopes; low diversity signals repetitive spam |
| ⚡ **Punctuation Urgency** | Exclamation (`!`) & question marks (`?`) | Fraudulent drives over-rely on urgency punctuation (`Apply Now!!! Direct Joining!`) |
| 🔠 **Capitalization Density** | Proportion of uppercase characters (%) | High casing signals aggressive, non-standard corporate communication |

---

## 🤖 AI Model Architecture & Benchmark Lab (Phase 3)

The project includes an empirical benchmark suite ([evaluate_models.py](file:///c:/Users/Sohana/OneDrive/Desktop/fake_job_detection/evaluate_models.py)) trained and evaluated on a combined corpus of **18,880 postings**. 

### Holdout Evaluation Integrity
- **Split:** Strict 80/20 stratified holdout split (15,104 Train / 3,776 Test).
- **Zero Leakage:** Preprocessing (TF-IDF 5,000 unigrams + bigrams + 14 handcrafted features) and class-balancing were strictly isolated to the training split.
- **Test Set Composition:** 3,503 Genuine postings (92.77%) and 273 Fake postings (7.23%).

### Model Performance Comparison (Fake Class Metrics)

| Algorithm | Overall Accuracy | Precision (Fake) | Recall (Fake) | F1-Score (Fake) | Train Latency |
|---|---|---|---|---|---|
| **Logistic Regression (Production)** | **97.46%** | **77.06%** | **92.31%** 🏆 | **84.00%** | **537 ms** |
| **Linear SVM** | **98.52%** | **88.34%** | **91.58%** | **89.93%** 🏆 | **933 ms** |
| **Random Forest (100 Trees)** | **98.09%** | **99.51%** 🏆 | **73.99%** | **84.87%** | **1,384 ms** |
| **Multinomial Naive Bayes** | **95.02%** | **62.54%** | **77.66%** | **69.28%** | **13 ms** |

### Confusion Matrix Breakdown (3,776 Test Records)

| Algorithm | True Negative (Genuine Clean) | False Positive (False Alarm) | False Negative (Missed Scam) | True Positive (Scam Caught) |
|---|---|---|---|---|
| **Logistic Regression** | **3,428** | 75 | **21** | **252 / 273 (92.3%)** |
| **Linear SVM** | 3,470 | 33 | 23 | 250 / 273 (91.6%) |
| **Random Forest** | 3,502 | **1** | 71 | 202 / 273 (74.0%) |
| **Multinomial Naive Bayes** | 3,376 | 127 | 61 | 212 / 273 (77.7%) |

> **Production Choice Rationale:** **Logistic Regression** is chosen for production because it outputs continuous, well-calibrated probabilities (`predict_proba`) essential for granular threat risk meters (0–100%) and achieves the **highest recall on scams (92.31%, missing only 21 out of 273 threats)**. While Linear SVM achieves higher overall F1-score (89.93%), it lacks native probabilistic outputs; Random Forest demonstrates near-zero false alarms (99.5% precision) but misses 71 real scam postings.

---

## 🎨 Design System & Color Palette

The interface features an executive dual-theme design system engineered for accessibility and visual elegance:

### Light Theme (Custom 4-Color Swatch)
- **Band 1 — Deep Royal Plum (`#601747`):** Primary interactive buttons, navigation indicators, key titles.
- **Band 2 — Mulberry Rose (`#BE547A`):** Secondary interactive accents, tags, chart vectors.
- **Band 3 — Soft Blush Pink (`#EB9E9E`):** Delicate borders, metric badges, highlight cards.
- **Band 4 — Buttercream Vanilla (`#FFECB9`):** Ambient background canvas glow, warm card tints.
- **Typography:** Ultra-deep Plum Charcoal (`#26081C`) with **>16:1 WCAG AAA** contrast.

### Dark Theme (Executive Obsidian)
- Deep Obsidian background (`#0B0F19`), Slate-900 elevated cards (`#111827`), Cyber Indigo (`#6366F1`), and Radar Sky (`#38BDF8`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3, Flask, SQLAlchemy, SQLite, BeautifulSoup4 |
| **ML & NLP** | Scikit-Learn (Logistic Regression, TF-IDF, Pipeline, FeatureUnion), Pandas, NumPy, Joblib |
| **Frontend** | React 19, Vite, React Router v7 |
| **Charts** | Recharts (Responsive Area, Pie, Bar charts) |
| **Styling** | Vanilla CSS (Scoped design tokens, CSS variables, Glassmorphism) |

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
pip install flask flask-sqlalchemy pandas scikit-learn joblib numpy imbalanced-learn
```

### 3. Build the React frontend *(one-time setup)*
```bash
npm install --prefix frontend
npm run build
```

### 4. Start the Flask server
```bash
python web.py
```
Open [http://localhost:5000](http://localhost:5000) — Flask serves the compiled React app directly.

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

### Retraining the Model
```bash
python step34_train.py
```
This will retrain on `job_data.csv` + `data/extra_india.csv`, tune the decision threshold, and overwrite `model_pipeline.pkl` and `best_threshold.txt`.

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
- 🧠 **Upgrade to Transformer:** Fine-tune DistilBERT or BERT on the combined dataset for higher accuracy

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
