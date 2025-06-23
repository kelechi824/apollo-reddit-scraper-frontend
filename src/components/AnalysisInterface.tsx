import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, AlertCircle, Clock } from 'lucide-react';
import { WorkflowRequest, WorkflowResponse } from '../types';

interface AnalysisInterfaceProps {
  apiUrl: string;
  onAnalysisComplete: (results: WorkflowResponse) => void;
}

const AnalysisInterface: React.FC<AnalysisInterfaceProps> = ({ apiUrl, onAnalysisComplete }) => {
  const [keywords, setKeywords] = useState<string>('');
  const [isKeywordSelected, setIsKeywordSelected] = useState<boolean>(false);
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('sales');
  const [limit, setLimit] = useState<number>(5);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState<boolean>(false);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);

  const availableSubreddits = ['sales', 'techsales', 'salestechniques', 'prospecting'];

  // Analysis progress messages with timing
  const analysisMessages = [
    'Deploying Agent...',
    'Scraping Reddit...',
    'Reading Subreddits...',
    'Generating insights...',
    'Almost done...'
  ];

  /**
   * Handle analysis progress animation
   * Why this matters: Cycles through different status messages to show AI processing stages.
   */
  useEffect(() => {
    if (isAnalyzing) {
      setAnalysisStep(0);
      
      // Step timing: 3s, 3s, 5s, 5s, then stay on last message
      const stepTimings = [3000, 3000, 5000, 5000]; // milliseconds for each step
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

    try {
      // Single keyword only - no comma splitting needed
      const keywordList = [keywords.trim()];
      
      const request: WorkflowRequest = {
        keywords: keywordList,
        subreddits: [selectedSubreddit],
        limit: limit
      };

      console.log('🚀 Starting analysis workflow:', request);

      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/workflow/run-analysis`, {
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
      
      // Notify parent component
      onAnalysisComplete(data);
      
      // Mark analysis as completed
      setHasCompletedAnalysis(true);

    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Legacy function - no longer used, replaced by handleSubredditSelect

  return (
    <div className="analysis-interface">
      {/* Analysis Form */}
      <div className="interface-form">
        {/* Keywords Input */}
        <div className="form-group">
          <label htmlFor="keywords" className="form-label">
            Keyword <span style={{fontWeight: 'normal'}}>(single keyword only)</span>
          </label>
          
          {!isKeywordSelected ? (
            // Input mode - user is typing
            <div className="input-container">
              <Search className="input-icon" style={{transform: 'translateY(-0.1875rem)'}} />
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
                placeholder="e.g., leads"
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
                  border: '0.125rem solid #16a34a',
                  color: '#166534',
                  borderRadius: '0.625rem'
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
            className="apollo-btn-primary btn-large analysis-run-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
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
        </div>
      </div>
    </div>
  );
};

export default AnalysisInterface; 