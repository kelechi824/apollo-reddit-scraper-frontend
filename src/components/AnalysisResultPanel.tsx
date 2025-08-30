import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Wand2, FileText, AlertTriangle } from 'lucide-react';
import { AnalyzedPost } from '../types';
import DigDeeperModal from './DigDeeperModal';
import ContentCreationModal from './ContentCreationModal';
import LinkedInPostModal from './LinkedInPostModal';

interface AnalysisResultPanelProps {
  analyzedPosts: AnalyzedPost[];
  workflowId: string;
  totalFound: number;
  keywords: string;
  onClear: () => void;
}

const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({
  analyzedPosts,
  workflowId,
  totalFound,
  keywords,
  onClear
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'original' | 'pain' | 'audience' | 'content'>('original');
  const [isPostExpanded, setIsPostExpanded] = useState(false);
  const [isDigDeeperModalOpen, setIsDigDeeperModalOpen] = useState(false);
  const [isContentCreationModalOpen, setIsContentCreationModalOpen] = useState(false);
  const [isLinkedInPostModalOpen, setIsLinkedInPostModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  /**
   * Check for stored target post index on component mount
   * Why this matters: Allows navigation to specific posts when coming from history
   */
  React.useEffect(() => {
    const targetIndex = localStorage.getItem('apollo-analysis-target-index');
    if (targetIndex !== null) {
      const index = parseInt(targetIndex, 10);
      if (index >= 0 && index < analyzedPosts.length) {
        setCurrentIndex(index);
      }
      // Clear the stored index after using it
      localStorage.removeItem('apollo-analysis-target-index');
    }
  }, [analyzedPosts.length]);

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
    if (!keywords || !text) {
      return <span>{text}</span>;
    }

    // Split keywords by comma and clean them up
    const keywordList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
    
    if (keywordList.length === 0) {
      return <span>{text}</span>;
    }

    // Create a regex pattern to match any of the keywords as whole words only (case-insensitive)
    const pattern = new RegExp(`\\b(${keywordList.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    
    // Split text by the pattern and create highlighted spans
    const parts = text.split(pattern);
    
    return (
      <span>
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
      </span>
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
             Get Conversation Starter Tips
           </button>
        </div>
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#6b7280', 
          textAlign: 'left', 
          marginTop: '0.75rem',
          lineHeight: '1.4'
        }}>
          Get AI-powered conversation starters to engage naturally in Reddit discussions
        </p>
      </div>
    );
  };

  /**
   * Navigate to next post
   * Why this matters: Allows users to paginate through analysis results one at a time
   */
  const handleNext = () => {
    if (currentIndex < analyzedPosts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setActiveTab('original'); // Reset to first tab when changing posts
      resetPostExpansion(); // Reset expansion state
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



  if (analyzedPosts.length === 0) {
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-empty">
          <p>No analysis to display. Refine your search and try again.</p>
        </div>
      </div>
    );
  }

  const currentPost = analyzedPosts[currentIndex];
  
  // Safety check in case currentPost is undefined
  if (!currentPost) {
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-empty">
          <p>Error loading post data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-panel">
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
            Analyzed {analyzedPosts.length} posts, showing insight {currentIndex + 1} of {analyzedPosts.length}
          </p>
        </div>
        <button 
          onClick={showClearConfirmation}
          className="clear-results-btn"
          title="Clear analysis results"
        >
          Clear
        </button>
      </div>

      {/* Navigation */}
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
          <span className="nav-total">{analyzedPosts.length}</span>
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentIndex === analyzedPosts.length - 1}
          className="nav-btn nav-btn-next"
        >
          Next
          <ChevronRight style={{width: '1.25rem', height: '1.25rem'}} />
        </button>
      </div>

      {/* Current Post Analysis */}
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
                <span className="post-subreddit">r/{currentPost.subreddit}</span>
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
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              <span className="tab-label-desktop">Content Opportunity</span>
              <span className="tab-label-mobile" style={{ display: 'none' }}>Content</span>
            </button>
          </div>

          {/* Mobile-specific CSS */}
          <style>
            {`
              .content-buttons-container {
                justify-content: flex-start;
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
                    Get Conversation Starter Tips
                  </button>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    textAlign: 'left', 
                    marginTop: '0.75rem',
                    lineHeight: '1.4'
                  }}>
                    Get AI-powered conversation starters to engage naturally in Reddit discussions
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
                  <span style={{ transform: 'translateY(-2px)' }}>💡</span> Content Opportunity
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
          </div>
        </div>
      </div>

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