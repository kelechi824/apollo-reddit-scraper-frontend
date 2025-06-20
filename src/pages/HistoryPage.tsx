import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    const savedAnalyses = JSON.parse(localStorage.getItem('apollo-analyses') || '[]');
    setHistoryItems(savedAnalyses);
    
    // Automatically select the first item if any exist
    if (savedAnalyses.length > 0) {
      setSelectedItem(savedAnalyses[0]);
    }
  }, []);

  /**
   * Clear all history items with confirmation
   * Why this matters: Allows users to clean up their stored analysis history with safety confirmation
   */
  const clearHistory = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all analysis history?\n\nThis action cannot be undone and will permanently delete all your saved analyses.'
    );
    
    if (confirmed) {
      localStorage.removeItem('apollo-analyses');
      setHistoryItems([]);
      setSelectedItem(null);
    }
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
   * Restore analysis results and navigate to app page
   * Why this matters: Allows users to view historical analysis results in the full interface
   */
  const restoreAnalysis = (historyItem: HistoryItem) => {
    // Save the historical results to the current analysis localStorage key
    localStorage.setItem('apollo-analysis-results', JSON.stringify(historyItem.results));
    
    // Navigate to the app page where the results will be displayed
    navigate('/app');
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
        <div className="flex items-center gap-6">
          <Clock style={{width: '2rem', height: '2rem'}} />
          <h1 className="page-title">Analysis History</h1>
        </div>
        {historyItems.length > 0 && (
          <button
            onClick={clearHistory}
            className="apollo-btn-secondary danger"
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
                      <div 
                        key={post.id} 
                        className="insight-summary clickable"
                        onClick={() => restoreAnalysis(selectedItem)}
                        title="Click to view full analysis"
                      >
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