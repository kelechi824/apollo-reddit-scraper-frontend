import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, AlertCircle, Clock, CheckCircle, Wand2, ChevronDown, FileText, Sparkles, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlaybooksInterfaceProps {
  apiUrl: string;
  onPlaybookGenerate: (jobTitle: string, markdownData: string) => void;
}

const PlaybooksInterface: React.FC<PlaybooksInterfaceProps> = ({ apiUrl, onPlaybookGenerate }) => {
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');
  const [jobTitleSearch, setJobTitleSearch] = useState<string>('');
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState<boolean>(false);
  const [rawData, setRawData] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [conversionStage, setConversionStage] = useState<string>('');
  const [markdownData, setMarkdownData] = useState<string>('');
  const [hasConversionCompleted, setHasConversionCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showStartOverModal, setShowStartOverModal] = useState(false);
  
  const jobTitleDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Comprehensive job titles list - easily updateable
  const jobTitles = [
    'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CISO', 'CRO', 'CDO', 'CPO',
    'Founder', 'Co-Founder', 'President', 'Vice President', 
    'Director', 'Head of Sales', 'Head of Marketing', 'Head of Operations',
    'Sales Manager', 'Marketing Manager', 'Operations Manager', 'Product Manager',
    'Business Development Manager', 'Account Executive', 'Sales Development Representative',
    'Marketing Director', 'Sales Director', 'Operations Director', 'Product Director',
    'General Manager', 'Regional Manager', 'Country Manager', 'Division Manager',
    'Chief Revenue Officer', 'Chief Marketing Officer', 'Chief Technology Officer',
    'Chief Financial Officer', 'Chief Operating Officer', 'Chief Executive Officer',
    'VP of Sales', 'VP of Marketing', 'VP of Operations', 'VP of Product',
    'VP of Engineering', 'VP of Business Development', 'VP of Customer Success',
    'Senior Director', 'Senior Manager', 'Lead Developer', 'Team Lead',
    'Department Head', 'Practice Lead', 'Solution Architect', 'Principal Engineer'
  ];

  /**
   * Load saved progress from localStorage on mount
   * Why this matters: Restores user's playbook creation progress across page refreshes.
   */
  useEffect(() => {
    const savedProgress = localStorage.getItem('apollo_playbook_progress');
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setSelectedJobTitle(progress.selectedJobTitle || '');
        setRawData(progress.rawData || '');
        setMarkdownData(progress.markdownData || '');
        setHasConversionCompleted(progress.hasConversionCompleted || false);
        setCurrentStep(progress.currentStep || 1);
        setConversionStage(progress.conversionStage || '');
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
   * Why this matters: Prevents users from losing their work when the page refreshes or crashes.
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
          selectedJobTitle,
          rawData,
          markdownData,
          hasConversionCompleted,
          currentStep,
          conversionStage,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('apollo_playbook_progress', JSON.stringify(progressData));
        
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
  }, [selectedJobTitle, rawData, markdownData, hasConversionCompleted, currentStep, conversionStage]);

  /**
   * Filter job titles based on search term
   * Why this matters: Makes it easy to find specific job titles in a long list.
   */
  const getFilteredJobTitles = (): string[] => {
    if (!jobTitleSearch) return jobTitles;
    return jobTitles.filter(title => 
      title.toLowerCase().includes(jobTitleSearch.toLowerCase())
    );
  };

  /**
   * Handle job title selection
   * Why this matters: Sets the selected job title for progression validation.
   */
  const handleJobTitleSelect = (jobTitle: string): void => {
    setSelectedJobTitle(jobTitle);
    setJobTitleSearch('');
    setShowJobTitleDropdown(false);
    setError('');
    setHighlightedIndex(-1);
  };

  /**
   * Handle input changes for job title search
   * Why this matters: Enables real-time filtering and proper dropdown state management.
   */
  const handleJobTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setJobTitleSearch(value);
    setSelectedJobTitle('');
    setShowJobTitleDropdown(true);
    setHighlightedIndex(-1);
  };

  /**
   * Handle input focus
   * Why this matters: Opens dropdown when user focuses on the input.
   */
  const handleInputFocus = (): void => {
    setShowJobTitleDropdown(true);
  };

  /**
   * Handle keyboard navigation
   * Why this matters: Provides intuitive keyboard navigation for accessibility.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!showJobTitleDropdown) return;
    
    const filteredTitles = getFilteredJobTitles();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredTitles.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredTitles.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredTitles.length) {
          handleJobTitleSelect(filteredTitles[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowJobTitleDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  /**
   * Handle raw data changes
   * Why this matters: Updates raw data state for validation and auto-save.
   */
  const handleRawDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setRawData(e.target.value);
  };

  /**
   * Navigate to next step
   * Why this matters: Provides forward navigation with validation checks.
   */
  const handleNextStep = (): void => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Navigate to previous step
   * Why this matters: Provides backward navigation for step corrections.
   */
  const handlePreviousStep = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Check if next step is available
   * Why this matters: Validates required data before allowing progression.
   */
  const canGoToNextStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!selectedJobTitle;
      case 2:
        return !!rawData.trim();
      case 3:
        return hasConversionCompleted;
      default:
        return false;
    }
  };

  /**
   * Convert raw data to markdown
   * Why this matters: Processes user input through OpenAI to create structured markdown with staged progress feedback.
   */
  const convertToMarkdown = async (): Promise<void> => {
    if (!rawData.trim()) return;

    setIsConverting(true);
    setError('');
    setConversionProgress(0);
    setConversionStage('');

    // Define conversion stages with progress ranges and durations
    const stages = [
      { text: 'Analyzing raw data...', startProgress: 0, endProgress: 25, duration: 5500 },
      { text: 'Extracting key insights...', startProgress: 25, endProgress: 50, duration: 5500 },
      { text: 'Structuring content...', startProgress: 50, endProgress: 75, duration: 5500 },
      { text: 'Formatting markdown...', startProgress: 75, endProgress: 95, duration: 5500 },
      { text: 'Almost done...', startProgress: 95, endProgress: 99, duration: 5500 }
    ];

    let currentStageIndex = 0;
    let stageStartTime = Date.now();

    // Animate progress bar through stages - exactly 27.5 seconds to reach 99%
    progressIntervalRef.current = setInterval(() => {
      const currentStage = stages[currentStageIndex];
      if (!currentStage) return;

      const elapsed = Date.now() - stageStartTime;
      const stageProgress = Math.min(elapsed / currentStage.duration, 1);
      const progressRange = currentStage.endProgress - currentStage.startProgress;
      const newProgress = currentStage.startProgress + (progressRange * stageProgress);

      setConversionProgress(Math.min(newProgress, 99));
      setConversionStage(currentStage.text);

      // Move to next stage when current stage is complete
      if (stageProgress >= 1 && currentStageIndex < stages.length - 1) {
        currentStageIndex++;
        stageStartTime = Date.now();
      }
    }, 50); // Update every 50ms for smooth animation

    try {
      const response = await fetch(`${apiUrl}/api/playbooks/convert-to-markdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_title: selectedJobTitle,
          raw_data: rawData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to convert data to markdown: ${errorMessage}`);
      }

      const data = await response.json();
      setMarkdownData(data.markdown_content);
      
      // Clear progress interval first
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Complete the progress
      setConversionProgress(100);
      setConversionStage('Conversion completed!');
      setHasConversionCompleted(true);

    } catch (error) {
      console.error('Error converting to markdown:', error);
      setError('Failed to convert data to markdown. Please try again.');
      setConversionProgress(0);
      setConversionStage('');
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } finally {
      setIsConverting(false);
    }
  };

  /**
   * Handle playbook generation
   * Why this matters: Triggers the playbook generation modal with processed data.
   */
  const handleGeneratePlaybook = (): void => {
    onPlaybookGenerate(selectedJobTitle, markdownData);
  };

  /**
   * Show confirmation modal for starting over
   * Why this matters: Provides a safety check before clearing all playbook progress
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
   * Clear saved progress
   * Why this matters: Allows users to start fresh by clearing localStorage data.
   */
  const clearProgress = (): void => {
    localStorage.removeItem('apollo_playbook_progress');
    setSelectedJobTitle('');
    setJobTitleSearch('');
    setRawData('');
    setMarkdownData('');
    setHasConversionCompleted(false);
    setCurrentStep(1);
    setConversionStage('');
    setError('');
  };

  /**
   * Close job title dropdown when clicking outside
   * Why this matters: Provides intuitive UX for the dropdown menu.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jobTitleDropdownRef.current && !jobTitleDropdownRef.current.contains(event.target as Node)) {
        setShowJobTitleDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Cleanup progress interval on unmount
   * Why this matters: Prevents memory leaks.
   */
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  /**
   * Render step indicators
   * Why this matters: Shows overall progress and which step user is currently on.
   */
  const renderStepIndicators = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '2rem',
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '0.5rem',
      border: '0.0625rem solid #e2e8f0'
    }}>
      {[1, 2, 3, 4].map((step) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: currentStep === step ? '#3b82f6' : currentStep > step ? '#10b981' : '#e5e7eb',
            color: currentStep >= step ? 'white' : '#6b7280',
            transition: 'all 0.2s ease'
          }}>
            {currentStep > step ? <CheckCircle size={14} /> : step}
          </div>
          {step < 4 && (
            <div style={{
              width: '2rem',
              height: '0.125rem',
              backgroundColor: currentStep > step ? '#10b981' : '#e5e7eb',
              marginLeft: '0.5rem',
              marginRight: '0.5rem',
              transition: 'all 0.2s ease'
            }} />
          )}
        </div>
      ))}
    </div>
  );

  /**
   * Render current step content
   * Why this matters: Shows only the relevant step to avoid overwhelming the user.
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-4">
                <div className="step-indicator active">1</div>
                <h2 className="card-title">Select Job Title</h2>
              </div>
            </div>
            
            <div className="card-content">
              <div className="input-group">
                <label className="input-label">
                  Choose the job title you want to create a playbook for:
                </label>
                <div className="relative max-w-sm" ref={jobTitleDropdownRef}>
                  <div className="input-container" onClick={() => setShowJobTitleDropdown(true)}>
                    <Search className="input-icon" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={selectedJobTitle || jobTitleSearch}
                      onChange={handleJobTitleInputChange}
                      onFocus={() => setShowJobTitleDropdown(true)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search or select job title..."
                      className="dropdown-input"
                      autoComplete="off"
                    />
                    <ChevronDown className={`dropdown-chevron ${showJobTitleDropdown ? 'rotated' : ''}`} />
                  </div>
                  
                  {showJobTitleDropdown && (
                    <div className="dropdown-menu relative" style={{ position: 'relative', marginTop: '0.25rem' }}>
                      {getFilteredJobTitles().length > 0 ? (
                        getFilteredJobTitles().map((jobTitle, index) => (
                          <div
                            key={jobTitle}
                            className={`dropdown-item ${selectedJobTitle === jobTitle ? 'selected' : ''} ${
                              highlightedIndex === index ? 'highlighted' : ''
                            }`}
                            onClick={() => handleJobTitleSelect(jobTitle)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                          >
                            {jobTitle}
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-item disabled">
                          No job titles found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {selectedJobTitle && (
                  <div className="selected-item">
                    <FileText size={16} />
                    <span>Selected: {selectedJobTitle}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-4">
                <div className="step-indicator active">2</div>
                <h2 className="card-title">Add Raw Data</h2>
              </div>
            </div>
            
            <div className="card-content">
              <div className="input-group">
                <label className="input-label">
                  Provide best times, performance data, and email templates for {selectedJobTitle}
                </label>
                <textarea
                  value={rawData}
                  onChange={handleRawDataChange}
                  placeholder={`Enter data for ${selectedJobTitle}:

- Best days/hours
- Total opens/delivered, open rates
- Top email templates`}
                  rows={8}
                  className="textarea-input"
                />
                <div className="input-helper-text">
                  This data will be processed and converted to structured markdown format
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-4">
                <div className="step-indicator active">3</div>
                <h2 className="card-title">Convert to Markdown</h2>
              </div>
            </div>
            
            <div className="card-content">
              {!hasConversionCompleted ? (
                <div className="action-section">
                  <p className="section-description">
                    Converting data into structured markdown format for easy processing
                  </p>
                  
                  {isConverting && (
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${conversionProgress}%` }}
                        />
                      </div>
                      <p className="progress-text">
                        {conversionStage ? conversionStage : 'Initializing...'} {Math.round(conversionProgress)}%
                      </p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  <button
                    onClick={convertToMarkdown}
                    disabled={isConverting || !rawData.trim()}
                    className="primary-button"
                  >
                    {isConverting ? (
                      <>
                        <Clock className="animate-spin" size={16} />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Convert to Markdown
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="success-section">
                  <div className="success-indicator">
                    <CheckCircle size={20} />
                    <span>Markdown conversion completed successfully!</span>
                  </div>
                  <div className="markdown-preview">
                    <h4>Preview:</h4>
                    <div className="markdown-content">
                      <pre>{markdownData.substring(0, 300)}...</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-4">
                <div className="step-indicator active">
                  <Sparkles size={16} />
                </div>
                <h2 className="card-title">Generate Playbook</h2>
              </div>
            </div>
            
            <div className="card-content">
              <div className="final-step-section">
                <div className="summary-card">
                  <h4>Ready to Generate</h4>
                  <div className="summary-items">
                    <div className="summary-item">
                      <span className="summary-label">Job Title:</span>
                      <span className="summary-value">{selectedJobTitle}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Data Status:</span>
                      <span className="summary-value">Processed & Ready</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleGeneratePlaybook}
                  className="primary-button large"
                >
                  <Wand2 size={18} />
                  Generate {selectedJobTitle} Playbook
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /**
   * Render navigation buttons
   * Why this matters: Provides clear navigation controls between steps with proper validation.
   */
  const renderNavigationButtons = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '2rem',
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '0.5rem',
      border: '0.0625rem solid #e2e8f0'
    }}>
      <button
        onClick={handlePreviousStep}
        disabled={currentStep === 1}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: currentStep === 1 ? '#f3f4f6' : 'white',
          color: currentStep === 1 ? '#9ca3af' : '#374151',
          border: '0.0625rem solid #d1d5db',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          if (currentStep !== 1) {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseOut={(e) => {
          if (currentStep !== 1) {
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {currentStep > 1 && (
          <button
            onClick={showStartOverConfirmation}
            style={{
              padding: '0.5rem 0.75rem',
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

        {currentStep < 4 && (
          <button
            onClick={handleNextStep}
            disabled={!canGoToNextStep()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: canGoToNextStep() ? '#3b82f6' : '#f3f4f6',
              color: canGoToNextStep() ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: canGoToNextStep() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (canGoToNextStep()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseOut={(e) => {
              if (canGoToNextStep()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
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
          border: '0.0625rem solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1), 0 0.125rem 0.25rem -0.0625rem rgba(0, 0, 0, 0.06)',
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

      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        {/* Step indicators */}
        {renderStepIndicators()}
        
        {/* Current step content */}
        {renderCurrentStep()}
        
        {/* Navigation buttons */}
        {renderNavigationButtons()}
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
                This action will clear all your current playbook progress including selected job title, raw data, and converted markdown. This cannot be undone.
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
    </>
  );
};

export default PlaybooksInterface; 