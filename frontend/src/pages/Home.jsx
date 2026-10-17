import { useState } from 'react';
import AnalyzeJobPanel from '../components/AnalyzeJobPanel';
import ReportScamPanel from '../components/ReportScamPanel';
import '../styles/home.css';

const Home = () => {
  const [reportData, setReportData] = useState({ description: "", reason: "" });
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("scan");

  const handleReportScam = ({ reason, description }) => {
    setReportData({ reason, description });
    setActiveTab("report");
  };

  const handleSaveHistory = (entry) => {
    setHistory(prev => [entry, ...prev].slice(0, 5));
  };

  return (
    <div className="home-page animate-fade-in">

      {/* Header Section */}
      <div className="home-header-section">
        <h1>Job & Internship Fraud Scanner</h1>
        <p className="home-subtitle">Paste a job or internship posting to check for scam signs</p>
      </div>

      {/* Centered Single-Column Workspace */}
      <div className="home-single-col">

        {/* Segmented Navigation Tabs */}
        <div className="home-nav-tabs" role="tablist">
          <button
            className={`home-tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab("scan")}
            role="tab"
            aria-selected={activeTab === 'scan'}
          >
            <span>⚡</span>
            <span>Content Scanner</span>
          </button>
          <button
            className={`home-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab("report")}
            role="tab"
            aria-selected={activeTab === 'report'}
          >
            <span>📑</span>
            <span>Submit Scam Report</span>
          </button>
          {history.length > 0 && (
            <button
              className={`home-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab("history")}
              role="tab"
              aria-selected={activeTab === 'history'}
            >
              <span>🕒</span>
              <span>Recent ({history.length})</span>
            </button>
          )}
        </div>

        {/* Scanner Tab */}
        {activeTab === 'scan' && (
          <AnalyzeJobPanel onReport={handleReportScam} onSaveHistory={handleSaveHistory} />
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <ReportScamPanel
            initialDescription={reportData.description}
            initialReason={reportData.reason}
          />
        )}

        {/* History Tab */}
        {activeTab === 'history' && history.length > 0 && (
          <div className="home-history-card animate-fade-in">
            <div className="home-history-header">
              <h3>Session Inspection History</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest {history.length} scans</span>
            </div>
            <div>
              {history.map((h, i) => {
                const isFake = h.prediction === 'Fake';
                return (
                  <div key={i} className="home-history-row">
                    <span className="home-history-text">"{h.text}"</span>
                    <span className={`home-verdict-pill ${isFake ? 'pill-fake' : 'pill-legit'}`}>
                      {isFake ? '🚨 LIKELY SCAM' : '🛡️ LIKELY GENUINE'} ({isFake ? h.risk : 100 - h.risk}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inline Recent History strip when on scan tab */}
        {activeTab === 'scan' && history.length > 0 && (
          <div className="home-history-card animate-fade-in" style={{ marginTop: '20px' }}>
            <div className="home-history-header">
              <h3>🕒 Recent Session Checks</h3>
              <button
                onClick={() => setActiveTab('history')}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              >
                View all ({history.length}) &rarr;
              </button>
            </div>
            {history.slice(0, 2).map((h, i) => {
              const isFake = h.prediction === 'Fake';
              return (
                <div key={i} className="home-history-row">
                  <span className="home-history-text">"{h.text}"</span>
                  <span className={`home-verdict-pill ${isFake ? 'pill-fake' : 'pill-legit'}`}>
                    {isFake ? '🚨 LIKELY SCAM' : '🛡️ LIKELY GENUINE'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};

export default Home;
