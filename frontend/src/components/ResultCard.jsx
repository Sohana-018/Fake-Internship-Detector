import { useState } from 'react';
import PipelineTracker from './PipelineTracker';

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
  const [showAllFlags, setShowAllFlags] = useState(false);

   const isFake = result.prediction === "Fake";
  const riskScore = result.risk_score;
  const badgeClass = isFake ? "fake" : "genuine";
  const badgeText = isFake ? "LIKELY SCAM" : "LIKELY GENUINE";

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

  const displayedFlags = showAllFlags ? allFlags : allFlags.slice(0, 4);

  return (
    <div className="verdict-card animate-fade-in" style={{ borderColor: isFake ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)' }}>
      
      {/* 1. Compact Header Row: Title on the left, verdict badge on the right in one line */}
      <div className="verdict-header-row">
        <div className="verdict-title-wrap">
          <h3 className="verdict-title">Result</h3>
        </div>
        <span className={`verdict-badge ${badgeClass}`}>
          {isFake ? '🚨' : '🛡️'} {badgeText}
        </span>
      </div>

      {/* 2. Second Row: Scam probability bar at full width, slim (about 10px) */}
      <div className="verdict-meter-slim">
        <div className="meter-slim-header">
          <span className="meter-slim-label">Scam risk</span>
          <span className={`meter-slim-value ${isFake ? 'text-danger' : 'text-success'}`}>{riskScore}%</span>
        </div>
        <div className="meter-slim-track">
          <div 
            className="meter-slim-fill" 
            style={{ 
              width: `${Math.max(riskScore, 4)}%`, 
              background: isFake ? 'var(--danger)' : 'var(--success)' 
            }}
          ></div>
        </div>
      </div>

      {/* 3. Third Row: Two Columns on desktop (about 60% Left, 40% Right) */}
      <div className="verdict-content-grid">
        
        {/* Left Column (about 60%): Warning signs found (compact 2-column grid of small cards, max 4 + Show all) */}
        <div className="indicators-col">
          <div className="indicators-header-row">
            <h4 className="indicators-title">
              <span>{allFlags.length > 0 ? '🚩' : '🛡️'}</span> 
              <span>{allFlags.length > 0 ? `Warning signs found (${allFlags.length})` : 'No warning signs found'}</span>
            </h4>
            {allFlags.length > 4 && (
              <button 
                type="button" 
                className="btn-toggle-all-flags" 
                onClick={() => setShowAllFlags(prev => !prev)}
              >
                {showAllFlags ? 'Show fewer ▴' : `Show all (${allFlags.length}) ▾`}
              </button>
            )}
          </div>

          {allFlags.length > 0 ? (
            <div className="indicators-compact-grid">
              {displayedFlags.map((flag, idx) => (
                <div key={idx} className="indicator-mini-card">
                  <span className="indicator-mini-icon">{getIconForFlag(flag)}</span>
                  <div className="indicator-mini-text">
                    <strong className="indicator-mini-title">{flag}</strong>
                    <span className="indicator-mini-desc">High-confidence rule trigger</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="clean-status-box compact">
              <span className="clean-icon">✅</span>
              <div className="clean-status-text">
                <strong>No warning signs found</strong>
                <p>Zero rule triggers across payment demands, unverified domains, or off-platform contacts.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (about 40%): Short "What to do" box and "Report this scam" button */}
        <div className="action-col">
          <div className={`what-to-do-card ${isFake ? 'is-fake' : 'is-legit'}`}>
            <div className="what-to-do-header">
              <span>{isFake ? '⚠️' : '🛡️'}</span>
              <strong>What to do</strong>
            </div>
            <p className="what-to-do-desc">
              {isFake 
                ? "Do not pay any fee, deposit or share Aadhaar/PAN documents. Always verify job postings on the official corporate careers page."
                : "This checks the posting text only. Always verify the company on its official website."
              }
            </p>
            {isFake && (
              <button type="button" className="btn-report-scam-direct" onClick={onReport}>
                <span>🚨</span>
                <span>Report this scam</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 4. Fourth Row: Detection Workflow Tracker (collapsed by default as a single slim bar) */}
      <PipelineTracker 
        pipeline={result.pipeline} 
        isFake={isFake} 
        riskScore={riskScore}
        defaultCollapsed={true}
      />

    </div>
  );
};

export default ResultCard;
