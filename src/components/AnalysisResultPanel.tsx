import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { AnalyzedPost } from '../types';

interface AnalysisResultPanelProps {
  analyzedPosts: AnalyzedPost[];
  workflowId: string;
  totalFound: number;
  onClear: () => void;
}

const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({
  analyzedPosts,
  workflowId,
  totalFound,
  onClear
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'original' | 'pain' | 'audience' | 'content'>('original');

  /**
   * Navigate to next post
   * Why this matters: Allows users to paginate through analysis results one at a time
   */
  const handleNext = () => {
    if (currentIndex < analyzedPosts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setActiveTab('original'); // Reset to first tab when changing posts
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

  return (
    <div className="analysis-panel">
      {/* Panel Header */}
      <div className="analysis-panel-header">
        <div className="apollo-logo" style={{width: '2.5rem', height: '2.5rem'}}>
          <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
        </div>
        <div style={{flex: 1}}>
          <h3 className="analysis-panel-title">Business Insights</h3>
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
          <span className="nav-current">{currentIndex + 1}</span>
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
            #{currentPost.post_rank}
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
                <span className={`urgency-badge urgency-${currentPost.analysis.urgency_level}`}>
                  Urgency: {currentPost.analysis.urgency_level.toUpperCase()}
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
            >
              Post
            </button>
            <button
              className={`tab-btn ${activeTab === 'pain' ? 'active' : ''}`}
              onClick={() => setActiveTab('pain')}
            >
              Pain Point
            </button>
            <button
              className={`tab-btn ${activeTab === 'audience' ? 'active' : ''}`}
              onClick={() => setActiveTab('audience')}
            >
              Audience Insight
            </button>
            <button
              className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              Content Opportunity
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'original' && (
              <div className="tab-panel">
                <p className="tab-panel-content">
                  {currentPost.content || 'No additional content'}
                </p>
              </div>
            )}

            {activeTab === 'pain' && (
              <div className="tab-panel">
                <p className="tab-panel-content">
                  {currentPost.analysis.pain_point}
                </p>
              </div>
            )}

            {activeTab === 'audience' && (
              <div className="tab-panel">
                <p className="tab-panel-content">
                  {currentPost.analysis.audience_insight}
                </p>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="tab-panel">
                <p className="tab-panel-content">
                  {currentPost.analysis.content_opportunity}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultPanel; 