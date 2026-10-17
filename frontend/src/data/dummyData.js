export const sampleJobs = [
  {
    id: 1,
    title: "Genuine: Software Engineer Intern at TechCorp",
    text: "We are looking for a Software Engineer Intern to join our team in San Francisco. You will work on our core web application using React and Node.js. Requirements: Currently pursuing a BS in Computer Science, familiarity with JavaScript, and a passion for learning. We offer a competitive stipend of $35/hr and housing assistance. Please apply via our official careers portal.",
    result: {
      prediction: "Legitimate",
      risk_score: 15,
      flags: [],
      reason: "No critical threat indicators were found in the language of this posting."
    }
  },
  {
    id: 2,
    title: "Fake: Urgent Data Entry - High Pay",
    text: "URGENT! Limited seats available! We are hiring remote data entry clerks immediately. No experience needed! Earn $5000 a week working 2 hours a day. You must pay a fully refundable registration fee of $50 via CashApp to secure your laptop and software. Contact our HR manager immediately on WhatsApp at +1234567890 or Telegram @DataEntryJobs.",
    result: {
      prediction: "Fake",
      risk_score: 98,
      flags: ["Payment Request Detected", "Urgency Pressure", "WhatsApp/Telegram Contact"],
      reason: "Payment Request Detected, Urgency Pressure, WhatsApp/Telegram Contact"
    }
  },
  {
    id: 3,
    title: "Genuine: Marketing Coordinator",
    text: "Join our vibrant marketing team in New York. We need an enthusiastic coordinator to help manage social media campaigns, draft newsletters, and assist with event planning. 1-2 years of experience preferred. Salary range $50k-$60k plus health, dental, and 401k matching. Apply by sending your resume to jobs@realcompany.com.",
    result: {
      prediction: "Legitimate",
      risk_score: 8,
      flags: [],
      reason: "No critical threat indicators were found in the language of this posting."
    }
  },
  {
    id: 4,
    title: "Fake: Crypto Trading Assistant",
    text: "Immediate hire! We need an assistant to process crypto transactions. We will send you funds, and you simply buy crypto and send it to our client wallets. You keep 10% as your pay! Very easy money. Hurry, this opportunity won't last long. Email your details to cryptohustle123@gmail.com to start right away.",
    result: {
      prediction: "Fake",
      risk_score: 85,
      flags: ["Urgency Pressure"],
      reason: "High risk score based on language"
    }
  },
  {
    id: 5,
    title: "Fake: Admin Assistant - Deposit Required",
    text: "We are a top global company looking for a remote administrative assistant. To process your background check and send your home office equipment, a deposit of $150 is required upfront, which will be reimbursed in your first paycheck. Please reach out to us on Telegram immediately.",
    result: {
      prediction: "Fake",
      risk_score: 92,
      flags: ["Payment Request Detected", "WhatsApp/Telegram Contact"],
      reason: "Payment Request Detected, WhatsApp/Telegram Contact"
    }
  },
  {
    id: 6,
    title: "Fake: TCS Internship Drive Phishing Email",
    text: "Dear Students/Placement Officer, We are pleased to inform you about an exciting TCS Internship Hiring Drive for eligible students from your institution. Apply now at https://hiring.talentsjobs.in/links/sWBXEnsfCbCPkGDuDfiMcvVzhJFaIFMBGdDuFYPCAfGMVHXCaMUAVAwPbMScaZMBwdDuFyMDKSfKMk/4098880. Position: Internship and Full-Time Opportunity. Stipend: ₹40,000 per month. CTC (Post Internship): ₹12–15 LPA. All College Students Eligible. Branches & Gender: All Eligible. Limited openings – Early applications are highly encouraged. [CLICK HERE FOR APPLY - LIMITED VACANCIES!]",
    result: {
      prediction: "Fake",
      risk_score: 95,
      flags: [
        "Suspicious Link / Third-Party Redirect",
        "Unrealistic Blanket Eligibility / Mass Phishing",
        "Impersonated Corporate Drive",
        "Unrealistic Pay / Exaggerated CTC"
      ],
      reason: "Impersonated Corporate Drive, Suspicious Link / Third-Party Redirect"
    }
  },
  {
    id: 7,
    title: "Borderline Genuine: Content Marketing Intern (~51% Authenticity)",
    text: "Early-stage startup seeking a motivated content writing intern to assist our social media marketing campaigns, prepare blog outlines, and engage our audience. 10 hours per week, flexible schedule, stipend provided upon project completion. Please email your portfolio and resume to startupcrew2024@gmail.com to apply.",
    result: {
      prediction: "Legitimate",
      risk_score: 49,
      flags: ["Free Email Domain"],
      reason: "Free Email Domain"
    }
  }
];

export const sampleHistory = [
  { text: "URGENT! Limited seats available! We are hiring remo...", prediction: "Fake", risk: 98 },
  { text: "We are looking for a Software Engineer Intern to join...", prediction: "Legitimate", risk: 15 },
  { text: "We are a top global company looking for a remote ad...", prediction: "Fake", risk: 92 }
];

export const sampleNews = [
  {
    title: "Beware of WhatsApp Remote Work Scams",
    description: "Cybersecurity experts warn of a massive spike in WhatsApp job offers asking for upfront laptop fees...",
    pubDate: "2023-11-20",
    link: "https://thehackernews.com/"
  },
  {
    title: "Top 5 Tactics of Fake Internship Offers",
    description: "From immediate joining promises to using free email domains, here is how scammers are targeting students...",
    pubDate: "2023-11-19",
    link: "https://thehackernews.com/"
  },
  {
    title: "Identity Theft via Fake Job Applications",
    description: "New report shows a 40% increase in scammers requesting Aadhaar and PAN cards before any interview takes place...",
    pubDate: "2023-11-18",
    link: "https://thehackernews.com/"
  }
];
