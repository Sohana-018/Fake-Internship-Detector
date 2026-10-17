import numpy as np
import re
from sklearn.base import BaseEstimator, TransformerMixin

class HandcraftedFeatures(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self
    
    def transform(self, X):
        features = []
        for text in X:
            t = str(text).lower()
            f = [
                1 if re.search(r'\b(fee|deposit|registration|refundable)\b', t) else 0,
                1 if re.search(r'@(gmail|yahoo|hotmail|outlook)\.com', t) else 0,
                1 if re.search(r'\b(whatsapp|telegram)\b', t) else 0,
                1 if re.search(r'\b(aadhaar|pan|bank account)\b', t) else 0,
                len(re.findall(r'\b(urgent|immediate|hurry|limited seats|only \d+ seats|limited vacancies)\b', t)),
                1 if re.search(r'\b(no interview|direct joining)\b', t) else 0,
                1 if re.search(r'(?:rs\.?|₹)\s*[\d,]{4,}|\b\d+[\d,]*\s*(?:lpa|per month)\b', t) else 0,
                str(text).count('!'),
                sum(1 for c in str(text) if c.isupper()) / (len(str(text)) + 1),
                1 if re.search(r'(google|amazon|microsoft|apple|meta|reliance|tata|tcs|infosys|wipro).*@(gmail|yahoo)\.com', t) else 0,
                1 if re.search(r'https?://[^\s\)\]]*(?:link|bit\.ly|tinyurl|forms\.gle|talentsjobs|\.in/links|\.xyz|\.top|\.site|\.online|\.click)', t) else 0,
                1 if re.search(r'\b(all (?:college )?students eligible|all (?:eligible )?batches|branches & gender: all eligible|all branches eligible|all eligible)\b', t) else 0,
                1 if re.search(r'\b(tcs|infosys|wipro|cognizant|accenture|capgemini|hcl).*(?:hiring drive|internship drive|campus drive)\b', t) else 0,
                1 if re.search(r'\b(?:click here|apply now|limited vacancies|completed profiles?)\b', t) else 0
            ]
            features.append(f)
        return np.array(features)

