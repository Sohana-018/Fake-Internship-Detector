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
import time
from collections import defaultdict

# Import for joblib to successfully load custom transformer
from features import HandcraftedFeatures

# ── In-Memory Rate Limiting Configuration (Sliding Window per IP) ──
RATE_LIMIT_RULES = {
    "predict": {"max_requests": 60, "window_seconds": 60},  # 60 requests/minute
    "report": {"max_requests": 15, "window_seconds": 60}     # 15 reports/minute
}
_rate_limit_records = defaultdict(lambda: defaultdict(list))

def is_rate_limited(endpoint_key):
    """Enforces in-memory sliding-window request throttling per IP."""
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()
    rule = RATE_LIMIT_RULES.get(endpoint_key, {"max_requests": 60, "window_seconds": 60})
    now = time.time()
    window = rule["window_seconds"]
    max_req = rule["max_requests"]

    history = _rate_limit_records[endpoint_key][client_ip]
    _rate_limit_records[endpoint_key][client_ip] = [t for t in history if now - t < window]

    if len(_rate_limit_records[endpoint_key][client_ip]) >= max_req:
        return True

    _rate_limit_records[endpoint_key][client_ip].append(now)
    return False

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

# Database Models
class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(200))
    description = db.Column(db.Text)
    reason = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ScanEvent(db.Model):
    """Metadata-only audit table for scan history. Does NOT store full job description text."""
    id = db.Column(db.Integer, primary_key=True)
    prediction = db.Column(db.String(50))   # "Fake" or "Legitimate"
    risk_score = db.Column(db.Integer)      # 0 to 100
    matched_rules = db.Column(db.String(500)) # Comma-separated rule names
    company = db.Column(db.String(150), default="Unknown")
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
    if is_rate_limited("predict"):
        return jsonify({
            "error": "Rate limit exceeded. Maximum 60 analysis requests per minute allowed."
        }), 429

    data = request.json or {}
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request format. Expected JSON object."}), 400

    raw_text = data.get("text", "")
    if not isinstance(raw_text, str):
        return jsonify({"error": "Input 'text' must be a string."}), 400

    text = raw_text.strip()
    if not text:
        return jsonify({"error": "Job description text cannot be empty."}), 400

    if len(text) > 25000:
        return jsonify({
            "error": "Input text exceeds maximum allowed length of 25,000 characters."
        }), 400

    pipeline_steps = []

    # 1. Input received
    t0 = time.perf_counter()
    word_count = len(text.split())
    char_count = len(text)
    limits_passed = (1 <= word_count <= 25000 and char_count <= 25000)
    t1 = time.perf_counter()
    pipeline_steps.append({
        "id": "input_received",
        "label": "Input received",
        "status": "done" if limits_passed else "skipped",
        "detail": f"Parsed {word_count} words ({char_count} chars). Length limits validated (<= 25,000 chars).",
        "duration_ms": round((t1 - t0) * 1000, 2)
    })

    # 2. Text cleaning
    t0 = time.perf_counter()
    cleaned_text = " ".join(text.split())
    t1 = time.perf_counter()
    pipeline_steps.append({
        "id": "text_cleaning",
        "label": "Text cleaning",
        "status": "done",
        "detail": "Normalized surrounding whitespace and prepared canonical string for regex pattern rules and tokenization.",
        "duration_ms": round((t1 - t0) * 1000, 2)
    })

    # 3. Rule checks
    t0 = time.perf_counter()
    flags = detect_red_flags(cleaned_text)
    t1 = time.perf_counter()
    rule_detail = f"Triggered {len(flags)} heuristic rule(s): {', '.join(flags)}." if flags else "0 heuristic rule triggers detected; all heuristic pattern checks passed clean."
    pipeline_steps.append({
        "id": "rule_checks",
        "label": "Rule checks",
        "status": "done",
        "detail": rule_detail,
        "duration_ms": round((t1 - t0) * 1000, 2)
    })

    # 4. Feature extraction
    t0 = time.perf_counter()
    model, thresh = get_model_and_threshold()
    feats = None
    if model and hasattr(model, "named_steps") and "features" in model.named_steps:
        try:
            feats = model.named_steps["features"].transform([cleaned_text])
            nnz_count = int(feats.nnz)
            n_features = int(feats.shape[1])
            fe_status = "done"
            fe_detail = f"Generated {n_features} features (5,000 TF-IDF unigrams/bigrams + 14 handcrafted indicators). Non-zero features: {nnz_count}."
        except Exception as fe_err:
            fe_status = "skipped"
            fe_detail = f"Feature extraction fallback: {fe_err}"
    else:
        fe_status = "skipped"
        fe_detail = "Feature pipeline transformer not accessible."
    t1 = time.perf_counter()
    pipeline_steps.append({
        "id": "feature_extraction",
        "label": "Feature extraction",
        "status": fe_status,
        "detail": fe_detail,
        "duration_ms": round((t1 - t0) * 1000, 2)
    })

    # 5. Model scoring
    t0 = time.perf_counter()
    if model:
        try:
            if feats is not None and hasattr(model, "named_steps") and "clf" in model.named_steps:
                prob = float(model.named_steps["clf"].predict_proba(feats)[0][1])
            else:
                prob = float(model.predict_proba([cleaned_text])[0][1])
            ms_status = "done"
            ms_detail = f"Logistic Regression inferred {prob * 100:.1f}% scam probability (class_weight='balanced')."
        except Exception:
            model = joblib.load("model_pipeline.pkl")
            prob = float(model.predict_proba([cleaned_text])[0][1])
            ms_status = "done"
            ms_detail = f"Logistic Regression inferred {prob * 100:.1f}% scam probability."
    else:
        prob = 0.1
        ms_status = "skipped"
        ms_detail = "Model not initialized; used baseline probability."
    t1 = time.perf_counter()
    pipeline_steps.append({
        "id": "model_scoring",
        "label": "Model scoring",
        "status": ms_status,
        "detail": ms_detail,
        "duration_ms": round((t1 - t0) * 1000, 2)
    })

    # 6. Threshold decision
    t0 = time.perf_counter()
    prob_pct = round(prob * 100, 1)
    thresh_pct = round(threshold * 100, 1)
    is_above = prob >= threshold
    t1 = time.perf_counter()
    pipeline_steps.append({
        "id": "threshold_decision",
        "label": "Threshold decision",
        "status": "done",
        "detail": f"Evaluated against {threshold:.2f} ({thresh_pct}%) threshold: model probability {prob_pct}% is {'above or equal to' if is_above else 'below'} decision threshold.",
        "duration_ms": round((t1 - t0) * 1000, 2)
    })

    # 7. Final verdict
    t0 = time.perf_counter()
    if len(flags) >= 2:
        prediction = "Fake"
        raw_score = max(80, int((prob * 100) + (len(flags) * 15)))
        risk_score = min(raw_score, 100)
        verdict_action = f"Enforced Fake verdict and elevated risk score to {risk_score}% due to {len(flags)} critical rule matches."
    else:
        raw_score = int((prob * 100) + (len(flags) * 10))
        risk_score = min(raw_score, 100)
        prediction = "Fake" if prob >= threshold or risk_score > 50 else "Legitimate"
        if len(flags) == 1:
            verdict_action = f"Combined ML score with single rule bonus (+10%), yielding {risk_score}% risk score."
        else:
            verdict_action = f"Prediction determined directly by ML model probability with 0 heuristic overrides ({risk_score}% risk score)."

    reason_text = ", ".join(flags) if flags else "High risk based on machine learning language analysis"
    t1 = time.perf_counter()
    pipeline_steps.append({
        "id": "final_verdict",
        "label": "Final verdict",
        "status": "done",
        "detail": f"Classified as '{prediction}' with {risk_score}% composite risk score. {verdict_action}",
        "duration_ms": round((t1 - t0) * 1000, 2)
    })

    # Record scan event metadata into SQLite (stores NO full posting text)
    try:
        extracted_comp = "Unknown"
        m = re.search(r'\b(tcs|infosys|wipro|cognizant|accenture|capgemini|hcl|google|amazon|microsoft|deloitte|reliance|tata|meta|apple)\b', cleaned_text, re.I)
        if m:
            extracted_comp = m.group(1).upper()
        
        scan_rec = ScanEvent(
            prediction=prediction,
            risk_score=risk_score,
            matched_rules=", ".join(flags) if flags else "Machine Learning",
            company=extracted_comp,
            created_at=datetime.utcnow()
        )
        db.session.add(scan_rec)
        db.session.commit()
    except Exception as scan_err:
        app.logger.warning(f"Could not record scan event: {scan_err}")

    return jsonify({
        "prediction": prediction,
        "risk_score": risk_score,
        "flags": flags,
        "reason": reason_text,
        "pipeline": pipeline_steps
    })

@app.route("/report", methods=["POST"])
def report():
    if is_rate_limited("report"):
        return jsonify({
            "message": "Rate limit exceeded. Maximum 15 report submissions per minute allowed.",
            "error": "Rate limit exceeded"
        }), 429

    data = request.json or {}
    if not isinstance(data, dict):
        return jsonify({
            "message": "Invalid request format. Expected JSON object.",
            "error": "Invalid format"
        }), 400

    company = str(data.get("company", "Unknown")).strip()[:150] or "Unknown"
    description = str(data.get("description", "")).strip()
    reason = str(data.get("reason", "Not specified")).strip()[:200] or "Not specified"

    if not description:
        return jsonify({
            "message": "Description of the scam cannot be empty.",
            "error": "Missing description"
        }), 400

    if len(description) > 5000:
        return jsonify({
            "message": "Description exceeds maximum allowed length of 5,000 characters.",
            "error": "Description too long"
        }), 400

    try:
        # NOTE: The community report database is unmoderated and stores user-submitted entries.
        new_rep = Report(
            company=company,
            description=description,
            reason=reason
        )
        db.session.add(new_rep)
        db.session.commit()
        return jsonify({
            "message": "Report saved successfully! Note: The community database is unmoderated."
        })
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}", "error": str(e)}), 500

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
    cutoff_date = None
    if days and days.isdigit():
        cutoff_date = datetime.utcnow() - timedelta(days=int(days))

    # Total counts in database
    total_db_scans = ScanEvent.query.count()
    total_db_reports = Report.query.count()
    total_db_records = total_db_scans + total_db_reports
    has_enough_data = (total_db_records >= 10)

    # Filtered queries by timeframe
    scan_q = ScanEvent.query
    report_q = Report.query
    if cutoff_date:
        scan_q = scan_q.filter(ScanEvent.created_at >= cutoff_date)
        report_q = report_q.filter(Report.created_at >= cutoff_date)

    scans = scan_q.order_by(ScanEvent.created_at.desc()).all()
    reports = report_q.order_by(Report.created_at.desc()).all()

    total_scans = len(scans)
    fake_scans = sum(1 for s in scans if s.prediction == "Fake")
    genuine_scans = sum(1 for s in scans if s.prediction == "Legitimate")
    total_reports = len(reports)
    total_items = total_scans + total_reports
    fake_total = fake_scans + total_reports
    scam_rate = round((fake_total / total_items) * 100, 1) if total_items > 0 else 0

    # Daily aggregation timeline
    day_counts = defaultdict(lambda: {"Critical Threats": 0, "High Risk Warnings": 0, "Verified Postings": 0, "Total": 0})
    for s in scans:
        d_str = s.created_at.strftime('%b %d')
        day_counts[d_str]["Total"] += 1
        if s.risk_score >= 80:
            day_counts[d_str]["Critical Threats"] += 1
        elif s.risk_score >= 50:
            day_counts[d_str]["High Risk Warnings"] += 1
        else:
            day_counts[d_str]["Verified Postings"] += 1

    for r in reports:
        d_str = r.created_at.strftime('%b %d')
        day_counts[d_str]["Total"] += 1
        day_counts[d_str]["Critical Threats"] += 1

    timeline = [{"date": k, **v} for k, v in day_counts.items()]

    # Category / Threat Vector aggregation
    category_counts = defaultdict(int)
    for s in scans:
        if s.matched_rules:
            for r in s.matched_rules.split(","):
                r_clean = r.strip()
                if r_clean and r_clean != "None":
                    category_counts[r_clean] += 1
    for r in reports:
        if r.reason:
            for part in r.reason.split(","):
                p_clean = part.strip()
                if p_clean and p_clean != "None":
                    category_counts[p_clean] += 1

    sorted_cats = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    vector_data = [{"name": k, "value": v} for k, v in sorted_cats[:6]]

    # Impersonated Companies
    comp_counts = defaultdict(int)
    for s in scans:
        if s.company and s.company.upper() not in ["UNKNOWN", ""]:
            comp_counts[s.company.upper()] += 1
    for r in reports:
        if r.company and r.company.upper() not in ["UNKNOWN", ""]:
            comp_counts[r.company.upper()] += 1

    sorted_comps = sorted(comp_counts.items(), key=lambda x: x[1], reverse=True)
    top_companies = [{"name": k, "count": v} for k, v in sorted_comps[:7]]

    # Recent activity records
    combined_records = []
    for s in scans[:50]:
        combined_records.append({
            "id": f"SCN-{s.id}",
            "date": s.created_at.isoformat(),
            "company": s.company,
            "role": "Scanned Job Posting",
            "category": s.matched_rules or "General Scan",
            "prediction": s.prediction,
            "riskScore": s.risk_score,
            "confidence": s.risk_score if s.prediction == "Fake" else (100 - s.risk_score),
            "flagCount": len(s.matched_rules.split(",")) if s.matched_rules and s.matched_rules != "None" else 0,
            "type": "Scan"
        })
    for r in reports[:20]:
        combined_records.append({
            "id": f"REP-{r.id}",
            "date": r.created_at.isoformat(),
            "company": r.company or "Unknown",
            "role": (r.description[:35] + "...") if len(r.description) > 35 else r.description,
            "category": r.reason or "Community Report",
            "prediction": "Fake",
            "riskScore": 100,
            "confidence": 100,
            "flagCount": 1,
            "type": "Report"
        })

    combined_records.sort(key=lambda x: x["date"], reverse=True)

    return jsonify({
        "has_enough_data": has_enough_data,
        "total_db_records": total_db_records,
        "total_db_scans": total_db_scans,
        "total_db_reports": total_db_reports,
        "filtered_stats": {
            "total": total_items,
            "fake": fake_total,
            "genuine": genuine_scans,
            "rate": scam_rate
        },
        "timeline": timeline,
        "vector_data": vector_data,
        "top_companies": top_companies,
        "records": combined_records
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

@app.route("/api/v1/check-job", methods=["POST"])
def api_check_job():
    """Thin backwards-compatibility alias for /predict."""
    data = request.json or {}
    if isinstance(data, dict) and "job_description" in data and "text" not in data:
        data["text"] = data["job_description"]
    # Re-dispatch internally to /predict
    return predict()

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