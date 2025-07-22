import React, { useState } from 'react';
import { Globe, Brain, BarChart3, Sparkles, ChevronDown, ChevronRight, ExternalLink, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface WorkflowDetails {
  firecrawl?: {
    urls_analyzed: string[];
    competitor_titles: string[];
    key_topics: string[];
    content_structure_insights: string[];
    search_metadata: any;
  };
  deepResearch?: {
    key_insights: string[];
    market_trends: string[];
    audience_needs: string[];
    content_gaps: string[];
    research_confidence: number;
    sources_analyzed: number;
    model_used: string;
  };
  gapAnalysis?: {
    identified_gaps: string[];
    competitive_coverage: string;
    recommended_angle: string;
    gap_scores: any;
    seo_suggestions: string[];
  };
  contentGeneration?: {
    processing_steps: string[];
    brand_variables_processed: number;
    citations_count: number;
    quality_score: number;
    model_pipeline: string[];
  };
  currentStage?: string;
  retryCount?: number;
  canResume?: boolean;
}

interface BackendDetailsPopupProps {
  workflowDetails?: WorkflowDetails;
  status: 'pending' | 'running' | 'completed' | 'error';
  isVisible: boolean;
  position: { x: number; y: number };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMobileClose?: () => void;
}

/**
 * BackendDetailsPopup Component
 * Why this matters: Provides transparent insight into the 4-step backend workflow, 
 * showing users exactly what's happening during content generation with detailed results from each step.
 */
const BackendDetailsPopup: React.FC<BackendDetailsPopupProps> = ({
  workflowDetails,
  status,
  isVisible,
  position,
  onMouseEnter,
  onMouseLeave,
  onMobileClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['current']));

  // Auto-expand the current stage section
  React.useEffect(() => {
    if (workflowDetails?.currentStage) {
      const currentStageMap: Record<string, string> = {
        'firecrawl': 'firecrawl',
        'deep_research': 'deepResearch',
        'gap_analysis': 'gapAnalysis',
        'content_generation': 'contentGeneration'
      };
      
      const sectionToExpand = currentStageMap[workflowDetails.currentStage];
      if (sectionToExpand) {
        setExpandedSections(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.add(sectionToExpand);
          return newSet;
        });
      }
    }
  }, [workflowDetails?.currentStage]);

  if (!isVisible) return null;

  /**
   * Toggle expansion of detail sections
   * Why this matters: Allows users to focus on specific workflow steps without overwhelming them with all details at once.
   */
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  /**
   * Get status icon based on workflow stage completion
   * Why this matters: Visual feedback helps users quickly understand which steps are complete, running, or pending.
   */
  const getStageIcon = (stage: string, isComplete: boolean, isCurrent: boolean) => {
    if (isCurrent && status === 'running') {
      return <RefreshCw className="animate-spin" size={16} style={{ color: '#3b82f6' }} />;
    } else if (isComplete) {
      return <CheckCircle size={16} style={{ color: '#10b981' }} />;
    } else if (status === 'error' && isCurrent) {
      return <AlertCircle size={16} style={{ color: '#dc2626' }} />;
    } else {
      return <Clock size={16} style={{ color: '#6b7280' }} />;
    }
  };

  /**
   * Determine if a stage is completed based on workflow details
   * Why this matters: Accurate stage tracking helps users understand workflow progress.
   */
  const isStageComplete = (stage: string): boolean => {
    if (!workflowDetails) return false;
    switch (stage) {
      case 'firecrawl': return !!workflowDetails.firecrawl;
      case 'deepResearch': return !!workflowDetails.deepResearch;
      case 'gapAnalysis': return !!workflowDetails.gapAnalysis;
      case 'contentGeneration': return !!workflowDetails.contentGeneration;
      default: return false;
    }
  };

  /**
   * Check if a stage is currently running
   * Why this matters: Highlights the active step in the workflow for user awareness.
   */
  const isCurrentStage = (stage: string): boolean => {
    return workflowDetails?.currentStage === stage;
  };

  // Calculate responsive popup positioning to avoid edge cutoffs
  const isMobile = window.innerWidth < 768;
  const popupWidth = isMobile ? Math.min(350, window.innerWidth - 40) : 650; // Increased width
  const popupHeight = isMobile ? Math.min(500, window.innerHeight - 80) : 600; // Increased height
  
  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    left: isMobile 
      ? `${(window.innerWidth - popupWidth) / 2}px` // Center on mobile
      : `${Math.max(10, Math.min(position.x, window.innerWidth - popupWidth - 10))}px`, // Use the smart positioning from parent
    top: isMobile
      ? `${Math.max(50, (window.innerHeight - popupHeight) / 2)}px` // Center on mobile  
      : `${Math.max(20, Math.min(position.y - 100, window.innerHeight - popupHeight - 20))}px`, // Positioned relative to cursor on desktop
    width: `${popupWidth}px`,
    maxHeight: `${popupHeight}px`,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    boxShadow: isMobile 
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' // Stronger shadow on mobile
      : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    zIndex: 1050, // Higher z-index to ensure it appears above table elements
    overflow: 'hidden',
    pointerEvents: 'auto'
  };

  return (
    <>
      {/* Mobile overlay for easier closing */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1049 // Just below the popup
          }}
          onClick={onMobileClose || onMouseLeave}
          onTouchEnd={onMobileClose || onMouseLeave}
        />
      )}
      
      <div
        style={popupStyle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={isMobile ? undefined : onMouseLeave} // Disable auto-hide on mobile
        onClick={(e) => e.stopPropagation()} // Prevent mobile overlay from closing when clicking popup
      >
      {/* Header */}
              <div style={{ 
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #f3f4f6',
          backgroundColor: '#f9fafb',
          position: 'relative'
        }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            margin: 0, 
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Brain size={18} style={{ color: '#3b82f6' }} />
            Backend Workflow Details
          </h3>
          {workflowDetails?.retryCount && workflowDetails.retryCount > 0 && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#f59e0b', 
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <RefreshCw size={12} />
              Retry attempt {workflowDetails.retryCount}
            </div>
          )}
          
          {/* Close button for better mobile experience */}
          {isMobile && (
            <button
              onClick={onMobileClose || onMouseLeave}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

      {/* Content */}
      <div style={{ 
        padding: '1rem 1.25rem',
        maxHeight: '520px', // Increased max height
        overflowY: 'auto',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}>
        {/* Pipeline Steps */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: '#374151', 
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            4-Model Pipeline Progress
          </h4>
          
          {/* Step 1: Firecrawl */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                backgroundColor: isStageComplete('firecrawl') ? '#f0f9ff' : '#f9fafb'
              }}
              onClick={() => toggleSection('firecrawl')}
            >
              {getStageIcon('firecrawl', isStageComplete('firecrawl'), isCurrentStage('firecrawl'))}
              <Globe size={16} style={{ color: '#F67318' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                Firecrawl Analysis
              </span>
              {expandedSections.has('firecrawl') ? 
                <ChevronDown size={14} style={{ color: '#6b7280' }} /> : 
                <ChevronRight size={14} style={{ color: '#6b7280' }} />
              }
            </div>
            
            {expandedSections.has('firecrawl') && (
              <div style={{ 
                marginLeft: '2rem', 
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0'
              }}>
                {workflowDetails?.firecrawl ? (
                  <>
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      <strong>URLs Analyzed ({workflowDetails.firecrawl.urls_analyzed.length}):</strong>
                      {workflowDetails.firecrawl.competitor_titles.slice(0, 3).map((title, idx) => (
                        <div key={idx} style={{ 
                          marginTop: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <ExternalLink size={10} style={{ color: '#6b7280' }} />
                          <span style={{ color: '#4b5563' }}>{title}</span>
                        </div>
                      ))}
                    </div>
                    
                    {workflowDetails.firecrawl.key_topics.length > 0 && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <strong>Key Topics Found:</strong>
                        <div style={{ marginTop: '0.25rem' }}>
                          {workflowDetails.firecrawl.key_topics.slice(0, 6).join(', ')}
                        </div>
                      </div>
                    )}
                    
                    {workflowDetails.firecrawl.content_structure_insights.length > 0 && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <strong>Content Structure:</strong>
                        {workflowDetails.firecrawl.content_structure_insights.slice(0, 2).map((insight, idx) => (
                          <div key={idx} style={{ marginTop: '0.25rem', color: '#4b5563' }}>
                            • {insight}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '1rem'
                  }}>
                    {isCurrentStage('firecrawl') ? 
                      '🔍 Currently analyzing competitor websites...' : 
                      'Scraping the top 3 search results on Google...'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Deep Research */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                backgroundColor: isStageComplete('deepResearch') ? '#f0fdf4' : '#f9fafb'
              }}
              onClick={() => toggleSection('deepResearch')}
            >
              {getStageIcon('deepResearch', isStageComplete('deepResearch'), isCurrentStage('deepResearch'))}
              <Brain size={16} style={{ color: '#3BB591' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                Deep Research
              </span>
              {expandedSections.has('deepResearch') ? 
                <ChevronDown size={14} style={{ color: '#6b7280' }} /> : 
                <ChevronRight size={14} style={{ color: '#6b7280' }} />
              }
            </div>
            
            {expandedSections.has('deepResearch') && (
              <div style={{ 
                marginLeft: '2rem', 
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '0.375rem',
                border: '1px solid #bbf7d0'
              }}>
                {workflowDetails?.deepResearch ? (
                  <>
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
                      <span><strong>Model:</strong> {workflowDetails.deepResearch.model_used}</span>
                      <span><strong>Sources:</strong> {workflowDetails.deepResearch.sources_analyzed}</span>
                      <span><strong>Confidence:</strong> {(workflowDetails.deepResearch.research_confidence * 100).toFixed(0)}%</span>
                    </div>
                    
                    {workflowDetails.deepResearch.key_insights.length > 0 && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <strong>Key Insights ({workflowDetails.deepResearch.key_insights.length}):</strong>
                        {workflowDetails.deepResearch.key_insights.slice(0, 4).map((insight, idx) => (
                          <div key={idx} style={{ marginTop: '0.25rem', color: '#065f46', lineHeight: '1.4' }}>
                            • {insight}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {workflowDetails.deepResearch.content_gaps.length > 0 && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <strong>Content Gaps Identified:</strong>
                        {workflowDetails.deepResearch.content_gaps.slice(0, 3).map((gap, idx) => (
                          <div key={idx} style={{ marginTop: '0.25rem', color: '#065f46', lineHeight: '1.4' }}>
                            • {gap}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '1rem'
                  }}>
                    {isCurrentStage('deep_research') ? 
                      '🧠 Performing comprehensive deep research...' : 
                      'Performing deep research...'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Gap Analysis */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                backgroundColor: isStageComplete('gapAnalysis') ? '#faf5ff' : '#f9fafb'
              }}
              onClick={() => toggleSection('gapAnalysis')}
            >
              {getStageIcon('gapAnalysis', isStageComplete('gapAnalysis'), isCurrentStage('gapAnalysis'))}
              <BarChart3 size={16} style={{ color: '#7D3DED' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                Gap Analysis
              </span>
              {expandedSections.has('gapAnalysis') ? 
                <ChevronDown size={14} style={{ color: '#6b7280' }} /> : 
                <ChevronRight size={14} style={{ color: '#6b7280' }} />
              }
            </div>
            
            {expandedSections.has('gapAnalysis') && (
              <div style={{ 
                marginLeft: '2rem', 
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#faf5ff',
                borderRadius: '0.375rem',
                border: '1px solid #e9d5ff'
              }}>
                {workflowDetails?.gapAnalysis ? (
                  <>
                    {workflowDetails.gapAnalysis.recommended_angle && (
                      <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        <strong>Recommended Angle:</strong>
                        <div style={{ marginTop: '0.25rem', color: '#581c87', lineHeight: '1.4' }}>
                          {workflowDetails.gapAnalysis.recommended_angle}
                        </div>
                      </div>
                    )}
                    
                    {workflowDetails.gapAnalysis.gap_scores && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <strong>Opportunity Scores:</strong>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          {Object.entries(workflowDetails.gapAnalysis.gap_scores).map(([key, value]) => (
                            <span key={key} style={{ color: '#581c87' }}>
                              {key.replace(/_/g, ' ')}: {typeof value === 'number' ? (value * 100).toFixed(0) : String(value)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {workflowDetails.gapAnalysis.identified_gaps.length > 0 && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <strong>Identified Gaps ({workflowDetails.gapAnalysis.identified_gaps.length}):</strong>
                        {workflowDetails.gapAnalysis.identified_gaps.slice(0, 3).map((gap, idx) => (
                          <div key={idx} style={{ marginTop: '0.25rem', color: '#581c87', lineHeight: '1.4' }}>
                            • {gap}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '1rem'
                  }}>
                    {isCurrentStage('gap_analysis') ? 
                      '📊 Analyzing content gaps with GPT-4.1 nano...' : 
                      'Conducting content gap analysis for opportunities...'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 4: Content Generation */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                backgroundColor: isStageComplete('contentGeneration') ? '#fffbeb' : '#f9fafb'
              }}
              onClick={() => toggleSection('contentGeneration')}
            >
              {getStageIcon('contentGeneration', isStageComplete('contentGeneration'), isCurrentStage('contentGeneration'))}
              <Sparkles size={16} style={{ color: '#EBF212' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                Content Generation
              </span>
              {expandedSections.has('contentGeneration') ? 
                <ChevronDown size={14} style={{ color: '#6b7280' }} /> : 
                <ChevronRight size={14} style={{ color: '#6b7280' }} />
              }
            </div>
            
            {expandedSections.has('contentGeneration') && (
              <div style={{ 
                marginLeft: '2rem', 
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#fffbeb',
                borderRadius: '0.375rem',
                border: '1px solid #fed7aa'
              }}>
                {workflowDetails?.contentGeneration ? (
                  <>
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span><strong>Quality Score:</strong> {workflowDetails.contentGeneration.quality_score.toFixed(2)}</span>
                      <span><strong>Brand Variables:</strong> {workflowDetails.contentGeneration.brand_variables_processed}</span>
                      <span><strong>Citations:</strong> {workflowDetails.contentGeneration.citations_count}</span>
                    </div>
                    
                    {workflowDetails.contentGeneration.model_pipeline.length > 0 && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <strong>Model Pipeline:</strong>
                        <div style={{ marginTop: '0.25rem', color: '#92400e' }}>
                          {workflowDetails.contentGeneration.model_pipeline.join(' → ')}
                        </div>
                      </div>
                    )}
                    
                    {workflowDetails.contentGeneration.processing_steps.length > 0 && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <strong>Processing Steps:</strong>
                        {workflowDetails.contentGeneration.processing_steps.slice(0, 4).map((step, idx) => (
                          <div key={idx} style={{ marginTop: '0.25rem', color: '#92400e', lineHeight: '1.4' }}>
                            {idx + 1}. {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '1rem'
                  }}>
                    {isCurrentStage('content_generation') ? 
                      '✨ Generating article with Claude Sonnet 4...' : 
                      'Gathering insights from Step 1, 2, and 3 to generate content...'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Current Status */}
        {status === 'running' && workflowDetails?.currentStage && (
          <div style={{ 
            padding: '0.75rem',
            backgroundColor: '#eff6ff',
            borderRadius: '0.375rem',
            border: '1px solid #dbeafe',
            marginTop: '1rem'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <RefreshCw className="animate-spin" size={12} />
              <strong>Currently running: {workflowDetails.currentStage.replace(/_/g, ' ')}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default BackendDetailsPopup; 