import React, { useState, useEffect } from 'react';
import { ExternalLink, Zap, Target, Sparkles, CheckCircle, AlertCircle, ArrowRight, Copy, Download } from 'lucide-react';

interface CTAVariant {
  position: 'beginning' | 'middle' | 'end';
  cta: {
    category_header: string;
    headline: string;
    description: string;
    action_button: string;
  };
  strategy: string;
  shortcode: string;
}

interface CTAGenerationResult {
  persona: string;
  matched_pain_points: number;
  cta_variants: {
    beginning: CTAVariant;
    middle: CTAVariant;
    end: CTAVariant;
  };
  pain_point_context: {
    primary_pain_points: string[];
    customer_quotes_used: string[];
    liquid_variables_referenced: string[];
  };
  generation_metadata: {
    confidence_score: number;
    generation_timestamp: string;
    model_used: string;
    cro_principles_applied: string[];
  };
  pipeline_metadata?: {
    processing_time_ms: number;
    stages_completed: number;
    article_word_count: number;
    enhanced_analysis_used: boolean;
  };
}

/**
 * CTA Creator Page Component
 * Why this matters: Provides a dedicated, streamlined interface for CRO Managers to generate
 * hyper-relevant CTAs from article URLs using Voice of Customer insights.
 */
const CTACreatorPage: React.FC = () => {
  const [articleUrl, setArticleUrl] = useState('');
  const [enhancedAnalysis, setEnhancedAnalysis] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [generatedCTAs, setGeneratedCTAs] = useState<CTAGenerationResult | null>(null);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [showPreview, setShowPreview] = useState<string>('');

  /**
   * Check if VoC Kit is configured
   * Why this matters: Ensures pain points are extracted before CTA generation.
   */
  const [vocKitReady, setVocKitReady] = useState(false);
  const [painPointsCount, setPainPointsCount] = useState(0);

  useEffect(() => {
    // Check VoC Kit status
    const checkVocKit = () => {
      try {
        const vocKit = localStorage.getItem('apollo_voc_kit');
        if (vocKit) {
          const parsedKit = JSON.parse(vocKit);
          const hasAnalysis = parsedKit.hasGeneratedAnalysis && parsedKit.extractedPainPoints?.length > 0;
          setVocKitReady(hasAnalysis);
          setPainPointsCount(parsedKit.extractedPainPoints?.length || 0);
        }
      } catch (error) {
        console.error('Error checking VoC Kit status:', error);
      }
    };

    checkVocKit();
    
    // Listen for VoC Kit updates
    const handleVocUpdate = () => checkVocKit();
    window.addEventListener('apollo-voc-kit-updated', handleVocUpdate);
    
    return () => window.removeEventListener('apollo-voc-kit-updated', handleVocUpdate);
  }, []);

  /**
   * Generate CTAs from article URL
   * Why this matters: Executes the complete pipeline to create hyper-relevant CTAs.
   */
  const generateCTAs = async () => {
    if (!articleUrl.trim()) {
      setError('Please enter an article URL');
      return;
    }

    if (!vocKitReady) {
      setError('Please extract customer pain points in VoC Kit first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedCTAs(null);
    setGenerationStage('Extracting article content...');

    try {
      const response = await fetch('http://localhost:3003/api/cta-generation/generate-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: articleUrl,
          enhanced_analysis: enhancedAnalysis
        }),
      });

      // Simulate stage updates for better UX
      setTimeout(() => setGenerationStage('Analyzing content and detecting personas...'), 1000);
      setTimeout(() => setGenerationStage('Matching to customer pain points...'), 2000);
      setTimeout(() => setGenerationStage('Generating hyper-relevant CTAs...'), 3000);

      const result = await response.json();

      if (result.success) {
        setGeneratedCTAs(result.data);
        setGenerationStage('');
      } else {
        setError(result.error || 'Failed to generate CTAs');
      }
    } catch (error: any) {
      console.error('Error generating CTAs:', error);
      setError('Failed to connect to CTA generation service');
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  /**
   * Copy shortcode to clipboard
   * Why this matters: Enables easy copying of generated shortcodes for article injection.
   */
  const copyToClipboard = async (text: string, position: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(position);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Parse and render shortcode for testing
   * Why this matters: Allows CRO Managers to see exactly how the shortcode will appear when rendered.
   */
  const parseShortcode = (shortcode: string) => {
    // Extract content between shortcode tags using regex
    const categoryMatch = shortcode.match(/\[cta-category\](.*?)\[\/cta-category\]/);
    const headlineMatch = shortcode.match(/\[cta-headline\](.*?)\[\/cta-headline\]/);
    const descriptionMatch = shortcode.match(/\[cta-description\](.*?)\[\/cta-description\]/);
    const actionMatch = shortcode.match(/\[cta-action\](.*?)\[\/cta-action\]/);
    
    return {
      category: categoryMatch ? categoryMatch[1] : '',
      headline: headlineMatch ? headlineMatch[1] : '',
      description: descriptionMatch ? descriptionMatch[1] : '',
      action: actionMatch ? actionMatch[1] : ''
    };
  };

  /**
   * Download all CTAs as a text file
   * Why this matters: Provides a convenient way to save all generated CTAs.
   */
  const downloadCTAs = () => {
    if (!generatedCTAs) return;

    const content = `
# Generated CTAs for ${generatedCTAs.persona}
Generated on: ${new Date(generatedCTAs.generation_metadata.generation_timestamp).toLocaleString()}
Confidence Score: ${generatedCTAs.generation_metadata.confidence_score}%
Pain Points Matched: ${generatedCTAs.matched_pain_points}

## Beginning CTA (Awareness Strategy)
Category: ${generatedCTAs.cta_variants.beginning.cta.category_header}
Headline: ${generatedCTAs.cta_variants.beginning.cta.headline}
Description: ${generatedCTAs.cta_variants.beginning.cta.description}
Action: ${generatedCTAs.cta_variants.beginning.cta.action_button}

Shortcode:
${generatedCTAs.cta_variants.beginning.shortcode}

## Middle CTA (Consideration Strategy)
Category: ${generatedCTAs.cta_variants.middle.cta.category_header}
Headline: ${generatedCTAs.cta_variants.middle.cta.headline}
Description: ${generatedCTAs.cta_variants.middle.cta.description}
Action: ${generatedCTAs.cta_variants.middle.cta.action_button}

Shortcode:
${generatedCTAs.cta_variants.middle.shortcode}

## End CTA (Conversion Strategy)
Category: ${generatedCTAs.cta_variants.end.cta.category_header}
Headline: ${generatedCTAs.cta_variants.end.cta.headline}
Description: ${generatedCTAs.cta_variants.end.cta.description}
Action: ${generatedCTAs.cta_variants.end.cta.action_button}

Shortcode:
${generatedCTAs.cta_variants.end.shortcode}

## Pain Point Context
Primary Pain Points: ${generatedCTAs.pain_point_context.primary_pain_points.join(', ')}
Customer Quotes Used: ${generatedCTAs.pain_point_context.customer_quotes_used.join(' | ')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ctas-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '80rem', 
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              padding: '0.5rem',
              backgroundColor: '#EBF212',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={24} style={{ color: 'black' }} />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, color: '#0f172a' }}>
              CTA Creator
            </h1>
          </div>
          <p style={{ 
            fontSize: '1.125rem', 
            color: '#64748b', 
            margin: '0 auto',
            maxWidth: '48rem'
          }}>
            Generate hyper-relevant CTAs that convert using Apollo's Voice of Customer insights. Input any article URL and get position-optimized CTAs with actual customer language.
          </p>
        </div>

        {/* VoC Kit Status Check */}
        {!vocKitReady && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <AlertCircle size={24} style={{ color: '#d97706' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: '#92400e' }}>
                VoC Kit Setup Required
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                Please extract customer pain points in the VoC Kit before generating CTAs.
              </p>
            </div>
            <a 
              href="/voc-kit" 
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#d97706',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Go to VoC Kit
              <ArrowRight size={16} />
            </a>
          </div>
        )}

        {vocKitReady && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#dcfce7',
            border: '1px solid #22c55e',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <CheckCircle size={20} style={{ color: '#16a34a' }} />
            <span style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: '500' }}>
              VoC Kit ready with {painPointsCount} customer pain points
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: generatedCTAs ? '1fr 1fr' : '1fr', gap: '3rem' }}>
          {/* Input Section */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Sparkles size={24} style={{ color: '#3b82f6' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: '#1e293b' }}>
                Article Analysis
              </h2>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Article URL
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  placeholder="https://example.com/article-about-sales"
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    paddingLeft: '2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: isGenerating ? '#f9fafb' : 'white',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <ExternalLink 
                  size={16} 
                  style={{ 
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox" 
                  checked={enhancedAnalysis}
                  onChange={(e) => setEnhancedAnalysis(e.target.checked)}
                  disabled={isGenerating}
                  style={{ cursor: 'pointer' }}
                />
                Enhanced persona analysis
              </label>
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                margin: '0.25rem 0 0 1.5rem',
                lineHeight: '1.4'
              }}>
                Provides deeper buying context and sophisticated persona insights for better CTA targeting
              </p>
            </div>

            <button
              onClick={generateCTAs}
              disabled={isGenerating || !articleUrl.trim() || !vocKitReady}
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                backgroundColor: (isGenerating || !articleUrl.trim() || !vocKitReady) ? '#9ca3af' : '#EBF212',
                color: (isGenerating || !articleUrl.trim() || !vocKitReady) ? 'white' : 'black',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: (isGenerating || !articleUrl.trim() || !vocKitReady) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.2s ease'
              }}
            >
              {isGenerating ? (
                <>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '0.125rem solid transparent',
                    borderTop: '0.125rem solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Generating CTAs...
                </>
              ) : (
                <>
                  <Zap size={20} strokeWidth={3} />
                  Generate Hyper-Relevant CTAs
                </>
              )}
            </button>

            {generationStage && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#eff6ff',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#1d4ed8',
                textAlign: 'center'
              }}>
                {generationStage}
              </div>
            )}

            {error && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          {/* Results Section */}
          {generatedCTAs && (
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              {/* Results Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: '#1e293b' }}>
                    Generated CTAs
                  </h2>
                  <button
                    onClick={downloadCTAs}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Download size={16} />
                    Download All
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    backgroundColor: '#f3f4f6',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.375rem'
                  }}>
                    👤 {generatedCTAs.persona}
                  </span>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: '#16a34a',
                    backgroundColor: '#dcfce7',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.375rem'
                  }}>
                    🎯 {generatedCTAs.generation_metadata.confidence_score}% confidence
                  </span>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: '#0369a1',
                    backgroundColor: '#e0f2fe',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.375rem'
                  }}>
                    📊 {generatedCTAs.matched_pain_points} pain points
                  </span>
                </div>
              </div>

              {/* CTA Variants */}
              <div style={{ display: 'grid', gap: '2rem' }}>
                {Object.entries(generatedCTAs.cta_variants).map(([position, ctaData]) => (
                  <div key={position} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    backgroundColor: '#fafafa'
                  }}>
                    {/* Position Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: position === 'beginning' ? '#dbeafe' : position === 'middle' ? '#fef3c7' : '#dcfce7',
                          color: position === 'beginning' ? '#1e40af' : position === 'middle' ? '#b45309' : '#16a34a',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {position}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {ctaData.strategy} strategy
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setShowPreview(showPreview === position ? '' : position)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: showPreview === position ? '#fef3c7' : '#f1f5f9',
                            color: showPreview === position ? '#b45309' : '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <ExternalLink size={12} />
                          {showPreview === position ? 'Hide Test' : 'Test Shortcode'}
                        </button>
                        
                        <button
                          onClick={() => copyToClipboard(ctaData.shortcode, position)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: copySuccess === position ? '#dcfce7' : '#f1f5f9',
                            color: copySuccess === position ? '#16a34a' : '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {copySuccess === position ? (
                            <>
                              <CheckCircle size={12} />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copy Code
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CTA Preview */}
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '1.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        color: '#374151',
                        marginBottom: '0.5rem',
                        letterSpacing: '0.05em'
                      }}>
                        {ctaData.cta.category_header}
                      </div>

                      <h4 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '700', 
                        color: '#111827',
                        margin: '0 0 0.75rem 0',
                        lineHeight: '1.3'
                      }}>
                        {ctaData.cta.headline}
                      </h4>

                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#4b5563',
                        lineHeight: '1.5',
                        margin: '0 0 1rem 0'
                      }}>
                        {ctaData.cta.description}
                      </p>

                      <div style={{
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#EBF212',
                        color: 'black',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '700'
                      }}>
                        {ctaData.cta.action_button}
                      </div>
                    </div>

                    {/* Shortcode Test Preview */}
                    {showPreview === position && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                          🧪 Shortcode Test Preview:
                        </div>
                        <div style={{
                          backgroundColor: '#fff7ed',
                          border: '2px solid #fed7aa',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '-0.5rem',
                            left: '1rem',
                            backgroundColor: '#ea580c',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            LIVE PREVIEW
                          </div>
                          
                          {(() => {
                            const parsed = parseShortcode(ctaData.shortcode);
                            return (
                              <div style={{ marginTop: '0.5rem' }}>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  fontWeight: '700', 
                                  color: '#374151',
                                  marginBottom: '0.5rem',
                                  letterSpacing: '0.05em'
                                }}>
                                  {parsed.category}
                                </div>

                                <h4 style={{ 
                                  fontSize: '1.25rem', 
                                  fontWeight: '700', 
                                  color: '#111827',
                                  margin: '0 0 0.75rem 0',
                                  lineHeight: '1.3'
                                }}>
                                  {parsed.headline}
                                </h4>

                                <p style={{ 
                                  fontSize: '0.875rem', 
                                  color: '#4b5563',
                                  lineHeight: '1.5',
                                  margin: '0 0 1rem 0'
                                }}>
                                  {parsed.description}
                                </p>

                                <div style={{
                                  display: 'inline-block',
                                  padding: '0.75rem 1.5rem',
                                  backgroundColor: '#EBF212',
                                  color: 'black',
                                  borderRadius: '0.5rem',
                                  fontSize: '0.875rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
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
                                  {parsed.action}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginTop: '0.5rem',
                          fontStyle: 'italic'
                        }}>
                          ☝️ This is exactly how your shortcode will appear when rendered on the website
                        </div>
                      </div>
                    )}

                    {/* Shortcode */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        Shortcode:
                      </div>
                      <div style={{
                        backgroundColor: '#f3f4f6',
                        padding: '0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color: '#374151',
                        whiteSpace: 'pre-wrap',
                        border: '1px solid #e5e7eb',
                        maxHeight: '6rem',
                        overflow: 'auto'
                      }}>
                        {ctaData.shortcode}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pain Point Context */}
              <div style={{ 
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: '0 0 0.75rem 0' }}>
                  📊 Customer Insights Used
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Primary Pain Points:
                    </div>
                    <ul style={{ fontSize: '0.75rem', color: '#4b5563', margin: 0, paddingLeft: '1rem' }}>
                      {generatedCTAs.pain_point_context.primary_pain_points.map((point: string, idx: number) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Customer Language Used:
                    </div>
                    <ul style={{ fontSize: '0.75rem', color: '#4b5563', margin: 0, paddingLeft: '1rem' }}>
                      {generatedCTAs.pain_point_context.customer_quotes_used.slice(0, 3).map((quote: string, idx: number) => (
                        <li key={idx} style={{ fontStyle: 'italic' }}>"{quote}"</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Processing Stats */}
        {generatedCTAs?.pipeline_metadata && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              ⚡ {generatedCTAs.pipeline_metadata.processing_time_ms}ms processing
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              📝 {generatedCTAs.pipeline_metadata.article_word_count} words analyzed
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              🔬 {generatedCTAs.pipeline_metadata.enhanced_analysis_used ? 'Enhanced' : 'Basic'} analysis
            </span>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CTACreatorPage;
