import React, { useState, useEffect } from 'react';
import AnalysisInterface from '../components/AnalysisInterface';
import AnalysisResultPanel from '../components/AnalysisResultPanel';
import { WorkflowResponse } from '../types';
import { API_BASE_URL, buildApiUrl } from '../config/api';
import { StorageManager } from '../utils/storageManager';
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
    const savedResults = localStorage.getItem('apollo-analysis-results');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults) as WorkflowResponse;
        setCurrentResults(parsedResults);
      } catch (error) {
        console.error('Failed to parse saved results:', error);
        localStorage.removeItem('apollo-analysis-results');
      }
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
    setCurrentResults(results);
    setIsAnalyzing(false);
    // Save results to localStorage for persistence
    localStorage.setItem('apollo-analysis-results', JSON.stringify(results));
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
        />
      </div>

      {/* Full Width Results Panel */}
      <div className="results-section-fullwidth">
        {currentResults || isAnalyzing ? (
          <AnalysisResultPanel
            analyzedPosts={currentResults?.analyzed_posts || []}
            workflowId={currentResults?.workflow_id || ''}
            totalFound={currentResults?.reddit_results.total_found || 0}
            keywords={currentResults?.reddit_results.keywords_used || ''}
            patternAnalysis={currentResults?.pattern_analysis || null}
            onClear={handleClearResults}
            isAnalyzing={isAnalyzing}
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