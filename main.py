import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from imblearn.over_sampling import SMOTE

# 1. Load dataset
df = pd.read_csv("job_data.csv")

# 2. Combine text columns (Handle NaNs)
columns = ["title", "company_profile", "description", "requirements", "benefits"]
df["text"] = df[columns].fillna("").agg(" ".join, axis=1)

X = df["text"]
y = df["fraudulent"]

# 3. Vectorization (Using n-grams to catch phrases like "no fee")
vectorizer = TfidfVectorizer(stop_words="english", max_features=5000, ngram_range=(1, 2))
X_vectorized = vectorizer.fit_transform(X)

# 4. Handle Imbalance (SMOTE)
smote = SMOTE(random_state=42)
X_resampled, y_resampled = smote.fit_resample(X_vectorized, y)

# 5. Split and Train
X_train, X_test, y_train, y_test = train_test_split(
    X_resampled, y_resampled, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# 6. Evaluation
print("Classification Report:\n", classification_report(y_test, model.predict(X_test)))

# 7. Save
joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
print("Model and Vectorizer saved!")