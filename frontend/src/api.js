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
          const words = text.trim() ? text.trim().split(/\s+/) : [];
          const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
          const lexicalDiversity = words.length > 0 ? Math.round((uniqueWords / words.length) * 100) : 0;
          const exclamations = (text.match(/!/g) || []).length;
          const questions = (text.match(/\?/g) || []).length;
          const uppercaseChars = (text.match(/[A-Z]/g) || []).length;
          const uppercaseRatio = text.length > 0 ? Math.round((uppercaseChars / text.length) * 100) : 0;

          resolve({
            prediction: "Legitimate",
            risk_score: 22,
            flags: [],
            reason: "Safe language (Dummy Response)",
            linguistics: {
              word_count: words.length,
              unique_words: uniqueWords,
              lexical_diversity: lexicalDiversity,
              diversity_label: lexicalDiversity <= 65 ? "High repetition" : (lexicalDiversity <= 80 ? "Moderate diversity" : "High diversity"),
              char_count: text.length,
              avg_word_len: words.length > 0 ? Math.round((text.length / words.length) * 10) / 10 : 0,
              exclamation_count: exclamations,
              question_count: questions,
              total_punctuation: exclamations + questions,
              punctuation_label: (exclamations + questions) >= 3 ? "High urgency punctuation" : "Standard punctuation",
              uppercase_ratio: uppercaseRatio,
              casing_label: uppercaseRatio >= 10 ? "Elevated uppercase" : "Standard casing",
              length_label: words.length < 40 ? "Short message" : (words.length <= 140 ? "Standard length" : "Detailed posting")
            }
          });
        }
      }, 1000);
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
