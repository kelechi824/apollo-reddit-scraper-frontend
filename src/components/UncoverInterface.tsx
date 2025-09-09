import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, AlertCircle, Clock } from 'lucide-react';
import { UncoverWorkflowRequest, UncoverWorkflowResponse, UncoverCategory, UncoverCommunity } from '../types';
import { makeApiRequest } from '../utils/apiHelpers';
import { StorageManager } from '../utils/StorageManager';

interface UncoverInterfaceProps {
  apiUrl: string;
  onAnalysisComplete: (results: UncoverWorkflowResponse) => void;
  onClearResults?: () => void;
  onAnalysisStart?: () => void;
  onAnalysisError?: () => void;
}

const UncoverInterface: React.FC<UncoverInterfaceProps> = ({ 
  apiUrl, 
  onAnalysisComplete, 
  onClearResults, 
  onAnalysisStart, 
  onAnalysisError 
}) => {
  const [selectedCommunity, setSelectedCommunity] = useState<string>('b2b_sales');
  const [selectedCategory, setSelectedCategory] = useState<UncoverCategory>('solution_request');
  const [limit, setLimit] = useState<number>(5);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'recent' | 'older'>('recent');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState<boolean>(false);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Available communities - organized by business function
  const availableCommunities: UncoverCommunity[] = [
    {
      id: 'b2b_sales',
      name: 'B2B Sales',
      description: 'Sales professionals, techniques, and business development',
      subreddits: [
        'sales', 'techsales', 'salestechniques', 'b2b_sales', 'salesdevelopment'
      ]
    },
    {
      id: 'crm',
      name: 'CRM',
      description: 'Customer Relationship Management systems and tools',
      subreddits: [
        'crm', 'CRMSoftware', 'hubspot', 'salesforce', 'Zoho', 'gohighlevel', 'GoHighLevelCRM'
      ]
    },
    {
      id: 'prospecting_leadgen',
      name: 'Prospecting & Lead Gen',
      description: 'Lead generation, prospecting, and outreach strategies',
      subreddits: [
        'prospecting', 'coldemail', 'coldcalling', 'salestechniques', 'leadgeneration', 'leadgen'
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Digital marketing, automation, and growth strategies',
      subreddits: [
        'coldemail', 'emailmarketing', 'leadgeneration', 'leadgen', 'marketingautomation', 
        'b2bmarketing', 'marketing', 'marketingmentor', 'marketingresearch', 'seo', 
        'digitalmarketing', 'growthhacking'
      ]
    },
    {
      id: 'artificial_intelligence',
      name: 'Artificial Intelligence',
      description: 'AI tools, agents, and automation platforms',
      subreddits: [
        'chatgpt', 'openai', 'anthropic', 'ai_agents', 'GeminiAI', 'GoogleGeminiAI'
      ]
    },
    {
      id: 'saas_general',
      name: 'SaaS (General)',
      description: 'Software as a Service platforms and strategies',
      subreddits: [
        'saas', 'b2bsaas', 'microsaas', 'SaaSMarketing', 'Cloud'
      ]
    },
    {
      id: 'saas_tools',
      name: 'SaaS (Tools)',
      description: 'Specific SaaS tools and platforms',
      subreddits: [
        'Notion', 'n8n', 'Slack', 'shopify', 'Klaviyo', 'hubspot', 'salesforce', 
        'Zoho', 'gohighlevel', 'GoHighLevelCRM', 'MailChimp'
      ]
    },
    {
      id: 'startups',
      name: 'Startups',
      description: 'Startup resources, ideas, and entrepreneurship',
      subreddits: [
        'startups', 'Startup_Ideas', 'startup_resources', 'Entrepreneur', 'Entrepreneurs', 
        'Entrepreneurship', 'shopify'
      ]
    }
  ];

  // Category options with descriptions
  const categoryOptions = [
    { 
      value: 'solution_request' as const, 
      label: 'Solution Request', 
      description: 'Posts of people asking for tools & solutions',
      icon: '🔧'
    },
    { 
      value: 'advice_request' as const, 
      label: 'Advice Request', 
      description: 'Posts of people asking for advice & resources',
      icon: '💡'
    },
    { 
      value: 'pain_anger' as const, 
      label: 'Pain & Anger', 
      description: 'People expressing pain & frustration',
      icon: '😤'
    },
    { 
      value: 'ideas' as const, 
      label: 'Ideas', 
      description: 'People suggesting ideas & sharing tips',
      icon: '💭'
    }
  ];

  // Time filter options for Reddit post recency
  const timeframeOptions = [
    { value: 'recent' as const, label: 'Recent Posts' },
    { value: 'older' as const, label: 'Older Posts' }
  ];

  // Analysis progress messages with timing
  const analysisMessages = [
    'Deploying AI Agent...',
    'Scanning Communities...',
    'Identifying Patterns...',
    'Analyzing comments...',
    'Categorizing Posts...',
    'Generating Insights...'
  ];

  /**
   * Handle analysis progress animation
   * Why this matters: Cycles through different status messages to show AI processing stages with realistic timing.
   */
  useEffect(() => {
    if (isAnalyzing) {
      setAnalysisStep(0);
      
      // Dynamic step timing based on number of posts being analyzed
      // Added 10s to each step + 20s extra to second-to-last step for better UX
      // Added extra 10s to "Scanning Communities" step for thorough processing
      const getStepTimings = (postCount: number) => {
        if (postCount === 3) {
          return [13000, 25000, 36000, 14000]; // 88s total for 3 posts (added extra 10s to step 2)
        } else if (postCount === 5) {
          return [14000, 28000, 40000, 16000]; // 98s total for 5 posts (added extra 10s to step 2)
        } else {
          return [15000, 30000, 42000, 18000]; // 105s total for 10 posts (added extra 10s to step 2)
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
  }, [isAnalyzing, analysisMessages.length, limit]);


  /**
   * Handle timeframe change
   * Why this matters: Clears results and resets state when user switches between Recent/Older posts
   */
  const handleTimeframeChange = (newTimeframe: 'recent' | 'older') => {
    console.log(`🔄 Timeframe changed from ${selectedTimeframe} to ${newTimeframe}`);
    setSelectedTimeframe(newTimeframe);
    setHasCompletedAnalysis(false);
    // Clear cached results
    localStorage.removeItem('apollo-uncover-results');
    console.log('🗑️ Cleared localStorage apollo-uncover-results');
    // Clear current results in parent component
    if (onClearResults) {
      console.log('🗑️ Calling onClearResults');
      onClearResults();
    } else {
      console.log('⚠️ onClearResults not available');
    }
  };

  /**
   * Handle form submission and run the complete uncover workflow with async polling
   * Why this matters: This starts the analysis and polls for completion to avoid timeout issues
   * in serverless environments while providing real-time progress updates.
   */
  const handleUncover = async () => {
    if (!selectedCommunity.trim()) {
      setError('Please select a community');
      return;
    }

    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    
    // Notify parent that analysis has started
    if (onAnalysisStart) {
      onAnalysisStart();
    }

    try {
      const request: UncoverWorkflowRequest = {
        community: selectedCommunity,
        category: selectedCategory,
        limit: limit,
        timeframe: selectedTimeframe
      };

      console.log('🚀 Starting uncover workflow:', request);
      console.log(`📊 Current selectedTimeframe state: ${selectedTimeframe}`);

      // Step 1: Start the workflow (returns immediately with workflow ID)
      const startUrl = `${apiUrl.replace(/\/$/, '')}/api/uncover/run-analysis`;
      console.log(`🚀 Starting uncover workflow at: ${startUrl}`);
      console.log(`📊 API URL being used: ${apiUrl}`);
      
      const startResult = await makeApiRequest<{workflow_id: string; status: string}>(
        startUrl,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      console.log(`📊 Start result:`, startResult);

      if (!startResult.success) {
        console.error(`❌ Failed to start workflow:`, startResult);
        throw new Error(startResult.error || startResult.message || 'Failed to start uncover analysis');
      }

      const workflowId = startResult.data!.workflow_id;
      console.log('📋 Uncover workflow started with ID:', workflowId);

      // Step 2: Poll for completion
      const pollForCompletion = async (): Promise<UncoverWorkflowResponse> => {
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
          
          const statusUrl = `${apiUrl.replace(/\/$/, '')}/api/uncover/status/${workflowId}`;
          console.log(`🔍 Polling uncover status at: ${statusUrl}`);
          
          const statusResult = await makeApiRequest<{
            workflow_id: string;
            status: 'pending' | 'running' | 'completed' | 'failed';
            progress: number;
            result?: UncoverWorkflowResponse;
            error?: string;
          }>(statusUrl);

          console.log(`📊 Status result:`, statusResult);

          if (!statusResult.success) {
            console.error(`❌ Status check failed:`, statusResult);
            throw new Error(`Failed to check uncover workflow status: ${statusResult.error || statusResult.message || 'Unknown error'}`);
          }

          const status = statusResult.data!;
          console.log(`📊 Uncover workflow ${workflowId} status:`, status.status, `(${status.progress}%)`);

          if (status.status === 'completed') {
            if (!status.result) {
              throw new Error('Uncover workflow completed but no results available');
            }
            return status.result;
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Uncover workflow failed');
          }
          
          // Continue polling for 'pending' or 'running' status
        }
      };

      const data = await pollForCompletion();
      
      console.log('✅ Uncover analysis complete:', data);
      
      // Save analysis to localStorage for history using StorageManager
      const analysis = {
        id: data.workflow_id,
        community: selectedCommunity,
        category: selectedCategory,
        timestamp: new Date().toISOString(),
        results: data,
        _full: true // Flag to indicate this is full data
      };
      
      // Note: We'll need to create a new method in StorageManager for uncover results
      // For now, we'll use a simple localStorage approach
      try {
        localStorage.setItem('apollo-uncover-results', JSON.stringify(analysis));
      } catch (error) {
        console.warn('Failed to save uncover analysis to localStorage:', error);
      }
      
      // Notify parent component
      onAnalysisComplete(data);
      
      // Mark analysis as completed
      setHasCompletedAnalysis(true);

    } catch (err) {
      console.error('❌ Uncover analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Uncover analysis failed');
      
      // Notify parent that analysis has stopped due to error
      if (onAnalysisError) {
        onAnalysisError();
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="analysis-interface-header">
      {/* Horizontal Uncover Form */}
      <div className="interface-form-horizontal">
        {/* Community Selection */}
        <div className="form-group-horizontal-inline">
          <label htmlFor="community" className="form-label-horizontal-inline">Community</label>
          <select
            id="community"
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="apollo-input-horizontal-dropdown category-dropdown-wide"
            disabled={isAnalyzing}
          >
            {availableCommunities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selection */}
        <div className="form-group-horizontal-inline">
          <label htmlFor="category" className="form-label-horizontal-inline">Category</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as UncoverCategory)}
            className="apollo-input-horizontal-dropdown category-dropdown-wide"
            disabled={isAnalyzing}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
              onClick={handleUncover}
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
                  {hasCompletedAnalysis ? 'Deploy Again' : 'Deploy AI Agent'}
                </>
              )}
            </button>
            
            {/* Estimated Time Display - to the right of button */}
            <div className="time-estimate-right-of-button">
              <p>
                Est. time: 3-5 mins
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

export default UncoverInterface;
