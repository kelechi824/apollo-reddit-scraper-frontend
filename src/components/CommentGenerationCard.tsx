import React, { useState } from 'react';
import { MessageSquare, RefreshCw, Edit3, Copy, ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CommentResponse, CommentGenerationResponse, AnalyzedPost } from '../types';
import { makeApiRequest } from '../utils/apiHelpers';
import { API_BASE_URL } from '../config/api';

interface CommentGenerationCardProps {
  comment: {
    id: string;
    content: string;
    author: string;
    score: number;
    created_utc: number;
    brand_sentiment: 'positive' | 'negative' | 'neutral';
    helpfulness_sentiment: 'positive' | 'negative' | 'neutral';
    keyword_matches: string[];
  };
  post: AnalyzedPost;
  brandKit?: any;
  generatedComments: Record<string, any>;
  setGeneratedComments: (comments: Record<string, any>) => void;
}

/**
 * CommentGenerationCard Component
 * Why this matters: Provides a complete interface for generating, editing, and managing
 * Reddit responses to individual comments with proper state management and user feedback.
 */
const CommentGenerationCard: React.FC<CommentGenerationCardProps> = ({
  comment,
  post,
  brandKit,
  generatedComments,
  setGeneratedComments
}) => {
  // Get the generated response from persistent state
  const generatedResponse = generatedComments[comment.id] || null;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * Generate a new comment response
   * Why this matters: Creates targeted responses using the specific comment context
   * rather than generic post-level responses.
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
          brand_sentiment: comment.brand_sentiment,
          helpfulness_sentiment: comment.helpfulness_sentiment,
          keyword_matches: comment.keyword_matches,
          score: comment.score,
          created_utc: comment.created_utc
        },
        post_context: {
          title: post.title,
          subreddit: post.subreddit,
          pain_point: post.analysis.pain_point,
          audience_summary: post.analysis.audience_insight,
          content: post.content || ''
        },
        brand_kit: brandKit
      };

      const result = await makeApiRequest<CommentGenerationResponse>(
        `${API_BASE_URL.replace(/\/$/, '')}/api/reddit-engagement/generate-comment`,
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );

      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to generate comment response');
      }

      if (!result.data?.response) {
        throw new Error('No response was generated. Please try again.');
      }

      console.log('✅ Generated comment response:', result.data);
      
      // Update persistent state
      setGeneratedComments({
        ...generatedComments,
        [comment.id]: result.data.response
      });
      setEditedContent(result.data.response.content);

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
    setEditedContent(generatedResponse?.content || '');
  };

  /**
   * Save edited content
   * Why this matters: Persists user edits and updates the response content.
   */
  const handleSaveEdit = () => {
    if (generatedResponse) {
      const updatedResponse = {
        ...generatedResponse,
        content: editedContent
      };
      
      // Update persistent state
      setGeneratedComments({
        ...generatedComments,
        [comment.id]: updatedResponse
      });
    }
    setIsEditing(false);
  };

  /**
   * Cancel editing
   * Why this matters: Allows users to discard changes and revert to original content.
   */
  const handleCancelEdit = () => {
    setEditedContent(generatedResponse?.content || '');
    setIsEditing(false);
  };

  /**
   * Copy response to clipboard
   * Why this matters: Enables quick copying of generated responses for use on Reddit.
   */
  const handleCopy = async () => {
    if (!generatedResponse) return;

    try {
      await navigator.clipboard.writeText(generatedResponse.content);
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
    if (!generatedResponse) return;

    try {
      // Copy to clipboard first
      await navigator.clipboard.writeText(generatedResponse.content);
      
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

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      padding: '1rem',
      marginTop: '0.75rem',
      backgroundColor: generatedResponse ? '#E2E8F0' : '#f8fafc'
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
        {!generatedResponse && (
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
            {isLoading ? 'Generating...' : 'Generate comment'}
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

      {/* Loading State */}
      {isLoading && !generatedResponse && (
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
            Generating a relevant response to this comment...
          </p>
        </div>
      )}

      {/* Generated Response */}
      {generatedResponse && (
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
                    minHeight: '6rem',
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
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {generatedResponse.content}
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
              {generatedResponse.engagement_strategy}
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

export default CommentGenerationCard;
