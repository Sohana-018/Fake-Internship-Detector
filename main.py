import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score, confusion_matrix
from imblearn.over_sampling import SMOTE

# 1. Load dataset
df = pd.read_csv("job_data.csv")

# 2. Combine text columns (Handle NaNs)
columns = ["title", "company_profile", "description", "requirements", "benefits"]
df["text"] = df[columns].fillna("").agg(" ".join, axis=1)

X = df["text"]
y = df["fraudulent"]

# 3. Train/Test Split (Split BEFORE vectorization and oversampling to prevent data leakage)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 4. Vectorization (Fit ONLY on the training split, then transform test split)
vectorizer = TfidfVectorizer(stop_words="english", max_features=5000, ngram_range=(1, 2))
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# 5. Handle Imbalance (Apply SMOTE ONLY on the training split)
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train_vec, y_train)

# 6. Train Model (Fit ONLY on resampled training data)
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train_res, y_train_res)

# 7. Evaluation (Run once on the untouched test set)
y_pred = model.predict(X_test_vec)

acc = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
cm = confusion_matrix(y_test, y_pred)

print(f"Accuracy: {acc:.4f}")
print(f"F1 Score: {f1:.4f}")
print("Confusion Matrix:\n", cm)
print("\nClassification Report:\n", classification_report(y_test, y_pred))

# 8. Save
joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
print("Model and Vectorizer saved!")
