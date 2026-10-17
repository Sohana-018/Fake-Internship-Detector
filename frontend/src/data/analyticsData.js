const generateData = () => {
  const records = [];
  const now = new Date();
  
  const categories = [
    "Registration Fee", 
    "Fake Offer Letter", 
    "Telegram/WhatsApp Interview", 
    "ID Document Theft", 
    "Unrealistic Stipend", 
    "Impersonating Big Company"
  ];
  
  const companies = ["Google", "Amazon", "TCS", "Infosys", "Zoho", "Microsoft", "Wipro"];
  
  let idCounter = 1;

  const createRecord = (daysAgo, isRecent) => {
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    // slightly randomize the time of day
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));

    // Shift distributions slightly depending on timeframe
    const fakeRatio = isRecent ? 0.65 : 0.55; // More fakes recently
    const isFake = Math.random() < fakeRatio;
    
    let category = null;
    if (isFake) {
      if (isRecent) {
         category = categories[Math.floor(Math.random() * 3)]; // Bias to first 3 recently
      } else {
         category = categories[Math.floor(Math.random() * categories.length)];
      }
    }

    const company = companies[Math.floor(Math.random() * companies.length)];
    const confidence = isFake ? Math.floor(Math.random() * 30 + 70) : Math.floor(Math.random() * 30 + 10);

    return {
      id: idCounter++,
      date: date.toISOString(),
      prediction: isFake ? "Fake" : "Genuine",
      confidence,
      category,
      company
    };
  };

  // 40 records in the last 7 days
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.random() * 7;
    records.push(createRecord(daysAgo, true));
  }

  // 80 records between 8 and 30 days (total 120 in last 30 days)
  for (let i = 0; i < 80; i++) {
    const daysAgo = 7 + Math.random() * 23;
    records.push(createRecord(daysAgo, true));
  }

  // 180 records between 31 and 90 days (total 300)
  for (let i = 0; i < 180; i++) {
    const daysAgo = 30 + Math.random() * 60;
    records.push(createRecord(daysAgo, false));
  }

  // Sort strictly by date descending
  return records.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const mockAnalyticsData = generateData();
