import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Download, ExternalLink, Globe, ChevronDown, Search, Clock, CheckCircle, Copy, Check, Table, Target, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { BrandKit, CTAGenerationResult } from '../types';
import googleDocsService from '../services/googleDocsService';
import { autoSaveBlogIfReady } from '../services/blogHistoryService';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import { makeApiRequest } from '../utils/apiHelpers';
import LinkHoverControls from './LinkHoverControls';
import { useLinkHoverControls } from '../hooks/useLinkHoverControls';

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
    metaSeoTitle?: string;
    metaDescription?: string;
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

// CTA-related interfaces (copied from CTACreatorPage)
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

// CTAGenerationResult interface imported from types

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
 * Why this matters: Provides post-generation actions for Blog Agents content that are identical to ContentCreationModal
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
  
  // Contextual CTA states
  const [enableContextualCtas, setEnableContextualCtas] = useState(true);
  const [isEnhancingWithCtas, setIsEnhancingWithCtas] = useState(false);
  const [ctaEnhancementResult, setCtaEnhancementResult] = useState<any>(null);

  // Content display ref for link hover controls
  const contentDisplayRef = useRef<HTMLDivElement>(null);
  
  // Link hover controls
  const {
    targetLink,
    isHovering: isHoveringLink,
    handleLinkHover,
    handleLinkLeave,
    removeLink,
    openLink
  } = useLinkHoverControls(contentDisplayRef);
  const [editableContent, setEditableContent] = useState('');
  const [showGeneratedContentModal, setShowGeneratedContentModal] = useState(false);
  
  // Google Sheets related states
  const [isOpeningSheets, setIsOpeningSheets] = useState(false);
  const [showSheetsMessage, setShowSheetsMessage] = useState(false);
  const [sheetsSuccessMessage, setSheetsSuccessMessage] = useState('');

  // Custom CMS Demo States
  const [showCustomCMSForm, setShowCustomCMSForm] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [customCMSConfig, setCustomCMSConfig] = useState({
    api_endpoint: 'https://api.buttercms.com/v2',
    api_key: 'demo-api-key-12345',
    cms_type: 'Butter CMS'
  });

  // CTA Generation States (copied from CTACreatorPage)
  const [generatedCTAs, setGeneratedCTAs] = useState<CTAGenerationResult | null>(null);
  const [isGeneratingCTAs, setIsGeneratingCTAs] = useState(false);
  const [ctaGenerationStage, setCtaGenerationStage] = useState('');
  const [ctaError, setCtaError] = useState('');
  const [ctaCopySuccess, setCtaCopySuccess] = useState<string>('');
  const [vocKitReady, setVocKitReady] = useState(false);
  const [painPointsCount, setPainPointsCount] = useState(0);
  const [showCtaSkeletons, setShowCtaSkeletons] = useState(false);
  const [vocKitReadyDismissed, setVocKitReadyDismissed] = useState(false);

  // Approved CTA button options for dynamic switching (copied from CTACreatorPage)
  const approvedCTAButtons = [
    'Start Free with Apollo →',
    'Try Apollo Free →',
    'Start Your Free Trial →',
    'Schedule a Demo →',
    'Start a Trial →',
    'Request a Demo →'
  ];

  // Undo/Redo functionality for edit mode
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historySaveTimeout, setHistorySaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const userPromptRef = useRef<HTMLTextAreaElement>(null);
  const variablesMenuRef = useRef<HTMLDivElement>(null);
  const systemVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const userVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const generationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const editableContentRef = useRef<HTMLTextAreaElement>(null);

  // Generation progress messages for Blog Agents
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

      .generated-content-display table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .generated-content-display thead {
        background-color: #f9fafb;
      }

      .generated-content-display th {
        padding: 0.875rem 1rem;
        text-align: left;
        font-weight: 600;
        color: #374151;
        border-bottom: 2px solid #e5e7eb;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .generated-content-display td {
        padding: 0.875rem 1rem;
        border-bottom: 1px solid #f3f4f6;
        color: #6b7280;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .generated-content-display tbody tr:hover {
        background-color: #f9fafb;
      }

      .generated-content-display tbody tr:last-child td {
        border-bottom: none;
      }

      .generated-content-display th:first-child,
      .generated-content-display td:first-child {
        padding-left: 1.25rem;
      }

      .generated-content-display th:last-child,
      .generated-content-display td:last-child {
        padding-right: 1.25rem;
      }

      .generated-content-display a {
        color: #2563eb;
        text-decoration: underline;
        font-weight: 500;
      }

      .generated-content-display a:hover {
        color: #1d4ed8;
        text-decoration: underline;
      }

      /* Mobile backdrop for modals */
      .mobile-modal-backdrop {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background-color: rgba(0, 0, 0, 0.5) !important;
        z-index: 9999 !important;
      }

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
   * Why this matters: Ensures clean HTML output by stripping AI meta-commentary and converting markdown to HTML.
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
    
    // Convert markdown headers to HTML headers
    // Why this matters: AI sometimes returns markdown instead of HTML despite instructions
    cleaned = cleaned.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    cleaned = cleaned.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    cleaned = cleaned.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Convert markdown bold and italic to HTML
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    cleaned = cleaned.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Convert markdown lists to HTML lists
    // Handle unordered lists (- or *)
    cleaned = cleaned.replace(/(?:^|\n)([*-]\s+.+(?:\n[*-]\s+.+)*)/gm, (match) => {
      const items = match.trim().split('\n').map(line => {
        const item = line.replace(/^[*-]\s+/, '').trim();
        return `  <li>${item}</li>`;
      }).join('\n');
      return `<ul>\n${items}\n</ul>`;
    });
    
    // Handle ordered lists (1. 2. etc.)
    cleaned = cleaned.replace(/(?:^|\n)(\d+\.\s+.+(?:\n\d+\.\s+.+)*)/gm, (match) => {
      const items = match.trim().split('\n').map(line => {
        const item = line.replace(/^\d+\.\s+/, '').trim();
        return `  <li>${item}</li>`;
      }).join('\n');
      return `<ol>\n${items}\n</ol>`;
    });
    
    // Convert remaining plain text paragraphs to HTML paragraphs
    // Split by double newlines and wrap non-HTML content in <p> tags
    const lines = cleaned.split(/\n\s*\n/);
    cleaned = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Skip if already HTML (contains < and >)
      if (trimmed.includes('<') && trimmed.includes('>')) {
        return trimmed;
      }
      
      // Skip if it's just a single word or very short
      if (trimmed.length < 3) return trimmed;
      
      // Wrap in paragraph tags
      return `<p>${trimmed}</p>`;
    }).join('\n\n');
    
    // Remove explanatory text at the end (typically starts with patterns like "This content structure:")
    cleaned = cleaned.replace(/\n\s*This content structure:[\s\S]*$/i, '');
    cleaned = cleaned.replace(/\n\s*Would you like me to[\s\S]*$/i, '');
    cleaned = cleaned.replace(/\n\s*The content includes:[\s\S]*$/i, '');
    cleaned = cleaned.replace(/\n\s*Key features of this content:[\s\S]*$/i, '');
    
    // Remove numbered analysis points at the end
    cleaned = cleaned.replace(/\n\s*\d+\.\s+[A-Z][^<\n]*[\s\S]*$/i, '');
    
    // Format email templates better - add line breaks after sentences in template sections
    cleaned = cleaned.replace(/(Template \d+:.*?<\/p>|<p>.*?Template.*?<\/p>)/gi, (match) => {
      // Add line breaks after periods followed by space and capital letter (sentence boundaries)
      return match.replace(/\.\s+([A-Z])/g, '.<br><br>$1');
    });
    
    // Add line breaks after common email elements
    cleaned = cleaned.replace(/(Subject:.*?)([A-Z][a-z])/g, '$1<br><br>$2');
    cleaned = cleaned.replace(/(Hi \{\{.*?\}\},)\s*([A-Z])/g, '$1<br><br>$2');
    cleaned = cleaned.replace(/(Best regards,|Best,|Sincerely,)\s*([A-Z\[])/g, '$1<br><br>$2');
    
    // If content starts with HTML, ensure it starts with a proper tag
    if (cleaned.includes('<') && !cleaned.trim().startsWith('<')) {
      const htmlStart = cleaned.indexOf('<');
      if (htmlStart > 0) {
        cleaned = cleaned.substring(htmlStart);
      }
    }
    
    // Trim whitespace and clean up extra newlines
    cleaned = cleaned.trim().replace(/\n{3,}/g, '\n\n');
    
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
            metaSeoTitle: hasTitle ? parsed.metaSeoTitle : '', // Let AI generate proper length titles
            metaDescription: hasDescription ? parsed.metaDescription : '' // Show full AI-generated description
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
      extractedTitle = titleMatch[1]; // Let AI generate proper length titles
      console.log('🔍 Extracted title via regex:', extractedTitle);
    }
    
    if (descMatch) {
      extractedDescription = descMatch[1];
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
    if (!isOpen || !keywordRow) return;
    
    // Load saved data first
    loadSavedData();
    
    // Always prioritize fresh content from keywordRow over cached content
    // This ensures users see the latest generated content with proper Apollo branding
    const content = keywordRow.output || '';
    if (content.trim().length > 0) {
      setGeneratedContent(content);
      setEditableContent(content);
      setIsEditingContent(false);
      
      // Clear any old cached content to prevent confusion
      localStorage.removeItem(`apollo_blog_content_draft_${keywordRow.id}`);
      
      console.log('📊 Initializing BlogContentActionModal with fresh content for keyword:', keywordRow.keyword);
      console.log('🔄 Fresh content length:', content.length, 'characters');
      
      // Check if meta fields are already available (from row.metadata or localStorage)
      // Why this matters: Avoids redundant API calls and prevents modal lag
      const existingMetaTitle = keywordRow.metadata?.metaSeoTitle || keywordRow.metadata?.title || '';
      const existingMetaDesc = keywordRow.metadata?.metaDescription || keywordRow.metadata?.description || '';
      
      if (existingMetaTitle || existingMetaDesc) {
        console.log('✅ Loading existing meta fields from row.metadata');
        setMetaSeoTitle(existingMetaTitle);
        setMetaDescription(existingMetaDesc);
      } else {
        // Try loading from localStorage as fallback
        try {
          const savedMeta = localStorage.getItem(`apollo_blog_meta_${keywordRow.id}`);
          if (savedMeta) {
            const { metaSeoTitle: savedTitle, metaDescription: savedDesc } = JSON.parse(savedMeta);
            if (savedTitle || savedDesc) {
              console.log('✅ Loading existing meta fields from localStorage');
              setMetaSeoTitle(savedTitle || '');
              setMetaDescription(savedDesc || '');
            }
          }
        } catch (error) {
          console.log('⚠️ Could not load saved meta fields:', error);
        }
      }
    } else {
      // Fallback to cached content only if no fresh content exists
      const savedContent = localStorage.getItem(`apollo_blog_content_draft_${keywordRow.id}`);
      if (savedContent) {
        console.log('📋 No fresh content, loading cached content for keyword:', keywordRow.keyword);
      }
    }
    
    // Load brand kit
    const loadBrandKit = () => {
      console.log('🔍 [BlogContentActionModal] Loading brand kit...');
      const draft = localStorage.getItem('apollo_brand_kit_draft');
      const saved = localStorage.getItem('apollo_brand_kit');
      const dataToLoad = draft || saved;
      
      console.log('🔍 [BlogContentActionModal] Draft found:', !!draft);
      console.log('🔍 [BlogContentActionModal] Saved found:', !!saved);
      
      if (dataToLoad) {
        try {
          const parsedBrandKit = JSON.parse(dataToLoad);
          console.log('✅ [BlogContentActionModal] Brand kit loaded:', parsedBrandKit);
          setBrandKit(parsedBrandKit);
        } catch (error) {
          console.error('❌ [BlogContentActionModal] Error loading brand kit:', error);
        }
      } else {
        console.log('❌ [BlogContentActionModal] No brand kit data found in localStorage');
      }
    };

    loadBrandKit();
    
    // Always generate fresh prompts to ensure latest updates are applied
    generateInitialPrompts();
    
    // Clear any old saved prompts to prevent conflicts
    localStorage.removeItem(`apollo_blog_prompts_draft_${keywordRow.id}`);

    // Listen for localStorage changes to update brand kit in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'apollo_brand_kit' || e.key === 'apollo_brand_kit_draft') {
        loadBrandKit();
      }
    };

    const handleCustomStorageChange = () => {
      loadBrandKit();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('apollo_brand_kit_updated', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apollo_brand_kit_updated', handleCustomStorageChange);
    };
  }, [isOpen, keywordRow]);

  /**
   * Load saved auto-save data from localStorage
   * Why this matters: Restores user's work when reopening the modal
   */
  const loadSavedData = () => {
    if (!keywordRow) return;
    
    try {
      // Skip loading saved prompts - we always generate fresh ones now
      // This ensures the latest prompt updates are always applied
      
      // Load saved content and meta fields
      const savedContent = localStorage.getItem(`apollo_blog_content_draft_${keywordRow.id}`);
      if (savedContent) {
        const parsedContent = JSON.parse(savedContent);
        setGeneratedContent(parsedContent.content || '');
        setEditableContent(parsedContent.content || '');
        setMetaSeoTitle(parsedContent.metaSeoTitle || '');
        setMetaDescription(parsedContent.metaDescription || '');
        console.log('✅ Loaded saved content for keyword:', keywordRow.keyword);
      }
      
      // Load saved CTAs
      const savedCTAs = localStorage.getItem(`apollo_blog_ctas_draft_${keywordRow.id}`);
      if (savedCTAs) {
        const parsedCTAs = JSON.parse(savedCTAs);
        setGeneratedCTAs(parsedCTAs);
        console.log('✅ Loaded saved CTAs for keyword:', keywordRow.keyword, 'CTA variants:', Object.keys(parsedCTAs.cta_variants || {}));
      } else {
        console.log('ℹ️ No saved CTAs found for keyword:', keywordRow.keyword);
      }
      
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  /**
   * Auto-save prompts with debouncing
   * Why this matters: Saves user's prompt changes automatically without overwhelming localStorage
   */
  const autoSavePrompts = () => {
    if (!keywordRow || !hasUserInput) return;
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    setAutoSaveStatus('saving');
    
    // Set new timeout for debounced saving
    const timeout = setTimeout(() => {
      try {
        const promptsData = {
          systemPrompt,
          userPrompt,
          lastModified: new Date().toISOString()
        };
        
        localStorage.setItem(`apollo_blog_prompts_draft_${keywordRow.id}`, JSON.stringify(promptsData));
        setAutoSaveStatus('saved');
        
        // Clear saved status after 2 seconds
        setTimeout(() => setAutoSaveStatus(''), 2000);
        
        console.log('💾 Auto-saved prompts for keyword:', keywordRow.keyword);
        
      } catch (error) {
        console.error('Error auto-saving prompts:', error);
        setAutoSaveStatus('');
      }
    }, 1000); // 1 second debounce
    
    setAutoSaveTimeout(timeout);
  };

  /**
   * Auto-save content and meta fields immediately
   * Why this matters: Preserves generated content without delay since it's less frequent than prompt changes
   */
  const autoSaveContent = (content: string, title: string, description: string) => {
    if (!keywordRow) return;
    
    try {
      const contentData = {
        content,
        metaSeoTitle: title,
        metaDescription: description,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(`apollo_blog_content_draft_${keywordRow.id}`, JSON.stringify(contentData));
      console.log('💾 Auto-saved content for keyword:', keywordRow.keyword);
      
    } catch (error) {
      console.error('Error auto-saving content:', error);
    }
  };

  /**
   * Auto-save CTAs to localStorage
   * Why this matters: Preserves generated CTAs when modal is closed and reopened
   */
  const autoSaveCTAs = (ctaData: CTAGenerationResult) => {
    if (!keywordRow) return;
    
    try {
      const ctasData = {
        ...ctaData,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(`apollo_blog_ctas_draft_${keywordRow.id}`, JSON.stringify(ctasData));
      console.log('💾 Auto-saved CTAs for keyword:', keywordRow.keyword);
      
    } catch (error) {
      console.error('Error auto-saving CTAs:', error);
    }
  };

  /**
   * Clear auto-save data for this keyword
   * Why this matters: Cleans up localStorage when user explicitly clears content
   */
  const clearAutoSaveData = () => {
    if (!keywordRow) return;
    
    try {
      localStorage.removeItem(`apollo_blog_prompts_draft_${keywordRow.id}`);
      localStorage.removeItem(`apollo_blog_content_draft_${keywordRow.id}`);
      localStorage.removeItem(`apollo_blog_ctas_draft_${keywordRow.id}`);
      console.log('🗑️ Cleared auto-save data for keyword:', keywordRow.keyword);
    } catch (error) {
      console.error('Error clearing auto-save data:', error);
    }
  };

  // Auto-save prompts when they change
  useEffect(() => {
    autoSavePrompts();
  }, [systemPrompt, userPrompt]);

  // Auto-save content when it changes
  useEffect(() => {
    if (generatedContent || metaSeoTitle || metaDescription) {
      autoSaveContent(generatedContent, metaSeoTitle, metaDescription);
    }
  }, [generatedContent, metaSeoTitle, metaDescription]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // VoC Kit Status Checking (copied from CTACreatorPage)
  useEffect(() => {
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

    const checkDismissedState = () => {
      try {
        const dismissed = localStorage.getItem('apollo_voc_kit_ready_dismissed');
        setVocKitReadyDismissed(dismissed === 'true');
      } catch (error) {
        console.error('Error checking dismissed state:', error);
      }
    };

    checkVocKit();
    checkDismissedState();
    
    // Listen for VoC Kit updates
    const handleVocUpdate = () => checkVocKit();
    window.addEventListener('apollo-voc-kit-updated', handleVocUpdate);
    
    return () => window.removeEventListener('apollo-voc-kit-updated', handleVocUpdate);
  }, []);

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
      
      // Use centralized API configuration
    // Why this matters: Ensures all deployments (Netlify, Vercel, local) use the correct backend URL
    const apiUrl = API_ENDPOINTS.generateMeta;
      console.log('🌐 API URL:', apiUrl);
      
      const requestBody = {
        keyword: keyword,
        content_preview: contentPreview,
        prompt: `Generate question-based meta title and direct answer description for content about "${keyword}".

CRITICAL QUESTION-ANSWER FORMAT REQUIREMENTS:

Meta Title Requirements:
- MUST be a natural question that includes the main keyword
- Choose format based on keyword type:
  * Job titles (singular): "Who Is A [Job Title]? [Descriptive Context]" (e.g., "Who Is An SDR Manager? Roles, Responsibilities, Salary")
  * Job titles (plural): "Who Are [Job Titles]? [Descriptive Context]" (e.g., "Who Are Sales Consultants? Roles, Skills, Career Path")
  * Processes/concepts: "What Is [Process]? [Descriptive Context]" (e.g., "What Is Sales Prospecting? Strategies, Tools, Best Practices")
  * Tools/software: "How Does [Tool] Work? [Descriptive Context]" (e.g., "How Does CRM Software Work? Features, Benefits, Implementation")
  * Strategies/methods: "Why Use [Strategy]? [Descriptive Context]" (e.g., "Why Use Account-Based Marketing? Benefits, Process, ROI")
- Maximum 70 characters INCLUDING "| Apollo" suffix
- MUST use proper Title Case (capitalize all major words)
- MUST include descriptive context beyond just the basic question
- Add relevant descriptive elements: roles, responsibilities, salary, benefits, strategies, tools, best practices, etc.
- The keyword should appear naturally and grammatically correctly

Meta Description Requirements:
- MUST directly answer the title question using the main keyword naturally
- Adapt answer format to keyword type:
  * Job roles: "A [Job Title] is [role definition/who they are]. They [main responsibilities/activities]. Apollo helps [job titles] [specific benefit]."
  * Processes: "[Process] is [definition]. It involves [key steps]. Apollo provides [specific tools/features]."
  * Tools: "[Tool] helps [main function]. It [key capabilities]. Apollo offers [specific advantage]."
- Exactly 150-160 characters
- Must be complete sentences ending with a period

Content preview: ${contentPreview.substring(0, 200)}...

INTELLIGENT Question-Answer Examples by Keyword Type:

• Job Title (Singular): "Who Is An SDR Manager? Roles, Responsibilities, Salary | Apollo"
  Description: "An SDR Manager is a sales leader who oversees development teams and prospecting strategies. They coach reps and optimize processes. Apollo helps SDR Managers track team performance."

• Job Title (Plural): "Who Are Sales Consultants? Skills, Career Path, Salary | Apollo"
  Description: "Sales Consultants are professionals who advise prospects on solutions for their business needs. They build relationships and close deals. Apollo provides consultants with prospect intelligence."

• Process/Concept: "What Is Cold Email Marketing? Strategies, Tools, Best Practices | Apollo"
  Description: "Cold email marketing is outreach to prospects without prior contact. It uses personalized messages to generate leads. Apollo provides templates and automation tools."

• Strategy/Method: "Why Use Account-Based Marketing? Benefits, Process, ROI | Apollo"
  Description: "Account-based marketing targets specific high-value accounts with personalized campaigns. It aligns sales and marketing teams. Apollo enables ABM with contact data."

ABSOLUTELY FORBIDDEN:
- Grammatically incorrect questions ("What Is A Sales Consultants?", "What Are A Sales Consultant?", "What Is A Account Executives?")
- Including "| Apollo" in H1 headlines (that's only for SEO titles, not content headlines)
- Robotic/boilerplate phrasing that doesn't sound human-written
- Rigid "What Is [keyword]?" format for all keyword types without considering singular/plural grammar
- Non-question titles ("Sales Tips", "Lead Generation Methods", "Prospecting Techniques")
- Titles with colons or lists ("Sales Prospecting: 7 Methods", "Tools: Features & Comparison")
- The word "Guide" or "Guides" (use intelligent question format instead)
- "Complete Guide" or "Comprehensive Guide" (use appropriate question type)
- Descriptions that don't answer the title question directly
- Descriptions that don't include the main keyword naturally

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
    const suffix = " - Complete Guide | Apollo";
    return `${cleanKeyword.charAt(0).toUpperCase() + cleanKeyword.slice(1)}${suffix}`;
  };

  /**
   * Generate fallback meta description if AI generation fails
   * Why this matters: Provides a backup when AI service is unavailable
   */
  const generateFallbackDescription = (keyword: string): string => {
    return `Comprehensive guide to ${keyword} with expert insights and proven strategies. Learn data-driven approaches to drive results with Apollo.`;
  };

  /**
   * Reset prompts to default values
   * Why this matters: Allows users to quickly restore the proven default prompts after experimenting with custom ones
   */
  const resetToDefaults = () => {
    generateInitialPrompts();
    // Clear saved prompts to ensure fresh defaults are applied
    if (keywordRow) {
      localStorage.removeItem(`apollo_blog_prompts_draft_${keywordRow.id}`);
    }
  };

  /**
   * Get random CTA anchor text to ensure even distribution
   * Why this matters: Prevents LLM bias toward first option in the list
   */
  const getRandomCTAAnchorText = (): string => {
    const ctaOptions = [
      "Start Free with Apollo",
      "Try Apollo Free",
      "Start Your Free Trial", 
      "Start a Trial",
      "Schedule a Demo",
      "Request a Demo", 
      "Start Prospecting",
      "Get Leads Now"
    ];
    
    // Use random selection to ensure even distribution
    const randomIndex = Math.floor(Math.random() * ctaOptions.length);
    const selectedCTA = ctaOptions[randomIndex];
    console.log(`🎯 [BlogModal] Selected CTA anchor text: "${selectedCTA}" (${randomIndex + 1}/${ctaOptions.length})`);
    return selectedCTA;
  };

  /**
   * Generate UTM-tracked Apollo signup URL for blog creator campaigns
   * Why this matters: Tracks campaign effectiveness for specific keywords with utm_term parameter
   */
  const generateBlogCreatorSignupURL = (keyword: string): string => {
    const baseURL = 'https://www.apollo.io/sign-up';
    
    if (!keyword) {
      return baseURL;
    }
    
    // Generate UTM parameters with keyword as utm_term (sanitize for URL)
    const sanitizedKeyword = keyword.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single underscore
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .trim();
      
    const url = `${baseURL}?utm_campaign=blog_creator&utm_term=${sanitizedKeyword}`;
    
    return url;
  };

  /**
   * Generate system and user prompts for Blog Agents context
   * Why this matters: Creates targeted prompts for regenerating or editing existing content.
   */
  const generateInitialPrompts = () => {
    const currentYear = 2025;
    // Generate UTM-tracked Apollo signup URL for this keyword and select random CTA
    const apolloSignupURL = generateBlogCreatorSignupURL(keywordRow.keyword);
    const selectedCTA = getRandomCTAAnchorText();
    const systemPromptTemplate = `You are a world-class SEO, AEO, and LLM SEO content marketer for Apollo with deep expertise in creating comprehensive, AI-optimized articles that rank highly and get cited by AI answer engines (ChatGPT, Perplexity, Gemini, Claude, etc.). Your specialty is transforming content briefs into definitive resources that become the go-to sources for specific topics.

CRITICAL CONTENT PHILOSOPHY:
Your goal is to create content that becomes the definitive, comprehensive resource on the topic - the content that other creators reference and that AI engines cite as authoritative.

CONTENT COVERAGE REQUIREMENTS:
- Address ALL aspects of the topic comprehensively
- Include practical, actionable guidance that readers can implement
- Provide genuine value that advances knowledge in the space
- Cover both current best practices AND emerging trends
- Include specific examples, metrics, and concrete details

AEO (ANSWER ENGINE OPTIMIZATION) PRINCIPLES:
- Structure for extractability with clear, self-contained insights
- Use semantic HTML and proper heading hierarchy (<h1> → <h2> → <h3>)
- Format data in proper <table> and <ul>/<ol> structures for easy AI parsing
- Include specific examples, metrics, and concrete details
- Write headlines that match search intent ("How to...", "What is...", "Best ways to...")
- Place the most important answer in the first paragraph under each heading

FORMATTING REQUIREMENTS:
1. **Proper HTML Structure:**
   - Use <h1> for main title (MUST use proper Title Case - capitalize all major words, NEVER include "| Apollo")
   - ALL H2 and H3 headers should be natural, grammatically correct questions in Title Case:
     * Singular: "What Is A Sales Consultant?", "How Does Lead Generation Work?"
     * Plural: "What Are Sales Consultants?", "Why Are Account Executives Important?"
     * Process: "What Is Sales Prospecting?", "How Does CRM Integration Work?"
   - Format all lists with proper <ul>, <ol>, and <li> tags
   - Use <table> elements for any comparative data, features, or structured information
   - Include <p> tags for all paragraphs
   - Use <strong> for emphasis and key concepts
   - Format links as: <a href="URL" target="_blank">anchor text</a>

2. **Tables and Structured Data:**
   - When presenting comparisons, features, pricing, or any structured data, ALWAYS use HTML tables
   - Include proper <thead>, <tbody>, <th>, and <td> elements
   - Use tables for: feature comparisons, pricing tiers, pros/cons, statistics, timelines, etc.
   - Example format:
   <table>
     <thead>
       <tr><th>Feature</th><th>Benefit</th><th>Implementation</th></tr>
     </thead>
     <tbody>
       <tr><td>Data Enrichment</td><td>270M+ contacts</td><td>API integration</td></tr>
     </tbody>
   </table>

3. **Brand Kit Variable Integration:**
   - MUST process and include brand kit variables naturally throughout content
   - Use {{ brand_kit.ideal_customer_profile }} for testimonials and customer examples
   - Include {{ brand_kit.competitors }} when discussing competitive landscape
   - Reference {{ brand_kit.brand_point_of_view }} in strategic sections
   - End with strong CTA using this exact anchor text: "${selectedCTA}" linked to ${apolloSignupURL}
   - Apply {{ brand_kit.tone_of_voice }} consistently throughout
   - Follow {{ brand_kit.writing_rules }} for style and approach

IMPORTANT: The current year is 2025. When referencing "current year," "this year," or discussing recent trends, always use 2025. Do not reference 2024 or earlier years as current.

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY clean HTML content without any markdown code blocks, explanatory text, or meta-commentary
- DO NOT include phrases like "Here's the content:" or HTML code block markers
- Start directly with the HTML content and end with the closing HTML tag
- No markdown formatting, no code block indicators, no explanatory paragraphs

CONTENT STRUCTURE REQUIREMENTS:
1. **Compelling H1 Headline in Title Case** (question format when appropriate, NEVER include "| Apollo")
2. **Authority-Establishing Introduction** (preview value and set expectations)
3. **Comprehensive Sections** with proper H2/H3 hierarchy in Title Case (grammatically correct questions)
4. **Tables for Structured Data** (comparisons, features, statistics)
5. **Practical Implementation Guidance** with step-by-step processes
6. **Real-World Examples** and case studies (using brand kit data)
7. **Natural Apollo Promotion** - End with compelling call-to-action using brand kit variables

BRAND INTEGRATION GUIDELINES:
- Lead with value and insights, not promotional content
- Use brand context to enhance credibility and expertise
- Include specific outcomes and metrics where relevant
- Position brand solutions naturally within comprehensive guidance
- Focus on helping readers achieve their goals first

Remember: Create the definitive resource that makes other content feel incomplete by comparison. Every section should provide genuine value and actionable insights.`;

    const userPromptTemplate = `Based on this keyword and brand context, create comprehensive AEO-optimized content for 2025 (remember we are in 2025):

**Target Keyword:** ${keywordRow.keyword}

**CRITICAL CONTENT REQUIREMENTS:**

1. **HTML Structure & Formatting:**
   - Create an H1 title that directly addresses the keyword (use question format when appropriate)
   - Use proper heading hierarchy with H2 for major sections, H3 for subsections
   - Format ALL lists with proper <ul>/<ol> and <li> tags
   - Create HTML tables for ANY structured data (features, comparisons, statistics, timelines)
   - Use <p> tags for all paragraphs, <strong> for emphasis

2. **Required Tables/Structured Data:**
   - Include at least 2-3 HTML tables presenting relevant information such as:
     * Feature comparisons or capability matrices
     * Implementation timelines or process steps
     * Statistics or performance metrics
     * Pricing or value comparisons
     * Best practices checklist
   - Format tables with proper <thead>, <tbody>, <th>, and <td> elements

3. **Brand Kit Variable Integration (MANDATORY):**
   - Use {{ brand_kit.ideal_customer_profile }} to include customer testimonials or examples (at least once)
   - Reference {{ brand_kit.competitors }} when discussing market landscape
   - Apply {{ brand_kit.brand_point_of_view }} in strategic sections
   - Follow {{ brand_kit.tone_of_voice }} throughout the content
   - Implement {{ brand_kit.writing_rules }} for style consistency
   - End with a contextual conclusion section (NOT "Getting Started with ${keywordRow.keyword}") and CTA linked to ${apolloSignupURL}

4. **Content Depth & Value:**
   - Provide comprehensive coverage that serves as the definitive resource
   - Include practical, actionable guidance with specific examples
   - Address both current best practices and emerging trends for 2025
   - Cover implementation strategies with step-by-step processes
   - Include relevant metrics, benchmarks, and data points

5. **AEO Optimization:**
   - Structure content for AI answer engine extraction
   - Use semantic HTML elements appropriately
   - Include self-contained insights that can be cited independently
   - Write clear, precise language that AI can easily understand
   - Format for both deep reading and quick reference

6. **Technical Requirements:**
   - Do NOT use emdashes (—) in the content
   - Avoid AI-detectable phrases like "It's not just about..., it's..." or "This doesn't just mean..., it also means..."
   - Use natural, human-like language throughout
   - Include inline links to relevant external resources: <a href="URL" target="_blank">anchor text</a>

**Content Quality Requirements:**
1. Use semantic HTML structure with proper heading hierarchy (H1 → H2 → H3)
2. Include practical examples and actionable insights throughout
3. Optimize for AI-powered search engines (ChatGPT, Perplexity, Gemini)
4. Ensure content is non-promotional and genuinely helpful
5. Include specific data points, statistics, and examples from the provided data
6. Use {{ brand_kit.ideal_customer_profile }} to inject customer testimonials only once within the body content where appropriate
7. CRITICAL COMPLETION REQUIREMENT: MUST end with complete conclusion and call-to-action, reserve final 15-20% of content for proper conclusion, NEVER end mid-sentence or mid-paragraph

📝 CONCLUSION REQUIREMENTS:

REQUIRED: End with a contextual conclusion section that includes:

1. **Key takeaways** - summarize the most important points from the article
2. **Implementation guidance** - practical next steps readers can take
3. **Success factors** - what determines outcomes in this area
4. **Apollo integration** - naturally position how Apollo supports the topic
5. **Strong CTA** - compelling call-to-action using this exact anchor text: "${selectedCTA}" linked to ${apolloSignupURL} (target="_blank")

EXAMPLE CONCLUSION APPROACHES:

**Option 1 (Implementation Focus):**
<h2>[Topic] Implementation Best Practices</h2>
<p>Successful [topic] implementation requires [key principle]. Organizations that prioritize [specific approach] see [specific benefits] while avoiding [common pitfalls].</p>

<p>The most effective [topic] strategies combine [elements] with [other elements]. This balanced approach ensures [outcome] while maintaining [important factor].</p>

<p>Ready to enhance your [topic] results? <a href="${apolloSignupURL}" target="_blank">${selectedCTA}</a> and discover how Apollo's platform can accelerate your success.</p>

**Option 2 (Strategic Focus):**
<h2>Maximizing [Topic] Effectiveness</h2>
<p>[Topic] success depends on [key factors]. Teams that focus on [approach] while [additional consideration] achieve [specific outcomes].</p>

<p>The future of [topic] involves [trend or development]. Organizations preparing for these changes will [competitive advantage].</p>

<p><a href="${apolloSignupURL}" target="_blank">${selectedCTA}</a> and transform how your team approaches [topic] with Apollo's comprehensive platform.</p>

[Use a contextual conclusion that flows naturally from your content - avoid formulaic "Getting Started" headers]

8. DO NOT use emdashes (—) in the content
9. AVOID AI-detectable phrases like "It's not just about..., it's..." or "This doesn't just mean..., it also means..."
10. Use natural, human-like language throughout
11. Use tables to display all data clearly and professionally
12. Generate SEO Title within 70 characters total INCLUDING "| Apollo" suffix - create concise, complete titles that capture the core value

**CRITICAL OUTPUT FORMAT: Respond with a JSON object containing exactly three fields:**

{
  "content": "Complete HTML article with proper structure, tables, and brand kit variables processed",
  "metaSeoTitle": "SEO-optimized title (50-60 characters including | Apollo)",
  "metaDescription": "Compelling meta description (150-160 characters) that avoids formulaic phrases"
}

**CRITICAL: YOU MUST RETURN ONLY VALID JSON - NO OTHER TEXT ALLOWED**

Your response must be a single line JSON object with three fields: content, metaSeoTitle, metaDescription

ABSOLUTE REQUIREMENTS:
- Start your response with opening brace and end with closing brace
- NO text before the JSON
- NO text after the JSON  
- NO markdown code blocks
- NO explanations like "Here is your JSON:"
- ALL HTML must be in the "content" field as properly escaped JSON string
- CRITICAL: Escape ALL quotes with backslashes (\\" not "), escape newlines as \\n, escape tabs as \\t
- CRITICAL: Do NOT include literal newlines or unescaped quotes in JSON strings - this breaks parsing
- metaSeoTitle MUST be 70 characters or less INCLUDING "| Apollo" suffix (generate concise, complete titles)
- metaDescription MUST be 150-160 characters

EXAMPLES OF WRONG FORMAT:
- Here is your JSON: [JSON object]
- [JSON object wrapped in markdown code blocks]
- Any explanatory text before or after the JSON

CORRECT FORMAT: Pure JSON object starting with opening brace, ending with closing brace, no other text.

**Quality Standards:**
- Content should be comprehensive enough to serve as the definitive resource on ${keywordRow.keyword}
- All brand kit variables must be properly processed and integrated
- Tables must be included for structured data presentation
- HTML formatting must be clean and semantic
- Focus on providing genuine value and actionable insights
- End naturally with Apollo promotion using brand kit variables
- Use proper HTML tags only (no markdown)

Return ONLY the JSON object with the three required fields. No additional text or explanations.`;

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
        
        .html-code {
            color: #d4d4d4;
            font-size: 13px;
            line-height: 1.5;
        }
        
        /* HTML syntax highlighting */
        .html-tag { color: #569cd6; }
        .html-attr { color: #92c5f7; }
        .html-value { color: #ce9178; }
        .html-text { color: #d4d4d4; }
        
        
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
            <button class="copy-btn" onclick="copyHtmlCode()">📋 Copy HTML</button>
        </div>
        <div class="code-content">
            <pre class="html-code" id="htmlCode">${contentToOpen.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
    </div>

    <script>
        function copyHtmlCode() {
            const htmlCode = \`${contentToOpen.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
            navigator.clipboard.writeText(htmlCode).then(() => {
                const btn = document.querySelector('.copy-btn');
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                btn.style.backgroundColor = '#10b981';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = '#0e639c';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy HTML. Please select and copy manually.');
            });
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
   * Open Google Docs with content
   * Why this matters: Allows users to quickly move generated content to Google Docs for further editing and collaboration.
   */
  const openGoogleDocs = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedContent;
    if (!contentToCopy) {
      alert('Please generate content first before creating a Google Doc.');
      return;
    }

    // Check if Client ID is available
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      alert('Google Client ID not configured. Please check your .env file and restart the server.');
      return;
    }

    try {
      // Generate document title from keyword
      const docTitle = `Apollo Blog Content - ${keywordRow.keyword}`;
      
      // Create new Google Doc with content
      const documentUrl = await googleDocsService.createDocument(docTitle, contentToCopy);
      
      // Open the new document in a new tab
      window.open(documentUrl, '_blank');
      
    } catch (error) {
      console.error('Error creating Google Doc:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        error: error
      });
      
      // Fallback to opening empty Google Docs if API fails
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to create')) {
        alert('Unable to create Google Document. Please check your Google account permissions and try again.');
      } else {
        // If user cancels authentication, just open Google Docs
        alert(`Google Docs integration error: ${errorMessage}. Opening Google Docs instead.`);
        window.open('https://docs.google.com/', '_blank');
      }
    }
  };

  /**
   * Open Google Sheets with content data
   * Why this matters: Provides data logging and tracking capabilities for content management.
   */
  /**
   * Generate URL slug from keyword
   * Why this matters: Creates SEO-friendly URLs by converting keywords to lowercase, hyphenated format.
   */
  const generateUrlSlug = (keyword: string): string => {
    return keyword
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  /**
   * Determine secondary category based on content analysis
   * Why this matters: Automatically categorizes content for better organization and content strategy.
   */
  const determineSecondaryCategory = (keyword: string, content: string): string => {
    const keywordLower = keyword.toLowerCase();
    const contentLower = content.toLowerCase();
    const combinedText = `${keywordLower} ${contentLower}`;

    // Define category keywords for matching
    const categoryKeywords = {
      'Sales': ['sales', 'selling', 'prospect', 'deal', 'revenue', 'quota', 'pipeline', 'conversion', 'closing', 'negotiation'],
      'Prospecting': ['prospecting', 'outreach', 'cold email', 'cold call', 'lead generation', 'qualification', 'discovery'],
      'Marketing': ['marketing', 'campaign', 'brand', 'advertising', 'promotion', 'content marketing', 'social media'],
      'CRM': ['crm', 'customer relationship', 'salesforce', 'hubspot', 'pipedrive', 'contact management'],
      'Revenue Operations': ['revops', 'revenue operations', 'sales ops', 'operations', 'process', 'workflow', 'automation'],
      'GTM': ['gtm', 'go-to-market', 'market entry', 'launch', 'strategy', 'positioning'],
      'Data': ['data', 'analytics', 'metrics', 'reporting', 'insights', 'intelligence', 'dashboard'],
      'AI': ['ai', 'artificial intelligence', 'machine learning', 'automation', 'chatbot', 'predictive'],
      'B2B': ['b2b', 'business to business', 'enterprise', 'saas', 'software'],
      'Demand Generation': ['demand gen', 'lead gen', 'inbound', 'content', 'seo', 'paid ads'],
      'Content Marketing': ['content', 'blog', 'article', 'video', 'podcast', 'webinar'],
      'Marketing Strategy': ['strategy', 'planning', 'budget', 'roi', 'attribution'],
      'Sales Intelligence': ['intelligence', 'research', 'data enrichment', 'contact discovery'],
      'Compliance Data Strategy': ['compliance', 'gdpr', 'privacy', 'regulation', 'legal'],
      'Roles': ['manager', 'director', 'vp', 'ceo', 'founder', 'rep', 'coordinator'],
      'Companies': ['company', 'organization', 'business', 'startup', 'enterprise', 'corporation']
    };

    // Count keyword matches for each category
    let bestCategory = 'General';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => combinedText.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }

    return bestCategory;
  };

  /**
   * Randomly select author from predefined list
   * Why this matters: Ensures author attribution is distributed across the team for content variety.
   */
  const selectRandomAuthor = (): string => {
    const authors = [
      'shaun-hinklein',
      'andy-mccotter-bicknell', 
      'cam-thompson',
      'kenny-keesee',
      'maribeth-daytona',
      'melanie-maecardeno'
    ];
    
    const randomIndex = Math.floor(Math.random() * authors.length);
    return authors[randomIndex];
  };

  const openGoogleSheets = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedContent;
    if (!contentToCopy) {
      alert('Please generate content first before logging to Google Sheets.');
      return;
    }

    setIsOpeningSheets(true);
    try {
      // Generate the new metadata fields
      const urlSlug = generateUrlSlug(keywordRow.keyword);
      const secondaryCategory = determineSecondaryCategory(keywordRow.keyword, contentToCopy);
      const author = selectRandomAuthor();

      // Prepare blog content data for logging with new fields (keyword removed)
      const blogData = {
        metaSeoTitle: metaSeoTitle || `${keywordRow.keyword} - Complete Guide`,
        metaDescription: metaDescription || `Comprehensive guide about ${keywordRow.keyword} with expert insights and actionable tips.`,
        htmlContent: contentToCopy,
        urlSlug: urlSlug,
        secondaryCategory: secondaryCategory,
        author: author
      };

      // Log data to your specific spreadsheet
      const result = await googleDocsService.appendToSpecificSpreadsheet('15u6QMH8AtfHN3UwHMUueJgRX11sCvsZsuEGbkPfPXm0', blogData);
      
      if (result.success) {
        // Show success message
        setSheetsSuccessMessage('Blog content logged to Google Sheets successfully!');
        setShowSheetsMessage(true);
        setTimeout(() => setShowSheetsMessage(false), 3000);
        
        // Open the specific Google Sheet URL you provided
        window.open('https://docs.google.com/spreadsheets/d/15u6QMH8AtfHN3UwHMUueJgRX11sCvsZsuEGbkPfPXm0/edit?gid=1144895816', '_blank');
      }
      
    } catch (error) {
      console.error('Error logging to Google Sheets:', error);
      
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to save')) {
        alert('Unable to log to Google Sheets. Please check your Google account permissions and try again.');
      } else if (errorMessage.includes('Authentication')) {
        alert('Google authentication required. Please sign in to your Google account.');
      } else {
        alert(`Google Sheets error: ${errorMessage}. Please try again.`);
      }
    } finally {
      setIsOpeningSheets(false);
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
   * Toggle edit mode for generated content with CTA insertion capabilities
   * Why this matters: Allows users to edit content and insert CTAs at precise cursor positions.
   */
  const toggleEditMode = () => {
    if (isEditingContent) {
      console.log('💾 [toggleEditMode] Saving content from edit mode...');
      console.log('📝 [toggleEditMode] Raw editable content length:', editableContent.length);
      
      // Compact the HTML for saving (CTAs are already styled, no conversion needed)
      const compactedContent = compactHTMLForSaving(editableContent);
      console.log('🗜️ [toggleEditMode] Compacted content length:', compactedContent.length);
      console.log('📋 [toggleEditMode] Final content preview (first 200 chars):', compactedContent.substring(0, 200));
      
      setGeneratedContent(compactedContent);
      console.log('✅ [toggleEditMode] Generated content updated');
      
      // Auto-save the final content
      autoSaveContent(compactedContent, metaSeoTitle, metaDescription);
      // Update the original keyword row if callback provided
      if (onContentUpdate) {
        onContentUpdate(keywordRow.id, compactedContent);
      }
    } else {
      console.log('✏️ [toggleEditMode] Entering edit mode...');
      // Enter edit mode - sync editable content with current content and format for readability
      const formattedContent = formatHTMLForEditing(generatedContent);
      setEditableContent(formattedContent);
      console.log('📝 [toggleEditMode] Editable content set, length:', formattedContent.length);
      // Initialize edit history for undo/redo functionality
      initializeEditHistory(formattedContent);
    }
    setIsEditingContent(!isEditingContent);
    console.log('🔄 [toggleEditMode] Edit mode toggled to:', !isEditingContent);
  };

  /**
   * Format HTML content for better readability in edit mode
   * Why this matters: Breaks up condensed HTML into readable lines for easier editing.
   */
  const formatHTMLForEditing = (content: string): string => {
    if (!content) return content;

    let formatted = content
      // Add line breaks after closing tags
      .replace(/(<\/h[1-6]>)/g, '$1\n\n')
      .replace(/(<\/p>)/g, '$1\n\n')
      .replace(/(<\/div>)/g, '$1\n')
      .replace(/(<\/li>)/g, '$1\n')
      .replace(/(<\/ul>)/g, '$1\n\n')
      .replace(/(<\/ol>)/g, '$1\n\n')
      .replace(/(<\/table>)/g, '$1\n\n')
      .replace(/(<\/thead>)/g, '$1\n')
      .replace(/(<\/tbody>)/g, '$1\n')
      .replace(/(<\/tr>)/g, '$1\n')
      .replace(/(<\/blockquote>)/g, '$1\n\n')
      .replace(/(<\/section>)/g, '$1\n\n')
      .replace(/(<\/article>)/g, '$1\n\n')
      
      // Add line breaks before opening tags
      .replace(/(<h[1-6][^>]*>)/g, '\n$1')
      .replace(/(<p[^>]*>)/g, '\n$1')
      .replace(/(<ul[^>]*>)/g, '\n$1')
      .replace(/(<ol[^>]*>)/g, '\n$1')
      .replace(/(<li[^>]*>)/g, '\n  $1')
      .replace(/(<table[^>]*>)/g, '\n$1')
      .replace(/(<thead[^>]*>)/g, '\n  $1')
      .replace(/(<tbody[^>]*>)/g, '\n  $1')
      .replace(/(<tr[^>]*>)/g, '\n    $1')
      .replace(/(<th[^>]*>)/g, '$1')
      .replace(/(<td[^>]*>)/g, '$1')
      .replace(/(<blockquote[^>]*>)/g, '\n$1')
      .replace(/(<div[^>]*>)/g, '\n$1')
      
      // Clean up multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      
      // Trim leading/trailing whitespace
      .trim();

    return formatted;
  };

  /**
   * Convert formatted HTML back to compact format for saving
   * Why this matters: Removes extra whitespace and formatting added for editing readability.
   */
  const compactHTMLForSaving = (content: string): string => {
    if (!content) return content;

    return content
      // Remove extra newlines and indentation
      .replace(/\n\s+/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .replace(/>\s+</g, '><')
      .trim();
  };

  /**
   * Generate Apollo sign-up URL with UTM tracking
   * Why this matters: Creates trackable sign-up links that help measure CTA performance by keyword and position.
   */
  const generateApolloSignUpUrl = (keyword: string, position: string): string => {
    // Clean the keyword to create a URL-friendly campaign name
    const cleanKeyword = keyword
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length for URL compatibility

    // Convert position to full word for UTM tracking clarity
    const positionName = position === 'end' ? 'ending' : position;
    const utmCampaign = `blog_creator_${cleanKeyword}_${positionName}cta`;
    return `https://www.apollo.io/sign-up?utm_campaign=${utmCampaign}`;
  };

  /**
   * Convert CTA shortcodes to full Apollo styling with functional sign-up links
   * Why this matters: Transforms shortcodes into beautiful, production-ready CTA designs with trackable Apollo sign-up URLs.
   */
  const convertShortcodesToFullStyling = (content: string): string => {
    if (!content || !generatedCTAs) {
      console.log('🔍 [convertShortcodesToFullStyling] No content or CTAs:', { content: !!content, generatedCTAs: !!generatedCTAs });
      return content;
    }

    console.log('🔄 [convertShortcodesToFullStyling] Starting conversion...');
    let processedContent = content;

    // Process each CTA variant
    Object.entries(generatedCTAs.cta_variants).forEach(([position, ctaData]) => {
      const shortcodePattern = new RegExp(ctaData.shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      console.log(`🎯 [convertShortcodesToFullStyling] Looking for ${position} shortcode:`, ctaData.shortcode);
      
      // Check if shortcode exists in content
      const matches = content.match(shortcodePattern);
      if (matches) {
        console.log(`✅ [convertShortcodesToFullStyling] Found ${matches.length} ${position} shortcode(s)`);
      } else {
        console.log(`❌ [convertShortcodesToFullStyling] No ${position} shortcode found in content`);
        return;
      }
      
      // Generate the Apollo sign-up URL with UTM tracking
      const signUpUrl = generateApolloSignUpUrl(keywordRow.keyword, position);
      
      const fullStyledCTA = `<div style="background-color: #192307; padding: 2rem; border-radius: 0.875rem; margin: 2rem 0; position: relative;">
  <div style="display: flex; align-items: flex-start; gap: 1.5rem;">
    <div style="width: 4rem; height: 4rem; border-radius: 0.75rem; overflow: hidden; flex-shrink: 0;">
      <img src="/apollo logo only.png" alt="Apollo Logo" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
    <div style="flex: 1;">
      <div style="font-size: 0.875rem; font-weight: 600; color: #ffffff; margin-bottom: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase;">
        ${ctaData.cta.category_header}
      </div>
      <h4 style="font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0 1rem 0; line-height: 1.3;">
        ${ctaData.cta.headline}
      </h4>
      <p style="font-size: 1rem; color: #ffffff; line-height: 1.6; margin: 0 0 1.5rem 0; opacity: 0.9;">
        ${ctaData.cta.description}
      </p>
      <a href="${signUpUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; background-color: #BDF548; color: #192307; border-radius: 0.625rem; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(189, 245, 72, 0.3); text-decoration: none;">
        ${ctaData.cta.action_button.replace(/\s*→\s*$/, '')}
        <span style="font-size: 1.1rem;">→</span>
      </a>
    </div>
  </div>
</div>`;

      const beforeLength = processedContent.length;
      processedContent = processedContent.replace(shortcodePattern, fullStyledCTA);
      const afterLength = processedContent.length;
      
      if (afterLength !== beforeLength) {
        console.log(`🎨 [convertShortcodesToFullStyling] Successfully converted ${position} CTA (${beforeLength} → ${afterLength} chars)`);
      } else {
        console.log(`⚠️ [convertShortcodesToFullStyling] No replacement made for ${position} CTA`);
      }
    });

    console.log('✅ [convertShortcodesToFullStyling] Conversion complete');
    return processedContent;
  };

  /**
   * Save current state to edit history
   * Why this matters: Enables undo/redo functionality by tracking content changes.
   */
  const saveToHistory = (content: string) => {
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push(content);
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  /**
   * Initialize edit history when entering edit mode
   * Why this matters: Sets up the baseline for undo/redo operations.
   */
  const initializeEditHistory = (content: string) => {
    setEditHistory([content]);
    setHistoryIndex(0);
  };

  /**
   * Undo last change in edit mode
   * Why this matters: Allows users to revert unwanted changes without losing all their work.
   */
  const undoChange = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditableContent(editHistory[newIndex]);
      
      // Focus back to textarea
      setTimeout(() => {
        if (editableContentRef.current) {
          editableContentRef.current.focus();
        }
      }, 50);

      console.log(`↶ Undo: Reverted to history state ${newIndex}`);
    }
  };

  /**
   * Redo last undone change in edit mode
   * Why this matters: Allows users to restore changes they accidentally undid.
   */
  const redoChange = () => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditableContent(editHistory[newIndex]);
      
      // Focus back to textarea
      setTimeout(() => {
        if (editableContentRef.current) {
          editableContentRef.current.focus();
        }
      }, 50);

      console.log(`↷ Redo: Advanced to history state ${newIndex}`);
    }
  };

  /**
   * Clear all CTAs from the current content
   * Why this matters: Provides a quick way to remove all inserted CTAs and start fresh.
   */
  const clearAllCTAs = () => {
    if (!generatedCTAs) return;

    console.log('🧹 Starting CTA clearing process...');
    console.log('📄 Original content length:', editableContent.length);
    
    let clearedContent = editableContent;
    
    // Remove all Apollo CTA sections (both shortcodes and full HTML)
    Object.values(generatedCTAs.cta_variants).forEach(ctaData => {
      // Remove shortcodes (for backwards compatibility)
      const shortcodePattern = new RegExp(ctaData.shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const beforeShortcode = clearedContent.length;
      clearedContent = clearedContent.replace(shortcodePattern, '');
      const afterShortcode = clearedContent.length;
      if (beforeShortcode !== afterShortcode) {
        console.log(`✅ Removed shortcode: ${beforeShortcode - afterShortcode} chars`);
      }
    });
    
    // Use the HTML comments to reliably identify and remove complete CTA blocks
    // This is the most reliable method since we control these exact markers
    const beforeHTML = clearedContent.length;
    
    // Remove everything between Apollo CTA comment markers (including the markers)
    // This pattern captures everything from the opening comment to the closing comment
    clearedContent = clearedContent.replace(/<!-- Apollo CTA:.*?-->[\s\S]*?<!-- End Apollo CTA -->/g, '');
    
    const afterHTML = clearedContent.length;
    if (beforeHTML !== afterHTML) {
      console.log(`✅ Removed complete CTA blocks: ${beforeHTML - afterHTML} chars`);
    } else {
      console.log('⚠️ No CTA blocks found using comment markers, trying fallback...');
      
      // Fallback: Remove any remaining Apollo divs (for CTAs without proper comments)
      clearedContent = clearedContent.replace(/<div style="background-color: #192307[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '');
    }
    
    // Clean up extra newlines (replace 3+ consecutive newlines with 2)
    clearedContent = clearedContent.replace(/\n{3,}/g, '\n\n');
    
    // Trim leading/trailing whitespace
    clearedContent = clearedContent.trim();
    
    // Save to history and update content
    saveToHistory(clearedContent);
    setEditableContent(clearedContent);
    
    // Focus back to textarea
    setTimeout(() => {
      if (editableContentRef.current) {
        editableContentRef.current.focus();
      }
    }, 50);

    console.log(`🧹 Cleared all CTAs from content`);
    console.log(`📄 Final content length: ${clearedContent.length} (removed ${editableContent.length - clearedContent.length} chars total)`);
  };

  /**
   * Insert full styled CTA at current cursor position
   * Why this matters: Allows precise placement of fully styled Apollo CTAs within the content where the user clicks.
   */
  const insertCTAAtCursor = (position: 'beginning' | 'middle' | 'end') => {
    if (!generatedCTAs || !editableContentRef.current) return;

    const textarea = editableContentRef.current;
    const cursorPosition = textarea.selectionStart;
    const ctaData = generatedCTAs.cta_variants[position];
    
    // Capture scroll position before making changes to preserve user's view
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;
    
    // Generate the Apollo sign-up URL with UTM tracking
    const signUpUrl = generateApolloSignUpUrl(keywordRow.keyword, position);
    
    // Create the full styled CTA HTML
    const fullStyledCTA = `<div style="background-color: #192307; padding: 2rem; border-radius: 0.875rem; margin: 2rem 0; position: relative;">
  <div style="display: flex; align-items: flex-start; gap: 1.5rem;">
    <div style="width: 4rem; height: 4rem; border-radius: 0.75rem; overflow: hidden; flex-shrink: 0;">
      <img src="/apollo logo only.png" alt="Apollo Logo" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
    <div style="flex: 1;">
      <div style="font-size: 0.875rem; font-weight: 600; color: #ffffff; margin-bottom: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase;">
        ${ctaData.cta.category_header}
      </div>
      <h4 style="font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0 1rem 0; line-height: 1.3;">
        ${ctaData.cta.headline}
      </h4>
      <p style="font-size: 1rem; color: #ffffff; line-height: 1.6; margin: 0 0 1.5rem 0; opacity: 0.9;">
        ${ctaData.cta.description}
      </p>
      <a href="${signUpUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; background-color: #BDF548; color: #192307; border-radius: 0.625rem; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(189, 245, 72, 0.3); text-decoration: none;">
        ${ctaData.cta.action_button.replace(/\s*→\s*$/, '')}
        <span style="font-size: 1.1rem;">→</span>
      </a>
    </div>
  </div>
</div>`;
    
    const beforeCursor = editableContent.substring(0, cursorPosition);
    const afterCursor = editableContent.substring(cursorPosition);
    
    // Add some spacing and a readable comment around the CTA for better readability
    const ctaWithComment = `\n\n<!-- Apollo CTA: ${position.toUpperCase()} - ${ctaData.cta.headline} -->\n${fullStyledCTA}\n<!-- End Apollo CTA -->\n\n`;
    
    const newContent = beforeCursor + ctaWithComment + afterCursor;
    
    // Save to history and update content
    saveToHistory(newContent);
    setEditableContent(newContent);
    
    // Focus back to textarea and position cursor after the inserted CTA
    // Preserve scroll position to prevent auto-scrolling to top
    setTimeout(() => {
      const newCursorPosition = cursorPosition + ctaWithComment.length;
      
      // Store scroll position again right before setting cursor (in case it changed)
      const currentScrollTop = textarea.scrollTop;
      const currentScrollLeft = textarea.scrollLeft;
      
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      
      // Restore scroll position to keep user's view exactly where they were
      // Use the original position, not the current one (which might have auto-scrolled)
      textarea.scrollTop = scrollTop;
      textarea.scrollLeft = scrollLeft;
      
      console.log(`📍 Cursor positioned at ${newCursorPosition}, scroll restored to ${scrollTop} (was ${currentScrollTop})`);
      
      // Additional restoration attempts to combat aggressive browser auto-scrolling
      setTimeout(() => {
        if (textarea.scrollTop !== scrollTop) {
          console.log(`🔄 Correcting scroll drift: ${textarea.scrollTop} → ${scrollTop}`);
          textarea.scrollTop = scrollTop;
          textarea.scrollLeft = scrollLeft;
        }
      }, 100);
      
      setTimeout(() => {
        if (textarea.scrollTop !== scrollTop) {
          console.log(`🔄 Final scroll correction: ${textarea.scrollTop} → ${scrollTop}`);
          textarea.scrollTop = scrollTop;
          textarea.scrollLeft = scrollLeft;
        }
      }, 200);
    }, 50);

    // Show success feedback
    setCtaCopySuccess(`${position}_inserted`);
    setTimeout(() => setCtaCopySuccess(''), 2000);

    console.log(`🎯 Inserted ${position} CTA at cursor position ${cursorPosition}`);
  };

  /**
   * Count inserted CTAs in current content
   * Why this matters: Provides feedback on how many CTAs have been inserted.
   */
  const countInsertedCTAs = (): number => {
    if (!editableContent || !generatedCTAs) return 0;
    
    let count = 0;
    
    // Count both shortcodes (backwards compatibility) and full HTML CTAs
    Object.values(generatedCTAs.cta_variants).forEach(ctaData => {
      const shortcodePattern = new RegExp(ctaData.shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = editableContent.match(shortcodePattern);
      count += matches ? matches.length : 0;
    });
    
    // Count Apollo CTA HTML blocks (background-color: #192307 is the unique identifier)
    const htmlCtaMatches = editableContent.match(/<div style="background-color: #192307;[^>]*>/g);
    count += htmlCtaMatches ? htmlCtaMatches.length : 0;
    
    return count;
  };

  /**
   * Get display content with CTA styling applied
   * Why this matters: Shows styled CTAs in the preview while maintaining shortcodes in edit mode.
   */
  const getDisplayContent = (): string => {
    if (isEditingContent) {
      // In edit mode, show the editable content directly (now contains full HTML CTAs)
      return editableContent;
    } else {
      // In display mode, return the saved content directly (already styled during save)
      return generatedContent;
    }
  };



  /**
   * Generate content using AI service (for new generation)
   * Why this matters: Creates fresh content and properly extracts meta fields from JSON response
   */
  const generateContent = async () => {
    console.log('🚀 [BlogContentActionModal] Starting generateContent...');
    console.log('🔍 [BlogContentActionModal] Brand kit available:', !!brandKit);
    console.log('🔍 [BlogContentActionModal] Brand kit data:', brandKit);
    
    if (!brandKit) {
      console.log('❌ [BlogContentActionModal] No brand kit found');
      alert('Please configure your Brand Kit first in the Brand Kit page.');
      return;
    }

    // Load sitemap data from localStorage
    let sitemapData = null;
    try {
      const stored = localStorage.getItem('apollo_sitemap_data');
      if (stored) {
        const sitemaps = JSON.parse(stored);
        // Flatten all sitemap URLs into a single array for content generation
        const allUrls = sitemaps.flatMap((sitemap: any) => 
          sitemap.urls.map((url: any) => ({
            title: url.title,
            description: url.description,
            url: url.url
          }))
        );
        sitemapData = allUrls;
        console.log(`🗺️ [BlogContentActionModal] Loaded ${allUrls.length} URLs from ${sitemaps.length} sitemaps for internal linking`);
      }
    } catch (error) {
      console.warn('Failed to load sitemap data:', error);
    }

    setIsGenerating(true);
    try {
      console.log('🔍 [BlogContentActionModal] Original system prompt:', systemPrompt);
      console.log('🔍 [BlogContentActionModal] Original user prompt:', userPrompt);
      
      // Replace liquid variables in prompts
      const processedSystemPrompt = processLiquidVariables(systemPrompt, brandKit);
      const processedUserPrompt = processLiquidVariables(userPrompt, brandKit);
      
      console.log('✅ [BlogContentActionModal] Processed system prompt:', processedSystemPrompt);
      console.log('✅ [BlogContentActionModal] Processed user prompt:', processedUserPrompt);

      // Create proper post_context structure that the backend expects
      const postContext = {
        title: `${keywordRow.keyword} - Comprehensive Guide`,
        content: keywordRow.output || '',
        pain_point: `Content creation and optimization for ${keywordRow.keyword}`,
        content_opportunity: `Create comprehensive, AEO-optimized content for ${keywordRow.keyword} that outranks competitors`,
        audience_summary: brandKit.idealCustomerProfile || 'Business professionals seeking solutions'
      };

      // Determine backend URL based on environment
      // Why this matters: Ensures production deployments use the correct backend URL
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://apollo-reddit-scraper-backend.vercel.app'
        : 'http://localhost:3001';
      
      const requestBody = {
        post_context: postContext,
        brand_kit: brandKit,
        sitemap_data: sitemapData,
        system_prompt: processedSystemPrompt,
        user_prompt: processedUserPrompt
      };
      
      console.log('📡 [BlogContentActionModal] API Request Body:', requestBody);
      console.log('📡 [BlogContentActionModal] Backend URL:', backendUrl);

      // Use regular content generation with enhanced post-processing CTAs
      console.log('🚀 [BlogContentActionModal] Using content generation with enhanced contextual CTAs...');
      
      const apiResult = await makeApiRequest(
        API_ENDPOINTS.blogCreatorGenerateContent,
        {
          method: 'POST',
          body: JSON.stringify({
            keyword: keywordRow.keyword,
            brand_kit: brandKit,
            sitemap_data: sitemapData,
            system_prompt: processedSystemPrompt,
            user_prompt: processedUserPrompt,
            use_default_prompts: false, // We're providing custom prompts
            target_audience: '',
            content_length: 'medium',
            focus_areas: []
          }),
        }
      );

      if (!apiResult.success) {
        throw new Error(apiResult.error || apiResult.message || 'Failed to generate content');
      }

      const data = apiResult.data!;
      console.log('📥 [BlogContentActionModal] API Response:', data);
      
      // Handle the response - extract content
      let contentResult = '';
      if (data.content) {
        contentResult = data.content;
      } else {
        console.log('❌ [BlogContentActionModal] No content found in response structure:', data);
        throw new Error('No content found in API response');
      }
      
      console.log('✅ [BlogContentActionModal] Final content result:', contentResult);
      
      // Parse the AI response to extract all fields
      const parsedResponse = parseAIResponse(contentResult);
      
      // Enhance with contextual CTAs if enabled
      let finalContent = parsedResponse.content;
      if (enableContextualCtas && finalContent && finalContent.length > 100) {
        try {
          setIsEnhancingWithCtas(true);
          console.log('🎯 [BlogContentActionModal] Enhancing content with contextual CTAs...');
          
          const targetKeyword = keywordRow.keyword;
          const campaignType = 'blog_creator';
          
          // Get sitemap data from localStorage for intelligent URL selection
          const getSitemapData = () => {
            try {
              const stored = localStorage.getItem('apollo_sitemap_data');
              return stored ? JSON.parse(stored) : null;
            } catch (error) {
              console.warn('Failed to load sitemap data:', error);
              return null;
            }
          };

          // Use simple, reliable CTA service with sitemap-aware URL selection
          const ctaResponse = await fetch(API_ENDPOINTS.enhanceWithSimpleCtas, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: finalContent,
              contentFormat: 'html',
              targetKeyword,
              campaignType,
              maxCtasPerArticle: 3,
              sitemapData: getSitemapData()
            })
          });
          
          const ctaResult = await ctaResponse.json();
          
          if (ctaResult.success) {
            finalContent = ctaResult.enhancedContent;
            setCtaEnhancementResult(ctaResult.insertionAnalytics);
            console.log(`✅ [BlogContentActionModal] Enhanced content with ${ctaResult.insertionAnalytics.totalCtasInserted} contextual CTAs`);
          }
        } catch (error) {
          console.warn('⚠️ [BlogContentActionModal] Failed to enhance content with contextual CTAs, using original content:', error);
          // Continue with original content if CTA enhancement fails
        } finally {
          setIsEnhancingWithCtas(false);
        }
      }
      
      setGeneratedContent(finalContent);
      setEditableContent(finalContent);
      setIsEditingContent(false);
      
      // Set meta fields from API response or parsed content
      // Why this matters: Uses meta fields from backend API response if available, otherwise from parsed content
      const metaTitle = data.metaSeoTitle || parsedResponse.metaSeoTitle || '';
      const metaDesc = data.metaDescription || parsedResponse.metaDescription || '';
      
      if (metaTitle || metaDesc) {
        console.log('✅ Setting meta fields from API response:', {
          title: metaTitle,
          description: metaDesc
        });
        setMetaSeoTitle(metaTitle);
        setMetaDescription(metaDesc);
        
        // Save meta fields to localStorage for persistence
        try {
          localStorage.setItem(`apollo_blog_meta_${keywordRow.id}`, JSON.stringify({
            metaSeoTitle: metaTitle,
            metaDescription: metaDesc
          }));
        } catch (error) {
          console.log('⚠️ Could not save meta fields to localStorage:', error);
        }
      }

      // Auto-save the newly generated content (use enhanced content)
      autoSaveContent(finalContent, metaTitle, metaDesc);

      // Update the original keyword row if callback provided
      if (onContentUpdate) {
        onContentUpdate(keywordRow.id, finalContent);
      }

    } catch (error) {
      console.error('Error generating content:', error);
      
      // Fallback content
      const fallbackContent = `
        <h1>${keywordRow.keyword.charAt(0).toUpperCase() + keywordRow.keyword.slice(1)} Guide</h1>
        
        <h2>Executive Summary</h2>
        <p>This comprehensive guide provides expert insights and proven strategies for ${keywordRow.keyword}, leveraging Apollo's data-driven approach to sales and marketing.</p>
        
        <h2>Key Challenges</h2>
        <p>Understanding the critical challenges around ${keywordRow.keyword} that modern businesses face and how to address them effectively.</p>
        
        <h2>Strategic Framework</h2>
        <p>Core strategies and best practices for ${keywordRow.keyword}:</p>
        <ul>
          <li>Data-driven insights and analytics</li>
          <li>Proven methodologies and tactics</li>
          <li>Implementation roadmaps</li>
          <li>Performance measurement</li>
        </ul>
        
        <h2>Implementation Strategy</h2>
        <p>Step-by-step approach to implementing effective ${keywordRow.keyword} strategies within your organization.</p>
        
        <h2>Success Metrics</h2>
        <p>Key performance indicators and metrics to track success and ROI for your ${keywordRow.keyword} initiatives.</p>
        
        <p><strong>Ready to implement these strategies?</strong> <a href="${brandKit?.ctaDestination || 'https://apollo.io'}" target="_blank">${brandKit?.ctaText || 'Get started with Apollo'}</a></p>
      `;
      
      // Use parseAIResponse for fallback content too
      const parsedFallback = parseAIResponse(fallbackContent);
      const fallbackMetaTitle = `${keywordRow.keyword.charAt(0).toUpperCase() + keywordRow.keyword.slice(1)} - Complete Guide | Apollo`;
      const fallbackMetaDescription = `Comprehensive guide to ${keywordRow.keyword} with expert insights and proven strategies. Learn data-driven approaches to drive results with Apollo.`;
      
      setGeneratedContent(parsedFallback.content);
      setEditableContent(parsedFallback.content);
      setIsEditingContent(false);
      setMetaSeoTitle(fallbackMetaTitle);
      setMetaDescription(fallbackMetaDescription);

      // Auto-save the fallback content
      autoSaveContent(parsedFallback.content, fallbackMetaTitle, fallbackMetaDescription);

      // Update the original keyword row if callback provided
      if (onContentUpdate) {
        onContentUpdate(keywordRow.id, parsedFallback.content);
      }
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
    // Use random CTA instead of brand kit CTA to maintain even distribution
    processed = processed.replace(/\{\{\s*brand_kit\.cta_text\s*\}\}/g, getRandomCTAAnchorText());
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
    console.log('🚀 [BlogContentActionModal] Starting runWorkflowAgain...');
    console.log('🔍 [BlogContentActionModal] Brand kit available:', !!brandKit);
    
    if (!brandKit) {
      console.log('❌ [BlogContentActionModal] No brand kit found');
      alert('Please configure your Brand Kit first in the Brand Kit page.');
      return;
    }

    try {
      // Process liquid variables in prompts
      const processedSystemPrompt = processLiquidVariables(systemPrompt, brandKit);
      const processedUserPrompt = processLiquidVariables(userPrompt, brandKit);
      
      console.log('✅ [BlogContentActionModal] Processed system prompt:', processedSystemPrompt);
      console.log('✅ [BlogContentActionModal] Processed user prompt:', processedUserPrompt);

      // Determine backend URL based on environment
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://apollo-reddit-scraper-backend.vercel.app'
        : 'http://localhost:3003';

      // Update status to running BEFORE making the API call
      if (onStatusUpdate) {
        onStatusUpdate(keywordRow.id, 'running');
      }

      // Close modal to let user see the progress in the table
      onClose();

      // Call the blog creator API with custom prompts
      const response = await fetch(`${backendUrl}/api/blog-creator/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keywordRow.keyword,
          content_length: 'medium',
          brand_kit: brandKit,
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate content');
      }

      const responseData = await response.json();
      const { data: result } = responseData;
      
      console.log('✅ [BlogContentActionModal] Workflow regeneration completed');

      // Update the keyword row with new content
      if (onContentUpdate) {
        onContentUpdate(keywordRow.id, result.content || '');
      }
      
      if (onStatusUpdate) {
        onStatusUpdate(keywordRow.id, 'completed');
      }

      // Auto-save to blog history
      const updatedKeywordRow = {
        ...keywordRow,
        status: 'completed' as const,
        output: result.content || '',
        metadata: result.metadata || keywordRow.metadata
      };
      autoSaveBlogIfReady(updatedKeywordRow);

    } catch (error) {
      console.error('❌ [BlogContentActionModal] Workflow regeneration failed:', error);
      
      if (onStatusUpdate) {
        onStatusUpdate(keywordRow.id, 'error');
      }
      
      alert(`Failed to regenerate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

      // Determine backend URL based on environment
      // Why this matters: Ensures production deployments use the correct backend URL  
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://apollo-reddit-scraper-backend.vercel.app'
        : 'http://localhost:3003';
        
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/content/publish-to-cms`, {
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
    // Clear auto-save data
    clearAutoSaveData();
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

  /**
   * Cycle CTA button text to a random different option (copied from CTACreatorPage)
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
    
    // Auto-save updated CTAs to localStorage
    autoSaveCTAs(updatedCTAs);
    
    console.log(`🔄 CTA button changed from "${currentButton}" to "${newButton}" for ${position} position`);
  };

  /**
   * Generate CTAs from blog content (adapted from CTACreatorPage)
   * Why this matters: Uses the generated blog content to create hyper-relevant CTAs using VoC insights.
   */
  const generateCTAs = async () => {
    if (!generatedContent.trim()) {
      setCtaError('Please generate blog content first');
      return;
    }

    if (!vocKitReady) {
      setCtaError('Please extract customer pain points in VoC Kit first');
      return;
    }

    setIsGeneratingCTAs(true);
    setCtaError('');
    
    // If CTAs already exist, show skeletons instead of clearing
    if (generatedCTAs) {
      setShowCtaSkeletons(true);
    } else {
      setGeneratedCTAs(null);
    }
    
    const isRegeneration = !!generatedCTAs;
    setCtaGenerationStage(isRegeneration ? 'Preparing new CTA variations...' : 'Analyzing voice of customer insights...');

    try {
      // Get VoC Kit data to send with request
      let vocKitData = null;
      try {
        const storedVocKit = localStorage.getItem('apollo_voc_kit');
        if (storedVocKit) {
          vocKitData = JSON.parse(storedVocKit);
          console.log('🔍 VoC Kit data loaded for CTA generation:', {
            hasGeneratedAnalysis: vocKitData.hasGeneratedAnalysis,
            extractedPainPointsCount: vocKitData.extractedPainPoints?.length || 0
          });
        }
      } catch (error) {
        console.error('Error loading VoC Kit data:', error);
      }

      const endpoint = buildApiUrl('/api/cta-generation/generate-from-text');
      const requestBody = {
        text: generatedContent,
        enhanced_analysis: true,
        voc_kit_data: vocKitData,
        regenerate: !!generatedCTAs, // Flag to indicate this is a regeneration for unique copy
        timestamp: Date.now() // Add timestamp for unique seed
      };

      // Simulate stage updates for better UX
      const isRegeneration = !!generatedCTAs;
      const stage1 = setTimeout(() => setCtaGenerationStage(isRegeneration ? 'Analyzing current CTAs...' : 'Finding pain points...'), 3000);
      const stage2 = setTimeout(() => setCtaGenerationStage(isRegeneration ? 'Finding new angles...' : 'Connecting pain points to CTAs...'), 6000);
      const stage3 = setTimeout(() => setCtaGenerationStage(isRegeneration ? 'Creating unique CTAs...' : 'Generating CTAs...'), 9000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Clear timeouts
      clearTimeout(stage1);
      clearTimeout(stage2);
      clearTimeout(stage3);

      if (!response.ok) {
        throw new Error(`Failed to generate CTAs: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('🎯 CTA Generation Result:', result.data);
        setShowCtaSkeletons(false);
        setGeneratedCTAs(result.data);
        
        // Auto-save CTAs to localStorage for persistence
        autoSaveCTAs(result.data);
        
        // Auto-save content after CTA generation
        autoSaveContent(generatedContent, metaSeoTitle, metaDescription);
        console.log('💾 Auto-saved content after CTA generation');
      } else {
        throw new Error(result.error || 'Failed to generate CTAs');
      }
    } catch (error: any) {
      console.error('Error generating CTAs:', error);
      setCtaError(error.message || 'Failed to generate CTAs');
      setShowCtaSkeletons(false);
    } finally {
      setIsGeneratingCTAs(false);
      setCtaGenerationStage('');
    }
  };

  /**
   * Generate full styled HTML for a specific CTA variant
   * Why this matters: Creates the complete Apollo-styled CTA HTML for copying and display.
   */
  const getStyledCtaHtml = (position: 'beginning' | 'middle' | 'end'): string => {
    if (!generatedCTAs) return '';
    
    const ctaData = generatedCTAs.cta_variants[position];
    const signUpUrl = generateApolloSignUpUrl(keywordRow.keyword, position);
    
    return `<div style="background-color: #192307; padding: 2rem; border-radius: 0.875rem; margin: 2rem 0; position: relative;">
  <div style="display: flex; align-items: flex-start; gap: 1.5rem;">
    <div style="width: 4rem; height: 4rem; border-radius: 0.75rem; overflow: hidden; flex-shrink: 0;">
      <img src="/apollo logo only.png" alt="Apollo Logo" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
    <div style="flex: 1;">
      <div style="font-size: 0.875rem; font-weight: 600; color: #ffffff; margin-bottom: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase;">
        ${ctaData.cta.category_header}
      </div>
      <h4 style="font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0 1rem 0; line-height: 1.3;">
        ${ctaData.cta.headline}
      </h4>
      <p style="font-size: 1rem; color: #ffffff; line-height: 1.6; margin: 0 0 1.5rem 0; opacity: 0.9;">
        ${ctaData.cta.description}
      </p>
      <a href="${signUpUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; background-color: #BDF548; color: #192307; border-radius: 0.625rem; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(189, 245, 72, 0.3); text-decoration: none;">
        ${ctaData.cta.action_button.replace(/\s*→\s*$/, '')}
        <span style="font-size: 1.1rem;">→</span>
      </a>
    </div>
  </div>
</div>`;
  };

  /**
   * Copy CTA content to clipboard (adapted from CTACreatorPage)
   * Why this matters: Provides reliable copying functionality for CTA shortcodes and content.
   */
  const copyCtaToClipboard = async (text: string, position: string) => {
    if (!text || text.trim() === '') {
      setCtaError('No content available to copy');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCtaCopySuccess(position);
        setTimeout(() => setCtaCopySuccess(''), 2000);
      } else {
        // Fallback for older browsers
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
          setCtaCopySuccess(position);
          setTimeout(() => setCtaCopySuccess(''), 2000);
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (error) {
      console.error('Failed to copy CTA:', error);
      setCtaError('Failed to copy content. Please manually select and copy the content.');
      setTimeout(() => setCtaError(''), 5000);
    }
  };

  /**
   * Dismiss VoC Kit ready notification
   * Why this matters: Allows users to hide the success notification once acknowledged.
   */
  const dismissVocKitReady = () => {
    try {
      localStorage.setItem('apollo_voc_kit_ready_dismissed', 'true');
      setVocKitReadyDismissed(true);
    } catch (error) {
      console.error('Failed to dismiss VoC Kit ready notification:', error);
    }
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
            {/* Left Panel - CTA Generation Interface */}
            <div className="content-modal-panel" style={{ 
              padding: '1.5rem', 
              overflowY: 'auto',
              borderRight: '0.0625rem solid #e5e7eb'
            }}>
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
                      Please extract customer pain points to generate CTAs.
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
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle size={20} style={{ color: '#16a34a' }} />
                    <span style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: '500' }}>
                      VoC Kit is ready! ({painPointsCount} pain points available)
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#374151' }}>
                  Generate CTAs for Content
                </h3>
              </div>

              <p style={{ 
                fontSize: '0.875rem', 
                color: '#64748b', 
                margin: '0 0 1.5rem 0',
                lineHeight: '1.5'
              }}>
                {generatedCTAs 
                  ? 'Regenerate CTAs for the blog content.'
                  : 'Generate beginning, middle, and ending CTAs using Apollo\'s Voice of Customer insights.'
                }
              </p>

              {/* CTA Generation Button */}
              <button
                onClick={generateCTAs}
                disabled={isGeneratingCTAs || !vocKitReady || !generatedContent.trim()}
                  style={{
                    width: '100%',
                  padding: '1rem 1.5rem',
                  backgroundColor: (isGeneratingCTAs || !vocKitReady || !generatedContent.trim()) ? '#9ca3af' : '#EBF212',
                  color: (isGeneratingCTAs || !vocKitReady || !generatedContent.trim()) ? 'white' : 'black',
                  border: 'none',
                    borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: (isGeneratingCTAs || !vocKitReady || !generatedContent.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                    transition: 'all 0.2s ease',
                  marginBottom: '1.5rem'
                }}
              >
                {isGeneratingCTAs ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '0.125rem solid transparent',
                      borderTop: '0.125rem solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    {ctaGenerationStage || (generatedCTAs ? 'Regenerating CTAs...' : 'Generating CTAs...')}
                  </>
                ) : (
                  <>
                    <Target size={20} strokeWidth={3} />
                    {generatedCTAs ? 'Regenerate CTAs' : 'Generate CTAs'}
                  </>
                )}
              </button>

              {ctaError && (
                <div style={{
                  marginBottom: '1.5rem',
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
                  {ctaError}
              </div>
              )}

              {/* Skeleton Loading Section */}
              {showCtaSkeletons && (
                <div style={{ marginTop: '1rem' }}>
                  {/* Skeleton Header */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <Skeleton style={{ height: '0.875rem', width: '8rem' }} />
                    </div>
                  </div>

                  {/* Skeleton CTA Variants */}
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {['beginning', 'middle', 'end'].map((position) => (
                      <div key={position} style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        backgroundColor: '#fafafa'
                      }}>
                        {/* Skeleton Position Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Skeleton style={{ height: '1.5rem', width: '4rem' }} />
                            <Skeleton style={{ height: '1rem', width: '6rem' }} />
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Skeleton style={{ height: '2rem', width: '4rem' }} />
                            <Skeleton style={{ height: '2rem', width: '4rem' }} />
                          </div>
                        </div>

                        {/* Skeleton CTA Preview */}
                        <div style={{ 
                          backgroundColor: '#192307',
                          padding: '1.5rem',
                          borderRadius: '0.5rem',
                          marginBottom: '1rem'
                        }}>
                          <Skeleton style={{ height: '0.875rem', width: '6rem', marginBottom: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <Skeleton style={{ height: '3rem', width: '3rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                            <div style={{ flex: 1 }}>
                              <Skeleton style={{ height: '1.25rem', width: '100%', marginBottom: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                              <Skeleton style={{ height: '1rem', width: '90%', marginBottom: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                              <Skeleton style={{ height: '2.5rem', width: '6rem', backgroundColor: 'rgba(189, 245, 72, 0.3)' }} />
                            </div>
                          </div>
                        </div>

                        {/* Skeleton Code Sections */}
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          <div>
                            <Skeleton style={{ height: '0.75rem', width: '8rem', marginBottom: '0.5rem' }} />
                            <Skeleton style={{ height: '4rem', width: '100%' }} />
                          </div>
                          <div>
                            <Skeleton style={{ height: '0.75rem', width: '6rem', marginBottom: '0.5rem' }} />
                            <Skeleton style={{ height: '3rem', width: '100%' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated CTAs Display */}
              {generatedCTAs && !showCtaSkeletons && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    margin: '0 0 1.5rem 0', 
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <CheckCircle size={14} style={{ color: '#16a34a' }} />
                    Generated CTAs
                  </h4>

                  {/* CTA Variants Display */}
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {Object.entries(generatedCTAs.cta_variants).map(([position, ctaData]) => (
                      <div key={position} style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        backgroundColor: '#fafafa'
                      }}>
                        {/* Position Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: position === 'beginning' ? '#dbeafe' : position === 'middle' ? '#fef3c7' : '#dcfce7',
                            color: position === 'beginning' ? '#1e40af' : position === 'middle' ? '#b45309' : '#16a34a',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {position === 'end' ? 'ending' : position}
                          </div>
                        </div>

                        {/* CTA Preview - Apollo Design */}
                        <div style={{ 
                          backgroundColor: '#192307',
                          padding: '1.5rem',
                          borderRadius: '0.875rem',
                          marginBottom: '1rem',
                          position: 'relative'
                        }}>
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

                          {/* Content Layout with Logo */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            {/* Apollo Logo */}
                            <div style={{
                              width: '3rem',
                              height: '3rem',
                              borderRadius: '0.75rem',
                              overflow: 'hidden',
                              flexShrink: 0
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
                              {/* Category Header */}
                              <div style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '600', 
                                color: '#ffffff',
                                marginBottom: '0.5rem',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase'
                              }}>
                                {ctaData.cta.category_header}
                              </div>
                              
                              <h4 style={{ 
                                fontSize: '1.125rem', 
                                fontWeight: '700', 
                                color: '#ffffff',
                                margin: '0 0 0.75rem 0',
                                lineHeight: '1.3'
                              }}>
                                {ctaData.cta.headline}
                              </h4>

                              <p style={{ 
                                fontSize: '0.875rem', 
                                color: '#ffffff',
                                lineHeight: '1.6',
                                margin: '0 0 1rem 0',
                                opacity: 0.9
                              }}>
                                {ctaData.cta.description}
                              </p>

                              {/* CTA Button */}
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#BDF548',
                                color: '#192307',
                                borderRadius: '0.625rem',
                                fontSize: '0.875rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(189, 245, 72, 0.3)'
                              }}>
                                {ctaData.cta.action_button.replace(/\s*→\s*$/, '')}
                                <span style={{ fontSize: '1rem' }}>→</span>
                              </div>
                            </div>
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

                        {/* Copy Shortcode Button */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem' 
                        }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151' }}>
                            Styled HTML Code:
                          </div>
                <button
                            onClick={() => copyCtaToClipboard(getStyledCtaHtml(position as 'beginning' | 'middle' | 'end'), `${position}_shortcode`)}
                  style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: ctaCopySuccess === `${position}_shortcode` ? '#dcfce7' : '#6b7280',
                              color: ctaCopySuccess === `${position}_shortcode` ? '#16a34a' : 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {ctaCopySuccess === `${position}_shortcode` ? (
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
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.625rem',
                          fontFamily: 'monospace',
                          color: '#374151',
                          whiteSpace: 'pre-wrap',
                          border: '1px solid #e5e7eb',
                          maxHeight: '8rem',
                          overflow: 'auto'
                        }}>
                          {getStyledCtaHtml(position as 'beginning' | 'middle' | 'end')}
                        </div>

                        {/* URL Preview */}
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#374151',
                            marginBottom: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            🔗 Sign-up URL:
                          </div>
                          <div style={{
                            backgroundColor: '#eff6ff',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.625rem',
                            fontFamily: 'monospace',
                            color: '#1e40af',
                            border: '1px solid #bfdbfe',
                            wordBreak: 'break-all'
                          }}>
                            {generateApolloSignUpUrl(keywordRow.keyword, position)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>


                </div>
              )}
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

                  {/* Publish to CMS Button */}
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
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                  >
                    <Globe size={14} />
                    Publish to CMS
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
                    onClick={openGoogleDocs}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#84ADEA',
                      color: 'black',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '2.75rem', // Touch-friendly
                      minWidth: '12.5rem',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#6b96e8';
                      e.currentTarget.style.color = 'black';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#84ADEA';
                      e.currentTarget.style.color = 'black';
                    }}
                  >
                    <img 
                      src="/google-docs-logo.png" 
                      alt="Google Docs"
                      style={{
                        width: '1rem',
                        height: '1rem',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        // Fallback to ExternalLink icon if logo fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const icon = document.createElement('div');
                          icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 7 10 10-5 0 0-5"/><path d="m17 7-10 10"/></svg>';
                          icon.style.display = 'flex';
                          icon.style.alignItems = 'center';
                          icon.style.justifyContent = 'center';
                          parent.insertBefore(icon, target);
                        }
                      }}
                    />
                    Google Docs
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={openGoogleSheets}
                      className="content-modal-btn"
                      disabled={isOpeningSheets}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: isOpeningSheets ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: '2.75rem', // Touch-friendly
                        minWidth: '12.5rem',
                        justifyContent: 'center',
                        opacity: isOpeningSheets ? 0.6 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!isOpeningSheets) {
                          e.currentTarget.style.backgroundColor = '#15803d';
                          e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isOpeningSheets) {
                          e.currentTarget.style.backgroundColor = '#16a34a';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {isOpeningSheets ? (
                        <Clock className="animate-spin" size={14} />
                      ) : (
                        <Table size={14} />
                      )}
                      {isOpeningSheets ? 'Logging to Sheets...' : 'Open in Google Sheets'}
                    </button>
                    
                    {/* Success message */}
                    {showSheetsMessage && (
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
                        {sheetsSuccessMessage}
                      </div>
                    )}
                  </div>

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
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#4b5563';
                        e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#6b7280';
                        e.currentTarget.style.transform = 'translateY(0)';
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
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Meta SEO Title:</strong>
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
                          <div style={{ 
                            padding: '0.75rem', 
                            backgroundColor: '#f9fafb', 
                            borderRadius: '0.375rem', 
                            border: '1px solid #e5e7eb', 
                            wordWrap: 'break-word', 
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5'
                          }}>
                            {metaSeoTitle}
                          </div>
                        </div>
                      )}
                      {metaDescription && (
                        <div style={{ marginBottom: '1rem', position: 'relative' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Meta Description:</strong>
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
                          <div style={{ 
                            padding: '0.75rem', 
                            backgroundColor: '#f9fafb', 
                            borderRadius: '0.375rem', 
                            border: '1px solid #e5e7eb', 
                            wordWrap: 'break-word', 
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5'
                          }}>
                            {metaDescription}
                          </div>
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
                    <div style={{ position: 'relative' }}>
                      {/* CTA Insertion Toolbar */}
                      {generatedCTAs && (
                        <div style={{
                          marginBottom: '1rem',
                          padding: '1rem',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '0.5rem'
                        }}>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#16a34a',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <Target size={16} />
                            Insert CTA at Cursor Position
                          </div>
                          
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#374151',
                            marginBottom: '0.75rem',
                            fontStyle: 'italic'
                          }}>
                            Click in the text editor where you want to insert a CTA, then click one of the buttons below:
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {Object.entries(generatedCTAs.cta_variants).map(([position, ctaData]) => (
                              <button
                                key={position}
                                onClick={() => insertCTAAtCursor(position as 'beginning' | 'middle' | 'end')}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: ctaCopySuccess === `${position}_inserted` ? '#dcfce7' : (position === 'beginning' ? '#dbeafe' : position === 'middle' ? '#fef3c7' : '#dcfce7'),
                                  color: ctaCopySuccess === `${position}_inserted` ? '#16a34a' : (position === 'beginning' ? '#1e40af' : position === 'middle' ? '#b45309' : '#16a34a'),
                                  border: `1px solid ${ctaCopySuccess === `${position}_inserted` ? '#bbf7d0' : (position === 'beginning' ? '#93c5fd' : position === 'middle' ? '#fcd34d' : '#bbf7d0')}`,
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  textTransform: 'uppercase',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                title={`Insert ${position} CTA: ${ctaData.cta.headline}`}
                              >
                                {ctaCopySuccess === `${position}_inserted` ? (
                                  <>
                                    <CheckCircle size={12} />
                                    Inserted!
                                  </>
                                ) : (
                                  <>
                                    <Target size={12} />
                                    Insert {position === 'end' ? 'ending' : position} CTA
                                  </>
                                )}
                              </button>
                            ))}
                            
                            {/* CTA Count Display */}
                            {countInsertedCTAs() > 0 && (
                              <div style={{
                                padding: '0.5rem 0.75rem',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#16a34a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem'
                              }}>
                                <CheckCircle size={12} />
                                {countInsertedCTAs()} CTA{countInsertedCTAs() !== 1 ? 's' : ''} inserted
                              </div>
                            )}
                          </div>

                          {/* Content Management Controls */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            marginTop: '0.75rem', 
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #e5e7eb',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                          }}>
                            {/* Clear All CTAs Button */}
                            <button
                              onClick={clearAllCTAs}
                              disabled={countInsertedCTAs() === 0}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: countInsertedCTAs() > 0 ? '#fee2e2' : '#f3f4f6',
                                color: countInsertedCTAs() > 0 ? '#dc2626' : '#9ca3af',
                                border: `1px solid ${countInsertedCTAs() > 0 ? '#fecaca' : '#d1d5db'}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: countInsertedCTAs() > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                if (countInsertedCTAs() > 0) {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.backgroundColor = '#fecaca';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (countInsertedCTAs() > 0) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.backgroundColor = '#fee2e2';
                                }
                              }}
                              title={countInsertedCTAs() > 0 ? 'Remove all inserted CTAs' : 'No CTAs to clear'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                              Clear All CTAs
                            </button>

                            {/* Undo Button */}
                            <button
                              onClick={undoChange}
                              disabled={historyIndex <= 0}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: historyIndex > 0 ? '#eff6ff' : '#f3f4f6',
                                color: historyIndex > 0 ? '#2563eb' : '#9ca3af',
                                border: `1px solid ${historyIndex > 0 ? '#bfdbfe' : '#d1d5db'}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                if (historyIndex > 0) {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.backgroundColor = '#dbeafe';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (historyIndex > 0) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.backgroundColor = '#eff6ff';
                                }
                              }}
                              title={historyIndex > 0 ? 'Undo last change' : 'Nothing to undo'}
                            >
                              <RotateCcw size={12} />
                              Undo
                            </button>

                            {/* Redo Button */}
                            <button
                              onClick={redoChange}
                              disabled={historyIndex >= editHistory.length - 1}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: historyIndex < editHistory.length - 1 ? '#f0f9ff' : '#f3f4f6',
                                color: historyIndex < editHistory.length - 1 ? '#0ea5e9' : '#9ca3af',
                                border: `1px solid ${historyIndex < editHistory.length - 1 ? '#bae6fd' : '#d1d5db'}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: historyIndex < editHistory.length - 1 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                if (historyIndex < editHistory.length - 1) {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.backgroundColor = '#e0f2fe';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (historyIndex < editHistory.length - 1) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                                }
                              }}
                              title={historyIndex < editHistory.length - 1 ? 'Redo last undone change' : 'Nothing to redo'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" transform="scale(-1, 1)">
                                <path d="M1 4v6h6"/>
                                <path d="m1 10 18-5v12"/>
                              </svg>
                              Redo
                            </button>
                          </div>

                                                        <div style={{ 
                                fontSize: '0.625rem', 
                                color: '#6b7280',
                                marginTop: '0.5rem',
                                fontStyle: 'italic'
                              }}>
                                💡 CTAs will be inserted as fully styled Apollo components with immediate visual feedback.
                                <br />
                                🔗 Links will point to: apollo.io/sign-up with UTM tracking
                              </div>
                        </div>
                      )}

                    <textarea
                      ref={editableContentRef}
                      value={editableContent}
                      onChange={(e) => {
                        setEditableContent(e.target.value);
                        
                        // Auto-save edited content with debouncing
                        if (autoSaveTimeout) {
                          clearTimeout(autoSaveTimeout);
                        }
                        const timeout = setTimeout(() => {
                          autoSaveContent(e.target.value, metaSeoTitle, metaDescription);
                        }, 1000);
                        setAutoSaveTimeout(timeout);

                        // Save to history with debouncing (longer delay for history)
                        if (historySaveTimeout) {
                          clearTimeout(historySaveTimeout);
                        }
                        const historyTimeout = setTimeout(() => {
                          saveToHistory(e.target.value);
                        }, 2000); // 2 second delay for history saves
                        setHistorySaveTimeout(historyTimeout);
                      }}
                        placeholder="Edit your content here... Click where you want to insert a CTA, then use the buttons above."
                      style={{
                        width: '100%',
                        minHeight: '37.5rem',
                        padding: '1rem 1.25rem',
                          border: generatedCTAs ? '0.125rem solid #16a34a' : '0.125rem solid #f59e0b',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                          backgroundColor: generatedCTAs ? '#f0fdf4' : '#fffbf5',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: '1.6',
                        color: '#374151'
                      }}
                        onFocus={(e) => e.target.style.borderColor = generatedCTAs ? '#059669' : '#d97706'}
                        onBlur={(e) => e.target.style.borderColor = generatedCTAs ? '#16a34a' : '#f59e0b'}
                    />
                    
                    {/* Bottom CTA Controls - Duplicate of Top Controls */}
                    {generatedCTAs && (
                        <div style={{ 
                          padding: '1rem',
                          marginTop: '1rem',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '0.5rem'
                        }}>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#16a34a',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <Target size={16} />
                            Insert CTA at Cursor Position
                          </div>
                          
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#374151',
                            marginBottom: '0.75rem',
                            fontStyle: 'italic'
                          }}>
                            Click in the text editor where you want to insert a CTA, then click one of the buttons below:
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {Object.entries(generatedCTAs.cta_variants).map(([position, ctaData]) => (
                              <button
                                key={position}
                                onClick={() => insertCTAAtCursor(position as 'beginning' | 'middle' | 'end')}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: ctaCopySuccess === `${position}_inserted` ? '#dcfce7' : (position === 'beginning' ? '#dbeafe' : position === 'middle' ? '#fef3c7' : '#dcfce7'),
                                  color: ctaCopySuccess === `${position}_inserted` ? '#16a34a' : (position === 'beginning' ? '#1e40af' : position === 'middle' ? '#b45309' : '#16a34a'),
                                  border: `1px solid ${ctaCopySuccess === `${position}_inserted` ? '#bbf7d0' : (position === 'beginning' ? '#93c5fd' : position === 'middle' ? '#fcd34d' : '#bbf7d0')}`,
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  textTransform: 'uppercase',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                title={`Insert ${position} CTA: ${ctaData.cta.headline}`}
                              >
                                {ctaCopySuccess === `${position}_inserted` ? (
                                  <>
                                    <CheckCircle size={12} />
                                    Inserted!
                                  </>
                                ) : (
                                  <>
                                    <Target size={12} />
                                    Insert {position === 'end' ? 'ending' : position} CTA
                                  </>
                                )}
                              </button>
                            ))}
                            
                            {/* CTA Count Display */}
                            {countInsertedCTAs() > 0 && (
                              <div style={{
                                padding: '0.5rem 0.75rem',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#16a34a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem'
                              }}>
                                <CheckCircle size={12} />
                                {countInsertedCTAs()} CTA{countInsertedCTAs() !== 1 ? 's' : ''} inserted
                              </div>
                            )}
                          </div>

                          {/* Content Management Controls */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            marginTop: '0.75rem', 
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #e5e7eb',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                          }}>
                            {/* Clear All CTAs Button */}
                            <button
                              onClick={clearAllCTAs}
                              disabled={countInsertedCTAs() === 0}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: countInsertedCTAs() > 0 ? '#fee2e2' : '#f3f4f6',
                                color: countInsertedCTAs() > 0 ? '#dc2626' : '#9ca3af',
                                border: `1px solid ${countInsertedCTAs() > 0 ? '#fecaca' : '#d1d5db'}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: countInsertedCTAs() > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                if (countInsertedCTAs() > 0) {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.backgroundColor = '#fecaca';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (countInsertedCTAs() > 0) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.backgroundColor = '#fee2e2';
                                }
                              }}
                              title={countInsertedCTAs() > 0 ? 'Remove all inserted CTAs' : 'No CTAs to clear'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                              Clear All CTAs
                            </button>

                            {/* Undo Button */}
                            <button
                              onClick={undoChange}
                              disabled={historyIndex <= 0}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: historyIndex > 0 ? '#eff6ff' : '#f3f4f6',
                                color: historyIndex > 0 ? '#2563eb' : '#9ca3af',
                                border: `1px solid ${historyIndex > 0 ? '#bfdbfe' : '#d1d5db'}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                if (historyIndex > 0) {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.backgroundColor = '#dbeafe';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (historyIndex > 0) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.backgroundColor = '#eff6ff';
                                }
                              }}
                              title={historyIndex > 0 ? 'Undo last change' : 'Nothing to undo'}
                            >
                              <RotateCcw size={12} />
                              Undo
                            </button>

                            {/* Redo Button */}
                            <button
                              onClick={redoChange}
                              disabled={historyIndex >= editHistory.length - 1}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: historyIndex < editHistory.length - 1 ? '#f0f9ff' : '#f3f4f6',
                                color: historyIndex < editHistory.length - 1 ? '#0ea5e9' : '#9ca3af',
                                border: `1px solid ${historyIndex < editHistory.length - 1 ? '#bae6fd' : '#d1d5db'}`,
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: historyIndex < editHistory.length - 1 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                if (historyIndex < editHistory.length - 1) {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.backgroundColor = '#e0f2fe';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (historyIndex < editHistory.length - 1) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                                }
                              }}
                              title={historyIndex < editHistory.length - 1 ? 'Redo last undone change' : 'Nothing to redo'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" transform="scale(-1, 1)">
                                <path d="M1 4v6h6"/>
                                <path d="m1 10 18-5v12"/>
                              </svg>
                              Redo
                            </button>
                          </div>

                          <div style={{ 
                            fontSize: '0.625rem', 
                            color: '#6b7280',
                            marginTop: '0.5rem',
                            fontStyle: 'italic'
                          }}>
                            💡 CTAs will be inserted as fully styled Apollo components with immediate visual feedback.
                            <br />
                            🔗 Links will point to: apollo.io/sign-up with UTM tracking
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      ref={contentDisplayRef}
                      dangerouslySetInnerHTML={{ __html: getDisplayContent() }} 
                      key={`display-${isEditingContent}-${editableContent.length}`} 
                    />
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

              {/* Bottom Action Buttons - Duplicate for convenience */}
              {generatedContent && (
                <div style={{ 
                  marginTop: '2rem',
                  paddingTop: '1rem',
                  borderTop: '0.0625rem solid #e5e7eb'
                }}>
                  <div className="content-action-buttons" style={{ 
                    display: 'flex', 
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap', // Stack on mobile
                    justifyContent: 'center' // Center the buttons
                  }}>
                    {/* Edit/Save Button */}
                    <button
                      onClick={toggleEditMode}
                      className="mobile-hide-edit"
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
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = isEditingContent ? '#059669' : '#d97706';
                        e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = isEditingContent ? '#10b981' : '#f59e0b';
                        e.currentTarget.style.transform = 'translateY(0)';
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

                    <button
                      onClick={() => setShowCMSModal(true)}
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
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                    >
                      <Globe size={14} />
                      Publish to CMS
                    </button>

                    {/* Open in HTML Button */}
                    <button
                      onClick={openInHTML}
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
                      onClick={openGoogleDocs}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#84ADEA',
                        color: 'black',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: '2.75rem',
                        minWidth: '12.5rem',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#6b96e8';
                        e.currentTarget.style.color = 'black';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#84ADEA';
                        e.currentTarget.style.color = 'black';
                      }}
                    >
                      <img 
                        src="/google-docs-logo.png" 
                        alt="Google Docs"
                        style={{
                          width: '1rem',
                          height: '1rem',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          // Fallback to ExternalLink icon if logo fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const icon = document.createElement('div');
                            icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 7 10 10-5 0 0-5"/><path d="m17 7-10 10"/></svg>';
                            icon.style.display = 'flex';
                            icon.style.alignItems = 'center';
                            icon.style.justifyContent = 'center';
                            parent.insertBefore(icon, target);
                          }
                        }}
                      />
                      Google Docs
                    </button>

                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={openGoogleSheets}
                        disabled={isOpeningSheets}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: isOpeningSheets ? '#9ca3af' : '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: isOpeningSheets ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          minHeight: '2.75rem',
                          minWidth: '12.5rem',
                          justifyContent: 'center',
                          opacity: isOpeningSheets ? 0.6 : 1
                        }}
                        onMouseOver={(e) => {
                          if (!isOpeningSheets) {
                            e.currentTarget.style.backgroundColor = '#15803d';
                            e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isOpeningSheets) {
                            e.currentTarget.style.backgroundColor = '#16a34a';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {isOpeningSheets ? (
                          <Clock className="animate-spin" size={14} />
                        ) : (
                          <Table size={14} />
                        )}
                        {isOpeningSheets ? 'Logging to Sheets...' : 'Open in Google Sheets'}
                      </button>
                      
                      {/* Success message */}
                      {showSheetsMessage && (
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
                          {sheetsSuccessMessage}
                        </div>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={copyToClipboard}
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
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                      
                      {/* Copied message */}
                      {showCopiedMessage && (
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
                  </div>

                  {/* Clear Button - Full width on mobile */}
                  <button
                    onClick={clearGeneratedContent}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#fef2f2',
                      border: '0.0625rem solid #fecaca',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#dc2626',
                      transition: 'all 0.2s ease',
                      minHeight: '2.75rem',
                      width: '100%',
                      justifyContent: 'center'
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

      {/* Mobile backdrop for variables menu */}
      {showVariablesMenu && window.innerWidth <= 768 && (
        <div 
          className="mobile-modal-backdrop"
          onClick={() => setShowVariablesMenu(false)}
        />
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

      {/* Link Hover Controls */}
      <LinkHoverControls
        targetLink={targetLink}
        onRemoveLink={removeLink}
        onOpenLink={openLink}
      />
    </>
  );
};

export default BlogContentActionModal; 