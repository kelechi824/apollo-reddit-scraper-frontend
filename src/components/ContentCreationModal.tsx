import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Download, ExternalLink, Globe, ChevronDown, Search, Clock, CheckCircle, Copy, Check, Table } from 'lucide-react';
import { AnalyzedPost, BrandKit, ContentCreationRequest } from '../types';
import googleDocsService from '../services/googleDocsService';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import { makeApiRequest } from '../utils/apiHelpers';

interface ContentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: AnalyzedPost;
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
 * ContentCreationModal Component
 * Why this matters: Generates SEO-optimized content using Reddit insights and brand kit context
 * for consistent, high-quality content creation that ranks well on AI-powered search engines.
 */
const ContentCreationModal: React.FC<ContentCreationModalProps> = ({ isOpen, onClose, post }) => {
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
  
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const userPromptRef = useRef<HTMLTextAreaElement>(null);
  const variablesMenuRef = useRef<HTMLDivElement>(null);
  const systemVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const userVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const generationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const editableContentRef = useRef<HTMLTextAreaElement>(null);

  // Generation progress messages
  const generationMessages = [
    'Analyzing prompts...',
    'Optimizing for AEO/LLM SEO...',
    'Formatting content...',
    'Creating awesomeness...',
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

      /* Sub-heading pattern: bold text followed by paragraphs */
      .generated-content-display h2 + strong,
      .generated-content-display h2 + b,
      .generated-content-display h2 + bold {
        display: block;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 1.5rem 0 0.75rem 0;
        line-height: 1.4;
      }

      .generated-content-display strong + p,
      .generated-content-display b + p,
      .generated-content-display bold + p {
        margin-top: 0.5rem;
        margin-bottom: 1rem;
        line-height: 1.6;
      }

      .generated-content-display p + strong,
      .generated-content-display p + b,
      .generated-content-display p + bold {
        display: block;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 1.25rem 0 0.75rem 0;
        line-height: 1.4;
      }

      /* Specific styling for bold elements that act as sub-headings */
      .generated-content-display bold {
        font-weight: 600;
        color: #1f2937;
      }

      .generated-content-display a {
        color: #3b82f6;
        text-decoration: underline;
        font-weight: 500;
      }

      .generated-content-display a:hover {
        color: #1d4ed8;
      }

      .generated-content-display blockquote {
        border-left: 0.25rem solid #3b82f6;
        padding-left: 1rem;
        margin: 1.5rem 0;
        font-style: italic;
        background-color: #f8fafc;
        padding: 1rem 1rem 1rem 1.5rem;
        border-radius: 0.375rem;
      }

      .generated-content-display table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        border: 0.0625rem solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 0.0625 0.1875rem rgba(0, 0, 0, 0.1);
      }

      .generated-content-display th {
        background-color: #f9fafb;
        padding: 0.875rem 1rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.875rem;
        color: #374151;
        border-bottom: 0.0625rem solid #e5e7eb;
        border-right: 0.0625rem solid #e5e7eb;
      }

      .generated-content-display th:last-child {
        border-right: none;
      }

      .generated-content-display td {
        padding: 0.875rem 1rem;
        border-bottom: 0.0625rem solid #f3f4f6;
        border-right: 0.0625rem solid #f3f4f6;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #374151;
      }

      .generated-content-display td:last-child {
        border-right: none;
      }

      .generated-content-display tr:last-child td {
        border-bottom: none;
      }

      .generated-content-display tr:hover {
        background-color: #f9fafb;
      }

      .generated-content-display div[style*="border"] {
        border: 0.0625rem solid #e5e7eb !important;
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
        background-color: #f8fafc;
      }

      .generated-content-display div[style*="red"] {
        border: 0.0625rem solid #e5e7eb !important;
        background-color: #f8fafc !important;
      }

      .generated-content-display [style*="color: red"],
      .generated-content-display [style*="color:red"] {
        color: #374151 !important;
      }

      .generated-content-display section,
      .generated-content-display .section {
        margin: 1.5rem 0;
        padding: 1rem;
        border: 0.0625rem solid #e5e7eb;
        border-radius: 0.5rem;
        background-color: #f8fafc;
      }

      .generated-content-display .framework,
      .generated-content-display .strategy {
        margin: 1.5rem 0;
        padding: 1.5rem;
        border: 0.0625rem solid #dbeafe;
        border-radius: 0.75rem;
        background-color: #eff6ff;
        border-left: 0.25rem solid #3b82f6;
      }

      /* Override any problematic inline styles */
      .generated-content-display * {
        max-width: 100%;
      }

      .generated-content-display div {
        margin: 0.5rem 0;
      }

      .generated-content-display div:has(> p:only-child) {
        margin: 0;
      }

      /* Fix any red borders or colors that might appear */
      .generated-content-display [style*="border: 0.0625rem solid red"],
      .generated-content-display [style*="border:0.0625rem solid red"] {
        border: 0.0625rem solid #e5e7eb !important;
      }

      /* Ensure proper spacing for content blocks */
      .generated-content-display > div:first-child {
        margin-top: 0;
      }

      .generated-content-display > div:last-child {
        margin-bottom: 0;
      }

      .animate-spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      /* Mobile-specific styles for content creation modal */
      @media (max-width: 48rem) {
        .content-modal-header {
          padding: 1rem !important;
        }
        
        .content-modal-header h2 {
          font-size: 1rem !important;
        }
        
        .content-modal-header p {
          font-size: 0.875rem !important;
          margin: 0.25rem 0 0 0 !important;
        }
        
        .content-modal-panel {
          padding: 1rem !important;
        }
        
        .content-modal-layout {
          flex-direction: column !important;
        }
        
        .content-modal-btn {
          padding: 0.75rem 1rem !important;
          font-size: 0.875rem !important;
          min-height: 2.75rem !important;
        }

        /* Variables menu mobile popup modal */
        .content-variables-menu {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          width: 90vw !important;
          max-width: 25rem !important;
          height: 80vh !important;
          max-height: 37.5rem !important;
          z-index: 10001 !important;
        }

        /* Generated content mobile modal */
        .content-generated-display {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          width: 95vw !important;
          height: 90vh !important;
          z-index: 10000 !important;
          background: white !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 1.5625rem 3.125rem -0.75rem rgba(0, 0, 0, 0.25) !important;
          overflow: hidden !important;
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

        /* Show mobile view button and hide desktop content */
        .mobile-view-content-btn {
          display: block !important;
        }

        .generated-content-display {
          display: none !important;
        }

                     /* Hide edit buttons on mobile */
             .mobile-hide-edit {
               display: none !important;
             }

             /* Hide placeholder content on mobile */
             .content-placeholder-section {
               display: none !important;
             }

             /* Reduce text area font size on mobile */
             .content-modal-layout textarea {
               font-size: 0.75rem !important;
             }

             .content-modal-layout textarea::placeholder {
               font-size: 0.75rem !important;
             }

        /* Adjust button containers when edit buttons are hidden */
        .content-modal-layout .content-action-buttons {
          gap: 1rem !important;
          justify-content: center !important;
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
   * Load brand kit and generate prompts when modal opens or post changes
   * Why this matters: Initializes content creation with user's brand context and specific Reddit analysis.
   */
  useEffect(() => {
    if (isOpen && post) {

      
      // Load saved generated content for this post or clear if none exists
      loadSavedGeneratedContent();
      setHasUserInput(false);
      setAutoSaveStatus(''); // Clear any previous auto-save status
      
      // Load brand kit from localStorage
      const loadBrandKit = () => {
        // Check draft first, then fallback to saved version (same as Brand Kit page)
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

      // Listen for localStorage changes to update brand kit in real-time
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'apollo_brand_kit' || e.key === 'apollo_brand_kit_draft') {
          loadBrandKit();
        }
      };

      // Also listen for custom storage events (for same-tab updates)
      const handleCustomStorageChange = () => {
        loadBrandKit();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('apollo-brand-kit-updated', handleCustomStorageChange);

      // Load saved prompts for this specific post or generate initial prompts
      loadOrGeneratePrompts();

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('apollo-brand-kit-updated', handleCustomStorageChange);
      };
    }
    
    // Return undefined when condition is not met
    return undefined;
  }, [isOpen, post]);

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
   * Handle generation progress animation
   * Why this matters: Cycles through different status messages to show AI processing stages.
   */
  useEffect(() => {
    if (isGenerating) {
      setGenerationStep(0);
      
      // Cycle through messages every 5 seconds
      generationTimerRef.current = setInterval(() => {
        setGenerationStep(prev => {
          const nextStep = prev + 1;
          // Stop at the last message
          if (nextStep >= generationMessages.length - 1) {
            if (generationTimerRef.current) {
              clearInterval(generationTimerRef.current);
            }
            return generationMessages.length - 1;
          }
          return nextStep;
        });
      }, 5000);
    } else {
      // Clear timer when generation stops
      if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
        generationTimerRef.current = null;
      }
      setGenerationStep(0);
    }

    // Cleanup on unmount
    return () => {
      if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
      }
    };
  }, [isGenerating, generationMessages.length]);

  /**
   * Auto-save prompts to localStorage with debouncing
   * Why this matters: Prevents users from losing their work when editing prompts, but only after they start typing.
   */
  useEffect(() => {
    if (isOpen && post && hasUserInput) {
      // Clear existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      // Set auto-save status to saving
      setAutoSaveStatus('saving');

      // Set new timeout for auto-save
      const timeout = setTimeout(() => {
        try {
          const promptsData = {
            systemPrompt,
            userPrompt,
            postId: post.id || post.title, // Use post ID or title as identifier
            timestamp: new Date().toISOString()
          };
          
          localStorage.setItem('apollo_content_prompts_draft', JSON.stringify(promptsData));
          
          setAutoSaveStatus('saved');
          
          // Clear the "saved" status after 2 seconds
          setTimeout(() => setAutoSaveStatus(''), 2000);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setAutoSaveStatus('');
        }
      }, 1000); // Save after 1 second of inactivity

      setAutoSaveTimeout(timeout);

      // Cleanup timeout on unmount
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }

    // Return undefined when condition is not met
    return undefined;
  }, [systemPrompt, userPrompt, isOpen, post, hasUserInput]);

  /**
   * Clear auto-save status when modal closes
   * Why this matters: Prevents stale auto-save indicators from persisting between modal sessions.
   */
  useEffect(() => {
    if (!isOpen) {
      setAutoSaveStatus('');
      setHasUserInput(false);
      // Clear any pending auto-save timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        setAutoSaveTimeout(null);
      }
    }
  }, [isOpen, autoSaveTimeout]);

  /**
   * Load saved generated content for this specific post
   * Why this matters: Restores previously generated content so users don't lose their work.
   */
  const loadSavedGeneratedContent = (): void => {
    try {
      const savedData = localStorage.getItem('apollo_generated_content');
      if (savedData) {
        const contentData = JSON.parse(savedData);
        const postId = post.id || post.title;
        
        // Check if we have saved content for this specific post
        if (contentData[postId]) {
          const savedContent = contentData[postId];
          if (typeof savedContent === 'string') {
            // Legacy format - just content
            setGeneratedContent(savedContent);
            setMetaSeoTitle('');
            setMetaDescription('');
          } else {
            // New format with separate fields
            setGeneratedContent(savedContent.content || '');
            setMetaSeoTitle(savedContent.metaSeoTitle || '');
            setMetaDescription(savedContent.metaDescription || '');
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error loading saved generated content:', error);
    }
    
    // If no saved content, clear the display
    setGeneratedContent('');
    setMetaSeoTitle('');
    setMetaDescription('');
  };

  /**
   * Save generated content for this specific post
   * Why this matters: Persists generated content so users can return to it later.
   */
  const saveGeneratedContent = (content: string, title: string = '', description: string = ''): void => {
    try {
      const postId = post.id || post.title;
      let contentData: Record<string, any> = {};
      
      // Load existing saved content
      const savedData = localStorage.getItem('apollo_generated_content');
      if (savedData) {
        contentData = JSON.parse(savedData);
      }
      
      // Update content for this specific post with new format
      contentData[postId] = {
        content,
        metaSeoTitle: title,
        metaDescription: description,
        timestamp: new Date().toISOString()
      };
      
      // Save back to localStorage
      localStorage.setItem('apollo_generated_content', JSON.stringify(contentData));
    } catch (error) {
      console.error('Error saving generated content:', error);
    }
  };

  /**
   * Load saved prompts or generate initial prompts
   * Why this matters: Restores user's previous work or creates fresh prompts for new posts.
   */
  const loadOrGeneratePrompts = (): void => {
    try {
      const savedData = localStorage.getItem('apollo_content_prompts_draft');
      if (savedData) {
        const { systemPrompt: savedSystemPrompt, userPrompt: savedUserPrompt, postId } = JSON.parse(savedData);
        
        // Check if saved prompts are for the current post
        if (postId === (post.id || post.title)) {
          setSystemPrompt(savedSystemPrompt);
          setUserPrompt(savedUserPrompt);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading saved prompts:', error);
    }
    
    // If no saved prompts or error, generate initial prompts
    generateInitialPrompts();
  };

  /**
   * Reset prompts to default values
   * Why this matters: Allows users to quickly restore the proven default prompts after experimenting with custom ones
   */
  const resetToDefaults = () => {
    generateInitialPrompts();
    setHasUserInput(true); // Trigger auto-save to persist the reset
  };

  /**
   * Generate system and user prompts with Reddit context
   * Why this matters: Creates targeted prompts that leverage both Reddit insights and brand positioning.
   */
  const generateInitialPrompts = () => {
    const currentYear = new Date().getFullYear();
    const systemPromptTemplate = `You are a world-class SEO, AEO, and LLM SEO content marketer for Apollo with knowledge on how to create and optimize content that gets cited and visibility on platforms like Google, AI Overviews, AI Mode, ChatGPT, Perplexity, Gemini, and AI IDE tools like Cursor, Windsurf, GitHub Copilot, and Claude. Write clear, actionable, and insightful content that reflects Apollo's innovative, data-driven, and customer-focused ethos. Maintain a confident, helpful tone that positions Apollo as the go-to solution for modern sales and marketing teams seeking efficiency and growth.

IMPORTANT: The current year is ${currentYear}. When referencing "current year," "this year," or discussing recent trends, always use ${currentYear}. Do not reference 2024 or earlier years as current.

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY clean HTML content without any markdown code blocks, explanatory text, or meta-commentary
- Do NOT include phrases like "Here's the content:" or HTML code block markers or closing explanations
- Do NOT provide analysis or explanations about the content structure after the HTML
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

    const userPromptTemplate = `Based on this Reddit analysis, create AEO-optimized content for ${currentYear}:

**Reddit Post Context:**

Title: ${post.title}

Content: ${post.content || 'No additional content'}

Pain Point: ${post.analysis.pain_point}

Content Opportunity: ${post.analysis.content_opportunity}

Audience Summary: ${post.analysis.audience_insight}

**Content Requirements (remember we are in ${currentYear}):**
1. Create an H1 title that directly addresses the pain point in question format
2. Write comprehensive content that provides definitive answers
3. Include practical examples and actionable insights
4. Use semantic HTML structure with proper heading hierarchy
5. Include relevant internal linking opportunities
6. Optimize for AI-powered search engines (ChatGPT, Perplexity, Gemini)
7. Ensure content is non-promotional and genuinely helpful
8. Include data points, statistics, or specific examples where relevant
9. Use {{ brand_kit.ideal_customer_profile }} to inject customer testimonials only one time within the body of the content where appropriate
10. Promote Apollo at the end of the article using our  {{ brand_kit.cta_text }}  {{ brand_kit.cta_destination }}. Open the CTA destination in a new tab (i.e., target_blank).
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
   * Generate content using AI service
   * Why this matters: Creates SEO-optimized content by combining Reddit insights with brand context.
   */
  const generateContent = async () => {
    if (!brandKit) {
      alert('Please configure your Brand Kit first in the Brand Kit page.');
      return;
    }

    // Load sitemap data from localStorage for internal linking
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
        console.log(`🗺️ [ContentCreationModal] Loaded ${allUrls.length} URLs from ${sitemaps.length} sitemaps for internal linking`);
      }
    } catch (error) {
      console.warn('Failed to load sitemap data:', error);
    }

    setIsGenerating(true);
    try {
      // Replace liquid variables in prompts
      const processedSystemPrompt = processLiquidVariables(systemPrompt, brandKit);
      const processedUserPrompt = processLiquidVariables(userPrompt, brandKit);

      const request: ContentCreationRequest = {
        post_context: {
          title: post.title,
          content: post.content || '',
          pain_point: post.analysis.pain_point,
          content_opportunity: post.analysis.content_opportunity,
          audience_summary: post.analysis.audience_insight
        },
        brand_kit: brandKit,
        sitemap_data: sitemapData || undefined,
        system_prompt: processedSystemPrompt,
        user_prompt: processedUserPrompt
      };

      // Use centralized API configuration
      // Why this matters: Ensures all deployments (Netlify, Vercel, local) use the correct backend URL
      
      // Call the content generation API
      const apiResult = await makeApiRequest(API_ENDPOINTS.generateContent, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!apiResult.success) {
        throw new Error(apiResult.error || apiResult.message || 'Failed to generate content');
      }

      const data = apiResult.data!;
      
      console.log('📥 FRONTEND - API Response Structure:', {
        contentType: Array.isArray(data.content) ? 'array' : typeof data.content,
        contentLength: Array.isArray(data.content) ? data.content.length : 'N/A',
        hasMetaTitle: !!data.metaSeoTitle,
        hasMetaDescription: !!data.metaDescription
      });
      
      // Handle the API response structure - content is an array, meta fields are separate
      let contentToUse = '';
      if (Array.isArray(data.content) && data.content.length > 0) {
        contentToUse = data.content[0]; // Use first content variation
        console.log('✅ Using first content variation from array');
      } else if (typeof data.content === 'string') {
        contentToUse = data.content;
        console.log('✅ Using string content directly');
      } else {
        console.error('❌ Invalid content format:', typeof data.content, data.content);
        throw new Error('Invalid content format received from API');
      }
      
      // Check if the content is still a JSON string that needs parsing
      let finalContent = contentToUse;
      let metaTitle = data.metaSeoTitle || '';
      let metaDesc = data.metaDescription || '';
      
      if (typeof contentToUse === 'string' && contentToUse.trim().startsWith('{') && contentToUse.trim().endsWith('}')) {
        try {
          console.log('🔍 Content appears to be JSON, attempting to parse...');
          const parsedContent = JSON.parse(contentToUse);
          if (parsedContent.content) {
            finalContent = parsedContent.content;
            metaTitle = parsedContent.metaSeoTitle || metaTitle;
            metaDesc = parsedContent.metaDescription || metaDesc;
            console.log('✅ Successfully parsed JSON content from response');
          }
        } catch (e) {
          console.log('⚠️ Failed to parse content as JSON, using as-is');
          // Keep original content if JSON parsing fails
        }
      }
      
      // Clean the content and use the extracted meta fields
      const cleanedContent = cleanAIContent(finalContent);
      
      setGeneratedContent(cleanedContent);
      setEditableContent(cleanedContent);
      setIsEditingContent(false);
      setMetaSeoTitle(metaTitle);
      setMetaDescription(metaDesc);
      saveGeneratedContent(cleanedContent, metaTitle, metaDesc);

    } catch (error) {
      console.error('Error generating content:', error);
      // Fallback content for demo purposes
      const fallbackContent = `
        <h1>How to Solve ${post.analysis.pain_point}?</h1>
        
        <p><strong>Quick Answer:</strong> The most effective approach to addressing ${post.analysis.pain_point} involves implementing a systematic approach that combines technology, process optimization, and strategic planning.</p>
        
        <h2>What Causes ${post.analysis.pain_point}?</h2>
        <p>Based on analysis of community discussions, the primary drivers include:</p>
        <ul>
          <li>Lack of proper tools and automation</li>
          <li>Inefficient processes and workflows</li>
          <li>Limited visibility into key metrics</li>
          <li>Disconnected systems and data silos</li>
        </ul>
        
        <h2>How Can Apollo Help Solve This Challenge?</h2>
        <p>${post.analysis.content_opportunity}</p>
        
        <h3>Key Benefits</h3>
        <ul>
          <li>Automated workflow optimization</li>
          <li>Real-time data visibility</li>
          <li>Integrated solution approach</li>
          <li>Measurable ROI improvement</li>
        </ul>
        
        <h2>Implementation Strategy</h2>
        <p>To effectively address this challenge:</p>
        <ol>
          <li><strong>Assessment:</strong> Evaluate current state and identify gaps</li>
          <li><strong>Planning:</strong> Develop a comprehensive implementation roadmap</li>
          <li><strong>Execution:</strong> Deploy solutions in phases</li>
          <li><strong>Optimization:</strong> Continuously monitor and improve performance</li>
        </ol>
        
        <h2>Measuring Success</h2>
        <p>Track these key metrics to ensure your solution is working:</p>
        <ul>
          <li>Time saved on manual processes</li>
          <li>Improvement in data accuracy</li>
          <li>Increase in team productivity</li>
          <li>Overall ROI and cost savings</li>
        </ul>
        
        <p><strong>Ready to get started?</strong> <a href="${brandKit?.ctaDestination || 'https://apollo.io'}">${brandKit?.ctaText || 'Try Apollo for free'}</a> and see how we can help solve your ${post.analysis.pain_point} challenges.</p>
      `;
      
      // Clean fallback content and generate meta fields
      const cleanedFallbackContent = cleanAIContent(fallbackContent);
      const fallbackMetaTitle = `How to Solve ${post.analysis.pain_point} in ${new Date().getFullYear()}`;
      const fallbackMetaDescription = `Discover proven strategies to address ${post.analysis.pain_point}. Learn how Apollo's comprehensive platform helps teams overcome challenges and achieve measurable results.`;
      
      setGeneratedContent(cleanedFallbackContent);
      setEditableContent(cleanedFallbackContent);
      setIsEditingContent(false);
      setMetaSeoTitle(fallbackMetaTitle);
      setMetaDescription(fallbackMetaDescription);
      saveGeneratedContent(cleanedFallbackContent, fallbackMetaTitle, fallbackMetaDescription);
    } finally {
      setIsGenerating(false);
      // Auto-scroll to top after content generation
      setTimeout(() => {
        scrollToTop();
      }, 100);
    }
  };

  /**
   * Parse AI response and extract JSON fields
   * Why this matters: Properly extracts content, metaSeoTitle, and metaDescription from AI JSON response.
   */
  const parseAIResponse = (responseText: string): { content: string; metaSeoTitle: string; metaDescription: string } => {
    // Ensure responseText is a string
    if (typeof responseText !== 'string') {
      console.error('parseAIResponse received non-string input:', typeof responseText, responseText);
      return {
        content: '',
        metaSeoTitle: '',
        metaDescription: ''
      };
    }
    
    try {
      // First, try to parse the entire response as JSON
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        // If that fails, try to extract JSON from within the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }

      // Check if we have the expected JSON structure
      if (parsed && typeof parsed === 'object' && parsed.content && parsed.metaSeoTitle && parsed.metaDescription) {
        console.log('✅ Successfully parsed JSON response:', {
          hasContent: !!parsed.content,
          hasTitle: !!parsed.metaSeoTitle,
          hasDescription: !!parsed.metaDescription
        });
        
        return {
          content: cleanAIContent(parsed.content),
          metaSeoTitle: parsed.metaSeoTitle || '',
          metaDescription: parsed.metaDescription || ''
        };
      }
    } catch (error) {
      console.log('❌ Failed to parse as JSON:', error);
    }

    console.log('⚠️ Falling back to legacy content parsing');
    // Fallback to legacy content cleaning
    return {
      content: cleanAIContent(responseText),
      metaSeoTitle: '',
      metaDescription: ''
    };
  };

  /**
   * Clean AI-generated content by removing unwanted commentary and formatting
   * Why this matters: Ensures clean HTML output by stripping AI meta-commentary and markdown formatting.
   */
  const cleanAIContent = (content: string): string => {
    // Ensure content is a string
    if (typeof content !== 'string') {
      console.error('cleanAIContent received non-string input:', typeof content, content);
      return '';
    }
    
    let cleaned = content;
    
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
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  };

  /**
   * Process liquid variables in text
   * Why this matters: Replaces liquid template variables with actual brand kit values.
   */
  const processLiquidVariables = (text: string, brandKit: BrandKit): string => {
    let processed = text;
    
    // Replace standard brand kit variables
    processed = processed.replace(/\{\{\s*brand_kit\.url\s*\}\}/g, brandKit.url);
    processed = processed.replace(/\{\{\s*brand_kit\.about_brand\s*\}\}/g, brandKit.aboutBrand);
    processed = processed.replace(/\{\{\s*brand_kit\.ideal_customer_profile\s*\}\}/g, brandKit.idealCustomerProfile);
    processed = processed.replace(/\{\{\s*brand_kit\.competitors\s*\}\}/g, brandKit.competitors);
    processed = processed.replace(/\{\{\s*brand_kit\.brand_point_of_view\s*\}\}/g, brandKit.brandPointOfView);
    processed = processed.replace(/\{\{\s*brand_kit\.author_persona\s*\}\}/g, brandKit.authorPersona);
    processed = processed.replace(/\{\{\s*brand_kit\.tone_of_voice\s*\}\}/g, brandKit.toneOfVoice);
    processed = processed.replace(/\{\{\s*brand_kit\.header_case_type\s*\}\}/g, brandKit.headerCaseType);
    processed = processed.replace(/\{\{\s*brand_kit\.writing_rules\s*\}\}/g, brandKit.writingRules);
    processed = processed.replace(/\{\{\s*brand_kit\.cta_text\s*\}\}/g, brandKit.ctaText);
    processed = processed.replace(/\{\{\s*brand_kit\.cta_destination\s*\}\}/g, brandKit.ctaDestination);
    
    // Replace custom variables
    Object.entries(brandKit.customVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*brand_kit\\.${key}\\s*\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    });
    
    return processed;
  };

  /**
   * Toggle edit mode for generated content
   * Why this matters: Allows users to edit the generated content before copying/publishing
   */
  const toggleEditMode = () => {
    if (isEditingContent) {
      // Save the edited content
      setGeneratedContent(editableContent);
      saveGeneratedContent(editableContent, metaSeoTitle, metaDescription);
    } else {
      // Enter edit mode - sync editable content with current content
      setEditableContent(generatedContent);
    }
    setIsEditingContent(!isEditingContent);
  };

  /**
   * Copy content to clipboard with enhanced formatting
   * Why this matters: Provides the best possible copy experience with rich text formatting preserved across different applications.
   */
  const copyToClipboard = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedContent;
    try {
      // Create a temporary div to render the HTML content with better styling
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentToCopy;
      
      // Apply inline styles to preserve formatting better
      tempDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#374151';
      
      // Style headings for better preservation
      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading) => {
        const element = heading as HTMLElement;
        element.style.fontWeight = 'bold';
        element.style.marginTop = '1.5em';
        element.style.marginBottom = '0.5em';
        if (heading.tagName === 'H1') {
          element.style.fontSize = '1.5em';
        } else if (heading.tagName === 'H2') {
          element.style.fontSize = '1.5em';
        } else if (heading.tagName === 'H3') {
          element.style.fontSize = '1.25em';
        }
      });
      
      // Style paragraphs
      const paragraphs = tempDiv.querySelectorAll('p');
      paragraphs.forEach((p) => {
        const element = p as HTMLElement;
        element.style.marginBottom = '1em';
      });
      
      // Style lists
      const lists = tempDiv.querySelectorAll('ul, ol');
      lists.forEach((list) => {
        const element = list as HTMLElement;
        element.style.marginBottom = '1em';
        element.style.paddingLeft = '1.5em';
      });
      
      // Style list items
      const listItems = tempDiv.querySelectorAll('li');
      listItems.forEach((li) => {
        const element = li as HTMLElement;
        element.style.marginBottom = '0.5em';
      });
      
      // Style strong/bold text
      const strongElements = tempDiv.querySelectorAll('strong, b');
      strongElements.forEach((strong) => {
        const element = strong as HTMLElement;
        element.style.fontWeight = 'bold';
      });
      
      document.body.appendChild(tempDiv);
      
      // Try modern clipboard API with both HTML and plain text
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          const htmlBlob = new Blob([tempDiv.outerHTML], { type: 'text/html' });
          const textBlob = new Blob([tempDiv.innerText], { type: 'text/plain' });
          
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': htmlBlob,
              'text/plain': textBlob
            })
          ]);
          
          // Clean up and show success
          document.body.removeChild(tempDiv);
          setShowCopiedMessage(true);
          setTimeout(() => setShowCopiedMessage(false), 2000);
          return;
        } catch (clipboardError) {
          console.log('Modern clipboard API failed, trying selection method');
        }
      }
      
      // Fallback to selection method
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Try to copy as rich text
      let copySuccess = false;
      try {
        copySuccess = document.execCommand('copy');
      } catch (execError) {
        console.log('execCommand copy failed');
      }
      
      // Clean up selection
      selection?.removeAllRanges();
      document.body.removeChild(tempDiv);
      
      // Final fallback to plain text if rich text copy failed
      if (!copySuccess) {
        const plainTextDiv = document.createElement('div');
        plainTextDiv.innerHTML = generatedContent;
        await navigator.clipboard.writeText(plainTextDiv.innerText);
      }
      
      // Show success feedback
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
      
    } catch (err) {
      console.error('Failed to copy content:', err);
      
      // Final fallback - copy plain text version
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generatedContent;
        await navigator.clipboard.writeText(tempDiv.innerText);
        
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      } catch (fallbackError) {
        console.error('All copy methods failed:', fallbackError);
        alert('Failed to copy content. Please select and copy manually.');
      }
    }
  };

  /**
   * Copy meta SEO title to clipboard with animation
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
   * Create new Google Doc with content
   * Why this matters: Creates a new Google Document pre-populated with the generated content.
   */
  const openGoogleDocs = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedContent;
    if (!contentToCopy) {
      alert('Please generate content first before creating a Google Doc.');
      return;
    }

    // Check if Client ID is available
    console.log('Google Client ID configured:', !!process.env.REACT_APP_GOOGLE_CLIENT_ID);

    // Check if Client ID is available
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      alert('Google Client ID not configured. Please check your .env file and restart the server.');
      return;
    }

    try {
      // Generate document title from post title
      const docTitle = `Apollo Content - ${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}`;
      
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
    <title>Raw HTML Source - ${metaSeoTitle || `Content for ${post.title}`}</title>
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
        
        .html-code {
            padding: 20px;
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
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
        <h1>🔍 Raw HTML Source Code</h1>
        <p>Generated content for: ${post.title}</p>
        <p>Subreddit: r/${post.subreddit} | Score: ${post.score}</p>
    </div>
    
    <div class="meta-info">
        <h3>SEO Metadata</h3>
        <div class="meta-field"><span class="meta-label">Title:</span> ${metaSeoTitle || 'No title generated'}</div>
        <div class="meta-field"><span class="meta-label">Description:</span> ${metaDescription || 'No description generated'}</div>
    </div>
    
    <div class="code-container">
        <div class="code-header">
            <span class="code-title">HTML Source Code</span>
            <button class="copy-btn" onclick="copyHtmlCode()">📋 Copy HTML</button>
        </div>
        
        <pre class="html-code" id="htmlCode">${contentToOpen.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
    
    <script>
        function copyHtmlCode() {
            const htmlCode = \`${contentToOpen.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
            navigator.clipboard.writeText(htmlCode).then(() => {
                const btn = document.querySelector('.copy-btn');
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                btn.style.backgroundColor = '#16a34a';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = '#0e639c';
                }, 2000);
            }).catch(() => {
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
      alert('Please allow popups to view the HTML source code.');
    }
  };

  /**
   * Open Google Sheets with content data
   * Why this matters: Provides data logging and tracking capabilities for content management.
   */
  const openGoogleSheets = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedContent;
    if (!contentToCopy) {
      alert('Please generate content first before logging to Google Sheets.');
      return;
    }

    // Check if Client ID is available
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      alert('Google Client ID not configured. Please check your .env file and restart the server.');
      return;
    }

    setIsOpeningSheets(true);
    try {
      // Generate the new metadata fields
      const generateUrlSlug = (postTitle: string): string => {
        return postTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .trim();
      };

      const determineSecondaryCategory = (postTitle: string, content: string): string => {
        const categories = [
          'Sales Automation', 'Lead Generation', 'Email Marketing', 'CRM', 'Prospecting',
          'Sales Development', 'Account Management', 'RevOps', 'Data Enrichment', 'Workflow Automation'
        ];
        
        const combinedText = `${postTitle} ${content}`.toLowerCase();
        
        for (const category of categories) {
          const keywords = category.toLowerCase().split(' ');
          if (keywords.some(keyword => combinedText.includes(keyword))) {
            return category;
          }
        }
        
        return 'Sales Automation'; // Default fallback
      };

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

      const urlSlug = generateUrlSlug(post.title);
      const secondaryCategory = determineSecondaryCategory(post.title, contentToCopy);
      const author = selectRandomAuthor();

      // Prepare blog content data for logging with new fields
      const blogData = {
        keyword: post.title, // Using post title instead of keyword
        metaSeoTitle: metaSeoTitle || `${post.title} - Complete Guide`,
        metaDescription: metaDescription || `Comprehensive guide about ${post.title} with expert insights and actionable tips.`,
        htmlContent: contentToCopy,
        urlSlug: urlSlug,
        secondaryCategory: secondaryCategory,
        author: author
      };

      // Log data to Reddit blog content spreadsheet and get URL
      const result = await googleDocsService.appendRedditBlogData(blogData);
      
      if (result.success) {
        // Show success message
        setSheetsSuccessMessage('Content logged to Google Sheets successfully!');
        setShowSheetsMessage(true);
        setTimeout(() => setShowSheetsMessage(false), 3000);
        
        // Open the spreadsheet in a new tab
        window.open(result.spreadsheetUrl, '_blank');
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
    
    // Clear saved generated content from localStorage
    try {
      const savedData = localStorage.getItem('apollo_generated_content');
      if (savedData) {
        const data = JSON.parse(savedData);
        const postId = post.id || post.title;
        if (data[postId]) {
          delete data[postId];
          localStorage.setItem('apollo_generated_content', JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Error clearing saved content:', error);
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
      console.log('📰 Publishing to CMS:', customCMSConfig);

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
   * Scroll to top of the modal
   * Why this matters: Helps users navigate back to top of long articles
   */
  const scrollToTop = () => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Handle viewing generated content on mobile
   * Why this matters: Shows generated content as a full-screen modal on mobile for better readability
   */
  const handleViewGeneratedContent = () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && generatedContent) {
      setShowGeneratedContentModal(true);
    }
  };

  /**
   * Handle scroll events to show/hide scroll to top button
   * Why this matters: Only shows the scroll button when user has scrolled down significantly
   */
  useEffect(() => {
    const handleScroll = () => {
      if (rightPanelRef.current) {
        const scrollTop = rightPanelRef.current.scrollTop;
        setShowScrollToTop(scrollTop > 300); // Show button after scrolling 18.75rem
      }
    };

    const rightPanel = rightPanelRef.current;
    if (rightPanel) {
      rightPanel.addEventListener('scroll', handleScroll);
      return () => rightPanel.removeEventListener('scroll', handleScroll);
    }
    
    // Return empty cleanup function if no event listener was added
    return () => {};
  }, []);

  /**
   * CMS Integration Modal Component
   * Why this matters: Provides interface for CMS publishing options without actual integration.
   */
  const CMSModal = () => {
    if (!showCMSModal) return null;

    const cmsOptions = [
      { 
        name: 'Webflow', 
        description: 'Publish directly to your Webflow site',
        logo: '/webflow-logo.png'
      },
      { 
        name: 'Strapi', 
        description: 'Add to your Strapi content library',
        logo: '/strapi-logo.png'
      },
      { 
        name: 'Contentful', 
        description: 'Create entry in Contentful space',
        logo: '/contenful-logo.png'
      },
      { 
        name: 'Sanity', 
        description: 'Publish to Sanity Studio',
        logo: '/sanity-logo.png'
      },
      { 
        name: 'WordPress', 
        description: 'Create WordPress post/page',
        logo: '/wordpress-logo.png'
      },
      { 
        name: 'Custom', 
        description: 'Configure your own API endpoint',
        logo: null
      }
    ];

    return (
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
          zIndex: 10001
        }}

      >
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Publish to CMS</h3>
            <button
              onClick={() => setShowCMSModal(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cmsOptions.map((cms) => (
              <div
                key={cms.name}
                style={{
          border: '0.0625rem solid #e5e7eb',
          borderRadius: '0.75rem',
                    padding: '1.25rem',
                cursor: 'pointer',
                    transition: 'all 0.2s ease',
                backgroundColor: 'white',
                    boxShadow: '0 0.0625 0.1875rem rgba(0, 0, 0, 0.05)'
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
                    e.currentTarget.style.transform = 'translateY(-0.0625)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '0 0.0625 0.1875rem rgba(0, 0, 0, 0.05)';
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
                            // Fallback to initials if logo fails to load
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
                          fontSize: '10.25rem',
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
    );
  };

  /**
   * Custom CMS Form Modal - Demo Integration
   * Why this matters: Allows configuration and testing of custom CMS publishing
   */
  const CustomCMSForm = () => {
    if (!showCustomCMSForm) return null;

    return (
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
          zIndex: 10001
        }}
      >
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
                <>
                  <div style={{ color: '#10b981', fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
                  <h4 style={{ color: '#111827', marginBottom: '1rem' }}>
                    Content Published Successfully!
                  </h4>
                  {publishResult.demo_mode && (
                    <div style={{ 
                      backgroundColor: '#fef3c7', 
                      border: '0.0625rem solid #f59e0b',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                      color: '#92400e'
                    }}>
                      🧪 Demo Mode: This is a simulation of the actual publishing process
                    </div>
                  )}
                  <div style={{ textAlign: 'left', fontSize: '0.875rem', color: '#6b7280' }}>
                    <p><strong>CMS:</strong> {publishResult.cms_type}</p>
                    <p><strong>Status:</strong> {publishResult.status}</p>
                    <p><strong>URL:</strong> <a href={publishResult.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>{publishResult.url}</a></p>
                    <p><strong>Post ID:</strong> {publishResult.post_id}</p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
                  <h4 style={{ color: '#111827', marginBottom: '1rem' }}>
                    Publication Failed
                  </h4>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    {publishResult.error}
                  </p>
                </>
              )}
              
              <button
                onClick={() => {
                  setShowCustomCMSForm(false);
                  setPublishResult(null);
                }}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
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
      </div>
    );
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
                Create Content With AI
              </h2>
              <p style={{ color: '#6b7280' }}>
                Generate AEO-optimized content from Reddit insights using Apollo's Brand Kit
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

          {/* Content */}
          <div className="content-modal-layout" style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            {/* Left Panel - Prompts */}
            <div className="content-modal-panel" style={{ 
              padding: '1.5rem', 
              overflowY: 'auto',
              borderRight: '0.0625rem solid #e5e7eb'
            }}
            >
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
                  placeholder="Provide specific instructions for content creation, including Reddit context and requirements..."
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

              {/* Generate Button */}
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
                  onClick={generateContent}
                  disabled={isGenerating || !brandKit}
                  className="apollo-btn-gradient"
                  style={{
                    opacity: isGenerating || !brandKit ? 0.6 : 1,
                    cursor: isGenerating || !brandKit ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Clock className="animate-spin" style={{width: '1rem', height: '1rem', marginRight: '0.5rem'}} />
                      {generationMessages[generationStep]}
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} style={{marginRight: '0.5rem'}} />
                      {generatedContent ? 'Regenerate Article' : 'Generate Article'}
                    </>
                  )}
                </button>
                {!brandKit && (
                  <p style={{ 
                    marginLeft: '1rem', 
                    color: '#ef4444', 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    margin: '0 0 0 1rem'
                  }}>
                    Please{' '}
                    <a
                      href="/brand-kit"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'underline',
                        fontWeight: '600'
                      }}
                    >
                      configure your Brand Kit
                    </a>
                    {' '}first
                  </p>
                )}
              </div>
            </div>

            {/* Right Panel - Generated Content */}
            <div ref={rightPanelRef} className="content-modal-panel" style={{ 
              position: 'relative',
              padding: '1.5rem',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="mobile-only-heading" style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0, marginBottom: '1rem' }}>Generated Content</h3>
                
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

              {/* Action Buttons Row */}
              {generatedContent && (
                <div className="content-action-buttons" style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap', // Allow wrapping on mobile
                  justifyContent: 'center' // Center the buttons
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
                      minHeight: '2.75rem', // Touch-friendly
                      minWidth: '7.5rem',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = isEditingContent ? '#059669' : '#d97706';
                      e.currentTarget.style.transform = 'translateY(-0.0625)';
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
                      minHeight: '2.75rem', // Touch-friendly
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
                      minHeight: '2.75rem', // Touch-friendly
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
                        minHeight: '2.75rem', // Touch-friendly
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

              {/* Mobile View Content Button */}
              {generatedContent && (
                <div className="mobile-view-content-btn" style={{ display: 'none', marginBottom: '1rem' }}>
                  <button
                    onClick={handleViewGeneratedContent}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem 1.5rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View Generated Content
                  </button>
                </div>
              )}

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
                              top: '2rem',
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
                              top: '2rem',
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
                  
                  {/* Bottom Action Buttons - Duplicate for convenience */}
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
                          e.currentTarget.style.transform = 'translateY(-0.0625)';
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
                          minHeight: '2.75rem',
                          minWidth: '12.5rem',
                          justifyContent: 'center'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#6b96e8';
                          e.currentTarget.style.color = 'black';
                          e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#84ADEA';
                          e.currentTarget.style.color = 'black';
                          e.currentTarget.style.transform = 'translateY(0)';
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
                          className="content-modal-btn"
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
                      Your generated content will appear here
                    </p>
                    <p style={{ margin: 0 }}>
                      Click "Generate Content" to create AEO-optimized content from Apollo's Brand Kit and Reddit insights
                    </p>
                    {!brandKit && (
                      <p style={{ marginTop: '1rem', color: '#ef4444', fontWeight: '500', margin: '1rem 0 0 0' }}>
                        Please configure your Brand Kit first in the{' '}
                        <a
                          href="/brand-kit"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'underline',
                            fontWeight: '600'
                          }}
                        >
                          Brand Kit page
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Scroll to Top Button */}
              {showScrollToTop && (
                <button
                  onClick={scrollToTop}
                  style={{
                    position: 'absolute',
                    bottom: '2rem',
                    right: '2rem',
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0.25rem 0.75rem rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.2s ease',
                    zIndex: 1000
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Scroll to top"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m18 15-6-6-6 6"/>
                  </svg>
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

      <CMSModal />
      {/* Mobile backdrop for variables menu */}
      {showVariablesMenu && window.innerWidth <= 768 && (
        <div 
          className="mobile-modal-backdrop"
          onClick={() => setShowVariablesMenu(false)}
        />
      )}

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

      {/* Mobile Generated Content Modal */}
      {showGeneratedContentModal && (
        <>
          <div 
            className="mobile-modal-backdrop"
            onClick={() => setShowGeneratedContentModal(false)}
          />
          <div className="content-generated-display" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '95vw',
            height: '90vh',
            zIndex: 10000,
            background: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1.5625rem 3.125rem -0.75rem rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Mobile Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '0.0625rem solid #e5e7eb',
              backgroundColor: '#fafafa'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: '#111827' }}>
                Generated Content
              </h3>
              <button
                onClick={() => setShowGeneratedContentModal(false)}
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
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ 
              flex: 1, 
              padding: '1.5rem', 
              overflowY: 'auto',
              backgroundColor: 'white'
            }}>
              {/* Meta SEO Fields */}
              {(metaSeoTitle || metaDescription) && (
                <div style={{ marginBottom: '2rem' }}>
                  {metaSeoTitle && (
                    <div style={{ marginBottom: '1rem' }}>
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
                    </div>
                  )}
                  {metaDescription && (
                    <div style={{ marginBottom: '1rem' }}>
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
                    </div>
                  )}
                  <hr style={{ border: 'none', borderTop: '0.0625rem solid #e5e7eb', margin: '1.5rem 0' }} />
                </div>
              )}

              {/* Content */}
              <div 
                style={{ 
                  display: 'block',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  lineHeight: '1.6',
                  color: '#374151'
                }}
                dangerouslySetInnerHTML={{ __html: generatedContent }} 
              />
            </div>

            {/* Mobile Modal Actions */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '0.0625rem solid #e5e7eb',
              backgroundColor: '#fafafa',
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  copyToClipboard();
                  setShowGeneratedContentModal(false);
                }}
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
                Copy Content
              </button>

              <button
                onClick={() => {
                  openGoogleDocs();
                  setShowGeneratedContentModal(false);
                }}
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
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6b96e8')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#84ADEA')}
              >
                <img 
                  src="/google-docs-logo.png" 
                  alt="Google Docs"
                  style={{
                    width: '1rem',
                    height: '1rem',
                    objectFit: 'contain'
                  }}
                />
                Google Docs
              </button>
            </div>
          </div>
        </>
      )}

      {/* Clear Confirmation Popup */}
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
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '25rem',
            width: '90%',
            boxShadow: '0 1.25rem 1.5625rem -5px rgba(0, 0, 0, 0.1), 0 0.625rem 0.625rem -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
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
              This will permanently delete the generated article, meta SEO title, and meta description. This action cannot be undone. Are you sure you want to continue?
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

      {/* Render CMS Modal */}
      <CMSModal />

      {/* Render Custom CMS Form */}
      <CustomCMSForm />
    </>
  );
};

export default ContentCreationModal; 