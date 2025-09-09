import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Wand2, FileText, AlertTriangle, ChevronDown, ChevronUp, Users, MessageCircle, ArrowUp, Clock, Eye, Trash2, BarChart3, MessageSquare, Search, X, Target } from 'lucide-react';
import { AnalyzedPost, PatternAnalysisResult, PatternCategory, UncoverWorkflowResponse, UncoverCategory } from '../types';
import { StorageManager } from '../utils/StorageManager';
import DigDeeperModal from './DigDeeperModal';
import ContentCreationModal from './ContentCreationModal';
import LinkedInPostModal from './LinkedInPostModal';
import RedditEngagementPanel from './RedditEngagementPanel';
import RedditEngagementModal from './RedditEngagementModal';
import CommentPreviewModal from './CommentPreviewModal';
import UncoverCommentPreviewModal from './UncoverCommentPreviewModal';
import LoadingJokes from './LoadingJokes';
import { FEATURE_FLAGS } from '../utils/featureFlags';

interface UncoverResultPanelProps {
  uncoverResults: UncoverWorkflowResponse;
  onClear: () => void;
  isAnalyzing?: boolean;
  showIndividualPostsView?: boolean;
}

interface PatternCategoryCardProps {
  category: PatternCategory;
  categoryIndex: number;
  formatRelativeTime: (created_utc: number) => string;
  formatTextContent: (text: string) => React.ReactElement;
  analyzedPosts: AnalyzedPost[];
  setCurrentIndex: (index: number) => void;
  setShowPostModal: (show: boolean) => void;
  setIsRedditEngagementModalOpen: (open: boolean) => void;
  setIsDigDeeperModalOpen: (open: boolean) => void;
  setIsContentCreationModalOpen: (open: boolean) => void;
  setIsLinkedInPostModalOpen: (open: boolean) => void;
  handleOpenCommentPreview: (post: AnalyzedPost) => void;
  categoryName: string;
}

/**
 * PatternCategoryCard Component for Uncover Results
 * Why this matters: Displays each pattern category in Reddit-style format with expandable post list
 */
const PatternCategoryCard: React.FC<PatternCategoryCardProps> = ({
  category,
  categoryIndex,
  formatRelativeTime,
  formatTextContent,
  analyzedPosts,
  setCurrentIndex,
  setShowPostModal,
  setIsRedditEngagementModalOpen,
  setIsDigDeeperModalOpen,
  setIsContentCreationModalOpen,
  setIsLinkedInPostModalOpen,
  handleOpenCommentPreview,
  categoryName
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
                {categoryName} Posts
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
                  borderLeft: '4px solid #e5e7eb'
                }}>
                  {formatTextContent(post.excerpt + (post.excerpt.length >= 150 ? '...' : ''))}
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
                
                {/* Comments Indicator - Show for all posts with comments */}
                {post.comments > 0 && (
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
                    💬 View {post.comments} comments
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
                    backgroundColor: '#D93801',
                    color: 'white',
                    border: '1px solid #D93801',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0.125rem 0.1875rem -0.03125rem rgba(217, 56, 1, 0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#B8300A';
                    e.currentTarget.style.borderColor = '#B8300A';
                    e.currentTarget.style.transform = 'translateY(-0.03125rem)';
                    e.currentTarget.style.boxShadow = '0 0.25rem 0.375rem -0.0625rem rgba(217, 56, 1, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#D93801';
                    e.currentTarget.style.borderColor = '#D93801';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 0.125rem 0.1875rem -0.03125rem rgba(217, 56, 1, 0.2)';
                  }}
                >
                  <MessageSquare style={{ width: '0.75rem', height: '0.75rem' }} />
                  Create Comments
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
                    backgroundColor: '#EBF212',
                    color: '#000',
                    border: '1px solid #EBF212',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0.125rem 0.1875rem -0.03125rem rgba(235, 242, 18, 0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#d4d41a';
                    e.currentTarget.style.borderColor = '#d4d41a';
                    e.currentTarget.style.transform = 'translateY(-0.03125rem)';
                    e.currentTarget.style.boxShadow = '0 0.25rem 0.375rem -0.0625rem rgba(235, 242, 18, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#EBF212';
                    e.currentTarget.style.borderColor = '#EBF212';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 0.125rem 0.1875rem -0.03125rem rgba(235, 242, 18, 0.2)';
                  }}
                >
                  <Wand2 style={{ width: '0.75rem', height: '0.75rem' }} />
                  AI Discovery Chat
                </button>
                
                <button
                  onClick={() => {
                    // Set the current post for modal viewing
                    const postIndex = analyzedPosts.findIndex(p => p.id === post.id);
                    if (postIndex !== -1) {
                      setCurrentIndex(postIndex);
                    }
                    setIsContentCreationModalOpen(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 70%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0.125rem 0.1875rem -0.03125rem rgba(59, 130, 246, 0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-0.03125rem)';
                    e.currentTarget.style.boxShadow = '0 0.25rem 0.375rem -0.0625rem rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 0.125rem 0.1875rem -0.03125rem rgba(59, 130, 246, 0.2)';
                  }}
                >
                  <Wand2 style={{ width: '0.75rem', height: '0.75rem' }} />
                  Create SEO/AEO Articles
                </button>
                
                <button
                  onClick={() => {
                    // Set the current post for modal viewing
                    const postIndex = analyzedPosts.findIndex(p => p.id === post.id);
                    if (postIndex !== -1) {
                      setCurrentIndex(postIndex);
                    }
                    setIsLinkedInPostModalOpen(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#0077b5',
                    color: 'white',
                    border: '1px solid #0077b5',
                    borderRadius: '0.25rem',
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#005582';
                    e.currentTarget.style.borderColor = '#005582';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#0077b5';
                    e.currentTarget.style.borderColor = '#0077b5';
                  }}
                >
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    style={{ width: '0.75rem', height: '0.75rem' }}
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Create LinkedIn Post
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

const UncoverResultPanel: React.FC<UncoverResultPanelProps> = ({
  uncoverResults,
  onClear,
  isAnalyzing = false,
  showIndividualPostsView = true
}) => {
  // Backup persistence state - preserves data during page refreshes
  const [backupUncoverData, setBackupUncoverData] = useState<UncoverWorkflowResponse | null>(() => {
    // Try to restore from localStorage on component mount
    try {
      const stored = localStorage.getItem('apollo-uncover-backup');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the structure before using
        if (parsed && Array.isArray(parsed.posts) && parsed.workflow_id) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to restore uncover backup:', error);
      localStorage.removeItem('apollo-uncover-backup');
    }
    return null;
  });

  // Use props data if available, otherwise fall back to backup
  const effectiveUncoverResults = uncoverResults.posts?.length > 0 ? uncoverResults : (backupUncoverData || uncoverResults);
  const effectiveAnalyzedPosts = effectiveUncoverResults.posts || [];

  // View toggle state - 'patterns' is the default view
  const [viewMode, setViewMode] = useState<'patterns' | 'individual'>(() => {
    const savedViewMode = localStorage.getItem('apollo-uncover-view-mode');
    return (savedViewMode === 'individual' || savedViewMode === 'patterns') ? savedViewMode : 'patterns';
  });

  /**
   * Handle feature flag changes for showIndividualPostsView
   */
  useEffect(() => {
    if (!showIndividualPostsView && viewMode === 'individual') {
      setViewMode('patterns');
      localStorage.setItem('apollo-uncover-view-mode', 'patterns');
    }
  }, [showIndividualPostsView, viewMode]);
  
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Pattern sorting state
  const [patternSortBy, setPatternSortBy] = useState<'engagement' | 'recency'>('recency');
  
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

  /**
   * Load generated comments from localStorage on component mount
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
   */
  const updateGeneratedComments = (newComments: Record<string, any>) => {
    setGeneratedComments(newComments);
    try {
      localStorage.setItem('apollo_generated_comments', JSON.stringify(newComments));
    } catch (error) {
      console.error('Error saving generated comments to localStorage:', error);
    }
  };

  // Save backup data when props change (for page refresh persistence)
  React.useEffect(() => {
    if (effectiveUncoverResults.posts?.length > 0 && effectiveUncoverResults.workflow_id) {
      setBackupUncoverData(effectiveUncoverResults);
      
      // Use simple localStorage for uncover results
      try {
        localStorage.setItem('apollo-uncover-backup', JSON.stringify(effectiveUncoverResults));
      } catch (error) {
        console.warn('Failed to save uncover backup due to storage constraints:', error);
        setStorageNotification({ type: 'minimal', show: true });
      }
    }
  }, [effectiveUncoverResults]);

  // Load persisted data when switching posts
  React.useEffect(() => {
    const currentPost = effectiveAnalyzedPosts[currentIndex];
    if (currentPost) {
      const postKey = currentPost.id || `post-${currentIndex}`;
      const stored = localStorage.getItem(`reddit-engagement-${effectiveUncoverResults.workflow_id}-${postKey}`);
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
  }, [currentIndex, effectiveAnalyzedPosts, effectiveUncoverResults.workflow_id]);
  
  // Save data when responses change
  React.useEffect(() => {
    const currentPost = effectiveAnalyzedPosts[currentIndex];
    if (currentPost && (redditResponses.length > 0 || redditHasGenerated)) {
      const postKey = currentPost.id || `post-${currentIndex}`;
      const dataToStore = {
        responses: redditResponses,
        hasGenerated: redditHasGenerated
      };
      localStorage.setItem(`reddit-engagement-${effectiveUncoverResults.workflow_id}-${postKey}`, JSON.stringify(dataToStore));
    }
  }, [redditResponses, redditHasGenerated, currentIndex, effectiveAnalyzedPosts, effectiveUncoverResults.workflow_id]);

  /**
   * Format Unix timestamp to relative time (Reddit-style with exact days)
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
  const highlightKeywords = (text: string): React.ReactElement => {
    return formatTextContent(text);
  };

  /**
   * Split content into paragraphs and determine if truncation is needed
   */
  const splitIntoParagraphs = (text: string): string[] => {
    if (!text) return [];
    return text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0);
  };

  /**
   * Toggle post expansion state
   */
  const togglePostExpansion = () => {
    setIsPostExpanded(!isPostExpanded);
  };

  /**
   * Reset expansion state when navigating to different posts
   */
  const resetPostExpansion = () => {
    setIsPostExpanded(false);
  };

  /**
   * Render post content with read more/less functionality
   */
  const renderPostContent = (content: string) => {
    const paragraphs = splitIntoParagraphs(content);
    const needsTruncation = paragraphs.length > 3;
    
    if (!needsTruncation) {
      return (
      <div>
        {formatTextContent(content)}
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
        {formatTextContent(displayContent)}
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
   */
  const handleNext = () => {
    if (currentIndex < effectiveAnalyzedPosts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setActiveTab('original'); // Reset to first tab when changing posts
      resetPostExpansion(); // Reset expansion state
    }
  };

  /**
   * Navigate to previous post
   */
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setActiveTab('original'); // Reset to first tab when changing posts
      resetPostExpansion(); // Reset expansion state
    }
  };

  /**
   * Show confirmation modal for clearing results
   */
  const showClearConfirmation = () => {
    setShowConfirmModal(true);
  };

  /**
   * Clear analysis results after confirmation
   */
  const confirmClearResults = () => {
    // Clear backup data as well
    setBackupUncoverData(null);
    localStorage.removeItem('apollo-uncover-backup');
    
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
   */
  const cancelClearResults = () => {
    setShowConfirmModal(false);
  };

  /**
   * Handle showing/hiding post modal
   */
  const handleTogglePostModal = () => {
    setShowPostModal(!showPostModal);
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
  };

  /**
   * Handle backdrop click to close modal
   */
  const handlePostModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClosePostModal();
    }
  };

  /**
   * Handle opening comment preview modal
   */
  const handleOpenCommentPreview = (post: AnalyzedPost) => {
    setSelectedPostForComments(post);
    setIsCommentPreviewModalOpen(true);
  };

  /**
   * Handle closing comment preview modal
   */
  const handleCloseCommentPreview = () => {
    setIsCommentPreviewModalOpen(false);
    setSelectedPostForComments(null);
  };

  /**
   * Switch to patterns view
   */
  const switchToPatternsView = () => {
    setViewMode('patterns');
    localStorage.setItem('apollo-uncover-view-mode', 'patterns');
  };

  /**
   * Switch to individual insights view
   */
  const switchToIndividualView = () => {
    setViewMode('individual');
    localStorage.setItem('apollo-uncover-view-mode', 'individual');
    // Reset post expansion state when switching to individual view for consistency
    setIsPostExpanded(false);
  };

  // Auto-dismiss storage notification after 8 seconds
  React.useEffect(() => {
    if (storageNotification.show) {
      const timer = setTimeout(() => {
        setStorageNotification({ type: null, show: false });
      }, 8000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [storageNotification.show]);

  // Get category name for display
  const getCategoryDisplayName = (category: UncoverCategory): string => {
    const categoryMap = {
      'solution_request': 'Solution Request',
      'advice_request': 'Advice Request', 
      'pain_anger': 'Pain & Anger',
      'ideas': 'Ideas'
    };
    return categoryMap[category] || category;
  };

  /**
   * Memoized sorting function for posts within categories
   * Why this matters: Prevents unnecessary re-sorting on every render, improving performance with large datasets
   */
  const sortedAnalyzedPosts = useMemo(() => {
    if (!effectiveAnalyzedPosts.length) return [];
    
    const posts = [...effectiveAnalyzedPosts];
    
    switch (patternSortBy) {
      case 'engagement':
        // Sort by total engagement (upvotes + comments)
        return posts.sort((a, b) => (b.score + b.comments) - (a.score + a.comments));
      
      case 'recency':
        // Sort by most recent posts
        return posts.sort((a, b) => b.created_utc - a.created_utc);
      
      default:
        return posts;
    }
  }, [effectiveAnalyzedPosts, patternSortBy]);

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

        {/* Loading Jokes - Entertainment during analysis */}
        <LoadingJokes 
          keywords={effectiveUncoverResults.category_used || 'discovery'}
          rotationInterval={20000}
          style={{ 
            margin: '1rem',
            marginBottom: '2rem'
          }}
        />

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
    console.log('🎯 UncoverResultPanel: No analyzed posts, showing empty state');
    return (
      <div className="analysis-panel">
        <div className="results-empty-fullwidth">
          <div className="apollo-logo" style={{width: '4rem', height: '4rem', opacity: 0.3}}>
            <img src="/apollo logo only.png" alt="Apollo Logo" />
          </div>
          <h3>No Reddit Insights Yet</h3>
          <p>Run an analysis to see Reddit insights here</p>
        </div>
      </div>
    );
  }

  const currentPost = effectiveAnalyzedPosts[currentIndex];
  
  // Safety check in case currentPost is undefined
  if (!currentPost) {
    console.log('🎯 UncoverResultPanel: No current post, showing error state');
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-empty">
          <p>Error loading post data. Please try again.</p>
        </div>
      </div>
    );
  }

  // Create a mock pattern analysis result for display
  const mockPatternAnalysis: PatternAnalysisResult = {
    categories: [{
      id: 'category-1',
      name: getCategoryDisplayName(effectiveUncoverResults.category_used),
      description: `Posts categorized as ${getCategoryDisplayName(effectiveUncoverResults.category_used).toLowerCase()}`,
      post_count: sortedAnalyzedPosts.length,
      total_upvotes: sortedAnalyzedPosts.reduce((sum, post) => sum + post.score, 0),
      total_comments: sortedAnalyzedPosts.reduce((sum, post) => sum + post.comments, 0),
      posts: sortedAnalyzedPosts.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.content ? post.content.substring(0, 150) : '',
        subreddit: post.subreddit,
        score: post.score,
        comments: post.comments,
        created_utc: post.created_utc,
        permalink: post.permalink,
        author: post.author,
        post_rank: post.post_rank,
        comment_mentions: post.comment_analysis?.keyword_mentions || 0
      })),
      key_themes: [],
      urgency_level: 'medium' as const,
      comment_mentions: effectiveAnalyzedPosts.reduce((sum, post) => sum + (post.comment_analysis?.keyword_mentions || 0), 0),
      avg_comment_sentiment: 0,
      has_comment_mentions: effectiveAnalyzedPosts.some(post => (post.comment_analysis?.keyword_mentions || 0) > 0)
    }],
    overall_summary: {
      total_posts: sortedAnalyzedPosts.length,
      total_upvotes: sortedAnalyzedPosts.reduce((sum, post) => sum + post.score, 0),
      total_comments: sortedAnalyzedPosts.reduce((sum, post) => sum + post.comments, 0),
      most_active_subreddit: effectiveUncoverResults.subreddits_searched?.[0] || 'unknown',
      dominant_themes: [],
      community_narrative: (() => {
        const categoryUsed = effectiveUncoverResults.category_used;
        const postCount = sortedAnalyzedPosts.length;
        const subreddits = effectiveUncoverResults.subreddits_searched || [];
        const filteredSubreddits = subreddits.filter(subreddit => 
          !['startups', 'entrepreneur', 'marketing', 'smallbusiness', 'business'].includes(subreddit)
        );
        const communityCount = filteredSubreddits.length;
        const totalUpvotes = sortedAnalyzedPosts.reduce((sum, post) => sum + post.score, 0);
        const totalComments = sortedAnalyzedPosts.reduce((sum, post) => sum + post.comments, 0);
        
        // Create category-specific explanations
        const categoryExplanations = {
          'solution_request': `These posts represent users actively seeking solutions to specific problems. Our AI analyzed post titles, content, and engagement patterns to identify requests for tools, services, or advice that could indicate purchase intent or partnership opportunities.`,
          'advice_request': `These posts show users seeking guidance and recommendations from the community. Our analysis identified posts where users are asking for expert opinions, best practices, or strategic advice - indicating they value external input and may be open to professional services.`,
          'pain_anger': `These posts capture user frustrations and pain points expressed in community discussions. Our sentiment analysis and keyword detection identified posts where users are venting about problems, expressing dissatisfaction, or highlighting gaps in current solutions.`,
          'ideas': `These posts showcase innovative thinking and creative solutions shared by community members. Our analysis identified posts where users are brainstorming, sharing concepts, or proposing new approaches - indicating forward-thinking individuals who might be interested in cutting-edge solutions.`
        };
        
        const explanation = categoryExplanations[categoryUsed] || `These posts were categorized based on their content patterns and community engagement signals.`;
        
        return `Our AI discovered ${postCount} ${getCategoryDisplayName(categoryUsed).toLowerCase()} posts across ${communityCount} specialized communities, generating ${totalUpvotes} total upvotes and ${totalComments} community comments. ${explanation} Each post was analyzed for pain points, audience insights, and engagement opportunities to help you understand the community's needs and identify potential business opportunities.`;
      })(),
      time_range: {
        oldest_post: Math.min(...sortedAnalyzedPosts.map(p => p.created_utc)),
        newest_post: Math.max(...sortedAnalyzedPosts.map(p => p.created_utc))
      }
    },
    analysis_timestamp: effectiveUncoverResults.completed_at
  };

  console.log('🎯 UncoverResultPanel: Rendering main component');
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
                ? 'Your uncover data was compressed to fit browser storage limits. Some content may be truncated, but all key insights are preserved.'
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
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      )}

      {/* Panel Header */}
      <div className="analysis-panel-header">
        <div style={{flex: 1}}>
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
          >
            Overview
          </button>
          
          {showIndividualPostsView && (
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
            >
              View Individual Posts
            </button>
          )}
        </div>
        
        <button 
          onClick={showClearConfirmation}
          className="apollo-btn-secondary danger"
          title="Clear uncover results"
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
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    textAlign: 'left', 
                    lineHeight: '1.6',
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    💡 <strong>Tip:</strong> Use the content creation buttons in the Overview tab to generate SEO/AEO articles and LinkedIn posts based on specific post insights.
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
          <div className="identified-patterns-container">
            {/* Compact Discovery Overview */}
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
                    {getCategoryDisplayName(effectiveUncoverResults.category_used)}
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
                        {mockPatternAnalysis.overall_summary.total_posts}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                        Posts
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                        {mockPatternAnalysis.overall_summary.total_upvotes}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                        Upvotes
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                        {mockPatternAnalysis.overall_summary.total_comments}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                        Comments
                      </div>
                    </div>

                    {/* Community Coverage */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#000', lineHeight: 1 }}>
                        {effectiveUncoverResults.community_used}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'rgba(0, 0, 0, 0.7)', fontWeight: '500' }}>
                        Community
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Discovery Insights */}
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  borderRadius: '0.5rem',
                  padding: '0.875rem',
                  marginBottom: '1rem',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'rgba(0, 0, 0, 0.9)',
                    lineHeight: '1.5',
                    margin: '0 0 0.75rem 0',
                    fontWeight: '400'
                  }}>
                    {mockPatternAnalysis.overall_summary.community_narrative}
                  </p>

                  {/* Subreddit Coverage */}
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                    <div style={{
                      fontSize: '0.75rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: '600', color: 'rgba(0, 0, 0, 0.8)' }}>
                          Subreddit Coverage:
                        </span>
                        <span style={{ color: 'rgba(0, 0, 0, 0.7)', marginLeft: '0.25rem' }}>
                          {(() => {
                            const subreddits = effectiveUncoverResults.subreddits_searched || [];
                            // Filter out unwanted subreddits from display
                            const filteredSubreddits = subreddits.filter(subreddit => 
                              !['startups', 'entrepreneur', 'marketing', 'smallbusiness', 'business'].includes(subreddit)
                            );
                            const communityNames = filteredSubreddits.map(subreddit => `r/${subreddit}`).join(', ');
                            const communityText = filteredSubreddits.length === 1 ? 'community' : 'communities';
                            return `${filteredSubreddits.length} ${communityText} (${communityNames})`;
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
                  {(['recency', 'engagement'] as const).map((sortOption) => (
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
                      {sortOption === 'recency' ? 'Recent' : 'Engagement'}
                    </button>
                  ))}
                </div>
                
                <span style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  {patternSortBy === 'recency' ? 'Newest posts first' : 'Highest upvotes + comments first'}
                </span>
              </div>
            </div>

            {/* Pattern Categories */}
            <div className="pattern-categories" style={{ margin: '1rem' }}>
              {mockPatternAnalysis.categories.map((category, categoryIndex) => (
                <PatternCategoryCard 
                  key={category.id}
                  category={category}
                  categoryIndex={categoryIndex}
                  formatRelativeTime={formatRelativeTime}
                  formatTextContent={formatTextContent}
                  analyzedPosts={sortedAnalyzedPosts}
                  setCurrentIndex={setCurrentIndex}
                  setShowPostModal={setShowPostModal}
                  setIsRedditEngagementModalOpen={setIsRedditEngagementModalOpen}
                  setIsDigDeeperModalOpen={setIsDigDeeperModalOpen}
                  setIsContentCreationModalOpen={setIsContentCreationModalOpen}
                  setIsLinkedInPostModalOpen={setIsLinkedInPostModalOpen}
                  handleOpenCommentPreview={handleOpenCommentPreview}
                  categoryName={getCategoryDisplayName(effectiveUncoverResults.category_used)}
                />
              ))}
            </div>
          </div>

          {/* Sorting Controls Mobile Responsive CSS */}
          <style>
            {`
              /* Sorting Controls Mobile Styles */
              @media (max-width: 768px) {
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
        workflowId={effectiveUncoverResults.workflow_id}
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
                    border: '1px solid #f3f4f6'
                  }}>
                    {formatTextContent(currentPost.content)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comment Preview Modal */}
      {selectedPostForComments && (
        <UncoverCommentPreviewModal
          isOpen={isCommentPreviewModalOpen}
          onClose={handleCloseCommentPreview}
          post={selectedPostForComments}
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
              <h3 className="confirmation-modal-title">Clear Uncover Results?</h3>
              <p className="confirmation-modal-message">
                This action will remove all current uncover insights and return you to the search form.
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

export default UncoverResultPanel;
