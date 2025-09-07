import React, { useState, useEffect } from 'react';
import { X, MessageCircle, ArrowUp, Clock, User, ExternalLink, Search } from 'lucide-react';
import { AnalyzedPost } from '../types';
import CommentGenerationCard from './CommentGenerationCard';

interface CommentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: AnalyzedPost;
  keywords: string;
  generatedComments: Record<string, any>;
  setGeneratedComments: (comments: Record<string, any>) => void;
}

/**
 * CommentPreviewModal Component
 * Why this matters: Shows actual comments where keywords are mentioned, not just counts.
 * Allows users to see the full context of discussions about their keywords.
 */
const CommentPreviewModal: React.FC<CommentPreviewModalProps> = ({
  isOpen,
  onClose,
  post,
  keywords,
  generatedComments,
  setGeneratedComments
}) => {
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

  if (!isOpen) return null;

  const comments = post.comment_analysis?.top_comments || [];
  const filteredComments = selectedSentiment === 'all' 
    ? comments 
    : comments.filter(comment => comment.brand_sentiment === selectedSentiment);

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
   * Decode HTML entities in text
   * Why this matters: Converts HTML entities like &gt; to their actual characters like >
   */
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  /**
   * Highlight keywords, render markdown formatting, and make links clickable in comment text
   * Why this matters: Makes it easy to spot keywords, properly renders bold/italic text,
   * and allows users to click on links within comments to navigate to external resources.
   */
  const highlightKeywords = (text: string): React.ReactElement => {
    if (!text) {
      return <span>{text}</span>;
    }

    // First decode HTML entities
    const decodedText = decodeHtmlEntities(text);

    // Process markdown formatting (bold, italic) before handling links and keywords
    const processMarkdown = (inputText: string): React.ReactNode[] => {
      const elements: React.ReactNode[] = [];
      
      // Combined pattern for bold (**text**), italic (*text*), and links
      const markdownPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[^\s\)]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\[[^\]]+\]\([^)]+\))/gi;
      
      const parts = inputText.split(markdownPattern);
      
      parts.forEach((part, index) => {
        if (!part) return;
        
        // Check for bold text **text**
        const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
        if (boldMatch) {
          const boldText = boldMatch[1];
          elements.push(
            <strong key={`bold-${index}`} style={{ fontWeight: '700' }}>
              {processTextForKeywords(boldText)}
            </strong>
          );
          return;
        }
        
        // Check for italic text *text* (but not bold)
        const italicMatch = part.match(/^\*([^*]+)\*$/);
        if (italicMatch) {
          const italicText = italicMatch[1];
          elements.push(
            <em key={`italic-${index}`} style={{ fontStyle: 'italic' }}>
              {processTextForKeywords(italicText)}
            </em>
          );
          return;
        }
        
        // Check if this part is a markdown link
        const markdownLinkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (markdownLinkMatch) {
          const [, linkText, url] = markdownLinkMatch;
          elements.push(
            <a
              key={`link-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2563eb',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#2563eb';
              }}
            >
              {linkText}
            </a>
          );
          return;
        }
        
        // Check if this part is a URL
        const urlPattern = /(https?:\/\/[^\s\)]+)/gi;
        if (urlPattern.test(part)) {
          elements.push(
            <a
              key={`url-${index}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2563eb',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#2563eb';
              }}
            >
              {part}
            </a>
          );
          return;
        }
        
        // Check if this part is an email
        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
        if (emailPattern.test(part)) {
          elements.push(
            <a
              key={`email-${index}`}
              href={`mailto:${part}`}
              style={{
                color: '#2563eb',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#2563eb';
              }}
            >
              {part}
            </a>
          );
          return;
        }
        
        // Regular text - process for keywords
        elements.push(...processTextForKeywords(part, index));
      });
      
      return elements;
    };

    // Helper function to process text for keyword highlighting with variations
    const processTextForKeywords = (text: string, baseIndex: number = 0): React.ReactNode[] => {
      if (!keywords) {
        return [<span key={`text-${baseIndex}`}>{text}</span>];
      }
      
      const keywordList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
      
      if (keywordList.length === 0) {
        return [<span key={`text-${baseIndex}`}>{text}</span>];
      }
      
      // Generate all keyword variations for highlighting
      const allKeywordVariations = new Set<string>();
      keywordList.forEach(keyword => {
        allKeywordVariations.add(keyword);
        // Add variations for each keyword
        const variations = generateKeywordVariations(keyword);
        variations.forEach(variation => allKeywordVariations.add(variation));
      });
      
      const keywordPattern = new RegExp(`\\b(${Array.from(allKeywordVariations).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
      const keywordParts = text.split(keywordPattern);
      
      return keywordParts.map((keywordPart, keywordIndex) => {
        if (!keywordPart) return null;
        
        const isKeywordOrVariation = allKeywordVariations.has(keywordPart.toLowerCase());
        
        if (isKeywordOrVariation) {
          return (
            <span 
              key={`keyword-${baseIndex}-${keywordIndex}`}
              style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '2px 4px',
                borderRadius: '3px',
                fontWeight: '600'
              }}
            >
              {keywordPart}
            </span>
          );
        } else {
          return (
            <span key={`text-${baseIndex}-${keywordIndex}`}>{keywordPart}</span>
          );
        }
      }).filter(Boolean);
    };

    /**
     * Generate keyword variations for enhanced highlighting
     * Why this matters: Creates common variations of keywords (plurals, "ing" forms, etc.)
     * to highlight more relevant mentions in comments
     */
    const generateKeywordVariations = (term: string): string[] => {
      const variations: string[] = [];
      const lowerTerm = term.toLowerCase();
      
      // Basic plurals and verb forms
      variations.push(
        lowerTerm + 's',           // prospects
        lowerTerm + 'ing',         // prospecting
        lowerTerm + 'ed',          // prospected
        lowerTerm + 'or',          // prospector (agent noun)
        lowerTerm + 'ors',         // prospectors
        lowerTerm + 'er',          // prospecter (alternative agent noun)
        lowerTerm + 'ers'          // prospecters
      );
      
      // Handle words ending in 'y' -> 'ies' (e.g., company -> companies)
      if (lowerTerm.endsWith('y') && lowerTerm.length > 2) {
        const stem = lowerTerm.slice(0, -1);
        variations.push(stem + 'ies');
      }
      
      // Handle words ending in 'e' for 'ing' form (e.g., sale -> selling, but also sales)
      if (lowerTerm.endsWith('e') && lowerTerm.length > 2) {
        const stem = lowerTerm.slice(0, -1);
        variations.push(stem + 'ing');
      }
      
      // Handle consonant doubling for 'ing' (e.g., plan -> planning)
      if (lowerTerm.length >= 3) {
        const lastChar = lowerTerm[lowerTerm.length - 1];
        const secondLastChar = lowerTerm[lowerTerm.length - 2];
        const thirdLastChar = lowerTerm[lowerTerm.length - 3];
        
        // Simple heuristic: if word ends with consonant-vowel-consonant pattern
        if (isConsonant(lastChar) && isVowel(secondLastChar) && isConsonant(thirdLastChar)) {
          variations.push(lowerTerm + lastChar + 'ing'); // plan -> planning
          variations.push(lowerTerm + lastChar + 'ed');  // plan -> planned
        }
      }
      
      // Handle irregular plurals for common business terms
      const irregularPlurals: Record<string, string[]> = {
        'person': ['people'],
        'child': ['children'],
        'man': ['men'],
        'woman': ['women'],
        'foot': ['feet'],
        'tooth': ['teeth'],
        'analysis': ['analyses'],
        'datum': ['data'],
        'medium': ['media'],
        'criterion': ['criteria']
      };
      
      if (irregularPlurals[lowerTerm]) {
        variations.push(...irregularPlurals[lowerTerm]);
      }
      
      // Also check if the term itself might be a plural of an irregular form
      for (const [singular, plurals] of Object.entries(irregularPlurals)) {
        if (plurals.includes(lowerTerm)) {
          variations.push(singular);
        }
      }
      
      return variations.filter(v => v !== lowerTerm); // Don't include the original term
    };

    /**
     * Helper function to check if a character is a vowel
     */
    const isVowel = (char: string): boolean => {
      return 'aeiou'.includes(char.toLowerCase());
    };

    /**
     * Helper function to check if a character is a consonant
     */
    const isConsonant = (char: string): boolean => {
      return /[bcdfghjklmnpqrstvwxyz]/i.test(char);
    };

    // Then process the text to handle both links and keywords
    const processText = (inputText: string): React.ReactNode[] => {
      return processMarkdown(inputText);
    };

    return <span>{processText(decodedText)}</span>;
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
   * Highlight keywords in post content for the post modal
   * Why this matters: Makes it easy for users to quickly identify where their search keywords appear
   */
  const highlightPostKeywords = (text: string): React.ReactElement => {
    if (!keywords || !text) {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{text.replace(/\\n/g, '\n')}</div>;
    }

    // Split keywords by comma and clean them up
    const keywordList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
    
    if (keywordList.length === 0) {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{text.replace(/\\n/g, '\n')}</div>;
    }

    // First, replace escaped newlines with actual newlines
    const processedText = text.replace(/\\n/g, '\n');

    // Create a regex pattern to match any of the keywords as whole words only (case-insensitive)
    const pattern = new RegExp(`\\b(${keywordList.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    
    // Split text by the pattern and create highlighted spans
    const parts = processedText.split(pattern);
    
    return (
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {parts.map((part, index) => {
          const isKeyword = keywordList.some(keyword => 
            part.toLowerCase() === keyword.toLowerCase()
          );
          
          return isKeyword ? (
            <span 
              key={index} 
              style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '2px 4px',
                borderRadius: '3px',
                fontWeight: '600'
              }}
            >
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </div>
    );
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
              💬 Comments Mentioning "{keywords}"
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
              <span>{comments.length} comments found</span>
              <span>•</span>
              <span>{post.comment_analysis?.keyword_mentions || 0} total mentions</span>
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

        {/* Sentiment Filter */}
        <div style={{
          padding: '1rem 1.5rem 1rem 1.5rem',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginRight: '0.5rem' }}>
              Filter by sentiment:
            </span>
            {(['all', 'positive', 'negative', 'neutral'] as const).map((sentiment) => (
              <button
                key={sentiment}
                onClick={() => setSelectedSentiment(sentiment)}
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: selectedSentiment === sentiment ? '#EBF212' : 'white',
                  color: selectedSentiment === sentiment ? '#000' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'capitalize'
                }}
                onMouseOver={(e) => {
                  if (selectedSentiment !== sentiment) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedSentiment !== sentiment) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
              >
                {sentiment} {sentiment !== 'all' && `(${comments.filter(c => c.brand_sentiment === sentiment).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Comments List */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1.5rem',
          paddingTop: '1rem'
        }}>
          {filteredComments.length === 0 ? (
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
                {selectedSentiment === 'all' 
                  ? 'No comments with keyword mentions were found for this post.'
                  : `No ${selectedSentiment} comments found. Try a different sentiment filter.`
                }
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
                    
                    {/* Sentiment Badge */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: comment.brand_sentiment === 'positive' ? '#dcfce7' : 
                                       comment.brand_sentiment === 'negative' ? '#fef2f2' : '#f3f4f6',
                        color: comment.brand_sentiment === 'positive' ? '#166534' : 
                               comment.brand_sentiment === 'negative' ? '#dc2626' : '#374151'
                      }}>
                        Brand: {comment.brand_sentiment === 'positive' ? '😊 Positive' : 
                               comment.brand_sentiment === 'negative' ? '😞 Negative' : '😐 Neutral'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Comment Content */}
                  <div style={{
                    fontSize: '0.9375rem',
                    lineHeight: '1.6',
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {highlightKeywords(comment.content)}
                  </div>
                  
                  {/* Comment Generation Card */}
                  {comment.keyword_matches && comment.keyword_matches.length > 0 && (
                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <CommentGenerationCard
                        comment={comment}
                        post={post}
                        brandKit={brandKit}
                        generatedComments={generatedComments}
                        setGeneratedComments={setGeneratedComments}
                      />
                    </div>
                  )}
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
            Showing {filteredComments.length} of {comments.length} comments
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
                    border: '1px solid #f3f4f6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {highlightPostKeywords(post.content)}
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

export default CommentPreviewModal;
