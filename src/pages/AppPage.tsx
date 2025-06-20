import React, { useState, useEffect } from 'react';
import AnalysisInterface from '../components/AnalysisInterface';
import AnalysisResultPanel from '../components/AnalysisResultPanel';
import { WorkflowResponse } from '../types';

const AppPage: React.FC = () => {
  const [currentResults, setCurrentResults] = useState<WorkflowResponse | null>(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
   * Handle analysis completion from the interface
   * Why this matters: Updates the results panel with new analysis data and saves to localStorage
   */
  const handleAnalysisComplete = (results: WorkflowResponse) => {
    setCurrentResults(results);
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
    <div className="home-layout">
      {/* Left Analysis Section */}
      <div className="analysis-section">
        <AnalysisInterface 
          apiUrl={apiUrl} 
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>

      {/* Right Results Panel */}
      <div className="results-section">
        {currentResults ? (
          <AnalysisResultPanel
            analyzedPosts={currentResults.analyzed_posts}
            workflowId={currentResults.workflow_id}
            totalFound={currentResults.reddit_results.total_found}
            onClear={handleClearResults}
          />
        ) : (
          <div className="results-empty">
            <div className="apollo-logo" style={{width: '4rem', height: '4rem', opacity: 0.3}}>
              <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
            </div>
            <h3>No Insights Yet</h3>
            <p>Run an analysis to see business insights here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppPage; 