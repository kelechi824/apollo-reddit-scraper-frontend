import React, { useState, useEffect } from 'react';
import GongAnalysisInterface from '../components/GongAnalysisInterface';
import GongAnalysisResultPanel from '../components/GongAnalysisResultPanel';
import { GongFetchCallsWithDetailsResponse } from '../types';
import { FEATURE_FLAGS } from '../utils/featureFlags';
import { API_BASE_URL, buildApiUrl } from '../config/api';

const GongAnalysisPage: React.FC = () => {
  const [currentResults, setCurrentResults] = useState<GongFetchCallsWithDetailsResponse | null>(null);
  // Determine backend URL based on environment
// Why this matters: Ensures production deployments use the correct backend URL
const apiUrl = API_BASE_URL;

  /**
   * Load saved Gong fetch results from localStorage on component mount
   * Why this matters: Preserves call data when users navigate away and return
   */
  useEffect(() => {
    const savedResults = localStorage.getItem('apollo-gong-fetches');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults)[0]?.results as GongFetchCallsWithDetailsResponse;
        if (parsedResults) {
          setCurrentResults(parsedResults);
        }
      } catch (error) {
        console.error('Failed to parse saved Gong fetch results:', error);
        localStorage.removeItem('apollo-gong-fetches');
      }
    }
  }, []);

  /**
   * Handle Gong calls fetch completion from the interface
   * Why this matters: Updates the results panel with new call data and saves for persistence
   */
  const handleCallsFetched = (results: GongFetchCallsWithDetailsResponse) => {
    setCurrentResults(results);
  };

  /**
   * Clear current Gong fetch results
   * Why this matters: Allows users to reset the interface and start fresh
   */
  const handleClearResults = () => {
    setCurrentResults(null);
    localStorage.removeItem('apollo-gong-fetches');
  };

  return (
    <div className="home-layout">
      {/* Left Analysis Section */}
      <div className="analysis-section">
        <GongAnalysisInterface 
          apiUrl={apiUrl} 
          onCallsFetched={handleCallsFetched}
        />
      </div>

      {/* Right Results Panel */}
      <div className="results-section">
        {currentResults && currentResults.calls.length > 0 ? (
          <GongAnalysisResultPanel
            calls={currentResults.calls}
            totalFound={currentResults.total_found}
            onClear={handleClearResults}
            showFullConversationTab={FEATURE_FLAGS.showGongFullConversationTab}
          />
        ) : (
          <div className="results-empty">
            <div className="apollo-logo" style={{width: '4rem', height: '4rem', opacity: 0.3}}>
              <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
            </div>
            <h3>No Calls Fetched Yet</h3>
            <p>Fetch Gong calls to see rich conversation insights here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GongAnalysisPage; 