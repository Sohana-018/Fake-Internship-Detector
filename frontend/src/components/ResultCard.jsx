const getIconForFlag = (flag) => {
  const lower = flag.toLowerCase();
  if (lower.includes('fee') || lower.includes('pay') || lower.includes('deposit') || lower.includes('ctc')) return '💰';
  if (lower.includes('email') || lower.includes('gmail')) return '📧';
  if (lower.includes('aadhaar') || lower.includes('pan') || lower.includes('document')) return '🪪';
  if (lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('contact')) return '📱';
  if (lower.includes('stipend') || lower.includes('salary')) return '🤑';
  if (lower.includes('link') || lower.includes('redirect')) return '🔗';
  if (lower.includes('eligibility') || lower.includes('phishing')) return '⚠️';
  if (lower.includes('impersonat') || lower.includes('corporate')) return '🎭';
  return '🚩';
};

const ResultCard = ({ result, onReport }) => {
  if (!result) return null;

  const isFake = result.prediction === "Fake";
  const riskScore = result.risk_score;
  const authenticity = 100 - riskScore;
  const badgeClass = isFake ? "fake" : "genuine";
  const badgeText = isFake ? "CRITICAL THREAT: SCAM" : "VERIFIED LEGITIMATE";

  // Deduplicate and filter out composite concatenated strings
  let allFlags = [];
  if (Array.isArray(result.flags) && result.flags.length > 0) {
    allFlags = [...result.flags];
  } else if (result.reason && !result.reason.startsWith("High risk based") && !result.reason.startsWith("Model inference")) {
    allFlags = result.reason.split(",").map(s => s.trim()).filter(Boolean);
  }

  // Deduplicate and remove any concatenated duplicate entry
  allFlags = allFlags.filter((flag, index, self) => {
    if (self.indexOf(flag) !== index) return false;
    if (flag.includes(",")) {
      const parts = flag.split(",").map(p => p.trim());
      const allPartsExist = parts.every(part => self.some(other => other !== flag && other.toLowerCase() === part.toLowerCase()));
      if (allPartsExist) return false;
    }
    return true;
  });

  const ling = result.linguistics;

  return (
    <div className="verdict-card animate-fade-in" style={{ borderColor: isFake ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)' }}>
      
      {/* Verdict Header */}
      <div className="verdict-header">
        <div className="verdict-title-group">
          <h3>Forensic Verification Verdict</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Evaluated by TF-IDF vector pipeline + regex rule heuristics engine
          </p>
        </div>
        <span className={`verdict-badge ${badgeClass}`}>
          {isFake ? '🚨' : '🛡️'} {badgeText}
        </span>
      </div>

      {/* Dual Metrics Grid */}
      <div className="verdict-meters-grid">
        <div className="meter-col">
          <div className="meter-col-title">
            <span>Threat / Scam Probability</span>
            <span style={{ color: isFake ? 'var(--danger)' : 'var(--text-muted)' }}>{riskScore}%</span>
          </div>
          <div className="meter-track">
            <div 
              className="meter-fill" 
              style={{ width: `${riskScore}%`, background: isFake ? 'var(--danger)' : 'var(--text-muted)' }}
            ></div>
          </div>
        </div>

        <div className="meter-col">
          <div className="meter-col-title">
            <span>Authenticity Confidence</span>
            <span style={{ color: !isFake ? 'var(--success)' : 'var(--text-muted)' }}>{authenticity}%</span>
          </div>
          <div className="meter-track">
            <div 
              className="meter-fill" 
              style={{ width: `${authenticity}%`, background: !isFake ? 'var(--success)' : 'var(--text-muted)' }}
            ></div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Dual Forensic Analysis (Threat Indicators + Linguistic Profile) */}
      <div className="verdict-analysis-grid">
        
        {/* Left: Detected Threat Indicators (or Clean Security State) */}
        <div className="indicators-section">
          <h4 className="indicators-title">
            <span>{allFlags.length > 0 ? '🚩' : '🛡️'}</span> 
            {allFlags.length > 0 ? `Detected Threat Indicators (${allFlags.length})` : 'Security Rule Heuristics'}
          </h4>

          {allFlags.length > 0 ? (
            <div className="indicators-list">
              {allFlags.map((flag, idx) => (
                <div key={idx} className="indicator-item">
                  <span style={{ fontSize: '1.15rem' }}>{getIconForFlag(flag)}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{flag}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>High-confidence rule trigger</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="clean-status-box">
              <span className="clean-icon">✅</span>
              <strong>No Critical Scam Patterns Detected</strong>
              <p>Zero rule triggers across payment demands, unverified domains, or off-platform contact redirection.</p>
            </div>
          )}
        </div>

        {/* Right: Forensic Text Profile (Informational signals only) */}
        {ling && (
          <div className="forensic-profile-section">
            <div className="forensic-profile-header">
              <div className="forensic-profile-title-group">
                <div className="forensic-profile-title">
                  <span>📊</span>
                  <h4>Forensic Text Profile</h4>
                  <span className="informational-tag">Informational</span>
                </div>
                <p className="forensic-profile-subtitle">
                  Structural signals from text (does not alter model confidence).
                </p>
              </div>
            </div>

            <div className="forensic-profile-grid-2x2">
              {/* 1. Message Length */}
              <div className="profile-stat-card">
                <div className="profile-stat-top">
                  <span className="profile-stat-icon">📝</span>
                  <span className="profile-pill">{ling.length_label || "Standard"}</span>
                </div>
                <div className="profile-stat-value">
                  {ling.word_count} <span className="profile-stat-unit">words</span>
                </div>
                <div className="profile-stat-sub">
                  {ling.char_count} chars ({ling.avg_word_len} avg/word)
                </div>
              </div>

              {/* 2. Vocabulary Diversity */}
              <div className="profile-stat-card">
                <div className="profile-stat-top">
                  <span className="profile-stat-icon">🔤</span>
                  <span className="profile-pill">{ling.diversity_label || "Moderate"}</span>
                </div>
                <div className="profile-stat-value">
                  {ling.lexical_diversity}% <span className="profile-stat-unit">unique</span>
                </div>
                <div className="profile-stat-sub">
                  {ling.unique_words} unique words
                </div>
              </div>

              {/* 3. Punctuation Urgency */}
              <div className="profile-stat-card">
                <div className="profile-stat-top">
                  <span className="profile-stat-icon">⚡</span>
                  <span className="profile-pill">{ling.punctuation_label || "Standard"}</span>
                </div>
                <div className="profile-stat-value">
                  {ling.total_punctuation ?? (ling.exclamation_count + ling.question_count)} <span className="profile-stat-unit">marks</span>
                </div>
                <div className="profile-stat-sub">
                  {ling.exclamation_count} excl • {ling.question_count} ques
                </div>
              </div>

              {/* 4. Capitalization Density */}
              <div className="profile-stat-card">
                <div className="profile-stat-top">
                  <span className="profile-stat-icon">🔠</span>
                  <span className="profile-pill">{ling.casing_label || "Standard"}</span>
                </div>
                <div className="profile-stat-value">
                  {ling.uppercase_ratio}% <span className="profile-stat-unit">uppercase</span>
                </div>
                <div className="profile-stat-sub">
                  Capital letter distribution
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Recommended Action Advisory */}
      {isFake ? (
        <div className="advisory-box danger">
          <div>
            <strong>⚠️ Security Advisory:</strong> This posting exhibits critical fraud patterns (unverified domains, payment requests, or brand impersonation). Do not transfer any funds, share Aadhaar/PAN cards, or continue communications over unauthorized channels.
          </div>
          <button className="btn-report-threat" onClick={onReport}>
            📑 Escalate to Global Threat Database
          </button>
        </div>
      ) : (
        <div className="advisory-box success">
          <div>
            <strong>🛡️ Verification Note:</strong> No critical fraud indicators or threat markers were identified in this posting text. Standard employment guidelines apply (never pay upfront fees for job materials or training).
          </div>
        </div>
      )}

    </div>
  );
};

export default ResultCard;
