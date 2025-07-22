import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Download, ExternalLink, Globe, ChevronDown, Search, Clock, CheckCircle, Copy, Check } from 'lucide-react';
import { BrandKit } from '../types';
import googleDocsService from '../services/googleDocsService';

// Import the KeywordRow interface from BlogCreatorPage
interface KeywordRow {
  id: string;
  keyword: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: string;
  output: string;
  createdAt: Date;
  metadata?: {
    title: string;
    description: string;
    word_count: number;
    seo_optimized: boolean;
    citations_included: boolean;
    brand_variables_processed: number;
    aeo_optimized: boolean;
  };
  generationResult?: any; // Complete API response for debugging/analysis
}

interface BlogContentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  keywordRow: KeywordRow;
  onContentUpdate?: (keywordId: string, newContent: string) => void;
  onStatusUpdate?: (keywordId: string, status: KeywordRow['status']) => void;
}

/**
 * Variables Menu Component
 * Why this matters: Provides a searchable popup positioned relative to the Variables Menu button.
 * Moved outside main component to prevent re-creation on every render and maintain input focus.
 */
const VariablesMenu: React.FC<{
  showVariablesMenu: boolean;
  variablesButtonPosition: { top: number; left: number } | null;
  variablesMenuRef: React.RefObject<HTMLDivElement | null>;
  activePromptField: 'system' | 'user';
  variableSearchTerm: string;
  setVariableSearchTerm: (term: string) => void;
  setShowVariablesMenu: (show: boolean) => void;
  brandKit: BrandKit | null;
  insertVariable: (value: string) => void;
}> = ({
  showVariablesMenu,
  variablesButtonPosition,
  variablesMenuRef,
  activePromptField,
  variableSearchTerm,
  setVariableSearchTerm,
  setShowVariablesMenu,
  brandKit,
  insertVariable
}) => {
  if (!showVariablesMenu || !variablesButtonPosition) return null;

  /**
   * Get all available variables
   * Why this matters: Provides a comprehensive list of brand variables for easy insertion.
   */
  const getAllVariables = () => {
    const standardVariables = [
      { key: 'url', label: 'Brand URL', value: '{{ brand_kit.url }}' },
      { key: 'about_brand', label: 'About Brand', value: '{{ brand_kit.about_brand }}' },
      { key: 'ideal_customer_profile', label: 'Ideal Customer Profile', value: '{{ brand_kit.ideal_customer_profile }}' },
      { key: 'competitors', label: 'Competitors', value: '{{ brand_kit.competitors }}' },
      { key: 'brand_point_of_view', label: 'Brand Point of View', value: '{{ brand_kit.brand_point_of_view }}' },
      { key: 'author_persona', label: 'Author Persona', value: '{{ brand_kit.author_persona }}' },
      { key: 'tone_of_voice', label: 'Tone of Voice', value: '{{ brand_kit.tone_of_voice }}' },
      { key: 'header_case_type', label: 'Header Case Type', value: '{{ brand_kit.header_case_type }}' },
      { key: 'writing_rules', label: 'Writing Rules', value: '{{ brand_kit.writing_rules }}' },
      { key: 'cta_text', label: 'CTA Text', value: '{{ brand_kit.cta_text }}' },
      { key: 'cta_destination', label: 'CTA Destination', value: '{{ brand_kit.cta_destination }}' }
    ];

    const customVariables = brandKit ? Object.keys(brandKit.customVariables).map(key => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: `{{ brand_kit.${key} }}`
    })) : [];

    return [...customVariables, ...standardVariables];
  };

  /**
   * Filter variables based on search term
   * Why this matters: Makes it easy to find specific variables in a long list.
   */
  const getFilteredVariables = () => {
    const allVariables = getAllVariables();
    if (!variableSearchTerm) return allVariables;
    
    return allVariables.filter(variable => 
      variable.label.toLowerCase().includes(variableSearchTerm.toLowerCase()) ||
      variable.key.toLowerCase().includes(variableSearchTerm.toLowerCase())
    );
  };

  const filteredVariables = getFilteredVariables();

  return (
    <div
      ref={variablesMenuRef}
      className="content-variables-menu"
      style={{
        position: 'fixed',
        top: variablesButtonPosition.top,
        left: variablesButtonPosition.left,
        backgroundColor: 'white',
        border: '0.0625rem solid #e5e7eb',
        borderRadius: '0.75rem',
        boxShadow: '0 1.5625rem 3.125rem -0.75rem rgba(0, 0, 0, 0.25)',
        zIndex: 10000,
        width: '25rem',
        maxHeight: '37.5rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1.5rem 1.5rem 1rem 1.5rem',
        borderBottom: '0.0625rem solid #f3f4f6',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#111827' }}>
            Brand Variables
          </h3>
          <button
            onClick={() => setShowVariablesMenu(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
          Insert into {activePromptField} prompt
        </p>
      </div>

      {/* Search */}
      <div style={{ padding: '1rem 1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ 
            position: 'absolute', 
            left: '0.75rem', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#9ca3af',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Search variables..."
            value={variableSearchTerm}
            onChange={(e) => setVariableSearchTerm(e.target.value)}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '0.625rem 0.625rem 0.625rem 2.5rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'white',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              cursor: 'text',
              color: '#374151'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.backgroundColor = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.backgroundColor = 'white';
            }}
          />
        </div>
      </div>

      {/* Variables List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 1.5rem 1.5rem' }}>
        {filteredVariables.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredVariables.map((variable) => (
              <div
                key={variable.key}
                onClick={() => insertVariable(variable.value)}
                style={{
                  padding: '1rem',
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: 'white'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '0.875rem', 
                  marginBottom: '0.5rem',
                  color: '#374151'
                }}>
                  {variable.label}
                </div>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem', 
                  color: '#7c3aed',
                  backgroundColor: '#f3f4f6',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  border: '0.0625rem solid #e5e7eb',
                  fontWeight: '600'
                }}>
                  {variable.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#9ca3af' 
          }}>
            <Search size={32} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
            <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
              No variables found
            </p>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>
              Try adjusting your search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * BlogContentActionModal Component
 * Why this matters: Provides post-generation actions for Blog Creator content that are identical to ContentCreationModal
 * for consistent UX - edit, publish, copy, and manage generated articles with brand kit integration.
 */
const BlogContentActionModal: React.FC<BlogContentActionModalProps> = ({ 
  isOpen, 
  onClose, 
  keywordRow, 
  onContentUpdate, 
  onStatusUpdate 
}) => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [metaSeoTitle, setMetaSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMetaTitleCopied, setShowMetaTitleCopied] = useState(false);
  const [showMetaDescCopied, setShowMetaDescCopied] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [showCMSModal, setShowCMSModal] = useState(false);
  const [showVariablesMenu, setShowVariablesMenu] = useState(false);
  const [activePromptField, setActivePromptField] = useState<'system' | 'user'>('system');
  const [variableSearchTerm, setVariableSearchTerm] = useState('');
  const [variablesButtonPosition, setVariablesButtonPosition] = useState<{ top: number; left: number } | null>(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasUserInput, setHasUserInput] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showComingSoonMessage, setShowComingSoonMessage] = useState<string | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [showGeneratedContentModal, setShowGeneratedContentModal] = useState(false);
  
  // Custom CMS Demo States
  const [showCustomCMSForm, setShowCustomCMSForm] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [customCMSConfig, setCustomCMSConfig] = useState({
    api_endpoint: 'https://api.buttercms.com/v2',
    api_key: 'demo-api-key-12345',
    cms_type: 'Butter CMS'
  });
  
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const userPromptRef = useRef<HTMLTextAreaElement>(null);
  const variablesMenuRef = useRef<HTMLDivElement>(null);
  const systemVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const userVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const generationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const editableContentRef = useRef<HTMLTextAreaElement>(null);

  // Generation progress messages for Blog Creator
  const generationMessages = [
    'Extracting content from top search results with Firecrawl...',
    'Performing comprehensive OpenAI Deep Research...',
    'Analyzing gaps with GPT 4.1 nano...',
    'Generating optimized article with Claude Sonnet 4...',
    'Almost done...'
  ];

  // Add CSS for textarea styling and generated content formatting
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .content-creation-textarea {
        font-family: inherit;
        line-height: 1.5;
      }
      
      .content-creation-textarea::placeholder {
        color: #9ca3af;
      }
      
      .content-creation-textarea:focus {
        outline: none;
        border-color: #3b82f6 !important;
      }

      .generated-content-display {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #374151;
      }

      .generated-content-display h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 1.5rem 0;
        line-height: 1.2;
        border-bottom: 0.125rem solid #f3f4f6;
        padding-bottom: 0.75rem;
      }

      .generated-content-display h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin: 2rem 0 1rem 0;
        line-height: 1.3;
      }

      .generated-content-display h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #374151;
        margin: 1.5rem 0 0.75rem 0;
        line-height: 1.4;
      }

      .generated-content-display p {
        margin: 0 0 1.25rem 0;
        line-height: 1.7;
      }

      .generated-content-display ul, 
      .generated-content-display ol {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }

      .generated-content-display li {
        margin: 0.5rem 0;
        line-height: 1.6;
      }

      .generated-content-display strong {
        font-weight: 600;
        color: #111827;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  /**
   * Close variables menu when clicking outside
   * Why this matters: Provides intuitive UX for the dropdown menu.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variablesMenuRef.current && !variablesMenuRef.current.contains(event.target as Node)) {
        setShowVariablesMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Extract meta fields from malformed JSON response
   * Why this matters: Handles cases where the AI response contains the JSON structure but isn't properly formatted
   */
  const extractFieldsFromMalformedJSON = (responseText: string): { content: string; metaSeoTitle: string; metaDescription: string } => {
    console.log('🔧 Attempting field extraction from malformed JSON');
    
    let content = '';
    let metaSeoTitle = '';
    let metaDescription = '';
    
    try {
      // Extract content field - look for "content": and find the value until the next field
      const contentMatch = responseText.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:metaSeoTitle|metaDescription)"/);
      if (contentMatch) {
        content = contentMatch[1]
          .replace(/\\"/g, '"')  // Unescape quotes
          .replace(/\\n/g, '\n') // Unescape newlines
          .replace(/\\t/g, '\t') // Unescape tabs
          .replace(/\\\\/g, '\\'); // Unescape backslashes
        console.log('✅ Extracted content field');
      }
      
      // Extract metaSeoTitle field
      const titleMatch = responseText.match(/"metaSeoTitle"\s*:\s*"([^"]*?)"/);
      if (titleMatch) {
        metaSeoTitle = titleMatch[1];
        console.log('✅ Extracted metaSeoTitle field:', metaSeoTitle);
      }
      
      // Extract metaDescription field
      const descMatch = responseText.match(/"metaDescription"\s*:\s*"([^"]*?)"/);
      if (descMatch) {
        metaDescription = descMatch[1];
        console.log('✅ Extracted metaDescription field:', metaDescription);
      }
      
    } catch (error) {
      console.log('❌ Field extraction failed:', error);
    }
    
    return { content, metaSeoTitle, metaDescription };
  };



  /**
   * Clean AI-generated content by removing unwanted commentary and formatting
   * Why this matters: Ensures clean HTML output by stripping AI meta-commentary and markdown formatting.
   */
  const cleanAIContent = (content: string): string => {
    let cleaned = content;
    
    // Remove JSON metadata that might be mixed in with content
    cleaned = cleaned.replace(/\{\s*"metaSeoTitle"\s*:\s*"[^"]*"\s*,[\s\S]*?\}/g, '');
    cleaned = cleaned.replace(/\{\s*"content"\s*:\s*"[\s\S]*?"metaSeoTitle"[\s\S]*?\}/g, '');
    
    // Remove common AI introductory phrases
    cleaned = cleaned.replace(/^.*?Here's the.*?content.*?:?\s*/i, '');
    cleaned = cleaned.replace(/^.*?Here's an.*?optimized.*?:?\s*/i, '');
    cleaned = cleaned.replace(/^.*?I'll create.*?:?\s*/i, '');
    cleaned = cleaned.replace(/^.*?Based on.*?analysis.*?:?\s*/i, '');
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```html\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    
    // Remove explanatory text at the end (typically starts with patterns like "This content structure:")
    cleaned = cleaned.replace(/\n\s*This content structure:[\s\S]*$/i, '');
    cleaned = cleaned.replace(/\n\s*Would you like me to[\s\S]*$/i, '');
    cleaned = cleaned.replace(/\n\s*The content includes:[\s\S]*$/i, '');
    cleaned = cleaned.replace(/\n\s*Key features of this content:[\s\S]*$/i, '');
    
    // Remove numbered analysis points at the end
    cleaned = cleaned.replace(/\n\s*\d+\.\s+[A-Z][^<\n]*[\s\S]*$/i, '');
    
    // If content starts with HTML, ensure it starts with a proper tag
    if (cleaned.includes('<') && !cleaned.trim().startsWith('<')) {
      const htmlStart = cleaned.indexOf('<');
      if (htmlStart > 0) {
        cleaned = cleaned.substring(htmlStart);
      }
    }
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  };

  /**
   * Parse AI response and extract JSON fields
   * Why this matters: Properly extracts content, metaSeoTitle, and metaDescription from AI JSON response.
   */
  const parseAIResponse = (responseText: string): { content: string; metaSeoTitle: string; metaDescription: string } => {
    // Add detailed logging for debugging
    console.log('🔍 Raw AI Response Length:', responseText.length);
    console.log('🔍 Raw AI Response Preview:', responseText.substring(0, 200) + '...');
    console.log('🔍 Raw AI Response End:', '...' + responseText.substring(responseText.length - 200));
    
    try {
      // Clean the response text first
      let cleanedResponse = responseText.trim();
      
      // Remove any markdown code blocks that might be wrapping the JSON
      cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '');
      cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');
      cleanedResponse = cleanedResponse.replace(/^```\s*/i, '');
      
      console.log('🔍 Cleaned Response Length:', cleanedResponse.length);
      console.log('🔍 Cleaned Response Preview:', cleanedResponse.substring(0, 200) + '...');
      
      // First, try to parse the entire response as JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
        console.log('✅ Successfully parsed entire response as JSON');
      } catch (parseError) {
        console.log('❌ Failed to parse entire response as JSON:', parseError);
        
        // Try to find JSON object boundaries more carefully
        let jsonStart = cleanedResponse.indexOf('{');
        let jsonEnd = cleanedResponse.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const potentialJson = cleanedResponse.substring(jsonStart, jsonEnd + 1);
          console.log('🔍 Extracted potential JSON:', potentialJson.substring(0, 200) + '...');
          
          try {
            parsed = JSON.parse(potentialJson);
            console.log('✅ Successfully parsed extracted JSON');
          } catch (extractError) {
            console.log('❌ Failed to parse extracted JSON:', extractError);
            
            // Try more aggressive pattern matching
            const jsonMatches = cleanedResponse.match(/\{[^{}]*"content"[^{}]*"metaSeoTitle"[^{}]*"metaDescription"[^{}]*\}/g) ||
                               cleanedResponse.match(/\{[^{}]*"metaSeoTitle"[^{}]*"metaDescription"[^{}]*"content"[^{}]*\}/g) ||
                               cleanedResponse.match(/\{[\s\S]*?\}/g);
            
            console.log('🔍 Pattern matches found:', jsonMatches?.length || 0);
            
            if (jsonMatches && jsonMatches.length > 0) {
              // Try the longest match first (most likely to be complete)
              const sortedMatches = jsonMatches.sort((a, b) => b.length - a.length);
              
              for (let i = 0; i < sortedMatches.length; i++) {
                const match = sortedMatches[i];
                console.log(`🔍 Trying match ${i + 1}:`, match.substring(0, 100) + '...');
                
                try {
                  parsed = JSON.parse(match);
                  if (parsed && typeof parsed === 'object' && (parsed.content || parsed.metaSeoTitle || parsed.metaDescription)) {
                    console.log('✅ Successfully parsed match', i + 1);
                    break;
                  }
                } catch (matchError) {
                  console.log(`❌ Failed to parse match ${i + 1}:`, matchError);
                  
                  // Try individual field extraction as final fallback
                  const extractedFields = extractFieldsFromMalformedJSON(cleanedResponse);
                  if (extractedFields.content || extractedFields.metaSeoTitle || extractedFields.metaDescription) {
                    console.log('✅ Successfully extracted fields from malformed JSON');
                    parsed = extractedFields;
                    break;
                  }
                  continue;
                }
              }
            }
          }
        }
      }

      // Check if we have the expected JSON structure
      if (parsed && typeof parsed === 'object') {
        const hasContent = parsed.content && typeof parsed.content === 'string';
        const hasTitle = parsed.metaSeoTitle && typeof parsed.metaSeoTitle === 'string';
        const hasDescription = parsed.metaDescription && typeof parsed.metaDescription === 'string';
        
        console.log('🔍 Parsed object structure:', {
          hasContent,
          hasTitle,
          hasDescription,
          keys: Object.keys(parsed)
        });
        
        if (hasContent || hasTitle || hasDescription) {
          console.log('✅ Successfully parsed JSON response:', {
            hasContent,
            hasTitle,
            hasDescription,
            contentLength: hasContent ? parsed.content.length : 0,
            titleLength: hasTitle ? parsed.metaSeoTitle.length : 0,
            descLength: hasDescription ? parsed.metaDescription.length : 0
          });
          
          return {
            content: hasContent ? cleanAIContent(parsed.content) : cleanAIContent(responseText),
            metaSeoTitle: hasTitle ? parsed.metaSeoTitle.substring(0, 70) : '', // Limit to 70 chars including Apollo suffix
            metaDescription: hasDescription ? parsed.metaDescription.substring(0, 160) : '' // Limit to 160 chars
          };
        } else {
          console.log('❌ Parsed object missing required fields');
        }
      } else {
        console.log('❌ Failed to get valid parsed object');
      }
    } catch (error) {
      console.log('❌ Unexpected error in parseAIResponse:', error);
    }

    console.log('⚠️ Falling back to legacy content parsing');
    
    // Try to extract meta fields from the raw text if they exist
    let extractedTitle = '';
    let extractedDescription = '';
    
    // Look for patterns like "metaSeoTitle": "..."
    const titleMatch = responseText.match(/"metaSeoTitle"\s*:\s*"([^"]+)"/);
    const descMatch = responseText.match(/"metaDescription"\s*:\s*"([^"]+)"/);
    
    if (titleMatch) {
      extractedTitle = titleMatch[1].substring(0, 70); // Limit to 70 chars including Apollo suffix
      console.log('🔍 Extracted title via regex:', extractedTitle);
    }
    
    if (descMatch) {
      extractedDescription = descMatch[1].substring(0, 160);
      console.log('🔍 Extracted description via regex:', extractedDescription);
    }
    
    // Fallback to legacy content cleaning
    const cleanedContent = cleanAIContent(responseText);
    console.log('🔍 Cleaned content length:', cleanedContent.length);
    
    return {
      content: cleanedContent,
      metaSeoTitle: extractedTitle,
      metaDescription: extractedDescription
    };
  };

  // Initialize content from keywordRow when modal opens
  useEffect(() => {
    if (isOpen && keywordRow) {
      // Set content directly from keywordRow (already processed HTML)
      const content = keywordRow.output || '';
      setGeneratedContent(content);
      setEditableContent(content);
      setIsEditingContent(false);
      
      console.log('📊 Initializing BlogContentActionModal for keyword:', keywordRow.keyword);
      
      // Generate AI-powered meta fields from keyword and content
      // Why this matters: Creates dynamic, contextually relevant meta fields instead of templates
      console.log('🚀 Starting AI meta field generation...');
      generateAIMetaFields(keywordRow.keyword, content).then(metaFields => {
        console.log('✅ Generated AI meta fields:', metaFields);
        setMetaSeoTitle(metaFields.metaSeoTitle);
        setMetaDescription(metaFields.metaDescription);
      }).catch(error => {
        console.error('❌ Failed to generate AI meta fields - falling back to templates:', error);
        console.error('❌ Error details:', error.message || error);
        // Use simple fallbacks if AI generation fails
        setMetaSeoTitle(generateFallbackTitle(keywordRow.keyword));
        setMetaDescription(generateFallbackDescription(keywordRow.keyword));
      });
      
      // Load brand kit
      const loadBrandKit = () => {
        const draft = localStorage.getItem('apollo_brand_kit_draft');
        const saved = localStorage.getItem('apollo_brand_kit');
        const dataToLoad = draft || saved;
        
        if (dataToLoad) {
          try {
            setBrandKit(JSON.parse(dataToLoad));
          } catch (error) {
            console.error('Error loading brand kit:', error);
          }
        }
      };

      loadBrandKit();
      
      // Generate prompts based on keyword
      generateInitialPrompts();
    }
  }, [isOpen, keywordRow]);

  /**
   * Generate dynamic AI-powered meta fields using Claude
   * Why this matters: Creates unique, contextually relevant meta titles and descriptions instead of formulaic templates
   */
  const generateAIMetaFields = async (keyword: string, content: string): Promise<{ metaSeoTitle: string; metaDescription: string }> => {
    try {
      console.log('🤖 Generating AI meta fields for keyword:', keyword);
      
      // Extract first 500 chars of content for context
      const contentPreview = content.replace(/<[^>]*>/g, '').substring(0, 500);
      console.log('📝 Content preview length:', contentPreview.length);
      
      const apiUrl = `${(process.env.REACT_APP_API_URL || 'http://localhost:3003').replace(/\/$/, '')}/api/content/generate-meta`;
      console.log('🌐 API URL:', apiUrl);
      
      const requestBody = {
        keyword: keyword,
        content_preview: contentPreview,
        prompt: `Generate unique, SEO-optimized meta title and description for content about "${keyword}".

CRITICAL: Avoid formulaic language patterns. Each description must be unique and contextual.

Requirements:
- Meta title: 70 characters or less INCLUDING "| Apollo" suffix, natural and compelling, include keyword naturally
- Meta description: 150-160 characters, engaging and click-worthy, include keyword and value proposition
- NEVER start with formulaic phrases like "Master...", "Discover...", "Learn...", "Build..."
- Use varied, natural language that reflects the specific content value
- Write descriptions that sound like they were written by a human expert, not an AI
- Focus on specific outcomes, insights, or benefits unique to this content
- Avoid generic phrases like "comprehensive guide", "proven strategies", "best practices"

Content preview: ${contentPreview.substring(0, 200)}...

Examples of GOOD descriptions (varied styles):
- "Sales teams using these email timing insights see 34% higher response rates. Data-driven approach to prospect engagement."
- "Why 73% of CTOs respond to emails sent at 2 PM Tuesday. Research-backed timing and messaging frameworks."
- "Real conversion data from 10,000+ outreach attempts reveals optimal subject lines and follow-up sequences."

Examples of BAD descriptions (avoid these patterns):
- "Master your [topic] with our comprehensive guide..."
- "Discover proven strategies and best practices..."
- "Learn how to build winning [topic] plans..."

Respond with JSON:
{
  "metaSeoTitle": "...",
  "metaDescription": "..."
}`
      };
      
      console.log('📤 Sending request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ AI meta fields API response:', data);
      
      if (!data.metaSeoTitle && !data.metaDescription) {
        console.warn('⚠️ API returned empty meta fields, using fallbacks');
        throw new Error('API returned empty meta fields');
      }
      
      return {
        metaSeoTitle: data.metaSeoTitle || generateFallbackTitle(keyword),
        metaDescription: data.metaDescription || generateFallbackDescription(keyword)
      };
      
    } catch (error) {
      console.error('❌ AI meta generation failed, using fallback:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      return {
        metaSeoTitle: generateFallbackTitle(keyword),
        metaDescription: generateFallbackDescription(keyword)
      };
    }
  };

  /**
   * Generate fallback meta title if AI generation fails
   * Why this matters: Provides a backup when AI service is unavailable
   */
  const generateFallbackTitle = (keyword: string): string => {
    const cleanKeyword = keyword.trim();
    const suffix = " Guide 2025 | Apollo";
    const maxLength = 70 - suffix.length;
    
    if (cleanKeyword.length <= maxLength) {
      return `${cleanKeyword.charAt(0).toUpperCase() + cleanKeyword.slice(1)}${suffix}`;
    } else {
      return `${cleanKeyword.substring(0, maxLength - 3)}...${suffix}`;
    }
  };

  /**
   * Generate fallback meta description if AI generation fails
   * Why this matters: Provides a backup when AI service is unavailable
   */
  const generateFallbackDescription = (keyword: string): string => {
    return `Discover expert insights and proven strategies for ${keyword}. Comprehensive guide with actionable advice from Apollo.`;
  };

  /**
   * Reset prompts to default values
   * Why this matters: Allows users to quickly restore the proven default prompts after experimenting with custom ones
   */
  const resetToDefaults = () => {
    generateInitialPrompts();
  };

  /**
   * Generate system and user prompts for Blog Creator context
   * Why this matters: Creates targeted prompts for regenerating or editing existing content.
   */
  const generateInitialPrompts = () => {
    const currentYear = new Date().getFullYear();
    const systemPromptTemplate = `You are a world-class SEO, AEO, and LLM SEO content marketer for Apollo with knowledge on how to create and optimize content that gets cited and visibility on platforms like Google, AI Overviews, AI Mode, ChatGPT, Perplexity, Gemini, and AI IDE tools like Cursor, Windsurf, GitHub Copilot, and Claude. Write clear, actionable, and insightful content that reflects Apollo's innovative, data-driven, and customer-focused ethos. Maintain a confident, helpful tone that positions Apollo as the go-to solution for modern sales and marketing teams seeking efficiency and growth.

IMPORTANT: The current year is ${currentYear}. When referencing "current year," "this year," or discussing recent trends, always use ${currentYear}. Do not reference 2024 or earlier years as current.

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY clean HTML content without any markdown code blocks, explanatory text, or meta-commentary
- DO NOT include phrases like "Here's the content:" or HTML code block markers or closing explanations
- DO NOT provide analysis or explanations about the content structure after the HTML
- Start directly with the HTML content and end with the closing HTML tag
- No markdown formatting, no code block indicators, no explanatory paragraphs

Always remember to make headlines and sub-headlines in question format and provide direct answers to questions immediately.

Make intent obvious in both markup and layout:
- Use consistent terminology and clean heading hierarchies (H1 → H2 → H3)
- Use semantic elements where possible. Callouts, glossary terms, nav sections with clear class names or ARIA labels
- Use semantic HTML like definition lists, tables, and other semantic HTML elements to enhance structure

LLMs favor the first or clearest explanation of a concept. If you're early, your version may become the default. If not, aim to be the most definitive.

Content Creation Guidelines:
- Identify low-competition, high-opportunity topics where you can become the source
- Find gaps where competitors are shallow or absent
- Share original data, benchmarks, customer stories, or insights that are hard to copy
- Go beyond surface-level coverage
- Include metrics, code blocks, tables, lists, quotes, and diagrams
- Use precise, consistent terminology. Fuzzy synonyms weaken embeddings
- Write for extraction. Short, self-contained insights are more likely to be cited
- Aim to be the canonical source in your niche

The litmus test: Ask yourself, "Could a competitor easily replicate this tomorrow?" If the answer is yes, dig deeper.`;

    const userPromptTemplate = `Based on this keyword, create comprehensive AEO-optimized content for ${currentYear}:

**Target Keyword:** ${keywordRow.keyword}

**Content Requirements (remember we are in ${currentYear}):**
1. Create an H1 title that directly addresses the keyword in question format
2. Write comprehensive content that provides definitive answers
3. Include practical examples and actionable insights
4. Use semantic HTML structure with proper heading hierarchy
5. Include relevant internal linking opportunities
6. Optimize for AI-powered search engines (ChatGPT, Perplexity, Gemini)
7. Ensure content is non-promotional and genuinely helpful
8. Include data points, statistics, or specific examples where relevant
9. Use {{ brand_kit.ideal_customer_profile }} to inject customer testimonials only one time within the body of the content where appropriate
10. Promote Apollo at the end of the article using our {{ brand_kit.cta_text }} {{ brand_kit.cta_destination }}. Open the CTA destination in a new tab (i.e., target_blank).
11. DO NOT use emdashes (—) in the content
12. AVOID AI-detectable phrases like "It's not just about..., it's..." or "This doesn't just mean..., it also means..." - use natural, human-like language instead

**CRITICAL OUTPUT FORMAT: Respond with a JSON object containing exactly three fields:**

{
  "content": "HTML content here",
  "metaSeoTitle": "SEO title (50-60 characters)",
  "metaDescription": "Meta description (150-160 characters)"
}

**Requirements for each field:**
- content: Clean HTML content without markdown code blocks or explanatory text
- metaSeoTitle: Optimized for search engines, 50-60 characters, includes primary keyword
- metaDescription: Compelling description that encourages clicks, 150-160 characters, includes primary keyword and value proposition

Return ONLY the JSON object, no additional text.`;

    setSystemPrompt(systemPromptTemplate);
    setUserPrompt(userPromptTemplate);
  };

  /**
   * Copy meta title to clipboard with animation
   * Why this matters: Provides consistent user feedback for meta field copying.
   */
  const copyMetaTitle = async () => {
    try {
      await navigator.clipboard.writeText(metaSeoTitle);
      setShowMetaTitleCopied(true);
      setTimeout(() => setShowMetaTitleCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy meta title: ', err);
    }
  };

  /**
   * Copy meta description to clipboard with animation
   * Why this matters: Provides consistent user feedback for meta field copying.
   */
  const copyMetaDescription = async () => {
    try {
      await navigator.clipboard.writeText(metaDescription);
      setShowMetaDescCopied(true);
      setTimeout(() => setShowMetaDescCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy meta description: ', err);
    }
  };

  /**
   * Open HTML content in new window for developer review
   * Why this matters: Allows developers to inspect the raw HTML output for debugging and integration.
   */
  const openInHTML = () => {
    const contentToOpen = isEditingContent ? editableContent : generatedContent;
    if (!contentToOpen) {
      alert('No content to display. Please generate content first.');
      return;
    }

    // Create a simple HTML page showing the raw HTML source
    const rawHtmlDisplay = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raw HTML Source - ${metaSeoTitle || `${keywordRow.keyword} Content`}</title>
    <style>
        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #1e1e1e;
            color: #d4d4d4;
        }
        
        .header {
            background-color: #2d2d30;
            padding: 20px;
            margin: -20px -20px 20px -20px;
            border-bottom: 3px solid #007acc;
        }
        
        .header h1 {
            color: #4ec9b0;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        
        .header p {
            color: #9cdcfe;
            margin: 5px 0;
            font-size: 14px;
        }
        
        .meta-info {
            background-color: #252526;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #f59e0b;
        }
        
        .meta-info h3 {
            color: #f59e0b;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        
        .meta-field {
            margin: 8px 0;
            color: #d4d4d4;
            font-size: 13px;
        }
        
        .meta-label {
            color: #4fc1ff;
            font-weight: bold;
        }
        
        .code-container {
            background-color: #1e1e1e;
            border: 1px solid #3e3e42;
            border-radius: 5px;
            position: relative;
        }
        
        .code-header {
            background-color: #2d2d30;
            padding: 10px 15px;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .code-title {
            color: #cccccc;
            font-weight: bold;
            font-size: 14px;
        }
        
        .copy-btn {
            background-color: #0e639c;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
        }
        
        .copy-btn:hover {
            background-color: #1177bb;
        }
        
        .code-content {
            padding: 20px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .tab {
            margin-left: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Raw HTML Source</h1>
        <p><strong>Keyword:</strong> ${keywordRow.keyword}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Word Count:</strong> ~${Math.round(contentToOpen.replace(/<[^>]*>/g, '').split(' ').length)} words</p>
    </div>
    
    ${metaSeoTitle || metaDescription ? `
    <div class="meta-info">
        <h3>📊 SEO Metadata</h3>
        ${metaSeoTitle ? `<div class="meta-field"><span class="meta-label">Title:</span> ${metaSeoTitle}</div>` : ''}
        ${metaDescription ? `<div class="meta-field"><span class="meta-label">Description:</span> ${metaDescription}</div>` : ''}
    </div>
    ` : ''}
    
    <div class="code-container">
        <div class="code-header">
            <span class="code-title">HTML Source Code</span>
            <button class="copy-btn" onclick="copyToClipboard()">📋 Copy HTML</button>
        </div>
        <div class="code-content" id="htmlContent">${contentToOpen.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>

    <script>
        function copyToClipboard() {
            const htmlContent = \`${contentToOpen.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
            navigator.clipboard.writeText(htmlContent).then(() => {
                const btn = document.querySelector('.copy-btn');
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                btn.style.backgroundColor = '#10b981';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = '#0e639c';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Copy failed. Please select and copy manually.');
            });
        }
        
        // Add syntax highlighting effect
        const codeContent = document.getElementById('htmlContent');
        if (codeContent) {
            codeContent.innerHTML = codeContent.innerHTML
                .replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)/g, '$1<span style="color: #569cd6;">$2</span>')
                .replace(/(&lt;[^&gt;]*?)(\s[a-zA-Z-]+)(=)/g, '$1<span style="color: #9cdcfe;">$2</span><span style="color: #d4d4d4;">$3</span>')
                .replace(/(=)(\"[^\"]*\")/g, '$1<span style="color: #ce9178;">$2</span>');
        }
    </script>
</body>
</html>`;

    // Open in new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(rawHtmlDisplay);
      newWindow.document.close();
    } else {
      alert('Popup blocked. Please allow popups and try again.');
    }
  };

  /**
   * Insert variable using document.execCommand for proper undo support
   * Why this matters: Preserves undo stack by using browser's native text insertion method.
   */
  const insertVariable = (variableValue: string) => {
    const textarea = activePromptField === 'system' ? systemPromptRef.current : userPromptRef.current;
    
    if (textarea) {
      textarea.focus();
      
      // Use document.execCommand to insert text while preserving undo stack
      if (document.execCommand) {
        document.execCommand('insertText', false, ` ${variableValue} `);
      } else {
        // Fallback for browsers that don't support execCommand
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = activePromptField === 'system' ? systemPrompt : userPrompt;
        
        const newValue = currentValue.substring(0, start) + ` ${variableValue} ` + currentValue.substring(end);
        
        if (activePromptField === 'system') {
          setSystemPrompt(newValue);
        } else {
          setUserPrompt(newValue);
        }
        
        // Set cursor position after the inserted variable
        setTimeout(() => {
          const newPosition = start + variableValue.length + 2;
          textarea.setSelectionRange(newPosition, newPosition);
          textarea.focus();
        }, 0);
      }
    }
    
    setShowVariablesMenu(false);
    setVariableSearchTerm('');
  };

  /**
   * Handle variables menu toggle with button positioning
   * Why this matters: Positions the popup menu to the right of the clicked button on desktop, or as a centered modal on mobile.
   */
  const handleVariablesMenuToggle = (promptField: 'system' | 'user') => {
    setActivePromptField(promptField);
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // On mobile, use centered modal positioning
      setVariablesButtonPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2
      });
    } else {
      // Desktop positioning logic
      const buttonRef = promptField === 'system' ? systemVariablesButtonRef.current : userVariablesButtonRef.current;
      if (buttonRef) {
        const rect = buttonRef.getBoundingClientRect();
        let topPosition = rect.top + window.scrollY;
        
        // For User Prompt, position menu much higher to ensure full visibility
        if (promptField === 'user') {
          const menuHeight = Math.min(window.innerHeight * 0.7, 600); // 70vh or 37.5rem max
          const viewportHeight = window.innerHeight;
          const spaceBelow = viewportHeight - rect.bottom;
          
          // Always position the menu above the button for User Prompt to ensure full visibility
          topPosition = rect.top + window.scrollY - menuHeight + 250; // Move down 15.625rem from the calculated position
          
          // Ensure it doesn't go above the viewport
          if (topPosition < window.scrollY + 20) {
            topPosition = window.scrollY + 20;
          }
        }
        
        setVariablesButtonPosition({
          top: topPosition,
          left: rect.right + window.scrollX + 12 // Position to the right with 0.75rem gap
        });
      }
    }
    
    setShowVariablesMenu(!showVariablesMenu);
    setVariableSearchTerm('');
  };

  /**
   * Copy content to clipboard with enhanced formatting
   * Why this matters: Provides the best possible copy experience with rich text formatting preserved across different applications.
   */
  const copyToClipboard = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedContent;
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
      alert('Failed to copy content. Please select and copy manually.');
    }
  };

  /**
   * Toggle edit mode for generated content
   * Why this matters: Allows users to edit the generated content before copying/publishing
   */
  const toggleEditMode = () => {
    if (isEditingContent) {
      // Save the edited content
      setGeneratedContent(editableContent);
      // Update the original keyword row if callback provided
      if (onContentUpdate) {
        onContentUpdate(keywordRow.id, editableContent);
      }
    } else {
      // Enter edit mode - sync editable content with current content
      setEditableContent(generatedContent);
    }
    setIsEditingContent(!isEditingContent);
  };

  /**
   * Generate content using AI service (for new generation)
   * Why this matters: Creates fresh content and properly extracts meta fields from JSON response
   */
  const generateContent = async () => {
    if (!brandKit) {
      alert('Please configure your Brand Kit first in the Brand Kit page.');
      return;
    }

    setIsGenerating(true);
    try {
      // Replace liquid variables in prompts
      const processedSystemPrompt = processLiquidVariables(systemPrompt, brandKit);
      const processedUserPrompt = processLiquidVariables(userPrompt, brandKit);

      const response = await fetch(`${(process.env.REACT_APP_API_URL || 'http://localhost:3003').replace(/\/$/, '')}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keywordRow.keyword,
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      
      // Parse the AI response to extract all fields
      const parsedResponse = parseAIResponse(data.content);
      
      setGeneratedContent(parsedResponse.content);
      setEditableContent(parsedResponse.content);
      setIsEditingContent(false);
      setMetaSeoTitle(parsedResponse.metaSeoTitle);
      setMetaDescription(parsedResponse.metaDescription);

      // Update the original keyword row if callback provided
      if (onContentUpdate) {
        onContentUpdate(keywordRow.id, parsedResponse.content);
      }

    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Process liquid variables in text using brand kit
   * Why this matters: Replaces brand kit variables in prompts before sending to AI
   */
  const processLiquidVariables = (text: string, brandKit: BrandKit): string => {
    let processed = text;
    
    // Replace standard brand kit variables
    processed = processed.replace(/\{\{\s*brand_kit\.url\s*\}\}/g, brandKit.url || '');
    processed = processed.replace(/\{\{\s*brand_kit\.about_brand\s*\}\}/g, brandKit.aboutBrand || '');
    processed = processed.replace(/\{\{\s*brand_kit\.ideal_customer_profile\s*\}\}/g, brandKit.idealCustomerProfile || '');
    processed = processed.replace(/\{\{\s*brand_kit\.competitors\s*\}\}/g, brandKit.competitors || '');
    processed = processed.replace(/\{\{\s*brand_kit\.brand_point_of_view\s*\}\}/g, brandKit.brandPointOfView || '');
    processed = processed.replace(/\{\{\s*brand_kit\.author_persona\s*\}\}/g, brandKit.authorPersona || '');
    processed = processed.replace(/\{\{\s*brand_kit\.tone_of_voice\s*\}\}/g, brandKit.toneOfVoice || '');
    processed = processed.replace(/\{\{\s*brand_kit\.header_case_type\s*\}\}/g, brandKit.headerCaseType || '');
    processed = processed.replace(/\{\{\s*brand_kit\.writing_rules\s*\}\}/g, brandKit.writingRules || '');
    processed = processed.replace(/\{\{\s*brand_kit\.cta_text\s*\}\}/g, brandKit.ctaText || '');
    processed = processed.replace(/\{\{\s*brand_kit\.cta_destination\s*\}\}/g, brandKit.ctaDestination || '');
    
    // Replace custom variables
    if (brandKit.customVariables) {
      Object.keys(brandKit.customVariables).forEach(key => {
        const regex = new RegExp(`\\{\\{\\s*brand_kit\\.${key}\\s*\\}\\}`, 'g');
        processed = processed.replace(regex, brandKit.customVariables[key] || '');
      });
    }
    
    return processed;
  };

  /**
   * Run content generation workflow again
   * Why this matters: Allows users to regenerate content with new prompts or settings
   */
  const runWorkflowAgain = async () => {
    if (onStatusUpdate) {
      onStatusUpdate(keywordRow.id, 'running');
    }
    onClose(); // Close modal to let user see the progress in the table
  };

  /**
   * Publish content to custom CMS (demo)
   * Why this matters: Demonstrates how content can be published to any CMS via API
   */
  const publishToCustomCMS = async (status: 'draft' | 'published' = 'draft') => {
    if (!generatedContent || !metaSeoTitle) {
      alert('Please generate content first');
      return;
    }

    setIsPublishing(true);
    setPublishResult(null);

    try {
      console.log('📰 Publishing content to CMS:', customCMSConfig);

      const response = await fetch(`${(process.env.REACT_APP_API_URL || 'http://localhost:3003').replace(/\/$/, '')}/api/content/publish-to-cms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: metaSeoTitle,
          content: generatedContent,
          meta_title: metaSeoTitle,
          meta_description: metaDescription,
          api_endpoint: customCMSConfig.api_endpoint,
          api_key: customCMSConfig.api_key,
          cms_type: customCMSConfig.cms_type,
          status: status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish content');
      }

      const data = await response.json();
      
      setPublishResult({
        success: true,
        ...data.publication,
        demo_mode: data.demo_mode
      });

      console.log('✅ Publish successful:', data);

    } catch (error) {
      console.error('Publication error:', error);
      setPublishResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Show confirmation dialog before clearing content
   * Why this matters: Prevents accidental deletion of generated content
   */
  const clearGeneratedContent = () => {
    setShowClearConfirmation(true);
  };

  /**
   * Clear all generated content and reset to original state
   * Why this matters: Allows users to start fresh without closing and reopening the modal
   */
  const confirmClearContent = () => {
    setGeneratedContent('');
    setEditableContent('');
    setIsEditingContent(false);
    setMetaSeoTitle('');
    setMetaDescription('');
    setShowClearConfirmation(false);
    if (onContentUpdate) {
      onContentUpdate(keywordRow.id, '');
    }
  };

  /**
   * Cancel the clear confirmation dialog
   * Why this matters: Allows users to cancel accidental clear attempts
   */
  const cancelClearContent = () => {
    setShowClearConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Auto-save indicator */}
      {autoSaveStatus && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 10001,
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
              Auto-saving prompts...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              Prompts auto-saved
            </>
          )}
        </div>
      )}

      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}
      >
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          width: '100%',
          maxWidth: '95vw', // Mobile-first: full width with small margin
          height: '95vh', // Slightly smaller height for mobile
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        className="content-creation-modal"
        >
          {/* Header */}
          <div 
            className="content-modal-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              borderBottom: '0.0625rem solid #e5e7eb',
              backgroundColor: '#fafafa',
              position: 'relative'
            }}
          >
            <div>
              <h2 style={{ fontWeight: '600', margin: 0, color: '#111827' }}>
                Blog Content Actions
              </h2>
              <p style={{ color: '#6b7280' }}>
                Edit, publish, and manage your generated content for "{keywordRow.keyword}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="content-modal-close"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content Layout - Exactly like ContentCreationModal */}
          <div className="content-modal-layout" style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            {/* Left Panel - System & User Prompts */}
            <div className="content-modal-panel" style={{ 
              padding: '1.5rem', 
              overflowY: 'auto',
              borderRight: '0.0625rem solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: '#374151' }}>
                Content Generation Prompts
              </h3>

              {/* System Prompt */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                      System Prompt
                    </label>
                    <button
                      onClick={resetToDefaults}
                      style={{
                        fontSize: '0.8rem',
                        color: '#0077b5',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: '0',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#005582';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#0077b5';
                      }}
                    >
                      (Reset to default)
                    </button>
                  </div>
                  <button
                    ref={systemVariablesButtonRef}
                    onClick={() => handleVariablesMenuToggle('system')}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f3f4f6',
                      border: '0.0625rem solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  >
                    Variables Menu
                    <ChevronDown size={14} />
                  </button>
                </div>
                <textarea
                  ref={systemPromptRef}
                  value={systemPrompt}
                  onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    setHasUserInput(true);
                  }}
                  placeholder="Define the AI's role, expertise, and content creation guidelines..."
                  rows={8}
                  className="content-creation-textarea"
                  style={{
                    width: '100%',
                    border: '0.0625rem solid #e5e7eb',
                    borderRadius: '0.5rem',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    color: '#374151'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* User Prompt */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                      User Prompt
                    </label>
                    <button
                      onClick={resetToDefaults}
                      style={{
                        fontSize: '0.8rem',
                        color: '#0077b5',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: '0',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#005582';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#0077b5';
                      }}
                    >
                      (Reset to default)
                    </button>
                  </div>
                  <button
                    ref={userVariablesButtonRef}
                    onClick={() => handleVariablesMenuToggle('user')}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f3f4f6',
                      border: '0.0625rem solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  >
                    Variables Menu
                    <ChevronDown size={14} />
                  </button>
                </div>
                <textarea
                  ref={userPromptRef}
                  value={userPrompt}
                  onChange={(e) => {
                    setUserPrompt(e.target.value);
                    setHasUserInput(true);
                  }}
                  placeholder="Provide specific instructions for content creation..."
                  rows={10}
                  className="content-creation-textarea"
                  style={{
                    width: '100%',
                    border: '0.0625rem solid #e5e7eb',
                    borderRadius: '0.5rem',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    color: '#374151'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Run Workflow Again Button */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '1.5rem',
                backgroundColor: '#fafafa',
                borderRadius: '0.75rem',
                border: '0.0625rem solid #f3f4f6'
              }}>
                <button
                  onClick={runWorkflowAgain}
                  disabled={isGenerating || !brandKit}
                  className="apollo-btn-gradient"
                  style={{
                    opacity: isGenerating || !brandKit ? 0.6 : 1,
                    cursor: isGenerating || !brandKit ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Wand2 size={16} style={{marginRight: '0.5rem'}} />
                  Run Workflow Again
                </button>
              </div>
            </div>

            {/* Right Panel - Generated Content Display */}
            <div ref={rightPanelRef} className="content-modal-panel" style={{ 
              position: 'relative',
              padding: '1.5rem',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="mobile-only-heading" style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0, marginBottom: '1rem' }}>
                  Generated Content
                </h3>
                
                {/* Clear Button - Centered */}
                {generatedContent && (
                  <button
                    onClick={clearGeneratedContent}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#fef2f2',
                      border: '0.0625rem solid #fecaca',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      color: '#dc2626',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = '#dc2626';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.borderColor = '#fecaca';
                    }}
                  >
                    <X size={14} />
                    Clear Generated Content
                  </button>
                )}
              </div>

              {/* Action Buttons Row - Exactly like ContentCreationModal */}
              {generatedContent && (
                <div className="content-action-buttons" style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  {/* Edit/Save Button */}
                  <button
                    onClick={toggleEditMode}
                    className="content-modal-btn mobile-hide-edit"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: isEditingContent ? '#10b981' : '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '2.75rem',
                      minWidth: '7.5rem',
                      justifyContent: 'center'
                    }}
                  >
                    {isEditingContent ? (
                      <>
                        <Check size={14} />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit Content
                      </>
                    )}
                  </button>

                  {/* Open in HTML Button */}
                  <button
                    onClick={openInHTML}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '2.75rem',
                      minWidth: '7.5rem',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#6d28d9';
                      e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#7c3aed';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 16 6-12 6 12H6Z"/>
                      <path d="m8 12 8 0"/>
                    </svg>
                    Open in HTML
                  </button>

                  <button
                    onClick={() => setShowCMSModal(true)}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '2.75rem',
                      minWidth: '7.5rem',
                      justifyContent: 'center'
                    }}
                  >
                    <Globe size={14} />
                    Publish to CMS
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={copyToClipboard}
                      className="content-modal-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: '2.75rem',
                        minWidth: '7.5rem',
                        justifyContent: 'center'
                      }}
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                    
                    {/* Copied message */}
                    {showCopiedMessage && (
                      <div style={{
                        position: 'absolute',
                        top: '3rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1)',
                        zIndex: 1000
                      }}>
                        <Check style={{ width: '0.875rem', height: '0.875rem' }} />
                        Copied!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Content Display */}
              {generatedContent ? (
                <div
                  className="generated-content-display"
                  style={{
                    border: '0.0625rem solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '2rem',
                    minHeight: '25rem',
                    backgroundColor: 'white',
                    boxShadow: '0 0.0625 0.1875rem rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Meta SEO Fields - Show at the top */}
                  {(metaSeoTitle || metaDescription) && (
                    <div style={{ marginBottom: '2rem' }}>
                      {metaSeoTitle && (
                        <div style={{ marginBottom: '1rem', position: 'relative' }}>
                          <strong>Meta SEO Title:</strong> {metaSeoTitle}
                          <button
                            onClick={copyMetaTitle}
                            style={{
                              marginLeft: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#f3f4f6',
                              border: '0.0625rem solid #10b981',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              color: '#10b981'
                            }}
                          >
                            Copy
                          </button>
                          
                          {/* Copied message for meta title */}
                          {showMetaTitleCopied && (
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '100%',
                              transform: 'translate(0.5rem, -50%)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#10b981',
                              color: 'white',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1)',
                              zIndex: 1000
                            }}>
                              <Check style={{ width: '0.875rem', height: '0.875rem' }} />
                              Copied!
                            </div>
                          )}
                        </div>
                      )}
                      {metaDescription && (
                        <div style={{ marginBottom: '1rem', position: 'relative' }}>
                          <strong>Meta Description:</strong> {metaDescription}
                          <button
                            onClick={copyMetaDescription}
                            style={{
                              marginLeft: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#f3f4f6',
                              border: '0.0625rem solid #10b981',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              color: '#10b981'
                            }}
                          >
                            Copy
                          </button>
                          
                          {/* Copied message for meta description */}
                          {showMetaDescCopied && (
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '100%',
                              transform: 'translate(0.5rem, -50%)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#10b981',
                              color: 'white',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1)',
                              zIndex: 1000
                            }}>
                              <Check style={{ width: '0.875rem', height: '0.875rem' }} />
                              Copied!
                            </div>
                          )}
                        </div>
                      )}
                      <hr style={{ border: 'none', borderTop: '0.0625rem solid #e5e7eb', margin: '1.5rem 0' }} />
                    </div>
                  )}

                  {/* Main Content */}
                  {/* Edit Mode Indicator */}
                  {isEditingContent && (
                    <div style={{
                      marginBottom: '1rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#fffbf5',
                      borderRadius: '0.5rem',
                      border: '0.125rem solid #f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e' }}>
                        ✏️ EDITING MODE - Click "Save Changes" when done
                      </span>
                    </div>
                  )}

                  {isEditingContent ? (
                    <textarea
                      ref={editableContentRef}
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      placeholder="Edit your content here..."
                      style={{
                        width: '100%',
                        minHeight: '37.5rem',
                        padding: '1rem 1.25rem',
                        border: '0.125rem solid #f59e0b',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: '#fffbf5',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: '1.6',
                        color: '#374151'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#d97706'}
                      onBlur={(e) => e.target.style.borderColor = '#f59e0b'}
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
                  )}
                </div>
              ) : (
                <div className="content-placeholder-section" style={{
                  border: '0.125rem dashed #d1d5db',
                  borderRadius: '0.75rem',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  minHeight: '25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'white'
                }}>
                  <div>
                    <Wand2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
                    <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                      No content generated yet
                    </p>
                    <p style={{ margin: 0 }}>
                      Complete the workflow first to see generated content here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clear Content Confirmation Modal */}
      {showClearConfirmation && (
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
          zIndex: 10001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '25rem',
            width: '90%',
            boxShadow: '0 1.25rem 1.5625rem -0.3125rem rgba(0, 0, 0, 0.1), 0 0.625rem 0.625rem -0.3125rem rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <X size={24} style={{ color: '#dc2626' }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#374151',
                  margin: 0
                }}>
                  Clear Generated Content?
                </h3>
              </div>
            </div>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              lineHeight: '1.5',
              margin: '0 0 1.5rem 0'
            }}>
              This will permanently delete the generated content, meta SEO title, and meta description. This action cannot be undone. Are you sure you want to continue?
            </p>
            
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelClearContent}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  border: '0.0625rem solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmClearContent}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                <X size={14} />
                Yes, Clear Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CMS Integration Modal Component */}
      {showCMSModal && (
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
          zIndex: 10001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '31.25rem',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Publish Content to CMS</h3>
              <button
                onClick={() => setShowCMSModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { name: 'Webflow', description: 'Publish directly to your Webflow site', logo: '/webflow-logo.png' },
                  { name: 'Strapi', description: 'Add to your Strapi content library', logo: '/strapi-logo.png' },
                  { name: 'Contentful', description: 'Create entry in Contentful space', logo: '/contenful-logo.png' },
                  { name: 'Sanity', description: 'Publish to Sanity Studio', logo: '/sanity-logo.png' },
                  { name: 'WordPress', description: 'Create WordPress post/page', logo: '/wordpress-logo.png' },
                  { name: 'Custom', description: 'Configure your own API endpoint', logo: null }
                ].map((cms) => (
                  <div
                    key={cms.name}
                    style={{
                      border: '0.0625rem solid #e5e7eb',
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'white',
                      boxShadow: '0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05)'
                    }}
                    onClick={() => {
                      if (cms.name === 'Custom') {
                        setShowCustomCMSForm(true);
                        setShowCMSModal(false);
                      } else {
                        setShowComingSoonMessage(cms.name);
                        setTimeout(() => setShowComingSoonMessage(null), 3000);
                      }
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = '0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = '0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      {cms.logo ? (
                        <div style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f8fafc',
                          border: '0.0625rem solid #f1f5f9',
                          flexShrink: 0
                        }}>
                          <img 
                            src={cms.logo} 
                            alt={`${cms.name} logo`}
                            style={{
                              width: '1.5rem',
                              height: '1.5rem',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<span style="font-size: 0.75rem; font-weight: 600; color: #64748b;">${cms.name.charAt(0)}</span>`;
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ 
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span style={{
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            {cms.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h4 style={{ 
                        fontWeight: '600', 
                        margin: 0,
                        fontSize: '1rem',
                        color: '#111827'
                      }}>
                        {cms.name}
                      </h4>
                    </div>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '0.875rem', 
                      margin: 0,
                      paddingLeft: '3rem',
                      lineHeight: '1.5'
                    }}>
                      {cms.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coming Soon Message */}
              {showComingSoonMessage && (
                <div style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem 2rem',
                  backgroundColor: '#EBF212',
                  color: 'black',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 0.625rem 1.5625rem -0.1875rem rgba(0, 0, 0, 0.1), 0 0.25rem 0.375rem -0.125rem rgba(0, 0, 0, 0.05)',
                  zIndex: 10002,
                  minWidth: '15.625rem',
                  textAlign: 'center', 
                  animation: 'fadeInScale 0.2s ease-out'
                }}>
                  {showComingSoonMessage} integration coming soon!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom CMS Form Modal */}
      {showCustomCMSForm && (
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
          zIndex: 10001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '31.25rem',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                🧈 Custom CMS Integration (Demo)
              </h3>
              <button
                onClick={() => {
                  setShowCustomCMSForm(false);
                  setPublishResult(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {!publishResult ? (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    CMS Type
                  </label>
                  <input
                    type="text"
                    value={customCMSConfig.cms_type}
                    onChange={(e) => setCustomCMSConfig({...customCMSConfig, cms_type: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '0.0625rem solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="e.g., Butter CMS, WordPress, Custom"
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    API Endpoint
                  </label>
                  <input
                    type="text"
                    value={customCMSConfig.api_endpoint}
                    onChange={(e) => setCustomCMSConfig({...customCMSConfig, api_endpoint: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '0.0625rem solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="https://api.buttercms.com/v2"
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    API Key
                  </label>
                  <input
                    type="text"
                    value={customCMSConfig.api_key}
                    onChange={(e) => setCustomCMSConfig({...customCMSConfig, api_key: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '0.0625rem solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="demo-api-key-12345"
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => publishToCustomCMS('draft')}
                    disabled={isPublishing}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: isPublishing ? 'not-allowed' : 'pointer',
                      opacity: isPublishing ? 0.6 : 1
                    }}
                  >
                    {isPublishing ? 'Publishing...' : 'Save as Draft'}
                  </button>
                  
                  <button
                    onClick={() => publishToCustomCMS('published')}
                    disabled={isPublishing}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: isPublishing ? 'not-allowed' : 'pointer',
                      opacity: isPublishing ? 0.6 : 1
                    }}
                  >
                    {isPublishing ? 'Publishing...' : 'Publish Live'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                {publishResult.success ? (
                  <div>
                    <div style={{ 
                      fontSize: '3rem', 
                      marginBottom: '1rem',
                      color: '#10b981'
                    }}>
                      ✅
                    </div>
                    <h4 style={{ 
                      color: '#10b981', 
                      marginBottom: '1rem',
                      fontSize: '1.25rem',
                      fontWeight: '600'
                    }}>
                      Content Published Successfully!
                    </h4>
                    {publishResult.demo_mode && (
                      <div style={{ 
                        backgroundColor: '#fef3c7', 
                        padding: '1rem', 
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        border: '0.0625rem solid #f59e0b'
                      }}>
                        <p style={{ 
                          color: '#92400e', 
                          margin: 0,
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          🧈 Demo Mode: This is a simulated CMS publish for demonstration purposes.
                        </p>
                      </div>
                    )}
                    <div style={{ 
                      backgroundColor: '#f9fafb', 
                      padding: '1.5rem', 
                      borderRadius: '0.5rem',
                      textAlign: 'left',
                      marginBottom: '1.5rem'
                    }}>
                      <h5 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1rem' }}>Publication Details:</h5>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        <p style={{ margin: '0.5rem 0' }}><strong>CMS:</strong> {publishResult.cms_type}</p>
                        <p style={{ margin: '0.5rem 0' }}><strong>Status:</strong> {publishResult.status}</p>
                        <p style={{ margin: '0.5rem 0' }}><strong>ID:</strong> {publishResult.id}</p>
                        {publishResult.url && (
                          <p style={{ margin: '0.5rem 0' }}>
                            <strong>URL:</strong> 
                            <a 
                              href={publishResult.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                color: '#3b82f6', 
                                textDecoration: 'underline',
                                marginLeft: '0.5rem'
                              }}
                            >
                              {publishResult.url}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowCustomCMSForm(false);
                        setPublishResult(null);
                      }}
                      style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      fontSize: '3rem', 
                      marginBottom: '1rem',
                      color: '#dc2626'
                    }}>
                      ❌
                    </div>
                    <h4 style={{ 
                      color: '#dc2626', 
                      marginBottom: '1rem',
                      fontSize: '1.25rem',
                      fontWeight: '600'
                    }}>
                      Publication Failed
                    </h4>
                    <p style={{ 
                      color: '#6b7280', 
                      marginBottom: '2rem',
                      fontSize: '0.875rem'
                    }}>
                      {publishResult.error || 'An unknown error occurred'}
                    </p>
                    
                    <button
                      onClick={() => setPublishResult(null)}
                      style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        marginRight: '1rem'
                      }}
                    >
                      Try Again
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowCustomCMSForm(false);
                        setPublishResult(null);
                      }}
                      style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variables Menu */}
      <VariablesMenu
        showVariablesMenu={showVariablesMenu}
        variablesButtonPosition={variablesButtonPosition}
        variablesMenuRef={variablesMenuRef}
        activePromptField={activePromptField}
        variableSearchTerm={variableSearchTerm}
        setVariableSearchTerm={setVariableSearchTerm}
        setShowVariablesMenu={setShowVariablesMenu}
        brandKit={brandKit}
        insertVariable={insertVariable}
      />
    </>
  );
};

export default BlogContentActionModal; 