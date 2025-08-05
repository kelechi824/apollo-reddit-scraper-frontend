import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Search, ExternalLink, AlertTriangle, X, FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BlogContentActionModal from '../components/BlogContentActionModal';

interface BlogHistoryItem {
  id: string;
  keyword: string;
  title: string;
  content: string;
  metaDescription: string;
  timestamp: string;
  wordCount: number;
  status: 'completed';
  metadata?: {
    seo_optimized: boolean;
    citations_included: boolean;
    brand_variables_processed: number;
    aeo_optimized: boolean;
  };
  originalKeywordRow?: any; // For modal compatibility
}

const BlogHistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<BlogHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<BlogHistoryItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedModalItem, setSelectedModalItem] = useState<BlogHistoryItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedBlogs = JSON.parse(localStorage.getItem('apollo-blog-history') || '[]');
    // Sort by timestamp (most recent first)
    const sortedBlogs = savedBlogs.sort((a: BlogHistoryItem, b: BlogHistoryItem) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setHistoryItems(sortedBlogs);
    
    // Automatically select the first item if any exist
    if (sortedBlogs.length > 0) {
      setSelectedItem(sortedBlogs[0]);
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
    localStorage.removeItem('apollo-blog-history');
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
   * Show confirmation modal for deleting individual item
   * Why this matters: Prevents accidental deletion of individual blog posts
   */
  const showDeleteItemConfirmation = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteItemModal(true);
  };

  /**
   * Clear individual history item after confirmation
   * Why this matters: Allows users to selectively remove specific blog content from history
   */
  const confirmDeleteItem = () => {
    if (itemToDelete) {
      const updatedItems = historyItems.filter(item => item.id !== itemToDelete);
      setHistoryItems(updatedItems);
      localStorage.setItem('apollo-blog-history', JSON.stringify(updatedItems));
      
      if (selectedItem?.id === itemToDelete) {
        setSelectedItem(null);
      }
    }
    setShowDeleteItemModal(false);
    setItemToDelete(null);
  };

  /**
   * Cancel individual item deletion
   * Why this matters: Allows users to back out of the delete action
   */
  const cancelDeleteItem = () => {
    setShowDeleteItemModal(false);
    setItemToDelete(null);
  };

  /**
   * Open BlogContentActionModal with historical data
   * Why this matters: Allows users to view and interact with historical blog content in the full modal interface
   */
  const openContentModal = (historyItem: BlogHistoryItem) => {
    setSelectedModalItem(historyItem);
    setShowContentModal(true);
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
  const handleCardClick = (item: BlogHistoryItem) => {
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
  const showMobileModalForItem = (item: BlogHistoryItem) => {
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

  /**
   * Close content modal
   * Why this matters: Allows users to dismiss the content modal
   */
  const closeContentModal = () => {
    setShowContentModal(false);
    setSelectedModalItem(null);
  };

  /**
   * Truncate content for preview
   * Why this matters: Shows enough content for preview without overwhelming the interface
   */
  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <div className="history-header-content">
          <div className="history-title-section">
            <div className="history-title-wrapper">
              <FileText style={{width: '2rem', height: '2rem'}} />
              <div className="history-title-text">
                <h1 className="page-title">Blog Content History</h1>
                <p className="history-subtitle">
                  {historyItems.length === 0 
                    ? 'No generated blog content yet' 
                    : `${historyItems.length} generated blog ${historyItems.length === 1 ? 'post' : 'posts'}`
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
            font-size: 1.5rem;
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
              font-size: 1.25rem;
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
              font-size: 1.125rem;
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
          <FileText style={{width: '4rem', height: '4rem', color: '#9ca3af'}} />
          <h3>No Blog Content History</h3>
          <p>Your generated blog content will appear here</p>
          <a href="/blog-creator" className="apollo-btn-primary">
            Create Your First Blog Post
          </a>
        </div>
      ) : (
        <div className="history-content">
          {/* History List */}
          <div className="history-list">
            {historyItems.map((item) => (
              <div
                key={item.id}
                onClick={() => window.innerWidth <= 768 ? showMobileModalForItem(item) : setSelectedItem(item)}
                className={`history-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
              >
                <div className="history-card-header">
                  <div>
                    <h3 className="history-keyword">{item.keyword}</h3>
                    <p className="history-meta">
                      {item.wordCount} words • {formatDate(item.timestamp)}
                    </p>
                  </div>
                  <div className="history-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteItemConfirmation(item.id);
                      }}
                      className="history-delete-btn"
                      title="Delete this blog content"
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
                <h2>{selectedItem.keyword}</h2>
              </div>
              
              <div className="history-detail-content">


                <div className="content-preview">
                  <h3>Content Preview</h3>
                  <div className="content-preview-text">
                    {truncateContent(selectedItem.content)}
                  </div>
                  <button
                    onClick={() => openContentModal(selectedItem)}
                    className="apollo-btn-primary"
                    style={{ marginTop: '1rem' }}
                  >
                    View Full Content
                  </button>
                </div>
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
              <h3 className="confirmation-modal-title">Clear All Blog History?</h3>
              <p className="confirmation-modal-message">
                This action cannot be undone and will permanently delete all your saved blog content.
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

      {/* Delete Item Confirmation Modal */}
      {showDeleteItemModal && (
        <div className={`confirmation-modal-backdrop ${showDeleteItemModal ? 'open' : ''}`}>
          <div className={`confirmation-modal ${showDeleteItemModal ? 'open' : ''}`}>
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                <AlertTriangle style={{width: '1.5rem', height: '1.5rem'}} />
              </div>
              <h3 className="confirmation-modal-title">Delete Blog Post?</h3>
              <p className="confirmation-modal-message">
                This action cannot be undone and will permanently delete this blog post from your history.
              </p>
            </div>
            <div className="confirmation-modal-actions">
              <button
                onClick={cancelDeleteItem}
                className="confirmation-modal-btn confirmation-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                className="confirmation-modal-btn confirmation-modal-btn-confirm"
              >
                Delete
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
              <h2>{selectedItem.keyword}</h2>
              <button 
                onClick={closeMobileModal}
                className="mobile-modal-close"
                aria-label="Close modal"
              >
                <X style={{width: '1.5rem', height: '1.5rem'}} />
              </button>
            </div>
            
            <div className="mobile-modal-content">
              <p className="mobile-modal-subtitle">Generated on {formatDate(selectedItem.timestamp)}</p>
              
              <div className="mobile-modal-stats">
                <div className="mobile-stat-item">
                  <span className="mobile-stat-label">Title:</span>
                  <span className="mobile-stat-value">{selectedItem.title}</span>
                </div>
                <div className="mobile-stat-item">
                  <span className="mobile-stat-label">Word Count:</span>
                  <span className="mobile-stat-value">{selectedItem.wordCount}</span>
                </div>

              </div>

              <div className="mobile-modal-content-preview">
                <h3>Content Preview</h3>
                <div className="mobile-content-text">
                  {truncateContent(selectedItem.content)}
                </div>
                <button
                  onClick={() => {
                    openContentModal(selectedItem);
                    closeMobileModal();
                  }}
                  className="apollo-btn-primary"
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  View Full Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Content Action Modal */}
      {showContentModal && selectedModalItem && (
        <BlogContentActionModal
          isOpen={showContentModal}
          onClose={closeContentModal}
          keywordRow={{
            id: selectedModalItem.id,
            keyword: selectedModalItem.keyword,
            status: selectedModalItem.status,
            progress: '✅ Content generation complete!',
            output: selectedModalItem.content,
            createdAt: new Date(selectedModalItem.timestamp),
            metadata: {
              title: selectedModalItem.title,
              description: selectedModalItem.metaDescription,
              word_count: selectedModalItem.wordCount,
              seo_optimized: selectedModalItem.metadata?.seo_optimized ?? false,
              citations_included: selectedModalItem.metadata?.citations_included ?? false,
              brand_variables_processed: selectedModalItem.metadata?.brand_variables_processed ?? 0,
              aeo_optimized: selectedModalItem.metadata?.aeo_optimized ?? false,
            },
            generationResult: {
              content: selectedModalItem.content,
              metaSeoTitle: selectedModalItem.title,
              metaDescription: selectedModalItem.metaDescription,
              metadata: {
                title: selectedModalItem.title,
                description: selectedModalItem.metaDescription,
                word_count: selectedModalItem.wordCount,
                seo_optimized: selectedModalItem.metadata?.seo_optimized ?? false,
                citations_included: selectedModalItem.metadata?.citations_included ?? false,
                brand_variables_processed: selectedModalItem.metadata?.brand_variables_processed ?? 0,
                aeo_optimized: selectedModalItem.metadata?.aeo_optimized ?? false,
              }
            }
          }}
          onContentUpdate={(keywordId: string, newContent: string) => {
            // Update the history item with new content if needed
            console.log('Content updated for history item:', keywordId, newContent);
          }}
          onStatusUpdate={(keywordId: string, status: any) => {
            console.log('Status updated for history item:', keywordId, status);
          }}
        />
      )}

      {/* Add styles for new elements */}
      <style>
        {`
          .history-keyword {
            font-size: 1rem;
            font-weight: 600;
            margin: 0;
          }

          .history-meta {
            font-size: 0.75rem;
            color: #6b7280;
            margin: 0.25rem 0 0 0;
          }

          .history-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .history-actions {
            margin-top: 0.125rem;
          }

          .history-delete-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 0.25rem;
            color: #6b7280;
            transition: all 0.2s ease;
          }

          .history-delete-btn:hover {
            background-color: #fee2e2;
            color: #dc2626;
          }

          .content-preview {
            margin-top: 1.5rem;
          }

          .content-preview h3 {
            margin: 0 0 1rem 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: #111827;
          }

          .content-preview-text {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            font-size: 0.875rem;
            line-height: 1.6;
            color: #374151;
          }

          .mobile-content-text {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
            font-size: 0.875rem;
            line-height: 1.6;
            color: #374151;
            margin-bottom: 1rem;
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

export default BlogHistoryPage;