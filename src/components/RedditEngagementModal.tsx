import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import RedditEngagementPanel from './RedditEngagementPanel';
import { AnalyzedPost, RedditResponse } from '../types';

interface RedditEngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: AnalyzedPost;
  workflowId: string;
}

/**
 * RedditEngagementModal Component
 * Why this matters: Provides a dedicated wide right-side modal for Reddit engagement features,
 * allowing users to generate and manage Reddit responses without leaving the analysis view.
 */
const RedditEngagementModal: React.FC<RedditEngagementModalProps> = ({ 
  isOpen, 
  onClose, 
  post,
  workflowId 
}) => {
  // Reddit Engagement State - matches the state management from AnalysisResultPanel
  const [redditResponses, setRedditResponses] = useState<RedditResponse[]>([]);
  const [redditIsLoading, setRedditIsLoading] = useState(false);
  const [redditError, setRedditError] = useState<string | null>(null);
  const [redditHasGenerated, setRedditHasGenerated] = useState(false);

  /**
   * Load persisted engagement data when modal opens
   * Why this matters: Maintains consistency with the main panel's state persistence
   */
  useEffect(() => {
    if (isOpen && post) {
      const postKey = post.id || `post-${Date.now()}`;
      const stored = localStorage.getItem(`reddit-engagement-${workflowId}-${postKey}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setRedditResponses(data.responses || []);
          setRedditHasGenerated(data.hasGenerated || false);
          setRedditError(null);
          setRedditIsLoading(false);
        } catch (error) {
          console.error('Error loading stored Reddit engagement data:', error);
        }
      } else {
        // Reset state for new post
        setRedditResponses([]);
        setRedditHasGenerated(false);
        setRedditError(null);
        setRedditIsLoading(false);
      }
    }
  }, [isOpen, post, workflowId]);

  /**
   * Save data when responses change
   * Why this matters: Persists engagement data across modal open/close cycles
   */
  useEffect(() => {
    if (post && (redditResponses.length > 0 || redditHasGenerated)) {
      const postKey = post.id || `post-${Date.now()}`;
      const dataToStore = {
        responses: redditResponses,
        hasGenerated: redditHasGenerated
      };
      localStorage.setItem(`reddit-engagement-${workflowId}-${postKey}`, JSON.stringify(dataToStore));
    }
  }, [redditResponses, redditHasGenerated, post, workflowId]);

  /**
   * Handle ESC key to close modal
   * Why this matters: Standard modal behavior for accessibility
   */
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  /**
   * Handle backdrop click to close modal
   * Why this matters: Standard UX pattern - clicking outside modal should close it
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`reddit-engagement-modal-backdrop ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease'
        }}
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div 
        className={`reddit-engagement-modal ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '80vw',
          maxWidth: '1200px',
          minWidth: '750px',
          height: '100vh',
          backgroundColor: 'white',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          className="reddit-engagement-modal-header"
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f8fafc',
            flexShrink: 0
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Reddit Engagement
                </h2>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  margin: 0
                }}>
                  Generate authentic responses for Reddit discussions
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <X style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>
          
          {/* Post Context */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Engaging with:
            </h3>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500',
              color: '#374151',
              margin: 0,
              marginBottom: '0.5rem',
              lineHeight: '1.4'
            }}>
              {post.title}
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                r/{post.subreddit}
              </span>
              <a
                href={post.permalink.startsWith('http') ? post.permalink : `https://reddit.com${post.permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#D93801',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#B8300A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#D93801';
                }}
              >
                View on Reddit
              </a>
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          className="reddit-engagement-modal-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem'
          }}
        >
          <RedditEngagementPanel 
            post={post}
            responses={redditResponses}
            setResponses={setRedditResponses}
            isLoading={redditIsLoading}
            setIsLoading={setRedditIsLoading}
            error={redditError}
            setError={setRedditError}
            hasGenerated={redditHasGenerated}
            setHasGenerated={setRedditHasGenerated}
          />
        </div>
      </div>

      {/* Mobile Responsive Styles */}
      <style>
        {`
          @media (max-width: 768px) {
            .reddit-engagement-modal {
              width: 100vw !important;
              min-width: auto !important;
              max-width: none !important;
            }
            
            .reddit-engagement-modal-header {
              padding: 1rem !important;
            }
            
            .reddit-engagement-modal-header h2 {
              font-size: 1.125rem !important;
            }
            
            .reddit-engagement-modal-content {
              padding: 1rem !important;
            }
          }
          
          @media (max-width: 1024px) {
            .reddit-engagement-modal {
              width: 85vw !important;
              min-width: 650px !important;
            }
          }
          
          /* Smooth animations */
          .reddit-engagement-modal-backdrop.open {
            animation: fadeIn 0.3s ease;
          }
          
          .reddit-engagement-modal.open {
            animation: slideInRight 0.3s ease;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}
      </style>
    </>
  );
};

export default RedditEngagementModal;
