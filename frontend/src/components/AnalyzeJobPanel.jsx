import { useState, useRef, useEffect } from 'react';
import ResultCard from './ResultCard';
import { analyzeJobText } from '../api';
import { sampleJobs } from '../data/dummyData';

const AnalyzeJobPanel = ({ onReport, onSaveHistory }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
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

  const handleLoadRandomSample = (e) => {
    if (e) e.preventDefault();
    const randomJob = sampleJobs[Math.floor(Math.random() * sampleJobs.length)];
    setText(randomJob.text);
    setError("");
  };

  const analyzeJob = async () => {
    if (wordCount < 15 || wordCount > 800) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await analyzeJobText(text);
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
    <div className="scanner-console-card animate-fade-in">
      
      {/* Console Top Toolbar */}
      <div className="scanner-top-bar">
        <span className="scanner-label">
          <span>📄</span> Content Inspection Terminal
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Max 3,500 chars • Natural Language Parser v2.4
        </span>
      </div>

      {/* Preset Quick-Load Strip */}
      <div className="presets-strip">
        <span className="presets-label">⚡ Load Sample:</span>
        <button type="button" className="preset-chip" onClick={() => loadPreset(6)}>
          🎭 TCS Drive Phishing
        </button>
        <button type="button" className="preset-chip" onClick={() => loadPreset(2)}>
          💰 Data Entry Fee Trap
        </button>
        <button type="button" className="preset-chip" onClick={() => loadPreset(1)}>
          🛡️ Verified SDE Intern
        </button>
        <button type="button" className="preset-chip" onClick={() => loadPreset(7)}>
          ⚖️ Borderline Startup
        </button>
      </div>

      {/* Textarea Inspector */}
      <textarea 
        id="jobText"
        className="scanner-textarea"
        maxLength={3500} 
        placeholder="Paste full recruitment message, internship drive email, or job posting description here for NLP threat inspection..." 
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
      ></textarea>
      
      {/* Inspection Footer Metrics */}
      <div className="scanner-footer-bar">
        <div className="scanner-metrics">
          <span style={{ fontWeight: 600, color: (isInvalidLength || isTooLong) ? 'var(--danger)' : 'var(--text-main)' }}>
            {wordCount} words
          </span>
          <span>•</span>
          <span>{charCount} / 3500 characters</span>
          <span>•</span>
          <button 
            type="button" 
            onClick={handleLoadRandomSample}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', fontWeight: 600 }}
          >
            Try an example
          </button>
        </div>

        <div>
          {isInvalidLength && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Minimum 15 words required for model confidence.</span>}
          {isTooLong && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Maximum 800 words exceeded.</span>}
          {!isInvalidLength && !isTooLong && wordCount >= 15 && (
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Ready for analysis</span>
          )}
        </div>
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
              <span>Running NLP & Heuristics Pipeline...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Run Threat & Authenticity Analysis</span>
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
        <div style={{ marginTop: '16px', padding: '14px 18px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px' }}>
          <p style={{ margin: '0 0 8px 0', color: 'var(--danger)', fontWeight: '700', fontSize: '0.88rem' }}>{error}</p>
          <button className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '4px 10px' }} onClick={analyzeJob}>
            Retry Inspection
          </button>
        </div>
      )}

      {/* Render Result Card */}
      {result && (
        <div ref={resultRef} style={{ scrollMarginTop: '80px' }}>
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
