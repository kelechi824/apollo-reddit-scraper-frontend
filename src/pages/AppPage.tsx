import React, { useState, useEffect } from 'react';
import AnalysisInterface from '../components/AnalysisInterface';
import AnalysisResultPanel from '../components/AnalysisResultPanel';
import { WorkflowResponse } from '../types';
import { API_BASE_URL, buildApiUrl } from '../config/api';
import { StorageManager } from '../utils/StorageManager';
import { StorageDebug } from '../utils/storageDebug';
import { FEATURE_FLAGS } from '../utils/featureFlags';

const AppPage: React.FC = () => {
  const [currentResults, setCurrentResults] = useState<WorkflowResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Determine backend URL based on environment
  // Why this matters: Ensures production deployments use the correct backend URL
  const apiUrl = API_BASE_URL;

  /**
   * Load saved results from localStorage on component mount
   * Why this matters: Preserves user's analysis results when they navigate away and come back
   */
  useEffect(() => {
    const savedResults = StorageManager.getAnalysisResults();
    if (savedResults) {
      setCurrentResults(savedResults as WorkflowResponse);
    }
    
    // Initialize storage debugging in development
    if (process.env.NODE_ENV === 'development') {
      StorageDebug.logStorageUsage();
    }
  }, []);

  /**
   * Handle analysis start from the interface
   * Why this matters: Shows skeleton loading state while analysis is running
   */
  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
  };

  /**
   * Handle analysis error from the interface
   * Why this matters: Stops skeleton loading state when analysis fails
   */
  const handleAnalysisError = () => {
    setIsAnalyzing(false);
  };

  /**
   * Handle analysis completion from the interface
   * Why this matters: Updates the results panel with new analysis data and saves to localStorage
   */
  const handleAnalysisComplete = (results: WorkflowResponse) => {
    console.log('🎯 AppPage received analysis results:', results);
    console.log('🎯 Results structure check:', {
      analyzed_posts: results?.analyzed_posts?.length,
      workflow_id: results?.workflow_id,
      reddit_results: results?.reddit_results,
      pattern_analysis: !!results?.pattern_analysis
    });
    console.log('🎯 Setting currentResults state...');
    setCurrentResults(results);
    setIsAnalyzing(false);
    console.log('🎯 Analysis state updated, isAnalyzing set to false');
    
    // Force a re-render check after state update
    setTimeout(() => {
      console.log('🎯 State should be updated now, checking...');
    }, 100);
    
    // Save results to localStorage for persistence using smart storage manager
    const saved = StorageManager.saveAnalysisResults(results);
    if (!saved) {
      console.warn('Failed to save analysis results to localStorage due to size constraints');
    }
  };

  /**
   * Clear current analysis results
   * Why this matters: Allows users to reset the interface and start fresh
   */
  const handleClearResults = () => {
    setCurrentResults(null);
    localStorage.removeItem('apollo-analysis-results');
  };

  return (
    <div className="home-layout-new">
      {/* Header Analysis Interface */}
      <div className="analysis-header-section">
        <AnalysisInterface 
          apiUrl={apiUrl} 
          onAnalysisComplete={handleAnalysisComplete}
          onClearResults={handleClearResults}
          onAnalysisStart={handleAnalysisStart}
          onAnalysisError={handleAnalysisError}
          showAllSubreddits={FEATURE_FLAGS.showAllSubreddits}
        />
      </div>

      {/* Full Width Results Panel */}
      <div className="results-section-fullwidth">
        {(() => {
          console.log('🎯 Render check - currentResults:', !!currentResults, 'isAnalyzing:', isAnalyzing);
          if (currentResults) {
            console.log('🎯 currentResults data structure:', currentResults);
            console.log('🎯 currentResults analyzed_posts:', currentResults.analyzed_posts?.length);
            console.log('🎯 currentResults workflow_id:', currentResults.workflow_id);
            console.log('🎯 currentResults reddit_results:', currentResults.reddit_results);
          }
          return currentResults || isAnalyzing;
        })() ? (
          <AnalysisResultPanel
            analyzedPosts={currentResults?.analyzed_posts || []}
            workflowId={currentResults?.workflow_id || ''}
            totalFound={currentResults?.reddit_results?.total_found || 0}
            keywords={currentResults?.reddit_results?.keywords_used || ''}
            patternAnalysis={currentResults?.pattern_analysis || null}
            onClear={handleClearResults}
            isAnalyzing={isAnalyzing}
            showIndividualPostsView={FEATURE_FLAGS.showIndividualPostsView}
          />
        ) : (
          <div className="results-empty-fullwidth">
            <div className="apollo-logo" style={{width: '4rem', height: '4rem', opacity: 0.3}}>
              <img src="/apollo logo only.png" alt="Apollo Logo" />
            </div>
            <h3>No Reddit Insights Yet</h3>
            <p>Run an analysis to see Reddit insights here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppPage; 