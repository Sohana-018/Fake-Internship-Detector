import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import { mockAnalyticsData } from '../data/analyticsData';
import '../styles/analytics.css';

// Custom CountUp Component
const CountUp = ({ end, duration = 1000, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease out quad
      const easeProgress = progress * (2 - progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

const Analytics = () => {
  const [days, setDays] = useState(30); // 7, 30, 90 (All)

  const { currentData, previousData } = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevCutoff = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);
    
    const current = mockAnalyticsData.filter(d => new Date(d.date) >= cutoff);
    const previous = mockAnalyticsData.filter(d => new Date(d.date) >= prevCutoff && new Date(d.date) < cutoff);
    return { currentData: current, previousData: previous };
  }, [days]);

  const stats = useMemo(() => {
    const calcStats = (data) => {
      const total = data.length;
      const fake = data.filter(d => d.prediction === "Fake").length;
      const genuine = total - fake;
      const rate = total > 0 ? ((fake / total) * 100).toFixed(1) : 0;
      return { total, fake, genuine, rate: parseFloat(rate) };
    };
    
    const curr = calcStats(currentData);
    const prev = calcStats(previousData);
    
    const getTrend = (c, p) => {
      if (p === 0) return c > 0 ? "+100" : "0";
      const diff = ((c - p) / p) * 100;
      return (diff > 0 ? "+" : "") + diff.toFixed(1);
    };

    return {
      total: { val: curr.total, trend: getTrend(curr.total, prev.total) },
      fake: { val: curr.fake, trend: getTrend(curr.fake, prev.fake) },
      genuine: { val: curr.genuine, trend: getTrend(curr.genuine, prev.genuine) },
      rate: { val: curr.rate, trend: getTrend(curr.rate, prev.rate) }
    };
  }, [currentData, previousData]);

  const { chartData, categoryData, companyData } = useMemo(() => {
    if (currentData.length === 0) return { chartData: [], categoryData: [], companyData: [] };

    // Group by Date for Area Chart
    const dateMap = {};
    currentData.forEach(d => {
      const dateStr = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dateMap[dateStr]) dateMap[dateStr] = { date: dateStr, Fake: 0, Genuine: 0 };
      dateMap[dateStr][d.prediction]++;
    });
    // Sort by actual date
    const chartData = Object.values(dateMap).sort((a, b) => new Date(a.date + ", 2026") - new Date(b.date + ", 2026"));

    // Top Categories
    const catMap = {};
    currentData.filter(d => d.prediction === "Fake" && d.category).forEach(d => {
      catMap[d.category] = (catMap[d.category] || 0) + 1;
    });
    const categoryData = Object.keys(catMap).map(k => ({ name: k, count: catMap[k] })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Top Companies
    const compMap = {};
    currentData.filter(d => d.prediction === "Fake" && d.company).forEach(d => {
      compMap[d.company] = (compMap[d.company] || 0) + 1;
    });
    const companyData = Object.keys(compMap).map(k => ({ name: k, count: compMap[k] })).sort((a, b) => b.count - a.count).slice(0, 5);

    return { chartData, categoryData, companyData };
  }, [currentData]);

  const COLORS = { fake: "var(--danger)", genuine: "var(--success)", bg: "var(--bg-card)", text: "var(--text-main)", grid: "var(--border-color)" };
  const pieData = [
    { name: 'Fake', value: stats.fake.val },
    { name: 'Genuine', value: stats.genuine.val }
  ];

  return (
    <div className="analytics-container animate-fade-in" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" className="btn btn-outline" style={{ display: 'inline-block', textDecoration: 'none', marginBottom: '10px' }}>
          ← Back to Home
        </Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <h1 className="analytics-title" style={{ margin: 0 }}>Scam Analytics Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={`btn ${days === 90 ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDays(90)}>All Data</button>
          <button className={`btn ${days === 30 ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDays(30)}>Last 30 Days</button>
          <button className={`btn ${days === 7 ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDays(7)}>Last 7 Days</button>
        </div>
      </div>

      {currentData.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '50px' }}>
          <h2 style={{ color: 'var(--text-muted)' }}>No scans found in this period.</h2>
        </div>
      ) : (
        <>
          {/* 4 Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card panel hover-lift">
              <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Total Scans</h3>
              <p className="stat-val"><CountUp end={stats.total.val} /></p>
              <span className={`trend ${parseFloat(stats.total.trend) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(stats.total.trend) > 0 ? '↑' : '↓'} {stats.total.trend}% vs prev
              </span>
            </div>
            <div className="stat-card panel hover-lift">
              <h3 style={{ margin: 0, color: 'var(--danger)' }}>Scams Detected</h3>
              <p className="stat-val"><CountUp end={stats.fake.val} /></p>
              <span className={`trend ${parseFloat(stats.fake.trend) >= 0 ? 'negative' : 'positive'}`}>
                {parseFloat(stats.fake.trend) > 0 ? '↑' : '↓'} {stats.fake.trend}% vs prev
              </span>
            </div>
            <div className="stat-card panel hover-lift">
              <h3 style={{ margin: 0, color: 'var(--success)' }}>Genuine Postings</h3>
              <p className="stat-val"><CountUp end={stats.genuine.val} /></p>
              <span className={`trend ${parseFloat(stats.genuine.trend) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(stats.genuine.trend) > 0 ? '↑' : '↓'} {stats.genuine.trend}% vs prev
              </span>
            </div>
            <div className="stat-card panel hover-lift">
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>Detection Rate</h3>
              <p className="stat-val"><CountUp end={stats.rate.val} suffix="%" /></p>
              <span className={`trend ${parseFloat(stats.rate.trend) >= 0 ? 'negative' : 'positive'}`}>
                {parseFloat(stats.rate.trend) > 0 ? '↑' : '↓'} {stats.rate.trend}% vs prev
              </span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="panel chart-container">
              <h3>Scans Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFake" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.fake} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.fake} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.genuine} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.genuine} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis dataKey="date" stroke={COLORS.text} />
                  <YAxis stroke={COLORS.text} />
                  <RechartsTooltip contentStyle={{ backgroundColor: COLORS.bg, borderColor: COLORS.grid }} />
                  <Legend />
                  <Area type="monotone" dataKey="Fake" stroke={COLORS.fake} fillOpacity={1} fill="url(#colorFake)" />
                  <Area type="monotone" dataKey="Genuine" stroke={COLORS.genuine} fillOpacity={1} fill="url(#colorGen)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="panel chart-container">
              <h3>Fake vs Genuine Split</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                    <Cell fill={COLORS.fake} />
                    <Cell fill={COLORS.genuine} />
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: COLORS.bg, borderColor: COLORS.grid }} />
                  <Legend />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={COLORS.text} fontSize="24" fontWeight="bold">
                    {stats.rate.val}%
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize="14">
                    Fake
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="panel chart-container">
              <h3>Top Scam Categories</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis type="number" stroke={COLORS.text} />
                  <YAxis type="category" dataKey="name" stroke={COLORS.text} width={120} tick={{fontSize: 12}} />
                  <RechartsTooltip contentStyle={{ backgroundColor: COLORS.bg, borderColor: COLORS.grid }} />
                  <Bar dataKey="count" fill="var(--warning)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="panel chart-container">
              <h3>Most Impersonated Companies</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis dataKey="name" stroke={COLORS.text} />
                  <YAxis stroke={COLORS.text} />
                  <RechartsTooltip contentStyle={{ backgroundColor: COLORS.bg, borderColor: COLORS.grid }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="panel mt-3">
            <h3>Recent Detections</h3>
            <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, borderBottom: '2px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px' }}>Company</th>
                    <th style={{ padding: '12px' }}>Category</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.slice(0, 50).map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(d.date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{d.company}</td>
                      <td style={{ padding: '12px' }}>{d.category || "-"}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          background: d.prediction === "Fake" ? 'var(--danger)' : 'var(--success)', 
                          color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold'
                        }}>
                          {d.prediction}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{d.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
