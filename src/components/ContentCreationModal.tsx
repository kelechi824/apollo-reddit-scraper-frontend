import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Download, ExternalLink, Globe, ChevronDown, Search, Clock, CheckCircle, Copy, Check } from 'lucide-react';
import { AnalyzedPost, BrandKit, ContentCreationRequest } from '../types';
import googleDocsService from '../services/googleDocsService';

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
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        zIndex: 10000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1.5rem 1.5rem 1rem 1.5rem',
        borderBottom: '1px solid #f3f4f6',
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
              border: '1px solid #e5e7eb',
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
                  border: '1px solid #e5e7eb',
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
                  border: '1px solid #e5e7eb',
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
        border-bottom: 2px solid #f3f4f6;
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
        border-left: 4px solid #3b82f6;
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
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .generated-content-display th {
        background-color: #f9fafb;
        padding: 0.875rem 1rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.875rem;
        color: #374151;
        border-bottom: 1px solid #e5e7eb;
        border-right: 1px solid #e5e7eb;
      }

      .generated-content-display th:last-child {
        border-right: none;
      }

      .generated-content-display td {
        padding: 0.875rem 1rem;
        border-bottom: 1px solid #f3f4f6;
        border-right: 1px solid #f3f4f6;
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
        border: 1px solid #e5e7eb !important;
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
        background-color: #f8fafc;
      }

      .generated-content-display div[style*="red"] {
        border: 1px solid #e5e7eb !important;
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
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        background-color: #f8fafc;
      }

      .generated-content-display .framework,
      .generated-content-display .strategy {
        margin: 1.5rem 0;
        padding: 1.5rem;
        border: 1px solid #dbeafe;
        border-radius: 0.75rem;
        background-color: #eff6ff;
        border-left: 4px solid #3b82f6;
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
      .generated-content-display [style*="border: 1px solid red"],
      .generated-content-display [style*="border:1px solid red"] {
        border: 1px solid #e5e7eb !important;
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
   * Why this matters: Positions the popup menu to the right of the clicked button, with special positioning for User Prompt to avoid viewport cutoff.
   */
  const handleVariablesMenuToggle = (promptField: 'system' | 'user') => {
    setActivePromptField(promptField);
    
    // Get button position
    const buttonRef = promptField === 'system' ? systemVariablesButtonRef.current : userVariablesButtonRef.current;
    if (buttonRef) {
      const rect = buttonRef.getBoundingClientRect();
      let topPosition = rect.top + window.scrollY;
      
      // For User Prompt, position menu much higher to ensure full visibility
      if (promptField === 'user') {
        const menuHeight = Math.min(window.innerHeight * 0.7, 600); // 70vh or 600px max
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        
        // Always position the menu above the button for User Prompt to ensure full visibility
        topPosition = rect.top + window.scrollY - menuHeight + 250; // Move down 250px from the calculated position
        
        // Ensure it doesn't go above the viewport
        if (topPosition < window.scrollY + 20) {
          topPosition = window.scrollY + 20;
        }
      }
      
      setVariablesButtonPosition({
        top: topPosition,
        left: rect.right + window.scrollX + 12 // Position to the right with 12px gap
      });
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
        system_prompt: processedSystemPrompt,
        user_prompt: processedUserPrompt
      };

      // For now, simulate the API call - you'll need to implement the backend endpoint
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3003'}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
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
      saveGeneratedContent(parsedResponse.content, parsedResponse.metaSeoTitle, parsedResponse.metaDescription);

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
      
      // Use parseAIResponse for fallback content too
      const parsedFallback = parseAIResponse(fallbackContent);
      const fallbackMetaTitle = `How to Solve ${post.analysis.pain_point} in ${new Date().getFullYear()}`;
      const fallbackMetaDescription = `Discover proven strategies to address ${post.analysis.pain_point}. Learn how Apollo's comprehensive platform helps teams overcome challenges and achieve measurable results.`;
      
      setGeneratedContent(parsedFallback.content);
      setEditableContent(parsedFallback.content);
      setIsEditingContent(false);
      setMetaSeoTitle(fallbackMetaTitle);
      setMetaDescription(fallbackMetaDescription);
      saveGeneratedContent(parsedFallback.content, fallbackMetaTitle, fallbackMetaDescription);
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
   * Scroll to top of the modal
   * Why this matters: Helps users navigate back to top of long articles
   */
  const scrollToTop = () => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
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
        setShowScrollToTop(scrollTop > 300); // Show button after scrolling 300px
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
          maxWidth: '500px',
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
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
                    padding: '1.25rem',
                cursor: 'pointer',
                    transition: 'all 0.2s ease',
                backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                  onClick={() => {
                    setShowComingSoonMessage(cms.name);
                    setTimeout(() => setShowComingSoonMessage(null), 3000);
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
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
                        width: '32px',
                        height: '32px',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        flexShrink: 0
                      }}>
                        <img 
                          src={cms.logo} 
                          alt={`${cms.name} logo`}
                          style={{
                            width: '24px',
                            height: '24px',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            // Fallback to initials if logo fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span style="font-size: 12px; font-weight: 600; color: #64748b;">${cms.name.charAt(0)}</span>`;
                            }
                          }}
                        />
                  </div>
                    ) : (
                  <div style={{ 
                        width: '32px',
                        height: '32px',
                        borderRadius: '0.5rem',
                        backgroundColor: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{
                          color: 'white',
                          fontSize: '14px',
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
                boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 10002,
                minWidth: '250px',
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
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          color: autoSaveStatus === 'saving' ? '#6b7280' : '#10b981',
          fontSize: '0.875rem',
          fontWeight: '500',
          pointerEvents: 'none'
        }}>
          {autoSaveStatus === 'saving' ? (
            <>
              <Clock className="animate-spin" style={{ width: '12px', height: '12px' }} />
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
          maxWidth: '480px', // Mobile-first: full width up to mobile max
          height: '100vh',
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
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#fafafa',
              position: 'relative'
            }}
          >
            <div>
              <h2 style={{ fontWeight: '600', margin: 0, color: '#111827' }}>
                Create Content with AI
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
          <div className="content-modal-layout" style={{ flex: 1, overflow: 'hidden' }}>
            {/* Left Panel - Prompts */}
            <div className="content-modal-panel"
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: '#374151' }}>
                Content Generation Prompts
              </h3>

              {/* System Prompt */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                    System Prompt
                  </label>
                  <button
                    ref={systemVariablesButtonRef}
                    onClick={() => handleVariablesMenuToggle('system')}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
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
                    border: '1px solid #e5e7eb',
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
                  <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                    User Prompt
                  </label>
                  <button
                    ref={userVariablesButtonRef}
                    onClick={() => handleVariablesMenuToggle('user')}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
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
                    border: '1px solid #e5e7eb',
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
                border: '1px solid #f3f4f6'
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
            <div ref={rightPanelRef} className="content-modal-panel" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>Generated Content</h3>
                
                {/* Clear Button - At the very top right */}
                {generatedContent && (
                  <button
                    onClick={clearGeneratedContent}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      color: '#dc2626',
                      transition: 'all 0.2s ease',
                      marginLeft: 'auto'
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
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {/* Edit/Save Button */}
                  <button
                    onClick={toggleEditMode}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: isEditingContent ? '#10b981' : '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = isEditingContent ? '#059669' : '#d97706';
                      e.currentTarget.style.transform = 'translateY(-1px)';
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
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                  >
                    <Globe size={14} />
                    Publish to CMS
                  </button>
                  
                  <button
                    onClick={openGoogleDocs}
                    className="content-modal-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#84ADEA',
                      color: 'black',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
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
                        width: '16px',
                        height: '16px',
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
                    Open in Google Docs
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={copyToClipboard}
                      className="content-modal-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
                  >
                      <Copy size={14} />
                      Copy to Clipboard
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
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000
                      }}>
                        <Check style={{ width: '0.875rem', height: '0.875rem' }} />
                        Copied!
                      </div>
                    )}
                  </div>
                </div>
              )}



              {generatedContent ? (
                <div
                  className="generated-content-display"
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '2rem',
                    minHeight: '400px',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
                              border: '1px solid #10b981',
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
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
                              border: '1px solid #10b981',
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
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              zIndex: 1000
                            }}>
                              <Check style={{ width: '0.875rem', height: '0.875rem' }} />
                              Copied!
                            </div>
                          )}
                        </div>
                      )}
                      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
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
                      border: '2px solid #f59e0b',
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
                        minHeight: '600px',
                        padding: '1rem 1.25rem',
                        border: '2px solid #f59e0b',
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
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {/* Edit/Save Button */}
                      <button
                        onClick={toggleEditMode}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: isEditingContent ? '#10b981' : '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = isEditingContent ? '#059669' : '#d97706';
                          e.currentTarget.style.transform = 'translateY(-1px)';
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
                          padding: '0.5rem 1rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                      >
                        <Globe size={14} />
                        Publish to CMS
                      </button>
                      
                      <button
                        onClick={openGoogleDocs}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#84ADEA',
                          color: 'black',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
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
                            width: '16px',
                            height: '16px',
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
                        Open in Google Docs
                      </button>

                      <button
                        onClick={copyToClipboard}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
                      >
                        <Copy size={14} />
                        Copy to Clipboard
                      </button>
                    </div>

                    {/* Clear Button - Right Aligned */}
                    <button
                      onClick={clearGeneratedContent}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
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
                  </div>
                </div>
              ) : (
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '0.75rem',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  minHeight: '400px',
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
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
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
                  border: '1px solid #d1d5db',
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
    </>
  );
};

export default ContentCreationModal; 