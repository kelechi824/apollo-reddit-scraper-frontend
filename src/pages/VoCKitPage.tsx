import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle, Trash, Search } from 'lucide-react';
import { buildApiUrl } from '../config/api';
import { makeApiRequest } from '../utils/apiHelpers';

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
  };
  sourceExcerpts?: Array<{
    quote: string;
    callTitle: string;
    callDate: string;
    excerpt: string;
    callId: string;
  }>;
}

interface VoCKit {
  painPoints: Record<string, string>; // liquidVariable -> liquid syntax
  customVariables: Record<string, string>;
  lastUpdated: string;
  hasGeneratedAnalysis: boolean;
  extractedPainPoints: VoCPainPoint[];
  analysisMetadata?: {
    totalPainPoints: number;
    callsAnalyzed: number;
    analysisDate: string;
  };
}

/**
 * VoC Kit Page Component
 * Why this matters: Manages customer pain points as liquid variables for hyper-relevant CTA generation,
 * similar to BrandKit but focused on Voice of Customer insights from Gong calls.
 */
const VoCKitPage: React.FC = () => {
  const [vocKit, setVoCKit] = useState<VoCKit>({
    painPoints: {},
    customVariables: {},
    lastUpdated: new Date().toISOString(),
    hasGeneratedAnalysis: false,
    extractedPainPoints: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [message, setMessage] = useState('');
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [extractedPainPoints, setExtractedPainPoints] = useState<VoCPainPoint[]>([]);
  const [hasGeneratedAnalysis, setHasGeneratedAnalysis] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showExcerptModal, setShowExcerptModal] = useState<{painPoint: VoCPainPoint} | null>(null);


  const isInitialLoadRef = useRef(true);

  // Convert camelCase to snake_case for liquid variables
  const toSnakeCase = (str: string) => {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Auto-generate liquid syntax when variable name changes
  useEffect(() => {
    if (newVariableName.trim()) {
      const snakeCaseName = toSnakeCase(newVariableName.trim());
      setNewVariableValue(`{{ pain_points.${snakeCaseName} }}`);
    } else {
      setNewVariableValue('');
    }
  }, [newVariableName]);

  // Auto-save functionality
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
        localStorage.setItem('apollo_voc_kit_draft', JSON.stringify(vocKit));
        window.dispatchEvent(new CustomEvent('apollo-voc-kit-updated'));
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
  }, [vocKit]);



  /**
   * Handle analysis completion
   * Why this matters: Centralizes the logic for when analysis finishes.
   */
  const handleAnalysisComplete = (variables: Record<string, string>, painPoints: VoCPainPoint[], metadata: any) => {
    const updatedVoCKit = {
      ...vocKit,
      painPoints: variables,
      lastUpdated: new Date().toISOString(),
      hasGeneratedAnalysis: true,
      extractedPainPoints: painPoints,
      analysisMetadata: metadata
    };
    
    setVoCKit(updatedVoCKit);
    setExtractedPainPoints(painPoints);
    setHasGeneratedAnalysis(true);
    setIsExtracting(false);
    
    // Auto-save the completed analysis
    try {
      localStorage.setItem('apollo_voc_kit', JSON.stringify(updatedVoCKit));
      localStorage.removeItem('apollo_voc_kit_draft');
      window.dispatchEvent(new CustomEvent('apollo-voc-kit-updated'));
      console.log('✅ VoC analysis auto-saved successfully');
    } catch (error) {
      console.error('Failed to auto-save VoC analysis:', error);
    }
    
    setMessage(`Successfully extracted ${metadata.totalPainPoints} pain points from ${metadata.callsAnalyzed} customer calls`);
    setTimeout(() => setMessage(''), 5000);
  };

  /**
   * Load VoC Kit from localStorage
   * Why this matters: Persists VoC configuration and analysis results across sessions.
   */
  useEffect(() => {
    const draft = localStorage.getItem('apollo_voc_kit_draft');
    const saved = localStorage.getItem('apollo_voc_kit');
    
    const dataToLoad = draft || saved;
    
    if (dataToLoad) {
      try {
        const loadedData = JSON.parse(dataToLoad);
        setVoCKit(loadedData);
        
        // Set extracted pain points if they exist
        if (loadedData.extractedPainPoints) {
          setExtractedPainPoints(loadedData.extractedPainPoints);
        }
        
        // Set analysis state
        if (loadedData.hasGeneratedAnalysis) {
          setHasGeneratedAnalysis(true);
        }
      } catch (error) {
        console.error('Error loading VoC Kit:', error);
      }
    }

    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, []);

  /**
   * Extract pain points from Gong calls (optimized for production)
   * Why this matters: Uses a single optimized call with reduced data volume to avoid timeouts.
   */
  const extractPainPoints = async () => {
    setIsExtracting(true);
    setMessage('Analyzing Gong customer calls. This may take 30-60 seconds...');
    
    try {
      console.log('🚀 Starting VoC extraction...');
      console.log('API URL:', buildApiUrl('/api/voc-extraction/analyze-synchronous'));
      
      // Use synchronous endpoint with full 300 calls using parallel workers
      // Why this matters: 20 parallel workers process 300 calls in under 10 seconds
      const apiResult = await makeApiRequest(
        buildApiUrl('/api/voc-extraction/analyze-synchronous'),
        {
          method: 'POST',
          body: JSON.stringify({
            daysBack: 90,  // 90 days for good coverage
            maxCalls: 300  // Full 300 calls with parallel processing
          }),
        }
      );

      console.log('📡 API result:', apiResult);

      if (!apiResult.success) {
        throw new Error(apiResult.error || apiResult.message || 'VoC analysis failed');
      }

      const result = apiResult.data;
      console.log('✅ API Response:', result);

      if (result.success && result.data) {
        const { variables, painPoints, metadata } = result.data;
        handleAnalysisComplete(variables, painPoints, metadata);
        
        setMessage(`Successfully extracted ${metadata.totalPainPoints} pain points from ${metadata.callsAnalyzed} calls`);
      } else {
        console.error('❌ API returned error:', result);
        setMessage(`Error: ${result.error || 'Failed to complete analysis'}`);
        setIsExtracting(false);
      }
    } catch (error: any) {
      console.error('❌ Error in VoC analysis:', error);
      setMessage(`Error: ${error.message || 'Failed to connect to VoC extraction service'}`);
      setIsExtracting(false);
    }
    
    setTimeout(() => setMessage(''), 5000);
  };

  /**
   * Clear all analysis data
   * Why this matters: Allows users to start fresh with a new analysis.
   */
  const handleClearAll = () => {
    // Reset all state
    const freshVoCKit: VoCKit = {
      painPoints: {},
      customVariables: vocKit.customVariables, // Keep custom variables
      lastUpdated: new Date().toISOString(),
      hasGeneratedAnalysis: false,
      extractedPainPoints: []
    };
    
    setVoCKit(freshVoCKit);
    setExtractedPainPoints([]);
    setHasGeneratedAnalysis(false);
    setIsExtracting(false);
    setShowClearModal(false);
    
    // Clear from localStorage
    try {
      localStorage.setItem('apollo_voc_kit', JSON.stringify(freshVoCKit));
      localStorage.removeItem('apollo_voc_kit_draft');
      window.dispatchEvent(new CustomEvent('apollo-voc-kit-updated'));
      console.log('✅ VoC analysis cleared successfully');
    } catch (error) {
      console.error('Failed to clear VoC analysis:', error);
    }
    
    setMessage('All analysis data cleared. You can now extract fresh pain points.');
    setTimeout(() => setMessage(''), 3000);
  };

  /**
   * Save VoC Kit permanently
   * Why this matters: Saves the current configuration as the official VoC Kit.
   */
  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('apollo_voc_kit', JSON.stringify(vocKit));
      localStorage.removeItem('apollo_voc_kit_draft');
      
      window.dispatchEvent(new CustomEvent('apollo-voc-kit-updated'));
      
      setMessage('VoC Kit saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving VoC Kit');
      console.error('Error saving VoC Kit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Add custom variable
   * Why this matters: Allows users to add additional pain point variables manually.
   */
  const addCustomVariable = () => {
    if (newVariableName.trim()) {
      const snakeCaseName = toSnakeCase(newVariableName.trim());
      const liquidSyntax = `{{ pain_points.${snakeCaseName} }}`;
      
      setVoCKit(prev => ({
        ...prev,
        customVariables: {
          ...prev.customVariables,
          [snakeCaseName]: liquidSyntax
        }
      }));
      setNewVariableName('');
      setNewVariableValue('');
    }
  };

  /**
   * Remove custom variable
   * Why this matters: Provides cleanup functionality for custom variables.
   */
  const removeCustomVariable = (key: string) => {
    setVoCKit(prev => {
      const { [key]: removed, ...rest } = prev.customVariables;
      return {
        ...prev,
        customVariables: rest
      };
    });
  };

  /**
   * Get severity color
   * Why this matters: Visual indication of pain point severity for priority.
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
   * Why this matters: Provides transparency by showing all quote sources in one organized view.
   */
  const showExcerpts = (painPoint: VoCPainPoint) => {
    setShowExcerptModal({ painPoint });
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

      <div className="voc-kit-page" style={{ 
        padding: '2rem', 
        maxWidth: '75rem', 
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: '#111827' }}>
            Voice of Customer Kit
          </h1>
        </div>

        {/* Extract Pain Points Section */}
        <div style={{ 
          border: '0.125rem solid #B8B0E8', 
          borderRadius: '0.75rem', 
          padding: '1.5rem',
          backgroundColor: '#E0DBFF',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <RefreshCw size={24} style={{ color: '#3b82f6' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1e40af' }}>
              Extract Customer Pain Points
            </h3>
          </div>
          
          <p style={{ 
            color: '#374151', 
            marginBottom: '1rem', 
            lineHeight: '1.5',
            fontSize: '0.875rem'
          }}>
            Pain points are extracted and analyzed directly from Gong call summaries using AI. Each theme represents patterns found across multiple customer conversations. Customer quotes are real excerpts from call summaries.
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={extractPainPoints}
              disabled={isExtracting || hasGeneratedAnalysis}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: (isExtracting || hasGeneratedAnalysis) ? '#9ca3af' : '#EBF212',
                color: (isExtracting || hasGeneratedAnalysis) ? 'white' : 'black',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: (isExtracting || hasGeneratedAnalysis) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: hasGeneratedAnalysis ? 0.6 : 1
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
                  Analyzing Calls...
                </>
              ) : hasGeneratedAnalysis ? (
                <>
                  <CheckCircle size={16} strokeWidth={3} />
                  Analysis Complete
                </>
              ) : (
                <>
                  <RefreshCw size={16} strokeWidth={3} />
                  Extract Pain Points
                </>
              )}
            </button>



            {hasGeneratedAnalysis && (
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
            )}

            {vocKit.analysisMetadata && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <span>🎯 {vocKit.analysisMetadata.totalPainPoints} pain points categories detected</span>
                <span>📞 {vocKit.analysisMetadata.callsAnalyzed} calls analyzed</span>
                <span>📅 {new Date(vocKit.analysisMetadata.analysisDate).toLocaleDateString()}</span>
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

        {/* CTA Creator Link */}
        {hasGeneratedAnalysis && (
          <div style={{ 
            backgroundColor: 'white', 
            border: '0.0625rem solid #f3f4f6', 
            borderRadius: '0.75rem', 
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
              🎯 Ready for CTA Generation
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Customer pain points are extracted and ready! Use the CTA Creator to generate 
              hyper-relevant CTAs from any article URL using Voice of Customer insights.
            </p>

            <a 
              href="/cta-creator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.5rem',
                backgroundColor: '#EBF212',
                color: 'black',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#d4e017';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#EBF212';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ✨ Go to CTA Creator
              <span style={{ fontSize: '1rem' }}>→</span>
            </a>
          </div>
        )}

        {/* Extracted Pain Points Display */}
        {hasGeneratedAnalysis && extractedPainPoints.length > 0 && (
          <div style={{ 
            backgroundColor: 'white', 
            border: '0.0625rem solid #f3f4f6', 
            borderRadius: '0.75rem', 
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: '#374151' }}>
              Extracted Pain Points
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {extractedPainPoints.map((painPoint, index) => (
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
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: '600', margin: 0, color: '#374151' }}>
                      {painPoint.theme}
                    </h4>

                    <span style={{ 
                      fontSize: '0.8125rem', 
                      backgroundColor: '#dcfce7', 
                      padding: '0.125rem 0.375rem', 
                      borderRadius: '0.25rem',
                      color: '#16a34a',
                      fontWeight: '500'
                    }}>
                      ✓ Gong Verified
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

                  {/* Validation Metadata */}
                  <div style={{ marginBottom: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {vocKit.analysisMetadata && (
                      <>
                        {/* View Call Excerpt Button */}
                        {painPoint.sourceExcerpts && painPoint.sourceExcerpts.length > 0 ? (
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
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#dbeafe';
                              e.currentTarget.style.borderColor = '#bfdbfe';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#eff6ff';
                              e.currentTarget.style.borderColor = '#dbeafe';
                            }}
                          >
                            <Search size={10} strokeWidth={2} />
                            View call excerpt
                          </button>
                        ) : (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            backgroundColor: '#e0f2fe', 
                            padding: '0.125rem 0.25rem', 
                            borderRadius: '0.1875rem',
                            color: '#0369a1'
                          }}>
                            📞 {vocKit.analysisMetadata.callsAnalyzed} calls
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  

                </div>
              ))}
            </div>
          </div>
        )}





        {/* CTA Creator Link */}
        {hasGeneratedAnalysis && (
          <div style={{ 
            backgroundColor: 'white', 
            border: '0.0625rem solid #f3f4f6', 
            borderRadius: '0.75rem', 
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
              🎯 Ready for CTA Generation
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Customer pain points are extracted and ready! Use the CTA Creator to generate 
              hyper-relevant CTAs using Voice of Customer insights.
            </p>

            <a 
              href="/cta-creator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.5rem',
                backgroundColor: '#EBF212',
                color: 'black',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#d4e017';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#EBF212';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ✨ Go to CTA Creator
              <span style={{ fontSize: '1rem' }}>→</span>
            </a>
          </div>
        )}

      </div>

      {/* Call Excerpt Modal */}
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
                    borderRadius: '0.25rem',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#374151'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
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
                      {/* Call Header */}
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

                      {/* Extracted Quote */}
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

                      {/* Full Context */}
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
                  <p style={{ fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                    This might be from an analysis before source tracking was enabled.
                  </p>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertCircle size={24} style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#374151' }}>
                Clear All Analysis Data?
              </h3>
            </div>
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              This will permanently delete all extracted pain points, analysis results, and validation data. 
              Your custom variables will be preserved. This action cannot be undone.
            </p>

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


    </>
  );
};

export default VoCKitPage;