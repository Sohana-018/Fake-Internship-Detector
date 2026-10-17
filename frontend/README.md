# 🛡️ Fake Internship & Job Scam Detector — Frontend

A modern, high-performance **React 19 + Vite** Single Page Application (SPA) designed for real-time recruitment fraud detection, forensic text profiling, threat telemetry, and machine learning benchmarking.

---

## 🎨 Design System & Color Palette

The interface features an executive dual-theme design system engineered for high readability and WCAG AAA compliance.

### Light Theme (Custom 4-Color Swatch)
| Band | Hue | Hex Code | Role |
| :--- | :--- | :--- | :--- |
| **Band 1** | Deep Royal Plum | `#601747` | **Primary Brand Tone** (`--primary`): Buttons, active navigation, key titles, focus rings |
| **Band 2** | Mulberry Rose | `#BE547A` | **Secondary Accent** (`--secondary`): Pill badges, secondary tags, chart data series |
| **Band 3** | Soft Blush Pink | `#EB9E9E` | **Subtle Accent** (`--accent`): Metric card borders, tag outlines |
| **Band 4** | Buttercream / Vanilla | `#FFECB9` | **Warm Canvas Glow** (`--cream`): Ambient radial background glow, card tint |

- **Body Background:** Warm Ivory Canvas (`#FAF7F2`) with subtle radial ambient glow.
- **Typography:** Ultra-deep Plum Charcoal (`#26081C`) providing **>16:1 contrast** (WCAG AAA).

### Dark Theme (Executive Obsidian)
- **Surfaces:** Deep Obsidian (`#0B0F19`) and elevated Slate cards (`#111827`).
- **Accents:** Cyber Indigo (`#6366F1`), Radar Sky (`#38BDF8`), Shield Emerald (`#34D399`), and Amber (`#FBBF24`).

---

## 🚀 Key Pages & Features

### 1. Home / Scanner Console (`/`)
- **Interactive Job Scanner:** Paste recruitment emails, messages, or job descriptions with live word/character counters.
- **Example Quick-Loader:** 1-click test drive with real-world sample scams and verified postings.
- **Side-by-Side Dual Analysis Grid:**
  - **Left:** **Detected Threat Indicators** (deduplicated rule matches: upfront fee extortion, personal email domains, off-platform WhatsApp/Telegram redirects, corporate spoofing).
  - **Right:** **Forensic Text Profile (2x2 Grid)** (Message Length, Vocabulary Diversity, Punctuation Urgency, Capitalization Density).
- **Security Advisory & 1-Click Escalate:** Quick flow to prefill and submit suspicious postings to the community database.
- **Cybersecurity Live Feed:** Real-time threat news pulled from The Hacker News RSS feed.

### 2. Threat Intelligence & Benchmark Lab (`/dashboard`)
Divided into two dedicated sub-navbar views:

#### 📊 Sub-Tab 1: Threat Telemetry & Trends
- **Executive Posture Strip:** High-level threat warning and target vector alerts.
- **Operational KPI Cards:** Total scans, Scam interceptions, Verified legitimate postings, Community submissions.
- **Visual Analytics (Recharts):**
  - **Chronological Volume Area Chart:** Dual area graph tracking verified vs. fraudulent listings over 7, 30, or 90 days.
  - **Threat Vector Donut Chart:** Categorization of tactics (Fee extortion, Phishing, Fake drives).
  - **Most Spoofed Brands:** Horizontal bar chart highlighting corporate targets (TCS, Wipro, Google, etc.).
- **Forensic Incident Log:** Paginated telemetry records (10 per page) with search, severity meters, and category filters.

#### 🤖 Sub-Tab 2: AI Model Architecture & Benchmark Lab
- **Stratified 80/20 Holdout Benchmark:** Real evaluation metrics trained on identical splits (18,880 records: 15,104 Train / 3,776 Test) without data leakage.
- **Empirical Model Comparison:**

| Algorithm | Test Accuracy | Precision (Fake) | Recall (Fake) | F1-Score (Fake) | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | **97.46%** | **77.06%** | **92.31%** 🏆 | **84.00%** | **Production Pipeline** |
| **Linear SVM** | **98.52%** | **88.34%** | **91.58%** | **89.93%** 🏆 | Candidate |
| **Random Forest** | **98.09%** | **99.51%** 🏆 | **73.99%** | **84.87%** | Candidate |
| **Multinomial Naive Bayes** | **95.02%** | **62.54%** | **77.66%** | **69.28%** | Baseline |

- **Interactive Confusion Matrix Visualizer:** Inspect True Positives, False Positives, True Negatives, False Negatives for any algorithm.
- **Class Imbalance Strategy:** Interactive visualizer illustrating raw 13:1 imbalance vs. mathematical loss-penalty balancing.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React 19 (Hooks, Functional Components) |
| **Bundler & Dev Server** | Vite 8 with Hot Module Replacement (HMR) |
| **Routing** | React Router DOM v7 |
| **Charts & Visualization** | Recharts (Responsive SVG Area, Bar, Pie charts) |
| **Styling** | Vanilla CSS (Scoped design tokens, CSS variables, Glassmorphism) |
| **Icons & Badges** | Native accessible Unicode glyphs & SVG accents |

---

## 💻 Development Commands

From the `frontend/` directory:

```bash
# Install dependencies
npm install

# Start Vite development server (hot-reload at http://localhost:5173)
npm run dev

# Compile optimized production bundle to frontend/dist/
npm run build

# Preview production build locally
npm run preview
```

> **Note:** During development, `npm run dev` automatically proxies backend API requests (`/predict`, `/report`, `/analytics`, `/export`) to the Flask server running on `http://127.0.0.1:5000`.
