import React, { useState, useEffect } from 'react';
import UncoverInterface from '../components/UncoverInterface';
import UncoverResultPanel from '../components/UncoverResultPanel';
import { UncoverWorkflowResponse } from '../types';
import { FEATURE_FLAGS } from '../utils/featureFlags';
import { API_BASE_URL } from '../config/api';

const UncoverPage: React.FC = () => {
  const [uncoverResults, setUncoverResults] = useState<UncoverWorkflowResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // API URL configuration - use centralized config that handles production/development automatically
  const apiUrl = API_BASE_URL;

  /**
   * Handle successful uncover analysis completion
   * Why this matters: Updates the UI state to show results and stops loading indicators
   */
  const handleAnalysisComplete = (results: UncoverWorkflowResponse) => {
    console.log('🎯 UncoverPage: Analysis completed with results:', results);
    setUncoverResults(results);
    setHasResults(true);
    setIsAnalyzing(false);
  };

  /**
   * Handle analysis start
   * Why this matters: Shows loading state and hides any previous results
   */
  const handleAnalysisStart = () => {
    console.log('🎯 UncoverPage: Analysis started');
    setIsAnalyzing(true);
    setHasResults(false);
    setUncoverResults(null);
  };

  /**
   * Handle analysis error
   * Why this matters: Stops loading state when analysis fails
   */
  const handleAnalysisError = () => {
    console.log('🎯 UncoverPage: Analysis error occurred');
    setIsAnalyzing(false);
  };

  /**
   * Clear all results and return to search interface
   * Why this matters: Allows users to start fresh analysis
   */
  const handleClearResults = () => {
    console.log('🎯 UncoverPage: Clearing results');
    setUncoverResults(null);
    setHasResults(false);
    setIsAnalyzing(false);
    
    // Clear any cached results
    localStorage.removeItem('apollo-uncover-results');
    localStorage.removeItem('apollo-uncover-backup');
  };

  /**
   * Load cached results on component mount
   * Why this matters: Restores user's previous analysis after page refresh
   */
  useEffect(() => {
    try {
      const cachedResults = localStorage.getItem('apollo-uncover-results');
      if (cachedResults) {
        const parsed = JSON.parse(cachedResults);
        if (parsed.results && Array.isArray(parsed.results.posts) && parsed.results.posts.length > 0) {
          console.log('🎯 UncoverPage: Restored cached results');
          setUncoverResults(parsed.results);
          setHasResults(true);
        }
      }
    } catch (error) {
      console.error('Failed to restore cached uncover results:', error);
      localStorage.removeItem('apollo-uncover-results');
    }
  }, []);

  return (
    <div className="home-layout-new">
      {/* Header Analysis Interface */}
      <div className="analysis-header-section">
        <UncoverInterface
          apiUrl={apiUrl}
          onAnalysisComplete={handleAnalysisComplete}
          onClearResults={handleClearResults}
          onAnalysisStart={handleAnalysisStart}
          onAnalysisError={handleAnalysisError}
        />
      </div>

      {/* Full Width Results Panel */}
      <div className="results-section-fullwidth">
        {/* Show results panel when we have results or are analyzing */}
        {(hasResults || isAnalyzing) && uncoverResults && (
          <UncoverResultPanel
            uncoverResults={uncoverResults}
            onClear={handleClearResults}
            isAnalyzing={isAnalyzing}
            showIndividualPostsView={FEATURE_FLAGS.showIndividualPostsView}
          />
        )}

        {/* Show loading state when analyzing but no results yet */}
        {isAnalyzing && !uncoverResults && (
          <UncoverResultPanel
            uncoverResults={{
              success: false,
              posts: [],
              total_found: 0,
              category_used: 'solution_request',
              community_used: '',
              subreddits_searched: [],
              search_patterns_used: [],
              workflow_id: '',
              completed_at: ''
            }}
            onClear={handleClearResults}
            isAnalyzing={true}
            showIndividualPostsView={FEATURE_FLAGS.showIndividualPostsView}
          />
        )}

        {/* Show empty state when no results and not analyzing */}
        {!hasResults && !isAnalyzing && (
          <UncoverResultPanel
            uncoverResults={{
              success: false,
              posts: [],
              total_found: 0,
              category_used: 'solution_request',
              community_used: '',
              subreddits_searched: [],
              search_patterns_used: [],
              workflow_id: '',
              completed_at: ''
            }}
            onClear={handleClearResults}
            isAnalyzing={false}
            showIndividualPostsView={FEATURE_FLAGS.showIndividualPostsView}
          />
        )}

      </div>

    </div>
  );
};

export default UncoverPage;
