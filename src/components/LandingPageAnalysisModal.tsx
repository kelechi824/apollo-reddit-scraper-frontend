import React, { useState, useEffect, useRef } from 'react';
import { X, Globe, Camera, Copy, Check, ExternalLink, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { LandingPageAnalysisRequest, LandingPageAnalysisResult, GongAnalyzedCall } from '../types';

interface LandingPageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  callInsights: GongAnalyzedCall[];
}

/**
 * Landing Page Analysis Modal Component
 * Why this matters: Combines call insights with live landing page analysis to generate
 * actionable CRO recommendations and Google Ads content based on real customer conversations.
 */
const LandingPageAnalysisModal: React.FC<LandingPageAnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  callInsights 
}) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LandingPageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'headlines' | 'descriptions'>('recommendations');
  const urlInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate URL format
   * Why this matters: Ensures users enter valid URLs before attempting analysis.
   */
  const isValidUrl = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  /**
   * Analyze landing page with call insights
   * Why this matters: Combines customer conversation insights with live page content
   * to generate specific CRO recommendations and Google Ads content.
   */
  const analyzeLandingPage = async () => {
    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const request: LandingPageAnalysisRequest = {
        url: url.trim(),
        callInsights: callInsights
      };

      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003';
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/gong-analysis/analyze-landing-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze landing page');
      }

      const result: LandingPageAnalysisResult = await response.json();
      setAnalysisResult(result);
      setActiveTab('recommendations');
    } catch (error) {
      console.error('Error analyzing landing page:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze landing page');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Handle copying content to clipboard
   * Why this matters: Allows users to easily copy Google Ads content for immediate use.
   */
  const handleCopyToClipboard = async (content: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      
      // Show copied message
      setShowCopiedMessage(itemId);
      
      // Hide copied message after 2 seconds
      setTimeout(() => {
        setShowCopiedMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setShowCopiedMessage(itemId);
        setTimeout(() => {
          setShowCopiedMessage(null);
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  /**
   * Handle Enter key for URL input
   * Why this matters: Provides intuitive UX for starting analysis.
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      analyzeLandingPage();
    }
  };

  /**
   * Reset modal state when opening
   * Why this matters: Ensures clean state for each new analysis session.
   */
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setAnalysisResult(null);
      setError(null);
      setShowCopiedMessage(null);
      setActiveTab('recommendations');
      // Focus URL input after modal animation
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  /**
   * Handle ESC key to close modal
   * Why this matters: Standard modal behavior for accessibility.
   */
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`dig-deeper-modal-backdrop ${isOpen ? 'open' : ''}`}
        style={{
          visibility: isOpen ? 'visible' : 'hidden'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`dig-deeper-modal ${isOpen ? 'open' : ''}`}
        style={{
          visibility: isOpen ? 'visible' : 'hidden',
          width: '90vw',
          maxWidth: '75rem',
          height: '90vh'
        }}
      >
        
        {/* Header */}
        <div className="dig-deeper-modal-header">
          <div className="dig-deeper-modal-header-top">
            <div className="dig-deeper-modal-branding">
              <div className="dig-deeper-modal-logo">
                <img src="/apollo logo only.png" alt="Apollo" />
              </div>
              <div>
                <h2 className="dig-deeper-modal-title">Landing Page CRO Analysis</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="dig-deeper-modal-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Context Info */}
          <div className="dig-deeper-modal-context">
            <h3 className="dig-deeper-modal-context-title">Analyzing landing page with insights from {callInsights.length} call(s)</h3>
            <div className="dig-deeper-modal-context-meta">
              <span className="dig-deeper-modal-badge">
                <Target className="w-3 h-3 mr-1" />
                CRO Analysis
              </span>
              <span className="dig-deeper-modal-stage">
                Real Customer Insights Applied
              </span>
            </div>
          </div>
        </div>

        {/* URL Input Section */}
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Globe className="w-5 h-5 text-gray-500" />
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter landing page URL (e.g., https://example.com/landing-page)"
              disabled={isAnalyzing}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#EBF212';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
            />
            <button
              onClick={analyzeLandingPage}
              disabled={!url.trim() || isAnalyzing}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#EBF212',
                color: '#000',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                opacity: (!url.trim() || isAnalyzing) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
            >
              {isAnalyzing ? (
                <>
                  <div className="loading-spinner loading-spinner-sm"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Analyze Page
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Analysis Results */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          overflow: 'hidden' 
        }}>
          
          {/* Screenshot Section */}
          {analysisResult && (
            <div style={{ 
              width: '40%', 
              borderRight: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ 
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Camera className="w-4 h-4" />
                  Page Screenshot
                </h3>
                <p style={{ 
                  margin: '0.25rem 0 0 0', 
                  fontSize: '0.875rem', 
                  color: '#6b7280' 
                }}>
                  {analysisResult.url}
                </p>
              </div>
              <div style={{ 
                flex: 1, 
                padding: '1rem',
                overflow: 'auto'
              }}>
                <img
                  src={`data:image/png;base64,${analysisResult.screenshot}`}
                  alt="Landing page screenshot"
                  style={{
                    width: '100%',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <a
                  href={analysisResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live Page
                </a>
              </div>
            </div>
          )}

          {/* CRO Recommendations Section */}
          {analysisResult && (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              
              {/* Tab Navigation */}
              <div style={{ 
                display: 'flex', 
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: 'none',
                    backgroundColor: activeTab === 'recommendations' ? '#ffffff' : 'transparent',
                    borderBottom: activeTab === 'recommendations' ? '2px solid #EBF212' : '2px solid transparent',
                    fontWeight: activeTab === 'recommendations' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Lightbulb className="w-4 h-4" />
                  CRO Recommendations
                </button>
                <button
                  onClick={() => setActiveTab('headlines')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: 'none',
                    backgroundColor: activeTab === 'headlines' ? '#ffffff' : 'transparent',
                    borderBottom: activeTab === 'headlines' ? '2px solid #EBF212' : '2px solid transparent',
                    fontWeight: activeTab === 'headlines' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <TrendingUp className="w-4 h-4" />
                  Google Ads Headlines
                </button>
                <button
                  onClick={() => setActiveTab('descriptions')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: 'none',
                    backgroundColor: activeTab === 'descriptions' ? '#ffffff' : 'transparent',
                    borderBottom: activeTab === 'descriptions' ? '2px solid #EBF212' : '2px solid transparent',
                    fontWeight: activeTab === 'descriptions' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Target className="w-4 h-4" />
                  Ad Descriptions
                </button>
              </div>

              {/* Tab Content */}
              <div style={{ 
                flex: 1, 
                padding: '1.5rem',
                overflow: 'auto'
              }}>
                
                {/* CRO Recommendations Tab */}
                {activeTab === 'recommendations' && (
                  <div>
                    <h3 style={{ 
                      margin: '0 0 1rem 0', 
                      fontSize: '1.125rem', 
                      fontWeight: '600' 
                    }}>
                      Landing Page Improvements
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* Headline Improvements */}
                      <div>
                        <h4 style={{ 
                          margin: '0 0 0.75rem 0', 
                          fontSize: '1rem', 
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          Headline Improvements
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {analysisResult.croRecommendations.headlineImprovements.map((improvement, index) => (
                            <div
                              key={index}
                              style={{
                                padding: '0.75rem',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                              }}
                            >
                              {improvement}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Copy Improvements */}
                      <div>
                        <h4 style={{ 
                          margin: '0 0 0.75rem 0', 
                          fontSize: '1rem', 
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          Copy Improvements
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {analysisResult.croRecommendations.copyImprovements.map((improvement, index) => (
                            <div
                              key={index}
                              style={{
                                padding: '0.75rem',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                              }}
                            >
                              {improvement}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conversion Optimizations */}
                      <div>
                        <h4 style={{ 
                          margin: '0 0 0.75rem 0', 
                          fontSize: '1rem', 
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          Conversion Optimizations
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {analysisResult.croRecommendations.conversionOptimizations.map((optimization, index) => (
                            <div
                              key={index}
                              style={{
                                padding: '0.75rem',
                                backgroundColor: '#fefce8',
                                border: '1px solid #fde047',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                              }}
                            >
                              {optimization}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Ads Headlines Tab */}
                {activeTab === 'headlines' && (
                  <div>
                    <h3 style={{ 
                      margin: '0 0 1rem 0', 
                      fontSize: '1.125rem', 
                      fontWeight: '600' 
                    }}>
                      Google Ads Headlines ({analysisResult.croRecommendations.googleAdsVariations.headlines.length})
                    </h3>
                    <p style={{ 
                      margin: '0 0 1.5rem 0', 
                      fontSize: '0.875rem', 
                      color: '#6b7280' 
                    }}>
                      Headlines based on customer language from your calls. Click to copy individual headlines.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {analysisResult.croRecommendations.googleAdsVariations.headlines.map((headline, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '1rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                            e.currentTarget.style.borderColor = '#EBF212';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '500',
                              fontSize: '0.875rem',
                              marginBottom: '0.25rem'
                            }}>
                              Headline {index + 1}
                            </div>
                            <div style={{ fontSize: '1rem' }}>
                              {headline}
                            </div>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => handleCopyToClipboard(headline, `headline-${index}`)}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#EBF212',
                                color: '#000',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '500',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                            {showCopiedMessage === `headline-${index}` && (
                              <div style={{
                                position: 'absolute',
                                right: '0',
                                top: '100%',
                                marginTop: '0.5rem',
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                zIndex: 10
                              }}>
                                <Check className="w-3 h-3" />
                                Copied!
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Ads Descriptions Tab */}
                {activeTab === 'descriptions' && (
                  <div>
                    <h3 style={{ 
                      margin: '0 0 1rem 0', 
                      fontSize: '1.125rem', 
                      fontWeight: '600' 
                    }}>
                      Google Ads Descriptions ({analysisResult.croRecommendations.googleAdsVariations.descriptions.length})
                    </h3>
                    <p style={{ 
                      margin: '0 0 1.5rem 0', 
                      fontSize: '0.875rem', 
                      color: '#6b7280' 
                    }}>
                      Descriptions that flow together when combined with headlines. Based on authentic customer language.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {analysisResult.croRecommendations.googleAdsVariations.descriptions.map((description, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '1rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                            e.currentTarget.style.borderColor = '#EBF212';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '500',
                              fontSize: '0.875rem',
                              marginBottom: '0.25rem'
                            }}>
                              Description {index + 1}
                            </div>
                            <div style={{ fontSize: '1rem' }}>
                              {description}
                            </div>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => handleCopyToClipboard(description, `description-${index}`)}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#EBF212',
                                color: '#000',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '500',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                            {showCopiedMessage === `description-${index}` && (
                              <div style={{
                                position: 'absolute',
                                right: '0',
                                top: '100%',
                                marginTop: '0.5rem',
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                zIndex: 10
                              }}>
                                <Check className="w-3 h-3" />
                                Copied!
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!analysisResult && !isAnalyzing && (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <Globe className="w-16 h-16 text-gray-300 mb-4" />
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Analyze Your Landing Page
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '1rem', 
                color: '#6b7280',
                maxWidth: '32rem'
              }}>
                Enter a URL above to analyze your landing page with insights from {callInsights.length} customer call(s).
                Get CRO recommendations and Google Ads content based on real customer conversations.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LandingPageAnalysisModal; 