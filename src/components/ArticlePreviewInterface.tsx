import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, MapPin, CheckCircle, Edit3, ArrowLeft, ArrowRight, Zap, Target, Download, FileText, Code, Hash } from 'lucide-react';

interface CTAInsertionPoint {
  position: number;
  type: 'beginning' | 'middle' | 'end';
  confidence: number;
  reasoning: string;
  paragraph_index: number;
  paragraph_preview: string;
}

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

interface ArticleStructure {
  paragraphs: Array<{
    content: string;
    type: 'introduction' | 'body' | 'conclusion';
    word_count: number;
    position: number;
  }>;
  headings: Array<{
    level: number;
    text: string;
    position: number;
  }>;
  word_count: number;
  reading_time_minutes: number;
}

interface ArticlePreviewProps {
  // Article content and structure
  originalContent: string;
  articleStructure: ArticleStructure;
  insertionPoints: CTAInsertionPoint[];
  ctaVariants: {
    beginning: CTAVariant;
    middle: CTAVariant;
    end: CTAVariant;
  };
  
  // Control props
  onApplyChanges: (selectedPlacements: { [key: string]: CTAVariant }, exportFormats?: any) => void;
  onBack: () => void;
}

/**
 * Article Preview Interface Component
 * Why this matters: Provides a visual before/after comparison allowing users to see exactly 
 * where CTAs will be placed before applying changes, preventing errors and building confidence.
 */
const ArticlePreviewInterface: React.FC<ArticlePreviewProps> = ({
  originalContent,
  articleStructure,
  insertionPoints,
  ctaVariants,
  onApplyChanges,
  onBack
}) => {
  const [selectedPlacements, setSelectedPlacements] = useState<{ [key: string]: CTAVariant }>({});
  const [showCTAs, setShowCTAs] = useState(true);
  const [hoveredCTA, setHoveredCTA] = useState<string>('');
  const [hoveredInsertionPoint, setHoveredInsertionPoint] = useState<string>('');
  const [highlightMode, setHighlightMode] = useState<'confidence' | 'position' | 'none'>('confidence');
  const [showPositionRecommendations, setShowPositionRecommendations] = useState(false);
  const [recommendationStrategy, setRecommendationStrategy] = useState<'balanced' | 'aggressive' | 'minimal'>('balanced');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormats, setExportFormats] = useState<{
    html: string;
    markdown: string;
    plain_text: string;
  } | null>(null);

  // Initialize with recommended placements based on strategy
  useEffect(() => {
    const initialPlacements: { [key: string]: CTAVariant } = {};
    const recommendations = getRecommendations(recommendationStrategy);
    
    recommendations.forEach(pointKey => {
      const [type, index] = pointKey.split('_');
      const point = insertionPoints.find(p => 
        p.type === type && p.paragraph_index === parseInt(index)
      );
      if (point) {
        initialPlacements[pointKey] = ctaVariants[point.type];
      }
    });
    
    setSelectedPlacements(initialPlacements);
  }, [insertionPoints, ctaVariants, recommendationStrategy]);

  /**
   * Generate smart recommendations based on strategy
   * Why this matters: Provides data-driven CTA placement suggestions based on conversion
   * best practices and article structure analysis.
   */
  const getRecommendations = (strategy: 'balanced' | 'aggressive' | 'minimal') => {
    const sortedPoints = [...insertionPoints].sort((a, b) => b.confidence - a.confidence);
    
    switch (strategy) {
      case 'minimal':
        // Only highest confidence placement
        return sortedPoints.slice(0, 1).map(p => `${p.type}_${p.paragraph_index}`);
        
      case 'aggressive':
        // All placements above 0.5 confidence
        return sortedPoints
          .filter(p => p.confidence > 0.5)
          .map(p => `${p.type}_${p.paragraph_index}`);
        
      case 'balanced':
      default:
        // High confidence + one from each position type if available
        const recommended = new Set<string>();
        
        // Add highest confidence overall
        if (sortedPoints.length > 0) {
          recommended.add(`${sortedPoints[0].type}_${sortedPoints[0].paragraph_index}`);
        }
        
        // Add best from each position type
        ['beginning', 'middle', 'end'].forEach(type => {
          const bestOfType = sortedPoints.find(p => p.type === type && p.confidence > 0.6);
          if (bestOfType) {
            recommended.add(`${bestOfType.type}_${bestOfType.paragraph_index}`);
          }
        });
        
        return Array.from(recommended);
    }
  };

  /**
   * Apply smart recommendations
   * Why this matters: Allows users to quickly apply AI-optimized CTA placements
   * without manually selecting each insertion point.
   */
  const applyRecommendations = (strategy: 'balanced' | 'aggressive' | 'minimal') => {
    setRecommendationStrategy(strategy);
    const recommendations = getRecommendations(strategy);
    
    const newPlacements: { [key: string]: CTAVariant } = {};
    recommendations.forEach(pointKey => {
      const [type, index] = pointKey.split('_');
      const point = insertionPoints.find(p => 
        p.type === type && p.paragraph_index === parseInt(index)
      );
      if (point) {
        newPlacements[pointKey] = ctaVariants[point.type];
      }
    });
    
    setSelectedPlacements(newPlacements);
  };

  /**
   * Generate and copy specific export format with enhanced error handling
   * Why this matters: Provides reliable export functionality with comprehensive error handling
   * for network issues, invalid content, and edge cases while maintaining user experience.
   */
  const generateAndCopyFormat = async (format: 'html' | 'markdown' | 'plain_text') => {
    // Validate inputs before making request
    if (!originalContent || originalContent.trim() === '') {
      const event = new CustomEvent('showToast', {
        detail: {
          message: 'No article content available for export',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
      return;
    }

    if (!selectedPlacements || Object.keys(selectedPlacements).length === 0) {
      const event = new CustomEvent('showToast', {
        detail: {
          message: 'Please select at least one CTA placement before exporting',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
      return;
    }

    try {
      // Generate the specific format on-demand
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? 'https://apollo-reddit-scraper-backend.vercel.app' : 'http://localhost:3003'}/api/cta-generation/apply-placements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_content: originalContent,
          article_structure: articleStructure,
          selected_placements: selectedPlacements,
          input_method: 'text'
        }),
      });

      // Enhanced response validation
      if (!response.ok) {
        let errorMessage = 'Export generation failed';
        
        if (response.status === 400) {
          errorMessage = 'Invalid content provided for export';
        } else if (response.status === 408) {
          errorMessage = 'Export request timed out. Content might be too large.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error during export. Please try again.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const formatContent = result.data.formats?.[format] || result.data.final_html;
        
        if (!formatContent || formatContent.trim() === '') {
          throw new Error(`${format} format is empty or unavailable`);
        }
        
        // Enhanced clipboard handling with fallbacks
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(formatContent);
          } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = formatContent;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (!successful) {
              throw new Error('Copy command failed');
            }
          }
          
          // Show success feedback
          const event = new CustomEvent('showToast', {
            detail: {
              message: `${format.charAt(0).toUpperCase() + format.slice(1)} copied to clipboard!`,
              type: 'success'
            }
          });
          window.dispatchEvent(event);
          
          // Store formats for later use
          if (result.data.formats) {
            setExportFormats(result.data.formats);
          }
          
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
          throw new Error('Failed to copy to clipboard. Please manually select and copy the content.');
        }
        
      } else {
        throw new Error(result.error || 'Failed to generate export format');
      }
      
    } catch (error: any) {
      console.error('Error generating format:', error);
      
      // Provide specific error messages based on error type
      let userMessage = 'Failed to generate export format';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        userMessage = 'Network connection failed. Please check your connection and try again.';
      } else if (error.message.includes('clipboard')) {
        userMessage = 'Content generated but failed to copy. Please try the manual export option.';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      const event = new CustomEvent('showToast', {
        detail: {
          message: userMessage,
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  };

  /**
   * Toggle CTA placement at specific position
   * Why this matters: Gives users control over which CTAs to include, allowing customization
   * while maintaining the intelligent recommendations as defaults.
   */
  const toggleCTAPlacement = (insertionPoint: CTAInsertionPoint) => {
    const key = `${insertionPoint.type}_${insertionPoint.paragraph_index}`;
    setSelectedPlacements(prev => {
      if (prev[key]) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      } else {
        return {
          ...prev,
          [key]: ctaVariants[insertionPoint.type]
        };
      }
    });
  };

  /**
   * Get confidence-based styling for insertion points
   * Why this matters: Visual feedback helps users understand AI confidence levels
   * and make informed decisions about CTA placement.
   */
  const getConfidenceStyle = (confidence: number) => {
    if (confidence > 0.8) return { color: '#16a34a', bg: '#dcfce7', border: '#16a34a' };
    if (confidence > 0.6) return { color: '#ca8a04', bg: '#fef3c7', border: '#ca8a04' };
    return { color: '#dc2626', bg: '#fef2f2', border: '#dc2626' };
  };

  /**
   * Get position-based styling
   * Why this matters: Color-coding by position type helps users quickly identify
   * and differentiate between beginning, middle, and end placements.
   */
  const getPositionStyle = (position: string) => {
    switch (position) {
      case 'beginning': return { color: '#1e40af', bg: '#dbeafe', border: '#1e40af' };
      case 'middle': return { color: '#b45309', bg: '#fef3c7', border: '#b45309' };
      case 'end': return { color: '#16a34a', bg: '#dcfce7', border: '#16a34a' };
      default: return { color: '#6b7280', bg: '#f3f4f6', border: '#6b7280' };
    }
  };

  /**
   * Render CTA component for preview with enhanced highlighting
   * Why this matters: Shows exactly how the CTA will appear in the final article,
   * using Apollo's brand colors and highlighting for better user experience.
   */
  const renderCTA = (cta: CTAVariant, index: string, insertionPoint?: CTAInsertionPoint) => {
    const isHovered = hoveredCTA === index;
    const isHighlighted = hoveredInsertionPoint === index;
    
    return (
    <div 
      key={index}
      className={`my-6 p-6 border-2 rounded-lg transition-all duration-300 transform ${
        isHovered || isHighlighted
          ? 'border-[#EBF212] bg-[#EBF212]/10 shadow-xl scale-105' 
          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
      }`}
      onMouseEnter={() => setHoveredCTA(index)}
      onMouseLeave={() => setHoveredCTA('')}
    >
      {/* CTA Header with confidence/position indicators */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {cta.cta.category_header}
        </div>
        {insertionPoint && (
          <div className="flex items-center gap-2">
            {/* Confidence indicator */}
            {highlightMode === 'confidence' && (
              <div 
                className="px-2 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: getConfidenceStyle(insertionPoint.confidence).bg,
                  color: getConfidenceStyle(insertionPoint.confidence).color,
                  border: `1px solid ${getConfidenceStyle(insertionPoint.confidence).border}20`
                }}
              >
                {Math.round(insertionPoint.confidence * 100)}% confidence
              </div>
            )}
            
            {/* Position indicator */}
            {highlightMode === 'position' && (
              <div 
                className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                style={{
                  backgroundColor: getPositionStyle(cta.position).bg,
                  color: getPositionStyle(cta.position).color,
                  border: `1px solid ${getPositionStyle(cta.position).border}20`
                }}
              >
                {cta.position} CTA
              </div>
            )}
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {cta.cta.headline}
      </h3>
      <p className="text-gray-700 mb-4 leading-relaxed">
        {cta.cta.description}
      </p>
      <button className="bg-[#EBF212] hover:bg-[#EBF212]/80 text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center gap-2">
        {cta.cta.action_button}
        <ArrowRight className="w-4 h-4" />
      </button>
      
      {/* Enhanced strategy and reasoning display */}
      <div className="mt-4 space-y-2">
        <div className="text-xs text-gray-500">
          <span className="font-medium">Strategy:</span> {cta.strategy}
        </div>
        {insertionPoint && (
          <div className="text-xs text-gray-400">
            <span className="font-medium">Reasoning:</span> {insertionPoint.reasoning}
          </div>
        )}
      </div>
    </div>
    );
  };

  /**
   * Generate preview content with CTAs inserted
   * Why this matters: Creates a realistic preview of the final article by inserting
   * CTAs at the selected positions, allowing users to see the complete result.
   */
  const generatePreviewContent = () => {
    const paragraphs = originalContent.split('\n\n');
    const result: (string | React.ReactNode)[] = [];
    
    paragraphs.forEach((paragraph, index) => {
      // Add the original paragraph
      if (paragraph.trim()) {
        result.push(
          <p key={`para-${index}`} className="mb-4 leading-relaxed text-gray-800">
            {paragraph.trim()}
          </p>
        );
      }

      // Check if there's a CTA to insert after this paragraph
      const insertionPoint = insertionPoints.find(point => 
        point.paragraph_index === index
      );
      
      if (insertionPoint && showCTAs) {
        const key = `${insertionPoint.type}_${insertionPoint.paragraph_index}`;
        const selectedCTA = selectedPlacements[key];
        
        if (selectedCTA) {
          result.push(renderCTA(selectedCTA, key, insertionPoint));
        }
      }
    });

    return result;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Generator
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#EBF212]" />
                Article Preview
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Highlight Mode Selector */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'confidence', label: 'Confidence', icon: Target },
                  { key: 'position', label: 'Position', icon: MapPin },
                  { key: 'none', label: 'Clean', icon: EyeOff }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setHighlightMode(key as any)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      highlightMode === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowCTAs(!showCTAs)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showCTAs 
                    ? 'bg-[#EBF212] text-black' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {showCTAs ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {showCTAs ? 'Hide CTAs' : 'Show CTAs'}
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  disabled={Object.keys(selectedPlacements).length === 0}
                  className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Options
                </button>
                
                <button
                  onClick={() => onApplyChanges(selectedPlacements, exportFormats)}
                  disabled={Object.keys(selectedPlacements).length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Apply Changes ({Object.keys(selectedPlacements).length})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options Panel */}
      {showExportOptions && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              Export Formats
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  key: 'html',
                  label: 'Complete HTML',
                  icon: Code,
                  desc: 'Full HTML document with styling',
                  color: 'text-orange-600 bg-orange-50 border-orange-200'
                },
                {
                  key: 'markdown',
                  label: 'Markdown',
                  icon: Hash,
                  desc: 'Clean Markdown format',
                  color: 'text-blue-600 bg-blue-50 border-blue-200'
                },
                {
                  key: 'plain_text',
                  label: 'Plain Text',
                  icon: FileText,
                  desc: 'Simple text format',
                  color: 'text-gray-600 bg-gray-50 border-gray-200'
                }
              ].map(({ key, label, icon: Icon, desc, color }) => (
                <button
                  key={key}
                  onClick={() => generateAndCopyFormat(key as any)}
                  className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${color}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <p className="text-sm opacity-75">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* CTA Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#EBF212]" />
                  CTA Placements
                </h2>
                
                <button
                  onClick={() => setShowPositionRecommendations(!showPositionRecommendations)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showPositionRecommendations ? 'Hide' : 'Smart'} Options
                </button>
              </div>

              {/* Smart Recommendations Panel */}
              {showPositionRecommendations && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Smart Recommendations
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { 
                        key: 'minimal', 
                        label: 'Minimal', 
                        desc: 'Single highest-confidence CTA only',
                        count: getRecommendations('minimal').length
                      },
                      { 
                        key: 'balanced', 
                        label: 'Balanced', 
                        desc: 'Strategic placement across article sections',
                        count: getRecommendations('balanced').length
                      },
                      { 
                        key: 'aggressive', 
                        label: 'Aggressive', 
                        desc: 'Maximum CTAs for highest conversion potential',
                        count: getRecommendations('aggressive').length
                      }
                    ].map(({ key, label, desc, count }) => (
                      <button
                        key={key}
                        onClick={() => applyRecommendations(key as any)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                          recommendationStrategy === key
                            ? 'border-[#EBF212] bg-[#EBF212]/10 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">{label}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {count} CTA{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{desc}</p>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between text-xs text-blue-700">
                      <span>Current strategy: <strong>{recommendationStrategy}</strong></span>
                      <span>{Object.keys(selectedPlacements).length} CTAs selected</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {insertionPoints.map((point, index) => {
                  const key = `${point.type}_${point.paragraph_index}`;
                  const isSelected = selectedPlacements[key];
                  const isHovered = hoveredInsertionPoint === key;
                  const confidenceStyle = getConfidenceStyle(point.confidence);
                  const positionStyle = getPositionStyle(point.type);
                  
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-[#EBF212] bg-[#EBF212]/5 shadow-md'
                          : isHovered
                          ? 'border-blue-300 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onMouseEnter={() => setHoveredInsertionPoint(key)}
                      onMouseLeave={() => setHoveredInsertionPoint('')}
                      onClick={() => toggleCTAPlacement(point)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {/* Dynamic confidence or position indicator */}
                          {highlightMode === 'confidence' ? (
                            <div 
                              className="px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: confidenceStyle.bg,
                                color: confidenceStyle.color,
                                border: `1px solid ${confidenceStyle.border}20`
                              }}
                            >
                              {Math.round(point.confidence * 100)}%
                            </div>
                          ) : highlightMode === 'position' ? (
                            <div 
                              className="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                              style={{
                                backgroundColor: positionStyle.bg,
                                color: positionStyle.color,
                                border: `1px solid ${positionStyle.border}20`
                              }}
                            >
                              {point.type}
                            </div>
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                          )}
                          
                          <span className="font-medium text-sm capitalize">
                            {point.type} CTA
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCTAPlacement(point);
                          }}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected 
                              ? 'bg-[#EBF212] border-[#EBF212] scale-110' 
                              : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                          }`}
                        >
                          {isSelected && <CheckCircle className="w-4 h-4 text-black" />}
                        </button>
                      </div>
                      
                      {/* Enhanced info display */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Preview:</span> "{point.paragraph_preview}..."
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Reasoning:</span> {point.reasoning}
                        </div>
                        
                        {highlightMode === 'confidence' && (
                          <div className="text-xs text-gray-400">
                            <span className="font-medium">Position:</span> After paragraph {point.paragraph_index + 1}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {insertionPoints.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No insertion points found</p>
                </div>
              )}
            </div>
          </div>

          {/* Article Preview */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              
              {/* Preview Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Article with CTAs</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {articleStructure.word_count} words • {articleStructure.reading_time_minutes} min read
                      {Object.keys(selectedPlacements).length > 0 && (
                        <span className="ml-2">• {Object.keys(selectedPlacements).length} CTAs inserted</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#EBF212]" />
                    <span className="text-sm font-medium text-gray-700">Live Preview</span>
                  </div>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-6 max-w-none prose prose-lg">
                {generatePreviewContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePreviewInterface;
