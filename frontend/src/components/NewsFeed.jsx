import { useState, useEffect } from 'react';
import { USE_DUMMY_DATA } from '../api';
import { sampleNews } from '../data/dummyData';

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
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
        if (data && data.items) {
          setArticles(data.items.slice(0, 3));
        } else {
          setArticles(sampleNews);
        }
      } catch {
        setArticles(sampleNews);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="threat-intel-sidebar animate-fade-in">
      
      {/* Cyber Threat News Feed */}
      <div className="threat-intel-card">
        <div className="threat-intel-header">
          <h3 className="threat-intel-title">
            <span>🚨</span> Threat Wire
          </h3>
          <span className="rss-pill">THE HACKER NEWS</span>
        </div>

        <div>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0' }}>
              <span className="spinner"></span>
              <span>Syncing live threat feeds...</span>
            </div>
          )}

          {!loading && articles.map((article, index) => {
            const cleanSnippet = article.description.replace(/<[^>]+>/g, '').split('. ')[0] + "...";
            return (
              <div key={index} className="news-item-card">
                <div className="news-item-date">
                  <span>🕒</span>
                  <span>{article.pubDate ? article.pubDate.split(' ')[0] : 'Recent Alert'}</span>
                </div>
                <h4 className="news-item-title">
                  <a href={article.link} target="_blank" rel="noopener noreferrer" title={article.title}>
                    {article.title}
                  </a>
                </h4>
                <p className="news-item-snippet">{cleanSnippet}</p>
              </div>
            );
          })}

          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <a 
              href="https://thehackernews.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
            >
              Browse Full Cybersecurity Wire &rarr;
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default NewsFeed;
