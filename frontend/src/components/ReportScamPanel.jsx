import { useState, useEffect } from 'react';
import { USE_DUMMY_DATA } from '../api';

const ReportScamPanel = ({ initialDescription, initialReason }) => {
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDescription) setDescription(initialDescription);
    if (initialReason) setReason(initialReason);
  }, [initialDescription, initialReason]);

  const submitReport = async () => {
    if (!description) return alert("Please provide a description of the scam!");

    setLoading(true);
    setMsg("");
    
    // Demo mode dummy success
    if (USE_DUMMY_DATA) {
      setTimeout(() => {
        setMsg("✅ Report saved to dummy database successfully!");
        setCompany("");
        setDescription("");
        setReason("");
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch("/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company || "Unknown", description, reason })
      });
      const data = await response.json();
      if (response.ok) {
        setMsg("✅ " + data.message);
        setCompany("");
        setDescription("");
        setReason("");
      } else {
        setMsg("❌ " + (data.message || "Error submitting report"));
      }
    } catch (err) {
      setMsg("❌ Error submitting report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0 0 20px 0' }}>
        Help the community by submitting verified scams to our global database.
      </p>
      
      <label htmlFor="companyName">Impersonated Company Name (Optional)</label>
      <input 
        id="companyName"
        type="text" 
        placeholder="e.g. Google, Amazon, etc." 
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />

      <label htmlFor="reportDesc">Scam Job Description <span className="text-danger">*</span></label>
      <textarea 
        id="reportDesc"
        placeholder="Paste the fraudulent job posting here..." 
        required 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
      ></textarea>
      
      <label htmlFor="reportReason">Flags / Reason (Auto-filled if scanned)</label>
      <input 
        id="reportReason"
        type="text" 
        placeholder="Why is this a scam? (e.g. Requests upfront fee)" 
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      
      <button 
        className="btn btn-danger" 
        onClick={submitReport} 
        disabled={loading || !description}
        style={{ width: '100%', marginTop: '10px' }}
      >
        {loading ? <span className="spinner"></span> : "Submit to Threat Database"}
      </button>
      
      {msg && (
        <div className="mt-3" style={{ padding: '10px', borderRadius: '8px', background: msg.startsWith('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: msg.startsWith('✅') ? 'var(--success)' : 'var(--danger)', fontWeight: '600', textAlign: 'center', fontSize: '0.9rem' }}>
          {msg}
        </div>
      )}
    </div>
  );
};

export default ReportScamPanel;
