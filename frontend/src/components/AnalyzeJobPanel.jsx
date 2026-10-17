import { useState, useRef, useEffect } from 'react';
import ResultCard from './ResultCard';
import PipelineTracker from './PipelineTracker';
import { analyzeJobText } from '../api';
import { sampleJobs } from '../data/dummyData';

const AnalyzeJobPanel = ({ onReport, onSaveHistory }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [showTactics, setShowTactics] = useState(false);
  
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current && window.innerWidth < 1024) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const isInvalidLength = wordCount > 0 && wordCount < 15;
  const isTooLong = wordCount > 800;

  const handleClear = () => {
    setText("");
    setResult(null);
    setError("");
  };

  const loadPreset = (jobId) => {
    const job = sampleJobs.find(j => j.id === jobId) || sampleJobs[0];
    setText(job.text);
    setError("");
  };

  const analyzeJob = async () => {
    if (wordCount < 15 || wordCount > 800) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const startTime = Date.now();
      const data = await analyzeJobText(text);

      // Provide natural pacing so the pipeline analysis is comfortably visible
      const elapsed = Date.now() - startTime;
      const minPacing = 1200;
      if (elapsed < minPacing) {
        await new Promise(resolve => setTimeout(resolve, minPacing - elapsed));
      }

      setResult(data);
      
      if (onSaveHistory) {
        onSaveHistory({ 
          text: text.substring(0, 65) + "...", 
          prediction: data.prediction, 
          risk: data.risk_score 
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the threat verification engine. Please verify the Flask server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`scan-workspace ${result || loading ? 'has-result' : ''}`}>
      
      {/* Form Console Card */}
      <div className="scanner-console-card animate-fade-in">
        
        {/* Plain Form Label */}
        <label htmlFor="jobText" className="scanner-form-label">
          Paste the job posting
        </label>

        {/* Textarea Inspector (at least 10 rows filling card height) */}
        <textarea 
          id="jobText"
          className="scanner-textarea"
          maxLength={3500} 
          placeholder="Paste full recruitment message, internship drive email, or job posting description here to check for scam signs..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
        ></textarea>
        
        {/* Inspection Footer Metrics */}
        <div className="scanner-footer-bar">
          <div className="scanner-metrics">
            <span style={{ fontWeight: 600, color: (isInvalidLength || isTooLong) ? 'var(--danger)' : 'var(--text-main)' }}>
              {wordCount} words
            </span>
            <span>•</span>
            <span>{charCount} / 3500 chars</span>
          </div>

          <div>
            {isInvalidLength && <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.78rem' }}>⚠️ Min 15 words required.</span>}
            {isTooLong && <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.78rem' }}>⚠️ Max 800 words exceeded.</span>}
            {!isInvalidLength && !isTooLong && wordCount >= 15 && (
              <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.78rem' }}>✓ Ready for analysis</span>
            )}
          </div>
        </div>

        {/* Preset Sample Quick-Load Strip (single compact row under textarea) */}
        <div className="presets-strip">
          <span className="presets-label">Try an example:</span>
          <button type="button" className="preset-chip" onClick={() => loadPreset(6)}>
            🎭 TCS Phishing
          </button>
          <button type="button" className="preset-chip" onClick={() => loadPreset(2)}>
            💰 Fee Trap
          </button>
          <button type="button" className="preset-chip" onClick={() => loadPreset(1)}>
            🛡️ Genuine Intern
          </button>
          <button type="button" className="preset-chip" onClick={() => loadPreset(7)}>
            ⚖️ Borderline
          </button>
        </div>

        {/* Optional Collapsible Common Scam Signs Helper */}
        <div className="scam-signs-wrapper">
          <button
            type="button"
            className="scam-signs-toggle-link"
            onClick={() => setShowTactics(prev => !prev)}
            aria-expanded={showTactics}
          >
            <span>{showTactics ? '▴' : '▾'}</span>
            <span>What are common scam signs?</span>
          </button>

          {showTactics && (
            <div className="scam-signs-drawer animate-fade-in">
              <div className="scam-signs-list">
                <div className="scam-sign-item">
                  <span className="scam-sign-icon">💳</span>
                  <div className="scam-sign-content">
                    <strong>Upfront Fees:</strong> Asks for a registration, training or &quot;refundable&quot; fee
                  </div>
                </div>
                <div className="scam-sign-item">
                  <span className="scam-sign-icon">📱</span>
                  <div className="scam-sign-content">
                    <strong>Chat-Only Screening:</strong> Interview or offer only on WhatsApp/Telegram
                  </div>
                </div>
                <div className="scam-sign-item">
                  <span className="scam-sign-icon">🪪</span>
                  <div className="scam-sign-content">
                    <strong>Early ID Collection:</strong> Requests Aadhaar, PAN or bank details early
                  </div>
                </div>
                <div className="scam-sign-item">
                  <span className="scam-sign-icon">📧</span>
                  <div className="scam-sign-content">
                    <strong>Free Webmail Contact:</strong> Official-sounding company name but a Gmail/Yahoo/Outlook contact
                  </div>
                </div>
                <div className="scam-sign-item">
                  <span className="scam-sign-icon">⏳</span>
                  <div className="scam-sign-content">
                    <strong>Artificial Urgency:</strong> Pressure phrases like &quot;limited seats&quot; or &quot;apply within 24 hours&quot;
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action CTA Bar */}
        <div className="scanner-action-bar">
          <button 
            className="btn-scan-primary" 
            onClick={analyzeJob} 
            disabled={loading || wordCount < 15 || wordCount > 800}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Checking Posting...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Check Posting</span>
              </>
            )}
          </button>

          <button 
            className="btn-scan-clear" 
            onClick={handleClear} 
            disabled={loading || (!text && !result && !error)}
          >
            Clear
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px' }}>
            <p style={{ margin: '0 0 8px 0', color: 'var(--danger)', fontWeight: '700', fontSize: '0.85rem' }}>{error}</p>
            <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={analyzeJob}>
              Retry Inspection
            </button>
          </div>
        )}

      </div>

      {/* Result Column (Side by side on desktop, stacked below on mobile) */}
      {loading && (
        <div ref={resultRef} className="scan-result-col animate-fade-in">
          <div className="verdict-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="verdict-header-row">
              <h3 className="verdict-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                Analyzing Posting Text...
              </h3>
            </div>
            <PipelineTracker loading={true} />
          </div>
        </div>
      )}

      {!loading && result && (
        <div ref={resultRef} className="scan-result-col animate-fade-in">
          <ResultCard 
            result={result} 
            onReport={() => onReport({ reason: result.reason, description: text })} 
          />
        </div>
      )}

    </div>
  );
};

export default AnalyzeJobPanel;
