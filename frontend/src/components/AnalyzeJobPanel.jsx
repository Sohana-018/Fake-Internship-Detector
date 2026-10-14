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
  const isInvalidLength = wordCount > 0 && wordCount < 15;
  const isTooLong = wordCount > 800;

  const handleClear = () => {
    setText("");
    setResult(null);
    setError("");
  };

  const handleLoadRandomSample = (e) => {
    e.preventDefault();
    const randomJob = sampleJobs[Math.floor(Math.random() * sampleJobs.length)];
    setText(randomJob.text);
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
        onSaveHistory({ text: text.substring(0, 60) + "...", prediction: data.prediction, risk: data.risk_score });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the verification server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel animate-fade-in">
      <label htmlFor="jobText">Paste the full job description below for AI verification:</label>
      <textarea 
        id="jobText"
        maxLength={3500} 
        placeholder="E.g., We are looking for an immediate starter. Paid training available for $500 upfront..." 
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        aria-describedby="text-help"
        style={{ marginBottom: '5px' }}
      ></textarea>
      
      <div id="text-help" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '15px', color: (isInvalidLength || isTooLong) ? 'var(--danger)' : 'var(--text-muted)' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span>{wordCount} words</span>
          <a href="#" onClick={handleLoadRandomSample} style={{ color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}>Try an example</a>
        </div>
        {isInvalidLength && <span>Minimum 15 words required for accuracy.</span>}
        {isTooLong && <span>Maximum 800 words exceeded.</span>}
      </div>

      <div className="flex-row">
        <button 
          className="btn btn-primary" 
          onClick={analyzeJob} 
          disabled={loading || wordCount < 15 || wordCount > 800}
          style={{ flex: 1 }}
        >
          {loading ? <span className="spinner"></span> : "Verify Authenticity"}
        </button>
        <button 
          className="btn btn-outline" 
          onClick={handleClear} 
          disabled={loading || (!text && !result && !error)}
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="panel animate-fade-in mt-3" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '15px' }}>
          <p className="text-danger" style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '0.9rem' }}>{error}</p>
          <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={analyzeJob}>Retry Scan</button>
        </div>
      )}

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
