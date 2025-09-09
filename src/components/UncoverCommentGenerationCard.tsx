import React, { useState } from 'react';
import { MessageSquare, RefreshCw, Edit3, Copy, ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CommentVariationsResponse, AnalyzedPost } from '../types';
import { makeApiRequest } from '../utils/apiHelpers';
import { API_BASE_URL } from '../config/api';

interface RedditComment {
  id: string;
  content: string;
  author: string;
  score: number;
  created_utc: number;
  permalink?: string;
}

interface UncoverCommentGenerationCardProps {
  comment: RedditComment;
  post: AnalyzedPost;
  brandKit?: any;
  generatedComments: Record<string, any>;
  setGeneratedComments: (comments: Record<string, any>) => void;
}

/**
 * UncoverCommentGenerationCard Component
 * Why this matters: Provides a complete interface for generating, editing, and managing
 * Reddit responses to individual raw Reddit comments with proper state management and user feedback.
 */
const UncoverCommentGenerationCard: React.FC<UncoverCommentGenerationCardProps> = ({
  comment,
  post,
  brandKit,
  generatedComments,
  setGeneratedComments
}) => {
  // Get the generated response from persistent state
  const generatedData = generatedComments[comment.id] || null;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentVariationIndex, setCurrentVariationIndex] = useState(0);

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

  // Handle both old single response format and new variations format
  const isVariationsFormat = generatedData && Array.isArray(generatedData.variations);
  const variations = isVariationsFormat ? generatedData.variations : (generatedData ? [generatedData] : []);
  const currentVariation = variations[currentVariationIndex] || null;

  /**
   * Generate a new comment response for raw Reddit comments
   * Why this matters: Creates targeted responses using the specific comment context
   * without relying on pre-analyzed sentiment data.
   */
  const generateCommentResponse = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`💬 Generating response for comment by u/${comment.author}`);

      const requestData = {
        comment_context: {
          content: comment.content,
          author: comment.author,
          // Default sentiment values since we don't have analysis
          brand_sentiment: 'neutral' as const,
          helpfulness_sentiment: 'neutral' as const,
          keyword_matches: [], // No keyword matches for raw comments
          score: comment.score,
          created_utc: comment.created_utc
        },
        post_context: {
          title: post.title,
          subreddit: post.subreddit,
          pain_point: post.analysis?.pain_point || 'General discussion',
          audience_summary: post.analysis?.audience_insight || 'Reddit community members',
          content: post.content || ''
        },
        brand_kit: brandKit
      };

      const result = await makeApiRequest<CommentVariationsResponse>(
        `${API_BASE_URL.replace(/\/$/, '')}/api/reddit-engagement/generate-comment-variations`,
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );

      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to generate comment variations');
      }

      if (!result.data?.variations || result.data.variations.length === 0) {
        throw new Error('No variations were generated. Please try again.');
      }

      console.log('✅ Generated comment variations:', result.data);
      
      // Update persistent state with variations
      setGeneratedComments({
        ...generatedComments,
        [comment.id]: {
          variations: result.data.variations,
          currentVariation: 0
        }
      });
      setCurrentVariationIndex(0);
      setEditedContent(result.data.variations[0].content);

    } catch (err) {
      console.error('❌ Comment response generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate comment response');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle editing the generated response
   * Why this matters: Allows users to customize the AI-generated response to better
   * match their voice or specific requirements.
   */
  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(currentVariation?.content || '');
  };

  /**
   * Save edited content
   * Why this matters: Persists user edits and updates the response content.
   */
  const handleSaveEdit = () => {
    if (currentVariation && generatedData) {
      if (isVariationsFormat) {
        // Update the current variation in the variations array
        const updatedVariations = [...variations];
        updatedVariations[currentVariationIndex] = {
          ...currentVariation,
          content: editedContent
        };
        
        setGeneratedComments({
          ...generatedComments,
          [comment.id]: {
            ...generatedData,
            variations: updatedVariations
          }
        });
      } else {
        // Legacy single response format
        const updatedResponse = {
          ...currentVariation,
          content: editedContent
        };
        
        setGeneratedComments({
          ...generatedComments,
          [comment.id]: updatedResponse
        });
      }
    }
    setIsEditing(false);
  };

  /**
   * Cancel editing
   * Why this matters: Allows users to discard changes and revert to original content.
   */
  const handleCancelEdit = () => {
    setEditedContent(currentVariation?.content || '');
    setIsEditing(false);
  };

  /**
   * Copy response to clipboard
   * Why this matters: Enables quick copying of generated responses for use on Reddit.
   */
  const handleCopy = async () => {
    if (!currentVariation) return;

    try {
      await navigator.clipboard.writeText(currentVariation.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  /**
   * Copy response and open Reddit post
   * Why this matters: Streamlines the workflow by copying the response and opening
   * the Reddit post in a new tab for immediate engagement.
   */
  const handleCopyAndOpenReddit = async () => {
    if (!currentVariation) return;

    try {
      // Copy to clipboard first
      await navigator.clipboard.writeText(currentVariation.content);
      
      // Open Reddit post in new tab
      const redditUrl = post.permalink.startsWith('http') 
        ? post.permalink 
        : `https://reddit.com${post.permalink}`;
      
      window.open(redditUrl, '_blank', 'noopener,noreferrer');
      
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy and open Reddit:', err);
    }
  };

  /**
   * Navigate to previous variation
   * Why this matters: Allows users to cycle through different response options.
   */
  const handlePreviousVariation = () => {
    if (variations.length > 1) {
      const newIndex = currentVariationIndex > 0 ? currentVariationIndex - 1 : variations.length - 1;
      setCurrentVariationIndex(newIndex);
      if (isEditing) {
        setEditedContent(variations[newIndex].content);
      }
    }
  };

  /**
   * Navigate to next variation
   * Why this matters: Allows users to cycle through different response options.
   */
  const handleNextVariation = () => {
    if (variations.length > 1) {
      const newIndex = currentVariationIndex < variations.length - 1 ? currentVariationIndex + 1 : 0;
      setCurrentVariationIndex(newIndex);
      if (isEditing) {
        setEditedContent(variations[newIndex].content);
      }
    }
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      padding: '1rem',
      marginTop: '0.75rem',
      backgroundColor: currentVariation ? '#E2E8F0' : '#f8fafc'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: '0.5rem',
        marginBottom: '0.75rem'
      }}>

        {/* Generate Button */}
        {!currentVariation && (
          <button
            onClick={generateCommentResponse}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              backgroundColor: isLoading ? '#f3f4f6' : '#D93801',
              color: isLoading ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#B8300A';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#D93801';
              }
            }}
          >
            {isLoading ? (
              <Loader2 style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} />
            ) : (
              <MessageSquare style={{ width: '0.875rem', height: '0.875rem' }} />
            )}
            {isLoading ? 'Generating...' : 'Generate a reply'}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <AlertCircle style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
          <span style={{ fontSize: '0.8125rem', color: '#dc2626' }}>
            {error}
          </span>
        </div>
      )}

      {/* Variation Navigation */}
      {currentVariation && variations.length > 1 && !isEditing && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '0.75rem',
          padding: '0.75rem',
          backgroundColor: '#f8fafc',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.025em'
          }}>
            Response Options:
          </span>
          
          <button
            onClick={handlePreviousVariation}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            ←
          </button>
          
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            minWidth: '4rem',
            textAlign: 'center',
            padding: '0.25rem 0.5rem',
            backgroundColor: 'white',
            borderRadius: '0.25rem',
            border: '1px solid #e5e7eb'
          }}>
            {currentVariationIndex + 1} of {variations.length}
          </span>
          
          <button
            onClick={handleNextVariation}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            →
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !currentVariation && (
        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          color: '#6b7280'
        }}>
          <Loader2 style={{
            width: '1.5rem',
            height: '1.5rem',
            margin: '0 auto 0.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontSize: '0.8125rem', margin: 0 }}>
            Generating a relevant reply to this comment...
          </p>
        </div>
      )}

      {/* Generated Response */}
      {currentVariation && (
        <div>
          {/* Response Content */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '0.75rem'
          }}>
            {isEditing ? (
              <div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '10rem',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Edit your response..."
                />
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '0.75rem'
                }}>
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      padding: '0.5rem 0.875rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      padding: '0.5rem 0.875rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.8125rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#374151'
              }}>
                {formatTextContent(currentVariation.content)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={generateCommentResponse}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  backgroundColor: isLoading ? '#f3f4f6' : '#f3f4f6',
                  color: isLoading ? '#9ca3af' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
              >
                {isLoading ? (
                  <Loader2 style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RefreshCw style={{ width: '0.875rem', height: '0.875rem' }} />
                )}
                {isLoading ? 'Regenerating...' : 'Regenerate'}
              </button>

              <button
                onClick={handleEdit}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
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
                <Edit3 style={{ width: '0.875rem', height: '0.875rem' }} />
                Edit
              </button>

              <button
                onClick={handleCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  backgroundColor: copySuccess ? '#dcfce7' : '#f3f4f6',
                  color: copySuccess ? '#166534' : '#374151',
                  border: `1px solid ${copySuccess ? '#bbf7d0' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!copySuccess) {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copySuccess) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
              >
                {copySuccess ? (
                  <CheckCircle style={{ width: '0.875rem', height: '0.875rem' }} />
                ) : (
                  <Copy style={{ width: '0.875rem', height: '0.875rem' }} />
                )}
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>

              <button
                onClick={handleCopyAndOpenReddit}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  backgroundColor: '#D93801',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  cursor: 'pointer',
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
                Copy & Open Reddit
              </button>
            </div>
          )}

          {/* Response Metadata */}
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Response Strategy:
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: '#374151',
              lineHeight: '1.4'
            }}>
              {currentVariation.engagement_strategy}
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
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

export default UncoverCommentGenerationCard;
