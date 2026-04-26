# 🕵️‍♀️ Fake Internship & Job Scam Detector

An intelligent, hybrid threat-detection web application designed to analyze job descriptions and flag fraudulent internship or employment opportunities. 

## 🧠 Project Overview
With the rise of remote work, employment scams have become increasingly sophisticated. This project leverages Natural Language Processing (NLP) and Machine Learning to act as a first line of defense. By analyzing the text of job postings, the system calculates a scam probability score and highlights specific red flags (like upfront fees or suspicious redirect links).

## 🚀 Core Features
* **Machine Learning Engine:** Utilizes TF-IDF vectorization and a Logistic Regression model to classify text, achieving an accuracy of ~92% on testing data.
* **Rule-Based Heuristics:** Employs Regex pattern matching to instantly flag critical warning signs (e.g., WhatsApp/Telegram numbers, "Newbie Bonuses").
* **Live Analytics Dashboard:** An interactive SQLite-backed dashboard using Chart.js to visualize threat reports by timeframe, company, and scam type.
* **Interactive Web Interface:** A clean, responsive frontend built with HTML/CSS and Vanilla JavaScript, connected to a Python backend.

## 🛠️ Technology Stack
* **Backend:** Python, Flask, SQLite3, SQLAlchemy
* **Machine Learning & Data:** Scikit-Learn, Pandas, Joblib (TF-IDF, Logistic Regression)
* **Frontend:** HTML5, CSS3, JavaScript, Chart.js

## 🔮 Future Scope & Enhancements
* **Cloud-Based Vision API:** Transitioning from local Tesseract OCR to a cloud-based Vision API (like Google Cloud Vision) to reliably extract text from dark-mode mobile screenshots of scam messages.
* **Web Scraping Integration:** Allowing users to simply paste a LinkedIn or Indeed URL to automatically fetch and scan the job description.
* **User Authentication:** Creating user profiles to track personal scam reporting history.

## 💻 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/Fake-Internship-Detector.git](https://github.com/YOUR_USERNAME/Fake-Internship-Detector.git)
   cd Fake-Internship-Detector