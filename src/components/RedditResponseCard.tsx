import React, { useState, useEffect } from 'react';
import { Copy, Check, Search, X, Edit3, RefreshCw, Save, ExternalLink } from 'lucide-react';
import { RedditResponse, AnalyzedPost } from '../types';

interface RedditResponseCardProps {
  response: RedditResponse;
  index: number;
  post: AnalyzedPost;
  onEdit: (index: number, newContent: string) => void;
  onRegenerate: (index: number) => void;
}

/**
 * RedditResponseCard Component
 * Why this matters: Displays individual Reddit responses with copy functionality,
 * making it easy for social media teams to quickly copy and use responses.
 */
const RedditResponseCard: React.FC<RedditResponseCardProps> = ({ response, index, post, onEdit, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [copiedAndOpened, setCopiedAndOpened] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(response.content);

  /**
   * Handle showing/hiding modal with click
   * Why this matters: Click-based modals are more user-friendly and work better on mobile
   */
  const handleToggleModal = () => {
    setShowPostModal(!showPostModal);
  };

  const handleCloseModal = () => {
    setShowPostModal(false);
  };

  /**
   * Handle backdrop click to close modal
   * Why this matters: Standard UX pattern - clicking outside modal should close it
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  /**
   * Handle editing functionality
   * Why this matters: Allows users to customize responses to better fit their voice or context
   */
  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(response.content);
  };

  const handleSaveEdit = () => {
    onEdit(index, editedContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(response.content);
    setIsEditing(false);
  };

  /**
   * Handle regenerating individual response
   * Why this matters: Users can regenerate just one response instead of all 5
   */
  const handleRegenerate = async () => {
    await onRegenerate(index);
  };

  /**
   * Format response content for display
   * Why this matters: Converts line breaks and basic formatting to proper HTML for readability
   */
  const formatResponseContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Handle empty lines as paragraph breaks
        if (line.trim() === '') {
          return <div key={index} style={{ height: '0.75rem' }} />;
        }

        // Process bold text first
        const processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          return (
            <div 
              key={index} 
              style={{ 
                marginLeft: '1.5rem', 
                marginBottom: '0.5rem',
                position: 'relative'
              }}
            >
              <span style={{ 
                position: 'absolute', 
                left: '-1.25rem', 
                color: '#6b7280' 
              }}>
                •
              </span>
              <span dangerouslySetInnerHTML={{ __html: processedLine.replace(/^[•-]\s*/, '') }} />
            </div>
          );
        }
        
        // Handle numbered lists
        if (/^\d+\./.test(line.trim())) {
          const match = line.trim().match(/^(\d+\.)\s*(.*)/);
          if (match) {
            return (
              <div 
                key={index} 
                style={{ 
                  marginLeft: '1.5rem', 
                  marginBottom: '0.5rem',
                  position: 'relative'
                }}
              >
                <span style={{ 
                  position: 'absolute', 
                  left: '-1.5rem', 
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {match[1]}
                </span>
                <span dangerouslySetInnerHTML={{ __html: match[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            );
          }
        }
        
        // Regular paragraphs
        return (
          <div 
            key={index} 
            style={{ marginBottom: '0.5rem' }}
            dangerouslySetInnerHTML={{ __html: processedLine }}
          />
        );
      });
  };

  /**
   * Handle copying response content to clipboard
   * Why this matters: Enables one-click copying for immediate use in Reddit discussions.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.content);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy response:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = response.content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  /**
   * Handle copy and open post functionality
   * Why this matters: Streamlines workflow by combining copy and navigation actions
   */
  const handleCopyAndOpenPost = async () => {
    try {
      // First copy the content
      await navigator.clipboard.writeText(response.content);
      setCopiedAndOpened(true);
      
      // Then open the Reddit post in a new tab
      window.open(post.permalink, '_blank', 'noopener,noreferrer');
      
      // Reset state after 2 seconds
      setTimeout(() => {
        setCopiedAndOpened(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy and open post:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = response.content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedAndOpened(true);
        
        // Still try to open the post
        window.open(post.permalink, '_blank', 'noopener,noreferrer');
        
        setTimeout(() => setCopiedAndOpened(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy and open failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  /**
   * Get response type display info
   * Why this matters: Provides clear visual indicators for different engagement strategies.
   */
  const getResponseTypeInfo = (type: string) => {
    switch (type) {
      case 'HELPFUL_EXPERT':
        return {
          label: 'Expert Advice',
          emoji: '🎯',
          color: '#059669', // Green
          bgColor: '#ecfdf5'
        };
      case 'CURIOUS_QUESTION':
        return {
          label: 'Ask Question',
          emoji: '❓',
          color: '#0891b2', // Cyan
          bgColor: '#ecfeff'
        };
      case 'EXPERIENCE_SHARE':
        return {
          label: 'Share Experience',
          emoji: '💬',
          color: '#7c3aed', // Purple
          bgColor: '#f3e8ff'
        };
      case 'RESOURCE_RECOMMENDATION':
        return {
          label: 'Resourceful',
          emoji: '📚',
          color: '#ea580c', // Orange
          bgColor: '#fff7ed'
        };
      case 'COMMUNITY_SUPPORT':
        return {
          label: 'Show Support',
          emoji: '🤝',
          color: '#dc2626', // Red
          bgColor: '#fef2f2'
        };
      default:
        return {
          label: 'General Response',
          emoji: '💭',
          color: '#6b7280',
          bgColor: '#f9fafb'
        };
    }
  };

  const typeInfo = getResponseTypeInfo(response.type);

  return (
    <div 
      className="reddit-response-card"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        marginBottom: '1rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Response Type Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: typeInfo.color,
              backgroundColor: typeInfo.bgColor
            }}
          >
            {typeInfo.emoji} {typeInfo.label}
          </span>
          
          {/* See Original Post Element */}
          <span 
            onClick={handleToggleModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <Search style={{ width: '0.75rem', height: '0.75rem' }} />
            Original Post
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Edit Button */}
          <button
            onClick={isEditing ? handleSaveEdit : handleEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: isEditing ? '#10b981' : '#f3f4f6',
              color: isEditing ? 'white' : '#374151',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isEditing) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isEditing) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
          >
            {isEditing ? (
              <>
                <Save style={{ width: '0.875rem', height: '0.875rem' }} />
                Save
              </>
            ) : (
              <>
                <Edit3 style={{ width: '0.875rem', height: '0.875rem' }} />
                Edit
              </>
            )}
          </button>

          {/* Regenerate Button */}
          <button
            onClick={handleRegenerate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            <RefreshCw style={{ width: '0.875rem', height: '0.875rem' }} />
            Regenerate comment
          </button>

          {/* Copy to Clipboard Button */}
          <button
            onClick={handleCopy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: copied ? '#10b981' : '#f3f4f6',
              color: copied ? 'white' : '#374151',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
          >
            {copied ? (
              <>
                <Check style={{ width: '0.875rem', height: '0.875rem' }} />
                Copied!
              </>
            ) : (
              <>
                <Copy style={{ width: '0.875rem', height: '0.875rem' }} />
                Copy comment
              </>
            )}
          </button>

          {/* Copy & Open Post Button */}
          <button
            onClick={handleCopyAndOpenPost}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: copiedAndOpened ? '#10b981' : '#D93801',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!copiedAndOpened) {
                e.currentTarget.style.backgroundColor = '#B8300A';
              }
            }}
            onMouseLeave={(e) => {
              if (!copiedAndOpened) {
                e.currentTarget.style.backgroundColor = '#D93801';
              }
            }}
          >
            {copiedAndOpened ? (
              <>
                <Check style={{ width: '0.875rem', height: '0.875rem' }} />
                Copied & opened!
              </>
            ) : (
              <>
                <ExternalLink style={{ width: '0.875rem', height: '0.875rem' }} />
                Copy & open post
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response Content */}
      <div style={{ 
        fontSize: '0.95rem', 
        lineHeight: '1.6', 
        color: '#374151',
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        border: '1px solid #f3f4f6'
      }}>
        {isEditing ? (
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '300px',
                height: '300px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: '#374151',
                backgroundColor: 'white',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Edit your response..."
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '0.5rem', 
              marginTop: '0.75rem' 
            }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          formatResponseContent(response.content)
        )}
      </div>

      {/* Engagement Strategy */}
      <div style={{ 
        fontSize: '0.8125rem', 
        color: '#6b7280',
        fontStyle: 'italic',
        borderTop: '1px solid #f3f4f6',
        paddingTop: '0.75rem'
      }}>
        <strong>Strategy:</strong> {response.engagement_strategy}
      </div>

      {/* Modal Backdrop */}
      {showPostModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={handleBackdropClick}
        >
          {/* Original Post Modal */}
          <div 
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              padding: '0',
              maxWidth: '600px',
              maxHeight: '90vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '1.5rem 1.5rem 0 1.5rem',
              borderBottom: '1px solid #f3f4f6',
              paddingBottom: '1rem',
              marginBottom: '0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  padding: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.5rem'
                }}>
                  <Search style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Original Reddit Post
                  </h3>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    margin: 0
                  }}>
                    r/{post.subreddit} • Context for your response
                  </p>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
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
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '1.5rem',
              paddingTop: '1rem'
            }}>
              {/* Post Content */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  marginBottom: '0.75rem',
                  lineHeight: '1.4'
                }}>
                  {post.title}
                </h4>
                
                {post.content && (
                  <div style={{ 
                    fontSize: '0.875rem', 
                    lineHeight: '1.6', 
                    color: '#374151',
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #f3f4f6',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {post.content.replace(/\\n/g, '\n')}
                  </div>
                )}
              </div>

              {/* Post Metadata */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem'
                }}>
                  👥 {post.score} upvotes
                </span>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem'
                }}>
                  💬 {post.comments} comments
                </span>
                {post.created_utc && (
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem'
                  }}>
                    📅 {new Date(post.created_utc * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for spinning animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default RedditResponseCard;
