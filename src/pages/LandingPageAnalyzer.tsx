import React, { useState, useEffect, useRef } from 'react';
import { Send, Monitor, TrendingUp, AlertCircle, CheckCircle, Loader2, ExternalLink, Copy, ZoomIn, ZoomOut, Play, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { buildApiUrl } from '../config/api';

// Types for our step-by-step workflow
type WorkflowStep = 'url-input' | 'screenshot-analysis' | 'content-extraction' | 'gong-analysis' | 'cro-recommendations';

interface StepData {
  url?: string;
  screenshot?: {
    imageData: string;
    pageTitle?: string;
  };
  extractedContent?: {
    title: string;
    headings: string[];
    bodyText: string;
    buttonTexts: string[];
    links: string[];
  };
  gongInsights?: {
    totalCallsAnalyzed: number;
    keyPainPoints: Array<{
      category: string;
      text: string;
      frequency: number;
      severity: string;
    }>;
    customerQuotes: string[];
    callSummaries: string[];
    missingTopics: string[];
  };
  croRecommendations?: any;
}

const LandingPageAnalyzer: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('url-input');
  const [stepData, setStepData] = useState<StepData>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  
  // URL input state
  const [url, setUrl] = useState('');
  
  // Screenshot zoom state
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  
  // Gong analysis state
  const [gongDaysBack, setGongDaysBack] = useState(7);
  const [gongLimit, setGongLimit] = useState(5);

  // Auto-save functionality state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Start over confirmation modal state
  const [showStartOverModal, setShowStartOverModal] = useState(false);

  /**
   * Load saved progress from localStorage on mount
   * Why this matters: Restores user's landing page analysis progress across page refreshes, preventing data loss.
   */
  useEffect(() => {
    const savedProgress = localStorage.getItem('apollo_landing_page_analyzer_progress');
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentStep(progress.currentStep || 'url-input');
        setStepData(progress.stepData || {});
        setUrl(progress.url || '');
        setGongDaysBack(progress.gongDaysBack || 7);
        setGongLimit(progress.gongLimit || 5);
        setIsImageZoomed(progress.isImageZoomed || false);
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }

    // After initial load, allow auto-save to work
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, []);

  /**
   * Auto-save progress to localStorage with debouncing
   * Why this matters: Prevents users from losing their analysis progress when the page refreshes or crashes.
   */
  useEffect(() => {
    // Skip auto-save if this is the initial load from localStorage
    if (isInitialLoadRef.current) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set auto-save status to saving
    setAutoSaveStatus('saving');

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      try {
        const progressData = {
          currentStep,
          stepData,
          url,
          gongDaysBack,
          gongLimit,
          isImageZoomed,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('apollo_landing_page_analyzer_progress', JSON.stringify(progressData));
        
        setAutoSaveStatus('saved');
        
        // Clear the "saved" status after 2 seconds
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('');
      }
    }, 1000); // Save after 1 second of inactivity

    setAutoSaveTimeout(timeout);

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [currentStep, stepData, url, gongDaysBack, gongLimit, isImageZoomed]);

  /**
   * Clear saved progress
   * Why this matters: Allows users to start fresh by clearing localStorage data.
   */
  const clearProgress = (): void => {
    localStorage.removeItem('apollo_landing_page_analyzer_progress');
    setCurrentStep('url-input');
    setStepData({});
    setUrl('');
    setGongDaysBack(7);
    setGongLimit(5);
    setIsImageZoomed(false);
    setError(null);
  };

  /**
   * Show confirmation modal for starting over
   * Why this matters: Provides a safety check before clearing all landing page analysis progress
   */
  const showStartOverConfirmation = (): void => {
    setShowStartOverModal(true);
  };

  /**
   * Clear progress after confirmation
   * Why this matters: Performs the actual clearing after user confirms they want to start over
   */
  const confirmStartOver = (): void => {
    clearProgress();
    setShowStartOverModal(false);
  };

  /**
   * Cancel the start over action
   * Why this matters: Allows users to back out of the destructive action
   */
  const cancelStartOver = (): void => {
    setShowStartOverModal(false);
  };

  /**
   * Validate URL format
   * Why this matters: Ensures users enter valid URLs before we attempt analysis
   */
  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  /**
   * Copy content to clipboard with visual feedback
   * Why this matters: Allows users to easily copy generated content for immediate use
   */
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [type]: true });
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  /**
   * Get the step order for navigation
   * Why this matters: Defines the sequence of steps for next/previous navigation
   */
  const getStepOrder = (): WorkflowStep[] => {
    return ['url-input', 'screenshot-analysis', 'content-extraction', 'gong-analysis', 'cro-recommendations'];
  };

  /**
   * Navigate to the next step and execute its action
   * Why this matters: Allows users to progress through the workflow by executing the actual step actions
   */
  const goToNextStep = () => {
    switch (currentStep) {
      case 'url-input':
        // Should not happen since Step 1 has no Next button
        break;
      case 'screenshot-analysis':
        handleStep2_ContentExtraction();
        break;
      case 'content-extraction':
        setCurrentStep('gong-analysis');
        break;
      case 'gong-analysis':
        // Check if we have Gong insights already - if so, proceed to CRO recommendations
        if (stepData.gongInsights) {
          handleStep4_CRORecommendations();
        } else {
          handleStep3_GongAnalysis();
        }
        break;
      case 'cro-recommendations':
        // Last step, no next action
        break;
    }
  };

  /**
   * Navigate to the previous step
   * Why this matters: Allows users to go back and review or modify previous steps
   */
  const goToPreviousStep = () => {
    const steps = getStepOrder();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  /**
   * Check if user can proceed to next step
   * Why this matters: Validates that required data exists before allowing the next step action to execute
   */
  const canGoToNextStep = (): boolean => {
    switch (currentStep) {
      case 'url-input':
        return false; // No next button on Step 1, use Capture Screenshot instead
      case 'screenshot-analysis':
        return !!stepData.screenshot && !isProcessing;
      case 'content-extraction':
        return !isProcessing; // Allow navigation to Gong analysis even if extraction failed
      case 'gong-analysis':
        return !isProcessing; // Can always try to run Gong analysis or proceed to CRO recommendations
      case 'cro-recommendations':
        return false; // Last step, no next
      default:
        return false;
    }
  };

  /**
   * Check if user can go to previous step
   * Why this matters: Determines if Previous button should be shown
   */
  const canGoToPreviousStep = (): boolean => {
    const steps = getStepOrder();
    return steps.indexOf(currentStep) > 0;
  };

  /**
   * Step 1: Capture screenshot and move to next step
   * Why this matters: Visual analysis is critical for CRO - managers need to see layout and design
   */
  const handleStep1_Screenshot = async () => {
    if (!url.trim() || !isValidUrl(url)) {
      setError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/api/gong-analysis/analyze-landing-page'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          callInsights: [] // No insights needed for screenshot step
        }),
      });

      if (!response.ok) {
        throw new Error(`Screenshot failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update step data with screenshot and URL
      setStepData(prev => ({
        ...prev,
        url: url.trim(),
        screenshot: {
          imageData: data.result.screenshot.imageData,
          pageTitle: data.result.screenshot.pageTitle
        }
      }));

      // Move to next step
      setCurrentStep('screenshot-analysis');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Screenshot capture failed');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Step 2: Extract and display page content, then move to next step
   * Why this matters: CRO managers need to see structured content to understand what needs optimization
   */
  const handleStep2_ContentExtraction = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/api/gong-analysis/analyze-landing-page'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: stepData.url,
          callInsights: []
        }),
      });

      if (!response.ok) {
        throw new Error(`Content extraction failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update step data with extracted content
      setStepData(prev => ({
        ...prev,
        extractedContent: data.result.extractedContent
      }));

      // Stay on Step 3 to show extracted content results
      setCurrentStep('content-extraction');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Content extraction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Step 4: Analyze Gong calls for customer insights (first part - fetch insights only)
   * Why this matters: Real customer language and pain points are essential for effective CRO
   */
  const handleStep3_GongAnalysis = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // First fetch Gong calls
      const gongResponse = await fetch(buildApiUrl('/api/gong-analysis/fetch-calls'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daysBack: gongDaysBack,
          limit: gongLimit
        }),
      });

      if (!gongResponse.ok) {
        throw new Error(`Gong analysis failed: ${gongResponse.statusText}`);
      }

      const gongData = await gongResponse.json();
      
      // Now run analysis to get Gong insights (without full CRO analysis yet)
      const analysisResponse = await fetch(buildApiUrl('/api/gong-analysis/analyze-landing-page'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: stepData.url,
          callInsights: gongData.calls || []
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error(`Gong insights analysis failed: ${analysisResponse.statusText}`);
      }

      const analysisData = await analysisResponse.json();
      
      // Update step data with ONLY Gong insights (stay on gong-analysis step to show results)
      setStepData(prev => ({
        ...prev,
        gongInsights: analysisData.result.gongInsights
      }));

      // Stay on gong-analysis step to show insights results (similar to content extraction)
      // User will need to click Next to proceed to CRO recommendations
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gong insights analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Step 4 (Part 2): Generate final CRO recommendations using Gong insights
   * Why this matters: Combines landing page analysis with customer insights for targeted CRO recommendations
   */
  const handleStep4_CRORecommendations = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Use existing Gong insights to generate full CRO recommendations
      const analysisResponse = await fetch(buildApiUrl('/api/gong-analysis/analyze-landing-page'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: stepData.url,
          callInsights: [] // We already have gongInsights, just need CRO analysis
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error(`CRO recommendations failed: ${analysisResponse.statusText}`);
      }

      const analysisData = await analysisResponse.json();
      
      // Update step data with CRO recommendations
      setStepData(prev => ({
        ...prev,
        croRecommendations: analysisData.result.croRecommendations
      }));

      // Move to final step
      setCurrentStep('cro-recommendations');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CRO recommendations failed');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Reset the entire workflow
   * Why this matters: Allows users to start fresh with a new landing page analysis
   */
  const resetWorkflow = () => {
    setCurrentStep('url-input');
    setStepData({});
    setUrl('');
    setError(null);
    setIsImageZoomed(false);
  };

  /**
   * Get the appropriate Next button text based on current step and processing state
   * Why this matters: Shows users exactly what action will happen and current processing status
   */
  const getNextButtonText = (): string => {
    if (isProcessing) {
      switch (currentStep) {
        case 'screenshot-analysis':
          return 'Extracting Content...';
        case 'gong-analysis':
          return stepData.gongInsights ? 'Generating CRO Recommendations...' : 'Analyzing Gong Calls...';
        default:
          return 'Processing...';
      }
    }
    
    switch (currentStep) {
      case 'screenshot-analysis':
        return 'Extract Content →';
      case 'content-extraction':
        return 'Next →';
      case 'gong-analysis':
        return stepData.gongInsights ? 'Generate CRO Recommendations →' : 'Get Gong Insights →';
      default:
        return 'Next →';
    }
  };

  /**
   * Check if Next button should be visible for current step
   * Why this matters: Determines which steps have next actions available
   */
  const shouldShowNextButton = (): boolean => {
    return currentStep !== 'url-input' && currentStep !== 'cro-recommendations';
  };

  /**
   * Render navigation buttons for step workflow
   * Why this matters: Provides consistent navigation across all steps for better user experience
   */
  const renderNavigationButtons = () => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <div>
          {canGoToPreviousStep() && (
            <button
              onClick={goToPreviousStep}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              ← Previous
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {currentStep !== 'url-input' && (
            <button
              onClick={showStartOverConfirmation}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
            >
              Start Over
            </button>
          )}

          {shouldShowNextButton() && (
            <button
              onClick={goToNextStep}
              disabled={isProcessing || !canGoToNextStep()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: isProcessing || !canGoToNextStep() ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isProcessing || !canGoToNextStep() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isProcessing || !canGoToNextStep() ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!isProcessing && canGoToNextStep()) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
              onMouseOut={(e) => {
                if (!isProcessing && canGoToNextStep()) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }
              }}
                          >
              {isProcessing && (
                <div className="animate-spin" style={{ width: '1rem', height: '1rem', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
              )}
              {getNextButtonText()}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Auto-save status indicator */}
      {autoSaveStatus && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          color: autoSaveStatus === 'saving' ? '#6b7280' : '#10b981',
          fontSize: '0.875rem',
          fontWeight: '500',
          pointerEvents: 'none'
        }}>
          {autoSaveStatus === 'saving' ? (
            <>
              <Clock className="animate-spin" style={{ width: '0.75rem', height: '0.75rem' }} />
              Auto-saving progress...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              Progress auto-saved
            </>
          )}
        </div>
      )}

      <div className="app-content" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
            What URL do you want to analyze?
          </h1>
        </div>

        {/* Progress Indicator */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '3rem',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '1rem',
          border: '1px solid #e5e7eb'
        }}>
          {[
            { key: 'url-input', label: 'Enter URL', icon: Monitor },
            { key: 'screenshot-analysis', label: 'Screenshot', icon: ZoomIn },
            { key: 'content-extraction', label: 'Extract Content', icon: TrendingUp },
            { key: 'gong-analysis', label: 'Gong Insights', icon: TrendingUp },
            { key: 'cro-recommendations', label: 'CRO Recommendations', icon: CheckCircle }
          ].map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.key;
            const isCompleted = ['url-input', 'screenshot-analysis', 'content-extraction', 'gong-analysis'].indexOf(currentStep) > 
                               ['url-input', 'screenshot-analysis', 'content-extraction', 'gong-analysis'].indexOf(step.key);
            
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#10b981' : isActive ? '#EBF212' : '#f3f4f6',
                  color: isCompleted ? 'white' : isActive ? '#000' : '#9ca3af',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  {isCompleted ? <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} /> : index + 1}
                </div>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: isActive ? '600' : '500',
                  color: isCompleted ? '#10b981' : isActive ? '#000' : '#6b7280' 
                }}>
                  {step.label}
                </span>
                {index < 4 && (
                  <div style={{ 
                    width: '2rem', 
                    height: '2px', 
                    backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
                    marginLeft: '0.5rem'
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation Buttons - Only show for steps other than url-input */}
        {currentStep !== 'url-input' && (
          <div style={{ marginBottom: '2rem' }}>
            {renderNavigationButtons()}
          </div>
        )}

        {/* Chat-Style Step Interface */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '1rem', 
          border: '1px solid #e5e7eb', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          minHeight: '600px'
        }}>
          {/* Step 1: URL Input */}
          {currentStep === 'url-input' && (
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                  Step 1: Enter a Landing Page URL
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                  Let's capture a full-page screenshot of the landing page for analysis.
                </p>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                marginBottom: '2rem'
              }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    Landing Page URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleStep1_Screenshot()}
                    placeholder="https://example.com/landing-page"
                    disabled={isProcessing}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      backgroundColor: isProcessing ? '#f9fafb' : 'white'
                    }}
                  />
                </div>
                
                <button
                  onClick={handleStep1_Screenshot}
                  disabled={isProcessing || !url.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 1.5rem',
                    backgroundColor: isProcessing || !url.trim() ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isProcessing || !url.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Monitor style={{ width: '1rem', height: '1rem' }} />
                      Capture Screenshot
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div style={{ 
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
                  <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Screenshot Analysis */}
          {currentStep === 'screenshot-analysis' && stepData.screenshot && (
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                  Step 2: Screenshot Analysis
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                  Here's your landing page. Click the image to zoom in and examine design elements closely.
                </p>
              </div>

              {/* Screenshot with zoom functionality */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                    {stepData.screenshot.pageTitle || 'Page Screenshot'}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setIsImageZoomed(!isImageZoomed)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {isImageZoomed ? <ZoomOut style={{ width: '1rem', height: '1rem' }} /> : <ZoomIn style={{ width: '1rem', height: '1rem' }} />}
                      {isImageZoomed ? 'Zoom Out' : 'Zoom In'}
                    </button>
                    <a 
                      href={stepData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: '#3b82f6', 
                        textDecoration: 'none', 
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                      View Live Page
                    </a>
                  </div>
                </div>
                
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.5rem', 
                  overflow: 'hidden',
                  backgroundColor: '#f9fafb',
                  cursor: isImageZoomed ? 'zoom-out' : 'zoom-in'
                }}>
                  <img 
                    src={`data:image/png;base64,${stepData.screenshot.imageData}`} 
                    alt="Landing page screenshot" 
                    onClick={() => setIsImageZoomed(!isImageZoomed)}
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      display: 'block',
                      maxHeight: isImageZoomed ? 'none' : '500px',
                      objectFit: isImageZoomed ? 'contain' : 'cover',
                      transition: 'all 0.3s ease'
                    }} 
                  />
                </div>
              </div>

                             <div style={{ display: 'flex', justifyContent: 'center' }}>
                 <button
                   onClick={handleStep2_ContentExtraction}
                   disabled={isProcessing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 2rem',
                    backgroundColor: isProcessing ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" />
                      Extracting Content...
                    </>
                  ) : (
                    <>
                      <TrendingUp style={{ width: '1rem', height: '1rem' }} />
                      Extract Page Content
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* Step 3: Content Extraction Display */}
          {currentStep === 'content-extraction' && stepData.extractedContent && (
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                  Step 3: Extracted Page Content
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                  Here's the structured content from your landing page. Review the key elements before we analyze Gong insights.
                </p>
              </div>

              {/* Content Display - Improved Organization */}
              <div style={{ marginBottom: '2rem', display: 'grid', gap: '1.5rem' }}>
                {/* Main Headline */}
                <div style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#fefbf3', 
                  border: '1px solid #f59e0b', 
                  borderRadius: '0.75rem',
                  borderLeft: '4px solid #f59e0b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#92400e', margin: 0 }}>
                      📄 Main Headline
                    </h4>
                  </div>
                  <p style={{ color: '#1a1a1a', fontSize: '1.25rem', fontWeight: '600', margin: 0, lineHeight: '1.6' }}>
                    {stepData.extractedContent.title || 'No title found'}
                  </p>
                </div>

                {/* Headings Structure */}
                {stepData.extractedContent.headings.length > 0 && (
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: '#f0f9ff', 
                    border: '1px solid #0ea5e9', 
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #0ea5e9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0c4a6e', margin: 0 }}>
                        📋 Content Subheadlines ({stepData.extractedContent.headings.length})
                      </h4>
                      <button
                        onClick={() => copyToClipboard(stepData.extractedContent!.headings.join('\n'), 'headings')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#0ea5e9',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy style={{ width: '0.875rem', height: '0.875rem' }} />
                        {copiedStates['headings'] ? 'Copied!' : 'Copy All'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {stepData.extractedContent.headings.slice(0, 15).map((heading, index) => (
                        <div key={index} style={{ 
                          padding: '0.75rem',
                          backgroundColor: 'white',
                          border: '1px solid #e0f2fe',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem'
                        }}>
                          <span style={{ 
                            color: '#0ea5e9', 
                            fontSize: '0.875rem', 
                            fontWeight: '600',
                            minWidth: '1.5rem',
                            height: '1.5rem',
                            backgroundColor: '#e0f2fe',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {index + 1}
                          </span>
                          <span style={{ color: '#374151', fontSize: '1rem', lineHeight: '1.5' }}>{heading}</span>
                        </div>
                      ))}
                      {stepData.extractedContent.headings.length > 15 && (
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                          ... and {stepData.extractedContent.headings.length - 15} more headings
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Call-to-Action Buttons */}
                {stepData.extractedContent.buttonTexts.length > 0 && (
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #f59e0b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#92400e', margin: 0, marginBottom: '0.25rem' }}>
                          🔥 Call-to-Action Buttons ({stepData.extractedContent.buttonTexts.length})
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0, opacity: 0.8 }}>
                          Primary action buttons (not navigation links)
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(stepData.extractedContent!.buttonTexts.join('\n'), 'buttons')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy style={{ width: '0.875rem', height: '0.875rem' }} />
                        {copiedStates['buttons'] ? 'Copied!' : 'Copy All'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {stepData.extractedContent.buttonTexts.map((button, index) => (
                        <span key={index} style={{ 
                          padding: '0.5rem 1rem', 
                          backgroundColor: '#92400e', 
                          color: 'white', 
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ 
                            width: '0.5rem', 
                            height: '0.5rem', 
                            backgroundColor: '#fbbf24', 
                            borderRadius: '50%' 
                          }} />
                          {button}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                {stepData.extractedContent.links.length > 0 && (
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #22c55e', 
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #22c55e'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#166534', margin: 0, marginBottom: '0.25rem' }}>
                          🔗 Navigation Links ({stepData.extractedContent.links.slice(0, 10).length})
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: '#166534', margin: 0, opacity: 0.8 }}>
                          Internal navigation and informational links
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {stepData.extractedContent.links.slice(0, 10).map((link, index) => (
                        <div key={index} style={{ 
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'white',
                          border: '1px solid #dcfce7',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                          wordBreak: 'break-all'
                        }}>
                          {link}
                        </div>
                      ))}
                      {stepData.extractedContent.links.length > 10 && (
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                          ... and {stepData.extractedContent.links.length - 10} more links
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Body Content Preview */}
                <div style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #64748b', 
                  borderRadius: '0.75rem',
                  borderLeft: '4px solid #64748b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#334155', margin: 0 }}>
                      📝 Body Content Preview
                    </h4>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b',
                      backgroundColor: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      {stepData.extractedContent.bodyText.length} characters
                    </span>
                  </div>
                  <div style={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
                      {stepData.extractedContent.bodyText.substring(0, 500)}
                      {stepData.extractedContent.bodyText.length > 500 && (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          ... ({stepData.extractedContent.bodyText.length - 500} more characters)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              

             </div>
           )}

          {/* Step 4: Gong Analysis Interface */}
          {currentStep === 'gong-analysis' && !stepData.gongInsights && (
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                  Step 4: Gong Insights Analysis
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                  Now we'll get insights from recent sales calls to understand customer language, pain points, and needs.
                  This will inform our CRO recommendations.
                </p>
              </div>

              {/* Gong Analysis Form */}
              <div style={{ marginBottom: '2rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    Time Period
                  </label>
                  <select
                    value={gongDaysBack}
                    onChange={(e) => setGongDaysBack(parseInt(e.target.value))}
                    disabled={isProcessing}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: isProcessing ? '#f9fafb' : 'white'
                    }}
                  >
                    <option value={3}>Last 3 days</option>
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 2 weeks</option>
                    <option value={30}>Last 30 days</option>
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    Number of Calls
                  </label>
                  <select
                    value={gongLimit}
                    onChange={(e) => setGongLimit(parseInt(e.target.value))}
                    disabled={isProcessing}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: isProcessing ? '#f9fafb' : 'white'
                    }}
                  >
                    <option value={3}>3 calls</option>
                    <option value={5}>5 calls</option>
                    <option value={10}>10 calls</option>
                    <option value={15}>15 calls</option>
                  </select>
                </div>
              </div>

              {error && (
                <div style={{ 
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <AlertCircle style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
                  <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleStep3_GongAnalysis}
                  disabled={isProcessing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 2rem',
                    backgroundColor: isProcessing ? '#9ca3af' : '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" />
                      Analyzing Calls...
                    </>
                  ) : (
                    <>
                      <Play style={{ width: '1rem', height: '1rem' }} />
                      Get Gong Insights
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* Step 4: Gong Insights Results Display */}
          {currentStep === 'gong-analysis' && stepData.gongInsights && (
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                  Step 4: Gong Insights Analysis Results
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                  Here are the customer insights from recent sales calls. Review these findings before we generate CRO recommendations.
                </p>
              </div>

              {/* Gong Insights Display */}
              <div style={{ marginBottom: '2rem', display: 'grid', gap: '1.5rem' }}>
                {/* Summary Card */}
                <div style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#f0f9ff', 
                  border: '1px solid #0ea5e9', 
                  borderRadius: '0.75rem',
                  borderLeft: '4px solid #0ea5e9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0c4a6e', margin: 0 }}>
                      📊 Analysis Summary
                    </h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0ea5e9' }}>
                        {stepData.gongInsights.totalCallsAnalyzed}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                        Calls Analyzed
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0ea5e9' }}>
                        {stepData.gongInsights.keyPainPoints?.length || 0}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                        Pain Points
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0ea5e9' }}>
                        {stepData.gongInsights.customerQuotes?.length || 0}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                        Key Quotes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pain Points */}
                {stepData.gongInsights.keyPainPoints && stepData.gongInsights.keyPainPoints.length > 0 && (
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #f59e0b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#92400e', margin: 0 }}>
                        🎯 Key Customer Pain Points ({stepData.gongInsights.keyPainPoints.length})
                      </h4>
                      <button
                        onClick={() => copyToClipboard(
                          stepData.gongInsights!.keyPainPoints.map(p => `${p.category}: ${p.text}`).join('\n'), 
                          'painPoints'
                        )}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy style={{ width: '0.875rem', height: '0.875rem' }} />
                        {copiedStates['painPoints'] ? 'Copied!' : 'Copy All'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {stepData.gongInsights.keyPainPoints.slice(0, 10).map((painPoint, index) => (
                        <div key={index} style={{ 
                          padding: '1rem',
                          backgroundColor: 'white',
                          border: '1px solid #fed7aa',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          gap: '1rem',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{
                            minWidth: '1.5rem',
                            height: '1.5rem',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {index + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '600', 
                                color: '#92400e',
                                backgroundColor: '#fed7aa',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem'
                              }}>
                                {painPoint.category.replace('_', ' ').toUpperCase()}
                              </span>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                color: painPoint.severity === 'high' ? '#dc2626' : painPoint.severity === 'medium' ? '#f59e0b' : '#10b981',
                                fontWeight: '600'
                              }}>
                                {painPoint.severity.toUpperCase()} SEVERITY
                              </span>
                            </div>
                            <p style={{ color: '#374151', lineHeight: '1.6', fontSize: '0.95rem', margin: 0 }}>
                              {painPoint.text}
                            </p>
                          </div>
                        </div>
                      ))}
                      {stepData.gongInsights.keyPainPoints.length > 10 && (
                        <p style={{ color: '#92400e', fontSize: '0.875rem', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                          ... and {stepData.gongInsights.keyPainPoints.length - 10} more pain points
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Quotes */}
                {stepData.gongInsights.customerQuotes && stepData.gongInsights.customerQuotes.length > 0 && (
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #22c55e', 
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #22c55e'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#166534', margin: 0 }}>
                        💬 Key Customer Quotes ({stepData.gongInsights.customerQuotes.length})
                      </h4>
                      <button
                        onClick={() => copyToClipboard(stepData.gongInsights!.customerQuotes.join('\n\n'), 'quotes')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy style={{ width: '0.875rem', height: '0.875rem' }} />
                        {copiedStates['quotes'] ? 'Copied!' : 'Copy All'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {stepData.gongInsights.customerQuotes.slice(0, 6).map((quote, index) => (
                        <div key={index} style={{ 
                          padding: '1rem',
                          backgroundColor: 'white',
                          border: '1px solid #dcfce7',
                          borderRadius: '0.5rem',
                          borderLeft: '4px solid #22c55e'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <div style={{ 
                              fontSize: '1.5rem', 
                              color: '#22c55e', 
                              lineHeight: '1',
                              fontWeight: '700'
                            }}>
                              "
                            </div>
                            <p style={{ 
                              color: '#374151', 
                              lineHeight: '1.6', 
                              fontSize: '0.95rem', 
                              margin: 0, 
                              fontStyle: 'italic',
                              flex: 1
                            }}>
                              {quote}
                            </p>
                            <div style={{ 
                              fontSize: '1.5rem', 
                              color: '#22c55e', 
                              lineHeight: '1',
                              fontWeight: '700',
                              transform: 'rotate(180deg)'
                            }}>
                              "
                            </div>
                          </div>
                        </div>
                      ))}
                      {stepData.gongInsights.customerQuotes.length > 6 && (
                        <p style={{ color: '#166534', fontSize: '0.875rem', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                          ... and {stepData.gongInsights.customerQuotes.length - 6} more customer quotes
                        </p>
                      )}
                    </div>
                  </div>
                )}

                

                {/* No Insights State */}
                {stepData.gongInsights.totalCallsAnalyzed === 0 && (
                  <div style={{ 
                    padding: '2rem', 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📞</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      No Recent Calls Found
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '1rem', margin: '0 auto', maxWidth: '400px' }}>
                      We couldn't find any recent Gong calls in the specified time period. CRO recommendations will be based on landing page analysis and general best practices.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Step 5: Final CRO Recommendations */}
          {currentStep === 'cro-recommendations' && stepData.gongInsights && stepData.croRecommendations && (
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                  Step 5: CRO Recommendations
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                  Complete analysis of your landing page with detailed breakdowns, Gong call insights, and comprehensive CRO recommendations.
                </p>
              </div>

              {/* Gong Insights Summary */}
              {stepData.gongInsights.totalCallsAnalyzed > 0 ? (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                    📊 Customer Insights from {stepData.gongInsights.totalCallsAnalyzed} Sales Calls
                  </h3>
                  
                  {stepData.gongInsights.keyPainPoints.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        Top Pain Points:
                      </h4>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {stepData.gongInsights.keyPainPoints.slice(0, 3).map((painPoint, index) => (
                          <div key={index} style={{ 
                            padding: '0.5rem',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #f59e0b',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem'
                          }}>
                            <strong>{painPoint.category.replace('_', ' ')}:</strong> {painPoint.text.substring(0, 80)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>
                    No recent Gong calls available. Recommendations are based on general CRO best practices.
                  </p>
                </div>
              )}

              {/* Comprehensive Analysis Overview */}
              <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Landing Page Overview */}
                <div style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#fefbf3', 
                  border: '1px solid #f59e0b', 
                  borderRadius: '0.75rem',
                  borderLeft: '4px solid #f59e0b'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#92400e', marginBottom: '1rem' }}>
                    📄 Landing Page Summary
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #fed7aa' }}>
                      <span style={{ color: '#92400e', fontWeight: '600' }}>Page URL:</span>
                      <a href={stepData.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}>
                        {stepData.url}
                      </a>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #fed7aa' }}>
                      <span style={{ color: '#92400e', fontWeight: '600' }}>Main Headline:</span>
                      <span style={{ color: '#374151', fontSize: '0.875rem' }}>{stepData.extractedContent?.title || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #fed7aa' }}>
                      <span style={{ color: '#92400e', fontWeight: '600' }}>Content Sections:</span>
                      <span style={{ color: '#374151', fontSize: '0.875rem' }}>{stepData.extractedContent?.headings.length || 0} headings</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                      <span style={{ color: '#92400e', fontWeight: '600' }}>Call-to-Actions:</span>
                      <span style={{ color: '#374151', fontSize: '0.875rem' }}>{stepData.extractedContent?.buttonTexts.length || 0} buttons</span>
                    </div>
                  </div>
                </div>

                {/* Content Analysis Summary */}
                <div style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#f0f9ff', 
                  border: '1px solid #0ea5e9', 
                  borderRadius: '0.75rem',
                  borderLeft: '4px solid #0ea5e9'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0c4a6e', marginBottom: '1rem' }}>
                    📋 Content Structure Analysis
                  </h3>
                  {stepData.extractedContent && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#0c4a6e', marginBottom: '0.5rem' }}>Key Subheadlines:</h4>
                        <div style={{ display: 'grid', gap: '0.25rem' }}>
                          {stepData.extractedContent.headings.slice(0, 5).map((heading, index) => (
                            <span key={index} style={{ color: '#374151', fontSize: '0.875rem', padding: '0.25rem 0' }}>
                              • {heading}
                            </span>
                          ))}
                          {stepData.extractedContent.headings.length > 5 && (
                            <span style={{ color: '#6b7280', fontSize: '0.875rem', fontStyle: 'italic' }}>
                              ...and {stepData.extractedContent.headings.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#0c4a6e', marginBottom: '0.5rem' }}>Primary CTAs:</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {stepData.extractedContent.buttonTexts.map((button, index) => (
                            <span key={index} style={{ 
                              padding: '0.25rem 0.5rem', 
                              backgroundColor: '#0ea5e9', 
                              color: 'white', 
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem'
                            }}>
                              {button}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gong Insights Analysis */}
                {stepData.gongInsights.totalCallsAnalyzed > 0 ? (
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #22c55e', 
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #22c55e'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#166534', marginBottom: '1rem' }}>
                      🎯 Gong Call Insights ({stepData.gongInsights.totalCallsAnalyzed} calls analyzed)
                    </h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {stepData.gongInsights.keyPainPoints.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#166534', marginBottom: '0.5rem' }}>Top Customer Pain Points:</h4>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {stepData.gongInsights.keyPainPoints.slice(0, 5).map((painPoint, index) => (
                              <div key={index} style={{ 
                                padding: '0.75rem',
                                backgroundColor: 'white',
                                border: '1px solid #dcfce7',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                              }}>
                                <span style={{ color: '#166534', fontWeight: '600' }}>
                                  {painPoint.category.replace('_', ' ')}:
                                </span>
                                <span style={{ color: '#374151', marginLeft: '0.5rem' }}>
                                  {painPoint.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {stepData.gongInsights.customerQuotes && stepData.gongInsights.customerQuotes.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#166534', marginBottom: '0.5rem' }}>Key Customer Quotes:</h4>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {stepData.gongInsights.customerQuotes.slice(0, 3).map((quote, index) => (
                              <div key={index} style={{ 
                                padding: '0.75rem',
                                backgroundColor: 'white',
                                border: '1px solid #dcfce7',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontStyle: 'italic',
                                color: '#374151'
                              }}>
                                "{quote}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.75rem'
                  }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                      📞 Gong Call Analysis
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                      No recent Gong calls available. CRO recommendations are based on landing page analysis and general best practices.
                    </p>
                  </div>
                )}

                {/* Comprehensive CRO Recommendations */}
                {stepData.croRecommendations.conversionOptimizations.length > 0 && (
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #f59e0b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#92400e', margin: 0 }}>
                        🚀 Comprehensive CRO Recommendations
                      </h3>
                      <button
                        onClick={() => copyToClipboard(stepData.croRecommendations.conversionOptimizations.join('\n\n'), 'optimizations')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy style={{ width: '0.875rem', height: '0.875rem' }} />
                        {copiedStates['optimizations'] ? 'Copied!' : 'Copy All'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {stepData.croRecommendations.conversionOptimizations.map((recommendation: string, index: number) => (
                        <div key={index} style={{ 
                          padding: '1rem',
                          backgroundColor: 'white',
                          border: '1px solid #fed7aa',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          gap: '1rem',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{
                            minWidth: '1.5rem',
                            height: '1.5rem',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {index + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: '#374151', lineHeight: '1.6', fontSize: '0.95rem' }}>
                              {recommendation}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ 
                marginTop: '2rem', 
                padding: '1.5rem', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                  Ready to Optimize Your Landing Page?
                </h4>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={resetWorkflow}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#EBF212',
                      color: '#000',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Analyze Another Page
                  </button>
                  <a 
                    href={stepData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                    View Original Page
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showStartOverModal && (
        <div className={`confirmation-modal-backdrop ${showStartOverModal ? 'open' : ''}`}>
          <div className={`confirmation-modal ${showStartOverModal ? 'open' : ''}`}>
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                <AlertTriangle style={{width: '1.5rem', height: '1.5rem'}} />
              </div>
              <h3 className="confirmation-modal-title">Start Over?</h3>
              <p className="confirmation-modal-message">
                This action will clear all your current landing page analysis progress including URL, screenshots, extracted content, and Gong insights. This cannot be undone.
              </p>
            </div>
            <div className="confirmation-modal-actions">
              <button
                onClick={cancelStartOver}
                className="confirmation-modal-btn confirmation-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartOver}
                className="confirmation-modal-btn confirmation-modal-btn-confirm"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPageAnalyzer; 