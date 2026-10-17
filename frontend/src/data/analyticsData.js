// High-fidelity Threat Telemetry Dataset
// Deterministic data generation simulating realistic enterprise threat patterns over 90 days

const now = new Date("2026-10-17T12:00:00Z");

const threatProfiles = [
  { company: "TCS", role: "Graduate Engineer Trainee Drive", category: "Campus Phishing Drive", prediction: "Fake", risk: 96, flags: 4 },
  { company: "Google", role: "Software Engineer - Core Systems", category: "Verified Opportunity", prediction: "Legitimate", risk: 8, flags: 0 },
  { company: "Infosys", role: "Specialist Programmer Placement Drive", category: "Campus Phishing Drive", prediction: "Fake", risk: 94, flags: 3 },
  { company: "TechCorp Global", role: "Remote Data Entry Clerk", category: "Upfront Security Deposit", prediction: "Fake", risk: 100, flags: 3 },
  { company: "Microsoft", role: "Azure Cloud Solutions Intern", category: "Verified Opportunity", prediction: "Legitimate", risk: 11, flags: 0 },
  { company: "Wipro", role: "Project Engineer Mass Hiring", category: "Campus Phishing Drive", prediction: "Fake", risk: 92, flags: 3 },
  { company: "FastHire Solutions", role: "Telegram Virtual Reviewer", category: "Telegram/WhatsApp Funnel", prediction: "Fake", risk: 84, flags: 2 },
  { company: "Deloitte", role: "Technology Risk Consultant", category: "Verified Opportunity", prediction: "Legitimate", risk: 14, flags: 0 },
  { company: "Amazon", role: "AWS Solutions Architect Intern", category: "Verified Opportunity", prediction: "Legitimate", risk: 9, flags: 0 },
  { company: "CloudScale Analytics", role: "Freelance Form Filling Assistant", category: "Aadhaar/Bank Harvesting", prediction: "Fake", risk: 98, flags: 3 },
  { company: "Cognizant", role: "GenC Next Campus Hiring", category: "Campus Phishing Drive", prediction: "Fake", risk: 86, flags: 3 },
  { company: "CryptoPulse Labs", role: "Crypto P2P Payment Assistant", category: "Unrealistic Pay / Task Scam", prediction: "Fake", risk: 80, flags: 2 },
  { company: "Zoho", role: "Junior Full-Stack Developer", category: "Verified Opportunity", prediction: "Legitimate", risk: 12, flags: 0 },
  { company: "NexGen Media", role: "Content Marketing Intern", category: "Verified Opportunity", prediction: "Legitimate", risk: 38, flags: 1 },
  { company: "PrimeWork Staffing", role: "HR Administrative Executive", category: "Upfront Security Deposit", prediction: "Fake", risk: 91, flags: 2 }
];

const locations = ["Remote", "Bangalore, IN", "Hyderabad, IN", "Pune, IN", "Delhi NCR, IN", "San Francisco, US", "Mumbai, IN"];

const generateStructuredTelemetry = () => {
  const records = [];
  let id = 1000;

  // Distribute 210 incidents over the last 90 days with realistic weekly surges
  for (let day = 0; day < 90; day++) {
    // Weekend vs weekday pattern
    const isWeekend = (day % 7 === 0 || day % 7 === 6);
    const incidentCount = isWeekend ? 1 : (day < 14 ? 4 : (day < 45 ? 3 : 2));

    for (let j = 0; j < incidentCount; j++) {
      const profileIndex = (day * 3 + j * 7 + (id % 5)) % threatProfiles.length;
      const base = threatProfiles[profileIndex];
      
      const recordDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000 - (j * 3 + 1) * 3600 * 1000);
      const isFake = base.prediction === "Fake";
      
      // Slight deterministic variance
      const riskScore = isFake ? Math.min(100, base.risk + (id % 7) - 3) : Math.max(5, base.risk + (id % 9) - 4);
      const confidence = isFake ? riskScore : (100 - riskScore);

      records.push({
        id: id++,
        date: recordDate.toISOString(),
        company: base.company,
        role: base.role,
        category: base.category,
        prediction: base.prediction,
        riskScore,
        confidence,
        flagCount: base.flags,
        location: locations[(id + day) % locations.length]
      });
    }
  }

  return records.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const mockAnalyticsData = generateStructuredTelemetry();

