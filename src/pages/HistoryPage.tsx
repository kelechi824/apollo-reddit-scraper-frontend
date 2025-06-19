import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Search, ExternalLink } from 'lucide-react';

interface HistoryItem {
  id: string;
  keywords: string[];
  subreddits: string[];
  timestamp: string;
  results: any;
}

const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const savedAnalyses = JSON.parse(localStorage.getItem('apollo-analyses') || '[]');
    setHistoryItems(savedAnalyses);
  }, []);

  /**
   * Clear all history items
   * Why this matters: Allows users to clean up their stored analysis history
   */
  const clearHistory = () => {
    localStorage.removeItem('apollo-analyses');
    setHistoryItems([]);
    setSelectedItem(null);
  };

  /**
   * Clear individual history item
   * Why this matters: Allows users to selectively remove specific analyses from history
   */
  const clearItem = (itemId: string) => {
    const updatedItems = historyItems.filter(item => item.id !== itemId);
    setHistoryItems(updatedItems);
    localStorage.setItem('apollo-analyses', JSON.stringify(updatedItems));
    
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
  };

  /**
   * Format timestamp for display
   * Why this matters: Provides human-readable dates for better UX
   */
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <div className="flex items-center gap-3">
          <Clock style={{width: '2rem', height: '2rem'}} />
          <h1 className="page-title">Analysis History</h1>
        </div>
        {historyItems.length > 0 && (
          <button
            onClick={clearHistory}
            className="apollo-btn-secondary"
          >
            <Trash2 style={{width: '1rem', height: '1rem'}} />
            Clear All History
          </button>
        )}
      </div>

      {historyItems.length === 0 ? (
        <div className="history-empty">
          <Search style={{width: '4rem', height: '4rem', color: '#9ca3af'}} />
          <h3>No Analysis History</h3>
          <p>Your completed analyses will appear here</p>
          <a href="/" className="apollo-btn-primary">
            Run Your First Analysis
          </a>
        </div>
      ) : (
        <div className="history-content">
          {/* History List */}
          <div className="history-list">
            {historyItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`history-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
              >
                <div className="history-card-header">
                  <div>
                    <h3 className="history-keyword">{item.keywords[0]}</h3>
                    <p className="history-meta">
                      r/{item.subreddits[0]} • {item.results?.analyzed_posts?.length || 0} insights
                    </p>
                  </div>
                  <div className="history-actions">
                    <span className="history-date">{formatDate(item.timestamp)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearItem(item.id);
                      }}
                      className="history-delete-btn"
                      title="Delete this analysis"
                    >
                      <Trash2 style={{width: '1rem', height: '1rem'}} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* History Detail */}
          {selectedItem && (
            <div className="history-detail">
              <div className="history-detail-header">
                <h2>{selectedItem.keywords[0]}</h2>
                <p>Analysis from {formatDate(selectedItem.timestamp)}</p>
              </div>
              
              <div className="history-detail-content">
                <div className="history-stats">
                  <div className="stat-card">
                    <h4>Subreddit</h4>
                    <p>r/{selectedItem.subreddits[0]}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Posts Found</h4>
                    <p>{selectedItem.results?.reddit_results?.total_found || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Insights Generated</h4>
                    <p>{selectedItem.results?.analyzed_posts?.length || 0}</p>
                  </div>
                </div>

                {selectedItem.results?.analyzed_posts && (
                  <div className="history-insights">
                    <h3>Generated Insights</h3>
                    {selectedItem.results.analyzed_posts.map((post: any, index: number) => (
                      <div key={post.id} className="insight-summary">
                        <div className="insight-header">
                          <span className="insight-rank">#{post.post_rank}</span>
                          <h4 className="insight-title">{post.title}</h4>
                        </div>
                        <div className="insight-analysis">
                          <div className="insight-item">
                            <strong>Pain Point:</strong> {post.analysis.pain_point}
                          </div>
                          <div className="insight-item">
                            <strong>Opportunity:</strong> {post.analysis.content_opportunity}
                          </div>
                        </div>
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="insight-link"
                        >
                          View Reddit Post <ExternalLink style={{width: '0.875rem', height: '0.875rem'}} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPage; 