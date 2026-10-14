import { useState } from 'react';
import NewsFeed from '../components/NewsFeed';
import AnalyzeJobPanel from '../components/AnalyzeJobPanel';
import ReportScamPanel from '../components/ReportScamPanel';
import { USE_DUMMY_DATA } from '../api';


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
    <>
      <div className="main-container">
        
        {/* Main Column (Forms & History) */}
        <div className="main-content">
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
              onClick={() => setActiveTab("scan")}
            >
              Scan Job Description
            </button>
            <button 
              className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab("report")}
            >
              Report a Scam
            </button>
          </div>

          <div style={{ display: activeTab === 'scan' ? 'block' : 'none' }}>
            <div className="panel animate-fade-in mb-3" style={{ background: 'var(--primary)', color: 'white', padding: '15px 20px' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
                <strong>🛡️ How It Works:</strong> Our AI engine analyzes linguistic patterns, urgency markers, and financial requests. Paste a job description below to verify it.
              </p>
            </div>
            <AnalyzeJobPanel onReport={handleReportScam} onSaveHistory={handleSaveHistory} />
            
            {history.length > 0 && (
              <div className="panel animate-fade-in mt-3">
                <h2>🕒 Recent Scans</h2>
                <div>
                  {history.map((h, i) => (
                    <div key={i} className="history-item">
                      <span className="text-muted line-clamp-2" style={{ flex: 1, fontSize: '0.85rem', marginRight: '10px' }}>"{h.text}"</span>
                      <span style={{ 
                        background: h.prediction === 'Fake' ? 'var(--danger)' : 'var(--success)', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}>
                        {h.prediction} ({h.prediction === 'Fake' ? h.risk : 100 - h.risk}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: activeTab === 'report' ? 'block' : 'none' }}>
            <ReportScamPanel 
              initialDescription={reportData.description} 
              initialReason={reportData.reason} 
            />
          </div>
        </div>

        {/* Sidebar Column (Threat Feed) */}
        <div className="sidebar">
          <NewsFeed />
        </div>
        
      </div>
    </>
  );
};

export default Home;
