import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, AlertCircle, Clock } from 'lucide-react';
import { WorkflowRequest, WorkflowResponse } from '../types';
import { makeApiRequest } from '../utils/apiHelpers';
import { StorageManager } from '../utils/storageManager';

interface AnalysisInterfaceProps {
  apiUrl: string;
  onAnalysisComplete: (results: WorkflowResponse) => void;
  onClearResults?: () => void;
  onAnalysisStart?: () => void;
  onAnalysisError?: () => void;
}

const AnalysisInterface: React.FC<AnalysisInterfaceProps> = ({ apiUrl, onAnalysisComplete, onClearResults, onAnalysisStart, onAnalysisError }) => {
  const [keywords, setKeywords] = useState<string>('');
  const [isKeywordSelected, setIsKeywordSelected] = useState<boolean>(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('all');
  const [limit, setLimit] = useState<number>(5);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'recent' | 'older'>('recent');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState<boolean>(false);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);

  const availableSubreddits = ['sales', 'techsales', 'salestechniques', 'prospecting', 'startups', 'entrepreneur', 'marketing', 'smallbusiness', 'business', 'b2bmarketing', 'b2b_sales', 'b2bsaas', 'coldemail', 'emailmarketing', 'salesdevelopment', 'saas', 'leadgeneration', 'coldcalling', 'leadgen', 'marketingautomation', 'crm'];


  
  // Time filter options for Reddit post recency
  const timeframeOptions = [
    { value: 'recent' as const, label: 'Recent Posts' },
    { value: 'older' as const, label: 'Older Posts' }
  ];

  // Analysis progress messages with timing
  const analysisMessages = [
    'Deploying AI Agent...',
    'Scraping Reddit...',
    'Analyzing subreddit...',
    'Identifying pain points...',
    'Generating insights...'
  ];

  /**
   * Handle analysis progress animation
   * Why this matters: Cycles through different status messages to show AI processing stages with realistic timing.
   */
  useEffect(() => {
    if (isAnalyzing) {
      setAnalysisStep(0);
      
      // Dynamic step timing based on number of posts being analyzed
      // Reflects actual time with parallel processing optimization (80% faster than before)
      const getStepTimings = (postCount: number) => {
        if (postCount === 3) {
          return [3000, 5000, 6000, 4000]; // 18s total for 3 posts (15-25s range)
        } else if (postCount === 5) {
          return [4000, 8000, 10000, 6000]; // 28s total for 5 posts (25-35s range)
        } else {
          return [5000, 10000, 12000, 8000]; // 35s total for 10 posts (30-45s range)
        }
      };
      
      const stepTimings = getStepTimings(limit);
      let currentStep = 0;
      
      const progressToNextStep = () => {
        if (currentStep < stepTimings.length) {
          analysisTimerRef.current = setTimeout(() => {
            currentStep++;
            if (currentStep < analysisMessages.length - 1) {
              setAnalysisStep(currentStep);
              progressToNextStep();
            } else {
              // Stay on the last message
              setAnalysisStep(analysisMessages.length - 1);
            }
          }, stepTimings[currentStep]);
        }
      };
      
      progressToNextStep();
    } else {
      // Clear timer when analysis stops
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
      setAnalysisStep(0);
    }

    // Cleanup on unmount
    return () => {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
      }
    };
  }, [isAnalyzing, analysisMessages.length]);

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
   * Handle timeframe change
   * Why this matters: Clears results and resets state when user switches between Recent/Older posts
   */
  const handleTimeframeChange = (newTimeframe: 'recent' | 'older') => {
    console.log(`🔄 Timeframe changed from ${selectedTimeframe} to ${newTimeframe}`);
    setSelectedTimeframe(newTimeframe);
    setHasCompletedAnalysis(false);
    // Clear cached results
    localStorage.removeItem('apollo-analysis-results');
    console.log('🗑️ Cleared localStorage apollo-analysis-results');
    // Clear current results in parent component
    if (onClearResults) {
      console.log('🗑️ Calling onClearResults');
      onClearResults();
    } else {
      console.log('⚠️ onClearResults not available');
    }
  };





  /**
   * Handle form submission and run the complete analysis workflow with async polling
   * Why this matters: This starts the analysis and polls for completion to avoid timeout issues
   * in serverless environments while providing real-time progress updates.
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
    
    // Notify parent that analysis has started
    if (onAnalysisStart) {
      onAnalysisStart();
    }

    try {
      // Single keyword only - no comma splitting needed
      const keywordList = [keywords.trim()];
      
      // Handle "all" subreddits selection
      const subredditList = selectedSubreddit === 'all' 
        ? availableSubreddits 
        : [selectedSubreddit];
      
      const request: WorkflowRequest = {
        keywords: keywordList,
        subreddits: subredditList,
        limit: limit,
        timeframe: selectedTimeframe
      };

      console.log('🚀 Starting analysis workflow:', request);
      console.log(`📊 Current selectedTimeframe state: ${selectedTimeframe}`);

      // Step 1: Start the workflow (returns immediately with workflow ID)
      const startResult = await makeApiRequest<{workflow_id: string; status: string}>(
        `${apiUrl.replace(/\/$/, '')}/api/workflow/run-analysis`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      if (!startResult.success) {
        throw new Error(startResult.error || startResult.message || 'Failed to start analysis');
      }

      const workflowId = startResult.data!.workflow_id;
      console.log('📋 Workflow started with ID:', workflowId);

      // Step 2: Poll for completion
      const pollForCompletion = async (): Promise<WorkflowResponse> => {
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
          
          const statusResult = await makeApiRequest<{
            workflow_id: string;
            status: 'pending' | 'running' | 'completed' | 'failed';
            progress: number;
            result?: WorkflowResponse;
            error?: string;
          }>(`${apiUrl.replace(/\/$/, '')}/api/workflow/status/${workflowId}`);

          if (!statusResult.success) {
            throw new Error('Failed to check workflow status');
          }

          const status = statusResult.data!;
          console.log(`📊 Workflow ${workflowId} status:`, status.status, `(${status.progress}%)`);

          if (status.status === 'completed') {
            if (!status.result) {
              throw new Error('Workflow completed but no results available');
            }
            return status.result;
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Workflow failed');
          }
          
          // Continue polling for 'pending' or 'running' status
        }
      };

      const data = await pollForCompletion();
      
      console.log('✅ Analysis complete:', data);
      
      // Save analysis to localStorage for history using StorageManager
      const analysis = {
        id: data.workflow_id,
        keywords: keywordList,
        subreddits: subredditList,
        timestamp: new Date().toISOString(),
        results: data,
        _full: true // Flag to indicate this is full data
      };
      
      const saved = StorageManager.updateAnalysesHistory(analysis);
      if (!saved) {
        console.warn('Failed to save analysis to history due to storage constraints');
      }
      
      // Notify parent component
      onAnalysisComplete(data);
      
      // Mark analysis as completed
      setHasCompletedAnalysis(true);

    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      
      // Notify parent that analysis has stopped due to error
      if (onAnalysisError) {
        onAnalysisError();
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Legacy function - no longer used, replaced by handleSubredditSelect

  return (
    <div className="analysis-interface-header">
      {/* Horizontal Analysis Form */}
      <div className="interface-form-horizontal">
        {/* Keywords Input */}
        <div className="form-group-horizontal-inline">
          <label htmlFor="keywords" className="form-label-horizontal-inline">
            Keyword
          </label>
          
          {!isKeywordSelected ? (
            // Input mode - user is typing
            <div className="input-container-horizontal">
              <Search className="input-icon" />
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
                placeholder="e.g., apollo, b2b sales"
                className="apollo-input-horizontal"
                disabled={isAnalyzing}
              />
            </div>
          ) : (
            // Selected mode - show modern keyword chip with pill-form buttons
            <div className="keyword-selected-horizontal">
              <div 
                className="keyword-chip-horizontal"
                style={{
                  backgroundColor: '#dcfce7',
                  border: '0.125rem solid #16a34a',
                  color: '#166534',
                  borderRadius: '0.625rem'
                }}
              >
                <span className="keyword-text">{keywords}</span>
              </div>
              
              {/* Modern edit button with inline styles */}
              <button
                onClick={handleKeywordEdit}
                disabled={isAnalyzing}
                className="keyword-edit-btn"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: '0.0625rem solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dbeafe';
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.borderColor = '#bfdbfe';
                  e.currentTarget.style.boxShadow = '0 0.0625 0.1875rem 0 rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Edit keyword"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2v-7"/>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
            </div>
          )}
          
          {keywords.includes(',') && !isKeywordSelected && (
            <p className="error-text-horizontal">
              Only one keyword allowed per analysis. Please remove commas.
            </p>
          )}
        </div>

        {/* Subreddit Selection */}
        <div className="form-group-horizontal-inline">
          <label htmlFor="subreddit" className="form-label-horizontal-inline">Subreddit</label>
          <select
            id="subreddit"
            value={selectedSubreddit}
            onChange={(e) => setSelectedSubreddit(e.target.value)}
            className="apollo-input-horizontal-dropdown"
            disabled={isAnalyzing}
          >
            <option value="all">All Subreddits ({availableSubreddits.length})</option>
            {availableSubreddits.map((subreddit) => (
              <option key={subreddit} value={subreddit}>
                r/{subreddit}
              </option>
            ))}
          </select>
        </div>

        {/* Time Filter Selection */}
        <div className="form-group-horizontal-inline">
          <label htmlFor="timeframe" className="form-label-horizontal-inline">
            Post Filter
          </label>
          <select
            id="timeframe"
            value={selectedTimeframe}
            onChange={(e) => handleTimeframeChange(e.target.value as 'recent' | 'older')}
            className="apollo-input-horizontal-dropdown"
            disabled={isAnalyzing}
          >
            {timeframeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Limit Selection */}
        <div className="form-group-horizontal-inline">
          <label htmlFor="limit" className="form-label-horizontal-inline">
            Posts
          </label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="apollo-input-horizontal-dropdown"
            disabled={isAnalyzing}
          >
            <option value={3}>3 posts</option>
            <option value={5}>5 posts</option>
            <option value={10}>10 posts</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="form-group-horizontal-inline">
          <div className="run-analysis-container-horizontal">
            <button
              onClick={handleAnalysis}
              disabled={isAnalyzing}
              className={`apollo-btn-primary ${isAnalyzing ? 'analysis-run-btn-horizontal-dynamic' : 'analysis-run-btn-horizontal-sized'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              {isAnalyzing ? (
                <>
                  <Clock className="animate-spin" style={{width: '1rem', height: '1rem'}} />
                  {analysisMessages[analysisStep]}
                </>
              ) : (
                <>
                  <Play style={{width: '1rem', height: '1rem'}} />
                  {hasCompletedAnalysis ? 'Run Again' : 'Run Analysis'}
                </>
              )}
            </button>
            
            {/* Estimated Time Display - to the right of button */}
            <div className="time-estimate-right-of-button">
              <p>
                Est. time: {limit === 3 ? '15-20 seconds' : limit === 5 ? '20-30 seconds' : '30-60 seconds'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container-horizontal">
          <AlertCircle className="error-icon" />
          <div>
            <p className="error-title">No Results Found</p>
            <p className="error-text">{error}</p>
          </div>
        </div>
      )}


    </div>
  );
};

export default AnalysisInterface; 