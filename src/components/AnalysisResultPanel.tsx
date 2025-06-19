import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { AnalyzedPost } from '../types';

interface AnalysisResultPanelProps {
  analyzedPosts: AnalyzedPost[];
  workflowId: string;
  totalFound: number;
}

const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({
  analyzedPosts,
  workflowId,
  totalFound
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Navigate to next post
   * Why this matters: Allows users to paginate through analysis results one at a time
   */
  const handleNext = () => {
    if (currentIndex < analyzedPosts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  /**
   * Navigate to previous post
   * Why this matters: Allows users to go back to previously viewed insights
   */
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (analyzedPosts.length === 0) {
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-empty">
          <p>No analysis results to display</p>
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
        <div>
          <h3 className="analysis-panel-title">Business Insights</h3>
          <p className="analysis-panel-subtitle">
            Found {totalFound} posts, showing insight {currentIndex + 1} of {analyzedPosts.length}
          </p>
        </div>
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
              <span className="post-subreddit">r/{currentPost.subreddit}</span>
              <div className="post-stats">
                <span className="post-stat">
                  <svg style={{width: '1rem', height: '1rem'}} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12L8 10l1.414-1.414L10 9.172l4.586-4.586L16 6l-6 6z"/>
                  </svg>
                  {currentPost.score}
                </span>
                <span className="post-stat">
                  <svg style={{width: '1rem', height: '1rem'}} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                  {currentPost.comments}
                </span>
                <span className="post-engagement">
                  Engagement: {currentPost.engagement}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Analysis Grid */}
        <div className="analysis-grid">
          <div className="analysis-card">
            <h5 className="analysis-card-title">Pain Point</h5>
            <p className="analysis-card-content">
              {currentPost.analysis.pain_point}
            </p>
          </div>
          
          <div className="analysis-card">
            <h5 className="analysis-card-title">Audience Insight</h5>
            <p className="analysis-card-content">
              {currentPost.analysis.audience_insight}
            </p>
          </div>
          
          <div className="analysis-card">
            <h5 className="analysis-card-title">Content Opportunity</h5>
            <p className="analysis-card-content">
              {currentPost.analysis.content_opportunity}
            </p>
          </div>
          
          <div className="analysis-card-row">
            <div className="analysis-card analysis-card-small">
              <h5 className="analysis-card-title">Urgency</h5>
              <span className={`urgency-badge urgency-${currentPost.analysis.urgency_level}`}>
                {currentPost.analysis.urgency_level.toUpperCase()}
              </span>
            </div>
            
            <div className="analysis-card analysis-card-small">
              <h5 className="analysis-card-title">Demographics</h5>
              <p className="analysis-card-content analysis-card-content-small">
                {currentPost.analysis.target_demographic}
              </p>
            </div>
          </div>
        </div>

        {/* Post Link */}
        <div className="post-link-section">
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
      </div>
    </div>
  );
};

export default AnalysisResultPanel; 