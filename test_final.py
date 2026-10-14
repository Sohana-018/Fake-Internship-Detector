import pandas as pd
import requests
import json

test_cases = [
    # 10 Obvious Fakes
    "URGENT: Hiring data entry immediately. No interview required. Pay a refundable registration fee of Rs 1500 via GPay. Contact WhatsApp +91-9876543210. Send Aadhaar.",
    "Data Entry Rs 50000 daily! Only 5 seats left. Buy your laptop kit for Rs 2000. Contact us at tcs_hr@gmail.com or Telegram @tcshr.",
    "Work from home Typing Expert. Earn Rs 80000/month. No experience needed. Immediate joining. Send your bank details, Aadhaar card, and a deposit of Rs 1000 to start training today.",
    "Limited vacancies for HR Assistant at Reliance. We urgently need remote workers. Training fee is Rs 1200. This will be refunded. Interview on Telegram. Send PAN card.",
    "Freelance Software Intern needed. High pay Rs 90000. Pay Rs 2500 as security deposit. Message on WhatsApp 9988776655. Urgent requirement.",
    "Google needs remote workers! You must buy our specialized software for Rs 3000 (fully refundable). Email your resume to google.jobs.india123@gmail.com. Hurry!",
    "Earn Rs 60000 sitting at home. Basic computer skills. No interview, direct joining. Just deposit Rs 500 registration fee. We will contact you on Telegram.",
    "Amazon hiring urgently! Only 2 seats left. Send your PAN card and Rs 1500 for background check. WhatsApp our manager immediately.",
    "Need Part-time workers urgently. Rs 40000 salary. Pay Rs 800 for ID card. Send bank account details.",
    "Immediate hiring for Marketing. Rs 70000 stipend. Contact on Telegram. Registration fee Rs 1000.",
    
    # 5 Subtle Fakes
    "We are looking for an ambitious marketing intern. Since this is a premium role, we require a small Rs 500 processing fee to filter out non-serious candidates. It will be reimbursed.",
    "Join our startup. We offer Rs 25000 stipend. Please send your resume and Aadhaar card to our HR. We also need you to purchase our company merchandise for Rs 900 before joining.",
    "Exciting opportunity for developers. We operate on Telegram, so please reach out there to schedule an interview. Our pay is Rs 50000.",
    "Looking for HR interns. Send resume to top_company_hr_2023@gmail.com. Immediate joining required. Only 3 seats available.",
    "Remote Data Analyst. Salary is Rs 85000 per month for just 2 hours of work a day. No interview needed, just start tomorrow.",

    # 10 Genuine Postings
    "We are hiring a Software Engineer at TechCorp. Requirements: 1-2 years experience, bachelor's degree. You will be responsible for daily operations. Apply via our portal. Stipend: Rs 20000/month.",
    "GlobalSolutions is looking for a talented Designer. Join our fast-growing team. Comprehensive health benefits, and paid time off. Please submit your resume to jobs@globalsolutions.com.",
    "Internship opportunity: Marketing Executive. As an intern at InfoSystems, you will assist the senior team. Must have strong communication skills. Stipend is Rs 15000. No fees required to apply.",
    "Full-time HR Assistant needed. We offer a competitive salary of Rs 25000. Standard background check required after interview process. Apply on LinkedIn or our website.",
    "Exciting role for a Developer at Amazon. 3 step interview process. Requires proficiency in standard office tools. Base pay Rs 50000 + bonuses.",
    "TCS is hiring freshers for IT roles. Please apply on our official portal. Salary as per industry standards.",
    "We are looking for a content writer. Must have a portfolio. 2 rounds of interview. Stipend Rs 10000.",
    "Data Scientist needed. Masters degree required. Apply on our career page.",
    "Accounting intern. Must know Excel. Stipend Rs 8000. Work from office.",
    "Sales executive. Field work required. Target based incentives. Base salary Rs 15000."
]

labels = ["Obvious Fake"]*10 + ["Subtle Fake"]*5 + ["Genuine"]*10

print(f"{'Text (Snippet)':<40} | {'True Label':<15} | {'Prediction':<12} | {'Risk %':<6} | {'Triggered Rules'}")
print("-" * 120)

for text, label in zip(test_cases, labels):
    try:
        res = requests.post("http://127.0.0.1:5000/predict", json={"text": text}).json()
        pred = res.get("prediction", "Error")
        risk = res.get("risk_score", 0)
        rules = res.get("flags", [])
        rules_str = ", ".join(rules) if rules else "None"
        snippet = text[:37] + "..." if len(text) > 40 else text
        
        print(f"{snippet:<40} | {label:<15} | {pred:<12} | {risk:<6} | {rules_str}")
    except Exception as e:
        print(f"Error testing: {e}")
