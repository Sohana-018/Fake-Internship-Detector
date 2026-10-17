# 🕵️ Fake Internship & Job Scam Detector

A hybrid threat-detection web application that analyzes job descriptions and flags fraudulent internship or employment postings using **Machine Learning (NLP)** and **rule-based heuristics**.

> **Run locally:** The Flask backend serves the built React frontend directly on `http://localhost:5000` via `python web.py`.
> *(Live demo: coming soon)*

---

## 📸 Screenshots

| View | Preview | Description |
|---|---|---|
| **Scanner Form** | `![Scanner Form](docs/screenshots/home.png)` | Clean two-column workspace with job text input, sample presets, word counter, and one-click scam check. |
| **Verification Result** | `![Result](docs/screenshots/result.png)` | Likely genuine / likely scam verdict, scam risk meter, warning signs found, and expandable detection workflow. |
| **Scam Analytics & Model Lab** | `![Analytics & Benchmark](docs/screenshots/analytics.png)` | Aggregate scam reporting trends, brand impersonation frequencies, and empirical holdout benchmark metrics. |

> *To capture these screenshots:*
> 1. `docs/screenshots/home.png`: Run the application and capture the main scanner page before or during text entry.
> 2. `docs/screenshots/result.png`: Analyze a suspicious job posting (e.g., upfront fee or phishing example) and capture the generated result card showing warning signs, scam risk percentage, and expanded workflow.
> 3. `docs/screenshots/analytics.png`: Navigate to the Analytics tab (`/dashboard`) and capture the trend charts and Model Benchmark Lab table.

---

## 🧠 Project Overview

With the growth of remote internships and online hiring, employment scams have grown increasingly common. This project combines **Natural Language Processing (NLP)**, **Machine Learning**, and **regex-based heuristics** to provide an immediate preliminary screen for suspicious job postings. The system flags known warning patterns—such as campus drive phishing, upfront fee demands, off-platform communication (WhatsApp/Telegram), identity harvesting (Aadhaar/PAN), and suspicious redirect links—while computing an empirical risk probability score.

---

## 🚀 Core Features

- 🤖 **Hybrid ML Engine:** TF-IDF (unigrams + bigrams, 5,000 features) combined with 14 handcrafted forensic signals into a class-balanced Logistic Regression pipeline.
- 🚩 **Rule-Based Heuristics:** Pattern-matching rules that flag immediate high-risk signals (upfront fee extortion, WhatsApp/Telegram redirects, personal email domains for corporate brands, Aadhaar/PAN collection).
- 📊 **Scam Analytics Dashboard:** Interactive visualizations for scan and report frequency timelines, common scam vectors, and top spoofed company names, computed directly from the local SQLite database (with sample data fallback for demonstration).
- 🤖 **Benchmark & Model Comparison:** Empirical 80/20 holdout evaluation across Logistic Regression, Random Forest, Linear SVM, and Multinomial Naive Bayes.
- 🛡️ **Scam Tactics Guide:** Inline quick-reference checklist of the 5 most prevalent internship and employment scam tactics (upfront fees, off-platform messaging, premature ID requests, free webmail contact, artificial urgency).
- 📝 **Community Reporting & Audit Log:** Submits suspicious job postings and logs scan metadata to a local SQLite database with one-click CSV export *(Note: Community database is unmoderated)*.
- 🎨 **Responsive Dual-Theme UI:** React 19 single-page application supporting Light and Dark modes with verified color contrast.

---

## 🤖 ML Model Architecture & Pipeline

### Detection Pipeline (Workflow)

Every incoming job posting is evaluated through a 7-stage inspection pipeline tracked in real time:

1. **Input Received:** Validates character and word length bounds (up to 25,000 characters).
2. **Text Cleaning:** Normalizes surrounding whitespace and prepares canonical string representations for matching.
3. **Rule Checks:** Evaluates regex pattern heuristics (upfront fee extortion, WhatsApp/Telegram redirects, personal webmail contacts, Aadhaar/PAN collection, suspicious third-party redirect links).
4. **Feature Extraction:** Transforms text into 5,014 features using a `FeatureUnion` of 5,000 TF-IDF n-grams (unigrams + bigrams) and 14 domain-specific handcrafted forensic signals.
5. **Model Scoring (AI Core):** Infers scam probability using a class-balanced Logistic Regression classifier.
6. **Threshold Decision:** Evaluates the probability against the holdout-calibrated **0.50** decision threshold.
7. **Final Verdict:** Generates the composite risk score and applies heuristic overrides (e.g., 2+ critical red flags enforce a Fake verdict and elevate risk).

### Feature Extraction Pipeline

The classification engine uses a scikit-learn `Pipeline` that combines text representation and forensic engineering via `FeatureUnion`:

```
Input Text
    ↓
┌─────────────────────────────────┬─────────────────────────────────┐
│        TF-IDF Vectorizer        │       HandcraftedFeatures       │
│  (5,000 features, unigrams and  │   (14 binary/numeric forensic   │
│     bigrams, English stop-words)│       indicators from text)     │
└─────────────────────────────────┴─────────────────────────────────┘
    ↓ FeatureUnion (concatenated sparse feature matrix)
┌───────────────────────────────────────────────────────────────────┐
│          Logistic Regression (class_weight='balanced')            │
└───────────────────────────────────────────────────────────────────┘
    ↓
Scam probability score (0.0 to 1.0) → Decision Threshold (0.50) → Fake / Legitimate
```

### Classifier Configuration
| Parameter | Setting | Rationale |
|---|---|---|
| Algorithm | `LogisticRegression` (scikit-learn) | L2-regularized linear classification with continuous probability calibration |
| Class Weighting | `balanced` | Compensates for class imbalance in the training split |
| Max Iterations | 1,000 | Guarantees convergence on high-dimensional sparse representations |
| Decision Threshold | `0.50` | Standard unshifted threshold prioritizing scam recall (92.31%) |
| Serialized Artifact | `model_pipeline.pkl` | 242.9 KB (0.24 MB) lightweight runtime footprint |
| Inference Latency | ~6.6 ms per prediction | Measured average over 1,000 single predictions on CPU (p50: 6.3 ms, p95: 11.0 ms) |

### Handcrafted Forensic Features (14 Signals)
The custom transformer extracts 14 domain-specific signals:

| # | Feature | Detection Scope |
|---|---|---|
| 1 | Fee Keywords | `fee`, `deposit`, `registration`, `refundable` |
| 2 | Free Email Providers | `@gmail.com`, `@yahoo.com`, `@hotmail.com`, `@outlook.com` |
| 3 | Off-Platform Messaging | `whatsapp`, `telegram` |
| 4 | Identity Harvesting | `aadhaar`, `pan`, `bank account` |
| 5 | Urgency Keywords | `urgent`, `immediate`, `limited seats`, `limited vacancies` |
| 6 | Direct Hiring / No Screening | `no interview`, `direct joining` |
| 7 | Unrealistic Compensation Patterns | `₹`/`Rs` amounts paired with `lpa` or `per month` |
| 8 | Exclamation Mark Frequency | Raw count of `!` characters |
| 9 | Uppercase Character Ratio | Proportion of uppercase characters in text |
| 10 | Brand Spoofing via Free Mail | Tech brand names (Google, Amazon, TCS, etc.) paired with free email domains |
| 11 | Suspicious / Shortened Links | `bit.ly`, `forms.gle`, `talentsjobs`, `.xyz`, `.top`, `.click`, `.site` |
| 12 | Blanket Mass Eligibility | `all batches eligible`, `all branches eligible`, `all students eligible` |
| 13 | Campus Drive Phishing | Large IT services brands paired with unofficial campus hiring drive text |
| 14 | Call-to-Action Bait | `click here`, `apply now`, `completed profiles` |

---

## 📊 Dataset & Holdout Evaluation

### Dataset Composition
The combined corpus contains **18,880 records**:
- **EMSCAD Dataset:** 17,880 real-world postings from the [Kaggle Real or Fake Job Postings dataset](https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobpostings) (17,014 genuine, 866 fake / 4.84% positive rate).
- **Synthetic Indian Scam Dataset (`data/extra_india.csv`):** 1,000 AI-assisted, template-generated postings (500 fake, 500 genuine) simulating regional phishing templates (TCS/campus drive spoofing, data-entry registration fees, Telegram interviews).

### Train / Test Split
A strict 80/20 stratified holdout split was performed:
- **Training Set (80%):** 15,104 records (14,011 genuine, 1,093 fake — 14,321 EMSCAD, 783 Indian synthetic).
- **Test Set (20%):** 3,776 records (3,503 genuine, 273 fake — 3,559 EMSCAD, 217 Indian synthetic).
- Preprocessing (TF-IDF vectorizer and feature extractor) was fitted exclusively on the training split.

### Verification & Near-Duplicate Leakage Audit
An audit for exact and near-duplicate text overlap between the training and holdout test sets revealed:
1. **Exact string duplicates:** 533 test postings (14.12% of the test set) have an exact normalized text duplicate in the training set:
   - EMSCAD: 506 exact duplicates out of 3,559 test rows (14.22%).
   - Indian synthetic data: 27 exact duplicates out of 217 test rows (12.44%).
2. **High-similarity neighbors (TF-IDF cosine similarity >= 0.90):** 1,655 test postings (43.83% of the test set) have a training set neighbor with >= 0.90 similarity:
   - EMSCAD: 1,475 postings (41.44%).
   - Indian synthetic data: 180 postings (82.95%).
3. **Leakage in fake class:**
   - EMSCAD fake postings with similarity >= 0.90 in train: 79 / 162 (48.77%).
   - Indian synthetic fake postings with similarity >= 0.90 in train: 111 / 111 (100.00%). Because all 500 synthetic fake rows were generated from 9 structural templates, random splitting placed variants of every template on both sides.
4. **Impact of deduplication on benchmark:**
   - **Removing near-duplicates (similarity >= 0.90):** Reduces test set to 2,121 rows (2,038 genuine, 83 fake). All 111 Indian synthetic fakes are removed. Logistic Regression performance changes to: Recall: 75.90%, Precision: 52.94%, F1-Score: 62.38%, Accuracy: 96.42% (Baseline accuracy: 96.09%).
   - **Removing exact duplicates only (533 rows removed):** Reduces test set to 3,243 rows (3,006 genuine, 237 fake). Logistic Regression achieves: Recall: 91.14%, Precision: 76.87%, F1-Score: 83.40%, Accuracy: 97.35%.

### Threshold Audit
- **Metrics origin:** The numbers in `metrics.json` were produced using decision threshold **0.50** (`clf.predict()`).
- **Validation tuning:** An earlier script (`step34_train.py`) tuned the threshold directly on the holdout test split (`best_threshold.txt = 0.7`). When tuned properly on a 20% validation split carved strictly from the training data (3,021 validation records), the F1-maximizing threshold is **0.70** (Val F1: 85.23%; Test F1: 90.23%, Precision: 92.66%, Recall: 87.91%).
- **Operational decision:** In a fraud detection setting, missing a scam (false negative) is more detrimental than an extra warning (false positive). Threshold **0.50** is retained across production (`web.py`), the benchmark (`evaluate_models.py`), and `best_threshold.txt` because it achieves **92.31% fake-class recall** (missing only 21 out of 273 scams, compared to 33 missed at 0.70).

---

## 📈 Benchmark Results

### Primary Comparison (Holdout Test Set: 3,776 Postings)
Results are sorted to lead with **Fake-Class Recall and Precision**, rather than overall accuracy.

*Baseline accuracy (always predicting "Genuine"): **92.77%***

| Algorithm | Recall (Fake) | Precision (Fake) | F1-Score (Fake) | Overall Accuracy | Baseline Accuracy | Training Time |
|---|---|---|---|---|---|---|
| **Logistic Regression (Production)** | **92.31%** 🏆 | **77.06%** | **84.00%** | **97.46%** | 92.77% | ~592 ms |
| **Linear SVM** | **91.58%** | **88.34%** | **89.93%** 🏆 | **98.52%** | 92.77% | ~1,554 ms |
| **Random Forest (100 Trees)** | **73.99%** | **99.51%** 🏆 | **84.87%** | **98.09%** | 92.77% | ~1,839 ms |
| **Multinomial Naive Bayes** | **77.66%** | **62.54%** | **69.28%** | **95.02%** | 92.77% | ~16 ms |

### Confusion Matrix Breakdown (3,776 Test Records)
| Algorithm | True Negative (Genuine Clean) | False Positive (False Alarm) | False Negative (Missed Scam) | True Positive (Scam Caught) |
|---|---|---|---|---|
| **Logistic Regression** | 3,428 | 75 | **21** | **252 / 273 (92.31%)** |
| **Linear SVM** | 3,470 | 33 | 23 | 250 / 273 (91.58%) |
| **Random Forest** | 3,502 | **1** | 71 | 202 / 273 (73.99%) |
| **Multinomial Naive Bayes** | 3,376 | 127 | 61 | 212 / 273 (77.66%) |

### Data Slice Breakdown (EMSCAD Real-World vs. India Synthetic)
The holdout test set breaks down into two distinct sub-distributions:

| Data Slice | Records (Fake / Gen) | Baseline Acc | Model | Accuracy | Precision (Fake) | Recall (Fake) | F1-Score (Fake) |
|---|---|---|---|---|---|---|---|
| **EMSCAD Real-World** | 3,559 (162 / 3,397) | 95.45% | Logistic Regression | 97.30% | 65.28% | 87.04% | 74.60% |
| | | | Linear SVM | 98.43% | 80.81% | 85.80% | 83.23% |
| | | | Random Forest | 97.98% | 98.91% | 56.17% | 71.65% |
| | | | Multinomial NB | 96.40% | 60.12% | 62.35% | 61.21% |
| **India Synthetic (`data/extra_india.csv`)** | 217 (111 / 106) | 48.85% | Logistic Regression | 100.00% | 100.00% | 100.00% | 100.00% |
| | | | Linear SVM | 100.00% | 100.00% | 100.00% | 100.00% |
| | | | Random Forest | 100.00% | 100.00% | 100.00% | 100.00% |
| | | | Multinomial NB | 72.35% | 64.91% | 100.00% | 78.72% |

> **Production Choice Rationale:**
> **Linear SVM scored a higher F1-score (89.93%) and precision (88.34%) than Logistic Regression (84.00% F1, 77.06% precision).** However, **Logistic Regression was selected for production** due to two practical factors:
> 1. **Calibrated Continuous Probabilities:** Logistic Regression outputs true continuous probabilities via `predict_proba()`, which are required to populate the dynamic 0–100% risk meter and support threshold tuning. Linear SVM provides only uncalibrated hyperplane distances (`decision_function`).
> 2. **Higher Scam Recall:** Logistic Regression caught **92.31% of scams** (missing 21 threats), outperforming Linear SVM (91.58%, 23 missed) and Random Forest (73.99%, 71 missed). In threat screening, false negatives carry significantly more risk for job seekers than false alarms.

---

## ⚠️ Limitations

1. **Synthetic Data Overfitting:** The 1,000 Indian job samples (`data/extra_india.csv`) were generated using AI assistance from 16 fixed templates. Consequently, test-set performance on this slice is artificially high (100% precision and recall). Real-world Indian employment fraud will exhibit stylistic variations not captured by these templates.
2. **False Alarms (Precision):** On real-world postings from the EMSCAD dataset, Logistic Regression precision is 65.28% (75 false alarms across 3,559 test postings). Legitimate postings from early-stage startups using personal contact emails (e.g., `@gmail.com`) or urgent recruitment wording may be flagged.
3. **Unseen Scam Styles:** The model is trained on text content. It cannot detect fraud that occurs outside of text (e.g., voice-call interviews, phishing attachments in PDF/Word format, or malicious software installations).
4. **Heuristics Overlap with Genuine Postings:** Rule-based heuristics can match genuine job descriptions (e.g., companies explicitly stating "no application fee required" or "Aadhaar verification needed upon formal joining"). While regex rules use context boundaries, false triggers remain possible.
5. **Unmoderated Community Database:** User reports submitted through `/report` are stored directly in SQLite without prior human verification. The community database should be viewed as unmoderated crowdsourced data.

---

## 🎨 Color Palette & Accessibility

The application interface implements a dual-theme system defined in `frontend/src/styles/style.css`.

### Light Theme
- **Deep Royal Plum (`#601747`):** Primary interactive buttons and headers.
- **Mulberry Rose (`#BE547A`):** Secondary interactive accents and category tags.
- **Soft Blush Pink (`#EB9E9E`):** Delicate borders and highlight cards.
- **Buttercream Vanilla (`#FFECB9`):** Card highlight accents and warm glow.
- **Warm Ivory Canvas (`#FAF7F2`):** Primary background surface.
- **Plum Charcoal Text (`#26081C`):** High-contrast body typography.

### Dark Theme
- **Obsidian Dark (`#0B0F19`):** Application background.
- **Slate Gray Card (`#111827`):** Elevated card containers.
- **Cyber Indigo (`#6366F1`):** Primary accents and focus highlights.
- **Radar Sky (`#38BDF8`):** Secondary link and status accents.
- **Light Gray Text (`#F3F4F6`):** Primary typography.

### Calculated Contrast Ratios (WCAG 2.1)
Contrast ratios calculated using relative luminance:
- Plum Charcoal (`#26081C`) on Warm Ivory Canvas (`#FAF7F2`): **17.33:1** (Passes WCAG AAA)
- Plum Charcoal (`#26081C`) on Pure White (`#FFFFFF`): **18.52:1** (Passes WCAG AAA)
- Deep Plum (`#601747`) on Warm Ivory Canvas (`#FAF7F2`): **11.49:1** (Passes WCAG AAA)
- Plum Slate Muted Text (`#6E3858`) on Warm Ivory Canvas: **8.29:1** (Passes WCAG AAA)
- Dark Mode Text (`#F3F4F6`) on Obsidian (`#0B0F19`): **17.40:1** (Passes WCAG AAA)
- Dark Mode Muted Text (`#9CA3AF`) on Card (`#111827`): **6.99:1** (Passes WCAG AA; slightly below 7.0:1 AAA)
- Dark Mode Indigo (`#6366F1`) on Obsidian (`#0B0F19`): **4.29:1** (Used for non-text borders/badges; below AA 4.5:1 for body text)

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| **Backend** | Python 3, Flask, Flask-SQLAlchemy, SQLite |
| **ML & NLP** | scikit-learn (Logistic Regression, TF-IDF, FeatureUnion, Pipeline), Pandas, NumPy, Joblib |
| **Frontend** | React 19, Vite, React Router v7 |
| **Charts** | Recharts (Responsive Area, Pie, Bar charts) |
| **Styling** | Scoped CSS variables, responsive flex/grid layouts |

---

## 💻 How to Run Locally

### Prerequisites
- Python 3.9+
- Node.js 18+ (for building the frontend)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Fake-Internship-Detector.git
cd Fake-Internship-Detector
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 3. Build the frontend *(one-time setup)*
```bash
npm install --prefix frontend
npm run build
```

### 4. Start the application
```bash
python web.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser. The Flask server serves the compiled React single-page application.

---

### Development Mode (Hot-Reload)
Run the backend and frontend dev servers concurrently:

```bash
# Terminal 1: Backend API
python web.py

# Terminal 2: Vite Dev Server (hot-reload at http://localhost:5173)
npm run dev
```

---

## 🔌 API Reference

| Endpoint | Method | Rate Limit | Description |
|---|---|---|---|
| `POST /predict` | POST | 60 req/min | Primary analysis endpoint (max 25,000 chars) → returns prediction, risk score, flags, pipeline |
| `POST /report` | POST | 15 req/min | Submits a report to the unmoderated SQLite database (max 5,000 chars description) |
| `GET /analytics` | GET | None | Returns aggregated statistics from SQLite scan history & reports (supports `?days=7\|30`) |
| `GET /export` | GET | None | Exports stored community reports as CSV |
| `POST /api/v1/check-job` | POST | 60 req/min | Legacy alias for `/predict` (maintained for backward compatibility) |

---

## 🔮 Future Enhancements

- 🖼️ **Screenshot OCR:** Extract text from scam screenshots using an OCR engine.
- 📋 **Broader Pasted-Text Support:** Support more pasted-text sources (e.g. raw email headers, SMS text, Telegram/WhatsApp chat exports).
- 👤 **User Accounts:** Saved scan history and personalized scam report tracking.
- 🔔 **Alerts:** Automated email or desktop notifications for new local scam campaigns.
- 🧠 **Transformer Architecture:** Evaluate fine-tuned lightweight transformers (e.g., DistilBERT) with group-aware cross-validation.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
