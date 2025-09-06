import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check, CheckCircle, RefreshCw, Wand2, ChevronDown, Search, Clock, Globe } from 'lucide-react';
import { BrandKit } from '../types';
import googleDocsService from '../services/googleDocsService';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';

interface CompetitorRowBasic {
  id: string;
  keyword: string;
  url: string;
  status: 'idle' | 'queued' | 'running' | 'completed' | 'error';
  output?: string;
  createdAt: string;
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
  generationResult?: any;
  workflowDetails?: {
    firecrawl?: any;
    deepResearch?: any;
    gapAnalysis?: any;
    contentGeneration?: any;
  };
}

interface CompetitorContentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: CompetitorRowBasic;
  brandKit?: BrandKit | null;
  onContentUpdate?: (rowId: string, newContent: string) => void;
}

/**
 * Variables Menu Component (duplicated from BlogContentActionModal for UI parity)
 * Why this matters: Provides a searchable popup for inserting brand variables into prompts,
 * matching the Blog modal UX to reduce cognitive load.
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

  // Build variables list including custom variables
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
      { key: 'cta_destination', label: 'CTA Destination', value: '{{ brand_kit.cta_destination }}' },
      // Competitor-conquesting extras (empty by default, can be filled upstream)
      { key: 'research_key_insights', label: 'Research Insights', value: '{{ brand_kit.research_key_insights }}' },
      { key: 'gap_analysis_summary', label: 'Gap Analysis Summary', value: '{{ brand_kit.gap_analysis_summary }}' },
      { key: 'primary_angle', label: 'Primary Angle', value: '{{ brand_kit.primary_angle }}' },
      { key: 'structure_recommendations', label: 'Structure Recs', value: '{{ brand_kit.structure_recommendations }}' },
      { key: 'seo_suggestions', label: 'SEO Suggestions', value: '{{ brand_kit.seo_suggestions }}' }
    ];

    const customVariables = brandKit && brandKit.customVariables
      ? Object.keys(brandKit.customVariables).map((key) => ({
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          value: `{{ brand_kit.${key} }}`
        }))
      : [];

    return [...customVariables, ...standardVariables];
  };

  const filtered = (() => {
    const all = getAllVariables();
    if (!variableSearchTerm) return all;
    return all.filter(
      (v) =>
        v.label.toLowerCase().includes(variableSearchTerm.toLowerCase()) ||
        v.key.toLowerCase().includes(variableSearchTerm.toLowerCase())
    );
  })();

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
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: '#111827' }}>Brand Variables</h3>
          <button
            onClick={() => setShowVariablesMenu(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Insert into {activePromptField} prompt</p>
      </div>

      <div style={{ padding: '1rem 1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search variables..."
            value={variableSearchTerm}
            onChange={(e) => setVariableSearchTerm(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: '0.625rem 0.625rem 0.625rem 2.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 1.5rem' }}>
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((variable) => (
              <div
                key={variable.key}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); insertVariable(variable.value); }}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>{variable.label}</div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#7c3aed',
                    backgroundColor: '#f3f4f6',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    border: '1px solid #e5e7eb',
                    fontWeight: 600
                  }}
                >
                  {variable.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            <Search size={32} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>No variables found</p>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * CompetitorContentActionModal
 * Why this matters: Provides tailored prompts and regeneration tools for the competitor-conquesting flow
 * (explicitly beating a specific competitor URL) without losing power-user features like copying and editing.
 */
const CompetitorContentActionModal: React.FC<CompetitorContentActionModalProps> = ({
  isOpen,
  onClose,
  row,
  brandKit = null,
  onContentUpdate
}) => {
  // Prompts & brand kit
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [resolvedBrandKit, setResolvedBrandKit] = useState<BrandKit | null>(brandKit || null);
  
  // Store workflow data (deep research and gap analysis) from previous generation
  const [workflowData, setWorkflowData] = useState<{
    deep_research?: any;
    gap_analysis?: any;
  } | null>(null);

  // UI states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showVariablesMenu, setShowVariablesMenu] = useState<boolean>(false);
  const [activePromptField, setActivePromptField] = useState<'system' | 'user'>('system');
  const [variableSearchTerm, setVariableSearchTerm] = useState<string>('');
  const [variablesButtonPosition, setVariablesButtonPosition] = useState<{ top: number; left: number } | null>(null);

  // Content & editing
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isEditingContent, setIsEditingContent] = useState<boolean>(false);
  const [editableContent, setEditableContent] = useState<string>('');
  // Meta SEO fields and copy UI state (parity with Blog modal)
  const [metaSeoTitle, setMetaSeoTitle] = useState<string>('');
  const [metaDescription, setMetaDescription] = useState<string>('');
  const [showMetaTitleCopied, setShowMetaTitleCopied] = useState<boolean>(false);
  const [showMetaDescCopied, setShowMetaDescCopied] = useState<boolean>(false);
  // Auto-save prompts UI state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasUserInput, setHasUserInput] = useState<boolean>(false);
  // Sheets UX
  const [isOpeningSheets, setIsOpeningSheets] = useState<boolean>(false);
  const [showSheetsMessage, setShowSheetsMessage] = useState<boolean>(false);
  const [sheetsSuccessMessage, setSheetsSuccessMessage] = useState<string>('');

  // CMS Integration states
  const [showCMSModal, setShowCMSModal] = useState(false);
  const [showCustomCMSForm, setShowCustomCMSForm] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [showComingSoonMessage, setShowComingSoonMessage] = useState<string | null>(null);
  const [customCMSConfig, setCustomCMSConfig] = useState({
    api_endpoint: 'https://api.buttercms.com/v2',
    api_key: '',
    cms_type: 'buttercms'
  });
  
  // Contextual CTA states
  const [enableContextualCtas, setEnableContextualCtas] = useState(true);
  const [isEnhancingWithCtas, setIsEnhancingWithCtas] = useState(false);
  const [ctaEnhancementResult, setCtaEnhancementResult] = useState<any>(null);

  // Refs
  const systemRef = useRef<HTMLTextAreaElement | null>(null);
  const userRef = useRef<HTMLTextAreaElement | null>(null);
  const variablesMenuRef = useRef<HTMLDivElement | null>(null);
  const systemVariablesButtonRef = useRef<HTMLButtonElement | null>(null);
  const userVariablesButtonRef = useRef<HTMLButtonElement | null>(null);
  const editableContentRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * generateAIMetaFields
   * Why this matters: Produces meta SEO fields so this modal mirrors Blog modal UX.
   */
  function generateAIMetaFields(
    keyword: string,
    content: string
  ): Promise<{ metaSeoTitle: string; metaDescription: string }> {
    return (async () => {
      try {
        const contentPreview = content.replace(/<[^>]*>/g, '').substring(0, 500);
        const apiUrl = API_ENDPOINTS.generateMeta;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            content_preview: contentPreview,
            prompt: `Generate meta fields for competitor content about "${keyword}".`
          })
        });
        if (!response.ok) throw new Error('Meta API failed');
        const data = await response.json();
        return {
          metaSeoTitle: data.metaSeoTitle || generateFallbackTitle(keyword),
          metaDescription: data.metaDescription || generateFallbackDescription(keyword)
        };
      } catch {
        return {
          metaSeoTitle: generateFallbackTitle(keyword),
          metaDescription: generateFallbackDescription(keyword)
        };
      }
    })();
  }

  /**
   * Fallback meta helpers
   * Why this matters: Guarantees fields even if AI meta API fails.
   */
  function generateFallbackTitle(keyword: string): string {
    const k = keyword.trim();
    // AEO-optimized fallback: question format or clear topic statement
    // Why this matters: AI engines prefer clear, intent-matching titles without hyperbole
    console.log('⚠️ Using fallback title generation for keyword:', k);
    if (k.toLowerCase().startsWith('what') || k.toLowerCase().startsWith('how')) {
      return `${k.charAt(0).toUpperCase() + k.slice(1)} | Apollo`;
    }
    // Use more varied, natural formats
    const formats = [
      `${k.charAt(0).toUpperCase() + k.slice(1)} for B2B Teams | Apollo`,
      `Understanding ${k.charAt(0).toUpperCase() + k.slice(1)} in Sales | Apollo`,
      `${k.charAt(0).toUpperCase() + k.slice(1)}: Practical Guide | Apollo`
    ];
    return formats[Math.floor(Math.random() * formats.length)];
  }
  function generateFallbackDescription(keyword: string): string {
    // AEO-optimized fallback: direct value statement without made-up claims
    // Why this matters: AI engines penalize unverifiable claims and prefer factual descriptions
    const k = keyword.trim().toLowerCase();
    console.log('⚠️ Using fallback description generation for keyword:', k);
    // Use more varied, natural descriptions
    const templates = [
      `Explore ${k} strategies and implementation approaches for B2B sales teams. Apollo provides tools and insights to optimize your ${k} processes.`,
      `Practical ${k} techniques for sales organizations. See how Apollo's platform enables teams to implement and scale ${k} effectively.`,
      `${k.charAt(0).toUpperCase() + k.slice(1)} fundamentals and best practices for modern sales teams. Apollo helps streamline ${k} workflows and drive results.`
    ];
    // Note: For SEO, descriptions should ideally be 150-160 characters, but we show full content in UI for user review
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Get random CTA anchor text to ensure even distribution
   * Why this matters: Prevents LLM bias toward first option in the list
   */
  const getRandomCTAAnchorText = (): string => {
    const ctaOptions = [
      "Start Your Free Trial",
      "Try Apollo Free", 
      "Start a Trial",
      "Schedule a Demo",
      "Request a Demo", 
      "Start Prospecting",
      "Get Leads Now"
    ];
    
    // Use random selection to ensure even distribution
    const randomIndex = Math.floor(Math.random() * ctaOptions.length);
    const selectedCTA = ctaOptions[randomIndex];
    console.log(`🎯 [CompetitorModal] Selected CTA anchor text: "${selectedCTA}" (${randomIndex + 1}/${ctaOptions.length})`);
    return selectedCTA;
  };

  // Load initial content from row
  useEffect(() => {
    if (!isOpen) return;
    setGeneratedContent(row.output || '');
    setEditableContent(row.output || '');
    
    // Load workflow data from localStorage if available
    try {
      const savedWorkflow = localStorage.getItem(`apollo_competitor_workflow_${row.id}`);
      if (savedWorkflow) {
        const parsedWorkflow = JSON.parse(savedWorkflow);
        console.log('📊 Loaded saved workflow data for row:', row.id);
        setWorkflowData(parsedWorkflow);
      }
    } catch (e) {
      console.error('Failed to load workflow data:', e);
    }
    
        // Load saved meta fields from localStorage if they exist
    // We no longer auto-generate meta fields - they come from content generation
    const content = row.output || '';
    if (content.trim().length > 0 && !metaSeoTitle && !metaDescription) {
      // Check if meta fields are already in row.metadata (from backend)
      if ((row.metadata as any)?.metaSeoTitle || (row.metadata as any)?.metaDescription) {
        // Already set from metadata, skip loading from localStorage
        return;
      }
      
      // Load from localStorage if previously saved
      try {
        const savedMeta = localStorage.getItem(`apollo_competitor_meta_${row.id}`);
        if (savedMeta) {
          const { metaSeoTitle: savedTitle, metaDescription: savedDesc } = JSON.parse(savedMeta);
          if (savedTitle || savedDesc) {
            setMetaSeoTitle(savedTitle || '');
            setMetaDescription(savedDesc || '');
            return;
          }
        }
      } catch {}
    }
  }, [isOpen, row.output]);

  // Load brand kit if not provided via props (draft first, then saved). Keep in sync with Blog/Content modals.
  useEffect(() => {
    const loadBrandKit = () => {
      if (brandKit) {
        setResolvedBrandKit(brandKit);
        return;
      }
      try {
        const draft = localStorage.getItem('apollo_brand_kit_draft');
        const saved = localStorage.getItem('apollo_brand_kit');
        const data = draft || saved;
        if (data) {
          setResolvedBrandKit(JSON.parse(data));
        } else {
          setResolvedBrandKit(null);
        }
      } catch {
        setResolvedBrandKit(null);
      }
    };
    loadBrandKit();
  }, [brandKit]);

  // Listen for brand kit updates (same-tab custom event and storage) and refresh immediately
  useEffect(() => {
    const loadBK = () => {
      try {
        const draft = localStorage.getItem('apollo_brand_kit_draft');
        const saved = localStorage.getItem('apollo_brand_kit');
        const data = draft || saved;
        setResolvedBrandKit(data ? JSON.parse(data) : null);
      } catch {
        setResolvedBrandKit(null);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'apollo_brand_kit' || e.key === 'apollo_brand_kit_draft') loadBK();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('apollo_brand_kit_updated', loadBK as any);
    // Initial sync on mount of this effect
    loadBK();
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('apollo_brand_kit_updated', loadBK as any);
    };
  }, []);

  // Load saved prompts if present, else keep generated defaults
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(`apollo_competitor_prompts_draft_${row.id}`);
      if (saved) {
        const { systemPrompt: savedSystem, userPrompt: savedUser } = JSON.parse(saved);
        if (typeof savedSystem === 'string') setSystemPrompt(savedSystem);
        if (typeof savedUser === 'string') setUserPrompt(savedUser);
      }
    } catch (err) {
      // ignore bad JSON
      console.warn('[CompetitorContentActionModal] Failed to load saved prompts', err);
    }
  }, [isOpen, row.id]);

  // Auto-save prompts when they change (debounced)
  useEffect(() => {
    if (!isOpen || !hasUserInput) return;
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    setAutoSaveStatus('saving');
    const timeout = setTimeout(() => {
      try {
        const promptsData = {
          systemPrompt,
          userPrompt,
          rowId: row.id,
          lastModified: new Date().toISOString()
        };
        localStorage.setItem(`apollo_competitor_prompts_draft_${row.id}`, JSON.stringify(promptsData));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch {
        setAutoSaveStatus('');
      }
    }, 1000);
    setAutoSaveTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [systemPrompt, userPrompt, isOpen, hasUserInput, row.id]);

  // Clear auto-save state on close
  useEffect(() => {
    if (!isOpen) {
      setAutoSaveStatus('');
      setHasUserInput(false);
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        setAutoSaveTimeout(null);
      }
    }
  }, [isOpen, autoSaveTimeout]);

  /**
   * defaultSystemPrompt / defaultUserPrompt
   * Why this matters: Prompts are tailored to “beat the competitor URL” using deep research and gap analysis.
   */
  const defaultSystemPrompt = useMemo(() => {
    return `You are an elite content strategist and writer. Your goal is to generate a comprehensive, AEO-optimized article that explicitly outperforms a specific competitor page for the target keyword. You must:
- Cover all core topics the competitor covers, but with clearer structure and more depth
- Incorporate unique insights from independent deep research
- Address gaps identified by gap analysis
- Produce clean markdown with proper H1/H2/H3, tables when helpful, and inline citations [anchor](URL)
- End with a strong conclusion and clear CTA to try Apollo for free`;
  }, []);

  const defaultUserPrompt = useMemo(() => {
    // Select random CTA to prevent LLM bias
    const selectedCTA = getRandomCTAAnchorText();
    
    // Build deep research and gap analysis context if available
    let researchContext = '';
    if (workflowData?.deep_research) {
      const insights = workflowData.deep_research?.research_findings?.key_insights || [];
      if (insights.length > 0) {
        researchContext += `\nDEEP RESEARCH INSIGHTS:\n${JSON.stringify(insights, null, 2)}\n`;
      }
    }
    if (workflowData?.gap_analysis) {
      const gaps = workflowData.gap_analysis?.analysis_summary?.identified_gaps || [];
      const strategy = workflowData.gap_analysis?.content_strategy || {};
      if (gaps.length > 0 || strategy.primary_angle) {
        researchContext += `\nGAP ANALYSIS:\n- Identified Gaps: ${JSON.stringify(gaps, null, 2)}`;
        if (strategy.primary_angle) {
          researchContext += `\n- Primary Angle: ${strategy.primary_angle}`;
        }
        if (strategy.content_structure_recommendations) {
          researchContext += `\n- Structure Recommendations: ${JSON.stringify(strategy.content_structure_recommendations, null, 2)}`;
        }
        researchContext += '\n';
      }
    }
    
    return `OBJECTIVE: Outperform this competitor page for "${row.keyword}": ${row.url}

TARGET AUDIENCE: {{ brand_kit.ideal_customer_profile }}
BRAND CONTEXT: {{ brand_kit.about_brand }}
COMPETITORS: {{ brand_kit.competitors }}
BRAND POV: {{ brand_kit.brand_point_of_view }}${researchContext ? '\n' + researchContext : ''}

CONTENT REQUIREMENTS:
1) Analyze and outperform the competitor URL above
2) Use {{ brand_kit.tone_of_voice }} tone throughout
3) Follow these writing rules: {{ brand_kit.writing_rules }}
4) Apply {{ brand_kit.header_case_type }} for headers
5) Include substantial unique insights that competitor lacks${workflowData ? ' (leverage deep research insights above)' : ''}
6) Use markdown with proper headers, lists, and tables
7) Include inline hyperlink citations
8) End with "Getting Started with ${row.keyword}" section
9) Include CTA using this exact anchor text: "${selectedCTA}" - always link to the UTM-tracked Apollo signup URL${workflowData ? '\n10) Address all identified gaps from the gap analysis above' : ''}

The content should be comprehensive, authoritative, and clearly superior to the competitor page.`;
  }, [row.keyword, row.url, workflowData]);

  /**
   * generateInitialPrompts
    * Why this matters: Ensures competitor context and deep research/gap analysis outputs are
    * explicitly injected into the prompts, and brand kit variables are required throughout.
    * Produces consistent, JSON-structured output (content + meta fields) and formatting.
   */
  const generateInitialPrompts = () => {
    const currentYear = 2025;
    // Select random CTA to prevent LLM bias
    const selectedCTA = getRandomCTAAnchorText();
    // Extract workflow data from the row
    const workflowData = row.workflowDetails ? {
      deep_research: row.workflowDetails.deepResearch,
      gap_analysis: row.workflowDetails.gapAnalysis
    } : null;
    
    // Debug log to see what workflow data is available
    if (workflowData) {
      console.log('🔬 Workflow data available for prompt generation:', {
        hasDeepResearch: !!workflowData.deep_research,
        hasGapAnalysis: !!workflowData.gap_analysis,
        deepResearchKeys: workflowData.deep_research ? Object.keys(workflowData.deep_research) : [],
        gapAnalysisKeys: workflowData.gap_analysis ? Object.keys(workflowData.gap_analysis) : []
      });
    } else {
      console.log('📝 No workflow data available for this row');
    }
    
    const systemPromptTemplate = `You are a world-class SEO, AEO, and LLM SEO content marketer for Apollo with deep expertise in creating comprehensive, AI-optimized articles that rank highly and get cited by AI answer engines (ChatGPT, Perplexity, Gemini, Claude, etc.). Your specialty is transforming content briefs into definitive resources that become the go-to sources for specific topics.

CRITICAL CONTENT PHILOSOPHY:
Your goal is to create content that becomes the definitive, comprehensive resource on the topic - the content that other creators reference and that AI engines cite as authoritative.

CONTENT COVERAGE REQUIREMENTS:
- Address ALL aspects of the topic comprehensively
- Include practical, actionable guidance that readers can implement
- Provide genuine value that advances knowledge in the space
- Cover both current best practices AND emerging trends
- Include specific examples, metrics, and concrete details

COMPETITOR CONTEXT (MANDATORY):
- Target Keyword: must align with the user's target keyword
- Target Competitor URL: must be analyzed and explicitly outperformed in depth, clarity, and usefulness

BRAND CONTEXT (MUST INCORPORATE THROUGHOUT):
- Brand URL: {{ brand_kit.url }}
- About Brand: {{ brand_kit.about_brand }}
- Target Audience: {{ brand_kit.ideal_customer_profile }}
- Competitors: {{ brand_kit.competitors }}
- Brand POV: {{ brand_kit.brand_point_of_view }}
- Tone: {{ brand_kit.tone_of_voice }}
- Writing Rules: {{ brand_kit.writing_rules }}

AEO (ANSWER ENGINE OPTIMIZATION) PRINCIPLES:
- Structure for extractability with clear, self-contained insights
- Use semantic HTML and proper heading hierarchy (<h1> → <h2> → <h3>)
- Format data in proper <table> and <ul>/<ol> structures for easy AI parsing
- Include specific examples, metrics, and concrete details
- Write headlines that match search intent ("How to...", "What is...", "Best ways to...")
- Place the most important answer in the first paragraph under each heading

FORMATTING REQUIREMENTS:
1. **Proper HTML Structure:**
   - Use <h1> for main title, <h2> for major sections, <h3> for subsections
   - Format all lists with proper <ul>/<ol>, and <li> tags
   - Use <table> elements for any comparative data, features, or structured information
   - Include <p> tags for all paragraphs
   - Use <strong> for emphasis and key concepts

2. **Tables and Structured Data:**
   - When presenting comparisons, features, pricing, or any structured data, ALWAYS use HTML tables
   - Include proper <thead>, <tbody>, <th>, and <td> elements
   - Use tables for: feature comparisons, pricing tiers, pros/cons, statistics, timelines, etc.

3. **Brand Kit Variable Integration:**
   - MUST process and include brand kit variables naturally throughout content
   - Use {{ brand_kit.ideal_customer_profile }} for testimonials and customer examples
   - Include {{ brand_kit.competitors }} when discussing competitive landscape
   - Reference {{ brand_kit.brand_point_of_view }} in strategic sections
   - End with strong CTA using this exact anchor text: "${selectedCTA}"
   - Apply {{ brand_kit.tone_of_voice }} consistently throughout
   - Follow {{ brand_kit.writing_rules }} for style and approach

IMPORTANT: The current year is ${currentYear}. When referencing "current year," "this year," or discussing recent trends, always use ${currentYear}. Do not reference 2024 or earlier years as current.

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY clean HTML content without any markdown code blocks, explanatory text, or meta-commentary
- DO NOT include phrases like "Here's the content:" or HTML code block markers
- Start directly with the HTML content and end with the closing HTML tag
- No markdown formatting, no code block indicators, no explanatory paragraphs

CONTENT STRUCTURE REQUIREMENTS:
1. **Compelling H1 Headline** (question format when appropriate)
2. **Authority-Establishing Introduction** (preview value and set expectations)
3. **Comprehensive Sections** with proper H2/H3 hierarchy
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

    // Build research context for the prompt - format it clearly for user visibility
    let researchSection = '';
    if (workflowData?.deep_research || workflowData?.gap_analysis) {
      researchSection = '\n\n' + '═'.repeat(50) + '\n';
      researchSection += '📊 RESEARCH & ANALYSIS CONTEXT\n';
      researchSection += '═'.repeat(50) + '\n';
      
      // Add deep research insights with clear formatting
      if (workflowData?.deep_research) {
        const insights = workflowData.deep_research?.research_findings?.key_insights || [];
        if (insights.length > 0) {
          researchSection += '\n🔍 DEEP RESEARCH INSIGHTS (MUST INCORPORATE):\n';
          researchSection += '─'.repeat(40) + '\n';
          insights.forEach((insight: string, index: number) => {
            researchSection += `  ${index + 1}. ${insight}\n`;
          });
        }
        
        // Add additional research details if available
        const marketInsights = workflowData.deep_research?.research_findings?.market_insights || [];
        if (marketInsights.length > 0) {
          researchSection += '\n📈 MARKET INSIGHTS:\n';
          researchSection += '─'.repeat(40) + '\n';
          marketInsights.forEach((insight: string, index: number) => {
            researchSection += `  ${index + 1}. ${insight}\n`;
          });
        }
        
        const audienceInsights = workflowData.deep_research?.research_findings?.audience_insights || [];
        if (audienceInsights.length > 0) {
          researchSection += '\n👥 AUDIENCE INSIGHTS:\n';
          researchSection += '─'.repeat(40) + '\n';
          audienceInsights.forEach((insight: string, index: number) => {
            researchSection += `  ${index + 1}. ${insight}\n`;
          });
        }
      }
      
      // Add gap analysis with enhanced visibility
      if (workflowData?.gap_analysis) {
        const gaps = workflowData.gap_analysis?.analysis_summary?.identified_gaps || [];
        const strategy = workflowData.gap_analysis?.content_strategy || {};
        
        if (gaps.length > 0) {
          researchSection += '\n🎯 CONTENT GAPS TO ADDRESS:\n';
          researchSection += '─'.repeat(40) + '\n';
          gaps.forEach((gap: string, index: number) => {
            researchSection += `  ${index + 1}. ${gap}\n`;
          });
        }
        
        if (strategy.primary_angle) {
          researchSection += '\n💡 PRIMARY CONTENT ANGLE:\n';
          researchSection += '─'.repeat(40) + '\n';
          researchSection += `  ${strategy.primary_angle}\n`;
        }
        
        if (strategy.content_structure_recommendations?.length > 0) {
          researchSection += '\n📝 STRUCTURE RECOMMENDATIONS:\n';
          researchSection += '─'.repeat(40) + '\n';
          strategy.content_structure_recommendations.forEach((rec: string, index: number) => {
            researchSection += `  ${index + 1}. ${rec}\n`;
          });
        }
        
        const seoSuggestions = strategy.seo_suggestions || strategy.seo_optimization_suggestions || [];
        if (seoSuggestions.length > 0) {
          researchSection += '\n🔧 SEO OPTIMIZATION SUGGESTIONS:\n';
          researchSection += '─'.repeat(40) + '\n';
          seoSuggestions.forEach((suggestion: string, index: number) => {
            researchSection += `  ${index + 1}. ${suggestion}\n`;
          });
        }
        
        // Add competitive advantages if available
        const competitiveAdvantages = workflowData.gap_analysis?.analysis_summary?.competitive_advantages || [];
        if (competitiveAdvantages.length > 0) {
          researchSection += '\n⚡ COMPETITIVE ADVANTAGES:\n';
          researchSection += '─'.repeat(40) + '\n';
          competitiveAdvantages.forEach((advantage: string, index: number) => {
            researchSection += `  ${index + 1}. ${advantage}\n`;
          });
        }
      }
      
      researchSection += '\n' + '═'.repeat(50) + '\n';
      researchSection += '📌 END OF RESEARCH CONTEXT\n';
      researchSection += '═'.repeat(50) + '\n';
    }
    
    const userPromptTemplate = `OBJECTIVE: Outperform this competitor page for "${row.keyword}": ${row.url}

BRAND CONTEXT:
- About: {{ brand_kit.about_brand }}
- Target Audience: {{ brand_kit.ideal_customer_profile }}
- Competitors: {{ brand_kit.competitors }}
- Brand POV: {{ brand_kit.brand_point_of_view }}
- Tone: {{ brand_kit.tone_of_voice }}
- Writing Rules: {{ brand_kit.writing_rules }}${researchSection}${workflowData ? `

⚠️ IMPORTANT RESEARCH INTEGRATION REQUIREMENTS:
────────────────────────────────────────
The above RESEARCH & ANALYSIS CONTEXT contains:
• Deep research insights from comprehensive analysis
• Identified content gaps from competitor analysis
• Strategic recommendations for content structure
• SEO optimization suggestions
• Market and audience insights

YOU MUST:
✓ Incorporate ALL deep research insights listed above
✓ Address ALL identified content gaps
✓ Follow the primary content angle recommendation
✓ Implement ALL structure recommendations
✓ Apply ALL SEO optimization suggestions
────────────────────────────────────────` : ''}

Create comprehensive AEO-optimized content for ${currentYear} that explicitly outperforms the competitor URL above.

CRITICAL CONTENT REQUIREMENTS:

1. HTML Structure & Formatting:
   - Create an H1 title that directly addresses the keyword (use question format when appropriate)
   - Use proper heading hierarchy with H2 for major sections, H3 for subsections
   - Format ALL lists with proper <ul>/<ol> and <li> tags
   - Create HTML tables for ANY structured data (features, comparisons, statistics, timelines)
   - Use <p> tags for all paragraphs, <strong> for emphasis

2. Required Tables/Structured Data:
   - Include at least 2-3 HTML tables presenting relevant information such as:
     * Feature comparisons or capability matrices
     * Implementation timelines or process steps
     * Statistics or performance metrics
     * Pricing or value comparisons
     * Best practices checklist
   - Format tables with proper <thead>, <tbody>, <th>, and <td> elements

3. Brand Kit Variable Integration (MANDATORY):
   - Use {{ brand_kit.ideal_customer_profile }} to include customer testimonials or examples (at least once)
   - Reference {{ brand_kit.competitors }} when discussing market landscape
   - Apply {{ brand_kit.brand_point_of_view }} in strategic sections
   - Follow {{ brand_kit.tone_of_voice }} throughout the content
   - Implement {{ brand_kit.writing_rules }} for style consistency
   - End with the mandatory conclusion structure including CTA using this exact anchor text: "${selectedCTA}"

4. Content Depth & Value:
   - Provide comprehensive coverage that serves as the definitive resource
   - Include practical, actionable guidance with specific examples
   - Address both current best practices and emerging trends for ${currentYear}
   - Cover implementation strategies with step-by-step processes
   - Include relevant metrics, benchmarks, and data points${workflowData ? `
   
   📊 RESEARCH-DRIVEN REQUIREMENTS:
   - MANDATORY: Incorporate ALL deep research insights from the RESEARCH CONTEXT section
   - MANDATORY: Address ALL content gaps identified in the gap analysis above
   - MANDATORY: Follow the primary content angle specified in the research
   - MANDATORY: Implement ALL structure recommendations provided
   - MANDATORY: Include market and audience insights where relevant` : ''}

5. AEO Optimization:
   - Structure content for AI answer engine extraction
   - Use semantic HTML elements appropriately
   - Include self-contained insights that can be cited independently
   - Write clear, precise language that AI can easily understand
   - Format for both deep reading and quick reference

6. Technical Requirements:
   - Do NOT use emdashes (—) in the content
   - Avoid AI-detectable phrases like "It's not just about..., it's..." or "This doesn't just mean..., it also means..."
   - Include inline links to relevant external resources: <a href="URL" target="_blank">anchor text</a>

CRITICAL OUTPUT FORMAT: Respond with a JSON object containing exactly three fields:
{
  "content": "Complete HTML article with proper structure, tables, and brand kit variables processed",
  "metaSeoTitle": "AEO-optimized title for AI search engines (<= 60 characters + ' | Apollo')",
  "metaDescription": "Natural, value-focused description (150-160 chars) optimized for AI search extraction"
}

META FIELD REQUIREMENTS FOR AI SEARCH OPTIMIZATION:

metaSeoTitle:
- MUST be a natural question format that includes the main keyword
- Choose format based on keyword type:
  * Job titles (singular): "Who Is A [Job Title]? [Descriptive Context]" (e.g., "Who Is An SDR Manager? Roles, Responsibilities, Salary")
  * Job titles (plural): "Who Are [Job Titles]? [Descriptive Context]" (e.g., "Who Are Sales Consultants? Roles, Skills, Career Path")
  * Processes/concepts: "What Is [Process]? [Descriptive Context]" (e.g., "What Is Sales Prospecting? Strategies, Tools, Best Practices")
  * Tools/software: "How Does [Tool] Work? [Descriptive Context]" (e.g., "How Does CRM Software Work? Features, Benefits, Implementation")
  * Strategies/methods: "Why Use [Strategy]? [Descriptive Context]" (e.g., "Why Use Account-Based Marketing? Benefits, Process, ROI")
- Maximum 70 characters INCLUDING " | Apollo" (total <= 70 chars)
- MUST use proper Title Case (capitalize all major words)
- MUST include descriptive context beyond just the basic question
- Add relevant descriptive elements: roles, responsibilities, salary, benefits, strategies, tools, best practices, etc.
- The keyword should appear naturally and grammatically correctly
- Optimize for AI search engines with human-like, intelligent phrasing

metaDescription:
- MUST directly answer the title question using the main keyword naturally
- Adapt answer format to keyword type:
  * Job roles: "A [Job Title] is [role definition/who they are]. They [main responsibilities/activities]. Apollo helps [job titles] [specific benefit]."
  * Processes: "[Process] is [definition]. It involves [key steps]. Apollo provides [specific tools/features]."
  * Tools: "[Tool] helps [main function]. It [key capabilities]. Apollo offers [specific advantage]."
- Exactly 150-160 characters
- Must be complete sentences ending with a period
- Write naturally with proper grammar and intelligent phrasing

INTELLIGENT QUESTION-ANSWER FORMAT EXAMPLES:

• Job Title (Singular): "Who Is An SDR Manager? Roles, Responsibilities, Salary | Apollo"
  Description: "An SDR Manager is a sales leader who oversees development teams and prospecting strategies. They coach reps and optimize processes. Apollo helps SDR Managers track team performance."

• Job Title (Plural): "Who Are Sales Consultants? Skills, Career Path, Salary | Apollo"
  Description: "Sales Consultants are professionals who advise prospects on solutions for their business needs. They build relationships and close deals. Apollo provides consultants with prospect intelligence."

• Process/Concept: "What Is Cold Email Marketing? Strategies, Tools, Best Practices | Apollo"
  Description: "Cold email marketing is outreach to prospects without prior contact. It uses personalized messages to generate leads. Apollo provides templates and automation tools."

• Strategy/Method: "Why Use Account-Based Marketing? Benefits, Process, ROI | Apollo"
  Description: "Account-based marketing targets specific high-value accounts with personalized campaigns. It aligns sales and marketing teams. Apollo enables ABM with contact data."

ABSOLUTELY FORBIDDEN IN META FIELDS:
- Grammatically incorrect questions ("What Is A Sales Consultants?", "What Are A Sales Consultant?", "What Is A Account Executives?")
- Including "| Apollo" in H1 headlines (that's only for SEO titles, not content headlines)
- Robotic/boilerplate phrasing that doesn't sound human-written
- Rigid "What Is [keyword]?" format for all keyword types without considering singular/plural grammar
- Non-question titles ("Sales Prospecting Tips", "Lead Generation Methods")
- The word "Guide" or "Guides" (use intelligent question format instead)
- "Complete Guide" or "Comprehensive Guide" (use appropriate question type)
- "Ultimate Guide" (use natural question format)
- Descriptions that don't answer the title question directly
- Descriptions that don't include the main keyword naturally
- Marketing language like "game-changing", "revolutionary", "ultimate"
- Vague promises like "strategies", "frameworks", "playbooks" without specifics
- Generic terms like "everything you need to know"

CRITICAL: YOU MUST RETURN ONLY VALID JSON - NO OTHER TEXT ALLOWED
- Start response with { and end with }
- NO text before or after JSON
- NO markdown code blocks
- NO explanations like "Here is your JSON:"
- Put ALL HTML inside the content field as a properly escaped JSON string
- Escape ALL quotes with backslashes (\\" not ")
- Do NOT include literal newlines or unescaped quotes in JSON strings`;

    setSystemPrompt(systemPromptTemplate);
    setUserPrompt(userPromptTemplate);
  };

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    
      // Initialize content from row.output like BlogContentActionModal does
  const content = row.output || '';
  if (content.trim().length > 0) {
    console.log('📊 Initializing CompetitorContentActionModal with existing content for keyword:', row.keyword);
    console.log('🔄 Content length:', content.length, 'characters');
    
    // Check if meta fields are already in row.metadata (from backend)
    const metadataHasMeta = row.metadata?.metaSeoTitle || row.metadata?.metaDescription;
    console.log('🔍 Checking for meta fields in row.metadata:', {
      hasMetaSeoTitle: !!row.metadata?.metaSeoTitle,
      hasMetaDescription: !!row.metadata?.metaDescription,
      metaSeoTitle: row.metadata?.metaSeoTitle,
      metaDescription: row.metadata?.metaDescription,
      fullMetadata: row.metadata
    });
    
    // Parse the existing content to extract meta fields if present
    const parsed = parseAIResponse(content);
    console.log('🔍 Content format analysis:', {
      originalLength: content.length,
      parsedLength: parsed.content.length,
      hasMarkdownHeaders: parsed.content.includes('# ') || parsed.content.includes('## '),
      hasHTMLTags: parsed.content.includes('<h1>') || parsed.content.includes('<p>'),
      originalSample: content.substring(0, 200),
      parsedSample: parsed.content.substring(0, 200),
      metadataHasMeta,
      parsedMetaSeoTitle: parsed.metaSeoTitle,
      parsedMetaDescription: parsed.metaDescription
    });
    
    // Convert to HTML if content appears to be in markdown format
    let displayContent = parsed.content;
    const hasMarkdownSyntax = parsed.content.includes('**') || 
                             parsed.content.includes('# ') || 
                             parsed.content.includes('## ') ||
                             parsed.content.includes('* ') ||
                             parsed.content.includes('[') && parsed.content.includes('](');
    const hasHTMLTags = parsed.content.includes('<h1>') || 
                       parsed.content.includes('<p>') || 
                       parsed.content.includes('<strong>');
    
    console.log('🔄 Cleaning AI content using BlogContentActionModal logic');
    console.log('🔍 Before cleaning (first 500 chars):', parsed.content.substring(0, 500));
    displayContent = cleanAIContent(parsed.content);
    console.log('🔍 After cleaning (first 500 chars):', displayContent.substring(0, 500));
    
    setGeneratedContent(displayContent);
    setEditableContent(parsed.content); // Keep original format for editing
    setIsEditingContent(false);
    
    // Set meta fields from metadata first, then parsed content, then fallbacks
    // Why this matters: We prioritize AI-generated meta fields from the backend over fallbacks
    const hasMetaTitle = row.metadata?.metaSeoTitle && row.metadata.metaSeoTitle.length > 0;
    const hasMetaDesc = row.metadata?.metaDescription && row.metadata.metaDescription.length > 0;
    
    if (hasMetaTitle && row.metadata?.metaSeoTitle) {
      console.log('✅ Using AI-generated meta title from metadata:', row.metadata.metaSeoTitle);
      setMetaSeoTitle(row.metadata.metaSeoTitle);
    } else if (parsed.metaSeoTitle && parsed.metaSeoTitle !== generateFallbackTitle(row.keyword)) {
      console.log('✅ Using AI-generated meta title from parsed content:', parsed.metaSeoTitle);
      setMetaSeoTitle(parsed.metaSeoTitle);
    } else {
      console.log('⚠️ Using fallback meta title - AI generation may have failed');
      setMetaSeoTitle(generateFallbackTitle(row.keyword));
    }
    
    if (hasMetaDesc && row.metadata?.metaDescription) {
      console.log('✅ Using AI-generated meta description from metadata:', row.metadata.metaDescription);
      setMetaDescription(row.metadata.metaDescription);
    } else if (parsed.metaDescription && parsed.metaDescription !== generateFallbackDescription(row.keyword)) {
      console.log('✅ Using AI-generated meta description from parsed content:', parsed.metaDescription);
      setMetaDescription(parsed.metaDescription);
    } else {
      console.log('⚠️ Using fallback meta description - AI generation may have failed');
      setMetaDescription(generateFallbackDescription(row.keyword));
    }
      
      console.log('✅ Content initialized:', {
        contentLength: parsed.content.length,
        hasTitle: !!parsed.metaSeoTitle,
        hasDescription: !!parsed.metaDescription
      });
    } else {
      console.log('📝 No existing content found for row:', row.id);
    }
    
    // Load saved prompts; only generate defaults if none saved
    try {
      const saved = localStorage.getItem(`apollo_competitor_prompts_draft_${row.id}`);
      if (saved) {
        const { systemPrompt: savedSystem, userPrompt: savedUser } = JSON.parse(saved);
        const hasSaved = (typeof savedSystem === 'string' && savedSystem.length > 0) || (typeof savedUser === 'string' && savedUser.length > 0);
        if (hasSaved) {
          if (typeof savedSystem === 'string') setSystemPrompt(savedSystem);
          if (typeof savedUser === 'string') setUserPrompt(savedUser);
          return;
        }
      }
    } catch {}
    // No saved prompts → set defaults
    generateInitialPrompts();
  }, [isOpen, row.id, row.output]);

  // Add CSS for content formatting (same as BlogContentActionModal)
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .competitor-content-display {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #374151;
      }

      .competitor-content-display h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 1.5rem 0;
        line-height: 1.2;
        border-bottom: 0.125rem solid #f3f4f6;
        padding-bottom: 0.75rem;
      }

      .competitor-content-display h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin: 2rem 0 1rem 0;
        line-height: 1.3;
      }

      .competitor-content-display h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #374151;
        margin: 1.5rem 0 0.75rem 0;
        line-height: 1.4;
      }

      .competitor-content-display p {
        margin: 0 0 1.25rem 0;
        line-height: 1.7;
      }

      .competitor-content-display ul, 
      .competitor-content-display ol {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }

      .competitor-content-display li {
        margin: 0.5rem 0;
        line-height: 1.6;
      }

      .competitor-content-display strong {
        font-weight: 600;
        color: #111827;
      }

      .competitor-content-display table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .competitor-content-display thead {
        background-color: #f9fafb;
      }

      .competitor-content-display th {
        padding: 0.875rem 1rem;
        text-align: left;
        font-weight: 600;
        color: #374151;
        border-bottom: 2px solid #e5e7eb;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .competitor-content-display td {
        padding: 0.875rem 1rem;
        border-bottom: 1px solid #f3f4f6;
        color: #6b7280;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .competitor-content-display tbody tr:hover {
        background-color: #f9fafb;
      }

      .competitor-content-display tbody tr:last-child td {
        border-bottom: none;
      }

      .competitor-content-display th:first-child,
      .competitor-content-display td:first-child {
        padding-left: 1.25rem;
      }

      .competitor-content-display th:last-child,
      .competitor-content-display td:last-child {
        padding-right: 1.25rem;
      }

      .competitor-content-display a {
        color: #2563eb;
        text-decoration: none;
      }

      .competitor-content-display a:hover {
        text-decoration: underline;
      }

      .competitor-content-display blockquote {
        border-left: 4px solid #e5e7eb;
        padding-left: 1rem;
        margin: 1.5rem 0;
        font-style: italic;
        color: #6b7280;
      }

      .competitor-content-display code {
        background-color: #f3f4f6;
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875em;
      }

      .competitor-content-display pre {
        background-color: #f8fafc;
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 1rem 0;
        border: 1px solid #e2e8f0;
      }

      .competitor-content-display pre code {
        background-color: transparent;
        padding: 0;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  /**
   * cleanAIContent (copied from BlogContentActionModal)
   * Why this matters: Uses the exact same content cleaning logic as BlogContentActionModal for consistency
   */
  const cleanAIContent = (content: string): string => {
    let cleaned = content;
    
    // Remove JSON metadata that might be mixed in with content
    cleaned = cleaned.replace(/\{\s*"metaSeoTitle"\s*:\s*"[^"]*"\s*,[\s\S]*?\}/g, '');
    cleaned = cleaned.replace(/\{\s*"content"\s*:\s*"[\s\S]*?"metaSeoTitle"[\s\S]*?\}/g, '');
    
    // Remove literal JSON structure that appears as text content
    cleaned = cleaned.replace(/^\s*\{\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*"content":\s*"?\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*\}\s*$/gm, '');
    cleaned = cleaned.replace(/^[\s\n]*\{[\s\n]*"content":\s*"[\s\n]*/i, '');
    cleaned = cleaned.replace(/[\s\n]*"\s*\}[\s\n]*$/i, '');
    
    // Handle the specific pattern: { "content": " at the start
    cleaned = cleaned.replace(/^\s*\{\s*\n?\s*"content":\s*"\s*\n?\s*/i, '');
    // Handle trailing patterns
    cleaned = cleaned.replace(/\s*"\s*,?\s*"metaSeoTitle"[\s\S]*$/i, '');
    cleaned = cleaned.replace(/\s*"\s*\}\s*$/i, '');
    
    // Clean up literal escape sequences that appear as text
    cleaned = cleaned.replace(/^\s*\\n\\n\s*/, '');
    cleaned = cleaned.replace(/\s*\\n\\n\s*$/, '');
    cleaned = cleaned.replace(/\\n\\n/g, '\n\n');
    cleaned = cleaned.replace(/\\n/g, '\n');
    cleaned = cleaned.replace(/\\t/g, '\t');
    cleaned = cleaned.replace(/\\"/g, '"');
    
    // Reduce excessive bold formatting - keep only strategic emphasis
    // Remove bold from entire sentences (more than 8 words)
    cleaned = cleaned.replace(/<strong>([^<]{60,}?)<\/strong>/g, '$1');
    // Remove bold from percentage/number + text combinations that are too long
    cleaned = cleaned.replace(/<strong>(\d+%?\s+[^<]{20,}?)<\/strong>/g, '<strong>$1</strong>'.replace(/<strong>(\d+%?\s+\w+\s+\w+)\s+([^<]+)<\/strong>/, '<strong>$1</strong> $2'));
    // Keep bold only for short key terms (under 4 words)
    cleaned = cleaned.replace(/<strong>([^<]*?\s+[^<]*?\s+[^<]*?\s+[^<]*?\s+[^<]+?)<\/strong>/g, (match, content) => {
      const words = content.trim().split(/\s+/);
      if (words.length <= 3) return match; // Keep short phrases
      if (/^\d+%/.test(content.trim())) return match; // Keep percentages
      return content; // Remove bold from longer phrases
    });
    
    // Remove common AI introductory phrases
    cleaned = cleaned.replace(/^.*?Here's the.*?content.*?:?\s*/i, '');
    cleaned = cleaned.replace(/^.*?Here's an.*?optimized.*?:?\s*/i, '');
    cleaned = cleaned.replace(/^.*?I'll create.*?:?\s*/i, '');
    cleaned = cleaned.replace(/^.*?Based on.*?analysis.*?:?\s*/i, '');
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```html\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    
    // Convert markdown headers to HTML headers (robust: allow leading spaces, all levels)
    // Why this matters: AI sometimes returns markdown instead of HTML despite instructions
    cleaned = cleaned.replace(/^\s*(#{1,6})\s+(.+)$/gm, (_m, hashes: string, text: string) => {
      const level = Math.min(Math.max(hashes.length, 1), 6);
      return `<h${level}>${text.trim()}</h${level}>`;
    });
    
    // Convert markdown bold and italic to HTML
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    cleaned = cleaned.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Convert markdown links to HTML anchors (open in new tab)
    cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Convert inline code to <code>
    cleaned = cleaned.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert blockquotes
    cleaned = cleaned.replace(/^>\s?(.*)$/gm, '<blockquote>$1</blockquote>');

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

    // Convert markdown tables (pipe syntax) to HTML tables
    // Why this matters: Ensures tables render properly instead of raw pipes
    const lines = cleaned.split(/\n/);
    const htmlLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = /^\s*\|(.+)\|\s*$/.exec(line || '');
      const sepLine = lines[i + 1] || '';
      const isSeparator = /^\s*\|?\s*(:?-{3,}:?\s*\|\s*)+(:?-{3,}:?\s*)\|?\s*$/.test(sepLine);
      if (headerMatch && isSeparator) {
        // Parse header row
        const headers = headerMatch[1].split('|').map(h => h.trim());
        i += 1; // skip separator row
        const bodyRows: string[][] = [];
        let j = i + 1;
        while (j < lines.length) {
          const rowLine = lines[j];
          if (!/^\s*\|(.+)\|\s*$/.test(rowLine)) break;
          const cells = rowLine.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
          bodyRows.push(cells);
          j++;
        }
        // Build HTML table
        const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${bodyRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
        htmlLines.push(`<table>${thead}${tbody}</table>`);
        i = j - 1; // advance pointer to last processed row
        continue;
      }
      htmlLines.push(line);
    }
    cleaned = htmlLines.join('\n');
    
    // Convert remaining plain text paragraphs to HTML paragraphs
    // Split by double newlines and wrap non-HTML content in <p> tags
    const paragraphBlocks = cleaned.split(/\n\s*\n/);
    cleaned = paragraphBlocks.map(line => {
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

    // Secondary pass: for any standalone lines still not wrapped and not HTML, wrap as paragraphs
    cleaned = cleaned.split(/\n/).map((line) => {
      const t = line.trim();
      if (!t) return '';
      const isHtml = /^<\/?(h\d|p|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|pre|code|hr|div|span|a)\b/i.test(t);
      if (isHtml) return line;
      return `<p>${t}</p>`;
    }).join('\n');

    // Convert headings that slipped into <p> tags (e.g., <p># Title</p>)
    cleaned = cleaned.replace(/<p>\s*(#{1,6})\s+([^<]+)<\/p>/g, (_m, hashes: string, text: string) => {
      const level = Math.min(Math.max(hashes.length, 1), 6);
      return `<h${level}>${text.trim()}</h${level}>`;
    });
    
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

    // Final safety: convert any remaining markdown headers and strip stray bold markers
    cleaned = cleaned.replace(/^\s*(#{1,6})\s+(.+)$/gm, (_m, hashes: string, text: string) => {
      const level = Math.min(Math.max(hashes.length, 1), 6);
      return `<h${level}>${text.trim()}</h${level}>`;
    });
    // Remove stray leading '#' characters that survived (e.g., malformed headings)
    cleaned = cleaned.replace(/<p>\s*#+\s*([^<]+)<\/p>/g, '<p>$1</p>');
    cleaned = cleaned.replace(/(^|\n)\s*#+\s*(.+)(?=\n|$)/g, (_m, prefix: string, text: string) => `${prefix}<h2>${text.trim()}</h2>`);

    // Remove '#' prefixes that appear inside already-HTML headings like <h2># Title</h2>
    cleaned = cleaned.replace(/<(h[1-6])>\s*#+\s*([^<]+)<\/\1>/gi, '<$1>$2</$1>');
    // And inside paragraphs just in case
    cleaned = cleaned.replace(/<p>\s*#+\s*([^<]+)<\/p>/gi, '<p>$1</p>');
    // Remove any leftover unmatched ** that weren't part of a valid pair
    cleaned = cleaned.replace(/\*\*/g, '');
    
    return cleaned;
  };

  /**
   * processLiquidVariables
   * Why this matters: Replaces {{ brand_kit.* }} tokens before sending prompts to backend.
   */
  const processLiquidVariables = (text: string, kit: BrandKit | null): string => {
    if (!kit) return text;
    let processed = text;

    // Standard variables
    processed = processed.replace(/\{\{\s*brand_kit\.url\s*\}\}/g, kit.url || '');
    processed = processed.replace(/\{\{\s*brand_kit\.about_brand\s*\}\}/g, kit.aboutBrand || '');
    processed = processed.replace(/\{\{\s*brand_kit\.ideal_customer_profile\s*\}\}/g, kit.idealCustomerProfile || '');
    processed = processed.replace(/\{\{\s*brand_kit\.competitors\s*\}\}/g, kit.competitors || '');
    processed = processed.replace(/\{\{\s*brand_kit\.brand_point_of_view\s*\}\}/g, kit.brandPointOfView || '');
    processed = processed.replace(/\{\{\s*brand_kit\.author_persona\s*\}\}/g, kit.authorPersona || '');
    processed = processed.replace(/\{\{\s*brand_kit\.tone_of_voice\s*\}\}/g, kit.toneOfVoice || '');
    processed = processed.replace(/\{\{\s*brand_kit\.header_case_type\s*\}\}/g, kit.headerCaseType || '');
    processed = processed.replace(/\{\{\s*brand_kit\.writing_rules\s*\}\}/g, kit.writingRules || '');
    // Use random CTA instead of brand kit CTA to maintain even distribution
    processed = processed.replace(/\{\{\s*brand_kit\.cta_text\s*\}\}/g, getRandomCTAAnchorText());
    processed = processed.replace(/\{\{\s*brand_kit\.cta_destination\s*\}\}/g, kit.ctaDestination || '');

    // Competitor-conquesting extras (optional; empty by default)
    processed = processed.replace(/\{\{\s*brand_kit\.research_key_insights\s*\}\}/g, (kit as any)?.research_key_insights || '');
    processed = processed.replace(/\{\{\s*brand_kit\.gap_analysis_summary\s*\}\}/g, (kit as any)?.gap_analysis_summary || '');
    processed = processed.replace(/\{\{\s*brand_kit\.primary_angle\s*\}\}/g, (kit as any)?.primary_angle || '');
    processed = processed.replace(/\{\{\s*brand_kit\.structure_recommendations\s*\}\}/g, (kit as any)?.structure_recommendations || '');
    processed = processed.replace(/\{\{\s*brand_kit\.seo_suggestions\s*\}\}/g, (kit as any)?.seo_suggestions || '');

    // Custom variables
    if (kit.customVariables) {
      Object.keys(kit.customVariables).forEach((key) => {
        const regex = new RegExp(`\\{\\{\\s*brand_kit\\.${key}\\s*\\}}`, 'g');
        processed = processed.replace(regex, kit.customVariables?.[key] || '');
      });
    }
    return processed;
  };

  /**
   * handleCopy
   * Why this matters: Quick copy for moving generated content elsewhere.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isEditingContent ? editableContent : generatedContent || row.output || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  /**
   * handleReset
   * Why this matters: Restores reliable defaults after experimentation.
   */
  const handleReset = () => {
    generateInitialPrompts();
  };

  /**
   * openInHTML
   * Why this matters: Mirrors Blog modal to preview raw HTML in a new tab for debugging and copy.
   */
  const openInHTML = () => {
    const contentToOpen = isEditingContent ? editableContent : generatedContent || row.output || '';
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
    <title>Raw HTML Source - ${metaSeoTitle || `${row.keyword} Content`}</title>
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
        <p><strong>Keyword:</strong> ${row.keyword}</p>
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
   * toggleEditMode
   * Why this matters: Enables inline edits before publishing or copying, consistent with Blog modal.
   */
  const toggleEditMode = () => {
    if (isEditingContent) {
      setGeneratedContent(editableContent);
      onContentUpdate?.(row.id, editableContent);
    } else {
      setEditableContent(generatedContent || row.output || '');
    }
    setIsEditingContent(!isEditingContent);
  };

  /**
   * copy helpers for content & meta fields
   * Why this matters: Provide identical feedback UX to Blog modal.
   */
  const [showCopiedMessage, setShowCopiedMessage] = useState<boolean>(false);
  const copyToClipboard = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedContent || row.output || '';
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
      alert('Failed to copy content. Please select and copy manually.');
    }
  };
  const copyMetaTitle = async () => {
    try { await navigator.clipboard.writeText(metaSeoTitle); setShowMetaTitleCopied(true); setTimeout(() => setShowMetaTitleCopied(false), 2000);} catch {}
  };
  const copyMetaDescription = async () => {
    try { await navigator.clipboard.writeText(metaDescription); setShowMetaDescCopied(true); setTimeout(() => setShowMetaDescCopied(false), 2000);} catch {}
  };

  /**
   * extractFieldsFromMalformedJSON
   * Why this matters: Robustly recover fields when the model returns almost-JSON.
   */
  const extractFieldsFromMalformedJSON = (responseText: string): { content: string; metaSeoTitle: string; metaDescription: string } => {
    let content = '';
    let metaSeoTitle = '';
    let metaDescription = '';
    try {
      const contentMatch = responseText.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:metaSeoTitle|metaDescription)"/);
      if (contentMatch) {
        content = contentMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          // Clean up literal \n\n that appears as text
          .replace(/^\s*\\n\\n\s*/, '')
          .replace(/\s*\\n\\n\s*$/, '')
          .trim();
      }
      const titleMatch = responseText.match(/"metaSeoTitle"\s*:\s*"([^\"]*?)"/);
      if (titleMatch) metaSeoTitle = titleMatch[1];
      const descMatch = responseText.match(/"metaDescription"\s*:\s*"([^\"]*?)"/);
      if (descMatch) metaDescription = descMatch[1];
    } catch {}
    return { content, metaSeoTitle, metaDescription };
  };



  /**
   * parseAIResponse (copied from BlogContentActionModal)
   * Why this matters: Uses the exact same parsing logic as BlogContentActionModal for consistency
   */
  const parseAIResponse = (responseText: string): { content: string; metaSeoTitle: string; metaDescription: string } => {
    // Add detailed logging for debugging
    console.log('🔍 Raw AI Response Length:', responseText.length);
    console.log('🔍 Raw AI Response Preview:', responseText.substring(0, 200) + '...');
    console.log('🔍 Raw AI Response End:', '...' + responseText.substring(responseText.length - 200));
    
    // Check if this is legacy markdown content (not JSON)
    const isLegacyMarkdown = responseText.trim().startsWith('#') || 
                             responseText.trim().startsWith('##') ||
                             (responseText.includes('# ') && !responseText.trim().startsWith('{'));
    
    if (isLegacyMarkdown) {
      console.log('📜 Detected legacy markdown content, converting to expected format');
      return {
        content: cleanAIContent(responseText),
        metaSeoTitle: generateFallbackTitle(row.keyword),
        metaDescription: generateFallbackDescription(row.keyword)
      };
    }
    
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
          
          // Clean up the parsed content to remove literal escape sequences
          let cleanedContent = hasContent ? parsed.content : responseText;
          if (hasContent) {
            // Remove literal \n\n sequences that appear as text
            cleanedContent = cleanedContent
              .replace(/^\s*\\n\\n\s*/, '')
              .replace(/\s*\\n\\n\s*$/, '')
              .replace(/\\n\\n/g, '\n\n')
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .trim();
          }
          
          return {
            content: cleanAIContent(cleanedContent),
            metaSeoTitle: hasTitle ? parsed.metaSeoTitle : generateFallbackTitle(row.keyword), // Use fallback if no AI title
            metaDescription: hasDescription ? parsed.metaDescription : generateFallbackDescription(row.keyword) // Use fallback if no AI description
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
      metaSeoTitle: extractedTitle || generateFallbackTitle(row.keyword),
      metaDescription: extractedDescription || generateFallbackDescription(row.keyword)
    };
  };

  /**
   * Google Docs / Google Sheets actions
   * Why this matters: Matches export actions in Blog modal for parity.
   */
  const openGoogleDocs = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedContent || row.output || '';
    if (!contentToCopy) {
      alert('Please generate content first before creating a Google Doc.');
      return;
    }
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      alert('Google Client ID not configured. Please check your .env file and restart the server.');
      return;
    }

    try {
      const docTitle = `Apollo Competitor Content - ${row.keyword}`;
      const documentUrl = await googleDocsService.createDocument(docTitle, contentToCopy);
      window.open(documentUrl, '_blank');
    } catch (error) {
      console.error('Error creating Google Doc:', error);
      window.open('https://docs.google.com/', '_blank');
    }
  };

  const generateUrlSlug = (keyword: string): string =>
    keyword.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

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
    };

    // Count matches for each category
    let maxMatches = 0;
    let selectedCategory = 'General';

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      let matches = 0;
      for (const keyword of keywords) {
        if (combinedText.includes(keyword)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        selectedCategory = category;
      }
    }

    return selectedCategory;
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
    const contentToCopy = isEditingContent ? editableContent : generatedContent || row.output || '';
    if (!contentToCopy) {
      alert('Please generate content first before logging to Google Sheets.');
      return;
    }
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      alert('Google Client ID not configured. Please check your .env file and restart the server.');
      return;
    }

    setIsOpeningSheets(true);
    try {
      // Generate the new metadata fields
      const urlSlug = generateUrlSlug(row.keyword);
      const secondaryCategory = determineSecondaryCategory(row.keyword, contentToCopy);
      const author = selectRandomAuthor();

      // Prepare blog content data for logging with new fields (keyword removed)
      const blogData = {
        metaSeoTitle: metaSeoTitle || `${row.keyword} - Complete Guide`,
        metaDescription: metaDescription || `Comprehensive guide about ${row.keyword} with expert insights and actionable tips.`,
        htmlContent: contentToCopy,
        urlSlug: urlSlug,
        secondaryCategory: secondaryCategory,
        author: author
      };
      
      // Use the competitor-specific function which creates/uses a spreadsheet titled
      // "Apollo Outrank Competitors Content - {date}"
      const result = await (googleDocsService as any).appendCompetitorData(blogData);
      
      if (result.success) {
        setSheetsSuccessMessage('Content logged to Google Sheets successfully!');
        setShowSheetsMessage(true);
        setTimeout(() => setShowSheetsMessage(false), 3000);
        window.open(result.spreadsheetUrl, '_blank');
      }
    } catch (error) {
      console.error('Error logging to Google Sheets:', error);
      
      // Show more detailed error message
      if (error instanceof Error) {
        alert(`Google Sheets error: ${error.message}`);
      } else {
        alert('Google Sheets error. Please try again.');
      }
    } finally {
      setIsOpeningSheets(false);
    }
  };

  /**
   * publishToCustomCMS
   * Why this matters: Enables publishing content directly to a CMS like ButterCMS, WordPress, etc.
   * This gives users a seamless workflow from content generation to publication
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

      // Use centralized API configuration
      // Why this matters: Ensures all deployments (Netlify, Vercel, local) use the correct backend URL
        
      const response = await fetch(buildApiUrl('/api/content/publish-to-cms'), {
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
   * clearGeneratedContent
   * Why this matters: Lets users reset output area, matching the Blog modal affordance.
   */
  const clearGeneratedContent = () => {
    setGeneratedContent('');
    setEditableContent('');
    setIsEditingContent(false);
    onContentUpdate?.(row.id, '');
  };

  /**
   * handleGenerate
   * Why this matters: Regenerates content for this keyword+URL using the tailored prompts with brand kit processing.
   */
  const handleGenerate = async () => {
    // Try to load brand kit, but allow generation even without one (backend will use defaults)
    let kit = resolvedBrandKit;
    if (!kit) {
      try {
        const draft = localStorage.getItem('apollo_brand_kit_draft');
        const saved = localStorage.getItem('apollo_brand_kit');
        const data = draft || saved;
        if (data) kit = JSON.parse(data);
      } catch {}
    }
    
    // If still no brand kit, use a minimal default one
    if (!kit) {
      console.log('⚠️ No brand kit found, using default Apollo brand values');
      kit = {
        url: 'https://www.apollo.io',
        aboutBrand: 'Apollo is the leading sales intelligence and engagement platform',
        idealCustomerProfile: 'B2B sales teams and revenue operations professionals',
        competitors: 'Salesforce, HubSpot, Outreach, ZoomInfo',
        brandPointOfView: 'Every business deserves access to powerful sales intelligence',
        authorPersona: 'Sales and revenue operations expert',
        toneOfVoice: 'Professional, knowledgeable, and approachable',
        headerCaseType: 'Title Case',
        writingRules: 'Clear, concise, actionable content with data-driven insights',
        ctaText: 'Try Apollo for free',
        ctaDestination: 'https://www.apollo.io/signup'
      } as any;
    }
    
    if (!resolvedBrandKit) {
      setResolvedBrandKit(kit);
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
        console.log(`🗺️ [CompetitorContentActionModal] Loaded ${allUrls.length} URLs from ${sitemaps.length} sitemaps for internal linking`);
      }
    } catch (error) {
      console.warn('Failed to load sitemap data:', error);
    }

    setIsGenerating(true);
    try {
      // Don't process liquid variables here - let the backend do it with the full context
      // The backend will process these with the brand kit AND inject research/gap analysis context
      console.log('🚀 Sending prompts to backend for competitor content generation');
      console.log('📝 System prompt preview:', systemPrompt.substring(0, 200));
      console.log('📝 User prompt preview:', userPrompt.substring(0, 200));
      console.log('🎯 Brand kit:', kit);

      // Use streaming content generation with built-in contextual CTAs for competitor content
      console.log('🚀 [CompetitorContentActionModal] Using streaming content generation approach...');
      
      if (enableContextualCtas) {
        setIsEnhancingWithCtas(true);
        console.log('🎯 [CompetitorContentActionModal] Streaming generation with contextual CTAs enabled');
      }
      
      const resp = await fetch(API_ENDPOINTS.competitorGenerateContent, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: row.keyword,
          url: row.url,
          brand_kit: kit || undefined,
          sitemap_data: sitemapData,
          target_audience: '',
          content_length: 'medium',
          focus_areas: [],
          system_prompt: systemPrompt,  // Send raw prompts with {{ variables }}
          user_prompt: userPrompt,      // Backend will process these
          use_simple_cta_service: enableContextualCtas // Use simple CTA service for sitemap-aware URLs
        })
      });

      const json = await resp.json();
      const data = json?.data || json;
      
      // Store workflow data if available (deep research and gap analysis)
      if (data?.workflow_data) {
        console.log('📊 Storing workflow data for future regenerations');
        setWorkflowData(data.workflow_data);
        
        // Also store in localStorage for persistence
        localStorage.setItem(`apollo_competitor_workflow_${row.id}`, JSON.stringify(data.workflow_data));
      }
      
      const payload = data?.content ?? data?.variations ?? '';
      const flattened = Array.isArray(payload) ? (payload[0] || '') : String(payload || '');
      const parsed = parseAIResponse(flattened);
      
      // Convert to HTML if content appears to be in markdown format
      let displayContent = parsed.content;
      const hasMarkdownSyntax = parsed.content.includes('**') || 
                               parsed.content.includes('# ') || 
                               parsed.content.includes('## ') ||
                               parsed.content.includes('* ') ||
                               parsed.content.includes('[') && parsed.content.includes('](');
      const hasHTMLTags = parsed.content.includes('<h1>') || 
                         parsed.content.includes('<p>') || 
                         parsed.content.includes('<strong>');
      
      console.log('🔄 Cleaning newly generated AI content using BlogContentActionModal logic');
      console.log('🔍 Before cleaning (first 500 chars):', parsed.content.substring(0, 500));
      displayContent = cleanAIContent(parsed.content);
      console.log('🔍 After cleaning (first 500 chars):', displayContent.substring(0, 500));
      
      // Handle streaming CTA results if available
      if (data.ctaInsertions && enableContextualCtas) {
        setCtaEnhancementResult({
          totalCtasInserted: data.ctaInsertions.totalInserted,
          insertionPoints: data.ctaInsertions.insertionPoints.map((point: any) => ({
            paragraphIndex: point.paragraphIndex,
            ctaText: point.cta,
            reasoning: point.reasoning,
            confidence: point.confidence
          })),
          processingTimeMs: data.processingTimeMs
        });
        console.log(`✅ [CompetitorContentActionModal] Streaming generation inserted ${data.ctaInsertions.totalInserted} contextual CTAs`);
      }
      
      setIsEnhancingWithCtas(false);
      
      setGeneratedContent(displayContent);
      setEditableContent(parsed.content); // Keep original format for editing
      setIsEditingContent(false);
      setMetaSeoTitle(parsed.metaSeoTitle);
      setMetaDescription(parsed.metaDescription);
      
      // Save meta fields to localStorage for persistence
      if (parsed.metaSeoTitle || parsed.metaDescription) {
        try {
          localStorage.setItem(`apollo_competitor_meta_${row.id}`, JSON.stringify({
            metaSeoTitle: parsed.metaSeoTitle,
            metaDescription: parsed.metaDescription
          }));
        } catch {}
      }
      
      onContentUpdate?.(row.id, displayContent);
    } catch (e) {
      console.error('Regenerate failed:', e);
      alert(`Generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * insertVariable
   * Why this matters: Inserts variables preserving undo stack, mirroring Blog modal UX.
   */
  const insertVariable = (variableValue: string) => {
    const textarea = activePromptField === 'system' ? systemRef.current : userRef.current;
    if (!textarea) return;
    textarea.focus();
    if (document.execCommand) {
      document.execCommand('insertText', false, ` ${variableValue} `);
      // Sync controlled state with the DOM value to guarantee insertion persists
      const updated = textarea.value;
      if (activePromptField === 'system') setSystemPrompt(updated);
      else setUserPrompt(updated);
    } else {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const currentValue = activePromptField === 'system' ? systemPrompt : userPrompt;
      const newValue = currentValue.substring(0, start) + ` ${variableValue} ` + currentValue.substring(end);
      if (activePromptField === 'system') setSystemPrompt(newValue);
      else setUserPrompt(newValue);
      setTimeout(() => {
        const newPosition = start + variableValue.length + 2;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      }, 0);
    }
    setShowVariablesMenu(false);
    setVariableSearchTerm('');
  };

  /**
   * handleVariablesMenuToggle
   * Why this matters: Positions the variables menu beside the clicked button for parity with Blog modal.
   */
  const handleVariablesMenuToggle = (promptField: 'system' | 'user') => {
    setActivePromptField(promptField);
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      setVariablesButtonPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
    } else {
      const buttonRef = promptField === 'system' ? systemVariablesButtonRef.current : userVariablesButtonRef.current;
      if (buttonRef) {
        const rect = buttonRef.getBoundingClientRect();
        setVariablesButtonPosition({ top: rect.top + window.scrollY, left: rect.right + window.scrollX + 12 });
      }
    }
    setShowVariablesMenu(!showVariablesMenu);
    setVariableSearchTerm('');
  };

  // Close variables menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = variablesMenuRef.current;
      if (menu && (event.target instanceof Node) && !menu.contains(event.target)) {
        setShowVariablesMenu(false);
      }
    };
    // Use capture to ensure we see the event before the outer backdrop
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, []);

  // Inject generated-content styles (parity with Blog modal)
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .generated-content-display { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #374151; }
      .generated-content-display h1 { font-size: 2rem; font-weight: 700; color: #111827; margin: 0 0 1.5rem 0; line-height: 1.2; border-bottom: 0.125rem solid #f3f4f6; padding-bottom: 0.75rem; }
      .generated-content-display h2 { font-size: 1.5rem; font-weight: 600; color: #1f2937; margin: 2rem 0 1rem 0; line-height: 1.3; }
      .generated-content-display h3 { font-size: 1.25rem; font-weight: 600; color: #374151; margin: 1.5rem 0 0.75rem 0; line-height: 1.4; }
      .generated-content-display p { margin: 0 0 1.25rem 0; line-height: 1.7; }
      .generated-content-display ul, .generated-content-display ol { margin: 1rem 0; padding-left: 1.5rem; }
      .generated-content-display li { margin: 0.5rem 0; line-height: 1.6; }
      .generated-content-display table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
      .generated-content-display thead { background-color: #f9fafb; }
      .generated-content-display th { padding: 0.875rem 1rem; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
      .generated-content-display td { padding: 0.875rem 1rem; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 0.875rem; line-height: 1.5; }
      .generated-content-display tbody tr:hover { background-color: #f9fafb; }
      .generated-content-display tbody tr:last-child td { border-bottom: none; }
      .generated-content-display a { color: #2563eb; text-decoration: underline; font-weight: 500; }
      .generated-content-display a:hover { color: #1d4ed8; text-decoration: underline; }
    `;
    document.head.appendChild(style);
    return () => { if (document.head.contains(style)) document.head.removeChild(style); };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {autoSaveStatus && (
        <div
          style={{
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
            fontWeight: 500,
            pointerEvents: 'none'
          }}
        >
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
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}
      >
      <div
        style={{ backgroundColor: 'white', borderRadius: '0.75rem', width: '100%', maxWidth: '95vw', height: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        className="content-creation-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Match BlogContentActionModal exactly */}
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
            <h2 style={{ fontWeight: 600, margin: 0, color: '#111827' }}>Competitor Content Actions</h2>
            <p style={{ color: '#6b7280' }}>Edit, publish, and manage your generated content for "{row.keyword}"</p>
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

        {/* Content Layout - two panels */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Left Panel - Prompts (match ContentCreationModal) */}
          <div className="content-modal-panel" style={{ padding: '1.5rem', overflowY: 'auto', borderRight: '0.0625rem solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: '#374151' }}>Content Generation Prompts</h3>

          {/* System Prompt */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>System Prompt</label>
                    <button
                      onClick={handleReset}
                      style={{ fontSize: '0.8rem', color: '#0077b5', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontWeight: 500 }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#005582')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#0077b5')}
                    >
                      (Reset to default)
                    </button>
                  </div>
                  <button
                    ref={systemVariablesButtonRef}
                    onClick={() => handleVariablesMenuToggle('system')}
                    className="content-modal-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f3f4f6', border: '0.0625rem solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer', padding: '8px 16px' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  >
                    Variables Menu
                    <ChevronDown size={14} />
                  </button>
                </div>
            <textarea
              ref={systemRef}
              value={systemPrompt}
              onChange={(e) => { setSystemPrompt(e.target.value); setHasUserInput(true); }}
                rows={8}
                className="content-creation-textarea"
                style={{ width: '100%', border: '0.0625rem solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#fafafa', padding: '0.75rem', resize: 'vertical', fontFamily: 'inherit', color: '#374151' }}
            />
          </div>

          {/* User Prompt */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>User Prompt</label>
                    <button
                      onClick={handleReset}
                      style={{ fontSize: '0.8rem', color: '#0077b5', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontWeight: 500 }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#005582')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#0077b5')}
                    >
                      (Reset to default)
                    </button>
                  </div>
                  <button
                    ref={userVariablesButtonRef}
                    onClick={() => handleVariablesMenuToggle('user')}
                    className="content-modal-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f3f4f6', border: '0.0625rem solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer', padding: '8px 16px' }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  >
                    Variables Menu
                    <ChevronDown size={14} />
                  </button>
                </div>
            <textarea
              ref={userRef}
              value={userPrompt}
              onChange={(e) => { setUserPrompt(e.target.value); setHasUserInput(true); }}
                rows={10}
                className="content-creation-textarea"
                style={{ width: '100%', border: '0.0625rem solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#fafafa', padding: '0.75rem', resize: 'vertical', fontFamily: 'inherit', color: '#374151' }}
              />
            </div>

            {/* Generate Button (match ContentCreationModal) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: '#fafafa', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="apollo-btn-gradient"
                style={{ opacity: isGenerating ? 0.6 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
              >
                {isGenerating ? (
                  <>
                    <Clock className="animate-spin" style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 size={16} style={{ marginRight: '0.5rem' }} />
                    Regenerate Article
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Output & Actions */}
          <div className="content-modal-panel" style={{ position: 'relative', padding: '1.5rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
              {generatedContent && (
                <button
                  onClick={clearGeneratedContent}
                  className="content-modal-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', border: '0.0625rem solid #fecaca', borderRadius: '0.5rem', color: '#dc2626', padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                >
                  <X size={14} /> Clear Generated Content
                </button>
              )}
            </div>

            {/* Action Buttons */}
            {generatedContent && (
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={toggleEditMode}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.75rem 1rem', 
                    backgroundColor: isEditingContent ? '#10b981' : '#f59e0b', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '0.5rem', 
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    minHeight: '2.75rem',
                    minWidth: '7.5rem',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                                  {isEditingContent ? (<><Check size={14} /> Save Changes</>) : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit Content</>)}
              </button>

              {/* Publish to CMS Button */}
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
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  minHeight: '2.75rem',
                  minWidth: '7.5rem',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
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
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  minHeight: '2.75rem',
                  minWidth: '7.5rem',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
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
                <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
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
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    minHeight: '2.75rem',
                    minWidth: '12.5rem',
                    justifyContent: 'center',
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
                      width: '14px',
                      height: '14px',
                      objectFit: 'contain'
                    }}
                  />
                  Google Docs
                </button>

                <button
                  onClick={openGoogleSheets}
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
                    cursor: isOpeningSheets ? 'not-allowed' : 'pointer', 
                    opacity: isOpeningSheets ? 0.6 : 1,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    minHeight: '2.75rem',
                    minWidth: '7.5rem',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isOpeningSheets ? <Clock className="animate-spin" size={14} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></svg>}
                  {isOpeningSheets ? 'Logging to Sheets...' : 'Open in Google Sheets'}
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
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    minHeight: '2.75rem',
                    minWidth: '7.5rem',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Copy size={14} /> {showCopiedMessage ? 'Copied!' : 'Copy'}
            </button>
              </div>
            )}

            {/* Generated Content Display with Meta fields (parity with Blog modal) */}
            {generatedContent ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '2rem', minHeight: '25rem', backgroundColor: 'white' }}>
                {(metaSeoTitle || metaDescription) && (
                  <div style={{ marginBottom: '2rem' }}>
                                        {metaSeoTitle && (
                      <div style={{ marginBottom: '1rem', position: 'relative' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>Meta SEO Title:</strong>
                          <button
                            onClick={copyMetaTitle}
                            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#f3f4f6', border: '1px solid #10b981', borderRadius: '0.375rem', cursor: 'pointer', color: '#10b981' }}
                          >
                            Copy
                          </button>
                          {showMetaTitleCopied && (
                            <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.75rem' }}>Copied!</span>
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
                            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#f3f4f6', border: '1px solid #10b981', borderRadius: '0.375rem', cursor: 'pointer', color: '#10b981' }}
                          >
                            Copy
                          </button>
                          {showMetaDescCopied && (
                            <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.75rem' }}>Copied!</span>
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
                    <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
                  </div>
                )}
                {isEditingContent ? (
                  <textarea
                    ref={editableContentRef}
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    style={{ width: '100%', minHeight: '37.5rem', padding: '1rem 1.25rem', border: '2px solid #f59e0b', borderRadius: '0.5rem', backgroundColor: '#fffbf5', resize: 'vertical', fontFamily: 'inherit', color: '#374151' }}
                  />
                ) : (
                  <div className="competitor-content-display" dangerouslySetInnerHTML={{ __html: generatedContent }} />
                )}
              </div>
            ) : (
              <div style={{ border: '2px dashed #d1d5db', borderRadius: '0.75rem', padding: '4rem 2rem', textAlign: 'center', color: '#6b7280', minHeight: '25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                <div>
                  <Wand2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
                  <p style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>No content generated yet</p>
                  <p style={{ margin: 0 }}>Generate content to see results here</p>
                </div>
              </div>
            )}

            {/* Bottom Action Buttons */}
            {generatedContent && (
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '0.0625rem solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* Edit/Save */}
                  <button
                    onClick={toggleEditMode}
                    className="content-modal-btn"
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      padding: '0.75rem 1rem',
                      backgroundColor: isEditingContent ? '#10b981' : '#f59e0b', 
                      color: 'white', 
                      border: 'none',
                      borderRadius: '0.5rem', 
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      minHeight: '2.75rem',
                      minWidth: '7.5rem',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                                      {isEditingContent ? (<><Check size={14} /> Save Changes</>) : (<>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Edit Content
                  </>)}
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
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    minHeight: '2.75rem',
                    minWidth: '7.5rem',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                >
                  <Globe size={14} />
                  Publish to CMS
                </button>

                {/* Open in HTML */}
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
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    minHeight: '2.75rem',
                    minWidth: '7.5rem',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
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
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="m6 16 6-12 6 12H6Z"/>
                    <path d="m8 12 8 0"/>
                  </svg>
                  Open in HTML
                </button>

                {/* Google Docs */}
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
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      minHeight: '2.75rem',
                      minWidth: '12.5rem',
                      justifyContent: 'center',
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
                        width: '14px',
                        height: '14px',
                        objectFit: 'contain'
                      }}
                    />
                    Google Docs
                  </button>

                  {/* Open in Google Sheets */}
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
                      cursor: isOpeningSheets ? 'not-allowed' : 'pointer', 
                      opacity: isOpeningSheets ? 0.6 : 1,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      minHeight: '2.75rem',
                      minWidth: '7.5rem',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isOpeningSheets ? <Clock className="animate-spin" size={14} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></svg>}
                    {isOpeningSheets ? 'Logging to Sheets...' : 'Open in Google Sheets'}
                  </button>

                  {/* Copy */}
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
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      minHeight: '2.75rem',
                      minWidth: '7.5rem',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Copy size={14} /> {showCopiedMessage ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Clear Generated Content - full width */}
                <button
                  onClick={clearGeneratedContent}
                  className="content-modal-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem',
                    backgroundColor: '#fef2f2', border: '0.0625rem solid #fecaca', borderRadius: '0.5rem',
                    color: '#dc2626', cursor: 'pointer', width: '100%', justifyContent: 'center'
                  }}
                >
                  <X size={14} /> Clear Generated Content
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Close backdrop wrapper */}
      </div>

      {/* Variables Menu */}
      <VariablesMenu
        showVariablesMenu={showVariablesMenu}
        variablesButtonPosition={variablesButtonPosition}
        variablesMenuRef={variablesMenuRef}
        activePromptField={activePromptField}
        variableSearchTerm={variableSearchTerm}
        setVariableSearchTerm={setVariableSearchTerm}
        setShowVariablesMenu={setShowVariablesMenu}
        brandKit={resolvedBrandKit}
        insertVariable={insertVariable}
      />

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
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CompetitorContentActionModal;


