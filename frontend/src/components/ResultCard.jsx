const getIconForFlag = (flag) => {
  const lower = flag.toLowerCase();
  if (lower.includes('fee') || lower.includes('pay') || lower.includes('deposit')) return '💰';
  if (lower.includes('email') || lower.includes('gmail')) return '📧';
  if (lower.includes('aadhaar') || lower.includes('pan') || lower.includes('document')) return '🪪';
  if (lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('contact')) return '📱';
  if (lower.includes('stipend') || lower.includes('salary')) return '🤑';
  return '🚩';
};

const ResultCard = ({ result, onReport }) => {
  if (!result) return null;

  const isFake = result.prediction === "Fake";
  const confidence = isFake ? result.risk_score : 100 - result.risk_score;
  const badgeColor = isFake ? "var(--danger)" : "var(--success)";
  const badgeText = isFake ? "Suspicious / Fake" : "Likely Genuine";

  const allFlags = [...(result.flags || [])];
  if (result.reason && !allFlags.includes(result.reason)) {
    allFlags.push(result.reason);
  }

  return (
    <div className="panel animate-fade-in mt-3" style={{ border: `2px solid ${badgeColor}`, background: 'var(--bg-main)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Verification Result</h3>
        <span style={{ 
          background: badgeColor, 
          color: 'white', 
          padding: '6px 14px', 
          borderRadius: '50px', 
          fontWeight: '600',
          fontSize: '0.9rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {isFake ? '🚨' : '✅'} {badgeText}
        </span>
      </div>

      <div className="mt-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: '500' }}>
          <span>Confidence Score</span>
          <span style={{ color: badgeColor, fontWeight: '700' }}>{confidence}%</span>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${confidence}%`, background: badgeColor }}></div>
        </div>
      </div>

      {allFlags.length > 0 && (
        <div className="mt-3" style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>Why was this flagged?</h4>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', color: 'var(--text-main)', fontSize: '0.9rem' }}>
            {allFlags.map((flag, idx) => (
              <li key={idx} style={{ marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem' }}>{getIconForFlag(flag)}</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {!isFake && allFlags.length === 0 ? (
        <p className="text-muted mt-3" style={{ fontSize: '0.9rem', margin: '15px 0 0 0' }}>
          No critical threat indicators were found in the language of this posting. However, always exercise standard caution.
        </p>
      ) : isFake ? (
        <div className="mt-3" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <p style={{ margin: '0 0 15px 0', color: 'var(--danger)', fontWeight: '600', fontSize: '0.95rem' }}>
            ⚠️ Recommendation: Do not pay any fee, share ID documents, or proceed with unverified Telegram/WhatsApp interviews.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={onReport}>
            Report this scam
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ResultCard;
