from flask import Flask, request, jsonify, Response, send_from_directory
import joblib
import re
from flask_sqlalchemy import SQLAlchemy
import io
import csv
import pandas as pd
from datetime import datetime, timedelta
import os
import json

# Import for joblib to successfully load custom transformer
from features import HandcraftedFeatures

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
else:
    app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///reports.db"
db = SQLAlchemy(app)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = Response()
        res.headers["Access-Control-Allow-Origin"] = "*"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return res

# Load improved AI model and threshold
model_pipeline = None
threshold = 0.5

def get_model_and_threshold():
    global model_pipeline, threshold
    try:
        if os.path.exists("best_threshold.txt"):
            with open("best_threshold.txt", "r") as f:
                threshold = float(f.read().strip())
        if model_pipeline is None and os.path.exists("model_pipeline.pkl"):
            model_pipeline = joblib.load("model_pipeline.pkl")
    except Exception as e:
        print("Model loading warning:", e)
    return model_pipeline, threshold

get_model_and_threshold()

# Database Model
class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(200))
    description = db.Column(db.Text)
    reason = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Load Kaggle Data for Auto-fill
try:
    df = pd.read_csv("kaggle_companies.csv")
    kaggle_companies = df['Company'].dropna().value_counts().head(100).index.tolist()
except Exception as e:
    kaggle_companies = ["Google", "Amazon", "Microsoft", "Deloitte", "BNY Mellon", "Meta", "CloudScale Analytics"]

def detect_red_flags(text):
    text = text.lower()
    
    flags = {
        "Payment/Fee Requested": bool(re.search(r"\b(fee|deposit|registration|refundable)\b", text)),
        "Free Email Domain": bool(re.search(r"@(gmail|yahoo|hotmail|outlook)\.com", text)),
        "WhatsApp/Telegram Contact": bool(re.search(r"\b(whatsapp|telegram)\b", text)),
        "ID/Bank Request (Aadhaar/PAN)": bool(re.search(r"\b(aadhaar|pan|bank account)\b", text)),
        "No Interview / Direct Joining": bool(re.search(r"\b(no interview|direct joining)\b", text)),
        "Unrealistic Pay / Exaggerated CTC": bool(re.search(r'(?:rs\.?|₹)\s*[\d,]{4,}|\b\d+[\d,]*\s*(?:lpa|per month)\b', text)),
        "Suspicious Link / Third-Party Redirect": bool(re.search(r'https?://[^\s\)\]]*(?:link|bit\.ly|tinyurl|forms\.gle|talentsjobs|\.in/links|\.xyz|\.top|\.site|\.online|\.click)', text)),
        "Unrealistic Blanket Eligibility / Mass Phishing": bool(re.search(r'\b(all (?:college )?students eligible|all (?:eligible )?batches|branches & gender: all eligible|all branches eligible|only candidates with 100% completed profiles?|limited vacancies)\b', text)),
        "Impersonated Corporate Drive": bool(re.search(r'\b(tcs|infosys|wipro|cognizant|accenture|capgemini|hcl).*(?:hiring drive|internship drive|campus drive)\b', text) and not re.search(r'(tcs\.com|infosys\.com|wipro\.com|cognizant\.com|accenture\.com)', text))
    }
    return [k for k, v in flags.items() if v]

def compute_linguistic_stats(text):
    text_str = str(text or "")
    words = re.findall(r'\b\w+\b', text_str)
    word_count = len(words)
    unique_words = len(set(w.lower() for w in words)) if word_count > 0 else 0
    lexical_diversity = round((unique_words / word_count) * 100, 1) if word_count > 0 else 0
    char_count = len(text_str)
    avg_word_len = round(sum(len(w) for w in words) / word_count, 1) if word_count > 0 else 0
    exclamation_count = text_str.count('!')
    question_count = text_str.count('?')
    total_punctuation = exclamation_count + question_count
    uppercase_chars = sum(1 for c in text_str if c.isupper())
    uppercase_ratio = round((uppercase_chars / (char_count + 1)) * 100, 1)
    
    # Neutral, descriptive labels (informational only)
    if word_count < 40:
        length_label = "Short message"
    elif word_count <= 140:
        length_label = "Standard length"
    else:
        length_label = "Detailed posting"
        
    if lexical_diversity <= 65:
        diversity_label = "High repetition"
    elif lexical_diversity <= 80:
        diversity_label = "Moderate diversity"
    else:
        diversity_label = "High diversity"
        
    if total_punctuation >= 3:
        punctuation_label = "High urgency punctuation"
    elif total_punctuation >= 1:
        punctuation_label = "Moderate punctuation"
    else:
        punctuation_label = "Standard punctuation"
        
    if uppercase_ratio >= 10:
        casing_label = "Elevated uppercase"
    else:
        casing_label = "Standard casing"
        
    return {
        "word_count": word_count,
        "unique_words": unique_words,
        "lexical_diversity": lexical_diversity,
        "diversity_label": diversity_label,
        "char_count": char_count,
        "avg_word_len": avg_word_len,
        "exclamation_count": exclamation_count,
        "question_count": question_count,
        "total_punctuation": total_punctuation,
        "punctuation_label": punctuation_label,
        "uppercase_ratio": uppercase_ratio,
        "casing_label": casing_label,
        "length_label": length_label
    }

@app.route("/")
def home():
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({
        "status": "online",
        "message": "Fake Job Detection API is running. Access Vite dev server at http://localhost:5173 or run 'npm run build' to serve from Flask."
    }), 200

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json or {}
    text = data.get("text", "")

    # Machine Learning Output
    model, thresh = get_model_and_threshold()
    if model:
        try:
            prob = model.predict_proba([text])[0][1]
        except Exception:
            model = joblib.load("model_pipeline.pkl")
            prob = model.predict_proba([text])[0][1]
    else:
        prob = 0.1 # Fallback if model not ready

    # Hybrid Rule Engine Layer
    flags = detect_red_flags(text)
    
    # If 2 or more strong rules trigger, force "Fake"
    if len(flags) >= 2:
        prediction = "Fake"
        risk_score = max(80, int((prob * 100) + (len(flags) * 15))) # Boost score
    else:
        # Standard ML + small rule blending
        risk_score = int((prob * 100) + (len(flags) * 10))
        prediction = "Fake" if prob >= threshold or risk_score > 50 else "Legitimate"
        
    risk_score = min(risk_score, 100)
    reason_text = ", ".join(flags) if flags else "High risk based on machine learning language analysis"
    
    # Informational linguistic profile (does not alter prediction or risk_score)
    linguistics = compute_linguistic_stats(text)

    return jsonify({
        "prediction": prediction,
        "risk_score": risk_score,
        "flags": flags,
        "reason": reason_text,
        "linguistics": linguistics
    })

@app.route("/report", methods=["POST"])
def report():
    data = request.json
    try:
        new_rep = Report(
            company=data.get("company", "Unknown"),
            description=data.get("description", ""),
            reason=data.get("reason", "Not specified")
        )
        db.session.add(new_rep)
        db.session.commit()
        return jsonify({"message": "Report saved successfully!"})
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route("/dashboard")
def dashboard():
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({
        "status": "online",
        "message": "Dashboard route. Access Vite dev server at http://localhost:5173 or run 'npm run build' to serve from Flask."
    }), 200

@app.route("/analytics")
def get_analytics():
    days = request.args.get('days')
    query_base = Report.query

    if days and days.isdigit():
        cutoff_date = datetime.utcnow() - timedelta(days=int(days))
        query_base = query_base.filter(Report.created_at >= cutoff_date)

    total = query_base.count()
    fee_count = query_base.filter(Report.reason.contains("Payment/Fee Requested")).count()
    whatsapp_count = query_base.filter(Report.reason.contains("WhatsApp/Telegram Contact")).count()
    
    top_companies_query = db.session.query(Report.company, db.func.count(Report.company).label('count')) \
        .filter(Report.company != "") \
        .filter(Report.company != "Unknown")
        
    if days and days.isdigit():
        top_companies_query = top_companies_query.filter(Report.created_at >= cutoff_date)

    top_companies_query = top_companies_query.group_by(Report.company) \
        .order_by(db.func.count(Report.company).desc()) \
        .limit(5).all()
        
    top_companies = [{"name": row.company, "count": row.count} for row in top_companies_query]

    return jsonify({
        "total": total, 
        "fee": fee_count, 
        "whatsapp": whatsapp_count,
        "top_companies": top_companies
    })

@app.route("/api/metrics")
def get_model_metrics():
    metrics_path = os.path.join(BASE_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r", encoding="utf-8") as f:
                return jsonify(json.load(f))
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "metrics.json not found"}), 404

@app.route("/export")
def export_csv():
    reports = Report.query.all()
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['ID', 'Company', 'Description', 'Reason', 'Date_Reported']) 
    
    for r in reports:
        cw.writerow([r.id, r.company, r.description, r.reason, r.created_at.strftime('%Y-%m-%d')])
        
    return Response(
        si.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=scam_reports_raw.csv"}
    )

@app.route("/export-summary")
def export_summary():
    total = Report.query.count()
    fee_count = Report.query.filter(Report.reason.contains("Payment/Fee Requested")).count()
    whatsapp_count = Report.query.filter(Report.reason.contains("WhatsApp/Telegram Contact")).count()
    
    top_companies_query = db.session.query(Report.company, db.func.count(Report.company).label('count')) \
        .filter(Report.company != "") \
        .filter(Report.company != "Unknown") \
        .group_by(Report.company) \
        .order_by(db.func.count(Report.company).desc()) \
        .limit(5).all()
        
    summary = "========================================\n"
    summary += "      SCAM ANALYTICS SUMMARY REPORT     \n"
    summary += "========================================\n\n"
    summary += f"Total Fake Jobs Reported: {total}\n"
    summary += f"Scams Requesting Upfront Fees: {fee_count}\n"
    summary += f"Scams Pushing to WhatsApp/Telegram: {whatsapp_count}\n\n"
    summary += "🚨 HIGH RISK - TOP 5 IMPERSONATED COMPANIES:\n"
    
    if not top_companies_query:
        summary += "- No company data available yet.\n"
    else:
        for row in top_companies_query:
            summary += f"- {row.company} ({row.count} flags)\n"
            
    summary += "\n========================================\n"
    summary += "Generated by the Fake Internship Detector"
        
    return Response(
        summary,
        mimetype="text/plain",
        headers={"Content-Disposition": "attachment;filename=scam_summary_report.txt"}
    )

@app.route("/api/v1/check-job", methods=["POST"])
def api_check_job():
    data = request.json
    if not data or "job_description" not in data:
        return jsonify({"error": "Missing 'job_description' parameter"}), 400
        
    text = data["job_description"]
    
    model, thresh = get_model_and_threshold()
    if model:
        try:
            prob = model.predict_proba([text])[0][1]
        except Exception:
            model = joblib.load("model_pipeline.pkl")
            prob = model.predict_proba([text])[0][1]
    else:
        prob = 0.1
        
    flags = detect_red_flags(text)
    linguistics = compute_linguistic_stats(text)
    
    if len(flags) >= 2:
        prediction = "Fake"
        risk_score = max(80, int((prob * 100) + (len(flags) * 15)))
    else:
        risk_score = int((prob * 100) + (len(flags) * 10))
        prediction = "Fake" if prob >= threshold or risk_score > 50 else "Legitimate"
        
    risk_score = min(risk_score, 100)
        
    return jsonify({
        "status": "success",
        "data": {
            "prediction": prediction,
            "risk_score": risk_score,
            "flags_detected": flags,
            "linguistics": linguistics
        }
    })

@app.route("/<path:path>")
def serve_static_or_spa(path):
    if os.path.exists(FRONTEND_DIST):
        file_path = os.path.join(FRONTEND_DIST, path)
        if os.path.isfile(file_path):
            return send_from_directory(FRONTEND_DIST, path)
        if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
            return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)