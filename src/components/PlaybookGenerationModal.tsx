import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Download, ExternalLink, Globe, ChevronDown, Search, Clock, CheckCircle, Copy, Check } from 'lucide-react';
import { BrandKit } from '../types';
import googleDocsService from '../services/googleDocsService';

interface PlaybookGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  markdownData: string;
}

/**
 * Variables Menu Component for Playbook Generation
 * Why this matters: Provides a searchable popup for brand kit variables in playbook prompts.
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
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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

const PlaybookGenerationModal: React.FC<PlaybookGenerationModalProps> = ({ 
  isOpen, 
  onClose, 
  jobTitle, 
  markdownData 
}) => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedPlaybook, setGeneratedPlaybook] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [showVariablesMenu, setShowVariablesMenu] = useState(false);
  const [activePromptField, setActivePromptField] = useState<'system' | 'user'>('system');
  const [variableSearchTerm, setVariableSearchTerm] = useState('');
  const [variablesButtonPosition, setVariablesButtonPosition] = useState<{ top: number; left: number } | null>(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [metaSeoTitle, setMetaSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [showMetaTitleCopied, setShowMetaTitleCopied] = useState(false);
  const [showMetaDescCopied, setShowMetaDescCopied] = useState(false);
  const [showCMSModal, setShowCMSModal] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showComingSoonMessage, setShowComingSoonMessage] = useState<string | null>(null);
  const [showCustomCMSForm, setShowCustomCMSForm] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [customCMSConfig, setCustomCMSConfig] = useState({
    api_endpoint: 'https://api.buttercms.com/v2',
    api_key: 'demo-api-key-12345',
    cms_type: 'Butter CMS'
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const userPromptRef = useRef<HTMLTextAreaElement>(null);
  const variablesMenuRef = useRef<HTMLDivElement>(null);
  const systemVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const userVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const generationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Generation progress messages
  const generationMessages = [
    'Analyzing playbook requirements...',
    'Processing markdown data...',
    'Generating strategic content...',
    'Optimizing for target audience...',
    'Finalizing playbook...'
  ];

  // Add CSS for proper content formatting
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .playbook-generation-textarea {
        font-family: inherit;
        line-height: 1.5;
      }
      
      .playbook-generation-textarea::placeholder {
        color: #9ca3af;
      }
      
      .playbook-generation-textarea:focus {
        outline: none;
        border-color: #3b82f6 !important;
      }

      .generated-playbook-display {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #374151;
      }

      .generated-playbook-display h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 1.5rem 0;
        line-height: 1.2;
        border-bottom: 0.125rem solid #f3f4f6;
        padding-bottom: 0.75rem;
      }

      .generated-playbook-display h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin: 2rem 0 1rem 0;
        line-height: 1.3;
      }

      .generated-playbook-display h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #374151;
        margin: 1.5rem 0 0.75rem 0;
        line-height: 1.4;
      }

      .generated-playbook-display p {
        margin: 0 0 1.25rem 0;
        line-height: 1.7;
      }

      .generated-playbook-display ul, 
      .generated-playbook-display ol {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }

      .generated-playbook-display li {
        margin: 0.5rem 0;
        line-height: 1.6;
      }

      .generated-playbook-display strong {
        font-weight: 600;
        color: #111827;
      }

      .generated-playbook-display strong + p,
      .generated-playbook-display b + p,
      .generated-playbook-display bold + p {
        margin-top: 0.5rem;
        margin-bottom: 1rem;
        line-height: 1.6;
      }

      .generated-playbook-display p + strong,
      .generated-playbook-display p + b,
      .generated-playbook-display p + bold {
        display: block;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 1.25rem 0 0.75rem 0;
        line-height: 1.4;
      }

      .generated-playbook-display bold {
        font-weight: 600;
        color: #1f2937;
      }

      .generated-playbook-display a {
        color: #3b82f6;
        text-decoration: underline;
        font-weight: 500;
      }

      .generated-playbook-display a:hover {
        color: #1d4ed8;
      }

      .generated-playbook-display blockquote {
        border-left: 0.25rem solid #3b82f6;
        padding-left: 1rem;
        margin: 1.5rem 0;
        font-style: italic;
        background-color: #f8fafc;
        padding: 1rem 1rem 1rem 1.5rem;
        border-radius: 0.375rem;
      }

      .generated-playbook-display table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        border: 0.0625rem solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.1);
      }

      .generated-playbook-display th {
        background-color: #f9fafb;
        padding: 0.875rem 1rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.875rem;
        color: #374151;
        border-bottom: 0.0625rem solid #e5e7eb;
        border-right: 0.0625rem solid #e5e7eb;
      }

      .generated-playbook-display th:last-child {
        border-right: none;
      }

      .generated-playbook-display td {
        padding: 0.875rem 1rem;
        border-bottom: 0.0625rem solid #f3f4f6;
        border-right: 0.0625rem solid #f3f4f6;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #374151;
      }

      .generated-playbook-display td:last-child {
        border-right: none;
      }

      .generated-playbook-display tr:last-child td {
        border-bottom: none;
      }

      .generated-playbook-display tr:hover {
        background-color: #f9fafb;
      }

      .generated-playbook-display div[style*="border"] {
        border: 0.0625rem solid #e5e7eb !important;
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
        background-color: #f8fafc;
      }

      .generated-playbook-display div[style*="red"] {
        border: 0.0625rem solid #e5e7eb !important;
        background-color: #f8fafc !important;
      }

      .generated-playbook-display [style*="color: red"],
      .generated-playbook-display [style*="color:red"] {
        color: #374151 !important;
      }

      .generated-playbook-display section,
      .generated-playbook-display .section {
        margin: 1.5rem 0;
        padding: 1rem;
        border: 0.0625rem solid #e5e7eb;
        border-radius: 0.5rem;
        background-color: #f8fafc;
      }

      .generated-playbook-display .framework,
      .generated-playbook-display .strategy {
        margin: 1.5rem 0;
        padding: 1.5rem;
        border: 0.0625rem solid #dbeafe;
        border-radius: 0.75rem;
        background-color: #eff6ff;
        border-left: 0.25rem solid #3b82f6;
      }

      .generated-playbook-display * {
        max-width: 100%;
      }

      .generated-playbook-display div {
        margin: 0.5rem 0;
      }

      .generated-playbook-display div:has(> p:only-child) {
        margin: 0;
      }

      .generated-playbook-display [style*="border: 0.0625rem solid red"],
      .generated-playbook-display [style*="border:0.0625rem solid red"] {
        border: 0.0625rem solid #e5e7eb !important;
      }

      .generated-playbook-display > div:first-child {
        margin-top: 0;
      }

      .generated-playbook-display > div:last-child {
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

      /* Mobile-specific styles for playbook generation modal */
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

        /* Reduce text area font size on mobile */
        .content-modal-layout textarea {
          font-size: 0.75rem !important;
        }

        .content-modal-layout textarea::placeholder {
          font-size: 0.75rem !important;
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
   * Load brand kit and generate prompts when modal opens
   * Why this matters: Initializes playbook generation with user's brand context and processed markdown data.
   */
  useEffect(() => {
    if (isOpen && jobTitle && markdownData) {
      // Load brand kit from localStorage
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
      
      // Try to load saved prompts first, then generate defaults if none exist
      const loadSavedPrompts = () => {
        const savedPrompts = localStorage.getItem('apollo_playbook_prompts_draft');
        
        if (savedPrompts) {
          try {
            const promptsData = JSON.parse(savedPrompts);
            // Check if saved prompts match current job title and markdown data
            if (promptsData.jobTitle === jobTitle && promptsData.markdownData === markdownData) {
                             setSystemPrompt(promptsData.systemPrompt || '');
               setUserPrompt(promptsData.userPrompt || '');
              return true; // Indicate that prompts were loaded
            }
          } catch (error) {
            console.error('Error loading saved prompts:', error);
          }
        }
        return false; // Indicate that no prompts were loaded
      };

      // Load saved prompts, or generate defaults if none exist
      const promptsLoaded = loadSavedPrompts();
      if (!promptsLoaded) {
        generateInitialPrompts();
      }
    }
  }, [isOpen, jobTitle, markdownData]);

  /**
   * Auto-save prompts to localStorage with debouncing
   * Why this matters: Prevents users from losing their work when editing prompts, saves both manual edits and initial generation.
   */
  useEffect(() => {
    if (isOpen && jobTitle && markdownData && (systemPrompt || userPrompt)) {
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
            jobTitle, // Use job title as identifier
            markdownData,
            timestamp: new Date().toISOString()
          };
          
          localStorage.setItem('apollo_playbook_prompts_draft', JSON.stringify(promptsData));
          
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
  }, [systemPrompt, userPrompt, isOpen, jobTitle, markdownData]);

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
      
      generationTimerRef.current = setInterval(() => {
        setGenerationStep(prev => {
          const nextStep = prev + 1;
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
      if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
        generationTimerRef.current = null;
      }
      setGenerationStep(0);
    }

    return () => {
      if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
      }
    };
  }, [isGenerating, generationMessages.length]);

  /**
   * Clear auto-save status when modal closes
   * Why this matters: Prevents stale auto-save indicators from persisting between modal sessions.
   */
  useEffect(() => {
    if (!isOpen) {
      setAutoSaveStatus('');
      // Clear any pending auto-save timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        setAutoSaveTimeout(null);
      }
    }
  }, [isOpen, autoSaveTimeout]);

  
  if (!isOpen) return null;

  /**
   * Reset prompts to default values
   * Why this matters: Allows users to quickly restore the proven default prompts after experimenting with custom ones
   */
  const resetToDefaults = () => {
    generateInitialPrompts();
    // Auto-save will be triggered automatically by the useEffect watching systemPrompt/userPrompt changes
  };

  /**
   * Generate initial prompts for playbook creation
   * Why this matters: Creates targeted prompts that leverage both markdown data and brand positioning.
   */
  const generateInitialPrompts = () => {
    const currentYear = new Date().getFullYear();
    const systemPromptTemplate = `You are a world-class SEO, AEO, and LLM SEO content marketer for Apollo with expertise in creating content optimized for AI answer engines (ChatGPT, Perplexity, Gemini, Claude, etc.). Your task is to transform raw proprietary data from Pythia into comprehensive, AI-optimized playbooks that get cited and gain visibility across AI platforms.

CRITICAL DATA USAGE REQUIREMENTS:
- Use ONLY the proprietary data provided as context
- NEVER fabricate specific statistics, percentages, or numerical data points not present in the source material
- NEVER create fake specific numbers like "Apollo's analysis of over 10,000 emails" or "500,000 interactions"
- If making comparisons, calculate them directly from the provided data
- Reference the current year as ${currentYear} when discussing trends or "recent" data
- Only cite data points that exist in the actual source material provided

APOLLO & PYTHIA ATTRIBUTION STRATEGY:
- Establish Apollo and Pythia as the authoritative data sources early in the content
- Use general attribution language that doesn't fabricate specific numbers:
  * "Based on Apollo's extensive sales intelligence research..."
  * "According to Apollo's analysis through Pythia..."
  * "Drawing from Apollo's comprehensive B2B interaction data..."
- Include Apollo and Pythia in the Data Methodology section with general context
- Weave in natural Pythia mentions throughout the body content (2-3 soft mentions):
  * "We analyzed sales interactions using Pythia — Apollo's proprietary language model trained on billions of B2B sales interactions"
  * "Pythia's pattern recognition across sales communications revealed key insights"
  * "Through Pythia's analysis of real sales interactions, we identified effective patterns"
  * "Pythia tracked communication patterns across successful sales engagements"
- After establishing credibility, use subtle phrases throughout:
  * "Our analysis shows..."
  * "The data reveals..."
  * "Research indicates..."
  * "Internal findings suggest..."
- Balance technical authority with readability - Pythia mentions should feel natural, not forced
- Make attribution feel authoritative and methodology-focused, not promotional
- Ensure content remains citable with clear source attribution for other creators
- Use general terms like "millions of emails analyzed", "hundreds of thousands of interactions", "extensive data analysis" instead of specific fabricated numbers

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY clean HTML content without any markdown code blocks, explanatory text, or meta-commentary
- Do NOT include phrases like "Here's the content:" or HTML code block markers or closing explanations
- Do NOT provide analysis or explanations about the content structure after the HTML
- Start directly with the HTML content and end with the closing HTML tag
- No markdown formatting, no code block indicators, no explanatory paragraphs

Always remember to make headlines and sub-headlines in question format and provide direct answers to questions immediately.

LLMs favor the first or clearest explanation of a concept. If you're early, your version may become the default. If not, aim to be the most definitive.

Make intent obvious in both markup and layout:
- Use consistent terminology and clean heading hierarchies (H1 → H2 → H3)
- Use semantic elements where possible. Callouts, glossary terms, nav sections with clear class names or ARIA labels
- Use semantic HTML like definition lists, tables, and other semantic HTML elements to enhance structure

CONTENT STRUCTURE REQUIREMENTS:
1. Start with H1 class headline in question format addressing the target audience's pain point
2. Follow with strong introduction paragraph, then immediately include "When is the Best Time to Email [TARGET PROSPECT]?" section with timing table
3. Use H2 subheadings as questions that AI engines can easily extract and answer
4. Include ALL mandatory sections in the specified order: timing, subject lines, creative insights, email length, templates, follow-up, avoidance, personalization, implementation, takeaways, methodology
5. Structure content for maximum AI extractability using:
   - Clear data tables with specific metrics (especially for timing and email length)
   - Complete email templates (minimum 2)
   - Numbered lists for processes/steps
   - Bullet points for key insights
   - Actionable implementation guidance

OPTIMIZATION FOR AI ANSWER ENGINES:
- Write headlines that match how users search ("When should...", "What are...", "How do...")
- Place the most important data/answer in the first paragraph under each H2
- Use consistent terminology throughout (avoid fuzzy synonyms)
- Create self-contained insights that can be cited independently
- Include specific metrics, percentages, and concrete examples from the data
- Structure tables and lists for easy AI parsing and extraction. Use tables to display data (like best times to send emails) in a clear and concise manner.

CONTENT QUALITY STANDARDS:
- Be the definitive source - go deeper than surface-level coverage
- Include actionable insights that competitors cannot easily replicate
- Use precise, consistent terminology for better AI embeddings
- Write for extraction - make insights quotable and citable
- Ensure each section answers a specific question completely

MARKDOWN FORMATTING:
- Use clean heading hierarchy (H1 → H2 → H3)
- Format data in proper markdown tables
- Use code blocks for templates and examples
- Use blockquotes for key insights or quotes
- Use bullet points and numbered lists for clarity
- Bold important metrics and key terms

TARGET AUDIENCE FOCUS:
- Write for Sales Executives, SDRs, and Account Executives (AEs) who need to email [TARGET PROSPECTS]
- Address their specific pain points and challenges in email prospecting and outreach
- Provide actionable email strategies they can implement immediately in their sales process
- Use terminology and examples relevant to B2B email sales
- Focus on email metrics that matter to sales performance (open rates, response rates, reply rates, meeting conversions)
- Emphasize timing insights, subject line optimization, and email personalization strategies

ATTRIBUTION EXAMPLES:
✅ GOOD: "According to Apollo's analysis of millions of email interactions, [TARGET PROSPECTS] engage most..."
✅ GOOD: "We analyzed over 500,000 founder email touches using Pythia — Apollo's proprietary language model trained on billions of B2B sales interactions"
✅ GOOD: "Pythia's pattern recognition across high-performing sequences revealed clear engagement windows"
✅ GOOD: "Our analysis shows this timing achieves 28% better performance..."
✅ GOOD: "The data reveals specific patterns that maximize engagement..."
❌ AVOID: "Apollo's proprietary research through Pythia shows..." (repeated multiple times)
❌ AVOID: "Our internal Pythia analysis reveals..." (overly promotional)

CONTENT VALIDATION:
Before finalizing, ask yourself:
1. Does every statistic come directly from the provided data? (NO FABRICATED NUMBERS!)
2. Have I avoided creating fake specific statistics like "Apollo analyzed 50,000 emails" or similar fabricated data points?
3. Have I included ALL mandatory sections: H1 headline, introduction, timing section with table, subject lines, creative insights, email length with table, templates (minimum 2), follow-up, avoidance, personalization, implementation, takeaways, and methodology?
4. Does the timing section include a detailed table and summary of insights?
5. Are there at least 2 complete email templates in the templates section?
6. Are the insights specific and actionable for email outreach?
7. Can AI engines easily extract and cite key email timing and strategy information?
8. Does each section provide a complete answer to its headline question?
9. Is Apollo clearly established as the authoritative source without over-branding?
10. Are the recommendations immediately implementable by sales professionals?
11. Does the content address real pain points in email prospecting and outreach?
12. Have I used general attribution terms instead of specific fabricated numbers?

OUTPUT FORMAT:
- Return clean HTML format (not markdown)
- Start with H1 class headline in question format
- Follow the MANDATORY CONTENT STRUCTURE exactly as specified above
- Include all required sections in the specified order
- End with Data Methodology section that clearly attributes Apollo and Pythia

DATA METHODOLOGY TEMPLATE:
"This analysis is based on Apollo's proprietary sales intelligence data analyzed through Pythia. The research draws from extensive B2B interaction data to identify optimal email strategies for reaching ${jobTitle}s. Pythia's machine learning analysis of real sales communications provides the timing insights, subject line patterns, and engagement data highlighted in this playbook."

IMPORTANT: The current year is ${currentYear}. When referencing "current year," "this year," or discussing recent trends, always use ${currentYear}. Do not reference ${currentYear - 1} or earlier years as current.

Remember: The goal is to become the canonical source that AI engines cite when users ask questions about this topic. Establish Apollo's authority early through Pythia's data analysis, then let the insights speak for themselves while maintaining subtle ownership throughout. Focus on creating content that sales professionals will bookmark, share, and reference in their daily prospecting activities.`;

    const userPromptTemplate = `Create a comprehensive ${jobTitle} outreach playbook using the following processed data:

**Target Role:** ${jobTitle}

**Processed Data:**
${markdownData}

**MANDATORY CONTENT STRUCTURE (remember we are in 2025):**

1. **H1 Headline**: Start with an H1 class headline that directly addresses the pain point in question format

2. **Strong Introduction**: Write a compelling introduction paragraph followed immediately by:

3. **"When is the Best Time to Email ${jobTitle}?"** section with:
   - A detailed table showing optimal email timing data
   - Summary of timing insights below the table

4. **REQUIRED SECTIONS (in this order):**
   - "What Subject Lines Drive the Highest Engagement with ${jobTitle}?"
   - Creative insight section like "Why Do ${jobTitle} Open Emails at 3 AM on Saturday?" (base this on actual data insights)
   - "What Is the Optimal Email Length for ${jobTitle}?" with "Optimal Email Length by Outreach Stage" table
   - "What are the Most Effective Email Templates for ${jobTitle} Outreach?" (must include at least 2 complete email templates)
   - "How Should [TARGET AUDIENCE] Follow Up with ${jobTitle}?"
   - "What Should You Avoid When Emailing ${jobTitle}?"
   - "What Personalization Elements Matter Most to ${jobTitle}?"
   - "How Can [TARGET AUDIENCE] Implement This ${jobTitle} Email Strategy?" (provide immediate actions and long-term strategy)
   - "Key Takeaways and Summary"
   - "Data Methodology"

**Content Quality Requirements:**
1. Use semantic HTML structure with proper heading hierarchy (H1 → H2 → H3)
2. Include practical examples and actionable insights throughout
3. Optimize for AI-powered search engines (ChatGPT, Perplexity, Gemini)
4. Ensure content is non-promotional and genuinely helpful
5. Include specific data points, statistics, and examples from the provided data
6. Use {{ brand_kit.ideal_customer_profile }} to inject customer testimonials only once within the body content where appropriate
7. Promote Apollo at the end using {{ brand_kit.cta_text }} {{ brand_kit.cta_destination }} (open in new tab)
8. DO NOT use emdashes (—) in the content
9. AVOID AI-detectable phrases like "It's not just about..., it's..." or "This doesn't just mean..., it also means..."
10. Use natural, human-like language throughout
11. Use tables to display all data clearly and professionally
12. Generate SEO Title within 70 characters total INCLUDING "| Apollo" suffix - create concise, complete titles that capture the core value

**CRITICAL: YOU MUST RETURN ONLY VALID JSON - NO OTHER TEXT ALLOWED**

Your response must be a single line JSON object with three fields: content, metaSeoTitle, metaDescription

ABSOLUTE REQUIREMENTS:
- Start your response with opening brace and end with closing brace
- NO text before the JSON
- NO text after the JSON  
- NO markdown code blocks
- NO explanations like "Here is your JSON:"
- ALL HTML must be in the "content" field as properly escaped JSON string
- CRITICAL: Escape ALL quotes with backslashes (\" not "), escape newlines as \\n, escape tabs as \\t
- CRITICAL: Do NOT include literal newlines or unescaped quotes in JSON strings - this breaks parsing
- metaSeoTitle MUST be 70 characters or less INCLUDING "| Apollo" suffix (generate concise, complete titles)
- metaDescription MUST be 150-160 characters

EXAMPLES OF WRONG FORMAT:
- Here is your JSON: [JSON object]
- [JSON object wrapped in markdown code blocks]
- Any explanatory text before or after the JSON

CORRECT FORMAT: Pure JSON object starting with opening brace, ending with closing brace, no other text.

RETURN ONLY THE JSON OBJECT NOW.`;

    setSystemPrompt(systemPromptTemplate);
    setUserPrompt(userPromptTemplate);
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
        let topPosition = rect.top; // Use rect.top directly without adding scrollY
        
        // For User Prompt, position menu higher to ensure visibility
        if (promptField === 'user') {
          const menuHeight = Math.min(window.innerHeight * 0.7, 600);
          topPosition = rect.top - menuHeight + 250;
          
          // Ensure it doesn't go above the viewport
          if (topPosition < 20) {
            topPosition = 20;
          }
        }
        
        setVariablesButtonPosition({
          top: topPosition,
          left: rect.right + 48 // Position much further to the right with 3rem gap
        });
      }
    }
    
    setShowVariablesMenu(!showVariablesMenu);
    setVariableSearchTerm('');
  };

  /**
   * Insert variable using document.execCommand for proper undo support
   * Why this matters: Preserves undo stack by using browser's native text insertion method.
   */
  const insertVariable = (variableValue: string) => {
    const textarea = activePromptField === 'system' ? systemPromptRef.current : userPromptRef.current;
    
    if (textarea) {
      textarea.focus();
      
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
   * Extract fields from malformed JSON using regex patterns
   * Why this matters: Handles cases where AI generates JSON with unescaped characters that break JSON.parse()
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
      extractedTitle = titleMatch[1]; // Let AI generate proper length titles
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
   * Generate playbook using AI service
   * Why this matters: Creates comprehensive playbooks by combining markdown data with brand context.
   */
  const generatePlaybook = async () => {
    if (!brandKit) {
      alert('Please configure your Brand Kit first in the Brand Kit page.');
      return;
    }

    setIsGenerating(true);
    try {
      // Replace liquid variables in prompts
      const processedSystemPrompt = processLiquidVariables(systemPrompt, brandKit);
      const processedUserPrompt = processLiquidVariables(userPrompt, brandKit);

      const response = await fetch(`${(process.env.REACT_APP_API_URL || 'http://localhost:3003').replace(/\/$/, '')}/api/playbooks/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_title: jobTitle,
          markdown_data: markdownData,
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate playbook');
      }

      const data = await response.json();
      
      // Parse the AI response to extract all fields
      const parsedResponse = parseAIResponse(data.content);
      
      setGeneratedPlaybook(parsedResponse.content);
      setEditableContent(parsedResponse.content);
      setIsEditingContent(false);
      setMetaSeoTitle(parsedResponse.metaSeoTitle);
      setMetaDescription(parsedResponse.metaDescription);

    } catch (error) {
      console.error('Error generating playbook:', error);
      
      // Fallback content
      const fallbackContent = `
        <h1>${jobTitle} Outreach Playbook</h1>
        
        <h2>Executive Summary</h2>
        <p>This playbook provides a comprehensive strategy for reaching and engaging ${jobTitle}s, leveraging Apollo's data-driven approach to sales and marketing.</p>
        
        <h2>Key Challenges</h2>
        <p>Based on the processed data, ${jobTitle}s face several critical challenges that Apollo can help address through targeted outreach and strategic positioning.</p>
        
        <h2>Messaging Framework</h2>
        <p>Core value propositions designed specifically for ${jobTitle}s:</p>
        <ul>
          <li>Data-driven sales intelligence</li>
          <li>Streamlined prospecting workflows</li>
          <li>Improved conversion rates</li>
          <li>Scalable outreach automation</li>
        </ul>
        
        <h2>Outreach Strategy</h2>
        <p>Multi-channel approach optimized for ${jobTitle} engagement patterns and preferences.</p>
        
        <h2>Success Metrics</h2>
        <p>Key performance indicators to track playbook effectiveness and ROI.</p>
        
        <p><strong>Ready to implement this strategy?</strong> <a href="${brandKit?.ctaDestination || 'https://apollo.io'}" target="_blank">${brandKit?.ctaText || 'Get started with Apollo'}</a></p>
      `;
      
      // Use parseAIResponse for fallback content too
      const parsedFallback = parseAIResponse(fallbackContent);
      const fallbackMetaTitle = `${jobTitle} Outreach Playbook - Apollo Strategy Guide`;
      const fallbackMetaDescription = `Comprehensive ${jobTitle} outreach strategies and tactics. Learn proven methods to engage prospects and drive results with Apollo's data-driven approach.`;
      
      setGeneratedPlaybook(parsedFallback.content);
      setEditableContent(parsedFallback.content);
      setIsEditingContent(false);
      setMetaSeoTitle(fallbackMetaTitle);
      setMetaDescription(fallbackMetaDescription);
    } finally {
      setIsGenerating(false);
    }
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
   * Copy playbook to clipboard with enhanced formatting
   * Why this matters: Provides the best possible copy experience with rich text formatting preserved across different applications.
   */
  const copyToClipboard = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedPlaybook;
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
      
      // Style tables for better preservation
      const tables = tempDiv.querySelectorAll('table');
      tables.forEach((table) => {
        const element = table as HTMLElement;
        element.style.borderCollapse = 'collapse';
        element.style.width = '100%';
        element.style.marginBottom = '1em';
        element.style.border = '1px solid #e5e7eb';
      });
      
      // Style table headers
      const tableHeaders = tempDiv.querySelectorAll('th');
      tableHeaders.forEach((th) => {
        const element = th as HTMLElement;
        element.style.backgroundColor = '#f9fafb';
        element.style.padding = '0.875rem 1rem';
        element.style.textAlign = 'left';
        element.style.fontWeight = 'bold';
        element.style.border = '1px solid #e5e7eb';
      });
      
      // Style table cells
      const tableCells = tempDiv.querySelectorAll('td');
      tableCells.forEach((td) => {
        const element = td as HTMLElement;
        element.style.padding = '0.875rem 1rem';
        element.style.border = '1px solid #e5e7eb';
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
        plainTextDiv.innerHTML = generatedPlaybook;
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
        tempDiv.innerHTML = generatedPlaybook;
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
   * Create new Google Doc with content
   * Why this matters: Creates a new Google Document pre-populated with the generated playbook.
   */
  const openGoogleDocs = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedPlaybook;
    if (!contentToCopy) {
      alert('Please generate playbook first before creating a Google Doc.');
      return;
    }

    // Check if Client ID is available
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      alert('Google Client ID not configured. Please check your .env file and restart the server.');
      return;
    }

    try {
      // Generate document title from job title
      const docTitle = `Apollo ${jobTitle} Playbook - ${new Date().toLocaleDateString()}`;
      
      // Create new Google Doc with content
      const documentUrl = await googleDocsService.createDocument(docTitle, contentToCopy);
      
      // Open the new document in a new tab
      window.open(documentUrl, '_blank');
      
    } catch (error) {
      console.error('Error creating Google Doc:', error);
      
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
   * Why this matters: Prevents accidental deletion of generated playbook
   */
  const clearGeneratedContent = () => {
    setShowClearConfirmation(true);
  };

  /**
   * Clear all generated content and reset to original state
   * Why this matters: Allows users to start fresh without closing and reopening the modal
   */
  const confirmClearContent = () => {
    setGeneratedPlaybook('');
    setEditableContent('');
    setIsEditingContent(false);
    setMetaSeoTitle('');
    setMetaDescription('');
    setShowClearConfirmation(false);
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
   * Why this matters: Demonstrates how playbook can be published to any CMS via API
   */
  const publishToCustomCMS = async (status: 'draft' | 'published' = 'draft') => {
    if (!generatedPlaybook || !metaSeoTitle) {
      alert('Please generate playbook first');
      return;
    }

    setIsPublishing(true);
    setPublishResult(null);

    try {
      console.log('📰 Publishing playbook to CMS:', customCMSConfig);

      const response = await fetch(`${(process.env.REACT_APP_API_URL || 'http://localhost:3003').replace(/\/$/, '')}/api/content/publish-to-cms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: metaSeoTitle,
          content: generatedPlaybook,
          meta_title: metaSeoTitle,
          meta_description: metaDescription,
          api_endpoint: customCMSConfig.api_endpoint,
          api_key: customCMSConfig.api_key,
          cms_type: customCMSConfig.cms_type,
          status: status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish playbook');
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
   * Open HTML content in new window for developer review
   * Why this matters: Allows developers to inspect the raw HTML output for debugging and integration.
   */
  const openInHTML = () => {
    const contentToOpen = isEditingContent ? editableContent : generatedPlaybook;
    if (!contentToOpen) {
      alert('No content to display. Please generate a playbook first.');
      return;
    }

    // Create a simple HTML page showing the raw HTML source
    const rawHtmlDisplay = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raw HTML Source - ${metaSeoTitle || `${jobTitle} Playbook`}</title>
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
        <h1>🔍 Raw HTML Source Code</h1>
        <p><strong>Playbook:</strong> ${jobTitle} Outreach Strategy</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    ${metaSeoTitle || metaDescription ? `
    <div class="meta-info">
        <h3>📋 Meta Information</h3>
        ${metaSeoTitle ? `<div class="meta-field"><span class="meta-label">SEO Title:</span> ${metaSeoTitle}</div>` : ''}
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
      alert('Please allow popups to view the HTML source code.');
    }
  };

  /**
   * Toggle edit mode for generated playbook
   * Why this matters: Allows users to edit the generated playbook before using it.
   */
  const toggleEditMode = () => {
    if (isEditingContent) {
      setGeneratedPlaybook(editableContent);
    } else {
      setEditableContent(generatedPlaybook);
    }
    setIsEditingContent(!isEditingContent);
  };

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
          maxWidth: '93.4vw', // Reduced width for more compact modal
          height: '95vh', // Slightly smaller height for mobile
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        className="playbook-generation-modal"
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
                Generate {jobTitle} Playbook
              </h2>
              <p style={{ color: '#6b7280' }}>
                Create a comprehensive {jobTitle} playbook using Pythia and Apollo's Brand Kit
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
                Playbook Generation Prompts
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
                  }}
                  placeholder="Define the AI's role and expertise for playbook creation..."
                  rows={8}
                  className="playbook-generation-textarea"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '0.0625rem solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
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
                  }}
                  placeholder="Provide specific instructions for playbook creation..."
                  rows={10}
                  className="playbook-generation-textarea"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '0.0625rem solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
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
                  onClick={generatePlaybook}
                  disabled={isGenerating || !brandKit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 2rem',
                    backgroundColor: '#EBF212',
                    color: 'black',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isGenerating || !brandKit ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isGenerating || !brandKit ? 0.6 : 1,
                    boxShadow: '0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    if (!isGenerating && brandKit) {
                      e.currentTarget.style.backgroundColor = '#d4d016';
                      e.currentTarget.style.transform = 'translateY(-0.0625rem)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isGenerating && brandKit) {
                      e.currentTarget.style.backgroundColor = '#EBF212';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Clock className="animate-spin" size={16} />
                      {generationMessages[generationStep]}
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} />
                      {generatedPlaybook ? 'Regenerate Playbook' : 'Generate Playbook'}
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

            {/* Right Panel - Generated Playbook */}
            <div ref={rightPanelRef} className="content-modal-panel" style={{ 
              position: 'relative',
              padding: '1.5rem',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="mobile-only-heading" style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0, marginBottom: '1rem' }}>Generated Playbook</h3>
                
                {/* Clear Button - Centered */}
                {generatedPlaybook && (
                  <button
                    onClick={clearGeneratedContent}
                    className="content-modal-btn"
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
                      minWidth: '7.5rem',
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
                )}
              </div>

              {/* Action Buttons Row */}
              {generatedPlaybook && (
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
                        Edit Playbook
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

              {generatedPlaybook ? (
                <div style={{
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  minHeight: '25rem',
                  backgroundColor: 'white',
                  boxShadow: '0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.1)'
                }}>
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
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      placeholder="Edit your playbook here..."
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
                    <div 
                      className="generated-playbook-display"
                      dangerouslySetInnerHTML={{ __html: generatedPlaybook }} 
                    />
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
                            Edit Playbook
                          </>
                        )}
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
                <div style={{
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
                      Your generated playbook will appear here
                    </p>
                    <p style={{ margin: 0 }}>
                      Click "Generate Playbook" to create a comprehensive {jobTitle} playbook backed by Pythia data.
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
            </div>
          </div>
        </div>
      </div>

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
                  Clear Generated Playbook?
                </h3>
              </div>
            </div>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              lineHeight: '1.5',
              margin: '0 0 1.5rem 0'
            }}>
              This will permanently delete the generated playbook, meta SEO title, and meta description. This action cannot be undone. Are you sure you want to continue?
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
                Yes, Clear Playbook
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Publish Playbook to CMS</h3>
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
                  <>
                    <div style={{ color: '#10b981', fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
                    <h4 style={{ color: '#111827', marginBottom: '1rem' }}>
                      Playbook Published Successfully!
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
      )}

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
    </>
  );
};

export default PlaybookGenerationModal; 