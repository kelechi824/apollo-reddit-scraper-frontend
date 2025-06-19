import React, { useState } from 'react';
import { Search, Play, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { WorkflowRequest, WorkflowResponse, AnalyzedPost } from '../types';

interface AnalysisInterfaceProps {
  apiUrl: string;
}

const AnalysisInterface: React.FC<AnalysisInterfaceProps> = ({ apiUrl }) => {
  const [keywords, setKeywords] = useState<string>('');
  const [isKeywordSelected, setIsKeywordSelected] = useState<boolean>(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('sales');
  const [limit, setLimit] = useState<number>(5);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [results, setResults] = useState<WorkflowResponse | null>(null);
  const [error, setError] = useState<string>('');

  const availableSubreddits = ['sales', 'techsales', 'salestechniques', 'prospecting'];

  /**
   * Handle keyword selection when user blurs from input or presses Enter
   * Why this matters: Converts typed keyword into a selected "chip" for better UX
   */
  const handleKeywordBlur = () => {
    if (keywords.trim() && !isKeywordSelected) {
      setIsKeywordSelected(true);
    }
  };

  /**
   * Handle Enter key press to select keyword
   * Why this matters: Provides intuitive keyboard navigation expected by users
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywords.trim() && !isKeywordSelected) {
      e.preventDefault();
      setIsKeywordSelected(true);
    }
  };



  /**
   * Handle keyword editing
   * Why this matters: Allows users to click back into editing mode from selected state
   */
  const handleKeywordEdit = () => {
    setIsKeywordSelected(false);
  };





  /**
   * Handle form submission and run the complete analysis workflow
   * Why this matters: This triggers the entire Reddit → OpenAI → Sheets pipeline
   * from a single button click, providing immediate business insights.
   */
  const handleAnalysis = async () => {
    if (!keywords.trim()) {
      setError('Please enter a keyword');
      return;
    }

    if (!selectedSubreddit.trim()) {
      setError('Please select a subreddit');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResults(null);

    try {
      // Single keyword only - no comma splitting needed
      const keywordList = [keywords.trim()];
      
      const request: WorkflowRequest = {
        keywords: keywordList,
        subreddits: [selectedSubreddit],
        limit: limit
      };

      console.log('🚀 Starting analysis workflow:', request);

      const response = await fetch(`${apiUrl}/api/workflow/run-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data: WorkflowResponse = await response.json();
      setResults(data);
      
      console.log('✅ Analysis complete:', data);
      
      // Save to localStorage for history
      const savedAnalyses = JSON.parse(localStorage.getItem('apollo-analyses') || '[]');
      savedAnalyses.unshift({
        id: data.workflow_id,
        keywords: keywordList,
        subreddits: [selectedSubreddit],
        results: data,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('apollo-analyses', JSON.stringify(savedAnalyses.slice(0, 10))); // Keep last 10

    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Legacy function - no longer used, replaced by handleSubredditSelect

  return (
    <div className="saas-container">
      {/* Header Section */}
      <div className="saas-header">
        <h1 className="saas-title">Reddit Content Analysis</h1>
        <p className="saas-subtitle">
          Discover pain points, audience insights, and content opportunities from Reddit discussions with AI-powered analysis
        </p>
      </div>

      {/* Analysis Form */}
      <div className="saas-form">
        {/* Keywords Input */}
        <div className="form-group">
          <label htmlFor="keywords" className="form-label">
            Keyword <span style={{fontWeight: 'normal'}}>(single keyword only)</span>
          </label>
          
          {!isKeywordSelected ? (
            // Input mode - user is typing
            <div className="input-container">
              <Search className="input-icon" style={{transform: 'translateY(-3px)'}} />
              <input
                id="keywords"
                type="text"
                value={keywords}
                onChange={(e) => {
                  // Prevent commas to enforce single keyword
                  const value = e.target.value.replace(/,/g, '');
                  setKeywords(value);
                }}
                onBlur={handleKeywordBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g., lead generation"
                className="apollo-input"
                disabled={isAnalyzing}
              />
            </div>
          ) : (
            // Selected mode - show modern keyword chip with pill-form buttons
            <div className="flex flex-wrap gap-6 p-4 border border-apollo-gray-100 rounded-xl bg-white min-h-[3.5rem] items-center shadow-sm">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 font-medium"
                style={{
                  backgroundColor: '#dcfce7',
                  border: '2px solid #16a34a',
                  color: '#166534',
                  borderRadius: '10px'
                }}
              >
                <span className="text-sm font-medium">{keywords}</span>
              </div>
              
              {/* Modern edit button with inline styles */}
              <button
                onClick={handleKeywordEdit}
                disabled={isAnalyzing}
                className="inline-flex items-center px-4 py-2 rounded-full text-xs font-medium transition-all duration-200"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dbeafe';
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.borderColor = '#bfdbfe';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Edit keyword"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
            </div>
          )}
          
          {keywords.includes(',') && !isKeywordSelected && (
            <p className="text-sm text-apollo-gray-600 mt-2">
              Only one keyword allowed per analysis. Please remove commas.
            </p>
          )}
        </div>

        {/* Subreddit Selection */}
        <div className="form-group">
          <label htmlFor="subreddit" className="form-label">Select Subreddit</label>
                      <select
              id="subreddit"
              value={selectedSubreddit}
              onChange={(e) => setSelectedSubreddit(e.target.value)}
              className="apollo-input"
              style={{maxWidth: '24rem'}}
              disabled={isAnalyzing}
            >
              {availableSubreddits.map((subreddit) => (
              <option key={subreddit} value={subreddit}>
                r/{subreddit}
              </option>
            ))}
          </select>
        </div>

        {/* Limit Selection */}
        <div className="form-group">
          <label htmlFor="limit" className="form-label">
            Number of Posts to Analyze
          </label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="apollo-input"
            style={{maxWidth: '24rem'}}
            disabled={isAnalyzing}
          >
            <option value={3}>3 posts (Quick Analysis)</option>
            <option value={5}>5 posts (Recommended)</option>
            <option value={10}>10 posts (Comprehensive)</option>
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-container">
            <AlertCircle className="error-icon" />
            <div>
              <p className="error-title">Analysis Error</p>
              <p className="error-text">{error}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="btn-center">
          <button
            onClick={handleAnalysis}
            disabled={isAnalyzing}
            className="apollo-btn-primary btn-large"
          >
            {isAnalyzing ? (
              <>
                <Clock className="animate-spin" style={{width: '2rem', height: '2rem', marginRight: '1rem'}} />
                Analyzing Reddit Content...
              </>
            ) : (
              <>
                <Play style={{width: '2rem', height: '2rem', marginRight: '1rem'}} />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="saas-results">
          {/* Results Header */}
          <div className="success-header">
            <div className="success-icon">
              <CheckCircle style={{width: '2.5rem', height: '2.5rem', color: '#059669'}} />
            </div>
            <div>
              <h3 className="success-title">Analysis Complete</h3>
              <p className="success-text">
                Found {results.reddit_results.total_found} posts, analyzed {results.analyzed_posts.length} for business insights
              </p>
            </div>
          </div>

          {/* Analyzed Posts */}
          <div>
            <div className="insights-header">
              <div className="apollo-logo" style={{width: '3rem', height: '3rem'}}>
                <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
              </div>
              <h3 className="insights-title">Business Insights</h3>
            </div>
            
            {results.analyzed_posts.map((post: AnalyzedPost) => (
              <div key={post.id} className="result-card">
                {/* Post Header */}
                <div style={{borderBottom: '2px solid #f3f4f6', paddingBottom: '2rem', marginBottom: '2rem'}}>
                  <div className="flex items-start gap-6">
                    <div className="apollo-logo font-bold" style={{width: '3.5rem', height: '3.5rem', fontSize: '1.25rem'}}>
                      <span style={{color: '#000'}}>#{post.post_rank}</span>
                    </div>
                    <div style={{flex: '1'}}>
                      <h4 style={{fontWeight: '700', color: '#111827', fontSize: '1.5rem', marginBottom: '1rem', lineHeight: '1.3'}}>
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-6" style={{fontSize: '1rem', color: '#4b5563'}}>
                        <span style={{background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: '600'}}>
                          r/{post.subreddit}
                        </span>
                        <span className="flex items-center gap-2">
                          <svg style={{width: '1.25rem', height: '1.25rem'}} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12L8 10l1.414-1.414L10 9.172l4.586-4.586L16 6l-6 6z"/>
                          </svg>
                          {post.score} upvotes
                        </span>
                        <span className="flex items-center gap-2">
                          <svg style={{width: '1.25rem', height: '1.25rem'}} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          {post.comments} comments
                        </span>
                        <span style={{background: 'var(--apollo-yellow)', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: '600', color: '#000'}}>
                          Engagement: {post.engagement}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Analysis */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem'}}>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    <div style={{background: '#f9fafb', borderRadius: '1.5rem', padding: '1.5rem'}}>
                      <h5 style={{fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                        Pain Point
                      </h5>
                      <p style={{color: '#374151', fontSize: '1.125rem', lineHeight: '1.6', margin: '0'}}>
                        {post.analysis.pain_point}
                      </p>
                    </div>
                    
                    <div style={{background: '#f9fafb', borderRadius: '1.5rem', padding: '1.5rem'}}>
                      <h5 style={{fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                        Audience Insight
                      </h5>
                      <p style={{color: '#374151', fontSize: '1.125rem', lineHeight: '1.6', margin: '0'}}>
                        {post.analysis.audience_insight}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    <div style={{background: '#f9fafb', borderRadius: '1.5rem', padding: '1.5rem'}}>
                      <h5 style={{fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                        Content Opportunity
                      </h5>
                      <p style={{color: '#374151', fontSize: '1.125rem', lineHeight: '1.6', margin: '0'}}>
                        {post.analysis.content_opportunity}
                      </p>
                    </div>
                    
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                      <div style={{background: '#f9fafb', borderRadius: '1.5rem', padding: '1.5rem'}}>
                        <h5 style={{fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                          Urgency
                        </h5>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          fontWeight: '700',
                          backgroundColor: post.analysis.urgency_level === 'high' ? '#fee2e2' : 
                                          post.analysis.urgency_level === 'medium' ? '#fef3c7' : '#dcfce7',
                          color: post.analysis.urgency_level === 'high' ? '#991b1b' :
                                 post.analysis.urgency_level === 'medium' ? '#92400e' : '#166534'
                        }}>
                          {post.analysis.urgency_level.toUpperCase()}
                        </span>
                      </div>
                      
                      <div style={{background: '#f9fafb', borderRadius: '1.5rem', padding: '1.5rem'}}>
                        <h5 style={{fontWeight: '700', color: '#111827', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                          Demographics
                        </h5>
                        <p style={{color: '#374151', fontSize: '1rem', margin: '0'}}>
                          {post.analysis.target_demographic}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Link */}
                <div style={{paddingTop: '2rem', borderTop: '2px solid #f3f4f6', marginTop: '2rem'}}>
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: '#2563eb',
                      fontWeight: '600',
                      fontSize: '1.125rem',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                  >
                    View Original Reddit Post
                    <svg style={{width: '1.25rem', height: '1.25rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisInterface; 