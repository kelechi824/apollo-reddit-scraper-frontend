import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Wand2, AlertTriangle, Phone, Clock, Users } from 'lucide-react';
import GongDigDeeperModal from './GongDigDeeperModal';
import { GongAnalyzedCall } from '../types';

// Updated interface to work with raw Gong call data
interface GongCall {
  title: string;
  started: string;
  duration?: number;
  direction: string;
  system?: string;
  url?: string;
  conversationDetails?: {
    transcript?: {
      transcript: Array<{
        speakerId: string;
        sentences: Array<{
          text: string;
          start: number;
          end: number;
        }>;
      }>;
    };
    highlights?: {
      brief?: string;
      keyPoints?: Array<{ text: string }>;
      trackers?: Array<{ name: string; count: number }>;
    };
  };
}

interface GongAnalysisResultPanelProps {
  calls: GongCall[];
  totalFound: number;
  onClear: () => void;
  showFullConversationTab?: boolean;
}

const GongAnalysisResultPanel: React.FC<GongAnalysisResultPanelProps> = ({
  calls,
  totalFound,
  onClear,
  showFullConversationTab = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'conversation' | 'summary' | 'painpoints' | 'opportunity'>(
    showFullConversationTab ? 'conversation' : 'summary'
  );
  const [isCallExpanded, setIsCallExpanded] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDigDeeperModalOpen, setIsDigDeeperModalOpen] = useState(false);

  /**
   * Format call duration from seconds to readable format
   * Why this matters: Makes call duration easily scannable for users to understand call length at a glance
   */
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  /**
   * Format call date to readable format
   * Why this matters: Provides context about when the call happened for relevance assessment
   */
  const formatCallDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  /**
   * Convert structured transcript to readable conversation format
   * Why this matters: Transforms Gong's structured transcript data into readable conversation text
   */
  const formatTranscriptToText = (transcript: any): string => {
    if (!transcript?.transcript || !Array.isArray(transcript.transcript)) {
      return '';
    }
    
    const conversationParts: string[] = [];
    
    transcript.transcript.forEach((segment: any, index: number) => {
      const speakerName = `Speaker ${segment.speakerId || index + 1}`;
      const sentences = segment.sentences || [];
      const speakerText = sentences.map((s: any) => s.text || '').join(' ');
      
      if (speakerText.trim()) {
        conversationParts.push(`${speakerName}: ${speakerText.trim()}`);
      }
    });
    
    return conversationParts.join('\n\n');
  };

  /**
   * Copy content to clipboard with visual feedback
   * Why this matters: Allows users to easily copy content for immediate use
   */
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [type]: true });
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [type]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  /**
   * Split content into paragraphs and determine if truncation is needed
   * Why this matters: Helps identify long call summaries that need read more/less functionality
   */
  const splitIntoParagraphs = (text: string): string[] => {
    if (!text) return [];
    return text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0);
  };

  /**
   * Toggle call expansion state
   * Why this matters: Allows users to control how much content they see at once
   */
  const toggleCallExpansion = () => {
    setIsCallExpanded(!isCallExpanded);
  };

  /**
   * Reset expansion state when navigating to different calls
   * Why this matters: Each call should start in collapsed state for consistent UX
   */
  const resetCallExpansion = () => {
    setIsCallExpanded(false);
  };

  /**
   * Transform current call data into format expected by GongDigDeeperModal
   * Why this matters: Converts Gong API format to internal analyzed call format for CRO modal
   */
  const transformCallForModal = (call: GongCall): GongAnalyzedCall => {
    const callId = call.title + '_' + call.started;
    
    return {
      id: callId,
      title: call.title,
      date: formatCallDate(call.started),
      duration: call.duration || 0,
      participants: [call.direction], // Use direction as participant info
      sentiment: 'neutral' as const, // Default sentiment since not provided by Gong API
      analysis: {
        callSummary: call.conversationDetails?.highlights?.brief || 'No summary available for this call.',
        painPoints: call.conversationDetails?.highlights?.keyPoints?.map((kp, index) => ({
          id: `${callId}_painpoint_${index}`,
          text: kp.text,
          category: 'other' as const,
          emotionalTrigger: 'neutral' as const,
          frequency: 1,
          confidence: 0.7,
          callId: callId,
          speakerId: 'unknown'
        })) || [],
        croOpportunity: {
          adCopyIdeas: ['AI-powered ad copy suggestions will be generated based on call insights'],
          googleAdsHeadlines: ['Conversion-optimized headlines coming soon'],
          googleAdsDescriptions: ['Optimized ad descriptions will be generated'],
          landingPageRecommendations: ['Landing page optimization recommendations will be provided']
        }
      },
      highlights: call.conversationDetails?.highlights || {},
      extensive_data: call.conversationDetails || {},
      call_rank: currentIndex + 1,
      analysis_timestamp: new Date().toISOString()
    };
  };

  /**
   * Open CRO optimization modal
   * Why this matters: Launches AI-powered CRO guidance session for the current call
   */
  const openCROModal = () => {
    setIsDigDeeperModalOpen(true);
  };

  /**
   * Show confirmation modal for clearing results
   * Why this matters: Provides a safety check before destructive clear action
   */
  const showClearConfirmation = () => {
    setShowConfirmModal(true);
  };

  /**
   * Clear analysis results after confirmation
   * Why this matters: Performs the actual clearing after user confirms
   */
  const confirmClearResults = () => {
    onClear();
    setShowConfirmModal(false);
  };

  /**
   * Cancel the clear action
   * Why this matters: Allows users to back out of the destructive action
   */
  const cancelClearResults = () => {
    setShowConfirmModal(false);
  };

  /**
   * Render call summary content with read more/less functionality
   * Why this matters: Provides a clean, scannable interface for long summaries while allowing full content access
   */
  const renderCallSummary = (content: string) => {
    const paragraphs = splitIntoParagraphs(content);
    const needsTruncation = paragraphs.length > 3;
    
    if (!needsTruncation) {
      return (
        <div>
          <p style={{ fontSize: 'calc(1rem - 0.125rem)', lineHeight: '1.6', margin: 0, color: '#374151' }}>{content}</p>
        </div>
      );
    }

    const displayParagraphs = isCallExpanded ? paragraphs : paragraphs.slice(0, 3);
    const displayContent = displayParagraphs.join('\n\n');

    return (
      <div>
        <p style={{ fontSize: 'calc(1rem - 0.125rem)', lineHeight: '1.6', margin: 0, color: '#374151' }}>{displayContent}</p>
        {needsTruncation && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={toggleCallExpansion}
              className="read-more-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '0.5rem 0',
                fontSize: '0.875rem'
              }}
            >
              {isCallExpanded ? 'Read less' : `Read more (${paragraphs.length - 3} more paragraphs)`}
            </button>
          </div>
        )}

      </div>
    );
  };

  /**
   * Navigate to next call
   * Why this matters: Allows users to paginate through call results one at a time
   */
  const handleNext = () => {
    if (currentIndex < calls.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setActiveTab(showFullConversationTab ? 'conversation' : 'summary'); // Reset to first tab when changing calls
      resetCallExpansion(); // Reset expansion state
    }
  };

  /**
   * Navigate to previous call
   * Why this matters: Allows users to go back to previously viewed calls
   */
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setActiveTab(showFullConversationTab ? 'conversation' : 'summary'); // Reset to first tab when changing calls
      resetCallExpansion(); // Reset expansion state
    }
  };

  if (calls.length === 0) {
    return (
      <div className="results-empty">
        <div className="apollo-logo" style={{width: '4rem', height: '4rem', opacity: 0.3}}>
          <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
        </div>
        <h3>No Calls Fetched Yet</h3>
        <p>Fetch Gong calls to see rich conversation insights here</p>
      </div>
    );
  }

  const currentCall = calls[currentIndex];
  
  // Safety check in case currentCall is undefined
  if (!currentCall) {
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-empty">
          <p>Error loading call data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-panel">
      {/* Panel Header */}
      <div className="analysis-panel-header">
        <div style={{flex: 1}}>
          <h3 className="analysis-panel-title">Gong Call Analysis</h3>
          <p className="analysis-panel-subtitle">
            Found {totalFound} calls, showing call {currentIndex + 1} of {calls.length}
          </p>
        </div>
        <button 
          onClick={showClearConfirmation}
          className="clear-results-btn"
          title="Clear results"
        >
          Clear
        </button>
      </div>

      {/* Navigation */}
      <div className="analysis-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="nav-btn nav-btn-prev"
        >
          <ChevronLeft style={{width: '1.25rem', height: '1.25rem'}} />
          Previous
        </button>
        
        <div className="nav-indicator">
          <span className="nav-current" style={{ backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '600' }}>{currentIndex + 1}</span>
          <span className="nav-divider">of</span>
          <span className="nav-total">{calls.length}</span>
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentIndex === calls.length - 1}
          className="nav-btn nav-btn-next"
        >
          Next
          <ChevronRight style={{width: '1.25rem', height: '1.25rem'}} />
        </button>
      </div>

      {/* Current Call Content */}
      <div className="analysis-content">
        {/* Call Header */}
        <div className="post-header">
          <div className="post-rank">
            #{currentIndex + 1}
          </div>
          <div className="post-info">
            <h4 className="post-title">{currentCall.title}</h4>
            <div className="post-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {formatCallDate(currentCall.started)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {currentCall.duration ? formatDuration(currentCall.duration) : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {currentCall.direction} - {currentCall.system || 'Unknown'}
                  </span>
                </div>
                {currentCall.url && (
                  <a 
                    href={currentCall.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
                  >
                    <ExternalLink style={{width: '0.875rem', height: '0.875rem'}} />
                    View in Gong
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CRO Analysis Tabs */}
        <div className="analysis-tabs">
          {/* Tab Navigation */}
          <div className="tab-nav">
            {showFullConversationTab && (
              <button
                className={`tab-btn ${activeTab === 'conversation' ? 'active' : ''}`}
                onClick={() => setActiveTab('conversation')}
                style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
              >
                <span className="tab-label-desktop">Full Conversation</span>
                <span className="tab-label-mobile" style={{ display: 'none' }}>Conversation</span>
              </button>
            )}
            <button
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              <span className="tab-label-desktop">Call Summary</span>
              <span className="tab-label-mobile" style={{ display: 'none' }}>Summary</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'painpoints' ? 'active' : ''}`}
              onClick={() => setActiveTab('painpoints')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              <span className="tab-label-desktop">Pain Points</span>
              <span className="tab-label-mobile" style={{ display: 'none' }}>Pain</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'opportunity' ? 'active' : ''}`}
              onClick={() => setActiveTab('opportunity')}
              style={{ fontSize: '1rem', padding: '0.875rem 1.25rem' }}
            >
              <span className="tab-label-desktop">CRO Opportunities</span>
              <span className="tab-label-mobile" style={{ display: 'none' }}>CRO</span>
            </button>
          </div>

          {/* Mobile-specific CSS */}
          <style>
            {`
              .content-buttons-container {
                justify-content: flex-start;
              }

              @media (max-width: 768px) {
                .tab-btn {
                  font-size: 0.875rem !important;
                  padding: 0.75rem 0.5rem !important;
                }
                .tab-label-desktop {
                  display: none !important;
                }
                .tab-label-mobile {
                  display: inline !important;
                }
                .content-buttons-container {
                  justify-content: center;
                }
              }
            `}
          </style>

          {/* Tab Content */}
          <div className="tab-content">
            {showFullConversationTab && activeTab === 'conversation' && (
              <div className="tab-panel">
                <div className="tab-panel-content">
                  {(() => {
                    console.log('🔍 Current call conversation details:', currentCall.conversationDetails);
                    console.log('🔍 Transcript data:', currentCall.conversationDetails?.transcript);
                    return null;
                  })()}
                  {currentCall.conversationDetails?.transcript ? (
                    <div className="insight-section" style={{ marginBottom: '2rem' }}>
                      <h5 className="insight-title" style={{ marginBottom: '1rem', fontSize: 'calc(1rem - 0.125rem)' }}>Full Call Transcript</h5>
                      <div className="insight-content">
                        <div style={{ 
                          backgroundColor: '#f9fafb', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '0.5rem', 
                          padding: '1.5rem',
                          maxHeight: '600px',
                          overflowY: 'auto',
                          fontSize: 'calc(1rem - 0.125rem)',
                          lineHeight: '1.6',
                          color: '#374151',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {formatTranscriptToText(currentCall.conversationDetails.transcript)}
                        </div>
                      </div>
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => copyToClipboard(formatTranscriptToText(currentCall.conversationDetails?.transcript), 'transcript')}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: copiedStates['transcript'] ? '#10b981' : '#EBF212',
                            color: copiedStates['transcript'] ? '#fff' : '#000',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {copiedStates['transcript'] ? 'Copied!' : 'Copy Transcript'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="insight-section" style={{ marginBottom: '2rem' }}>
                      <h5 className="insight-title" style={{ marginBottom: '1rem', fontSize: 'calc(1rem - 0.125rem)' }}>Full Call Transcript</h5>
                      <div className="insight-content">
                        <div style={{ 
                          padding: '1rem', 
                          backgroundColor: '#fef7f0', 
                          borderRadius: '0.5rem',
                          border: '1px solid #fed7aa',
                          textAlign: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <AlertTriangle style={{width: '1rem', height: '1rem', color: '#ea580c'}} />
                            <span style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: '#ea580c'
                            }}>
                              No Transcript Available
                            </span>
                          </div>
                          <p style={{ fontSize: 'calc(1rem - 0.125rem)', lineHeight: '1.6', margin: 0, color: '#374151' }}>
                            The full conversation transcript is not available for this call. This may be due to recording settings or processing status.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="tab-panel">
                <div className="tab-panel-content">
                  {/* Call Brief/Summary */}
                  {currentCall.conversationDetails?.highlights?.brief ? (
                    <div className="insight-section" style={{ marginBottom: '2rem' }}>
                      <h5 className="insight-title" style={{ marginBottom: '1rem', fontSize: 'calc(1rem - 0.125rem)' }}>Call Summary</h5>
                      <div className="insight-content">
                        {renderCallSummary(currentCall.conversationDetails.highlights.brief)}
                      </div>
                    </div>
                  ) : (
                    <div className="insight-section" style={{ marginBottom: '2rem' }}>
                      <h5 className="insight-title" style={{ marginBottom: '1rem', fontSize: 'calc(1rem - 0.125rem)' }}>Call Summary</h5>
                      <div className="insight-content">
                        <p style={{ fontSize: 'calc(1rem - 0.125rem)', lineHeight: '1.6', color: '#6b7280', fontStyle: 'italic' }}>
                          No call summary available for this call.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Key Points */}
                  {currentCall.conversationDetails?.highlights?.keyPoints && currentCall.conversationDetails.highlights.keyPoints.length > 0 && (
                    <div className="insight-section" style={{ marginBottom: '2rem' }}>
                      <h5 className="insight-title" style={{ marginBottom: '1rem', fontSize: 'calc(1rem - 0.125rem)' }}>Key Points</h5>
                      <div className="insight-content">
                        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: '1.6', fontSize: 'calc(1rem - 0.125rem)' }}>
                          {currentCall.conversationDetails.highlights.keyPoints.slice(0, 5).map((point, index) => (
                            <li key={index} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                              {point.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Active Trackers */}
                  {currentCall.conversationDetails?.highlights?.trackers && (
                    (() => {
                      const activeTrackers = currentCall.conversationDetails.highlights.trackers.filter(t => t.count > 0);
                      return activeTrackers.length > 0 ? (
                        <div className="insight-section" style={{ marginBottom: '2rem' }}>
                          <h5 className="insight-title" style={{ marginBottom: '1rem', fontSize: 'calc(1rem - 0.125rem)' }}>Conversation Trackers</h5>
                          <div className="insight-content">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                              {activeTrackers.slice(0, 8).map((tracker, index) => (
                                                              <div 
                                key={index}
                                style={{
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem',
                                  padding: '0.5rem',
                                  fontSize: 'calc(0.875rem - 0.125rem)'
                                }}
                              >
                                  <span style={{ fontWeight: '600', color: '#374151' }}>{tracker.name}</span>
                                  <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>({tracker.count} mentions)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()
                  )}
                </div>
              </div>
            )}

            {activeTab === 'painpoints' && (
              <div className="tab-panel">
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#fef7f0', 
                  borderRadius: '0.5rem',
                  border: '1px solid #fed7aa',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle style={{width: '1rem', height: '1rem', color: '#ea580c'}} />
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#ea580c'
                    }}>
                      Pain Point Analysis Coming Soon
                    </span>
                  </div>
                  <p style={{ fontSize: 'calc(1rem - 0.125rem)', lineHeight: '1.6', margin: 0, color: '#374151' }}>
                    AI-powered pain point identification will analyze this call to extract customer frustrations, objections, and emotional triggers for better CRO targeting.
                  </p>
                </div>
                <div style={{ marginTop: '1.5rem', borderTop: '0.0625rem solid #e5e7eb', paddingTop: '1.5rem' }}>
                  <button
                    onClick={openCROModal}
                    className="apollo-btn-gradient"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      width: 'auto'
                    }}
                  >
                    <Wand2 style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                    Get CRO Tips
                  </button>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    textAlign: 'left', 
                    marginTop: '0.75rem',
                    lineHeight: '1.4'
                  }}>
                    Get personalized CRO guidance for addressing customer pain points
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'opportunity' && (
              <div className="tab-panel">
                <div style={{ fontSize: 'calc(1rem - 0.125rem)', lineHeight: '1.6' }}>
                  {/* Placeholder Ad Copy Ideas */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                      Ad Copy Ideas
                    </h4>
                    <div style={{ 
                      backgroundColor: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem', 
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      AI-generated ad copy ideas will appear here based on call insights
                    </div>
                  </div>

                  {/* Placeholder Google Ads Headlines */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                        Google Ads Headlines
                      </h4>
                      <button
                        onClick={() => alert('Headlines will be generated after CRO analysis')}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#EBF212',
                          color: '#000',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Copy All
                      </button>
                    </div>
                    <div style={{ 
                      backgroundColor: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem', 
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      Optimized Google Ads headlines will be generated here
                    </div>
                  </div>

                  {/* Placeholder Google Ads Descriptions */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                        Google Ads Descriptions
                      </h4>
                      <button
                        onClick={() => alert('Descriptions will be generated after CRO analysis')}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#EBF212',
                          color: '#000',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Copy All
                      </button>
                    </div>
                    <div style={{ 
                      backgroundColor: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem', 
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      Conversion-optimized ad descriptions will appear here
                    </div>
                  </div>

                  {/* Placeholder Landing Page Recommendations */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                      Landing Page Recommendations
                    </h4>
                    <div style={{ 
                      backgroundColor: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem', 
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      Data-driven landing page optimization recommendations will be generated here
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: '1.5rem', borderTop: '0.0625rem solid #e5e7eb', paddingTop: '1.5rem' }}>
                    <div className="content-buttons-container" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <button
                        onClick={openCROModal}
                        className="apollo-btn-gradient"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          minWidth: '12.5rem',
                          justifyContent: 'center'
                        }}
                      >
                        <Wand2 style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                        Get CRO Tips
                      </button>
                    </div>
                    
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280', 
                      textAlign: 'left', 
                      lineHeight: '1.4',
                      margin: 0
                    }}>
                      Get AI-powered CRO recommendations based on call insights
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className={`confirmation-modal-backdrop ${showConfirmModal ? 'open' : ''}`}>
          <div className={`confirmation-modal ${showConfirmModal ? 'open' : ''}`}>
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                <AlertTriangle style={{width: '1.5rem', height: '1.5rem'}} />
              </div>
              <h3 className="confirmation-modal-title">Clear Gong Analysis Results?</h3>
              <p className="confirmation-modal-message">
                This action will remove all current call analysis insights and return you to the search form. You can find completed analyses in your History.
              </p>
            </div>
            <div className="confirmation-modal-actions">
              <button
                onClick={cancelClearResults}
                className="confirmation-modal-btn confirmation-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearResults}
                className="confirmation-modal-btn confirmation-modal-btn-confirm"
              >
                Clear Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRO Optimization Modal */}
      <GongDigDeeperModal
        isOpen={isDigDeeperModalOpen}
        onClose={() => setIsDigDeeperModalOpen(false)}
        call={transformCallForModal(currentCall)}
      />
    </div>
  );
};

export default GongAnalysisResultPanel; 