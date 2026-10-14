import { useState, useEffect } from 'react';
import { USE_DUMMY_DATA } from '../api';
import { sampleNews } from '../data/dummyData';

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        if (USE_DUMMY_DATA) {
          setArticles(sampleNews);
          setLoading(false);
          return;
        }
        
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TheHackersNews');
        const data = await response.json();
        // Show only the 3 latest items
        if (data && data.items) {
           setArticles(data.items.slice(0, 3));
        } else {
           throw new Error("No items");
        }
      } catch (err) {
        // Fallback to sampleNews on error so UI doesn't break
        setArticles(sampleNews);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const borderColors = ["var(--warning)", "var(--primary)", "var(--success)"];

  return (
    <div className="panel animate-fade-in" style={{ padding: '15px' }}>
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '10px', 
        marginBottom: '15px'
      }}>
        <h2 style={{ color: 'var(--danger)', margin: 0, fontSize: '1.1rem' }}>🚨 Threat Feed</h2>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}><span className="spinner"></span> <span>Fetching threats...</span></div>}
        {error && <p className="text-danger" style={{ fontSize: '0.9rem' }}>⚠ Connection lost.</p>}
        
        {!loading && !error && articles.map((article, index) => {
          const cleanSnippet = article.description.replace(/<[^>]+>/g, '').split('. ')[0] + "...";
          return (
            <div key={index} style={{
              background: 'var(--input-bg)', 
              padding: '12px', 
              borderRadius: '8px', 
              borderLeft: `3px solid ${borderColors[index]}`,
              boxShadow: 'var(--shadow-sm)',
              height: '110px', // Fixed card height
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: '0 0 4px 0', fontWeight: '600' }}>
                🕒 {article.pubDate.split(' ')[0]}
              </p>
              <h4 className="line-clamp-2" style={{ margin: '0 0 6px 0', fontSize: '0.95rem', lineHeight: '1.2' }}>
                <a href={article.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', textDecoration: 'none' }} title={article.title}>
                  {article.title}
                </a>
              </h4>
              <p className="line-clamp-3 text-muted" style={{ fontSize: '0.8rem', margin: 0, lineHeight: '1.4', flex: 1 }}>{cleanSnippet}</p>
            </div>
          );
        })}

        {!loading && !error && (
          <a href="https://thehackernews.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', textAlign: 'center', textDecoration: 'none', fontWeight: '500', display: 'block', marginTop: '5px' }}>
            View more news &rarr;
          </a>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
