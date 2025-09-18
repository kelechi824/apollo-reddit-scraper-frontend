import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle, Trash, Search, Users, Target, Bot, ExternalLink, Eye } from 'lucide-react';
import { buildApiUrl } from '../config/api';
import { makeApiRequest } from '../utils/apiHelpers';
import VoCPageOptimizerModal from '../components/VoCPageOptimizerModal';

interface VoCPainPoint {
  id: string;
  theme: string;
  liquidVariable: string;
  description: string;
  frequency: number;
  severity: 'high' | 'medium' | 'low';
  customerQuotes: string[];
  emotionalTriggers: string[];
  sourceCallIds?: string[];
  extractionTimestamp?: string;
  analysisMetadata?: {
    modelUsed: string;
    callsAnalyzed: number;
    processingTime: number;
    enhancementType?: string;
  };
  sourceExcerpts?: Array<{
    quote: string;
    callTitle: string;
    callDate: string;
    excerpt: string;
    callId: string;
  }>;
  // Enhanced VoC Agent fields - matches backend interface
  detailedAnalysis?: string;
  apolloRelevance?: string;
  productMapping?: string[];
  recommendations?: string;
  impactPotential?: 'high' | 'medium' | 'low';
  urgencyIndicators?: string[];
  customerStruggles?: string[];
  apolloSolution?: string;
  enhancementTimestamp?: string;
}

interface VoCAgentData {
  painPoints: VoCPainPoint[];
  lastUpdated: string;
  hasGeneratedAnalysis: boolean;
  analysisMetadata?: {
    totalPainPoints: number;
    callsAnalyzed: number;
    analysisDate: string;
  };
}

/**
 * Voice of Customer Agent Page Component
 * Why this matters: Enhanced VoC analysis with AI-powered insights, customer struggle analysis,
 * and Apollo product recommendations for strategic pain point targeting.
 */
const VoiceOfCustomerAgentPage: React.FC = () => {
  const [vocAgentData, setVoCAgentData] = useState<VoCAgentData>({
    painPoints: [],
    lastUpdated: new Date().toISOString(),
    hasGeneratedAnalysis: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [message, setMessage] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showExcerptModal, setShowExcerptModal] = useState<{painPoint: VoCPainPoint} | null>(null);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [expandedPainPoints, setExpandedPainPoints] = useState<Set<string>>(new Set());

  const isInitialLoadRef = useRef(true);

  /**
   * Auto-save functionality
   * Why this matters: Persists VoC Agent data without requiring manual saves
   */
  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    setAutoSaveStatus('saving');

    const timeout = setTimeout(() => {
      try {
        localStorage.setItem('apollo_voc_agent_data', JSON.stringify(vocAgentData));
        window.dispatchEvent(new CustomEvent('apollo-voc-agent-updated'));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('');
      }
    }, 1000);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [vocAgentData]);

  /**
   * Load VoC Agent data from localStorage on mount
   * Why this matters: Restores user's analysis data across sessions
   */
  useEffect(() => {
    const saved = localStorage.getItem('apollo_voc_agent_data');

    if (saved) {
      try {
        const loadedData = JSON.parse(saved);
        setVoCAgentData(loadedData);
      } catch (error) {
        console.error('Error loading VoC Agent data:', error);
      }
    }

    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, []);

  /**
   * Extract enhanced pain points with AI analysis
   * Why this matters: Provides deeper customer insights and Apollo product mapping
   */
  const extractEnhancedPainPoints = async () => {
    setIsExtracting(true);
    setMessage('Analyzing Gong customer calls with enhanced AI insights (parallel processing). This may take 15-30 seconds...');

    try {
      console.log('🚀 Starting enhanced VoC extraction...');

      const apiResult = await makeApiRequest(
        buildApiUrl('/api/voc-agent/analyze-enhanced'),
        {
          method: 'POST',
          body: JSON.stringify({
            daysBack: 90,
            maxCalls: 300,
            includeApolloMapping: true,
            includeCustomerStruggles: true
          }),
        }
      );

      console.log('📡 Enhanced API result:', apiResult);

      if (!apiResult.success) {
        throw new Error(apiResult.error || apiResult.message || 'Enhanced VoC analysis failed');
      }

      const result = apiResult.data;
      console.log('✅ Enhanced API Response:', result);

      if (result.success && result.data) {
        const { painPoints, metadata } = result.data;

        const updatedVoCAgentData = {
          ...vocAgentData,
          painPoints: painPoints,
          lastUpdated: new Date().toISOString(),
          hasGeneratedAnalysis: true,
          analysisMetadata: metadata
        };

        setVoCAgentData(updatedVoCAgentData);
        setIsExtracting(false);

        // Auto-save the completed analysis
        try {
          localStorage.setItem('apollo_voc_agent_data', JSON.stringify(updatedVoCAgentData));
          window.dispatchEvent(new CustomEvent('apollo-voc-agent-updated'));
          console.log('✅ Enhanced VoC analysis auto-saved successfully');
        } catch (error) {
          console.error('Failed to auto-save enhanced VoC analysis:', error);
        }

        setMessage(`Successfully analyzed ${metadata.callsAnalyzed} calls and extracted ${metadata.totalPainPoints} enhanced pain points with AI insights`);
        setTimeout(() => setMessage(''), 5000);
      } else {
        console.error('❌ API returned error:', result);
        setMessage(`Error: ${result.error || 'Failed to complete enhanced analysis'}`);
        setIsExtracting(false);
      }
    } catch (error: any) {
      console.error('❌ Error in enhanced VoC analysis:', error);
      setMessage(`Error: ${error.message || 'Failed to connect to enhanced VoC extraction service'}`);
      setIsExtracting(false);
    }

    setTimeout(() => setMessage(''), 5000);
  };

  /**
   * Clear all analysis data
   * Why this matters: Allows users to start fresh with a new analysis
   */
  const handleClearAll = () => {
    const freshData: VoCAgentData = {
      painPoints: [],
      lastUpdated: new Date().toISOString(),
      hasGeneratedAnalysis: false
    };

    setVoCAgentData(freshData);
    setIsExtracting(false);
    setShowClearModal(false);

    // Clear from localStorage
    try {
      localStorage.setItem('apollo_voc_agent_data', JSON.stringify(freshData));
      localStorage.removeItem('apollo_voc_agent_draft');
      window.dispatchEvent(new CustomEvent('apollo-voc-agent-updated'));
      console.log('✅ VoC Agent analysis cleared successfully');
    } catch (error) {
      console.error('Failed to clear VoC Agent analysis:', error);
    }

    setMessage('All analysis data cleared. You can now extract fresh enhanced pain points.');
    setTimeout(() => setMessage(''), 3000);
  };

  /**
   * Get severity color
   * Why this matters: Visual indication of pain point severity for priority
   */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  /**
   * Show excerpt modal for a pain point
   * Why this matters: Provides transparency by showing all quote sources
   */
  const showExcerpts = (painPoint: VoCPainPoint) => {
    setShowExcerptModal({ painPoint });
  };

  /**
   * Toggle pain point expansion
   * Why this matters: Shows/hides detailed AI analysis and recommendations
   */
  const togglePainPointExpansion = (painPointId: string) => {
    setExpandedPainPoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(painPointId)) {
        newSet.delete(painPointId);
      } else {
        newSet.add(painPointId);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Auto-save indicator */}
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
          boxShadow: '0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1)',
          color: autoSaveStatus === 'saving' ? '#6b7280' : '#10b981',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          {autoSaveStatus === 'saving' ? (
            <>
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                border: '0.125rem solid transparent',
                borderTop: '0.125rem solid #6b7280',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Auto-saving...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              Auto-saved
            </>
          )}
        </div>
      )}

      <div className="voc-agent-page" style={{
        padding: '2rem',
        maxWidth: '75rem',
        margin: '0 auto'
      }}>
        {/* Development Notice Banner */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: '50%',
            backgroundColor: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>!</span>
          </div>
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem', 
            color: '#92400e',
            fontWeight: '500'
          }}>
            The VoC Agent is currently in development. Some features may not work as expected.
          </p>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: '#111827' }}>
            Voice of Customer Agent
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
            Enhanced AI-powered customer pain point analysis with Apollo product recommendations and page optimization guidance.
          </p>
        </div>

        {/* Enhanced Extract Pain Points Section */}
        <div style={{
          border: '0.125rem solid #B8B0E8',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          backgroundColor: '#E0DBFF',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Bot size={24} style={{ color: '#3b82f6' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1e40af' }}>
              Enhanced AI Pain Point Analysis
            </h3>
          </div>

          <p style={{
            color: '#374151',
            marginBottom: '1rem',
            lineHeight: '1.5',
            fontSize: '0.875rem'
          }}>
            Advanced AI analysis with GPT 5 that extracts pain points from Gong customer calls, analyzes customer struggles,
            maps to Apollo products, and provides strategic recommendations for optimization.
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={extractEnhancedPainPoints}
              disabled={isExtracting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isExtracting ? '#9ca3af' : '#EBF212',
                color: isExtracting ? 'white' : 'black',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: isExtracting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {isExtracting ? (
                <>
                  <div style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    border: '0.125rem solid transparent',
                    borderTop: '0.125rem solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Analyzing with AI...
                </>
              ) : vocAgentData.hasGeneratedAnalysis ? (
                <>
                  <RefreshCw size={16} strokeWidth={3} />
                  Re-analyze Pain Points
                </>
              ) : (
                <>
                  <Bot size={16} strokeWidth={3} />
                  Extract Customer Pain Points
                </>
              )}
            </button>

            {vocAgentData.hasGeneratedAnalysis && (
              <>
                <button
                  onClick={() => setShowClearModal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Trash size={16} strokeWidth={3} />
                  Clear All
                </button>

                <button
                  onClick={() => setShowOptimizerModal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 70%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Target size={16} strokeWidth={3} />
                  Ask Apollo AI What Page to Optimize
                </button>
              </>
            )}

            {vocAgentData.analysisMetadata && (
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <span>🎯 {vocAgentData.analysisMetadata.totalPainPoints} enhanced pain points detected</span>
                <span>📞 {vocAgentData.analysisMetadata.callsAnalyzed} calls analyzed</span>
                <span>📅 {new Date(vocAgentData.analysisMetadata.analysisDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {message && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: message.includes('Error') ? '#fee2e2' : '#dcfce7',
              borderRadius: '0.5rem',
              border: `0.0625rem solid ${message.includes('Error') ? '#fecaca' : '#bbf7d0'}`,
              fontSize: '0.875rem',
              color: message.includes('Error') ? '#dc2626' : '#16a34a'
            }}>
              {message}
            </div>
          )}
        </div>

        {/* Enhanced Pain Points Display */}
        {vocAgentData.hasGeneratedAnalysis && vocAgentData.painPoints.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            border: '0.0625rem solid #f3f4f6',
            borderRadius: '0.75rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: '#374151' }}>
              Enhanced Pain Points Analysis ({vocAgentData.painPoints.length})
            </h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {vocAgentData.painPoints.map((painPoint, index) => (
                <div key={painPoint.id || `painpoint-${index}`} style={{
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{
                      width: '0.75rem',
                      height: '0.75rem',
                      borderRadius: '50%',
                      backgroundColor: getSeverityColor(painPoint.severity)
                    }} />
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: '600', margin: 0, color: '#374151', flex: 1 }}>
                      {painPoint.theme}
                    </h4>

                    <button
                      onClick={() => togglePainPointExpansion(painPoint.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.7125rem',
                        color: '#3b82f6',
                        backgroundColor: '#eff6ff',
                        border: '0.0625rem solid #dbeafe',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.1875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                    >
                      <Eye size={10} strokeWidth={2} />
                      {expandedPainPoints.has(painPoint.id) ? 'Hide Details' : 'Show AI Analysis'}
                    </button>

                    <span style={{
                      fontSize: '0.8125rem',
                      backgroundColor: '#dcfce7',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      color: '#16a34a',
                      fontWeight: '500'
                    }}>
                      ✓ AI Enhanced
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                    {painPoint.description}
                  </p>

                  {/* Customer Quotes Section */}
                  {painPoint.customerQuotes && painPoint.customerQuotes.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.7625rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                        Real Customer Quotes:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {painPoint.customerQuotes.slice(0, 3).map((quote, idx) => (
                          <div
                            key={`quote-${painPoint.id}-${idx}`}
                            style={{
                              fontSize: '0.7625rem',
                              fontStyle: 'italic',
                              color: '#6b7280',
                              backgroundColor: '#f9fafb',
                              padding: '0.375rem 0.5rem',
                              borderRadius: '0.25rem',
                              borderLeft: '0.1875rem solid #3b82f6'
                            }}
                          >
                            "{quote}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded AI Analysis Section */}
                  {expandedPainPoints.has(painPoint.id) && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '0.5rem',
                      border: '0.0625rem solid #bae6fd'
                    }}>
                      {/* Customer Struggles Analysis */}
                      {painPoint.customerStruggles && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h5 style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
                            🧠 AI Analysis - What Customers Are Struggling With:
                          </h5>
                          <ul style={{ fontSize: '0.75rem', color: '#1e3a8a', lineHeight: '1.4', margin: 0, paddingLeft: '1rem' }}>
                            {Array.isArray(painPoint.customerStruggles)
                              ? painPoint.customerStruggles.map((struggle: string, idx: number) => (
                                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{struggle}</li>
                                ))
                              : <li>{painPoint.customerStruggles}</li>
                            }
                          </ul>
                        </div>
                      )}

                      {/* Apollo Product Relevance */}
                      {painPoint.productMapping && painPoint.productMapping.length > 0 && (
                        <div>
                          <h5 style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
                            🎯 Apollo Product Recommendations:
                          </h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {painPoint.productMapping.map((product: string, idx: number) => (
                              <div key={idx} style={{
                                padding: '0.5rem',
                                backgroundColor: 'white',
                                borderRadius: '0.25rem',
                                border: '0.0625rem solid #dbeafe'
                              }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1e40af' }}>
                                  {product}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    {painPoint.sourceExcerpts && painPoint.sourceExcerpts.length > 0 && (
                      <button
                        onClick={() => showExcerpts(painPoint)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.7125rem',
                          color: '#3b82f6',
                          backgroundColor: '#eff6ff',
                          border: '0.0625rem solid #dbeafe',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.1875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontWeight: '500'
                        }}
                      >
                        <Search size={10} strokeWidth={2} />
                        View call excerpts
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!vocAgentData.hasGeneratedAnalysis && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#6b7280',
            fontSize: '1rem'
          }}>
            <Users size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
            <p style={{ margin: '0 0 0.5rem' }}>No enhanced pain point analysis yet.</p>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Click "Extract Customer Pain Points" to start AI-powered customer analysis.</p>
          </div>
        )}
      </div>

      {/* Excerpt Modal - Same as VoCKitPage */}
      {showExcerptModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowExcerptModal(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              maxWidth: '60rem',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              borderBottom: '0.0625rem solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                    Call Excerpts: {showExcerptModal.painPoint.theme}
                  </h3>
                </div>
                <button
                  onClick={() => setShowExcerptModal(null)}
                  style={{
                    fontSize: '1.5rem',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.25rem'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem' }}>
              {showExcerptModal.painPoint.sourceExcerpts && showExcerptModal.painPoint.sourceExcerpts.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(28rem, 1fr))', gap: '1.5rem' }}>
                  {showExcerptModal.painPoint.sourceExcerpts.map((excerpt, idx) => (
                    <div key={`excerpt-${excerpt.callId || idx}`} style={{
                      border: '0.0625rem solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.25rem',
                      backgroundColor: '#f9fafb'
                    }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                          📞 {excerpt.callTitle}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {new Date(excerpt.callDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          Extracted Quote:
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontStyle: 'italic',
                          color: '#3b82f6',
                          fontWeight: '500',
                          backgroundColor: '#eff6ff',
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          border: '0.0625rem solid #dbeafe'
                        }}>
                          "{excerpt.quote}"
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          Call Context:
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#4b5563',
                          lineHeight: '1.5',
                          backgroundColor: 'white',
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          border: '0.0625rem solid #e5e7eb'
                        }}>
                          {excerpt.excerpt}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#6b7280'
                }}>
                  <Search size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '1rem', margin: 0 }}>No source excerpts available for this pain point.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
            maxWidth: '25rem',
            width: '90%'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Trash style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem', color: '#1f2937' }}>
                Clear All Analysis Data?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                This will permanently delete all extracted pain points and AI analysis results. This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowClearModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash size={16} strokeWidth={3} />
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VoC Page Optimizer Modal */}
      {showOptimizerModal && (
        <VoCPageOptimizerModal
          isOpen={showOptimizerModal}
          onClose={() => setShowOptimizerModal(false)}
          painPoints={vocAgentData.painPoints}
        />
      )}


      {/* Add spinner animation */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
};

export default VoiceOfCustomerAgentPage;