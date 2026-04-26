from web import app, db, Report
from datetime import datetime, timedelta

# List of realistic mock data to populate your dashboard
mock_reports = [
    # Recent scams (Will show in "Last 7 Days")
    {"company": "TCS", "desc": "Dear candidate, pay 2000 INR refundable laptop security deposit.", "reason": "Payment Request Detected", "days_old": 1},
    {"company": "Telegram HR", "desc": "Urgent! Work from home data entry. Message on Telegram.", "reason": "Urgency Pressure, WhatsApp/Telegram Contact", "days_old": 2},
    {"company": "BNY Mellon", "desc": "Pay processing fee for internship application.", "reason": "Payment Request Detected", "days_old": 4},
    {"company": "Google", "desc": "Contact HR directly on WhatsApp for immediate joining.", "reason": "WhatsApp/Telegram Contact", "days_old": 5},
    
    # Older scams (Will show in "Last 30 Days" but NOT "Last 7 Days")
    {"company": "TCS", "desc": "Registration fee required for background verification.", "reason": "Payment Request Detected", "days_old": 12},
    {"company": "Amazon", "desc": "Part time YouTube liking job. Message on Telegram.", "reason": "WhatsApp/Telegram Contact", "days_old": 15},
    {"company": "Deloitte", "desc": "Urgent requirement. Pay deposit to schedule interview.", "reason": "Payment Request Detected, Urgency Pressure", "days_old": 20},
    {"company": "Telegram HR", "desc": "Daily payout data entry. Contact via WhatsApp.", "reason": "WhatsApp/Telegram Contact", "days_old": 25},
    
    # Very old scams (Will only show in "All Time")
    {"company": "Microsoft", "desc": "Pay 5000 for training kit before internship starts.", "reason": "Payment Request Detected", "days_old": 45},
    {"company": "TCS", "desc": "Send document verification fee via UPI.", "reason": "Payment Request Detected", "days_old": 50}
]

with app.app_context():
    print("Clearing old data...")
    db.session.query(Report).delete() # Clears any existing data so we have a clean slate
    
    print("Injecting realistic mock data...")
    for item in mock_reports:
        # Calculate the date by subtracting 'days_old' from today
        past_date = datetime.utcnow() - timedelta(days=item['days_old'])
        
        new_report = Report(
            company=item['company'],
            description=item['desc'],
            reason=item['reason']
        )
        # Override the default timestamp with our fake past date
        new_report.created_at = past_date 
        
        db.session.add(new_report)
        
    db.session.commit()
    print("✅ Database successfully populated! Your dashboard is now full of data.")