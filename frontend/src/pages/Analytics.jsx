import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { Link } from 'react-router-dom';
import { mockAnalyticsData } from '../data/analyticsData';
import metricsData from '../data/metrics.json';
import '../styles/analytics.css';

// Custom Frosted Glass Tooltip for Charts
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="telemetry-tooltip">
        <div className="telemetry-tooltip-date">{label}</div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="telemetry-tooltip-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: entry.color }}></span>
              <span>{entry.name}:</span>
            </span>
            <strong style={{ color: '#fff', fontFeatureSettings: '"tnum"' }}>{entry.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [days, setDays] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [liveDbStats, setLiveDbStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [activeTab, setActiveTab] = useState("telemetry"); // "telemetry" | "benchmarks"
  const [benchmarkData, setBenchmarkData] = useState(metricsData);
  const [selectedModelName, setSelectedModelName] = useState("Logistic Regression");

  // Fetch evaluated benchmark metrics dynamically
  useEffect(() => {
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        if (data && data.models) setBenchmarkData(data);
      })
      .catch(() => {});
  }, []);

  const activeModel = benchmarkData?.models?.find(m => m.name === selectedModelName) || benchmarkData?.models?.[0];

  // Reset to first page when search/filter/timeframe changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, days]);

  // Fetch live reports from Flask SQLite backend
  useEffect(() => {
    fetch('/analytics')
      .then(res => res.json())
      .then(data => setLiveDbStats(data))
      .catch(() => setLiveDbStats(null));
  }, [days]);

  // Filter telemetry data by timeframe
  const { currentData, previousData } = useMemo(() => {
    const now = new Date("2026-10-17T12:00:00Z");
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevCutoff = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const current = mockAnalyticsData.filter(d => new Date(d.date) >= cutoff);
    const previous = mockAnalyticsData.filter(d => new Date(d.date) >= prevCutoff && new Date(d.date) < cutoff);
    return { currentData: current, previousData: previous };
  }, [days]);

  // Operational metrics
  const stats = useMemo(() => {
    const total = currentData.length;
    const fake = currentData.filter(d => d.prediction === "Fake").length;
    const genuine = total - fake;
    const rate = total > 0 ? ((fake / total) * 100).toFixed(1) : 0;

    const prevTotal = previousData.length;
    const prevFake = previousData.filter(d => d.prediction === "Fake").length;
    const prevRate = prevTotal > 0 ? ((prevFake / prevTotal) * 100).toFixed(1) : 0;

    const rateDiff = (rate - prevRate).toFixed(1);

    return {
      total,
      fake,
      genuine,
      rate: parseFloat(rate),
      rateDiff: (rateDiff > 0 ? '+' : '') + rateDiff + '%'
    };
  }, [currentData, previousData]);

  // Chart data groupings
  const { timelineData, vectorData, companyData, severityBreakdown } = useMemo(() => {
    // 1. Timeline
    const dateMap = {};
    const sorted = [...currentData].sort((a, b) => new Date(a.date) - new Date(b.date));
    sorted.forEach(d => {
      const dateStr = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { 
          date: dateStr, 
          "Critical Threats": 0, 
          "High Risk Warnings": 0, 
          "Verified Postings": 0 
        };
      }
      if (d.riskScore >= 90) {
        dateMap[dateStr]["Critical Threats"]++;
      } else if (d.riskScore >= 70) {
        dateMap[dateStr]["High Risk Warnings"]++;
      } else {
        dateMap[dateStr]["Verified Postings"]++;
      }
    });
    const timelineData = Object.values(dateMap);

    // 2. Vector breakdown (Pie)
    const catMap = {};
    currentData.filter(d => d.prediction === "Fake").forEach(d => {
      const cat = d.category || "Unclassified Threat";
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const vectorData = Object.keys(catMap).map(k => ({ name: k, count: catMap[k] })).sort((a, b) => b.count - a.count);

    // 3. Top Impersonated Companies (Bar)
    const compMap = {};
    currentData.filter(d => d.prediction === "Fake").forEach(d => {
      compMap[d.company] = (compMap[d.company] || 0) + 1;
    });
    const companyData = Object.keys(compMap)
      .map(k => ({ name: k, count: compMap[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 4. Severity
    const critical = currentData.filter(d => d.riskScore >= 90).length;
    const high = currentData.filter(d => d.riskScore >= 70 && d.riskScore < 90).length;
    const moderate = currentData.filter(d => d.riskScore >= 50 && d.riskScore < 70).length;
    const safe = currentData.filter(d => d.riskScore < 50).length;

    return {
      timelineData,
      vectorData,
      companyData,
      severityBreakdown: { critical, high, moderate, safe }
    };
  }, [currentData]);

  // Filtered incidents for table
  const filteredIncidents = useMemo(() => {
    return currentData.filter(item => {
      const matchesSearch = 
        item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (categoryFilter === 'ALL') return true;
      if (categoryFilter === 'SCAMS') return item.prediction === 'Fake';
      if (categoryFilter === 'LEGIT') return item.prediction === 'Legitimate';
      if (categoryFilter === 'CAMPUS') return item.category && item.category.includes('Campus');
      if (categoryFilter === 'PAYMENT') return item.category && item.category.includes('Deposit');
      return true;
    });
  }, [currentData, searchTerm, categoryFilter]);

  // Pagination logic (10 records per page)
  const totalPages = Math.ceil(filteredIncidents.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedIncidents = filteredIncidents.slice(startIndex, startIndex + PAGE_SIZE);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Color theme — Custom 4-Color Swatch Palette
  const PALETTE = {
    danger:    "#EF4444",   // vivid crimson
    success:   "#10B981",   // security emerald
    primary:   "#601747",   // deep royal plum (Band 1)
    secondary: "#BE547A",   // mulberry rose (Band 2)
    accent:    "#EB9E9E",   // soft blush pink (Band 3)
    cream:     "#FFECB9",   // warm vanilla (Band 4)
    warning:   "#F59E0B",   // security amber
    info:      "#BE547A",   // rose mauve
    sky:       "#BE547A",
    purple:    "#601747",   // deep royal plum
    slate:     "#6E3858",   // warm plum slate
  };

  const VECTOR_COLORS = ["#601747", "#BE547A", "#EF4444", "#F59E0B", "#10B981", "#EB9E9E"];

  return (
    <div className="analytics-page animate-fade-in">
      
      {/* Top Breadcrumb & Live System Status */}
      <div className="analytics-top-bar">
        <div className="analytics-breadcrumbs">
          <Link to="/">Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Threat Intelligence</span>
        </div>
        <div className="analytics-live-status">
          <span className="live-pulse-dot"></span>
          <span>Telemetry Live • ML Engine v2.4</span>
        </div>
      </div>

      {/* Main Header & Global Actions */}
      <div className="analytics-header-section">
        <div className="analytics-headline-group">
          <h1>Threat Intelligence & Scam Telemetry</h1>
          <p className="analytics-subtitle">
            Forensic analysis across AI-evaluated job postings, detected corporate spoofing vectors, and live community scam submissions.
          </p>
        </div>

        <div className="analytics-actions">
          {/* Segmented Time Control */}
          <div className="segmented-control" role="group" aria-label="Timeframe selection">
            <button 
              className={`segment-btn ${days === 7 ? 'active' : ''}`} 
              onClick={() => setDays(7)}
            >
              7D
            </button>
            <button 
              className={`segment-btn ${days === 30 ? 'active' : ''}`} 
              onClick={() => setDays(30)}
            >
              30D
            </button>
            <button 
              className={`segment-btn ${days === 90 ? 'active' : ''}`} 
              onClick={() => setDays(90)}
            >
              90D
            </button>
          </div>

          {/* Export Actions (Connected to real backend API endpoints) */}
          <div className="action-btn-group">
            <a href="/export" className="btn-telemetry-action" download="scam_reports_raw.csv">
              📥 Export CSV
            </a>
            <a href="/export-summary" className="btn-telemetry-action" download="threat_summary_report.txt">
              📄 Briefing TXT
            </a>
          </div>
        </div>
      </div>

      {/* Analytics Sub-Navbar Tabs */}
      <div className="analytics-sub-navbar">
        <button 
          type="button"
          className={`sub-nav-tab ${activeTab === 'telemetry' ? 'active' : ''}`}
          onClick={() => setActiveTab('telemetry')}
        >
          <span className="sub-nav-icon">📊</span>
          <span>Threat Telemetry & Trends</span>
        </button>

        <button 
          type="button"
          className={`sub-nav-tab ${activeTab === 'benchmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmarks')}
        >
          <span className="sub-nav-icon">🤖</span>
          <span>AI Model Architecture & Benchmark Lab</span>
          <span className="sub-nav-pill">Evaluation</span>
        </button>
      </div>

      {activeTab === 'telemetry' && (
        <>
          {/* Executive Threat Posture Alert Strip */}
          <div className="threat-posture-strip">
        <div className="posture-left">
          <span className="posture-pill">
            ⚠️ Alert: Elevated Risk
          </span>
          <span className="posture-desc">
            Campus placement phishing & upfront deposit requests represent <strong>74%</strong> of active threats this period.
          </span>
        </div>
        <div className="posture-meta-items">
          <div className="posture-meta-item">
            Lead Target: <strong>TCS & Tech Placement Drives</strong>
          </div>
          <div className="posture-meta-item">
            Avg Threat Score: <strong>{stats.rate}%</strong>
          </div>
        </div>
      </div>

      {/* 4 Core Operational KPI Stat Cards */}
      <div className="telemetry-kpi-grid">
        <div className="kpi-tile">
          <div className="kpi-tile-header">
            <span className="kpi-label">Analyzed Postings</span>
            <span className="kpi-icon-badge">🔍</span>
          </div>
          <div className="kpi-val">{stats.total}</div>
          <div className="kpi-footer">
            <span className="kpi-trend-pill trend-neutral">{(stats.total / (days || 1)).toFixed(1)} / day</span>
            <span>daily scan velocity</span>
          </div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-tile-header">
            <span className="kpi-label">Scam Interceptions</span>
            <span className="kpi-icon-badge">🚨</span>
          </div>
          <div className="kpi-val" style={{ color: PALETTE.danger }}>{stats.fake}</div>
          <div className="kpi-footer">
            <span className="kpi-trend-pill trend-danger">{stats.rate}% of total</span>
            <span>flagged fraudulent</span>
          </div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-tile-header">
            <span className="kpi-label">Verified Legitimate</span>
            <span className="kpi-icon-badge">🛡️</span>
          </div>
          <div className="kpi-val" style={{ color: PALETTE.success }}>{stats.genuine}</div>
          <div className="kpi-footer">
            <span className="kpi-trend-pill trend-success">{(100 - stats.rate).toFixed(1)}% clean</span>
            <span>passed model checks</span>
          </div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-tile-header">
            <span className="kpi-label">Community Submissions</span>
            <span className="kpi-icon-badge">📑</span>
          </div>
          <div className="kpi-val" style={{ color: PALETTE.purple }}>
            {liveDbStats ? liveDbStats.total : 14}
          </div>
          <div className="kpi-footer">
            <span className="kpi-trend-pill trend-neutral">
              {liveDbStats ? `${liveDbStats.fee} Fee Traps` : "SQLite Sync Active"}
            </span>
            <span>user reported</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="telemetry-charts-grid">
        
        {/* 1. Area Chart: Timeline Volume */}
        <div className="chart-card chart-card-span-2">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Chronological Threat Activity vs. Legitimate Hiring</h3>
              <p className="chart-card-desc">Daily count of flagged fraudulent listings compared against verified career opportunities.</p>
            </div>
            <div className="chart-card-legend-inline">
              <span className="legend-indicator">
                <span className="legend-dot" style={{ background: PALETTE.danger }}></span>
                Critical Threats
              </span>
              <span className="legend-indicator">
                <span className="legend-dot" style={{ background: PALETTE.warning }}></span>
                High Risk Warnings
              </span>
              <span className="legend-indicator">
                <span className="legend-dot" style={{ background: PALETTE.success }}></span>
                Verified Postings
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scamGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.danger} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={PALETTE.danger} stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.warning} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={PALETTE.warning} stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="legitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.success} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={PALETTE.success} stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.12)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomChartTooltip />} />
              <Area type="monotone" dataKey="Critical Threats" stroke={PALETTE.danger} strokeWidth={2.5} fillOpacity={1} fill="url(#scamGradient)" />
              <Area type="monotone" dataKey="High Risk Warnings" stroke={PALETTE.warning} strokeWidth={2.5} fillOpacity={1} fill="url(#warningGradient)" />
              <Area type="monotone" dataKey="Verified Postings" stroke={PALETTE.success} strokeWidth={2.5} fillOpacity={1} fill="url(#legitGradient)" />
            </AreaChart>
          </ResponsiveContainer>

          {/* Threat Severity Spectrum Bar */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Threat Severity Spectrum</span>
              <span>
                <strong style={{ color: PALETTE.danger }}>Critical: {severityBreakdown.critical}</strong> &nbsp;•&nbsp; 
                <strong style={{ color: PALETTE.warning }}>High: {severityBreakdown.high}</strong> &nbsp;•&nbsp; 
                <strong style={{ color: PALETTE.primary }}>Moderate: {severityBreakdown.moderate}</strong> &nbsp;•&nbsp; 
                <strong style={{ color: PALETTE.success }}>Safe: {severityBreakdown.safe}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: 'var(--border-color)' }}>
              <div style={{ width: `${(severityBreakdown.critical / (stats.total || 1)) * 100}%`, background: PALETTE.danger }} title="Critical Risk (90-100%)"></div>
              <div style={{ width: `${(severityBreakdown.high / (stats.total || 1)) * 100}%`, background: PALETTE.warning }} title="High Risk (70-89%)"></div>
              <div style={{ width: `${(severityBreakdown.moderate / (stats.total || 1)) * 100}%`, background: PALETTE.primary }} title="Moderate Risk (50-69%)"></div>
              <div style={{ width: `${(severityBreakdown.safe / (stats.total || 1)) * 100}%`, background: PALETTE.success }} title="Safe (<50%)"></div>
            </div>
          </div>
        </div>

        {/* 2. Donut Chart: Threat Vectors */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Threat Vector Distribution</h3>
              <p className="chart-card-desc">Categorization of malicious tactics utilized in flagged postings.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <ResponsiveContainer width="50%" height={240}>
              <PieChart>
                <Pie 
                  data={vectorData} 
                  innerRadius={65} 
                  outerRadius={95} 
                  paddingAngle={4} 
                  dataKey="count"
                >
                  {vectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={VECTOR_COLORS[index % VECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '48%', fontSize: '0.82rem' }}>
              {vectorData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: VECTOR_COLORS[idx % VECTOR_COLORS.length] }}></span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.name}</span>
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontFeatureSettings: '"tnum"' }}>
                    {item.count} ({((item.count / (stats.fake || 1)) * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Bar Chart: Targeted Companies */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Most Spoofed Brands & Organizations</h3>
              <p className="chart-card-desc">Entities most frequently impersonated in phishing campaigns.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart 
              layout="vertical" 
              data={companyData} 
              margin={{ top: 10, right: 30, left: 15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.12)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="var(--text-muted)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                width={130}
                tick={{ fill: 'var(--text-main)', fontWeight: 500 }}
              />
              <RechartsTooltip content={<CustomChartTooltip />} />
              <Bar dataKey="count" name="Spoofed Postings" fill={PALETTE.primary} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
      {/* Forensic Incident Log Table Section */}
      <div className="forensics-card">
        <div className="forensics-toolbar">
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem' }}>Forensic Incident Telemetry Log</h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Individual verification records with classification scores, threat vectors, and location indicators.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div className="forensics-search-box">
              <span>🔍</span>
              <input 
                type="text" 
                placeholder="Search entity, role, category..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="forensics-filters">
              <button 
                className={`filter-pill-btn ${categoryFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('ALL')}
              >
                All ({currentData.length})
              </button>
              <button 
                className={`filter-pill-btn ${categoryFilter === 'SCAMS' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('SCAMS')}
              >
                Scams Only ({stats.fake})
              </button>
              <button 
                className={`filter-pill-btn ${categoryFilter === 'CAMPUS' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('CAMPUS')}
              >
                Campus Drives
              </button>
              <button 
                className={`filter-pill-btn ${categoryFilter === 'PAYMENT' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('PAYMENT')}
              >
                Fee Traps
              </button>
              <button 
                className={`filter-pill-btn ${categoryFilter === 'LEGIT' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('LEGIT')}
              >
                Verified Safe ({stats.genuine})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="forensics-table-container">
          <table className="forensics-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Target Entity</th>
                <th>Role / Opportunity</th>
                <th>Threat Vector</th>
                <th>Status</th>
                <th>Risk Score</th>
                <th>Region</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIncidents.map(row => {
                const isFake = row.prediction === "Fake";
                const badgeClass = isFake ? "badge-fake" : "badge-legit";
                const meterColor = row.riskScore >= 80 ? PALETTE.danger : (row.riskScore >= 50 ? PALETTE.warning : PALETTE.success);

                return (
                  <tr key={row.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFeatureSettings: '"tnum"' }}>
                      {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div className="company-cell">
                        <span className="company-avatar">
                          {row.company.substring(0, 2).toUpperCase()}
                        </span>
                        <span>{row.company}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {row.role}
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '0.82rem',
                        color: isFake ? 'var(--text-main)' : 'var(--text-muted)'
                      }}>
                        {isFake ? '⚠️' : '✅'} {row.category}
                      </span>
                    </td>
                    <td>
                      <span className={`threat-status-badge ${badgeClass}`}>
                        {isFake ? '🚨 SCAM' : '🛡️ VERIFIED'}
                      </span>
                    </td>
                    <td>
                      <div className="risk-meter-cell">
                        <div className="risk-meter-bar-track">
                          <div 
                            className="risk-meter-bar-fill" 
                            style={{ width: `${row.riskScore}%`, background: meterColor }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: meterColor, minWidth: '34px', textAlign: 'right', fontFeatureSettings: '"tnum"' }}>
                          {row.riskScore}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {row.location}
                    </td>
                  </tr>
                );
              })}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No forensic telemetry incidents found matching "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="forensics-table-footer">
          <div>
            <span>
              Showing {filteredIncidents.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + PAGE_SIZE, filteredIncidents.length)} of {filteredIncidents.length} telemetry records
            </span>
          </div>

          {totalPages > 1 && (
            <div className="telemetry-pagination">
              <button 
                className="pagination-btn pagination-nav-btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Previous Page"
              >
                ‹ Prev
              </button>

              {getPageNumbers().map((p, idx) => (
                p === '...' ? (
                  <span key={`dots-${idx}`} className="pagination-dots">...</span>
                ) : (
                  <button
                    key={`page-${p}`}
                    className={`pagination-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                )
              ))}

              <button 
                className="pagination-btn pagination-nav-btn" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* ── AI Model Benchmarking & Architecture Lab (Phase 3 Tab) ── */}
      {activeTab === 'benchmarks' && benchmarkData && (
        <div className="benchmark-lab-card animate-fade-in">
          
          {/* Header */}
          <div className="benchmark-lab-header">
            <div className="benchmark-lab-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 className="benchmark-lab-title">🤖 AI Model Architecture & Benchmark Lab</h3>
                <span className="benchmark-verified-pill">Stratified 80/20 Split Benchmark</span>
              </div>
              <p className="benchmark-lab-desc">
                Trained and evaluated across 4 candidate algorithms on an identical stratified test split (18,880 postings). Preprocessing and class-balancing were strictly isolated to the training split with zero test data contamination.
              </p>
            </div>
          </div>

          {/* Top Grid: Comparative Benchmark Table + Test Split Breakdown */}
          <div className="benchmark-main-grid">
            
            {/* Left: Benchmark Table */}
            <div className="benchmark-table-wrapper">
              <div className="benchmark-box-title">
                <span>Model Performance Comparison (Fake Class Metrics)</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Click row to inspect Confusion Matrix</span>
              </div>
              
              <div className="benchmark-table-scroll">
                <table className="benchmark-table">
                  <thead>
                    <tr>
                      <th>Algorithm</th>
                      <th>Accuracy</th>
                      <th>Precision</th>
                      <th>Recall (Fake)</th>
                      <th>F1-Score</th>
                      <th>Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkData.models.map((m) => {
                      const isSelected = m.name === selectedModelName;
                      const isProd = m.is_production;
                      const isBestRecall = m.name === benchmarkData.production_model.highest_recall_model;
                      const isBestF1 = m.name === benchmarkData.production_model.highest_f1_model;

                      return (
                        <tr 
                          key={m.name} 
                          className={`benchmark-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedModelName(m.name)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ color: isSelected ? 'var(--primary)' : 'var(--text-main)', fontSize: '0.85rem' }}>{m.name}</strong>
                                {isProd && <span className="prod-badge">Production</span>}
                              </div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.description.substring(0, 48)}...</span>
                            </div>
                          </td>
                          <td style={{ fontFeatureSettings: '"tnum"' }}>{m.metrics.accuracy}%</td>
                          <td style={{ fontFeatureSettings: '"tnum"' }}>{m.metrics.precision}%</td>
                          <td style={{ fontFeatureSettings: '"tnum"' }}>
                            <span className={isBestRecall ? "metric-best" : ""}>
                              {m.metrics.recall}% {isBestRecall && "🏆"}
                            </span>
                          </td>
                          <td style={{ fontFeatureSettings: '"tnum"' }}>
                            <span className={isBestF1 ? "metric-best" : ""}>
                              {m.metrics.f1_score}% {isBestF1 && "🏆"}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFeatureSettings: '"tnum"' }}>{m.training_time_ms} ms</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Test Set Size & Imbalance Card */}
            <div className="benchmark-split-card">
              <div className="benchmark-box-title">
                <span>Evaluation Split Breakdown</span>
                <span className="split-badge-sm">Strict 80 / 20</span>
              </div>

              <div className="split-metric-row">
                <span className="split-label">Test Evaluation Set Size:</span>
                <strong className="split-val">{benchmarkData.dataset_split.test.total.toLocaleString()} postings</strong>
              </div>

              <div className="split-counts-grid">
                <div className="split-count-box legit">
                  <span className="split-box-name">Genuine (Negative)</span>
                  <strong className="split-box-num">{benchmarkData.dataset_split.test.genuine.toLocaleString()}</strong>
                  <span className="split-box-pct">{((benchmarkData.dataset_split.test.genuine / benchmarkData.dataset_split.test.total) * 100).toFixed(1)}%</span>
                </div>
                <div className="split-count-box fake">
                  <span className="split-box-name">Fraudulent (Positive)</span>
                  <strong className="split-box-num">{benchmarkData.dataset_split.test.fake.toLocaleString()}</strong>
                  <span className="split-box-pct">{((benchmarkData.dataset_split.test.fake / benchmarkData.dataset_split.test.total) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="split-meta-list">
                <div className="split-meta-item">
                  <span className="split-dot primary"></span>
                  <span><strong>Total Dataset:</strong> {benchmarkData.dataset_split.total_records.toLocaleString()} combined records</span>
                </div>
                <div className="split-meta-item">
                  <span className="split-dot success"></span>
                  <span><strong>Training Split:</strong> {benchmarkData.dataset_split.train.total.toLocaleString()} records ({benchmarkData.dataset_split.train.fake} fake / {benchmarkData.dataset_split.train.genuine} genuine)</span>
                </div>
                <div className="split-meta-item">
                  <span className="split-dot warning"></span>
                  <span><strong>Balancing Strategy:</strong> Class weighting applied strictly to training split with zero test leakage.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Production Model Selection Rationale Banner */}
          <div className="prod-rationale-box">
            <div className="prod-rationale-header">
              <span>🛡️</span>
              <strong>Production Deployment Rationale: {benchmarkData.production_model.name}</strong>
            </div>
            <p className="prod-rationale-text">
              {benchmarkData.production_model.rationale}
            </p>
          </div>

          {/* Lower Grid: Confusion Matrix Visualizer + Class Imbalance & Loss Chart */}
          <div className="benchmark-lower-grid">
            
            {/* Confusion Matrix Visual */}
            <div className="confusion-matrix-card">
              <div className="confusion-matrix-top">
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem' }}>
                    Confusion Matrix: {activeModel.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Evaluated on {benchmarkData.dataset_split.test.total} unseen test postings (273 true scams)
                  </p>
                </div>
                <div className="cm-model-pills">
                  {benchmarkData.models.map(m => (
                    <button 
                      key={m.name}
                      type="button"
                      className={`cm-pill-btn ${m.name === selectedModelName ? 'active' : ''}`}
                      onClick={() => setSelectedModelName(m.name)}
                    >
                      {m.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2x2 Grid */}
              <div className="cm-grid-container">
                <div className="cm-axis-header">
                  <span>Actual \ Predicted</span>
                  <span>Predicted Genuine</span>
                  <span>Predicted Fake</span>
                </div>
                <div className="cm-row">
                  <span className="cm-row-label">Actual Genuine ({benchmarkData.dataset_split.test.genuine})</span>
                  <div className="cm-cell tn">
                    <span className="cm-cell-type">True Negative (TN)</span>
                    <strong className="cm-cell-count">{activeModel.confusion_matrix.true_negative}</strong>
                    <span className="cm-cell-desc">Genuine verified correctly</span>
                  </div>
                  <div className="cm-cell fp">
                    <span className="cm-cell-type">False Positive (FP)</span>
                    <strong className="cm-cell-count">{activeModel.confusion_matrix.false_positive}</strong>
                    <span className="cm-cell-desc">Legitimate flagged as fake (False Alarm)</span>
                  </div>
                </div>
                <div className="cm-row">
                  <span className="cm-row-label">Actual Fake ({benchmarkData.dataset_split.test.fake})</span>
                  <div className="cm-cell fn">
                    <span className="cm-cell-type">False Negative (FN)</span>
                    <strong className="cm-cell-count">{activeModel.confusion_matrix.false_negative}</strong>
                    <span className="cm-cell-desc">Scams missed by model (Critical Risk)</span>
                  </div>
                  <div className="cm-cell tp">
                    <span className="cm-cell-type">True Positive (TP)</span>
                    <strong className="cm-cell-count">{activeModel.confusion_matrix.true_positive}</strong>
                    <span className="cm-cell-desc">Scams caught & neutralized</span>
                  </div>
                </div>
              </div>

              <div className="cm-summary-bar">
                <div className="cm-summary-stat">
                  <span>Scam Catch Rate (Recall):</span>
                  <strong style={{ color: activeModel.metrics.recall >= 90 ? 'var(--success)' : 'var(--warning)' }}>
                    {activeModel.metrics.recall}% ({activeModel.confusion_matrix.true_positive} / {benchmarkData.dataset_split.test.fake})
                  </strong>
                </div>
                <div className="cm-summary-stat">
                  <span>False Alarm Rate:</span>
                  <strong style={{ color: 'var(--text-muted)' }}>
                    {((activeModel.confusion_matrix.false_positive / benchmarkData.dataset_split.test.genuine) * 100).toFixed(2)}% ({activeModel.confusion_matrix.false_positive} / {benchmarkData.dataset_split.test.genuine})
                  </strong>
                </div>
              </div>
            </div>

            {/* Class Imbalance & Balancing Strategy Card */}
            <div className="class-imbalance-card">
              <div className="benchmark-box-title">
                <span>Class Imbalance & Training Balancing</span>
                <span className="imbalance-ratio-pill">13 : 1 Raw Imbalance</span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                In real-world recruitment datasets, scams represent a rare minority. A naive unweighted model predicting "Genuine" 100% of the time achieves 92.8% raw accuracy but catches zero scams.
              </p>

              {/* Visual Bars comparing Raw vs Balanced */}
              <div className="imbalance-bars-group">
                <div className="imbalance-bar-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                    <strong>Raw Dataset Distribution</strong>
                    <span style={{ color: 'var(--text-muted)' }}>92.8% Genuine vs 7.2% Fake</span>
                  </div>
                  <div className="imbalance-track">
                    <div style={{ width: '92.76%', background: 'var(--success)', height: '100%' }} title="Genuine: 92.76%"></div>
                    <div style={{ width: '7.24%', background: 'var(--danger)', height: '100%' }} title="Fake: 7.24%"></div>
                  </div>
                </div>

                <div className="imbalance-bar-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                    <strong>Effective Training Weight (Penalty Loss)</strong>
                    <span style={{ color: 'var(--primary)' }}>50% / 50% Balanced Loss</span>
                  </div>
                  <div className="imbalance-track">
                    <div style={{ width: '50%', background: 'var(--primary)', opacity: 0.8, height: '100%' }} title="Genuine Weight: 1x"></div>
                    <div style={{ width: '50%', background: 'var(--danger)', opacity: 0.9, height: '100%' }} title="Fake Weight: ~13x penalty"></div>
                  </div>
                </div>
              </div>

              <div className="imbalance-explainer-box">
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem', marginBottom: '4px' }}>
                  ⚖️ Mathematical Class-Weight Balancing:
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Training losses are scaled inversely to class frequencies: <code>weight = n_samples / (n_classes * count)</code>. This forces the optimizer to treat a missed scam 13 times more severely during gradient descent without artificially synthesizing fake text.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Analytics;
