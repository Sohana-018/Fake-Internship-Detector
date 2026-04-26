from flask import Flask, render_template, request, jsonify, Response
import joblib
import re
from flask_sqlalchemy import SQLAlchemy
from PIL import Image
import io
import csv
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///reports.db"
db = SQLAlchemy(app)
# Load AI models
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

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
    fee_scam = bool(re.search(r"(?<!no\s)(?<!not\s)(?<!zero\s)\b(fee|payment|registration|deposit)\b", text))
    
    flags = {
        "Payment Request Detected": fee_scam,
        "Urgency Pressure": bool(re.search(r"\b(urgent|immediate|hurry|limited)\b", text)),
        "WhatsApp/Telegram Contact": bool(re.search(r"\b(whatsapp|telegram)\b", text)),
    }
    return [k for k, v in flags.items() if v]

@app.route("/")
def home():
    return render_template("index.html", companies=kaggle_companies)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    text = data.get("text", "")
    text_lower = text.lower()

    vec = vectorizer.transform([text])
    prob = model.predict_proba(vec)[0][1]
    
    flags = detect_red_flags(text)
    risk_score = min(int((prob * 100) + (len(flags) * 20)), 100)
    
    if any(x in text_lower for x in ["pvt", "ltd", "corp", "inc"]):
        risk_score = max(0, risk_score - 15)
        
    reason_text = ", ".join(flags) if flags else "High risk score based on language"

    return jsonify({
        "prediction": "Fake" if risk_score > 50 else "Legitimate",
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
    return render_template("analytics.html")

@app.route("/analytics")
def get_analytics():
    days = request.args.get('days')
    query_base = Report.query

    if days and days.isdigit():
        cutoff_date = datetime.utcnow() - timedelta(days=int(days))
        query_base = query_base.filter(Report.created_at >= cutoff_date)

    total = query_base.count()
    fee_count = query_base.filter(Report.reason.contains("Payment Request Detected")).count()
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
    fee_count = Report.query.filter(Report.reason.contains("Payment Request Detected")).count()
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
    text_lower = text.lower()
    
    vec = vectorizer.transform([text])
    prob = model.predict_proba(vec)[0][1]
    flags = detect_red_flags(text)
    risk_score = min(int((prob * 100) + (len(flags) * 20)), 100)
    
    if any(x in text_lower for x in ["pvt", "ltd", "corp", "inc"]):
        risk_score = max(0, risk_score - 15)
        
    return jsonify({
        "status": "success",
        "data": {
            "prediction": "Fake" if risk_score > 50 else "Legitimate",
            "risk_score": risk_score,
            "flags_detected": flags
        }
    })

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)