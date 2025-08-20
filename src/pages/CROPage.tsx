import React, { useState, useEffect } from 'react';
import { Search, Zap, AlertCircle, Clock, ExternalLink, TrendingUp, Target, MessageSquare } from 'lucide-react';
import { CROAnalysisResponse, CopyAnalysisResult } from '../types';
import { API_BASE_URL, buildApiUrl } from '../config/api';
import { makeApiRequest } from '../utils/apiHelpers';

const CROPage: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentResults, setCurrentResults] = useState<CopyAnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [screenshotId, setScreenshotId] = useState<string>('');
  // Determine backend URL based on environment
// Why this matters: Ensures production deployments use the correct backend URL
const apiUrl = API_BASE_URL;

  /**
   * Load saved CRO results from localStorage on component mount
   * Why this matters: Preserves user's analysis results when they navigate away and come back
   */
  useEffect(() => {
    const savedResults = localStorage.getItem('apollo-cro-results');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults) as CopyAnalysisResult;
        setCurrentResults(parsedResults);
        setUrl(parsedResults.url);
      } catch (error) {
        console.error('Failed to parse saved CRO results:', error);
        localStorage.removeItem('apollo-cro-results');
      }
    }
  }, []);

  /**
   * Validate URL format
   * Why this matters: Ensures we don't make API calls with invalid URLs
   */
  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Handle CRO analysis request
   * Why this matters: Orchestrates the analysis request and handles the complete workflow
   */
  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to analyze');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (including https://)');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const requestData = {
        url: url.trim(),
        includeScreenshot: true
      };
      
      console.log('🔍 CRO Analysis request:', requestData);
      console.log('📡 API URL:', buildApiUrl('/api/cro/analyze'));
      
      const result = await makeApiRequest<CROAnalysisResponse>(
        buildApiUrl('/api/cro/analyze'),
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );

      console.log('📡 API result:', result);
      
      if (!result.success) {
        throw new Error(result.error || result.message || 'Analysis failed');
      }

      const data = result.data!;
      console.log('✅ Analysis response:', data);
      
      if (data.success) {
        setCurrentResults(data.analysis);
        setScreenshotId(data.screenshot?.id || '');
        
        // Save results to localStorage
        localStorage.setItem('apollo-cro-results', JSON.stringify(data.analysis));
      } else {
        throw new Error('Analysis was not successful');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Clear current analysis results
   * Why this matters: Allows users to reset the interface and start fresh
   */
  const handleClearResults = () => {
    setCurrentResults(null);
    setScreenshotId('');
    setUrl('');
    localStorage.removeItem('apollo-cro-results');
  };

  /**
   * Handle Enter key press in URL input
   * Why this matters: Provides intuitive keyboard navigation expected by users
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleAnalyze();
    }
  };

  /**
   * Get category display name for pain points
   * Why this matters: Converts backend category codes to user-friendly labels
   */
  const getCategoryDisplayName = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      manual_tasks: 'Manual Tasks',
      data_quality: 'Data Quality',
      deliverability: 'Deliverability',
      compliance: 'Compliance',
      integration: 'Integration',
      cost: 'Cost',
      other: 'Other'
    };
    return categoryMap[category] || category;
  };

  /**
   * Get emotional trigger color for UI styling
   * Why this matters: Visual coding helps users quickly identify emotional contexts
   */
  const getEmotionalTriggerColor = (trigger: string): string => {
    const colorMap: { [key: string]: string } = {
      frustration: 'text-red-600',
      anxiety: 'text-orange-600', 
      excitement: 'text-green-600',
      relief: 'text-blue-600',
      fear: 'text-purple-600',
      neutral: 'text-gray-600'
    };
    return colorMap[trigger] || 'text-gray-600';
  };

  /**
   * Get impact badge styling
   * Why this matters: Provides visual hierarchy for recommendation priority
   */
  const getImpactBadgeClass = (impact: string): string => {
    const impactMap: { [key: string]: string } = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return impactMap[impact] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="home-layout">
      {/* Left Analysis Section */}
      <div className="analysis-section">
        <div className="analysis-card">
          <div className="analysis-header">
            <div className="header-icon">
              <TrendingUp className="icon-lg" />
            </div>
            <div>
              <h2>Conversion Rate Optimizer</h2>
              <p className="subtitle">Analyze landing pages against real customer pain points from sales calls</p>
            </div>
          </div>

          <div className="input-section">
            <div className="form-group">
              <label htmlFor="url-input" className="form-label">Landing Page URL</label>
              <div className="input-container">
                <Search className="input-icon" />
                <input
                  id="url-input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://example.com"
                  className="apollo-input"
                  disabled={isAnalyzing}
                />
              </div>
              <div className="input-helper-text">
                Enter the full URL including https://
              </div>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle className="error-icon" />
                {error}
              </div>
            )}

            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !url.trim()}
              className="apollo-btn-primary"
            >
              {isAnalyzing ? (
                <>
                  <Clock className="button-icon spinning" />
                  Analyzing Page...
                </>
              ) : (
                <>
                  <Zap className="button-icon" />
                  Analyze Copy
                </>
              )}
            </button>

            {currentResults && (
              <button 
                onClick={handleClearResults}
                className="apollo-btn-secondary"
              >
                Start New Analysis
              </button>
            )}
          </div>

          {isAnalyzing && (
            <div className="analysis-progress">
              <div className="progress-indicator">
                <div className="progress-spinner"></div>
                <div className="progress-text">
                  <p className="progress-title">Analyzing your landing page...</p>
                  <p className="progress-subtitle">Extracting page copy and comparing against customer insights</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Results Panel */}
      <div className="results-section">
        {currentResults ? (
          <div className="cro-results">
            {/* Header with Score and Page Info */}
            <div className="results-header">
              <div className="score-section">
                <div className="overall-score">
                  <div className="score-number">{currentResults.overallScore}</div>
                  <div className="score-label">Conversion Score</div>
                  <div className="score-context">
                    {currentResults.overallScore >= 80 ? '🟢 Excellent' : 
                     currentResults.overallScore >= 60 ? '🟡 Good' : 
                     currentResults.overallScore >= 40 ? '🟠 Needs Work' : '🔴 Critical Issues'}
                  </div>
                </div>
                <div className="page-info">
                  <h3>{currentResults.pageContent.title}</h3>
                  <a 
                    href={currentResults.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="page-url"
                  >
                    {currentResults.url} <ExternalLink size={14} />
                  </a>
                  <div className="page-stats">
                    <span>📄 {currentResults.pageContent.headings.length} headings</span>
                    <span>🔗 {currentResults.pageContent.buttonTexts.length} CTAs</span>
                    <span>📝 {Math.round(currentResults.pageContent.bodyText.length / 100)} paragraphs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Element Analysis */}
            <div className="results-card">
              <h4><Target className="inline-icon" /> Page Element Analysis</h4>
              <div className="element-analysis">
                
                {/* Main Headline Analysis */}
                <div className="element-section">
                  <div className="element-header">
                    <h5>🏆 Main Headline (H1)</h5>
                    <span className={`element-status ${
                      currentResults.pageContent.title.length > 60 ? 'warning' : 
                      currentResults.pageContent.title.toLowerCase().includes('boost') || 
                      currentResults.pageContent.title.toLowerCase().includes('increase') || 
                      currentResults.pageContent.title.toLowerCase().includes('improve') ? 'good' : 'warning'
                    }`}>
                      {currentResults.pageContent.title.length > 60 ? 'Too Long' : 
                       currentResults.pageContent.title.toLowerCase().includes('boost') || 
                       currentResults.pageContent.title.toLowerCase().includes('increase') || 
                       currentResults.pageContent.title.toLowerCase().includes('improve') ? 'Good' : 'Could Improve'}
                    </span>
                  </div>
                  <div className="element-content">
                    <blockquote>"{currentResults.pageContent.title}"</blockquote>
                    <div className="element-insights">
                      <div className="insight-item">
                        <span className="insight-label">Length:</span>
                        <span>{currentResults.pageContent.title.length} characters {currentResults.pageContent.title.length > 60 ? '⚠ Too long for some search results' : '✓ Good length'}</span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Contains Benefits:</span>
                        <span>{currentResults.pageContent.title.toLowerCase().includes('boost') || 
                              currentResults.pageContent.title.toLowerCase().includes('increase') || 
                              currentResults.pageContent.title.toLowerCase().includes('improve') || 
                              currentResults.pageContent.title.toLowerCase().includes('automation') ? '✓ Yes' : '⚠ Could be clearer'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subheadlines Analysis */}
                {currentResults.pageContent.headings.length > 0 && (
                  <div className="element-section">
                    <div className="element-header">
                      <h5>📋 Section Headings ({currentResults.pageContent.headings.length})</h5>
                      <span className="element-status warning">Mixed</span>
                    </div>
                    <div className="element-content">
                      {currentResults.pageContent.headings.slice(0, 3).map((heading, index) => (
                        <div key={index} className="heading-item">
                          <span className="heading-text">"{heading}"</span>
                          <div className="heading-analysis">
                            {heading.toLowerCase().includes('boost') || heading.toLowerCase().includes('increase') ? 
                              <span className="analysis-good">✓ Result-focused</span> :
                              <span className="analysis-warning">⚠ Could be more specific</span>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Analysis */}
                {currentResults.pageContent.buttonTexts.length > 0 && (
                  <div className="element-section">
                    <div className="element-header">
                      <h5>🎯 Call-to-Action Elements ({currentResults.pageContent.buttonTexts.length})</h5>
                      <span className={`element-status ${
                        currentResults.pageContent.buttonTexts.filter(cta => 
                          cta.toLowerCase().includes('try') || 
                          cta.toLowerCase().includes('start') || 
                          cta.toLowerCase().includes('get') ||
                          cta.toLowerCase().includes('book') ||
                          cta.toLowerCase().includes('request')
                        ).length > currentResults.pageContent.buttonTexts.length * 0.3 ? 'good' : 'warning'
                      }`}>
                        {currentResults.pageContent.buttonTexts.filter(cta => 
                          cta.toLowerCase().includes('try') || 
                          cta.toLowerCase().includes('start') || 
                          cta.toLowerCase().includes('get') ||
                          cta.toLowerCase().includes('book') ||
                          cta.toLowerCase().includes('request')
                        ).length > currentResults.pageContent.buttonTexts.length * 0.3 ? 'Good Mix' : 'Generic'}
                      </span>
                    </div>
                    <div className="element-content">
                      <div className="cta-summary">
                        <p><strong>Unique CTAs found:</strong> {Array.from(new Set(currentResults.pageContent.buttonTexts)).length} different texts</p>
                        <p><strong>Most common:</strong> "{currentResults.pageContent.buttonTexts.reduce((a, b, i, arr) => 
                          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
                        )}" ({currentResults.pageContent.buttonTexts.filter(cta => 
                          cta === currentResults.pageContent.buttonTexts.reduce((a, b, i, arr) => 
                            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
                          )).length} times)</p>
                      </div>
                      <div className="cta-grid">
                        {Array.from(new Set(currentResults.pageContent.buttonTexts)).slice(0, 6).map((cta, index) => {
                          const frequency = currentResults.pageContent.buttonTexts.filter(btn => btn === cta).length;
                          const isActionOriented = cta.toLowerCase().includes('try') || 
                                                 cta.toLowerCase().includes('start') || 
                                                 cta.toLowerCase().includes('get') ||
                                                 cta.toLowerCase().includes('book') ||
                                                 cta.toLowerCase().includes('request') ||
                                                 cta.toLowerCase().includes('demo');
                          const isGeneric = cta.toLowerCase().includes('learn more') || 
                                          cta.toLowerCase().includes('read more') || 
                                          cta.toLowerCase().includes('click here');
                          
                          return (
                            <div key={index} className="cta-item">
                              <span className="cta-text">"{cta}"</span>
                              <div className="cta-frequency">Used {frequency} times</div>
                              <div className="cta-analysis">
                                {isActionOriented ? 
                                  <span className="analysis-good">✓ Action-oriented</span> :
                                  isGeneric ?
                                  <span className="analysis-critical">❌ Generic language</span> :
                                  <span className="analysis-warning">⚠ Could be stronger</span>
                                }
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Pain Point Insights */}
            <div className="results-card">
              <h4><MessageSquare className="inline-icon" /> Customer Pain Point Analysis</h4>
              {currentResults.painPointAlignment.length > 0 ? (
                <div className="pain-point-insights">
                  <div className="insights-summary">
                    <div className="summary-stat">
                      <span className="stat-number">{currentResults.painPointAlignment.length}</span>
                      <span className="stat-label">Pain Points Analyzed</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-number">
                        {currentResults.painPointAlignment.filter(p => p.relevanceScore >= 70).length}
                      </span>
                      <span className="stat-label">High-Impact Gaps</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-number">
                        {currentResults.painPointAlignment.filter(p => p.relevanceScore < 40).length}
                      </span>
                      <span className="stat-label">Unaddressed Issues</span>
                    </div>
                  </div>

                  {currentResults.painPointAlignment.map((alignment, index) => (
                    <div key={index} className="pain-point-analysis">
                      <div className="pain-point-header">
                        <div className="pain-point-meta">
                          <span className={`category-badge ${alignment.painPoint.category}`}>
                            {getCategoryDisplayName(alignment.painPoint.category)}
                          </span>
                          <span className={`emotional-trigger ${getEmotionalTriggerColor(alignment.painPoint.emotionalTrigger)}`}>
                            {alignment.painPoint.emotionalTrigger}
                          </span>
                          <span className="frequency-badge">
                            Heard {alignment.painPoint.frequency}x in calls
                          </span>
                        </div>
                        <div className="relevance-meter">
                          <div className="meter-label">Page Addresses This:</div>
                          <div className="meter-bar">
                            <div 
                              className="meter-fill" 
                              style={{width: `${alignment.relevanceScore}%`}}
                            ></div>
                          </div>
                          <span className="meter-value">{alignment.relevanceScore}%</span>
                        </div>
                      </div>
                      
                      <blockquote className="customer-quote">
                        <span className="quote-mark">"</span>
                        {alignment.painPoint.text}
                        <span className="quote-mark">"</span>
                        <cite>— Actual customer from sales calls</cite>
                      </blockquote>

                      <div className="cro-recommendations">
                        <h6>🎯 CRO Recommendations:</h6>
                        <ul className="recommendation-list">
                          {alignment.recommendations.map((rec, recIndex) => (
                            <li key={recIndex} className="recommendation-item">
                              <span className="rec-icon">💡</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-insights-state">
                  <div className="empty-state-icon">🔍</div>
                  <h5>No Customer Insights Available</h5>
                  <p>To unlock powerful CRO recommendations, we need customer pain points from your Gong calls.</p>
                  <div className="sync-suggestion">
                    <h6>What you'll get with Gong sync:</h6>
                    <ul>
                      <li>✅ Real customer objections and concerns</li>
                      <li>✅ Language patterns that convert</li>
                      <li>✅ Emotional triggers from actual calls</li>
                      <li>✅ Specific copy recommendations</li>
                      <li>✅ Prioritized optimization roadmap</li>
                    </ul>
                    <button className="sync-cta-button">
                      🔗 Connect Gong API
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Top Priority Recommendations */}
            <div className="results-card priority-card">
              <h4><Zap className="inline-icon" /> Top Priority Improvements</h4>
              <div className="priority-recommendations">
                {currentResults.keyRecommendations.map((rec, index) => (
                  <div key={index} className="priority-item">
                    <div className="priority-rank">#{index + 1}</div>
                    <div className="priority-content">
                      <p className="priority-text">{rec}</p>
                      <div className="priority-impact">
                        <span className="impact-label">Estimated Impact:</span>
                        <span className={`impact-value ${index === 0 ? 'high' : index === 1 ? 'medium' : 'low'}`}>
                          {index === 0 ? '🔴 High' : index === 1 ? '🟡 Medium' : '🟢 Low'} 
                          ({index === 0 ? '15-25%' : index === 1 ? '8-15%' : '3-8%'} conversion lift)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Language Gaps */}
            {currentResults.customerLanguageGaps.length > 0 && (
              <div className="results-card">
                <h4><MessageSquare className="inline-icon" /> Missing Customer Language</h4>
                <div className="language-analysis">
                  <div className="language-intro">
                    <p>These phrases appear frequently in customer calls but are missing from your page copy:</p>
                  </div>
                  
                  {currentResults.customerLanguageGaps.map((gap, index) => (
                    <div key={index} className="language-gap">
                      <div className="gap-header">
                        <span className="customer-phrase">"{gap.missingPhrase.phrase}"</span>
                        <div className="gap-meta">
                          <span className="usage-frequency">
                            Used {gap.missingPhrase.frequency}x in {gap.missingPhrase.context}
                          </span>
                          <span className={`impact-badge ${getImpactBadgeClass(gap.impact)}`}>
                            {gap.impact} impact
                          </span>
                        </div>
                      </div>
                      
                      <div className="gap-recommendation">
                        <span className="rec-label">💡 Suggested placement:</span>
                        <span className="placement-text">{gap.suggestedPlacement}</span>
                      </div>
                      
                      <div className="gap-example">
                        <span className="example-label">Example integration:</span>
                        <blockquote className="example-text">
                          "Apollo's AI sales automation helps you {gap.missingPhrase.phrase.toLowerCase()} 
                          so you can focus on closing deals instead of manual tasks."
                        </blockquote>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Screenshot with Annotations */}
            {screenshotId && (
              <div className="results-card">
                <h4>📸 Page Visual Analysis</h4>
                <div className="screenshot-analysis">
                  <div className="screenshot-container">
                    <img 
                      src={buildApiUrl('/api/cro/screenshot/${screenshotId}')}
                      alt={`Screenshot of ${currentResults.url}`}
                      className="page-screenshot"
                    />
                    <div className="screenshot-annotations">
                      <div className="annotation top-annotation">
                        <div className="annotation-dot"></div>
                        <div className="annotation-text">Headline needs emotional hook</div>
                      </div>
                      <div className="annotation middle-annotation">
                        <div className="annotation-dot"></div>
                        <div className="annotation-text">Add customer success metrics</div>
                      </div>
                      <div className="annotation bottom-annotation">
                        <div className="annotation-dot"></div>
                        <div className="annotation-text">CTA could be more specific</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="results-empty">
            <div className="apollo-logo" style={{width: '4rem', height: '4rem', opacity: 0.3}}>
              <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
            </div>
            <h3>No Analysis Yet</h3>
            <p>Enter a landing page URL to get comprehensive CRO analysis based on real customer insights from your sales calls</p>
            <div className="feature-preview">
              <h6>What you'll get:</h6>
              <ul>
                <li>🎯 Page element breakdown and scoring</li>
                <li>💬 Customer pain point analysis</li>
                <li>📝 Missing language recommendations</li>
                <li>⚡ Prioritized improvement roadmap</li>
                <li>📊 Conversion impact estimates</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CROPage; 