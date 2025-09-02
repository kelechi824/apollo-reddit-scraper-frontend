import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Search, ExternalLink, AlertTriangle, X } from 'lucide-react';
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
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
   * Show confirmation modal for clearing history
   * Why this matters: Provides a custom modal experience instead of browser popup for better UX
   */
  const showClearConfirmation = () => {
    setShowConfirmModal(true);
  };

  /**
   * Clear all history items after confirmation
   * Why this matters: Performs the actual deletion of history data after user confirms
   */
  const confirmClearHistory = () => {
    localStorage.removeItem('apollo-analyses');
    setHistoryItems([]);
    setSelectedItem(null);
    setShowConfirmModal(false);
  };

  /**
   * Cancel the clear history action
   * Why this matters: Allows users to back out of the destructive action
   */
  const cancelClearHistory = () => {
    setShowConfirmModal(false);
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
  const restoreAnalysis = (historyItem: HistoryItem, postIndex?: number) => {
    // Save the historical results to the current analysis localStorage key
    localStorage.setItem('apollo-analysis-results', JSON.stringify(historyItem.results));
    
    // Save the target post index if provided
    if (postIndex !== undefined) {
      localStorage.setItem('apollo-analysis-target-index', postIndex.toString());
    } else {
      localStorage.removeItem('apollo-analysis-target-index');
    }
    
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

  /**
   * Handle history card click - show modal on mobile, normal selection on desktop
   * Why this matters: Provides better UX on mobile by showing content in a modal instead of requiring scrolling
   */
  const handleCardClick = (item: HistoryItem) => {
    setSelectedItem(item);
    
    // Show modal on mobile (screen width <= 768px)
    if (window.innerWidth <= 768) {
      setShowMobileModal(true);
    }
  };

  /**
   * Handle mobile modal for specific item
   * Why this matters: Shows modal with content specific to the clicked card
   */
  const showMobileModalForItem = (item: HistoryItem) => {
    setSelectedItem(item);
    setShowMobileModal(true);
  };

  /**
   * Close mobile modal
   * Why this matters: Allows users to dismiss the modal and return to the list view
   */
  const closeMobileModal = () => {
    setShowMobileModal(false);
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <div className="history-header-content">
          <div className="history-title-section">
            <div className="history-title-wrapper">
              <Clock style={{width: '2rem', height: '2rem'}} />
              <div className="history-title-text">
                <h1 className="page-title">Reddit Agents History</h1>
                <p className="history-subtitle">
                  {historyItems.length === 0 
                    ? 'No saved analyses yet' 
                    : `${historyItems.length} saved ${historyItems.length === 1 ? 'analysis' : 'analyses'}`
                  }
                </p>
              </div>
            </div>
          </div>
          
          {historyItems.length > 0 && (
            <div className="history-actions-section desktop-clear-btn">
              <button
                onClick={showClearConfirmation}
                className="apollo-btn-secondary danger"
              >
                <Trash2 style={{width: '1rem', height: '1rem'}} />
                <span className="clear-btn-text">Clear All History</span>
                <span className="clear-btn-text-short">Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Header Styles */}
      <style>
        {`
          .history-header {
            padding: 2rem 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 2rem;
            position: relative;
          }

          .history-header-content {
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 2rem;
            flex-wrap: wrap;
          }

          .history-title-section {
            flex: 1;
            min-width: 0;
          }

          .history-title-wrapper {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
          }

          .history-title-text {
            flex: 1;
            min-width: 0;
          }

          @media (min-width: 641px) {
            .history-title-text {
              transform: translateY(-0.20rem);
            }
          }

          @media (max-width: 640px) {
            .history-title-text {
              transform: translateY(-0.125rem);
            }
          }

          .page-title {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
            color: #111827;
            line-height: 1.2;
          }

          .history-subtitle {
            margin: 0.5rem 0 0 0;
            font-size: 1rem;
            color: #6b7280;
            font-weight: 500;
          }

          .history-actions-section {
            position: absolute;
            right: 0;
            top: 0.25rem;
            flex-shrink: 0;
          }

          .clear-btn-text-short {
            display: none;
          }

          .mobile-clear-btn {
            display: none;
          }

                      @media (max-width: 640px) {
              .desktop-clear-btn {
                display: none !important;
              }

              .mobile-clear-btn {
                display: flex;
                justify-content: center;
                margin-top: 2rem;
                padding: 0 1rem;
              }
              .history-header {
                padding: 1rem 0 1.5rem 0;
              }

            .history-header-content {
              flex-direction: column;
              gap: 1.5rem;
              align-items: stretch;
            }

            .history-title-wrapper {
              gap: 0.75rem;
            }

            .page-title {
              font-size: 1.75rem;
            }

            .history-subtitle {
              font-size: 0.875rem;
            }

            .history-actions-section {
              padding-top: 0;
            }
          }

          @media (max-width: 480px) {
            .page-title {
              font-size: 1.5rem;
            }

            .history-title-wrapper {
              gap: 0.5rem;
            }

            .history-title-wrapper svg {
              width: 1.5rem !important;
              height: 1.5rem !important;
            }
          }
        `}
      </style>

      {historyItems.length === 0 ? (
        <div className="history-empty">
          <Search style={{width: '4rem', height: '4rem', color: '#9ca3af'}} />
          <h3>No Analysis History</h3>
          <p>Your completed analyses will appear here</p>
          <a href="/app" className="apollo-btn-primary">
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
                onClick={() => restoreAnalysis(item)}
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

          {/* Mobile Clear Button */}
          {historyItems.length > 0 && (
            <div className="mobile-clear-btn">
              <button
                onClick={showClearConfirmation}
                className="apollo-btn-secondary danger"
              >
                <Trash2 style={{width: '1rem', height: '1rem'}} />
                Clear All
              </button>
            </div>
          )}

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
                        onClick={() => restoreAnalysis(selectedItem, index)}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className={`confirmation-modal-backdrop ${showConfirmModal ? 'open' : ''}`}>
          <div className={`confirmation-modal ${showConfirmModal ? 'open' : ''}`}>
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                <AlertTriangle style={{width: '1.5rem', height: '1.5rem'}} />
              </div>
              <h3 className="confirmation-modal-title">Clear All History?</h3>
              <p className="confirmation-modal-message">
                This action cannot be undone and will permanently delete all your saved analyses.
              </p>
            </div>
            <div className="confirmation-modal-actions">
              <button
                onClick={cancelClearHistory}
                className="confirmation-modal-btn confirmation-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearHistory}
                className="confirmation-modal-btn confirmation-modal-btn-confirm"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile History Detail Modal */}
      {showMobileModal && selectedItem && (
        <div className="mobile-modal-backdrop" onClick={closeMobileModal}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h2>{selectedItem.keywords[0]}</h2>
              <button 
                onClick={closeMobileModal}
                className="mobile-modal-close"
                aria-label="Close modal"
              >
                <X style={{width: '1.5rem', height: '1.5rem'}} />
              </button>
            </div>
            
            <div className="mobile-modal-content">
              <p className="mobile-modal-subtitle">Analysis from {formatDate(selectedItem.timestamp)}</p>
              
              <div className="mobile-modal-stats">
                <div className="mobile-stat-item">
                  <span className="mobile-stat-label">Subreddit:</span>
                  <span className="mobile-stat-value">r/{selectedItem.subreddits[0]}</span>
                </div>
                <div className="mobile-stat-item">
                  <span className="mobile-stat-label">Posts Found:</span>
                  <span className="mobile-stat-value">{selectedItem.results?.reddit_results?.total_found || 0}</span>
                </div>
                <div className="mobile-stat-item">
                  <span className="mobile-stat-label">Insights Generated:</span>
                  <span className="mobile-stat-value">{selectedItem.results?.analyzed_posts?.length || 0}</span>
                </div>
              </div>

              {selectedItem.results?.analyzed_posts && (
                <div className="mobile-modal-insights">
                  <h3>Generated Insights</h3>
                  <div className="mobile-insights-list">
                    {selectedItem.results.analyzed_posts.map((post: any, index: number) => (
                      <div 
                        key={post.id} 
                        className="mobile-insight-card"
                        onClick={() => {
                          restoreAnalysis(selectedItem);
                          closeMobileModal();
                        }}
                      >
                        <div className="mobile-insight-header">
                          <span className="mobile-insight-rank">#{post.post_rank}</span>
                          <h4 className="mobile-insight-title">{post.title}</h4>
                        </div>
                        <div className="mobile-insight-content">
                          <div className="mobile-insight-item">
                            <strong>Pain Point:</strong> {post.analysis.pain_point}
                          </div>
                          <div className="mobile-insight-item">
                            <strong>Opportunity:</strong> {post.analysis.content_opportunity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Modal Styles */}
      <style>
        {`
          .mobile-modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 1rem;
            overflow-y: auto;
          }

          .mobile-modal {
            background: white;
            border-radius: 1rem;
            width: 100%;
            max-width: 90vw;
            max-height: 85vh;
            overflow-y: auto;
            margin-top: 2rem;
            box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.2);
          }

          .mobile-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            background: white;
            border-radius: 1rem 1rem 0 0;
          }

          .mobile-modal-header h2 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
            color: #111827;
          }

          .mobile-modal-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            color: #6b7280;
            transition: all 0.2s ease;
          }

          .mobile-modal-close:hover {
            background-color: #f3f4f6;
            color: #111827;
          }

          .mobile-modal-content {
            padding: 1.5rem;
          }

          .mobile-modal-subtitle {
            color: #6b7280;
            font-size: 0.875rem;
            margin: 0 0 1.5rem 0;
          }

          .mobile-modal-stats {
            background-color: #f9fafb;
            border-radius: 0.75rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .mobile-stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }

          .mobile-stat-item:last-child {
            margin-bottom: 0;
          }

          .mobile-stat-label {
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
          }

          .mobile-stat-value {
            color: #111827;
            font-weight: 500;
            font-size: 0.875rem;
          }

          .mobile-modal-insights h3 {
            margin: 0 0 1rem 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: #111827;
          }

          .mobile-insights-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .mobile-insight-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .mobile-insight-card:hover {
            background-color: #f3f4f6;
            border-color: #d1d5db;
            transform: translateY(-1px);
          }

          .mobile-insight-header {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }

          .mobile-insight-rank {
            background-color: #EBF212;
            color: #000;
            font-weight: 700;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            flex-shrink: 0;
          }

          .mobile-insight-title {
            margin: 0;
            font-size: 0.875rem;
            font-weight: 600;
            color: #111827;
            line-height: 1.4;
          }

          .mobile-insight-content {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .mobile-insight-item {
            font-size: 0.8rem;
            line-height: 1.4;
            color: #374151;
          }

          .mobile-insight-item strong {
            color: #111827;
          }

                     @media (max-width: 768px) {
             .history-detail {
               display: none !important;
             }
           }

           @media (min-width: 769px) {
             .mobile-modal-backdrop {
               display: none;
             }
           }
        `}
      </style>
    </div>
  );
};

export default HistoryPage; 