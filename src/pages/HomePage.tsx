import React, { useState } from 'react';
import AnalysisInterface from '../components/AnalysisInterface';
import AnalysisResultPanel from '../components/AnalysisResultPanel';
import { WorkflowResponse } from '../types';

const HomePage: React.FC = () => {
  const [currentResults, setCurrentResults] = useState<WorkflowResponse | null>(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  /**
   * Handle analysis completion from the interface
   * Why this matters: Updates the results panel with new analysis data
   */
  const handleAnalysisComplete = (results: WorkflowResponse) => {
    setCurrentResults(results);
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
          />
        ) : (
          <div className="results-empty">
            <div className="apollo-logo" style={{width: '4rem', height: '4rem', opacity: 0.3}}>
              <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
            </div>
            <h3>No Analysis Results</h3>
            <p>Run an analysis to see business insights here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 