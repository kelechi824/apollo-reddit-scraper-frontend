import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Wand2, FileText } from 'lucide-react';
import { AnalyzedPost } from '../types';
import DigDeeperModal from './DigDeeperModal';
import ContentCreationModal from './ContentCreationModal';

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
              Get conversation starters tips
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
             Ask Conversation AI Assistant
           </button>
        </div>
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#6b7280', 
          textAlign: 'left', 
          marginTop: '0.75rem',
          lineHeight: '1.4'
        }}>
          Get personalized sales coaching through guided discovery questions
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



  if (analyzedPosts.length === 0) {
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-empty">
          <p>No analysis results to display. Run an analysis to get started.</p>
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
      {/* Panel Header */}
      <div className="analysis-panel-header">
        <div style={{flex: 1}}>
          <h3 className="analysis-panel-title">Key Insights from Reddit</h3>
          <p className="analysis-panel-subtitle">
            Found {totalFound} posts, showing insight {currentIndex + 1} of {analyzedPosts.length}
          </p>
        </div>
        <button 
          onClick={onClear}
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
              Post
            </button>
            <button
              className={`tab-btn ${activeTab === 'pain' ? 'active' : ''}`}
              onClick={() => setActiveTab('pain')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              Pain Point
            </button>
            <button
              className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              Content Opportunity
            </button>
            <button
              className={`tab-btn ${activeTab === 'audience' ? 'active' : ''}`}
              onClick={() => setActiveTab('audience')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              Audience Summary
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'original' && (
              <div className="tab-panel">
                <div className="tab-panel-content" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                  {renderPostContent(currentPost.content || 'No additional content')}
                </div>
              </div>
            )}

            {activeTab === 'pain' && (
              <div className="tab-panel">
                <p className="tab-panel-content" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                  {currentPost.analysis.pain_point}
                </p>
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
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
                    Ask Conversation AI Assistant
                  </button>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    textAlign: 'left', 
                    marginTop: '0.75rem',
                    lineHeight: '1.4'
                  }}>
                    Get personalized sales coaching through guided discovery questions
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="tab-panel">
                <p className="tab-panel-content" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                  {currentPost.analysis.content_opportunity}
                </p>
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <button
                    onClick={() => setIsContentCreationModalOpen(true)}
                    className="apollo-btn-gradient"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      width: 'auto'
                    }}
                  >
                    <Wand2 style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                    Create Content with AI
                  </button>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    textAlign: 'left', 
                    marginTop: '0.75rem',
                    lineHeight: '1.4'
                  }}>
                    Generate AEO-optimized content using Reddit insights and Apollo brand kit
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'audience' && (
              <div className="tab-panel">
                <p className="tab-panel-content" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                  {currentPost.analysis.audience_insight}
                </p>
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
    </div>
  );
};

export default AnalysisResultPanel; 