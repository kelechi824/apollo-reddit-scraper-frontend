import React, { useState, useEffect } from 'react';
import { MessageSquare, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import RedditResponseCard from './RedditResponseCard';
import { AnalyzedPost, RedditResponse, RedditEngagementResponse } from '../types';
import { makeApiRequest } from '../utils/apiHelpers';
import { API_BASE_URL } from '../config/api';

// Skeleton component for loading states
const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div 
    className={className}
    style={{
      backgroundColor: '#f3f4f6',
      borderRadius: '0.375rem',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      ...style
    }}
  />
);

interface RedditEngagementPanelProps {
  post: AnalyzedPost;
  responses: RedditResponse[];
  setResponses: (responses: RedditResponse[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  hasGenerated: boolean;
  setHasGenerated: (generated: boolean) => void;
}

/**
 * RedditEngagementPanel Component
 * Why this matters: Provides social media teams with 5 ready-to-use Reddit responses
 * that follow community guidelines and maintain Apollo's brand voice.
 */
const RedditEngagementPanel: React.FC<RedditEngagementPanelProps> = ({ 
  post, 
  responses, 
  setResponses, 
  isLoading, 
  setIsLoading, 
  error,
  setError, 
  hasGenerated, 
  setHasGenerated 
}) => {
  const [brandKit, setBrandKit] = useState<any>(null);
  const [regeneratingIndices, setRegeneratingIndices] = useState<Set<number>>(new Set());
  const [showSkeletons, setShowSkeletons] = useState(false);

  /**
   * Handle editing individual response
   * Why this matters: Allows users to customize responses to better fit their voice
   */
  const handleEditResponse = (index: number, newContent: string) => {
    const updatedResponses = [...responses];
    updatedResponses[index] = {
      ...updatedResponses[index],
      content: newContent
    };
    setResponses(updatedResponses);
  };

  /**
   * Handle regenerating individual response
   * Why this matters: Users can regenerate just one response instead of all 5
   */
  const handleRegenerateResponse = async (index: number) => {
    try {
      setError(null);
      
      // Add this index to regenerating set
      setRegeneratingIndices(prev => new Set(prev).add(index));
      
      // Generate a single new response
      const response = await makeApiRequest<RedditEngagementResponse>(`${API_BASE_URL}/api/reddit-engagement/generate-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_context: {
            title: post.title,
            content: post.content || '',
            subreddit: post.subreddit,
            pain_point: post.analysis.pain_point,
            content_opportunity: post.analysis.content_opportunity,
            audience_summary: post.analysis.audience_insight
          },
          brand_kit: brandKit
        })
      });

      if (response.data?.success && response.data?.responses && response.data.responses.length > 0) {
        // Replace the specific response with a new one
        const updatedResponses = [...responses];
        updatedResponses[index] = response.data.responses[0]; // Use the first generated response
        setResponses(updatedResponses);
      } else {
        setError('Failed to regenerate response. Please try again.');
      }
    } catch (error) {
      console.error('Error regenerating response:', error);
      setError('Failed to regenerate response. Please try again.');
    } finally {
      // Remove this index from regenerating set
      setRegeneratingIndices(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  /**
   * Load brand kit from localStorage
   * Why this matters: Provides Apollo context for personalized Reddit responses.
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
   * Generate Reddit responses using the backend API
   * Why this matters: Creates authentic, brand-aligned responses for Reddit engagement.
   */
  const generateRedditResponses = async () => {
    setIsLoading(true);
    setError('');
    
    // If responses already exist, show skeletons instead of clearing
    if (responses.length > 0) {
      setShowSkeletons(true);
    } else {
      setResponses([]);
    }

    try {
      console.log('🎯 Generating Reddit responses for:', post.title);

      // Validate required post data
      if (!post.analysis?.pain_point || !post.analysis?.content_opportunity || !post.analysis?.audience_insight) {
        throw new Error('Missing required post analysis data. Please ensure the post has been fully analyzed.');
      }

      const requestData = {
        post_context: {
          title: post.title,
          content: post.content || '',
          subreddit: post.subreddit,
          pain_point: post.analysis.pain_point,
          content_opportunity: post.analysis.content_opportunity,
          audience_summary: post.analysis.audience_insight
        },
        brand_kit: brandKit
      };

      console.log('📤 Sending request with brand kit:', !!brandKit);

      const result = await makeApiRequest<RedditEngagementResponse>(
        `${API_BASE_URL.replace(/\/$/, '')}/api/reddit-engagement/generate-responses`,
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );

      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to generate Reddit responses');
      }

      if (!result.data?.responses || result.data.responses.length === 0) {
        throw new Error('No responses were generated. Please try again.');
      }

      console.log('✅ Generated Reddit responses:', result.data);
      console.log(`📊 Brand context applied: ${result.data.metadata?.brand_context_applied ? 'Yes' : 'No'}`);
      
      setShowSkeletons(false);
      setResponses(result.data.responses);
      setHasGenerated(true);

    } catch (err) {
      console.error('❌ Reddit response generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate Reddit responses');
      setShowSkeletons(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle regenerating responses
   * Why this matters: Allows users to get fresh response variations if needed.
   */
  const handleRegenerate = () => {
    setResponses([]);
    setHasGenerated(false);
    generateRedditResponses();
  };

  return (
    <div className="reddit-engagement-panel">
      {/* Header Section */}
      <div style={{ 
        marginBottom: '1.5rem',
        padding: '1.25rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          color: '#1e293b',
          margin: 0,
          marginBottom: '0.75rem'
        }}>
          Let's Engage!
        </h4>
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#64748b', 
          margin: 0,
          lineHeight: '1.5',
          marginBottom: '0.5rem'
        }}>
          Get 5 ready-to-use comments tailored to this Reddit post.
        </p>


        {/* Generate Button */}
        {!hasGenerated && !isLoading && (
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={generateRedditResponses}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                backgroundColor: '#D93801',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#B8300A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#D93801';
              }}
            >
              <MessageSquare style={{ width: '1rem', height: '1rem' }} />
              Generate comments
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc2626', margin: 0 }}>
              Generation Error
            </p>
            <p style={{ fontSize: '0.8125rem', color: '#991b1b', margin: 0 }}>
              {error}
            </p>
          </div>
        </div>
      )}



      {/* Loading State */}
      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.75rem',
          border: '1px solid #f3f4f6'
        }}>
          <Loader2 style={{ 
            width: '2rem', 
            height: '2rem', 
            color: '#3b82f6',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }} />
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#374151', 
            fontWeight: '500',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            Generating comments...
          </p>
          <p style={{ 
            fontSize: '0.8125rem', 
            color: '#6b7280',
            margin: 0
          }}>
            Creating authentic responses for this post that follow Reddit community guidelines...
          </p>
        </div>
      )}

      {/* Generated Responses */}
      {hasGenerated && responses.length > 0 && (
        <div>
          {/* Regenerate Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#374151', 
              fontWeight: '500',
              margin: 0
            }}>
              {responses.length} responses generated • Ready to copy and use
            </p>
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
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
              <RefreshCw style={{ width: '0.875rem', height: '0.875rem' }} />
              Regenerate All
            </button>
          </div>

          {/* Response Cards */}
          <div className="reddit-responses-grid">
            {showSkeletons ? (
              // Show skeleton cards when regenerating all
              Array.from({ length: 5 }, (_, index) => (
                <div key={`skeleton-${index}`} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  marginBottom: '1rem'
                }}>
                  {/* Skeleton Header */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Skeleton style={{ height: '1.5rem', width: '8rem' }} />
                      <Skeleton style={{ height: '1.5rem', width: '10rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Skeleton style={{ height: '2rem', width: '4rem' }} />
                      <Skeleton style={{ height: '2rem', width: '10rem' }} />
                      <Skeleton style={{ height: '2rem', width: '4rem' }} />
                    </div>
                  </div>

                  {/* Skeleton Content */}
                  <Skeleton style={{ 
                    height: '8rem', 
                    width: '100%', 
                    marginBottom: '1rem' 
                  }} />

                  {/* Skeleton Strategy */}
                  <Skeleton style={{ height: '1rem', width: '70%' }} />
                </div>
              ))
            ) : (
              // Show actual response cards or individual skeletons
              responses.map((response, index) => 
                regeneratingIndices.has(index) ? (
                  // Show skeleton for this specific card
                  <div key={`regenerating-${index}`} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    marginBottom: '1rem'
                  }}>
                    {/* Skeleton Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Skeleton style={{ height: '1.5rem', width: '8rem' }} />
                        <Skeleton style={{ height: '1.5rem', width: '10rem' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Skeleton style={{ height: '2rem', width: '4rem' }} />
                        <Skeleton style={{ height: '2rem', width: '10rem' }} />
                        <Skeleton style={{ height: '2rem', width: '4rem' }} />
                      </div>
                    </div>

                    {/* Skeleton Content */}
                    <Skeleton style={{ 
                      height: '8rem', 
                      width: '100%', 
                      marginBottom: '1rem' 
                    }} />

                    {/* Skeleton Strategy */}
                    <Skeleton style={{ height: '1rem', width: '70%' }} />
                  </div>
                ) : (
                  // Show actual response card
                  <RedditResponseCard
                    key={response.id}
                    response={response}
                    index={index}
                    post={post}
                    onEdit={handleEditResponse}
                    onRegenerate={handleRegenerateResponse}
                  />
                )
              )
            )}
          </div>
        </div>
      )}

      {/* CSS for loading animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </div>
  );
};

export default RedditEngagementPanel;
