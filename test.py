import requests

url = "http://127.0.0.1:5000/report"

# Test Data 1: A Fee Scam
data1 = {
    "company": "JobFastTrack", 
    "description": "Urgent entry level job. Pay $10 security deposit.", 
    "reason": "Payment Request Detected"
}

# Test Data 2: A WhatsApp Scam
data2 = {
    "company": "Global Tech Corp", 
    "description": "Message our HR manager on WhatsApp.", 
    "reason": "WhatsApp/Telegram Contact"
}

# Test Data 3: A Hybrid Scam (Triggers both)
data3 = {
    "company": "Data Entry Pros", 
    "description": "Deposit fee via Telegram.", 
    "reason": "Payment Request Detected, WhatsApp/Telegram Contact"
}

print("Sending Data 1...", requests.post(url, json=data1).json())
print("Sending Data 2...", requests.post(url, json=data2).json())
print("Sending Data 3...", requests.post(url, json=data3).json())