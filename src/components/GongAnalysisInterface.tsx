import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Play, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { GongFetchCallsRequest, GongFetchCallsResponse, GongFetchCallsWithDetailsResponse, GongCallWithDetails } from '../types';

interface GongAnalysisInterfaceProps {
  apiUrl: string;
  onCallsFetched: (results: GongFetchCallsWithDetailsResponse) => void;
}

const GongAnalysisInterface: React.FC<GongAnalysisInterfaceProps> = ({ apiUrl, onCallsFetched }) => {
  const [daysBack, setDaysBack] = useState<number>(7);
  const [limit, setLimit] = useState<number>(5);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fetchStep, setFetchStep] = useState<number>(0);
  const [hasCompletedFetch, setHasCompletedFetch] = useState<boolean>(false);
  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch progress messages - updated for conversation details
  const fetchMessages = [
    'Connecting to Gong...',
    'Fetching recent calls...',
    'Loading conversation details...',
    'Processing call insights...'
  ];

  /**
   * Handle fetch progress animation
   * Why this matters: Provides visual feedback during the call fetching process to keep users engaged.
   */
  useEffect(() => {
    if (isFetching) {
      setFetchStep(0);
      
      // Step timing: 2s, 2s, 3s, then stay on last message
      const stepTimings = [2000, 2000, 3000]; // milliseconds for each step
      let currentStep = 0;
      
      const progressToNextStep = () => {
        if (currentStep < stepTimings.length) {
          fetchTimerRef.current = setTimeout(() => {
            currentStep++;
            if (currentStep < fetchMessages.length - 1) {
              setFetchStep(currentStep);
              progressToNextStep();
            } else {
              // Stay on the last message
              setFetchStep(fetchMessages.length - 1);
            }
          }, stepTimings[currentStep]);
        }
      };
      
      progressToNextStep();
    } else {
      // Clear timer when fetching stops
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
        fetchTimerRef.current = null;
      }
      setFetchStep(0);
    }

    // Cleanup on unmount
    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, [isFetching, fetchMessages.length]);

  /**
   * Handle form submission and fetch Gong calls with conversation details
   * Why this matters: This fetches recent Gong calls with rich conversation details
   * for inspection without expensive OpenAI analysis processing.
   */
  const handleFetchCalls = async () => {
    setIsFetching(true);
    setError('');

    try {
      const request: GongFetchCallsRequest = {
        daysBack: daysBack,
        limit: limit
      };

      console.log('🚀 Starting Gong call fetch:', request);

      // Step 1: Fetch basic call list
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/gong-analysis/fetch-calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.statusText}`);
      }

      const basicData: GongFetchCallsResponse = await response.json();
      console.log('✅ Basic calls fetch complete:', basicData);

      // Step 2: Fetch conversation details for each call
      const callsWithDetails: GongCallWithDetails[] = [];
      
      for (let i = 0; i < basicData.calls.length; i++) {
        const call = basicData.calls[i];
        try {
          console.log(`📞 Fetching conversation details for call ${i + 1}/${basicData.calls.length}: ${call.title}`);
          
          const detailsResponse = await fetch(`${apiUrl.replace(/\/$/, '')}/api/gong/calls/${call.id}/conversation-details`);
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            callsWithDetails.push({
              ...call,
              conversationDetails: detailsData.data
            });
          } else {
            console.warn(`⚠️ Failed to fetch details for call ${call.id}`);
            callsWithDetails.push(call);
          }
        } catch (error) {
          console.error(`❌ Error fetching details for call ${call.id}:`, error);
          callsWithDetails.push(call);
        }
      }

      const enrichedData: GongFetchCallsWithDetailsResponse = {
        success: true,
        calls: callsWithDetails,
        total_found: basicData.total_found,
        message: `Fetched ${callsWithDetails.length} calls with conversation details`
      };
      
      console.log('✅ Conversation details fetch complete:', enrichedData);
      
      // Save to localStorage for history
      const savedFetches = JSON.parse(localStorage.getItem('apollo-gong-fetches') || '[]');
      savedFetches.unshift({
        id: `gong-fetch-${Date.now()}`,
        daysBack: daysBack,
        limit: limit,
        results: enrichedData,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('apollo-gong-fetches', JSON.stringify(savedFetches.slice(0, 10))); // Keep last 10
      
      // Notify parent component
      onCallsFetched(enrichedData);
      
      // Mark fetch as completed
      setHasCompletedFetch(true);

    } catch (err) {
      console.error('❌ Gong calls fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="analysis-interface">
      {/* Analysis Form */}
      <div className="interface-form">
        {/* Date Range Selection */}
        <div className="form-group">
          <label htmlFor="daysBack" className="form-label">
            Time Period
          </label>
          <select
            id="daysBack"
            value={daysBack}
            onChange={(e) => setDaysBack(parseInt(e.target.value))}
            className="apollo-input"
            style={{
              maxWidth: '24rem', 
              textAlign: 'left',
              paddingLeft: '0.75rem',
              direction: 'ltr'
            }}
            disabled={isFetching}
          >
            <option value={3}>Last 3 days</option>
            <option value={7}>Last 7 days (Recommended)</option>
            <option value={14}>Last 2 weeks</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>

        {/* Limit Selection */}
        <div className="form-group">
          <label htmlFor="limit" className="form-label">
            Number of Calls to Fetch
          </label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="apollo-input"
            style={{
              maxWidth: '24rem', 
              textAlign: 'left',
              paddingLeft: '0.75rem',
              direction: 'ltr'
            }}
            disabled={isFetching}
          >
            <option value={3}>3 calls (Quick View)</option>
            <option value={5}>5 calls (Recommended)</option>
            <option value={10}>10 calls (Detailed View)</option>
            <option value={15}>15 calls (Comprehensive)</option>
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-container">
            <AlertCircle className="error-icon" />
            <div>
              <p className="error-title">Fetch Error</p>
              <p className="error-text">{error}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="btn-center">
          <button
            onClick={handleFetchCalls}
            disabled={isFetching}
            className="apollo-btn-primary btn-large analysis-run-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            {isFetching ? (
              <>
                <Clock className="animate-spin" style={{width: '1rem', height: '1rem'}} />
                {fetchMessages[fetchStep]}
              </>
            ) : (
              <>
                <Play style={{width: '1rem', height: '1rem'}} />
                {hasCompletedFetch ? 'Get Again' : 'Get Calls'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GongAnalysisInterface; 