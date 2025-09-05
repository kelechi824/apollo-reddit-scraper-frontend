import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Wand2, FileText, AlertTriangle, ChevronDown, ChevronUp, Users, MessageCircle, ArrowUp, Clock, Eye, Trash2, BarChart3, MessageSquare, Search, X } from 'lucide-react';
import { AnalyzedPost, PatternAnalysisResult, PatternAnalysisRequest, PatternCategory } from '../types';
import DigDeeperModal from './DigDeeperModal';
import ContentCreationModal from './ContentCreationModal';
import LinkedInPostModal from './LinkedInPostModal';
import RedditEngagementPanel from './RedditEngagementPanel';
import RedditEngagementModal from './RedditEngagementModal';
import CommentPreviewModal from './CommentPreviewModal';
import { StorageManager } from '../utils/storageManager';

interface AnalysisResultPanelProps {
  analyzedPosts: AnalyzedPost[];
  workflowId: string;
  totalFound: number;
  keywords: string;
  patternAnalysis?: PatternAnalysisResult | null;
  onClear: () => void;
  isAnalyzing?: boolean;
}

interface PatternCategoryCardProps {
  category: PatternCategory;
  categoryIndex: number;
  formatRelativeTime: (created_utc: number) => string;
  analyzedPosts: AnalyzedPost[];
  setCurrentIndex: (index: number) => void;
  setShowPostModal: (show: boolean) => void;
  setIsRedditEngagementModalOpen: (open: boolean) => void;
  setIsDigDeeperModalOpen: (open: boolean) => void;
  handleOpenCommentPreview: (post: AnalyzedPost) => void;
  keywords: string;
}

/**
 * PatternCategoryCard Component
 * Why this matters: Displays each pattern category in Reddit-style format with expandable post list
 */
const PatternCategoryCard: React.FC<PatternCategoryCardProps> = ({
  category,
  categoryIndex,
  formatRelativeTime,
  analyzedPosts,
  setCurrentIndex,
  setShowPostModal,
  setIsRedditEngagementModalOpen,
  setIsDigDeeperModalOpen,
  handleOpenCommentPreview,
  keywords
}) => {
  const [isExpanded, setIsExpanded] = useState(categoryIndex === 0); // First category expanded by default



  return (
    <div className="pattern-category-card" style={{
      border: '1px solid #e2e8f0',
      borderRadius: '0.75rem',
      marginBottom: '1.5rem',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
      overflow: 'hidden'
    }}>
      {/* Category Header */}
      <div 
        className="category-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '1.5rem',
          cursor: 'pointer',
          backgroundColor: '#e2e8f0',
          borderBottom: isExpanded ? '2px solid #cbd5e1' : 'none',
          borderRadius: isExpanded ? '0.75rem 0.75rem 0 0' : '0.75rem',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <h3 style={{
                fontSize: '1.3125rem',
                fontWeight: '800',
                color: '#0f172a',
                margin: 0,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                Discussion Topic: {category.name}
              </h3>
            </div>
            
            <p style={{
              fontSize: '0.9375rem',
              color: '#475569',
              margin: '0 0 1rem 0',
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              {category.description}
            </p>
            
            {/* Category Stats */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2rem',
              fontSize: '0.875rem',
              color: '#475569',
              fontWeight: '600'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <FileText style={{ width: '1.0625rem', height: '1.0625rem', color: '#475569' }} />
                <span>{category.post_count} posts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <ArrowUp style={{ width: '1.0625rem', height: '1.0625rem', color: '#475569' }} />
                <span>{category.total_upvotes} upvotes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <MessageCircle style={{ width: '1.0625rem', height: '1.0625rem', color: '#475569' }} />
                <span>{category.total_comments} comments</span>
              </div>
            </div>

          </div>
          
          {/* Expand/Collapse Icon */}
          <div style={{ marginLeft: '1rem' }}>
            {isExpanded ? (
              <ChevronUp style={{ width: '1.25rem', height: '1.25rem', color: '#64748b' }} />
            ) : (
              <ChevronDown style={{ width: '1.25rem', height: '1.25rem', color: '#64748b' }} />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Posts List */}
      {isExpanded && (
        <div className="category-posts" style={{ 
          padding: '0',
          backgroundColor: '#fafbfc'
        }}>
          {category.posts.map((post, postIndex) => (
            <div key={post.id} style={{
              padding: '1.25rem 1.5rem',
              borderBottom: postIndex < category.posts.length - 1 ? '1px solid #e2e8f0' : 'none',
              backgroundColor: 'white',
              margin: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              position: 'relative'
            }}>
              {/* Post Number Badge */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '4px 8px',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                #{postIndex + 1}
              </div>
              
              {/* Post Title */}
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 1rem 0',
                lineHeight: '1.4'
              }}>
                {post.title}
              </h4>
              
              {/* Post Excerpt */}
              {post.excerpt && (
                <div style={{
                  fontSize: '0.8125rem',
                  color: '#4b5563',
                  lineHeight: '1.6',
                  margin: '0 0 1rem 0',
                  backgroundColor: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  borderLeft: '4px solid #e5e7eb',
                  whiteSpace: 'pre-wrap'
                }}>
                  {post.excerpt.replace(/\\n/g, '\n')}
                  {post.excerpt.length >= 150 && '...'}
                </div>
              )}
              
              {/* Post Metadata */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                fontSize: '0.75rem',
                color: '#6b7280',
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#6b7280',
                  backgroundColor: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>r/{post.subreddit}</span>
                <span style={{ color: '#6b7280' }}>u/{post.author}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280' }}>
                  <Clock style={{ width: '0.875rem', height: '0.875rem' }} />
                  {formatRelativeTime(post.created_utc)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280' }}>
                  <ArrowUp style={{ width: '0.875rem', height: '0.875rem' }} />
                  {post.score}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280' }}>
                  <MessageCircle style={{ width: '0.875rem', height: '0.875rem' }} />
                  {post.comments}
                </span>
                
                {/* Comment Mentions Indicator */}
                {post.comment_mentions && post.comment_mentions > 0 && (
                                      <button
                    onClick={() => {
                      // Find the full post data to pass to the modal
                      const fullPost = analyzedPosts.find(p => p.id === post.id);
                      if (fullPost) {
                        handleOpenCommentPreview(fullPost);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fde68a';
                      e.currentTarget.style.color = '#78350f';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef3c7';
                      e.currentTarget.style.color = '#92400e';
                    }}
                    title="Click to view comments"
                  >
                    💬 View {(() => {
                      const fullPost = analyzedPosts.find(p => p.id === post.id);
                      const commentsCount = fullPost?.comment_analysis?.top_comments?.length || 0;
                      return commentsCount;
                    })()} comments mentioning "{(() => {
                      const firstKeyword = keywords.split(',')[0]?.trim();
                      return firstKeyword || 'keywords';
                    })()}"
                  </button>
                )}
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
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
                        borderRadius: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: '500',
                        border: '1px solid #D93801',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#B8300A';
                        e.currentTarget.style.borderColor = '#B8300A';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#D93801';
                        e.currentTarget.style.borderColor = '#D93801';
                      }}
                    >
                      <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
                      View on Reddit
                    </a>
                    
                    <button
                      onClick={() => {
                        // Set the current post for modal viewing
                        const postIndex = analyzedPosts.findIndex(p => p.id === post.id);
                        if (postIndex !== -1) {
                          setCurrentIndex(postIndex);
                        }
                        setShowPostModal(true);
                      }}
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
                    
                    <button
                      onClick={() => {
                        // Set the current post for modal viewing
                        const postIndex = analyzedPosts.findIndex(p => p.id === post.id);
                        if (postIndex !== -1) {
                          setCurrentIndex(postIndex);
                        }
                        setIsRedditEngagementModalOpen(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#f0fdf4',
                        color: '#059669',
                        border: '1px solid #bbf7d0',
                        borderRadius: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#dcfce7';
                        e.currentTarget.style.color = '#047857';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                        e.currentTarget.style.color = '#059669';
                      }}
                    >
                      <MessageSquare style={{ width: '0.75rem', height: '0.75rem' }} />
                      Engage
                    </button>
                    
                    <button
                      onClick={() => {
                        // Set the current post for modal viewing
                        const postIndex = analyzedPosts.findIndex(p => p.id === post.id);
                        if (postIndex !== -1) {
                          setCurrentIndex(postIndex);
                        }
                        setIsDigDeeperModalOpen(true);
                      }}
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
                      <Wand2 style={{ width: '0.75rem', height: '0.75rem' }} />
                      AI Discovery Chat
                    </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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

const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({
  analyzedPosts,
  workflowId,
  totalFound,
  keywords,
  patternAnalysis: propPatternAnalysis,
  onClear,
  isAnalyzing = false
}) => {
  // Backup persistence state - preserves data during page refreshes
  const [backupAnalysisData, setBackupAnalysisData] = useState<{
    analyzedPosts: AnalyzedPost[];
    workflowId: string;
    totalFound: number;
    keywords: string;
    patternAnalysis: PatternAnalysisResult | null;
  } | null>(() => {
    // Try to restore from localStorage on component mount
    try {
      const stored = localStorage.getItem('apollo-analysis-backup');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the structure before using
        if (parsed && Array.isArray(parsed.analyzedPosts) && parsed.workflowId) {
          // Check if this is compressed or minimal data and show appropriate warning
          if (parsed._compressed) {
            console.warn('Restored compressed analysis backup - some data may be truncated');
          } else if (parsed._minimal) {
            console.warn('Restored minimal analysis backup - detailed analysis data not available');
          }
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to restore analysis backup:', error);
      localStorage.removeItem('apollo-analysis-backup');
    }
    return null;
  });

  // Use props data if available, otherwise fall back to backup
  const effectiveAnalyzedPosts = analyzedPosts.length > 0 ? analyzedPosts : (backupAnalysisData?.analyzedPosts || []);
  const effectiveWorkflowId = workflowId || (backupAnalysisData?.workflowId || '');
  const effectiveTotalFound = totalFound || (backupAnalysisData?.totalFound || 0);
  const effectiveKeywords = keywords || (backupAnalysisData?.keywords || '');
  const effectivePatternAnalysis = propPatternAnalysis || backupAnalysisData?.patternAnalysis || null;

  // Debug logging to see what data we're working with
  console.log('🎯 AnalysisResultPanel props:', {
    analyzedPosts: analyzedPosts.length,
    workflowId,
    totalFound,
    keywords,
    patternAnalysis: !!propPatternAnalysis
  });
  
  console.log('🎯 AnalysisResultPanel effective data:', {
    effectiveAnalyzedPosts: effectiveAnalyzedPosts.length,
    effectiveWorkflowId,
    effectiveTotalFound,
    effectiveKeywords,
    effectivePatternAnalysis: !!effectivePatternAnalysis
  });

  // View toggle state - 'patterns' is the new default view, with localStorage persistence
  const [viewMode, setViewMode] = useState<'patterns' | 'individual'>(() => {
    const savedViewMode = localStorage.getItem('apollo-analysis-view-mode');
    return (savedViewMode === 'individual' || savedViewMode === 'patterns') ? savedViewMode : 'patterns';
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'original' | 'pain' | 'audience' | 'content' | 'creator'>('original');
  const [isPostExpanded, setIsPostExpanded] = useState(false);
  const [isDigDeeperModalOpen, setIsDigDeeperModalOpen] = useState(false);
  const [isContentCreationModalOpen, setIsContentCreationModalOpen] = useState(false);
  const [isLinkedInPostModalOpen, setIsLinkedInPostModalOpen] = useState(false);
  const [isRedditEngagementModalOpen, setIsRedditEngagementModalOpen] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isCommentPreviewModalOpen, setIsCommentPreviewModalOpen] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<AnalyzedPost | null>(null);
  const [generatedComments, setGeneratedComments] = useState<Record<string, any>>({});

  /**
   * Load generated comments from localStorage on component mount
   * Why this matters: Persists generated comments across page refreshes and browser sessions
   */
  useEffect(() => {
    try {
      const savedComments = localStorage.getItem('apollo_generated_comments');
      if (savedComments) {
        setGeneratedComments(JSON.parse(savedComments));
      }
    } catch (error) {
      console.error('Error loading generated comments from localStorage:', error);
    }
  }, []);

  /**
   * Save generated comments to localStorage whenever they change
   * Why this matters: Ensures generated comments persist across page refreshes
   */
  const updateGeneratedComments = (newComments: Record<string, any>) => {
    setGeneratedComments(newComments);
    try {
      localStorage.setItem('apollo_generated_comments', JSON.stringify(newComments));
    } catch (error) {
      console.error('Error saving generated comments to localStorage:', error);
    }
  };
  
  // Pattern sorting state
  const [patternSortBy, setPatternSortBy] = useState<'engagement' | 'recency' | 'relevance'>('engagement');
  
  // Pattern display state for expandable key patterns
  const [showAllPatterns, setShowAllPatterns] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Storage notification state
  const [storageNotification, setStorageNotification] = useState<{
    type: 'compressed' | 'minimal' | null;
    show: boolean;
  }>({ type: null, show: false });
  
  // Reddit Engagement State - simple approach with localStorage persistence
  const [redditResponses, setRedditResponses] = useState<any[]>([]);
  const [redditIsLoading, setRedditIsLoading] = useState(false);
  const [redditError, setRedditError] = useState<string | null>(null);
  const [redditHasGenerated, setRedditHasGenerated] = useState(false);
  
  // Save backup data when props change (for page refresh persistence)
  React.useEffect(() => {
    if (analyzedPosts.length > 0 && workflowId) {
      const backupData = {
        analyzedPosts,
        workflowId,
        totalFound,
        keywords,
        patternAnalysis: propPatternAnalysis || null
      };
      setBackupAnalysisData(backupData);
      
      // Use StorageManager to safely store backup with quota handling
      const saved = StorageManager.saveAnalysisBackup(backupData);
      if (!saved) {
        console.warn('Failed to save analysis backup due to storage constraints');
        setStorageNotification({ type: 'minimal', show: true });
      }
    }
  }, [analyzedPosts, workflowId, totalFound, keywords, propPatternAnalysis]);

  // Load persisted data when switching posts
  React.useEffect(() => {
    const currentPost = effectiveAnalyzedPosts[currentIndex];
    if (currentPost) {
      const postKey = currentPost.id || `post-${currentIndex}`;
      const stored = localStorage.getItem(`reddit-engagement-${effectiveWorkflowId}-${postKey}`);
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
  }, [currentIndex, effectiveAnalyzedPosts, effectiveWorkflowId]);
  
  // Save data when responses change
  React.useEffect(() => {
    const currentPost = effectiveAnalyzedPosts[currentIndex];
    if (currentPost && (redditResponses.length > 0 || redditHasGenerated)) {
      const postKey = currentPost.id || `post-${currentIndex}`;
      const dataToStore = {
        responses: redditResponses,
        hasGenerated: redditHasGenerated
      };
      localStorage.setItem(`reddit-engagement-${effectiveWorkflowId}-${postKey}`, JSON.stringify(dataToStore));
    }
  }, [redditResponses, redditHasGenerated, currentIndex, effectiveAnalyzedPosts, effectiveWorkflowId]);

  /**
   * Check for stored target post index on component mount
   * Why this matters: Allows navigation to specific posts when coming from history
   */
  React.useEffect(() => {
    const targetIndex = localStorage.getItem('apollo-analysis-target-index');
    if (targetIndex !== null) {
      const index = parseInt(targetIndex, 10);
      if (index >= 0 && index < effectiveAnalyzedPosts.length) {
        setCurrentIndex(index);
      }
      // Clear the stored index after using it
      localStorage.removeItem('apollo-analysis-target-index');
    }
  }, [effectiveAnalyzedPosts.length]);

  /**
   * Format Unix timestamp to relative time (Reddit-style with exact days)
   * Why this matters: Matches Reddit's exact time calculation method using UTC dates for consistency
   */
  const formatRelativeTime = (created_utc: number): string => {
    // Use UTC dates to match Reddit's calculation exactly
    const now = new Date();
    const postDate = new Date(created_utc * 1000);
    
    // Calculate difference in milliseconds, then convert to seconds
    const diffMs = now.getTime() - postDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;
    
    if (diffSeconds < minute) {
      return 'just now';
    } else if (diffSeconds < hour) {
      const minutes = Math.floor(diffSeconds / minute);
      return `${minutes} min. ago`;
    } else if (diffSeconds < day) {
      const hours = Math.floor(diffSeconds / hour);
      return `${hours} hr. ago`;
    } else if (diffSeconds < month) {
      // Use calendar days instead of 24-hour periods for more accurate day counting
      const nowUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const postUTC = new Date(postDate.getUTCFullYear(), postDate.getUTCMonth(), postDate.getUTCDate());
      const daysDiff = Math.floor((nowUTC.getTime() - postUTC.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === 0) {
        const hours = Math.floor(diffSeconds / hour);
        return `${hours} hr. ago`;
      } else {
        return `${daysDiff} day${daysDiff === 1 ? '' : 's'} ago`;
      }
    } else if (diffSeconds < year) {
      const months = Math.floor(diffSeconds / month);
      return `${months} mo. ago`;
    } else {
      const years = Math.floor(diffSeconds / year);
      return `${years} yr. ago`;
    }
  };

  /**
   * Format analysis text with proper line breaks, bullet points, and bold headlines
   * Why this matters: Converts backend-formatted text with \n and bullet points into properly rendered HTML
   * with bold formatting for headlines ending with ":"
   */
  const formatAnalysisText = (text: string): React.ReactElement => {
    if (!text) {
      return <span>No analysis available</span>;
    }

    // Split by line breaks and process each line
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return (
      <div>
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          
          // Handle headlines ending with ":" - including inline colons
          if (trimmedLine.endsWith(':') || /^[^:]+:\s/.test(trimmedLine)) {
            // If it's a line that starts with text followed by colon and space, extract just the header part
            const colonMatch = trimmedLine.match(/^([^:]+:)/);
            if (colonMatch) {
              const headerText = colonMatch[1];
              const remainingText = trimmedLine.substring(headerText.length).trim();
              
              return (
                <div key={index}>
                  <h4 style={{ 
                    fontWeight: '700',
                    fontSize: '1rem',
                    color: '#1f2937',
                    marginTop: index > 0 ? '1.5rem' : '0',
                    marginBottom: '0.75rem',
                    lineHeight: '1.4'
                  }}>
                    {headerText}
                  </h4>
                  {remainingText && (
                    <p style={{ 
                      marginBottom: '0.75rem',
                      lineHeight: '1.6'
                    }}>
                      {remainingText.charAt(0).toUpperCase() + remainingText.slice(1)}
                    </p>
                  )}
                </div>
              );
            }
            
            // Fallback for lines that just end with colon
            return (
              <h4 key={index} style={{ 
                fontWeight: '700',
                fontSize: '1rem',
                color: '#1f2937',
                marginTop: index > 0 ? '1.5rem' : '0',
                marginBottom: '0.75rem',
                lineHeight: '1.4'
              }}>
                {trimmedLine}
              </h4>
            );
          }
          
          // Handle bullet points
          if (trimmedLine.startsWith('•')) {
            return (
              <div key={index} style={{ 
                marginLeft: '1rem', 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#2563eb', fontWeight: 'bold', minWidth: '0.5rem' }}>•</span>
                <span>{trimmedLine.substring(1).trim()}</span>
              </div>
            );
          }
          
          // Handle numbered lists
          if (/^\d+\./.test(trimmedLine)) {
            return (
              <div key={index} style={{ 
                marginLeft: '1rem', 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#2563eb', fontWeight: 'bold', minWidth: '1.5rem' }}>
                  {trimmedLine.match(/^\d+\./)?.[0]}
                </span>
                <span>{trimmedLine.replace(/^\d+\.\s*/, '')}</span>
              </div>
            );
          }
          
          // Handle regular paragraphs
          return (
            <p key={index} style={{ 
              marginBottom: '0.75rem',
              lineHeight: '1.6'
            }}>
              {trimmedLine.charAt(0).toUpperCase() + trimmedLine.slice(1)}
            </p>
          );
        })}
      </div>
    );
  };

  /**
   * Highlight keywords in text content
   * Why this matters: Makes it easy for users to quickly identify where their search keywords appear in the post content
   */
  const highlightKeywords = (text: string): React.ReactElement => {
    if (!effectiveKeywords || !text) {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{text.replace(/\\n/g, '\n')}</div>;
    }

    // Split keywords by comma and clean them up
    const keywordList = effectiveKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
    
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
              className="keyword-highlight"
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

  /**
   * Split content into paragraphs and determine if truncation is needed
   * Why this matters: Helps identify long posts that need read more/less functionality
   */
  const splitIntoParagraphs = (text: string): string[] => {
    if (!text) return [];
    return text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0);
  };

  /**
   * Toggle post expansion state
   * Why this matters: Allows users to control how much content they see at once
   */
  const togglePostExpansion = () => {
    setIsPostExpanded(!isPostExpanded);
  };

  /**
   * Reset expansion state when navigating to different posts
   * Why this matters: Each post should start in collapsed state for consistent UX
   */
  const resetPostExpansion = () => {
    setIsPostExpanded(false);
  };

  /**
   * Render post content with read more/less functionality
   * Why this matters: Provides a clean, scannable interface for long posts while allowing full content access
   */
  const renderPostContent = (content: string) => {
    const paragraphs = splitIntoParagraphs(content);
    const needsTruncation = paragraphs.length > 3;
    
    if (!needsTruncation) {
      return (
        <div>
          {highlightKeywords(content)}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsDigDeeperModalOpen(true)}
              className="apollo-btn-gradient"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                width: 'auto'
              }}
            >
              <Wand2 style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
              Get Conversation Starter Tips
            </button>
          </div>
        </div>
      );
    }

    const displayParagraphs = isPostExpanded ? paragraphs : paragraphs.slice(0, 3);
    const displayContent = displayParagraphs.join('\n\n');

    return (
      <div>
        {highlightKeywords(displayContent)}
        {needsTruncation && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={togglePostExpansion}
              className="read-more-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '0.5rem 0',
                fontSize: '0.875rem'
              }}
            >
              {isPostExpanded ? 'Read less' : `Read more (${paragraphs.length - 3} more paragraphs)`}
            </button>
          </div>
        )}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
           <button
             onClick={() => setIsDigDeeperModalOpen(true)}
             className="apollo-btn-gradient"
             style={{
               display: 'inline-flex',
               alignItems: 'center',
               width: 'auto'
             }}
           >
             <Wand2 style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
             AI Discovery Chat
           </button>
        </div>
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#6b7280', 
          textAlign: 'left', 
          marginTop: '0.75rem',
          lineHeight: '1.4'
        }}>
          Start an AI-powered discovery session to explore pain points and find strategic conversation angles
        </p>
      </div>
    );
  };

  /**
   * Navigate to next post
   * Why this matters: Allows users to paginate through analysis results one at a time
   */
  const handleNext = () => {
    if (currentIndex < effectiveAnalyzedPosts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setActiveTab('original'); // Reset to first tab when changing posts
      resetPostExpansion(); // Reset expansion state
      // Reddit engagement state now persists per-post, no reset needed
    }
  };

  /**
   * Navigate to previous post
   * Why this matters: Allows users to go back to previously viewed insights
   */
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setActiveTab('original'); // Reset to first tab when changing posts
      resetPostExpansion(); // Reset expansion state
      // Reddit engagement state now persists per-post, no reset needed
    }
  };

  /**
   * Show confirmation modal for clearing results
   * Why this matters: Provides a safety check before destructive clear action
   */
  const showClearConfirmation = () => {
    setShowConfirmModal(true);
  };

  /**
   * Clear analysis results after confirmation
   * Why this matters: Performs the actual clearing after user confirms
   */
  const confirmClearResults = () => {
    // Clear backup data as well
    setBackupAnalysisData(null);
    localStorage.removeItem('apollo-analysis-backup');
    
    // Also clean up any old Reddit engagement data to free up space
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('reddit-engagement-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleaned up ${keysToRemove.length} old Reddit engagement entries`);
    } catch (error) {
      console.error('Error cleaning up localStorage:', error);
    }
    
    onClear();
    setShowConfirmModal(false);
  };

  /**
   * Cancel the clear action
   * Why this matters: Allows users to back out of the destructive action
   */
  const cancelClearResults = () => {
    setShowConfirmModal(false);
  };

  /**
   * Handle showing/hiding post modal
   * Why this matters: Allows users to view post content in a modal without navigating away
   */
  const handleTogglePostModal = () => {
    setShowPostModal(!showPostModal);
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
  };

  /**
   * Handle backdrop click to close modal
   * Why this matters: Standard UX pattern - clicking outside modal should close it
   */
  const handlePostModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClosePostModal();
    }
  };

  /**
   * Handle opening comment preview modal
   * Why this matters: Allows users to see actual comments where keywords are mentioned
   */
  const handleOpenCommentPreview = (post: AnalyzedPost) => {
    setSelectedPostForComments(post);
    setIsCommentPreviewModalOpen(true);
  };

  /**
   * Handle closing comment preview modal
   * Why this matters: Cleans up modal state when closed
   */
  const handleCloseCommentPreview = () => {
    setIsCommentPreviewModalOpen(false);
    setSelectedPostForComments(null);
  };

  /**
   * Switch to patterns view
   * Why this matters: Allows users to see the high-level categorized overview of all posts
   */
  const switchToPatternsView = () => {
    setViewMode('patterns');
    localStorage.setItem('apollo-analysis-view-mode', 'patterns');
    // Clear any existing pattern analysis error when switching to patterns view
    if (patternAnalysisError) {
      setPatternAnalysisError(null);
    }
  };

  /**
   * Switch to individual insights view
   * Why this matters: Allows users to see detailed analysis of individual posts (current functionality)
   */
  const switchToIndividualView = () => {
    setViewMode('individual');
    localStorage.setItem('apollo-analysis-view-mode', 'individual');
    // Reset post expansion state when switching to individual view for consistency
    setIsPostExpanded(false);
  };

  // Pattern Analysis State - now comes from props instead of local state
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysisResult | null>(effectivePatternAnalysis);
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);
  const [patternAnalysisError, setPatternAnalysisError] = useState<string | null>(null);

  // Update pattern analysis when effective prop changes
  React.useEffect(() => {
    if (effectivePatternAnalysis) {
      setPatternAnalysis(effectivePatternAnalysis);
      setPatternAnalysisError(null);
    }
  }, [effectivePatternAnalysis]);

  // Auto-dismiss storage notification after 8 seconds
  React.useEffect(() => {
    if (storageNotification.show) {
      const timer = setTimeout(() => {
        setStorageNotification({ type: null, show: false });
      }, 8000);
      
      return () => clearTimeout(timer);
    }
    // Return undefined when no cleanup is needed
    return undefined;
  }, [storageNotification.show]);

  /**
   * Memoized sorting function for pattern categories
   * Why this matters: Prevents unnecessary re-sorting on every render, improving performance with large datasets
   */
  const sortedPatternCategories = useMemo(() => {
    if (!patternAnalysis?.categories) return [];
    
    const categories = [...patternAnalysis.categories];
    
    switch (patternSortBy) {
      case 'engagement':
        // Sort by total engagement (upvotes + comments)
        return categories.sort((a, b) => (b.total_upvotes + b.total_comments) - (a.total_upvotes + a.total_comments));
      
      case 'recency':
        // Sort by most recent posts in category - optimized to avoid repeated Math.max calls
        return categories.sort((a, b) => {
          // Pre-calculate latest timestamps for better performance
          const aLatest = a.posts.reduce((max, p) => Math.max(max, p.created_utc), 0);
          const bLatest = b.posts.reduce((max, p) => Math.max(max, p.created_utc), 0);
          return bLatest - aLatest;
        });
      
      default:
        return categories;
    }
  }, [patternAnalysis?.categories, patternSortBy]);

  /**
   * Pattern analysis is now handled automatically in the main workflow
   * Why this matters: Users get pattern analysis results immediately after running analysis
   */



  // Show skeleton loading when analysis is running
  if (isAnalyzing) {
    return (
      <div className="analysis-panel">
        {/* Skeleton Header */}
        <div className="analysis-panel-header">
          <div style={{flex: 1}}>
            <Skeleton style={{ height: '1.5rem', width: '12rem', marginBottom: '0.5rem' }} />
            <Skeleton style={{ height: '1rem', width: '20rem' }} />
          </div>
          
          {/* Skeleton Toggle Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
            <Skeleton style={{ height: '2.5rem', width: '6rem' }} />
            <Skeleton style={{ height: '2.5rem', width: '8rem' }} />
          </div>
          
          <Skeleton style={{ height: '2.5rem', width: '4rem' }} />
        </div>

        {/* Skeleton Pattern View */}
        <div className="patterns-view">
          {/* Skeleton Summary */}
          <div style={{
            padding: '1.25rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            margin: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <Skeleton style={{ height: '1.5rem', width: '10rem' }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <Skeleton style={{ height: '1rem', width: '2rem', marginBottom: '0.25rem' }} />
                    <Skeleton style={{ height: '0.75rem', width: '3rem' }} />
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '0.5rem',
              padding: '0.875rem',
              marginBottom: '1rem'
            }}>
              <Skeleton style={{ height: '0.75rem', width: '8rem', marginBottom: '0.5rem' }} />
              <Skeleton style={{ height: '3rem', width: '100%', marginBottom: '0.75rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} style={{ height: '1.5rem', width: `${4 + i * 2}rem` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Skeleton Sorting Controls */}
          <div style={{
            margin: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Skeleton style={{ height: '1rem', width: '6rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} style={{ height: '2rem', width: '5rem' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Skeleton Pattern Categories */}
          <div style={{ margin: '1rem' }}>
            {[1, 2, 3].map(categoryIndex => (
              <div key={categoryIndex} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
                overflow: 'hidden'
              }}>
                {/* Skeleton Category Header */}
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#e2e8f0',
                  borderBottom: '2px solid #cbd5e1'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <Skeleton style={{ height: '1.5rem', width: '15rem', marginBottom: '0.5rem' }} />
                  </div>
                  <Skeleton style={{ height: '3rem', width: '100%', marginBottom: '1rem' }} />
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Skeleton style={{ width: '1rem', height: '1rem', borderRadius: '50%' }} />
                        <Skeleton style={{ height: '1rem', width: '4rem' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skeleton Posts */}
                <div style={{ padding: '0', backgroundColor: '#fafbfc' }}>
                  {[1, 2].map(postIndex => (
                    <div key={postIndex} style={{
                      padding: '1.25rem 1.5rem',
                      borderBottom: postIndex < 2 ? '1px solid #e2e8f0' : 'none',
                      backgroundColor: 'white',
                      margin: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}>
                      {/* Skeleton Post Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '12px',
                        padding: '4px 8px'
                      }}>
                        <Skeleton style={{ height: '0.75rem', width: '1rem', backgroundColor: 'rgba(0,0,0,0.1)' }} />
                      </div>
                      
                      {/* Skeleton Post Title */}
                      <Skeleton style={{ height: '1rem', width: '80%', marginBottom: '1rem' }} />
                      
                      {/* Skeleton Post Excerpt */}
                      <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        borderLeft: '4px solid #e5e7eb',
                        marginBottom: '1rem'
                      }}>
                        <Skeleton style={{ height: '3rem', width: '100%' }} />
                      </div>
                      
                      {/* Skeleton Post Metadata */}
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {[1, 2, 3, 4].map(i => (
                          <Skeleton key={i} style={{ height: '1rem', width: '4rem' }} />
                        ))}
                      </div>
                      
                      {/* Skeleton Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Skeleton style={{ height: '2rem', width: '6rem' }} />
                        <Skeleton style={{ height: '2rem', width: '5rem' }} />
                        <Skeleton style={{ height: '2rem', width: '4rem' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Animation CSS */}
        <style>
          {`
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
  }

  if (effectiveAnalyzedPosts.length === 0) {
    console.log('🎯 AnalysisResultPanel: No analyzed posts, showing empty state');
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-empty" style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            No Analysis Available
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: '1.5' }}>
            No posts were found or analyzed. Try refining your search criteria and running the analysis again.
          </p>
        </div>
      </div>
    );
  }

  const currentPost = effectiveAnalyzedPosts[currentIndex];
  
  console.log('🎯 AnalysisResultPanel: About to render with:', {
    currentPost: !!currentPost,
    currentIndex,
    viewMode,
    isAnalyzing
  });
  
  // Safety check in case currentPost is undefined
  if (!currentPost) {
    console.log('🎯 AnalysisResultPanel: No current post, showing error state');
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-empty">
          <p>Error loading post data. Please try again.</p>
        </div>
      </div>
    );
  }

  console.log('🎯 AnalysisResultPanel: Rendering main component');
  return (
    <div className="analysis-panel">
      {/* Storage Notification */}
      {storageNotification.show && (
        <div style={{
          padding: '1rem',
          backgroundColor: storageNotification.type === 'compressed' ? '#fef3c7' : '#fee2e2',
          border: `1px solid ${storageNotification.type === 'compressed' ? '#f59e0b' : '#f87171'}`,
          borderRadius: '0.5rem',
          margin: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
            {storageNotification.type === 'compressed' ? '📦' : '⚠️'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: storageNotification.type === 'compressed' ? '#92400e' : '#dc2626',
              marginBottom: '0.25rem'
            }}>
              {storageNotification.type === 'compressed' ? 'Data Compressed for Storage' : 'Minimal Data Saved'}
            </div>
            <p style={{
              fontSize: '0.8125rem',
              color: storageNotification.type === 'compressed' ? '#78350f' : '#b91c1c',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {storageNotification.type === 'compressed' 
                ? 'Your analysis data was compressed to fit browser storage limits. Some content may be truncated, but all key insights are preserved.'
                : 'Only essential data could be saved due to storage constraints. Detailed analysis may not persist across page refreshes.'
              }
            </p>
          </div>
          <button
            onClick={() => setStorageNotification({ type: null, show: false })}
            style={{
              background: 'none',
              border: 'none',
              color: storageNotification.type === 'compressed' ? '#78350f' : '#b91c1c',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = storageNotification.type === 'compressed' ? 'rgba(120, 53, 15, 0.1)' : 'rgba(185, 28, 28, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      )}

      {/* Mobile Scroll Hint */}
      <div className="mobile-scroll-hint" style={{ 
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bfdbfe',
        borderRadius: '0.5rem',
        margin: '1rem 0',
        textAlign: 'center',
        display: 'none'
      }}>
        <p style={{ 
          margin: 0,
          fontSize: '0.875rem',
          color: '#1e40af',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1rem' }}>👇</span>
          Scroll down to explore insights and create content
        </p>
      </div>

      {/* Mobile-specific CSS for scroll hint */}
      <style>
        {`
          @media (max-width: 768px) {
            .mobile-scroll-hint {
              display: block !important;
            }
          }
        `}
      </style>

      {/* Panel Header */}
      <div className="analysis-panel-header">
        <div style={{flex: 1}}>
          <h3 className="analysis-panel-title">Key Insights from Reddit</h3>
          <p className="analysis-panel-subtitle">
            {viewMode === 'patterns' 
              ? `(Analyzed ${effectiveAnalyzedPosts.length} posts${(() => {
                  const hasCommentInsights = effectiveAnalyzedPosts.some(post => post.has_comment_insights);
                  return hasCommentInsights ? ' + comments' : '';
                })()})`
              : `Analyzed ${effectiveAnalyzedPosts.length} posts${(() => {
                  const hasCommentInsights = effectiveAnalyzedPosts.some(post => post.has_comment_insights);
                  return hasCommentInsights ? ' + comments' : '';
                })()}, showing insight ${currentIndex + 1} of ${effectiveAnalyzedPosts.length}`
            }
          </p>
        </div>
        
        {/* View Toggle Buttons */}
        <div className="view-toggle-container" style={{
          display: 'flex',
          gap: '0.5rem',
          marginRight: '1rem',
          alignItems: 'center'
        }}>
          <button
            onClick={switchToPatternsView}
            className={`view-toggle-btn ${viewMode === 'patterns' ? 'active' : ''}`}
            style={{
              padding: '0.5rem 1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: viewMode === 'patterns' ? '#EBF212' : 'white',
              color: viewMode === 'patterns' ? '#000' : '#374151',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              if (viewMode !== 'patterns') {
                e.currentTarget.style.borderColor = '#EBF212';
                e.currentTarget.style.backgroundColor = '#f8fce8';
              }
            }}
            onMouseOut={(e) => {
              if (viewMode !== 'patterns') {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            Overview
          </button>
          
          <button
            onClick={switchToIndividualView}
            className={`view-toggle-btn ${viewMode === 'individual' ? 'active' : ''}`}
            style={{
              padding: '0.5rem 1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: viewMode === 'individual' ? '#EBF212' : 'white',
              color: viewMode === 'individual' ? '#000' : '#374151',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              if (viewMode !== 'individual') {
                e.currentTarget.style.borderColor = '#EBF212';
                e.currentTarget.style.backgroundColor = '#f8fce8';
              }
            }}
            onMouseOut={(e) => {
              if (viewMode !== 'individual') {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            View Individual Posts
          </button>
        </div>
        
        <button 
          onClick={showClearConfirmation}
          className="apollo-btn-secondary danger"
          title="Clear analysis results"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}
        >
          <Trash2 style={{width: '1rem', height: '1rem'}} />
          Clear
        </button>
      </div>

      {/* Navigation - Only show in View Individual Posts mode */}
      {viewMode === 'individual' && (
        <div className="analysis-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="nav-btn nav-btn-prev"
        >
          <ChevronLeft style={{width: '1.25rem', height: '1.25rem'}} />
          Previous
        </button>
        
        <div className="nav-indicator">
          <span className="nav-current" style={{ backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '600' }}>{currentIndex + 1}</span>
          <span className="nav-divider">of</span>
          <span className="nav-total">{effectiveAnalyzedPosts.length}</span>
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentIndex === effectiveAnalyzedPosts.length - 1}
          className="nav-btn nav-btn-next"
        >
          Next
          <ChevronRight style={{width: '1.25rem', height: '1.25rem'}} />
        </button>
        </div>
      )}

      {/* Current Post Analysis - Only show in View Individual Posts mode */}
      {viewMode === 'individual' && (
      <div className="analysis-content">
        {/* Post Header */}
        <div className="post-header">
          <div className="post-rank">
            #{currentPost.post_rank || currentIndex + 1}
          </div>
          <div className="post-info">
            <h4 className="post-title">{currentPost.title}</h4>
            <div className="post-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <span className="post-subreddit">
                  r/{currentPost.subreddit} • {formatRelativeTime(currentPost.created_utc)}
                </span>
                <a
                  href={currentPost.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="post-link"
                >
                  View Original Reddit Post
                  <ExternalLink style={{width: '1rem', height: '1rem'}} />
                </a>
              </div>
              
              <div className="post-stats">
                <span className="post-stat-badge">
                  Votes: {currentPost.score}
                </span>
                <span className="post-stat-badge">
                  Comments: {currentPost.comments}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Analysis Tabs */}
        <div className="analysis-tabs">
          {/* Tab Navigation */}
          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
              onClick={() => setActiveTab('original')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              <span className="tab-label-desktop">Post</span>
              <span className="tab-label-mobile" style={{ display: 'none' }}>Post</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'audience' ? 'active' : ''}`}
              onClick={() => setActiveTab('audience')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              <span className="tab-label-desktop">Audience Summary</span>
              <span className="tab-label-mobile" style={{ display: 'none' }}>Audience</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'pain' ? 'active' : ''}`}
              onClick={() => setActiveTab('pain')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              <span className="tab-label-desktop">Pain Point</span>
              <span className="tab-label-mobile" style={{ display: 'none' }}>Pain</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
              style={{ 
                fontSize: '1rem', 
                padding: '0.875rem 1.25rem',
                position: 'relative',
                overflow: 'visible'
              }}
            >
              <span className="tab-label-desktop">Engage</span>
              <span className="tab-label-mobile" style={{ display: 'none' }}>Engage</span>
              
              {/* New Feature Badge */}
              <span 
                className="new-feature-badge"
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '0.625rem',
                  fontWeight: '600',
                  padding: '3px 6px',
                  borderRadius: '12px',
                  animation: 'pulse-glow 2s infinite',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                  zIndex: 10,
                  whiteSpace: 'nowrap'
                }}
              >
                NEW
              </span>
              
              {/* Shimmer Effect */}
              <div 
                className="shimmer-effect"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 3s infinite',
                  pointerEvents: 'none'
                }}
              />
            </button>
            <button
              className={`tab-btn ${activeTab === 'creator' ? 'active' : ''}`}
              onClick={() => setActiveTab('creator')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              <span className="tab-label-desktop">Post Creator</span>
              <span className="tab-label-mobile" style={{ display: 'none' }}>Create</span>
            </button>
          </div>

          {/* Mobile-specific CSS and New Feature Animations */}
          <style>
            {`
              .content-buttons-container {
                justify-content: flex-start;
              }

              /* View Toggle Button Responsive Styles */
              @media (max-width: 768px) {
                .view-toggle-container {
                  flex-direction: column !important;
                  gap: 0.25rem !important;
                  margin-right: 0.5rem !important;
                }
                
                .view-toggle-btn {
                  font-size: 0.75rem !important;
                  padding: 0.375rem 0.5rem !important;
                  min-width: auto !important;
                }
                
                .analysis-panel-header {
                  flex-direction: column !important;
                  align-items: flex-start !important;
                  gap: 1rem !important;
                }
                
                .analysis-panel-header > div:first-child {
                  width: 100% !important;
                }
                
                .analysis-panel-header > div:last-child {
                  display: flex !important;
                  justify-content: space-between !important;
                  width: 100% !important;
                  align-items: center !important;
                }
              }

              /* New Feature Animations */
              @keyframes pulse-glow {
                0%, 100% {
                  transform: scale(1);
                  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
                }
                50% {
                  transform: scale(1.1);
                  box-shadow: 0 0 16px rgba(239, 68, 68, 0.8);
                }
              }

              @keyframes shimmer {
                0% {
                  left: -100%;
                }
                100% {
                  left: 100%;
                }
              }

              /* Hide animations when tab is active */
              .tab-btn.active .new-feature-badge {
                display: none;
              }

              .tab-btn.active .shimmer-effect {
                display: none;
              }

              @media (max-width: 768px) {
                .tab-btn {
                  font-size: 0.875rem !important;
                  padding: 0.75rem 0.5rem !important;
                }
                .tab-label-desktop {
                  display: none !important;
                }
                .tab-label-mobile {
                  display: inline !important;
                }
                .content-buttons-container {
                  justify-content: center;
                }
                
                /* Adjust badge size for mobile */
                .new-feature-badge {
                  font-size: 0.5rem !important;
                  padding: 2px 4px !important;
                  top: -6px !important;
                  right: -6px !important;
                  border-radius: 8px !important;
                }
              }
            `}
          </style>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'original' && (
              <div className="tab-panel">
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: '#1f2937', 
                  marginBottom: '1.5rem',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ transform: 'translateY(-2px)' }}>📄</span> Original Reddit Post
                </h3>
                <div className="tab-panel-content" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                  {renderPostContent(currentPost.content || 'No additional content')}
                </div>
              </div>
            )}

            {activeTab === 'pain' && (
              <div className="tab-panel">
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: '#1f2937', 
                  marginBottom: '1.5rem',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ transform: 'translateY(-2px)' }}>🎯</span> Pain Point Analysis
                </h3>
                <div className="tab-panel-content" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                  {formatAnalysisText(currentPost.analysis.pain_point)}
                </div>
                <div style={{ marginTop: '1.5rem', borderTop: '0.0625rem solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <button
                    onClick={() => setIsDigDeeperModalOpen(true)}
                    className="apollo-btn-gradient"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      width: 'auto'
                    }}
                  >
                    <Wand2 style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                    AI Discovery Chat
                  </button>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    textAlign: 'left', 
                    marginTop: '0.75rem',
                    lineHeight: '1.4'
                  }}>
                    Start an AI-powered discovery session to explore pain points and find strategic conversation angles
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="tab-panel">
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: '#1f2937', 
                  marginBottom: '1.5rem',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ transform: 'translateY(-2px)' }}>🚀</span> Engage
                </h3>
                {/* Reddit Engagement Section */}
                <div style={{ marginTop: '0', marginBottom: '0' }}>
                  <RedditEngagementPanel 
                    post={currentPost}
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
            )}

            {activeTab === 'audience' && (
              <div className="tab-panel">
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: '#1f2937', 
                  marginBottom: '1.5rem',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ transform: 'translateY(-2px)' }}>👥</span> Audience Summary
                </h3>
                <div className="tab-panel-content" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                  {formatAnalysisText(currentPost.analysis.audience_insight)}
                </div>
              </div>
            )}

            {activeTab === 'creator' && (
              <div className="tab-panel">
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700', 
                  color: '#1f2937', 
                  marginBottom: '1.5rem',
                  borderBottom: '2px solid #e5e7eb',
                  paddingBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ transform: 'translateY(-2px)' }}>✨</span> Post Creator
                </h3>
                <div className="tab-panel-content" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                  {formatAnalysisText(currentPost.analysis.content_opportunity)}
                </div>
                
                <div style={{ marginTop: '1.5rem', borderTop: '0.0625rem solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <div className="content-buttons-container" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <button
                      onClick={() => setIsContentCreationModalOpen(true)}
                      className="apollo-btn-gradient"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        minWidth: '12.5rem',
                        justifyContent: 'center'
                      }}
                    >
                      <Wand2 style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                      Create Content With AI
                    </button>
                    
                    <button
                      onClick={() => setIsLinkedInPostModalOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem 2rem',
                        backgroundColor: '#0077b5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 0.25rem 0.375rem -0.0625rem rgba(0, 119, 181, 0.2)',
                        minWidth: window.innerWidth > 768 ? '15rem' : '16rem',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#005582';
                        e.currentTarget.style.transform = 'translateY(-0.0625)';
                        e.currentTarget.style.boxShadow = '0 0.25rem 0.5rem rgba(0, 119, 181, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#0077b5';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 119, 181, 0.2)';
                      }}
                    >
                      <svg 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                        style={{marginRight: '0.5rem'}}
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Create LinkedIn Post
                    </button>
                  </div>
                  
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    textAlign: 'left', 
                    lineHeight: '1.4',
                    margin: 0
                  }}>
                    Generate AEO-optimized content or viral LinkedIn posts using Reddit insights and Apollo brand kit
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Patterns View - Show when patterns mode is active */}
      {viewMode === 'patterns' && (
        <div className="patterns-view">
          {isAnalyzingPatterns && (
            <div style={{ 
              padding: '2rem',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '1.125rem'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div className="loading-spinner" style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span>🧠 Analyzing patterns with GPT-5 Nano...</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                Categorizing {effectiveAnalyzedPosts.length} posts into meaningful themes
              </p>
            </div>
          )}

          {patternAnalysisError && (
            <div style={{ 
              padding: '2rem',
              textAlign: 'center',
              color: '#dc2626',
              fontSize: '1rem'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <AlertTriangle style={{ width: '1.25rem', height: '1.25rem' }} />
                <span>Pattern Analysis Failed</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                {patternAnalysisError}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                Please run a new analysis to retry pattern analysis.
              </p>
            </div>
          )}

          {!patternAnalysis && !isAnalyzingPatterns && !patternAnalysisError && (
            <div style={{ 
              padding: '3rem 2rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Pattern Analysis Not Available
              </h3>
              <p style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                Pattern analysis is included automatically when you run analysis. Please run a new analysis to see identified patterns.
              </p>
            </div>
          )}

          {patternAnalysis && !isAnalyzingPatterns && (
            <div className="identified-patterns-container">
              {/* Single Post Notice */}
              {effectiveAnalyzedPosts.length === 1 && (
                <div style={{
                  margin: '1rem',
                  padding: '1rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>💡</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: '500' }}>
                      <strong>Single Post Analysis:</strong> Pattern analysis works best with multiple posts. 
                      Consider switching to "View Individual Posts" for detailed analysis of this post.
                    </p>
                  </div>
                </div>
              )}
              {/* Compact Discussion Overview */}
              <div className="patterns-summary" style={{
                padding: '0',
                background: '#EBF212',
                border: 'none',
                borderRadius: '0.75rem',
                margin: '1rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(235, 242, 18, 0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '1.25rem', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '700', 
                      color: '#000',
                      margin: 0
                    }}>
                      {(() => {
                        // Convert keywords to title case for the dynamic title
                        const toTitleCase = (str: string) => {
                          return str.replace(/\w\S*/g, (txt) => 
                            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                          );
                        };
                        
                        // Use the first keyword or fallback to "Discussion Overview"
                        if (effectiveKeywords && effectiveKeywords.trim()) {
                          const firstKeyword = effectiveKeywords.split(',')[0].trim();
                          return `Discussion About ${toTitleCase(firstKeyword)}`;
                        }
                        return 'Discussion Overview';
                      })()}
                    </h3>
                    
                    {/* Enhanced Stats in Header */}
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                          {patternAnalysis.overall_summary.total_posts}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                          Posts
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                          {patternAnalysis.overall_summary.total_upvotes}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                          Upvotes
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                          {patternAnalysis.overall_summary.total_comments}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                          Comments
                        </div>
                      </div>

                      {/* Average Engagement Metrics */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                          {Math.round(patternAnalysis.overall_summary.total_upvotes / patternAnalysis.overall_summary.total_posts)}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                          Avg Upvotes
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                          {Math.round(patternAnalysis.overall_summary.total_comments / patternAnalysis.overall_summary.total_posts)}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                          Avg Comments
                        </div>
                      </div>

                      {/* Comment Insights Stats */}
                      {patternAnalysis.overall_summary.comment_summary && (
                        <>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                              {patternAnalysis.overall_summary.comment_summary.total_keyword_mentions}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                              Keyword Mentions
                            </div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                              {patternAnalysis.overall_summary.comment_summary.overall_sentiment === 'positive' ? '😊' : 
                               patternAnalysis.overall_summary.comment_summary.overall_sentiment === 'negative' ? '😞' : '😐'}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                              Sentiment
                            </div>
                          </div>
                        </>
                      )}

                      {/* Most Active Subreddit */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                          r/{patternAnalysis.overall_summary.most_active_subreddit}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                          Top Subreddit
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Pattern-Level Insights */}
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.08)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem',
                    marginBottom: '1rem',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'rgba(0, 0, 0, 0.7)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em'
                    }}>
                      Cross-Pattern Insights
                    </div>
                    
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'rgba(0, 0, 0, 0.9)',
                      lineHeight: '1.5',
                      margin: '0 0 0.75rem 0',
                      fontWeight: '400'
                    }}>
                      {(() => {
                        // Use the rich community narrative generated by GPT-5 Nano
                        const { community_narrative } = patternAnalysis.overall_summary;
                        
                        // Fallback to generic summary if community_narrative is not available
                        if (community_narrative && community_narrative.trim()) {
                          return community_narrative;
                        }
                        
                        // Fallback for older analyses without community_narrative
                        const { dominant_themes } = patternAnalysis.overall_summary;
                        const categories = patternAnalysis.categories;
                        const totalEngagement = categories.reduce((sum, cat) => sum + cat.total_upvotes + cat.total_comments, 0);
                        const highEngagementCategories = categories.filter(cat => 
                          (cat.total_upvotes + cat.total_comments) > (totalEngagement / categories.length)
                        );
                        
                        if (dominant_themes.length > 0) {
                          const topThemes = dominant_themes.slice(0, 3).join(', ');
                          return `The community is primarily focused on ${topThemes}. ${highEngagementCategories.length} out of ${categories.length} discussion categories show above-average engagement, indicating strong community interest in these topics.`;
                        } else {
                          return `Discussions span ${categories.length} distinct categories with ${highEngagementCategories.length} showing particularly high community engagement.`;
                        }
                      })()}
                    </p>

                    {/* Comment Insights Section */}
                    {patternAnalysis.overall_summary.comment_summary && patternAnalysis.overall_summary.comment_summary.total_keyword_mentions > 0 && (
                      <div style={{
                        borderTop: '1px solid rgba(0, 0, 0, 0.1)', 
                        paddingTop: '0.75rem',
                        marginTop: '0.75rem'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: 'rgba(0, 0, 0, 0.7)',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em'
                        }}>
                          💬 Comment Analysis
                        </div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: 'rgba(0, 0, 0, 0.9)',
                          lineHeight: '1.5',
                          margin: '0 0 0.75rem 0',
                          fontWeight: '400'
                        }}>
                          {patternAnalysis.overall_summary.comment_summary.sentiment_summary}
                        </p>
                      </div>
                    )}

                    {/* Pattern Connections */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'rgba(0, 0, 0, 0.7)',
                        fontWeight: '500'
                      }}>
                        Key patterns:
                      </span>
                      {(showAllPatterns ? patternAnalysis.categories : patternAnalysis.categories.slice(0, 3)).map((category, index) => (
                        <span
                          key={category.id}
                          style={{
                            fontSize: '0.6875rem',
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            color: 'rgba(0, 0, 0, 0.8)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontWeight: '500',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={category.name} // Show full name on hover
                        >
                          {category.name}
                        </span>
                      ))}
                      {!showAllPatterns && patternAnalysis.categories.length > 3 && (
                        <button
                          onClick={() => setShowAllPatterns(true)}
                          style={{
                            fontSize: '0.6875rem',
                            color: '#2563eb',
                            fontStyle: 'italic',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.color = '#1d4ed8';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.color = '#2563eb';
                          }}
                        >
                          +{patternAnalysis.categories.length - 3} more
                        </button>
                      )}
                      {showAllPatterns && patternAnalysis.categories.length > 3 && (
                        <button
                          onClick={() => setShowAllPatterns(false)}
                          style={{
                            fontSize: '0.6875rem',
                            color: '#6b7280',
                            fontStyle: 'italic',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.color = '#4b5563';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          show less
                        </button>
                      )}
                    </div>
                    
                    {/* Additional Insights */}
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                      <div style={{
                        fontSize: '0.75rem'
                      }}>
                        {/* Subreddit Coverage with Community Names */}
                        <div>
                          <span style={{ fontWeight: '600', color: 'rgba(0, 0, 0, 0.8)' }}>
                            Subreddit Coverage:
                          </span>
                          <span style={{ color: 'rgba(0, 0, 0, 0.7)', marginLeft: '0.25rem' }}>
                            {(() => {
                              const uniqueSubreddits = Array.from(new Set(effectiveAnalyzedPosts.map(post => post.subreddit))).sort();
                              const communityNames = uniqueSubreddits.map(subreddit => `r/${subreddit}`).join(', ');
                              const communityText = uniqueSubreddits.length === 1 ? 'community' : 'communities';
                              return `${uniqueSubreddits.length} ${communityText} (${communityNames})`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sorting Controls */}
              <div className="pattern-sorting-controls" style={{
                margin: '1rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Sort patterns by:
                  </span>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['engagement', 'recency'] as const).map((sortOption) => (
                      <button
                        key={sortOption}
                        onClick={() => setPatternSortBy(sortOption)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          borderRadius: '0.375rem',
                          border: '1px solid #d1d5db',
                          backgroundColor: patternSortBy === sortOption ? '#EBF212' : 'white',
                          color: patternSortBy === sortOption ? '#000' : '#6b7280',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textTransform: 'capitalize'
                        }}
                        onMouseOver={(e) => {
                          if (patternSortBy !== sortOption) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#9ca3af';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (patternSortBy !== sortOption) {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }
                        }}
                      >
                        {sortOption === 'engagement' ? 'Engagement' : 'Recent'}
                      </button>
                    ))}
                  </div>
                  
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    {patternSortBy === 'engagement' ? 'Highest upvotes + comments first' : 'Newest posts first'}
                  </span>
                </div>
              </div>

              {/* Pattern Categories */}
              <div className="pattern-categories" style={{ margin: '1rem' }}>
                {sortedPatternCategories.map((category, categoryIndex) => (
                  <PatternCategoryCard 
                    key={category.id}
                    category={category}
                    categoryIndex={categoryIndex}
                    formatRelativeTime={formatRelativeTime}
                    analyzedPosts={effectiveAnalyzedPosts}
                    setCurrentIndex={setCurrentIndex}
                    setShowPostModal={setShowPostModal}
                    setIsRedditEngagementModalOpen={setIsRedditEngagementModalOpen}
                    setIsDigDeeperModalOpen={setIsDigDeeperModalOpen}
                    handleOpenCommentPreview={handleOpenCommentPreview}
                    keywords={effectiveKeywords}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loading Animation and Pattern View CSS */}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }

              /* Smooth View Transitions */
              .patterns-view, .analysis-content {
                animation: fadeIn 0.3s ease-in-out;
              }

              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              /* Toggle Button Transitions */
              .view-toggle-btn {
                transition: all 0.2s ease-in-out !important;
              }

              .view-toggle-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
              }

              .view-toggle-btn.active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
              }

              /* Pulse Animation for Discussion Overview */
              @keyframes pulse {
                0% {
                  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                }
                70% {
                  box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                }
              }

              /* Pattern View Mobile Responsive Styles */
              @media (max-width: 768px) {
                .patterns-summary {
                  margin: 0.5rem !important;
                }
                
                .patterns-summary > div {
                  padding: 1rem !important;
                }
                
                .patterns-summary h3 {
                  font-size: 1.125rem !important;
                }
                
                .patterns-summary > div > div:nth-child(1) {
                  flex-direction: column !important;
                  align-items: flex-start !important;
                  gap: 0.75rem !important;
                  margin-bottom: 0.75rem !important;
                }
                
                .patterns-summary > div > div:nth-child(1) > div:nth-child(2) {
                  gap: 0.75rem !important;
                }
                
                .patterns-summary > div > div:nth-child(1) > div:nth-child(2) > div > div:first-child {
                  font-size: 0.875rem !important;
                }
                
                .patterns-summary > div > div:nth-child(1) > div:nth-child(2) > div > div:last-child {
                  font-size: 0.5625rem !important;
                }
                
                .pattern-categories {
                  margin: 0.5rem !important;
                }
                
                .pattern-category-card {
                  margin-bottom: 0.75rem !important;
                }
                
                .category-header {
                  padding: 1rem !important;
                }
                
                .category-header h3 {
                  font-size: 1rem !important;
                }
                
                .category-header p {
                  font-size: 0.8125rem !important;
                }
                
                .category-header > div:first-child > div:first-child {
                  flex-direction: column !important;
                  align-items: flex-start !important;
                  gap: 0.5rem !important;
                }
                
                .category-header > div:first-child > div:nth-child(3) {
                  flex-wrap: wrap !important;
                  gap: 1rem !important;
                }
                
                .category-posts > div {
                  padding: 0.75rem 1rem !important;
                }
                
                .category-posts h4 {
                  font-size: 0.9375rem !important;
                }
                
                .category-posts > div > div > div > div:nth-child(2) {
                  flex-wrap: wrap !important;
                  gap: 0.75rem !important;
                }
                
                .category-posts > div > div > div > div:nth-child(4) {
                  flex-direction: column !important;
                  align-items: flex-start !important;
                  gap: 0.5rem !important;
                }
                
                /* Sorting Controls Mobile Styles */
                .pattern-sorting-controls {
                  margin: 0.5rem !important;
                  padding: 0.75rem !important;
                }
                
                .pattern-sorting-controls > div {
                  flex-direction: column !important;
                  align-items: flex-start !important;
                  gap: 0.75rem !important;
                }
                
                .pattern-sorting-controls > div > div {
                  flex-wrap: wrap !important;
                  gap: 0.375rem !important;
                }
              }
            `}
          </style>
        </div>
      )}

      {/* Dig Deeper Modal */}
      <DigDeeperModal
        isOpen={isDigDeeperModalOpen}
        onClose={() => setIsDigDeeperModalOpen(false)}
        post={currentPost}
      />

      {/* Content Creation Modal */}
      <ContentCreationModal
        key={`content-creation-${currentPost.id || currentIndex}`}
        isOpen={isContentCreationModalOpen}
        onClose={() => setIsContentCreationModalOpen(false)}
        post={currentPost}
      />

      {/* LinkedIn Post Modal */}
      <LinkedInPostModal
        key={`linkedin-post-${currentPost.id || currentIndex}`}
        isOpen={isLinkedInPostModalOpen}
        onClose={() => setIsLinkedInPostModalOpen(false)}
        post={currentPost}
      />

      {/* Reddit Engagement Modal */}
      <RedditEngagementModal
        isOpen={isRedditEngagementModalOpen}
        onClose={() => setIsRedditEngagementModalOpen(false)}
        post={currentPost}
        workflowId={effectiveWorkflowId}
      />

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
            zIndex: 999,
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
                    • r/{currentPost.subreddit} • {formatRelativeTime(currentPost.created_utc)}
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
                  {currentPost.title}
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
                    {currentPost.score} upvotes
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
                    {currentPost.comments} comments
                  </span>
                  <a
                    href={currentPost.permalink.startsWith('http') ? currentPost.permalink : `https://reddit.com${currentPost.permalink}`}
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
              {currentPost.content && (
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
                    {highlightKeywords(currentPost.content)}
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      )}

      {/* Comment Preview Modal */}
      {selectedPostForComments && (
        <CommentPreviewModal
          isOpen={isCommentPreviewModalOpen}
          onClose={handleCloseCommentPreview}
          post={selectedPostForComments}
          keywords={effectiveKeywords}
          generatedComments={generatedComments}
          setGeneratedComments={updateGeneratedComments}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className={`confirmation-modal-backdrop ${showConfirmModal ? 'open' : ''}`}>
          <div className={`confirmation-modal ${showConfirmModal ? 'open' : ''}`}>
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                <AlertTriangle style={{width: '1.5rem', height: '1.5rem'}} />
              </div>
              <h3 className="confirmation-modal-title">Clear Analysis Results?</h3>
              <p className="confirmation-modal-message">
                This action will remove all current analysis insights and return you to the search form. You can find completed analyses in your History.
              </p>
            </div>
            <div className="confirmation-modal-actions">
              <button
                onClick={cancelClearResults}
                className="confirmation-modal-btn confirmation-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearResults}
                className="confirmation-modal-btn confirmation-modal-btn-confirm"
              >
                Clear Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResultPanel; 