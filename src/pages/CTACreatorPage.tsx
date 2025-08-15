import React, { useState, useEffect } from 'react';
import { ExternalLink, Zap, Target, Sparkles, CheckCircle, AlertCircle, ArrowRight, Copy, Download, AlertTriangle, RotateCcw, X } from 'lucide-react';
import ArticlePreviewInterface from '../components/ArticlePreviewInterface';
import { FEATURE_FLAGS } from '../utils/featureFlags';
import { buildApiUrl } from '../config/api';
import { CTAGenerationResult } from '../types';

// Skeleton component for loading states
const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div 
    className={className}
    style={{
      backgroundColor: '#f3f4f6',
      borderRadius: '0.375rem',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      ...style
    }}
  />
);

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



/**
 * CTA Creator Page Component
 * Why this matters: Provides a dedicated, streamlined interface for CRO Managers to generate
 * hyper-relevant CTAs from article URLs using Voice of Customer insights.
 */
const CTACreatorPage: React.FC = () => {
  const [articleUrl, setArticleUrl] = useState('');
  const [articleText, setArticleText] = useState('');
  const [articleMarkdown, setArticleMarkdown] = useState('');
  const [inputMethod, setInputMethod] = useState<'url' | 'text' | 'markdown'>('url');
  const [enhancedAnalysis, setEnhancedAnalysis] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [generatedCTAs, setGeneratedCTAs] = useState<CTAGenerationResult | null>(null);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [showPreview, setShowPreview] = useState<string>('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showPreviewInterface, setShowPreviewInterface] = useState(false);
  const [articleStructure, setArticleStructure] = useState<any>(null);
  const [originalContent, setOriginalContent] = useState('');

  // Approved CTA button options for dynamic switching
  const approvedCTAButtons = [
    'Try Apollo Free →',
    'Start Your Free Trial →',
    'Schedule a Demo →',
    'Start a Trial →',
    'Request a Demo →'
  ];

  /**
   * Check if VoC Kit is configured
   * Why this matters: Ensures pain points are extracted before CTA generation.
   */
  const [vocKitReady, setVocKitReady] = useState(false);
  const [painPointsCount, setPainPointsCount] = useState(0);
  const [vocKitReadyDismissed, setVocKitReadyDismissed] = useState(false);

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

    // Check if VoC Kit ready notification was dismissed
    const checkDismissedState = () => {
      try {
        const dismissed = localStorage.getItem('apollo_voc_kit_ready_dismissed');
        setVocKitReadyDismissed(dismissed === 'true');
      } catch (error) {
        console.error('Error checking dismissed state:', error);
      }
    };

    // Restore saved CTAs from localStorage
    const restoreSavedCTAs = () => {
      try {
        const savedCTAs = localStorage.getItem('apollo_cta_creator_results');
        const savedInputs = localStorage.getItem('apollo_cta_creator_inputs');
        
        if (savedCTAs) {
          const parsedCTAs = JSON.parse(savedCTAs);
          setGeneratedCTAs(parsedCTAs);
        }
        
        if (savedInputs) {
          const parsedInputs = JSON.parse(savedInputs);
          setArticleUrl(parsedInputs.articleUrl || '');
          setArticleText(parsedInputs.articleText || '');
          setArticleMarkdown(parsedInputs.articleMarkdown || '');
          setInputMethod(parsedInputs.inputMethod || 'url');
        }
      } catch (error) {
        console.error('Error restoring saved CTAs:', error);
      }
    };

    checkVocKit();
    checkDismissedState();
    restoreSavedCTAs();
    
    // Listen for VoC Kit updates
    const handleVocUpdate = () => checkVocKit();
    window.addEventListener('apollo-voc-kit-updated', handleVocUpdate);
    
    return () => window.removeEventListener('apollo-voc-kit-updated', handleVocUpdate);
  }, []);

  /**
   * Save CTAs and inputs to localStorage
   * Why this matters: Persists generated CTAs and user inputs across page refreshes for better UX.
   */
  const saveCTAsToStorage = (ctas: CTAGenerationResult) => {
    try {
      localStorage.setItem('apollo_cta_creator_results', JSON.stringify(ctas));
      
      // Also save current inputs
      const inputsToSave = {
        articleUrl,
        articleText,
        articleMarkdown,
        inputMethod
      };
      localStorage.setItem('apollo_cta_creator_inputs', JSON.stringify(inputsToSave));
      
      console.log('✅ CTAs saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save CTAs to localStorage:', error);
    }
  };

  /**
   * Clear saved CTAs from localStorage
   * Why this matters: Allows users to start fresh and clears storage when needed.
   */
  const clearSavedCTAs = () => {
    try {
      localStorage.removeItem('apollo_cta_creator_results');
      localStorage.removeItem('apollo_cta_creator_inputs');
      console.log('✅ Saved CTAs cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear saved CTAs:', error);
    }
  };

  /**
   * Dismiss VoC Kit ready notification permanently
   * Why this matters: Allows users to hide the success notification once they've seen it.
   */
  const dismissVocKitReady = () => {
    try {
      localStorage.setItem('apollo_voc_kit_ready_dismissed', 'true');
      setVocKitReadyDismissed(true);
      console.log('✅ VoC Kit ready notification dismissed');
    } catch (error) {
      console.error('❌ Failed to dismiss VoC Kit ready notification:', error);
    }
  };

  /**
   * Handle clear results confirmation
   * Why this matters: Executes the actual clear action after user confirms.
   */
  const confirmClearResults = () => {
    setGeneratedCTAs(null);
    setShowSkeletons(false);
    clearSavedCTAs();
    setShowClearModal(false);
  };

  /**
   * Cancel clear results action
   * Why this matters: Closes modal without taking any destructive action.
   */
  const cancelClearResults = () => {
    setShowClearModal(false);
  };

  /**
   * Generate CTAs from article URL, text, or markdown
   * Why this matters: Executes the complete pipeline to create hyper-relevant CTAs from URL, direct text, or markdown input.
   */
  const generateCTAs = async () => {
    // Enhanced input validation with specific error messages and edge case handling
    if (inputMethod === 'url' && !articleUrl.trim()) {
      setError('Please enter an article URL');
      return;
    }

    if (inputMethod === 'url' && articleUrl.trim()) {
      // Enhanced URL validation
      try {
        const url = new URL(articleUrl.trim());
        if (!url.protocol.startsWith('http')) {
          setError('Please enter a valid HTTP/HTTPS URL');
          return;
        }
        
        // Check for common problematic URLs
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          setError('Local URLs cannot be processed. Please use a publicly accessible URL.');
          return;
        }
      } catch {
        setError('Please enter a valid URL format (e.g., https://example.com/article)');
        return;
      }
    }

    if (inputMethod === 'text' && !articleText.trim()) {
      setError('Please paste your article text or HTML');
      return;
    }

    if (inputMethod === 'text' && articleText.trim()) {
      // Check minimum content length for meaningful analysis
      if (articleText.trim().length < 200) {
        setError('Article text must be at least 200 characters for meaningful CTA generation');
        return;
      }
      
      // Check maximum content length to prevent API timeouts
      if (articleText.trim().length > 50000) {
        setError('Article text is too long (max 50,000 characters). Please break it into smaller sections.');
        return;
      }
    }

    if (inputMethod === 'markdown' && !articleMarkdown.trim()) {
      setError('Please paste your markdown content');
      return;
    }

    if (inputMethod === 'markdown' && articleMarkdown.trim()) {
      // Check minimum content length for meaningful analysis
      if (articleMarkdown.trim().length < 200) {
        setError('Markdown content must be at least 200 characters for meaningful CTA generation');
        return;
      }
      
      // Check maximum content length to prevent API timeouts
      if (articleMarkdown.trim().length > 50000) {
        setError('Markdown content is too long (max 50,000 characters). Please break it into smaller sections.');
        return;
      }
    }

    if (!vocKitReady) {
      setError('Please extract customer pain points in VoC Kit first');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    // If CTAs already exist, show skeletons instead of clearing
    if (generatedCTAs) {
      setShowSkeletons(true);
    } else {
      setGeneratedCTAs(null);
    }
    
    const isRegeneration = !!generatedCTAs;
    let stageMessage = isRegeneration ? 'Preparing new CTA variations...' : 'Analyzing voice of customer insights...';
    if (inputMethod === 'text') stageMessage = isRegeneration ? 'Analyzing current CTAs...' : 'Processing article text...';
    if (inputMethod === 'markdown') stageMessage = isRegeneration ? 'Finding new angles...' : 'Processing markdown content...';
    setGenerationStage(stageMessage);

    try {
            // Get VoC Kit data to send with request
      let vocKitData = null;
      try {
        const storedVocKit = localStorage.getItem('apollo_voc_kit');
        if (storedVocKit) {
          vocKitData = JSON.parse(storedVocKit);
          console.log('🔍 VoC Kit data loaded:', {
            hasGeneratedAnalysis: vocKitData.hasGeneratedAnalysis,
            extractedPainPointsCount: vocKitData.extractedPainPoints?.length || 0,
            samplePainPoint: vocKitData.extractedPainPoints?.[0]
          });
          console.log('🔍 Full VoC Kit data being sent to backend:', vocKitData);
        } else {
          console.log('❌ No VoC Kit data found in localStorage');
        }
      } catch (error) {
        console.error('Error loading VoC Kit data:', error);
      }

      let endpoint = buildApiUrl('/api/cta-generation/generate-from-url');
      let requestBody: any = { 
        url: articleUrl, 
        enhanced_analysis: enhancedAnalysis,
        voc_kit_data: vocKitData,
        regenerate: !!generatedCTAs, // Flag to indicate this is a regeneration for unique copy
        timestamp: Date.now() // Add timestamp for unique seed
      };

      if (inputMethod === 'text') {
        endpoint = buildApiUrl('/api/cta-generation/generate-from-text');
        requestBody = { 
          text: articleText, 
          enhanced_analysis: enhancedAnalysis,
          voc_kit_data: vocKitData,
          regenerate: !!generatedCTAs, // Flag to indicate this is a regeneration for unique copy
          timestamp: Date.now() // Add timestamp for unique seed
        };
      } else if (inputMethod === 'markdown') {
        endpoint = buildApiUrl('/api/cta-generation/generate-from-markdown');
        requestBody = { 
          markdown: articleMarkdown, 
          enhanced_analysis: enhancedAnalysis,
          voc_kit_data: vocKitData,
          regenerate: !!generatedCTAs, // Flag to indicate this is a regeneration for unique copy
          timestamp: Date.now() // Add timestamp for unique seed
        };
      }

      // Start the fetch request
      const fetchPromise = fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Simulate stage updates for better UX while processing
      const isRegeneration = !!generatedCTAs;
      const stage1 = setTimeout(() => setGenerationStage(isRegeneration ? 'Analyzing current CTAs...' : 'Finding pain points...'), 3000);
      const stage2 = setTimeout(() => setGenerationStage(isRegeneration ? 'Finding new angles...' : 'Connecting pain points to CTAs...'), 6000);
      const stage3 = setTimeout(() => setGenerationStage(isRegeneration ? 'Creating unique CTAs...' : 'Generating CTAs...'), 9000);

      const response = await fetchPromise;
      
      // Clear any remaining timeouts since we got a response
      clearTimeout(stage1);
      clearTimeout(stage2);
      clearTimeout(stage3);

      // Enhanced response handling with specific error messages
      if (!response.ok) {
        let errorMessage = 'Failed to generate CTAs';
        
        if (response.status === 400) {
          errorMessage = 'Invalid input provided. Please check your content and try again.';
        } else if (response.status === 401) {
          errorMessage = 'Authorization failed. Please refresh the page and try again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (response.status === 404) {
          errorMessage = 'Service not found. Please try again later.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a few minutes.';
        } else if (response.status === 408) {
          errorMessage = 'Request timed out. The article might be too large or complex.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        // Validate the response data structure
        if (!result.data || !result.data.cta_variants) {
          throw new Error('Invalid response format received from server');
        }

        console.log('🎯 CTA Generation Result:', {
          persona: result.data.persona,
          matched_pain_points: result.data.matched_pain_points,
          pain_point_context: result.data.pain_point_context,
          generation_metadata: result.data.generation_metadata
        });

        setShowSkeletons(false);
        setGenerationStage('');
        
        // Capture article structure and content for preview interface
        if (result.article_content) {
          setArticleStructure(result.article_content.structure);
          setOriginalContent(result.article_content.content || 
            (inputMethod === 'text' ? articleText : 
             inputMethod === 'markdown' ? articleMarkdown : ''));
          
          // Transform backend insertion points to frontend format
          const transformInsertionPoints = (insertionPoints: any, structure: any) => {
            if (!insertionPoints) return [];
            
            const points = [];
            
            // Helper function to get paragraph preview
            const getParagraphPreview = (paragraphIndex: number) => {
              if (structure?.paragraphs && structure.paragraphs[paragraphIndex]) {
                const content = structure.paragraphs[paragraphIndex].content || '';
                return content.substring(0, 100) + (content.length > 100 ? '...' : '');
              }
              return 'Content preview not available...';
            };
            
            // Convert backend format to frontend array format
            if (insertionPoints.beginning) {
              points.push({
                position: insertionPoints.beginning.afterParagraphIndex,
                type: 'beginning' as const,
                confidence: insertionPoints.beginning.confidence,
                reasoning: 'Strategic placement after introduction to capture engaged readers',
                paragraph_index: insertionPoints.beginning.afterParagraphIndex,
                paragraph_preview: getParagraphPreview(insertionPoints.beginning.afterParagraphIndex)
              });
            }
            
            if (insertionPoints.middle) {
              points.push({
                position: insertionPoints.middle.afterParagraphIndex,
                type: 'middle' as const,
                confidence: insertionPoints.middle.confidence,
                reasoning: 'Mid-article placement to re-engage readers and reinforce value proposition',
                paragraph_index: insertionPoints.middle.afterParagraphIndex,
                paragraph_preview: getParagraphPreview(insertionPoints.middle.afterParagraphIndex)
              });
            }
            
            if (insertionPoints.end) {
              points.push({
                position: insertionPoints.end.afterParagraphIndex,
                type: 'end' as const,
                confidence: insertionPoints.end.confidence,
                reasoning: 'End-of-article placement for conversion-focused CTA when readers are fully informed',
                paragraph_index: insertionPoints.end.afterParagraphIndex,
                paragraph_preview: getParagraphPreview(insertionPoints.end.afterParagraphIndex)
              });
            }
            
            return points;
          };
          
          // Add transformed insertion points to the CTA data for preview interface
          const transformedInsertionPoints = transformInsertionPoints(
            result.article_content.insertion_points, 
            result.article_content.structure
          );
          const ctasWithInsertionPoints = {
            ...result.data,
            insertion_points: transformedInsertionPoints
          };
          setGeneratedCTAs(ctasWithInsertionPoints);
        } else {
          // Fallback - set the CTAs without preview capability
          setGeneratedCTAs(result.data);
        }
        
        // Save to localStorage for persistence with error handling
        try {
          saveCTAsToStorage(result.data);
        } catch (storageError) {
          console.warn('Failed to save CTAs to local storage:', storageError);
          // Don't fail the entire operation for storage issues
        }
      } else {
        const errorMessage = result.error || 'Failed to generate CTAs';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error generating CTAs:', error);
      
      // Provide user-friendly error messages based on error type
      let userErrorMessage = 'Failed to generate CTAs';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        userErrorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('JSON')) {
        userErrorMessage = 'Invalid response from server. Please try again.';
      } else if (error.message.includes('timeout')) {
        userErrorMessage = 'Request timed out. The content might be too large. Try with smaller content.';
      } else if (error.message) {
        userErrorMessage = error.message;
      }
      
      setError(userErrorMessage);
      setShowSkeletons(false);
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  /**
   * Copy content to clipboard with enhanced error handling and fallbacks
   * Why this matters: Provides reliable copying across different browsers and handles edge cases
   * like permission issues, unsupported browsers, and network failures gracefully.
   */
  const copyToClipboard = async (text: string, position: string) => {
    if (!text || text.trim() === '') {
      setError('No content available to copy');
      return;
    }

    try {
      // Primary method: Modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopySuccess(position);
        setTimeout(() => setCopySuccess(''), 2000);
        return;
      }

      // Fallback method: Create temporary textarea for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopySuccess(position);
        setTimeout(() => setCopySuccess(''), 2000);
      } else {
        throw new Error('Copy command failed');
      }
      
    } catch (error) {
      console.error('Failed to copy:', error);
      setError('Failed to copy content. Please manually select and copy the content.');
      
      // Show user-friendly error message
      setTimeout(() => setError(''), 5000);
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
   * Cycle CTA button text to a random different option
   * Why this matters: Allows users to test different CTA buttons without regenerating entire CTAs.
   */
  const cycleCTAButton = (position: 'beginning' | 'middle' | 'end') => {
    if (!generatedCTAs) return;

    const currentButton = generatedCTAs.cta_variants[position].cta.action_button;
    
    // Get options excluding the current one
    const availableOptions = approvedCTAButtons.filter(button => button !== currentButton);
    
    // Select random option from remaining choices
    const randomIndex = Math.floor(Math.random() * availableOptions.length);
    const newButton = availableOptions[randomIndex];
    
    // Update the CTA data
    const updatedCTAs = {
      ...generatedCTAs,
      cta_variants: {
        ...generatedCTAs.cta_variants,
        [position]: {
          ...generatedCTAs.cta_variants[position],
          cta: {
            ...generatedCTAs.cta_variants[position].cta,
            action_button: newButton
          },
          // Update shortcode with new button text
          shortcode: generatedCTAs.cta_variants[position].shortcode.replace(
            /\[cta-action\].*?\[\/cta-action\]/,
            `[cta-action]${newButton}[/cta-action]`
          )
        }
      }
    };
    
    setGeneratedCTAs(updatedCTAs);
    
    // Update localStorage with new CTA data
    saveCTAsToStorage(updatedCTAs);
    
    console.log(`🔄 CTA button changed from "${currentButton}" to "${newButton}" for ${position} position`);
  };

  /**
   * Download all CTAs as a text file
   * Why this matters: Provides a convenient way to save all generated CTAs with both original and styled shortcodes.
   */
  const downloadCTAs = () => {
    if (!generatedCTAs) return;

    // Helper function to generate styled shortcode
    const generateStyledShortcode = (ctaData: any) => {
      return `<div style="background-color: #192307; padding: 2rem; border-radius: 0.875rem; position: relative;">
  <div style="font-size: 0.875rem; font-weight: 600; color: #ffffff; margin-bottom: 1rem; letter-spacing: 0.1em; text-transform: uppercase;">
    ${ctaData.cta.category_header}
  </div>
  <div style="display: flex; align-items: flex-start; gap: 1.5rem;">
    <div style="width: 4rem; height: 4rem; border-radius: 0.75rem; overflow: hidden; flex-shrink: 0;">
      <img src="/apollo logo only.png" alt="Apollo Logo" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
    <div style="flex: 1;">
      <h4 style="font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0 1rem 0; line-height: 1.3;">
        ${ctaData.cta.headline}
      </h4>
      <p style="font-size: 1rem; color: #ffffff; line-height: 1.6; margin: 0 0 1.5rem 0; opacity: 0.9;">
        ${ctaData.cta.description}
      </p>
      <a href="#" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; background-color: #BDF548; color: #192307; border-radius: 0.625rem; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(189, 245, 72, 0.3); text-decoration: none;">
        ${ctaData.cta.action_button.replace(/\s*→\s*$/, '')}
        <span style="font-size: 1.1rem;">→</span>
      </a>
    </div>
  </div>
</div>`;
    };

    const content = `
Generated on: ${new Date(generatedCTAs.generation_metadata.generation_timestamp).toLocaleString()}

## Beginning CTA
Category: ${generatedCTAs.cta_variants.beginning.cta.category_header}
Headline: ${generatedCTAs.cta_variants.beginning.cta.headline}
Description: ${generatedCTAs.cta_variants.beginning.cta.description}
Action: ${generatedCTAs.cta_variants.beginning.cta.action_button}

Original Shortcode:
${generatedCTAs.cta_variants.beginning.shortcode}

Styled Shortcode (with Apollo design):
${generateStyledShortcode(generatedCTAs.cta_variants.beginning)}

## Middle CTA
Category: ${generatedCTAs.cta_variants.middle.cta.category_header}
Headline: ${generatedCTAs.cta_variants.middle.cta.headline}
Description: ${generatedCTAs.cta_variants.middle.cta.description}
Action: ${generatedCTAs.cta_variants.middle.cta.action_button}

Original Shortcode:
${generatedCTAs.cta_variants.middle.shortcode}

Styled Shortcode (with Apollo design):
${generateStyledShortcode(generatedCTAs.cta_variants.middle)}

## End CTA
Category: ${generatedCTAs.cta_variants.end.cta.category_header}
Headline: ${generatedCTAs.cta_variants.end.cta.headline}
Description: ${generatedCTAs.cta_variants.end.cta.description}
Action: ${generatedCTAs.cta_variants.end.cta.action_button}

Original Shortcode:
${generatedCTAs.cta_variants.end.shortcode}

Styled Shortcode (with Apollo design):
${generateStyledShortcode(generatedCTAs.cta_variants.end)}

## Notes:
- Original Shortcodes: Content-only versions for custom styling
- Styled Shortcodes: Complete HTML with Apollo branding, ready to paste into any website
- Logo Path: Update "/apollo logo only.png" to match your website's logo location
- Button Links: Replace href="#" with your actual landing page URLs
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apollo-ctas-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Show preview interface with current CTAs and article structure
   * Why this matters: Allows users to see exact CTA placement before applying changes,
   * preventing errors and building confidence in the automated system.
   */
  const showPreviewWithCTAs = () => {
    if (!generatedCTAs || !articleStructure) {
      setError('Preview requires generated CTAs and article structure');
      return;
    }
    setShowPreviewInterface(true);
  };

  /**
   * Handle applying CTA changes from preview interface
   * Why this matters: Processes the user's final CTA placement selections and generates
   * the final HTML output with CTAs inserted at chosen positions.
   */
  const handleApplyChanges = async (selectedPlacements: { [key: string]: any }, exportFormats?: any) => {
    try {
      setGenerationStage('Generating final HTML...');
      
      // Call backend to generate final HTML with selected placements
      const endpoint = buildApiUrl('/api/cta-generation/apply-placements');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_content: originalContent,
          article_structure: articleStructure,
          selected_placements: selectedPlacements,
          input_method: inputMethod
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store the final HTML result by extending current data
        const finalResult = {
          ...generatedCTAs!,
          ...(result.data.final_html && { final_html: result.data.final_html }),
          ...(result.data.formats && { export_formats: result.data.formats }),
          ...(selectedPlacements && { selected_placements: selectedPlacements }),
          generation_timestamp: new Date().toISOString()
        } as CTAGenerationResult & { 
          final_html?: string; 
          export_formats?: any;
          selected_placements?: any 
        };
        
        setGeneratedCTAs(finalResult);
        setShowPreviewInterface(false);
        setGenerationStage('');
        
        // Save final result to localStorage
        saveCTAsToStorage(generatedCTAs!);
        
        // Show success message
        setCopySuccess('final_html');
        setTimeout(() => setCopySuccess(''), 3000);
        
      } else {
        setError(result.error || 'Failed to generate final HTML');
      }
    } catch (error) {
      console.error('Error applying CTA changes:', error);
      setError('Failed to apply CTA changes');
    } finally {
      setGenerationStage('');
    }
  };

  /**
   * Return from preview interface to main CTA creator
   * Why this matters: Provides navigation back to the generator interface
   * while preserving all generated data.
   */
  const handleBackFromPreview = () => {
    setShowPreviewInterface(false);
  };

  // Show preview interface if activated
  if (showPreviewInterface && generatedCTAs && articleStructure) {
    // Ensure insertionPoints is always an array
    const insertionPoints = (generatedCTAs as any).insertion_points;
    const safeInsertionPoints = Array.isArray(insertionPoints) ? insertionPoints : [];
    
    return (
      <ArticlePreviewInterface
        originalContent={originalContent}
        articleStructure={articleStructure}
        insertionPoints={safeInsertionPoints}
        ctaVariants={generatedCTAs.cta_variants}
        onApplyChanges={handleApplyChanges}
        onBack={handleBackFromPreview}
      />
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{ 
        width: '100%', 
        margin: '0 auto',
        paddingLeft: '2rem',
        paddingRight: '2rem'
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
            Generate hyper-relevant CTAs that convert using Apollo's Voice of Customer insights.
          </p>
        </div>

        {/* VoC Kit Status Check */}
        {!vocKitReady && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#E0DBFF',
            border: '0.125rem solid #B8B0E8',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <AlertCircle size={24} style={{ color: '#3b82f6' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: '#1e40af' }}>
                VoC Kit Setup Required
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                Please extract customer pain points in the VoC Kit before generating CTAs.
              </p>
            </div>
            <a 
              href="/voc-kit" 
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#EBF212',
                color: 'black',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '700',
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

        {vocKitReady && !vocKitReadyDismissed && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#dcfce7',
            border: '1px solid #22c55e',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            width: 'fit-content',
            margin: '0 auto 2rem auto',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={20} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: '500' }}>
                VoC Kit is ready!
              </span>
            </div>
            <button
              onClick={dismissVocKitReady}
              style={{
                padding: '0.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#bbf7d0';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Dismiss this notification"
            >
              <X size={16} style={{ color: '#16a34a' }} />
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: (generatedCTAs || showSkeletons) ? '40% 60%' : '1fr', gap: '3rem', width: '100%' }}>
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

            {/* Input Method Toggle */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => !isGenerating && setInputMethod('url')}
                  disabled={isGenerating}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: inputMethod === 'url' ? '#3b82f6' : (isGenerating ? '#f9fafb' : 'white'),
                    color: inputMethod === 'url' ? 'white' : (isGenerating ? '#9ca3af' : '#374151'),
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    opacity: isGenerating ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Article URL
                </button>
                <button
                  onClick={() => !isGenerating && setInputMethod('text')}
                  disabled={isGenerating}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: inputMethod === 'text' ? '#3b82f6' : (isGenerating ? '#f9fafb' : 'white'),
                    color: inputMethod === 'text' ? 'white' : (isGenerating ? '#9ca3af' : '#374151'),
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    opacity: isGenerating ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Paste Text/HTML
                </button>
                <button
                  onClick={() => !isGenerating && setInputMethod('markdown')}
                  disabled={isGenerating}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: inputMethod === 'markdown' ? '#3b82f6' : (isGenerating ? '#f9fafb' : 'white'),
                    color: inputMethod === 'markdown' ? 'white' : (isGenerating ? '#9ca3af' : '#374151'),
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    opacity: isGenerating ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Paste Markdown
                </button>
              </div>

              {/* URL Input */}
              {inputMethod === 'url' && (
                <div>
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
              )}

              {/* Text Input */}
              {inputMethod === 'text' && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    Article Text or HTML
                  </label>
                  <textarea
                    value={articleText}
                    onChange={(e) => setArticleText(e.target.value)}
                    placeholder="Paste your article content here (supports plain text or HTML)..."
                    disabled={isGenerating}
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      backgroundColor: isGenerating ? '#f9fafb' : 'white',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    margin: '0.5rem 0 0 0',
                    lineHeight: '1.4'
                  }}>
                    You can paste plain text, HTML, or rich content. The system will extract the key information for analysis.
                  </p>
                </div>
              )}

              {/* Markdown Input */}
              {inputMethod === 'markdown' && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    Markdown Content
                  </label>
                  <textarea
                    value={articleMarkdown}
                    onChange={(e) => setArticleMarkdown(e.target.value)}
                    placeholder="# Your Article Title

## Introduction
Paste your markdown content here...

- Supports all standard markdown syntax
- Headers, lists, links, etc.
- Perfect for technical content and documentation"
                    disabled={isGenerating}
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      backgroundColor: isGenerating ? '#f9fafb' : 'white',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    margin: '0.5rem 0 0 0',
                    lineHeight: '1.4'
                  }}>
                    Paste standard markdown content. Supports headers, lists, links, code blocks, and all common markdown syntax.
                  </p>
                </div>
              )}
            </div>



            <button
              onClick={generateCTAs}
              disabled={isGenerating || !vocKitReady || (inputMethod === 'url' && !articleUrl.trim()) || (inputMethod === 'text' && !articleText.trim()) || (inputMethod === 'markdown' && !articleMarkdown.trim())}
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                backgroundColor: (isGenerating || !vocKitReady || (inputMethod === 'url' && !articleUrl.trim()) || (inputMethod === 'text' && !articleText.trim()) || (inputMethod === 'markdown' && !articleMarkdown.trim())) ? '#9ca3af' : '#EBF212',
                color: (isGenerating || !vocKitReady || (inputMethod === 'url' && !articleUrl.trim()) || (inputMethod === 'text' && !articleText.trim()) || (inputMethod === 'markdown' && !articleMarkdown.trim())) ? 'white' : 'black',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: (isGenerating || !vocKitReady || (inputMethod === 'url' && !articleUrl.trim()) || (inputMethod === 'text' && !articleText.trim()) || (inputMethod === 'markdown' && !articleMarkdown.trim())) ? 'not-allowed' : 'pointer',
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
                  {generationStage || (generatedCTAs ? 'Regenerating CTAs...' : 'Generating CTAs...')}
                </>
              ) : (
                <>
                  <Target size={20} strokeWidth={3} />
                  {generatedCTAs ? 'Regenerate CTAs' : 'Generate CTAs'}
                </>
              )}
            </button>

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

          {/* Skeleton Loading Section */}
          {showSkeletons && (
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              {/* Skeleton Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <Skeleton style={{ height: '2rem', width: '12rem' }} />
                  <Skeleton style={{ height: '2.5rem', width: '8rem' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Skeleton style={{ height: '1.5rem', width: '8rem' }} />
                  <Skeleton style={{ height: '1.5rem', width: '10rem' }} />
                </div>
              </div>

              {/* Skeleton CTA Variants */}
              <div style={{ display: 'grid', gap: '2rem' }}>
                {['beginning', 'middle', 'end'].map((position) => (
                  <div key={position} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    backgroundColor: '#fafafa'
                  }}>
                    {/* Skeleton Position Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Skeleton style={{ height: '1.5rem', width: '6rem' }} />
                        <Skeleton style={{ height: '1rem', width: '8rem' }} />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Skeleton style={{ height: '2rem', width: '6rem' }} />
                        <Skeleton style={{ height: '2rem', width: '6rem' }} />
                      </div>
                    </div>

                    {/* Skeleton CTA Preview */}
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '1.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      marginBottom: '1rem'
                    }}>
                      <Skeleton style={{ height: '1rem', width: '8rem', marginBottom: '0.5rem' }} />
                      <Skeleton style={{ height: '1.5rem', width: '100%', marginBottom: '0.75rem' }} />
                      <Skeleton style={{ height: '1rem', width: '90%', marginBottom: '1rem' }} />
                      <Skeleton style={{ height: '2.5rem', width: '8rem' }} />
                    </div>

                    {/* Skeleton Shortcode */}
                    <div>
                      <Skeleton style={{ height: '0.75rem', width: '5rem', marginBottom: '0.5rem' }} />
                      <Skeleton style={{ height: '4rem', width: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Skeleton Pain Point Context */}
              <div style={{ 
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <Skeleton style={{ height: '1rem', width: '12rem', marginBottom: '0.75rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1rem' }}>
                  <div>
                    <Skeleton style={{ height: '0.75rem', width: '8rem', marginBottom: '0.25rem' }} />
                    <Skeleton style={{ height: '3rem', width: '100%' }} />
                  </div>
                  <div>
                    <Skeleton style={{ height: '0.75rem', width: '10rem', marginBottom: '0.25rem' }} />
                    <Skeleton style={{ height: '3rem', width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {generatedCTAs && !showSkeletons && (
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
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {FEATURE_FLAGS.showPreviewArticle && articleStructure && (
                      <button
                        onClick={showPreviewWithCTAs}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#EBF212',
                          color: 'black',
                          border: '1px solid #EBF212',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Target size={16} />
                        Preview Article
                      </button>
                    )}
                    
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
                    
                    <button
                      onClick={() => setShowClearModal(true)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      Clear Results
                    </button>
                  </div>
                </div>
                

              </div>

              {/* VoC Insights Summary - Hidden for cleaner interface */}
              {/* Removed VoC integration stats section for cleaner UI */}

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
                      </div>
                      
                      <div style={{ display: 'none' }}>
                        {/* Hidden - using dedicated shortcode copy buttons below instead */}
                      </div>
                    </div>

                    {/* CTA Preview - Apollo Design */}
                    <div style={{ 
                      backgroundColor: '#192307',
                      padding: '2rem',
                      borderRadius: '0.875rem',
                      marginBottom: '1rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Category Header */}
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#ffffff',
                        marginBottom: '1rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase'
                      }}>
                        {ctaData.cta.category_header}
                      </div>

                      {/* Content Layout with Logo */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                        {/* Apollo Logo */}
                        <div style={{
                          width: '4rem',
                          height: '4rem',
                          borderRadius: '0.75rem',
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          <img 
                            src="/apollo logo only.png" 
                            alt="Apollo Logo"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: '700', 
                            color: '#ffffff',
                            margin: '0 0 1rem 0',
                            lineHeight: '1.3'
                          }}>
                            {ctaData.cta.headline}
                          </h4>

                          <p style={{ 
                            fontSize: '1rem', 
                            color: '#ffffff',
                            lineHeight: '1.6',
                            margin: '0 0 1.5rem 0',
                            opacity: 0.9
                          }}>
                            {ctaData.cta.description}
                          </p>

                          {/* CTA Button */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1rem 2rem',
                            backgroundColor: '#BDF548',
                            color: '#192307',
                            borderRadius: '0.625rem',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(189, 245, 72, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#A8E63A';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(189, 245, 72, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#BDF548';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(189, 245, 72, 0.3)';
                          }}
                          >
                            {ctaData.cta.action_button.replace(/\s*→\s*$/, '')}
                            <span style={{ fontSize: '1.1rem' }}>→</span>
                          </div>
                        </div>
                      </div>

                      {/* Change CTA Button - Positioned outside the main design */}
                      <div style={{ 
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem'
                      }}>
                        <button
                          onClick={() => cycleCTAButton(position as 'beginning' | 'middle' | 'end')}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            backdropFilter: 'blur(10px)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          title="Change to a different CTA button"
                        >
                          <RotateCcw size={12} />
                          Change CTA
                        </button>
                      </div>
                    </div>

                    {/* VoC Insights for this CTA */}
                    {((generatedCTAs?.position_specific_context?.[position as keyof typeof generatedCTAs.position_specific_context]) || generatedCTAs?.pain_point_context) && vocKitReady && (
                      <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            width: '0.75rem',
                            height: '0.75rem',
                            borderRadius: '50%',
                            backgroundColor: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckCircle size={8} style={{ color: 'white' }} />
                          </div>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#16a34a'
                          }}>
                            🎯 VoC Insights Used in This {position === 'end' ? 'Ending' : position.charAt(0).toUpperCase() + position.slice(1)} CTA
                          </span>
                        </div>

                        <div style={{ fontSize: '0.625rem', color: '#374151' }}>
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>💬 Customer Language Used:</div>
                          {(generatedCTAs.position_specific_context?.[position as keyof typeof generatedCTAs.position_specific_context]?.customer_quotes ||
                            generatedCTAs.pain_point_context?.customer_quotes_used || [])?.map((quote: string, idx: number) => (
                            <div key={idx} style={{
                              fontSize: '0.6875rem',
                              fontStyle: 'italic',
                              color: '#059669',
                              backgroundColor: '#ecfdf5',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              marginBottom: '0.25rem',
                              border: '1px solid #bbf7d0'
                            }}>
                              "{quote}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                              <div style={{ 
                                backgroundColor: '#192307',
                                padding: '2rem',
                                borderRadius: '0.875rem',
                                marginTop: '0.5rem',
                                position: 'relative'
                              }}>
                                {/* Category Header */}
                                <div style={{ 
                                  fontSize: '0.875rem', 
                                  fontWeight: '600', 
                                  color: '#ffffff',
                                  marginBottom: '1rem',
                                  letterSpacing: '0.1em',
                                  textTransform: 'uppercase'
                                }}>
                                  {parsed.category}
                                </div>

                                {/* Content Layout with Logo */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                                  {/* Apollo Logo */}
                                  <div style={{
                                    width: '4rem',
                                    height: '4rem',
                                    borderRadius: '0.75rem',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    position: 'relative'
                                  }}>
                                    <img 
                                      src="/apollo logo only.png" 
                                      alt="Apollo Logo"
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                    />
                                  </div>

                                  {/* Content */}
                                  <div style={{ flex: 1 }}>
                                    <h4 style={{ 
                                      fontSize: '1.5rem', 
                                      fontWeight: '700', 
                                      color: '#ffffff',
                                      margin: '0 0 1rem 0',
                                      lineHeight: '1.3'
                                    }}>
                                      {parsed.headline}
                                    </h4>

                                    <p style={{ 
                                      fontSize: '1rem', 
                                      color: '#ffffff',
                                      lineHeight: '1.6',
                                      margin: '0 0 1.5rem 0',
                                      opacity: 0.9
                                    }}>
                                      {parsed.description}
                                    </p>

                                    {/* CTA Button */}
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '1rem 2rem',
                                      backgroundColor: '#BDF548',
                                      color: '#192307',
                                      borderRadius: '0.625rem',
                                      fontSize: '1rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      boxShadow: '0 4px 12px rgba(189, 245, 72, 0.3)'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.backgroundColor = '#A8E63A';
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(189, 245, 72, 0.4)';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.backgroundColor = '#BDF548';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(189, 245, 72, 0.3)';
                                    }}
                                    >
                                      {parsed.action.replace(/\s*→\s*$/, '')}
                                      <span style={{ fontSize: '1.1rem' }}>→</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Change CTA Button - Positioned in corner */}
                                <div style={{ 
                                  position: 'absolute',
                                  top: '1rem',
                                  right: '1rem'
                                }}>
                                  <button
                                    onClick={() => cycleCTAButton(position as 'beginning' | 'middle' | 'end')}
                                    style={{
                                      padding: '0.5rem 0.75rem',
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                      color: '#ffffff',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      borderRadius: '0.375rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.375rem',
                                      fontSize: '0.75rem',
                                      fontWeight: '500',
                                      transition: 'all 0.2s ease',
                                      backdropFilter: 'blur(10px)'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                    title="Change to a different CTA button"
                                  >
                                    <RotateCcw size={12} />
                                    Change CTA
                                  </button>
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

                    {/* Code Options */}
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {/* Styled Shortcode */}
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem' 
                        }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151' }}>
                            Styled Shortcode (with Apollo design):
                          </div>
                          <button
                            onClick={() => {
                              const styledShortcode = `<div style="background-color: #192307; padding: 2rem; border-radius: 0.875rem; position: relative;">
  <div style="font-size: 0.875rem; font-weight: 600; color: #ffffff; margin-bottom: 1rem; letter-spacing: 0.1em; text-transform: uppercase;">
    ${ctaData.cta.category_header}
  </div>
  <div style="display: flex; align-items: flex-start; gap: 1.5rem;">
    <div style="width: 4rem; height: 4rem; border-radius: 0.75rem; overflow: hidden; flex-shrink: 0;">
      <img src="/apollo logo only.png" alt="Apollo Logo" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
    <div style="flex: 1;">
      <h4 style="font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0 1rem 0; line-height: 1.3;">
        ${ctaData.cta.headline}
      </h4>
      <p style="font-size: 1rem; color: #ffffff; line-height: 1.6; margin: 0 0 1.5rem 0; opacity: 0.9;">
        ${ctaData.cta.description}
      </p>
      <a href="#" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; background-color: #BDF548; color: #192307; border-radius: 0.625rem; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(189, 245, 72, 0.3); text-decoration: none;">
        ${ctaData.cta.action_button.replace(/\s*→\s*$/, '')}
        <span style="font-size: 1.1rem;">→</span>
      </a>
    </div>
  </div>
</div>`;
                              copyToClipboard(styledShortcode, `${position}_styled`);
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: copySuccess === `${position}_styled` ? '#dcfce7' : '#6b7280',
                              color: copySuccess === `${position}_styled` ? '#16a34a' : 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {copySuccess === `${position}_styled` ? (
                              <>
                                <CheckCircle size={10} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={10} />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div style={{
                          backgroundColor: '#f3f4f6',
                          padding: '0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.6rem',
                          fontFamily: 'monospace',
                          color: '#374151',
                          whiteSpace: 'pre-wrap',
                          border: '1px solid #e5e7eb',
                          maxHeight: '6rem',
                          overflow: 'auto'
                        }}>
                          {`<div style="background-color: #192307; padding: 2rem; border-radius: 0.875rem;">
  <div style="font-size: 0.875rem; font-weight: 600; color: #ffffff; margin-bottom: 1rem; text-transform: uppercase;">
    ${ctaData.cta.category_header}
  </div>
  <div style="display: flex; align-items: flex-start; gap: 1.5rem;">
    <img src="/apollo logo only.png" alt="Apollo" style="width: 4rem; height: 4rem; border-radius: 0.75rem;" />
    <div style="flex: 1;">
      <h4 style="font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0 1rem 0;">
        ${ctaData.cta.headline}
      </h4>
      <p style="font-size: 1rem; color: #ffffff; margin: 0 0 1.5rem 0; opacity: 0.9;">
        ${ctaData.cta.description}
      </p>
      <a href="#" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; background-color: #BDF548; color: #192307; border-radius: 0.625rem; font-weight: 700; text-decoration: none;">
        ${ctaData.cta.action_button.replace(/\s*→\s*$/, '')} <span>→</span>
      </a>
    </div>
  </div>
</div>`}
                        </div>
                      </div>

                      {/* Original Shortcode */}
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem' 
                        }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151' }}>
                            Original Shortcode (content only):
                          </div>
                          <button
                            onClick={() => copyToClipboard(ctaData.shortcode, `${position}_original`)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: copySuccess === `${position}_original` ? '#dcfce7' : '#6b7280',
                              color: copySuccess === `${position}_original` ? '#16a34a' : 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {copySuccess === `${position}_original` ? (
                              <>
                                <CheckCircle size={10} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={10} />
                                Copy
                              </>
                            )}
                          </button>
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
                          maxHeight: '4rem',
                          overflow: 'auto'
                        }}>
                          {ctaData.shortcode}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Final HTML Output Section */}
              {(generatedCTAs as any)?.final_html && (
                <div style={{
                  marginTop: '2rem',
                  border: '1px solid #16a34a',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  backgroundColor: '#f0fdf4'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle size={20} style={{ color: '#16a34a' }} />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#16a34a' }}>
                        Final Article with CTAs
                      </h3>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => copyToClipboard((generatedCTAs as any).final_html, 'final_html')}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Copy size={16} />
                        {copySuccess === 'final_html' ? 'Copied!' : 'Copy HTML'}
                      </button>
                      
                      {(generatedCTAs as any)?.export_formats && (
                        <>
                          <button
                            onClick={() => copyToClipboard((generatedCTAs as any).export_formats.markdown, 'markdown')}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Copy size={16} />
                            {copySuccess === 'markdown' ? 'Copied!' : 'Copy Markdown'}
                          </button>
                          
                          <button
                            onClick={() => copyToClipboard((generatedCTAs as any).export_formats.plain_text, 'plain_text')}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Copy size={16} />
                            {copySuccess === 'plain_text' ? 'Copied!' : 'Copy Text'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#16a34a', margin: 0 }}>
                      ✅ Your article is ready! The HTML below includes all selected CTAs at their optimal positions.
                    </p>
                  </div>
                  
                  <div style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    maxHeight: '20rem',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {(generatedCTAs as any).final_html}
                  </div>
                  
                  <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#16a34a' }}>
                    💡 Copy this HTML and paste it directly into your CMS or website editor.
                  </div>
                </div>
              )}

            </div>
          )}
        </div>


      </div>

      {/* Clear Results Confirmation Modal */}
      {showClearModal && (
        <div className={`confirmation-modal-backdrop ${showClearModal ? 'open' : ''}`}>
          <div className={`confirmation-modal ${showClearModal ? 'open' : ''}`}>
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                <AlertTriangle style={{width: '1.5rem', height: '1.5rem'}} />
              </div>
              <h3 className="confirmation-modal-title">Clear Generated CTAs?</h3>
              <p className="confirmation-modal-message">
                This action will permanently delete all your generated CTAs and saved inputs. This cannot be undone.
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
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default CTACreatorPage;
