import { sampleJobs } from './data/dummyData';

export const USE_DUMMY_DATA = false;

export const analyzeJobText = async (text) => {
  if (USE_DUMMY_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const match = sampleJobs.find(j => j.text.trim() === text.trim());
        if (match) {
          resolve(match.result);
        } else {
          resolve({
            prediction: "Legitimate",
            risk_score: 22,
            flags: [],
            reason: "Safe language (Dummy Response)"
          });
        }
      }, 1000); // Fake delay
    });
  }

  const response = await fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) throw new Error("Server error");
  return response.json();
};
