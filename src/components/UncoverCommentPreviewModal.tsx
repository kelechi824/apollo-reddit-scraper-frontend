import React, { useState, useEffect } from 'react';
import { X, MessageCircle, ArrowUp, Clock, User, ExternalLink, Search, Loader2 } from 'lucide-react';
import { AnalyzedPost } from '../types';
import UncoverCommentGenerationCard from './UncoverCommentGenerationCard';
import { makeApiRequest } from '../utils/apiHelpers';
import { API_BASE_URL } from '../config/api';

interface UncoverCommentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: AnalyzedPost;
  generatedComments: Record<string, any>;
  setGeneratedComments: (comments: Record<string, any>) => void;
}

interface RedditComment {
  id: string;
  content: string;
  author: string;
  score: number;
  created_utc: number;
  permalink: string;
  replies?: RedditComment[];
}

/**
 * UncoverCommentPreviewModal Component
 * Why this matters: Shows actual Reddit comments for Uncover posts by fetching them directly from Reddit.
 * Allows users to see the full context of discussions and generate responses.
 */
const UncoverCommentPreviewModal: React.FC<UncoverCommentPreviewModalProps> = ({
  isOpen,
  onClose,
  post,
  generatedComments,
  setGeneratedComments
}) => {
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [brandKit, setBrandKit] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  /**
   * Handle ESC key to close modal
   * Why this matters: Standard modal behavior for accessibility and consistent UX
   */
  React.useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  /**
   * Load brand kit from localStorage
   * Why this matters: Provides Apollo context for personalized comment responses.
   */
  useEffect(() => {
    const loadBrandKit = () => {
      try {
        const draft = localStorage.getItem('apollo_brand_kit_draft');
        const saved = localStorage.getItem('apollo_brand_kit');
        const dataToLoad = draft || saved;
        
        if (dataToLoad) {
          const parsedBrandKit = JSON.parse(dataToLoad);
          setBrandKit(parsedBrandKit);
        }
      } catch (error) {
        console.error('Error loading brand kit:', error);
      }
    };

    loadBrandKit();

    // Listen for brand kit updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'apollo_brand_kit' || e.key === 'apollo_brand_kit_draft') {
        loadBrandKit();
      }
    };

    const handleCustomStorageChange = () => {
      loadBrandKit();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('apollo_brand_kit_updated', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apollo_brand_kit_updated', handleCustomStorageChange);
    };
  }, []);

  /**
   * Fetch Reddit comments when modal opens
   * Why this matters: Loads actual Reddit comments for the post so users can see and respond to them.
   */
  useEffect(() => {
    if (isOpen && post) {
      fetchRedditComments();
    }
  }, [isOpen, post]);

  /**
   * Fetch comments from Reddit API
   * Why this matters: Gets the actual comments from Reddit since Uncover doesn't analyze comments.
   */
  const fetchRedditComments = async () => {
    setIsLoadingComments(true);
    setCommentsError(null);

    try {
      console.log('🔍 Fetching Reddit comments for post:', post.id);

      const result = await makeApiRequest<{ comments: RedditComment[] }>(
        `${API_BASE_URL.replace(/\/$/, '')}/api/reddit/fetch-comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            post_id: post.id,
            subreddit: post.subreddit,
            permalink: post.permalink,
            limit: 50 // Fetch up to 50 comments
          }),
        }
      );

      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to fetch comments');
      }

      console.log('✅ Fetched Reddit comments:', result.data);
      setComments(result.data?.comments || []);

    } catch (err) {
      console.error('❌ Failed to fetch Reddit comments:', err);
      setCommentsError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  if (!isOpen) return null;

  // Filter comments by sentiment (for now, we'll treat all as neutral since we don't have sentiment analysis)
  const filteredComments = comments;

  /**
   * Format Unix timestamp to relative time (Reddit-style)
   * Why this matters: Matches the existing time formatting in the app for consistency
   */
  const formatRelativeTime = (created_utc: number): string => {
    const now = new Date();
    const commentDate = new Date(created_utc * 1000);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    
    if (diffSeconds < minute) {
      return 'just now';
    } else if (diffSeconds < hour) {
      const minutes = Math.floor(diffSeconds / minute);
      return `${minutes} min. ago`;
    } else if (diffSeconds < day) {
      const hours = Math.floor(diffSeconds / hour);
      return `${hours} hr. ago`;
    } else if (diffSeconds < month) {
      const days = Math.floor(diffSeconds / day);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else {
      const months = Math.floor(diffSeconds / month);
      return `${months} mo. ago`;
    }
  };

  /**
   * Handle backdrop click to close modal
   * Why this matters: Standard UX pattern for modal interactions
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Handle post modal functions
   * Why this matters: Allows users to view the full post content in a modal
   */
  const handleOpenPostModal = () => {
    setShowPostModal(true);
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
  };

  const handlePostModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClosePostModal();
    }
  };

  /**
   * Format Unix timestamp to relative time (Reddit-style)
   * Why this matters: Matches the existing time formatting in the app for consistency
   */
  const formatPostRelativeTime = (created_utc: number): string => {
    const now = new Date();
    const postDate = new Date(created_utc * 1000);
    const diffMs = now.getTime() - postDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    
    if (diffSeconds < minute) {
      return 'just now';
    } else if (diffSeconds < hour) {
      const minutes = Math.floor(diffSeconds / minute);
      return `${minutes} min. ago`;
    } else if (diffSeconds < day) {
      const hours = Math.floor(diffSeconds / hour);
      return `${hours} hr. ago`;
    } else if (diffSeconds < month) {
      const days = Math.floor(diffSeconds / day);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else {
      const months = Math.floor(diffSeconds / month);
      return `${months} mo. ago`;
    }
  };

  /**
   * Format text content with proper markdown-like formatting
   * Why this matters: Converts markdown formatting to proper HTML for better readability
   */
  const formatTextContent = (text: string): React.ReactElement => {
    if (!text) return <div>No content available</div>;

    // First, handle basic escaping and newlines
    let formattedText = text.replace(/\\n/g, '\n');
    
    // Handle HTML entities
    formattedText = formattedText.replace(/&gt;/g, '>');
    formattedText = formattedText.replace(/&lt;/g, '<');
    formattedText = formattedText.replace(/&amp;/g, '&');
    
    // Handle escaped characters
    formattedText = formattedText.replace(/\\-/g, '-');
    
    // Split into lines for processing
    const lines = formattedText.split('\n');
    const processedElements: React.ReactNode[] = [];
    let currentBulletList: string[] = [];
    
    const flushBulletList = () => {
      if (currentBulletList.length > 0) {
        processedElements.push(
          <ul key={`bullet-${processedElements.length}`} style={{
            margin: '0.75rem 0',
            paddingLeft: '1.5rem',
            listStyleType: 'disc'
          }}>
            {currentBulletList.map((item, index) => (
              <li key={index} style={{
                marginBottom: '0.25rem',
                lineHeight: '1.6'
              }}>
                {formatInlineContent(item)}
              </li>
            ))}
          </ul>
        );
        currentBulletList = [];
      }
    };
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle bullet points
      if (trimmedLine.startsWith('* ')) {
        currentBulletList.push(trimmedLine.substring(2).trim());
        return;
      }
      
      // If we have accumulated bullet points and this line is not a bullet, flush them
      if (currentBulletList.length > 0) {
        flushBulletList();
      }
      
      // Handle empty lines
      if (trimmedLine === '') {
        processedElements.push(<br key={`br-${index}`} />);
        return;
      }
      
      // Handle regular paragraphs
      processedElements.push(
        <p key={`p-${index}`} style={{
          margin: '0.75rem 0',
          lineHeight: '1.6'
        }}>
          {formatInlineContent(trimmedLine)}
        </p>
      );
    });
    
    // Flush any remaining bullet points
    flushBulletList();
    
    return <div>{processedElements}</div>;
  };

  /**
   * Format inline content (bold, links, etc.)
   * Why this matters: Handles inline formatting like bold text and clickable links
   */
  const formatInlineContent = (text: string): React.ReactNode => {
    // Handle bold text **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    
    let lastIndex = 0;
    const elements: React.ReactNode[] = [];
    let elementKey = 0;
    
    // First pass: handle bold text
    let processedText = text;
    let match;
    
    // Reset regex
    boldRegex.lastIndex = 0;
    linkRegex.lastIndex = 0;
    
    // Create a combined approach to handle both bold and links
    const parts = [];
    let currentIndex = 0;
    
    // Find all matches for both bold and links
    const allMatches = [];
    
    // Find bold matches
    while ((match = boldRegex.exec(text)) !== null) {
      allMatches.push({
        type: 'bold',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        fullMatch: match[0]
      });
    }
    
    // Find link matches
    boldRegex.lastIndex = 0;
    while ((match = linkRegex.exec(text)) !== null) {
      allMatches.push({
        type: 'link',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        url: match[2],
        fullMatch: match[0]
      });
    }
    
    // Sort matches by start position
    allMatches.sort((a, b) => a.start - b.start);
    
    // Process matches in order
    allMatches.forEach((match) => {
      // Add text before this match
      if (match.start > currentIndex) {
        const beforeText = text.substring(currentIndex, match.start);
        if (beforeText) {
          elements.push(<span key={`text-${elementKey++}`}>{beforeText}</span>);
        }
      }
      
      // Add the formatted match
      if (match.type === 'bold') {
        elements.push(
          <strong key={`bold-${elementKey++}`} style={{ fontWeight: '700' }}>
            {match.content}
          </strong>
        );
      } else if (match.type === 'link') {
        elements.push(
          <a 
            key={`link-${elementKey++}`}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#2563eb',
              textDecoration: 'underline',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#2563eb';
            }}
          >
            {match.content}
          </a>
        );
      }
      
      currentIndex = match.end;
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        elements.push(<span key={`text-${elementKey++}`}>{remainingText}</span>);
      }
    }
    
    return elements.length > 0 ? <>{elements}</> : text;
  };

  /**
   * Legacy function for backward compatibility
   */
  const highlightPostKeywords = (text: string): React.ReactElement => {
    return formatTextContent(text);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`comment-preview-modal-backdrop ${isOpen ? 'open' : ''}`}
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
        className={`comment-preview-modal ${isOpen ? 'open' : ''}`}
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
          <div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: '#1f2937',
              margin: '0 0 0.5rem 0'
            }}>
              💬 All Comments
            </h3>
            
            {/* Post Title Context */}
            <div style={{ 
              marginBottom: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.25rem'
              }}>
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  From Post:
                </div>
                <button
                  onClick={handleOpenPostModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #dbeafe',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dbeafe';
                    e.currentTarget.style.color = '#1d4ed8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                    e.currentTarget.style.color = '#2563eb';
                  }}
                >
                  <Search style={{ width: '0.75rem', height: '0.75rem' }} />
                  See Full Post
                </button>
              </div>
              <div style={{ 
                fontSize: '0.9375rem', 
                fontWeight: '600', 
                color: '#374151',
                lineHeight: '1.4'
              }}>
                {post.title}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              <span>r/{post.subreddit}</span>
              <span>•</span>
              <span>{isLoadingComments ? 'Loading...' : `${comments.length} comments found`}</span>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
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

        {/* Scrollable Comments List */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1.5rem',
          paddingTop: '1rem'
        }}>
          {isLoadingComments ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6b7280'
            }}>
              <Loader2 style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Loading comments...
              </h4>
              <p style={{ fontSize: '0.875rem' }}>
                Fetching comments from Reddit
              </p>
            </div>
          ) : commentsError ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6b7280'
            }}>
              <MessageCircle style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Failed to load comments
              </h4>
              <p style={{ fontSize: '0.875rem' }}>
                {commentsError}
              </p>
              <button
                onClick={fetchRedditComments}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          ) : filteredComments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6b7280'
            }}>
              <MessageCircle style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                No comments found
              </h4>
              <p style={{ fontSize: '0.875rem' }}>
                This post doesn't have any comments yet.
              </p>
            </div>
          ) : (
            <div className="comments-list">
              {filteredComments.map((comment, index) => (
                <div key={comment.id} style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  position: 'relative'
                }}>
                  {/* Comment Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <User style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                          u/{comment.author}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Clock style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {formatRelativeTime(comment.created_utc)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <ArrowUp style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {comment.score}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comment Content */}
                  <div style={{
                    fontSize: '0.9375rem',
                    lineHeight: '1.6',
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    marginBottom: '0.75rem'
                  }}>
                    {comment.content}
                  </div>
                  
                  {/* Comment Generation Card */}
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <UncoverCommentGenerationCard
                      comment={comment}
                      post={post}
                      brandKit={brandKit}
                      generatedComments={generatedComments}
                      setGeneratedComments={setGeneratedComments}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Showing {filteredComments.length} comments
          </div>
          
          <a
            href={post.permalink.startsWith('http') ? post.permalink : `https://reddit.com${post.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#D93801',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
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
            <ExternalLink style={{ width: '1rem', height: '1rem' }} />
            View Full Discussion on Reddit
          </a>
        </div>
      </div>

      {/* Post View Modal */}
      {showPostModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={handlePostModalBackdropClick}
        >
          {/* Post Modal */}
          <div 
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              padding: '0',
              maxWidth: '800px',
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
                <div>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Full Post
                  </h3>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    margin: 0
                  }}>
                    • r/{post.subreddit} • {formatPostRelativeTime(post.created_utc)}
                  </p>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={handleClosePostModal}
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
              {/* Post Header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  marginBottom: '1rem',
                  lineHeight: '1.4'
                }}>
                  {post.title}
                </h4>
                
                {/* Post Stats */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <ArrowUp style={{ width: '0.875rem', height: '0.875rem' }} />
                    {post.score} upvotes
                  </span>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <MessageCircle style={{ width: '0.875rem', height: '0.875rem' }} />
                    {post.comments} comments
                  </span>
                  <a
                    href={post.permalink.startsWith('http') ? post.permalink : `https://reddit.com${post.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
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
                    <ExternalLink style={{ width: '0.875rem', height: '0.875rem' }} />
                    View on Reddit
                  </a>
                </div>
              </div>

              {/* Post Content */}
              {post.content && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h5 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em'
                  }}>
                    Post Content
                  </h5>
                  <div style={{ 
                    fontSize: '0.95rem', 
                    lineHeight: '1.7', 
                    color: '#374151',
                    backgroundColor: '#f9fafb',
                    padding: '1.25rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #f3f4f6'
                  }}>
                    {formatTextContent(post.content)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Responsive Styles */}
      <style>
        {`
          @media (max-width: 768px) {
            .comment-preview-modal {
              width: 100vw !important;
              min-width: auto !important;
              max-width: none !important;
            }
          }
          
          @media (max-width: 1024px) {
            .comment-preview-modal {
              width: 85vw !important;
              min-width: 650px !important;
            }
          }
          
          /* Smooth animations */
          .comment-preview-modal-backdrop.open {
            animation: fadeIn 0.3s ease;
          }
          
          .comment-preview-modal.open {
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

export default UncoverCommentPreviewModal;
