import { useState, useEffect } from 'react';
import { USE_DUMMY_DATA } from '../api';

const ReportScamPanel = ({ initialDescription, initialReason }) => {
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState(initialDescription || "");
  const [reason, setReason] = useState(initialReason || "");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDescription && initialDescription !== description) {
      setDescription(initialDescription);
    }
    if (initialReason && initialReason !== reason) {
      setReason(initialReason);
    }
  }, [initialDescription, initialReason, description, reason]);

  const submitReport = async () => {
    if (!description.trim()) return alert("Please provide the text of the fraudulent job posting.");

    setLoading(true);
    setMsg("");
    
    if (USE_DUMMY_DATA) {
      setTimeout(() => {
        setMsg("✅ Report saved to threat database successfully!");
        setCompany("");
        setDescription("");
        setReason("");
        setLoading(false);
      }, 700);
      return;
    }

    try {
      const response = await fetch("/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company.trim() || "Unknown", description, reason })
      });
      const data = await response.json();
      if (response.ok) {
        setMsg("✅ " + data.message);
        setCompany("");
        setDescription("");
        setReason("");
      } else {
        setMsg("❌ " + (data.message || "Failed to submit report"));
      }
    } catch {
      setMsg("❌ Failed to reach backend database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-console-card animate-fade-in">
      <div className="scanner-top-bar" style={{ marginBottom: '18px' }}>
        <span className="scanner-label">
          <span>📑</span> Community Threat Escalation Portal
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          SQLite Persistent Storage • Community Defense
        </span>
      </div>

      <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
        Submit verified fake internship drives, scam offers, or extortion messages to the centralized database to protect other students and train future detection heuristics. <em style={{ fontSize: '0.84rem', opacity: 0.85 }}>(Note: The community report database is unmoderated and intended for research and public-interest review.)</em>
      </p>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="companyName" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Impersonated Brand / Company Name
        </label>
        <input 
          id="companyName"
          type="text" 
          className="scanner-textarea"
          style={{ minHeight: 'unset', height: '42px', padding: '10px 14px' }}
          placeholder="e.g. TCS, Infosys, TechCorp, Amazon..." 
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="reportDesc" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Fraudulent Posting Text <span style={{ color: '#f43f5e' }}>*</span>
        </label>
        <textarea 
          id="reportDesc"
          className="scanner-textarea"
          placeholder="Paste the full job email, WhatsApp message, or website listing here..." 
          required 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
        ></textarea>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="reportReason" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Observed Red Flags / Rationale
        </label>
        <input 
          id="reportReason"
          type="text" 
          className="scanner-textarea"
          style={{ minHeight: 'unset', height: '42px', padding: '10px 14px' }}
          placeholder="e.g. Requested ₹5,000 laptop deposit, Unofficial talentsjobs.in link" 
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <button 
        className="btn-scan-primary" 
        onClick={submitReport} 
        disabled={loading || !description.trim()}
        style={{ width: '100%', background: 'var(--danger)' }}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            <span>Submitting to Database...</span>
          </>
        ) : (
          <>
            <span>🚨</span>
            <span>Record Scam in Global Threat Database</span>
          </>
        )}
      </button>

      {msg && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px 16px', 
          borderRadius: '10px', 
          background: msg.startsWith('✅') ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
          border: `1px solid ${msg.startsWith('✅') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          color: msg.startsWith('✅') ? 'var(--success)' : 'var(--danger)', 
          fontWeight: 700, 
          textAlign: 'center', 
          fontSize: '0.9rem' 
        }}>
          {msg}
        </div>
      )}
    </div>
  );
};

export default ReportScamPanel;
