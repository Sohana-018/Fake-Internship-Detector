from flask import Flask, render_template, request, jsonify, Response, send_from_directory
import joblib
import re
from flask_sqlalchemy import SQLAlchemy
import io
import csv
import pandas as pd
from datetime import datetime, timedelta
import os

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
if os.path.exists("model_pipeline.pkl"):
    model_pipeline = joblib.load("model_pipeline.pkl")
if os.path.exists("best_threshold.txt"):
    with open("best_threshold.txt", "r") as f:
        threshold = float(f.read().strip())

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
        "Unrealistic Pay": bool(re.search(r'rs \d{5,}|₹\d{5,}', text))
    }
    return [k for k, v in flags.items() if v]

@app.route("/")
def home():
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return render_template("index.html", companies=kaggle_companies)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    text = data.get("text", "")

    # Machine Learning Output
    if model_pipeline:
        prob = model_pipeline.predict_proba([text])[0][1]
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

    return jsonify({
        "prediction": prediction,
        "risk_score": risk_score,
        "flags": flags,
        "reason": reason_text
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
    return render_template("analytics.html")

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
    
    if model_pipeline:
        prob = model_pipeline.predict_proba([text])[0][1]
    else:
        prob = 0.1
        
    flags = detect_red_flags(text)
    
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
            "flags_detected": flags
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