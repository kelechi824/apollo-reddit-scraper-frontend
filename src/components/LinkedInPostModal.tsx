import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Clock, CheckCircle, Copy, Check, ChevronDown, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnalyzedPost, BrandKit, ContentCreationRequest } from '../types';
import { API_BASE_URL, buildApiUrl } from '../config/api';

interface LinkedInPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: AnalyzedPost;
}

/**
 * LinkedIn Variables Menu Component  
 * Why this matters: Provides searchable brand variables for LinkedIn post customization
 */
const LinkedInVariablesMenu: React.FC<{
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
      className="linkedin-variables-menu"
      style={{
        position: 'fixed',
        top: variablesButtonPosition.top,
        backgroundColor: 'white',
        border: '0.0625rem solid #e5e7eb',
        borderRadius: '0.75rem',
        boxShadow: '0 1.5625rem 3.125rem -0.75rem rgba(0, 0, 0, 0.25)',
        zIndex: 10000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
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
              borderRadius: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
          Insert into {activePromptField} prompt
        </p>
      </div>

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
            style={{
              width: '100%',
              padding: '0.625rem 0.625rem 0.625rem 2.5rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 1.5rem 1.5rem' }}>
        {!brandKit ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#6b7280' 
          }}>
            Please configure your Brand Kit first in the{' '}
            <Link to="/brand-kit" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              Brand Kit page
            </Link>
          </div>
        ) : filteredVariables.length > 0 ? (
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
 * LinkedIn Post Modal Component
 * Why this matters: Creates viral LinkedIn posts for thought leadership using Reddit insights
 */
const LinkedInPostModal: React.FC<LinkedInPostModalProps> = ({ isOpen, onClose, post }) => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [examplePostStyle, setExamplePostStyle] = useState('');
  const [useExampleStyle, setUseExampleStyle] = useState(false);
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedPrompts, setShowAdvancedPrompts] = useState(false);
  const [showExampleStyleSection, setShowExampleStyleSection] = useState(true);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [showVariablesMenu, setShowVariablesMenu] = useState(false);
  const [activePromptField, setActivePromptField] = useState<'system' | 'user'>('system');
  const [variableSearchTerm, setVariableSearchTerm] = useState('');
  const [variablesButtonPosition, setVariablesButtonPosition] = useState<{ top: number; left: number } | null>(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [hasUserInput, setHasUserInput] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showLinkedInMessage, setShowLinkedInMessage] = useState(false);
  const [showRedditContext, setShowRedditContext] = useState(false);
  const [currentVariation, setCurrentVariation] = useState(0);
  const [postVariations, setPostVariations] = useState<string[]>([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showGeneratedPostModal, setShowGeneratedPostModal] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const userPromptRef = useRef<HTMLTextAreaElement>(null);
  const variablesMenuRef = useRef<HTMLDivElement>(null);
  const systemVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const userVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const generatedContentRef = useRef<HTMLDivElement>(null);
  const editableContentRef = useRef<HTMLTextAreaElement>(null);

  // Generation progress messages - different for each method
  const getMimicryMessages = () => [
    'Analyzing post style...',
    'Crafting thought leadership content...',
    'Optimizing for LinkedIn engagement...',
    'Finalizing variations...'
  ];

  const getAdvancedMessages = () => [
    'Analyzing prompts...',
    'Crafting thought leadership content...',
    'Optimizing for LinkedIn engagement...',
    'Finalizing variations...'
  ];

  useEffect(() => {
    if (isOpen && post) {
      loadSavedData();
      setHasUserInput(false);
      setAutoSaveStatus('');
      
      // Reset modal state to default when opening
      setShowAdvancedPrompts(false);
      setShowExampleStyleSection(true);
      setUseExampleStyle(false);
      
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
      loadOrGeneratePrompts();
    }
    
    return undefined;
  }, [isOpen, post]);

  /**
   * Auto-save prompts to localStorage with debouncing
   * Why this matters: Prevents users from losing their work when editing LinkedIn prompts, but only after they start typing.
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
            examplePostStyle,
            useExampleStyle,
            postId: post.id || post.title, // Use post ID or title as identifier
            timestamp: new Date().toISOString()
          };
          
          localStorage.setItem('apollo_linkedin_prompts_draft', JSON.stringify(promptsData));
          
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
  }, [systemPrompt, userPrompt, examplePostStyle, useExampleStyle, isOpen, post, hasUserInput]);

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
   * Auto-save current variation selection
   * Why this matters: Preserves which variation the user was viewing when they return to the modal.
   */
  useEffect(() => {
    if (isOpen && post && postVariations.length > 0) {
      try {
        const postId = post.id || post.title;
        let postsData: Record<string, any> = {};
        
        // Load existing saved posts
        const savedData = localStorage.getItem('apollo_linkedin_posts');
        if (savedData) {
          postsData = JSON.parse(savedData);
        }
        
        // Update current variation if post exists
        if (postsData[postId]) {
          postsData[postId].currentVariation = currentVariation;
          postsData[postId].timestamp = new Date().toISOString();
          
          // Save back to localStorage
          localStorage.setItem('apollo_linkedin_posts', JSON.stringify(postsData));
        }
      } catch (error) {
        console.error('Error saving current variation:', error);
      }
    }
  }, [currentVariation, isOpen, post, postVariations.length]);

  /**
   * Handle click outside variables menu to close it
   * Why this matters: Provides intuitive UX by closing the menu when users click elsewhere
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showVariablesMenu && 
          variablesMenuRef.current && 
          !variablesMenuRef.current.contains(event.target as Node) &&
          systemVariablesButtonRef.current &&
          !systemVariablesButtonRef.current.contains(event.target as Node) &&
          userVariablesButtonRef.current &&
          !userVariablesButtonRef.current.contains(event.target as Node)) {
        setShowVariablesMenu(false);
      }
    };

    if (showVariablesMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVariablesMenu]);

  /**
   * Update displayed post when variation changes
   * Why this matters: Syncs the displayed content with the selected variation.
   */
  useEffect(() => {
    if (postVariations.length > 0 && currentVariation < postVariations.length) {
      setGeneratedPost(postVariations[currentVariation]);
      setEditableContent(postVariations[currentVariation]);
      setIsEditingContent(false); // Exit edit mode when switching variations
    }
  }, [currentVariation, postVariations]);

  const loadSavedData = (): void => {
    try {
      const savedData = localStorage.getItem('apollo_linkedin_posts');
      if (savedData) {
        const postsData = JSON.parse(savedData);
        const postId = post.id || post.title;
        
        if (postsData[postId]) {
          const savedPost = postsData[postId];
          if (Array.isArray(savedPost.variations)) {
            setPostVariations(savedPost.variations);
            const variationIndex = savedPost.currentVariation || 0;
            setCurrentVariation(variationIndex);
            setGeneratedPost(savedPost.variations[variationIndex] || savedPost.variations[0] || '');
          } else if (savedPost.content) {
            // Legacy format - convert to variations array
            setPostVariations([savedPost.content]);
            setGeneratedPost(savedPost.content);
            setCurrentVariation(0);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error loading saved LinkedIn posts:', error);
    }
    
    setGeneratedPost('');
    setPostVariations([]);
  };

  /**
   * Save generated LinkedIn posts for this specific post
   * Why this matters: Persists generated LinkedIn content so users can return to it later.
   */
  const saveGeneratedPosts = (variations: string[]): void => {
    try {
      const postId = post.id || post.title;
      let postsData: Record<string, any> = {};
      
      // Load existing saved posts
      const savedData = localStorage.getItem('apollo_linkedin_posts');
      if (savedData) {
        postsData = JSON.parse(savedData);
      }
      
      // Update posts for this specific post
      postsData[postId] = {
        variations,
        currentVariation: 0,
        timestamp: new Date().toISOString()
      };
      
      // Save back to localStorage
      localStorage.setItem('apollo_linkedin_posts', JSON.stringify(postsData));
    } catch (error) {
      console.error('Error saving generated LinkedIn posts:', error);
    }
  };

  const loadOrGeneratePrompts = (): void => {
    try {
      const savedData = localStorage.getItem('apollo_linkedin_prompts_draft');
      if (savedData) {
        const { systemPrompt: savedSystemPrompt, userPrompt: savedUserPrompt, examplePostStyle: savedExample, useExampleStyle: savedUseExampleStyle, postId } = JSON.parse(savedData);
        
        if (postId === (post.id || post.title)) {
          setSystemPrompt(savedSystemPrompt || '');
          setUserPrompt(savedUserPrompt || '');
          setExamplePostStyle(savedExample || '');
          setUseExampleStyle(savedUseExampleStyle || false);
          
          // Set UI state based on saved preferences
          if (savedUseExampleStyle) {
            setShowExampleStyleSection(true);
            setShowAdvancedPrompts(false);
          } else {
            // If not using example style, show example style section by default
            setShowExampleStyleSection(true);
            setShowAdvancedPrompts(false);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error loading saved prompts:', error);
    }
    
    // Generate initial prompts and ensure default UI state
    generateInitialPrompts();
    setUseExampleStyle(false);
    setShowExampleStyleSection(true);
    setShowAdvancedPrompts(false);
  };

  const generateInitialPrompts = () => {
    const currentYear = new Date().getFullYear();
    const systemPromptTemplate = `You are a world-class LinkedIn thought leader and viral content creator specializing in turning Reddit's users pain points into thought leadership content. Your expertise lies in transforming industry insights into compelling, engagement-driving LinkedIn posts that position the author as a trusted authority.

CURRENT YEAR: ${currentYear}

CRITICAL CONTENT RULES:
- NEVER make up statistics, metrics, numbers, or data points
- NEVER create fictional case studies, companies, or scenarios
- ONLY use insights and context from the provided Reddit analysis
- Base ALL content on the actual pain point and audience insights provided
- If you need examples, reference general industry patterns (not specific data)

LINKEDIN POST REQUIREMENTS:
- Create thought leadership content that positions the author as an industry expert
- Use proven viral mechanics: strong hooks, storytelling, social proof
- Write in a conversational, authentic tone that builds trust
- Include strategic line breaks for mobile readability
- End with engaging questions or calls-to-action
- Stay under 3000 characters for optimal engagement
- Focus on value-first approach with subtle brand integration

THOUGHT LEADERSHIP FRAMEWORKS:
1. Problem-Agitation-Solution (PAS)
2. Before-After-Bridge (BAB) 
3. Story-Lesson-Application (SLA)
4. Question-Insight-Action (QIA)

UNIQUENESS REQUIREMENT: Each of the 3 variations MUST be completely different in:
- Hook/opening approach (different first sentences)
- Content structure and flow (different paragraph organization)
- Storytelling angle (different narrative approaches)
- Key insights presented (different aspects of the pain point)
- Call-to-action style (different engagement questions)
- Overall messaging approach (different tones and perspectives)

CRITICAL: Do NOT repeat content, phrases, or structures between variations. Each must be a standalone, unique LinkedIn post.

OUTPUT FORMAT: Create 3 completely distinct variations and return as a JSON array of strings. Each variation must be independently valuable and unique.`;

    const userPromptTemplate = `Create unique LinkedIn thought leadership posts using ONLY this Reddit insight:

Reddit Title: ${post.title}
Reddit Content: ${post.content || 'No additional content provided'}
Pain Point: ${post.analysis.pain_point}
Content Opportunity: ${post.analysis.content_opportunity}
Audience Insight: ${post.analysis.audience_insight}

Brand Context:
${brandKit?.aboutBrand || '{{ brand_kit.about_brand }}'}
Tone: {{ brand_kit.tone_of_voice }}

STRICT REQUIREMENTS:
- DO NOT make up any statistics, metrics, or data points
- DO NOT create fictional examples or case studies
- ONLY use the insights from the Reddit analysis above
- Each variation must be completely unique in approach and content
- DO NOT use emdashes (—) in the content
- AVOID AI-detectable phrases like "It's not just about..., it's..." or "This doesn't just mean..., it also means..." - use natural, conversational language instead

Create 3 COMPLETELY DIFFERENT LinkedIn posts that each address this pain point uniquely:

**VARIATION 1: Personal reflection/thought-provoking approach**
- Start with a controversial or thought-provoking statement (unique opening)
- Use introspective language and personal observations
- Focus on challenging conventional thinking about the pain point
- End with a philosophical question that makes people think
- Must be COMPLETELY different from variations 2 and 3

**VARIATION 2: Practical problem-solving approach**  
- Start with a direct problem statement (different opening than variation 1)
- Provide actionable insights and solutions from the Reddit analysis
- Use bullet points or numbered lists for clarity
- End with implementation-focused CTA
- Must be COMPLETELY different from variations 1 and 3

**VARIATION 3: Community/discussion approach**
- Start with a relatable scenario or observation (different opening than variations 1 and 2)
- Focus on shared experiences and community insights
- Use inclusive language ("we", "us", "our industry")
- End with a discussion-starting question
- Must be COMPLETELY different from variations 1 and 2

**CRITICAL REQUIREMENTS:**
- Each post must be completely unique in structure, tone, and messaging
- NO repeated phrases, sentences, or concepts between variations
- Each must stand alone as an independent LinkedIn post
- Under 3000 characters each
- Ready to post on LinkedIn
- Grounded only in the provided Reddit analysis

Return as a JSON array of 3 completely different LinkedIn posts.`;

    setSystemPrompt(systemPromptTemplate);
    setUserPrompt(userPromptTemplate);
  };

  /**
   * Generate LinkedIn post with style mimicry or advanced prompts
   * Why this matters: Creates viral LinkedIn content using either style mimicry or custom prompts with variation support
   */
  const generateLinkedInPost = async () => {
    if (!brandKit) {
      alert('Please configure your Brand Kit first in the Brand Kit page.');
      return;
    }
    
    setIsGenerating(true);
    setGenerationStep(0);
    
    try {
      // Get appropriate messages based on generation method
      const currentMessages = useExampleStyle ? getMimicryMessages() : getAdvancedMessages();
      
      // Progress through generation steps with 5-second intervals
      const progressInterval = setInterval(() => {
        setGenerationStep(prev => {
          const nextStep = prev + 1;
          // Stop at the last message until generation completes
          if (nextStep >= currentMessages.length) {
            return currentMessages.length - 1;
          }
          return nextStep;
        });
      }, 5000);

      let finalSystemPrompt = '';
      let finalUserPrompt = '';

      if (useExampleStyle && examplePostStyle.trim()) {
        // Style Mimicry Mode - analyze and replicate the example post style
        finalSystemPrompt = `You are a LinkedIn thought leadership writer. Use the Reddit story as an EXAMPLE to create thought leadership insights, NOT to make personal claims.

🚨 CRITICAL RULES:
- NEVER claim the Reddit story happened to YOU
- NEVER say "I sold" or "my experience" or "when I worked at"
- USE the Reddit story as an EXAMPLE to teach insights
- Reference it as "I recently saw" or "someone shared" or "a salesperson told me"
- CREATE THOUGHT LEADERSHIP, not personal claims

🎯 SIMPLE TASK:
1. Read the example post's writing style (tone, structure, energy)
2. Use the Reddit story as an EXAMPLE to create insights about sales/business
3. Write in the example's style but about lessons from the Reddit story
4. Present the Reddit facts as examples you're sharing, not your experience

✅ CORRECT APPROACH:
"I recently saw a salesperson at Midwest Heating and Cooling sell $80k in one week..."
"Someone shared how they closed 65% of prospects by focusing on relationships..."

❌ WRONG APPROACH:
"When I worked at Midwest Heating and Cooling, I sold $80k..."
"My experience shows that I closed 65% of prospects..."
"I sold 7 deals in a row by..."

🎨 STYLE MIMICRY:
- Copy the example's tone, energy, and structure
- Use similar formatting (bullets, emojis, questions)
- Match their confidence and engagement style
- DON'T copy their exact words or phrases
- DO NOT use emdashes (—) in the content
- AVOID AI-detectable phrases like "It's not just about..., it's..." or "This doesn't just mean..., it also means..." - write naturally

OUTPUT: 3 LinkedIn posts using the example's style to share insights from the Reddit story as examples, not personal claims.

Return as JSON array: ["post 1", "post 2", "post 3"]`;

        finalUserPrompt = `EXAMPLE POST (study the writing style only):
"${examplePostStyle}"

REDDIT STORY TO USE AS EXAMPLE:
Title: ${post.title}
Content: ${post.content || 'No additional content provided'}
Pain Point: ${post.analysis.pain_point}
Content Opportunity: ${post.analysis.content_opportunity}
Audience Insight: ${post.analysis.audience_insight}

BRAND: ${brandKit.aboutBrand || 'Professional services company'}
TONE: ${brandKit.toneOfVoice || 'Professional yet approachable'}

TASK: Write 3 LinkedIn thought leadership posts using the example's writing style to share insights from the Reddit story.

IMPORTANT: Present the Reddit story as an EXAMPLE you're sharing, not your personal experience.

✅ Say: "I recently saw..." "Someone shared..." "A salesperson told me..."
❌ Don't say: "I sold..." "My experience..." "When I worked at..."

Use the Reddit facts (like $80k, Midwest Heating and Cooling, 65% close rate, 7 deals) as examples in your insights, not personal claims.

Write in the example's style (tone, energy, structure) but create thought leadership content about the lessons from the Reddit story.

FORMATTING: 
- DO NOT use emdashes (—) in the content
- AVOID AI-detectable phrases like "It's not just about..., it's..." or "This doesn't just mean..., it also means..." - write naturally and conversationally

Return as JSON: ["post 1", "post 2", "post 3"]`;
      } else {
        // Advanced Prompts Mode - use custom system and user prompts
        finalSystemPrompt = systemPrompt;
        finalUserPrompt = userPrompt;
      }

      // Replace brand kit variables in prompts
      const processedSystemPrompt = replaceBrandKitVariables(finalSystemPrompt, brandKit);
      const processedUserPrompt = replaceBrandKitVariables(finalUserPrompt, brandKit);

      // Call the content generation API using same approach as ContentCreationModal
      // Determine backend URL based on environment
    // Why this matters: Ensures production deployments use the correct backend URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://apollo-reddit-scraper-backend.vercel.app'
      : 'http://localhost:3003';
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_context: {
            title: post.title,
            content: post.content || '',
            pain_point: post.analysis.pain_point || '',
            content_opportunity: post.analysis.content_opportunity || '',
            audience_summary: post.analysis.audience_insight || ''
          },
          brand_kit: brandKit,
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Failed to generate LinkedIn post');
      }

      const data = await response.json();
      
      // Parse the AI response to extract individual variations
      let variations: string[] = [];
      
      console.log('🔍 Raw AI response:', data.content);
      
      // Enhanced cleaning function for LinkedIn posts
      const cleanLinkedInVariation = (variation: string): string => {
        let cleaned = variation;
        
        // Remove common AI introductory phrases
        cleaned = cleaned.replace(/^.*?Here's.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^.*?Here are.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^.*?I'll create.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^.*?Based on.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^.*?Variation \d+.*?:?\s*/i, '');
        cleaned = cleaned.replace(/^.*?\d+\.\s*.*?:?\s*/i, '');
        
        // Remove JSON formatting artifacts
        cleaned = cleaned.replace(/^```json\s*/i, '');
        cleaned = cleaned.replace(/^```\s*/, '');
        cleaned = cleaned.replace(/```\s*$/, '');
        cleaned = cleaned.replace(/^\[\s*/, '');
        cleaned = cleaned.replace(/\s*\]$/, '');
        cleaned = cleaned.replace(/^[\[\{]?\s*"/, '');
        cleaned = cleaned.replace(/"\s*[\]\}]?$/, '');
        cleaned = cleaned.replace(/",?\s*$/, '');
        
        // Fix escaped characters
        cleaned = cleaned.replace(/\\n/g, '\n');
        cleaned = cleaned.replace(/\\"/g, '"');
        cleaned = cleaned.replace(/\\'/g, "'");
        
        // Remove any trailing commas or JSON artifacts
        cleaned = cleaned.replace(/,\s*$/, '');
        cleaned = cleaned.replace(/^\s*,/, '');
        
        // Clean up whitespace and formatting
        cleaned = cleaned.trim();
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
        cleaned = cleaned.replace(/^\s*[\"\']|[\"\']?\s*$/g, '');
        
        // Ensure first letter is capitalized
        if (cleaned.length > 0) {
          cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        
        return cleaned;
      };

      // Handle different response formats from the API
      let responseContent: string;
      
      if (Array.isArray(data.content)) {
        // Production format: data.content is an array containing JSON string
        console.log('📋 Detected array format response, extracting content...');
        responseContent = data.content[0] || '';
      } else if (typeof data.content === 'string') {
        // Local format: data.content is a direct string
        console.log('📋 Detected string format response...');
        responseContent = data.content;
      } else {
        console.error('❌ Unexpected response format:', typeof data.content);
        responseContent = String(data.content || '');
      }
      
      console.log('📋 Processing response content:', responseContent.substring(0, 200) + '...');

      try {
        // Extract JSON from markdown code blocks if present
        let jsonContent = responseContent;
        const codeBlockMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          console.log('🎯 Found JSON in markdown code blocks, extracting...');
          jsonContent = codeBlockMatch[1];
        }
        
        // Try to parse as JSON array
        const parsed = JSON.parse(jsonContent);
        if (Array.isArray(parsed)) {
          console.log('✅ Successfully parsed JSON array with', parsed.length, 'variations');
          variations = parsed.map((variation: string) => cleanLinkedInVariation(variation));
        } else if (parsed.variations && Array.isArray(parsed.variations)) {
          console.log('✅ Found variations array in parsed object');
          variations = parsed.variations.map((variation: string) => cleanLinkedInVariation(variation));
        }
      } catch (directJsonError) {
        console.log('❌ Direct JSON parse failed, trying to extract JSON array');
        console.log('Raw response for debugging:', responseContent.substring(0, 300) + '...');
        
        // Step 2: Try to extract JSON array from response with better regex
        try {
          // Look for JSON array pattern - handle multiline strings better
          const jsonArrayMatch = responseContent.match(/\[\s*"[\s\S]*?"\s*(?:,\s*"[\s\S]*?"\s*)*\]/);
          if (jsonArrayMatch) {
            const extracted = JSON.parse(jsonArrayMatch[0]);
            if (Array.isArray(extracted)) {
              console.log('✅ Extracted JSON array with', extracted.length, 'variations');
              variations = extracted.map((variation: string) => cleanLinkedInVariation(variation));
            }
          }
        } catch (extractError) {
          console.log('❌ JSON array extraction failed, trying manual split');
          
          // Step 3: Manual parsing if JSON extraction fails
          // Look for clear variation separators
          const content = responseContent;
          const variationSeparators = [
            /\n\s*\[\s*"[\s\S]*?"\s*,\s*"[\s\S]*?"\s*,\s*"[\s\S]*?"\s*\]/,
            /"[\s\S]*?"\s*,\s*"[\s\S]*?"\s*,\s*"[\s\S]*?"/,
            /Variation 1:[\s\S]*?(?=Variation 2:|$)/gi,
            /Post 1:[\s\S]*?(?=Post 2:|$)/gi
          ];
          
          let foundVariations = false;
          for (const separator of variationSeparators) {
            const matches = content.match(separator);
            if (matches && matches.length > 0) {
              console.log('✅ Found variations using manual parsing');
              variations = matches.map((match: string) => cleanLinkedInVariation(match));
              foundVariations = true;
              break;
            }
          }
          
          if (!foundVariations) {
            console.log('❌ Manual parsing failed');
          }
        }
      }

      // Step 4: If still no variations, try advanced text splitting
      if (variations.length === 0) {
        console.log('⚠️ No structured variations found, attempting advanced text parsing');
        const rawContent = responseContent;
        
        // Try to split by common AI response patterns
        const splitPatterns = [
          // Pattern 1: "**Post/Variation X:**" followed by content
          /(?:\*\*(?:Post|Variation)\s*\d+:?\*\*[\s\n]*)([\s\S]*?)(?=\*\*(?:Post|Variation)\s*\d+:?\*\*|$)/gi,
          // Pattern 2: "X." or "X)" at start of line followed by content
          /(?:^\d+[\.\)]\s*)([\s\S]*?)(?=^\d+[\.\)]\s*|$)/gmi,
          // Pattern 3: Clear paragraph breaks with substantial content
          /([^\n]{200,}(?:\n\n|$))/g
        ];
        
        let foundVariations = false;
        for (const pattern of splitPatterns) {
          const matches = Array.from(rawContent.matchAll(pattern));
          if (matches.length >= 2) {
            const extractedVariations = matches
              .map(match => match[1] || match[0])
              .map(text => cleanLinkedInVariation(text))
              .filter(text => text.length > 200); // Must be substantial
            
            if (extractedVariations.length >= 2) {
              variations = extractedVariations.slice(0, 3); // Take up to 3
              console.log(`✅ Found ${variations.length} variations using pattern matching`);
              foundVariations = true;
              break;
            }
          }
        }
        
        // Final fallback - try to use the entire response as a single variation
        if (!foundVariations) {
          console.log('❌ Could not parse multiple variations from response');
          console.log('Raw response:', rawContent.substring(0, 500) + '...');
          
          // Check if we have a substantial single response to work with
          const cleanedSingleResponse = cleanLinkedInVariation(rawContent);
          if (cleanedSingleResponse.length > 200) {
            console.log('📝 Using single response as primary variation');
            variations = [cleanedSingleResponse];
            
            // Try to create 2 additional variations by requesting alternatives
            console.log('🔄 Will need to generate alternatives for full set');
          } else {
            // Return error message requesting regeneration
            variations = [
              'Unable to generate multiple variations. Please try generating again.',
              'The AI response could not be parsed into separate variations.',
              'Click "Generate Alternative" to try again with different prompting.'
            ];
          }
        }
      }
      
      // Ensure we have valid variations and limit to exactly 3
      let finalVariations = variations.filter((v: string) => v && v.trim().length > 0);
      
      // Helper function to calculate text similarity
      const calculateSimilarity = (text1: string, text2: string): number => {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
      };

      // Enhanced duplicate detection and filtering
      if (finalVariations.length > 1) {
        const duplicates = [];
        const uniqueVariations = [];
        
        for (let i = 0; i < finalVariations.length; i++) {
          const currentVariation = finalVariations[i];
          let isDuplicate = false;
          
          // Check against already accepted variations
          for (let j = 0; j < uniqueVariations.length; j++) {
            const existingVariation = uniqueVariations[j];
            
            // Multiple similarity checks
            const firstSentenceSimilar = currentVariation.split('.')[0] === existingVariation.split('.')[0];
            const first100CharsSimilar = currentVariation.substring(0, 100) === existingVariation.substring(0, 100);
            const overallSimilarity = calculateSimilarity(currentVariation, existingVariation) > 0.7;
            
            if (firstSentenceSimilar || first100CharsSimilar || overallSimilarity) {
              isDuplicate = true;
              duplicates.push(`Variation ${i + 1} is too similar to variation ${uniqueVariations.indexOf(existingVariation) + 1}`);
              break;
            }
          }
          
          if (!isDuplicate) {
            uniqueVariations.push(currentVariation);
          }
        }
        
        if (duplicates.length > 0) {
          console.warn('🚨 Duplicate variations detected and filtered:', duplicates);
          finalVariations = uniqueVariations;
        }
      }
      
      // CRITICAL: Always limit to exactly 3 variations maximum
      if (finalVariations.length > 3) {
        console.log(`⚠️ Found ${finalVariations.length} variations, limiting to 3`);
        finalVariations = finalVariations.slice(0, 3);
      }
      
      if (finalVariations.length === 0) {
        finalVariations.push('Error generating content. Please try again.');
      }
      
      // If we have less than 3, do NOT pad with duplicates - instead request regeneration
      if (finalVariations.length < 3 && finalVariations[0] !== 'Error generating content. Please try again.') {
        console.warn(`⚠️ Only got ${finalVariations.length} unique variations, should have 3`);
        // Keep what we have rather than duplicating
      }
      
      console.log(`✅ Generated exactly ${finalVariations.length} LinkedIn post variations`);
      
      // Set the generated content as variations
      setPostVariations(finalVariations);
      setCurrentVariation(0);
      setGeneratedPost(finalVariations[0]);
      setEditableContent(finalVariations[0]);
      setIsEditingContent(false);
      
      // Save the generated posts
      saveGeneratedPosts(finalVariations);
      
      // Scroll to generated content section
      setTimeout(() => {
        if (generatedContentRef.current) {
          generatedContentRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
          // Additional scroll to ensure we're at the very top
          setTimeout(() => {
            if (generatedContentRef.current) {
              const rect = generatedContentRef.current.getBoundingClientRect();
              const absoluteTop = window.pageYOffset + rect.top - 20; // 1.25rem padding from top
              window.scrollTo({
                top: absoluteTop,
                behavior: 'smooth'
              });
            }
          }, 300);
        }
      }, 100);
      
    } catch (error) {
      console.error('Error generating LinkedIn post:', error);
      const errorMessage = 'Sorry, there was an error generating your LinkedIn post. Please try again.';
      setPostVariations([errorMessage]);
      setGeneratedPost(errorMessage);
      setEditableContent(errorMessage);
      setCurrentVariation(0);
      setIsEditingContent(false);
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  /**
   * Replace brand kit variables in text
   * Why this matters: Allows dynamic insertion of brand-specific content into prompts
   */
  const replaceBrandKitVariables = (text: string, brandKit: BrandKit): string => {
    let processedText = text;
    
    // Replace brand kit variables
    if (brandKit.aboutBrand) {
      processedText = processedText.replace(/\{\{\s*brand_kit\.about_brand\s*\}\}/g, brandKit.aboutBrand);
    }
    if (brandKit.toneOfVoice) {
      processedText = processedText.replace(/\{\{\s*brand_kit\.tone_of_voice\s*\}\}/g, brandKit.toneOfVoice);
    }
    if (brandKit.ctaText) {
      processedText = processedText.replace(/\{\{\s*brand_kit\.cta_text\s*\}\}/g, brandKit.ctaText);
    }
    
    return processedText;
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
   * Handle Variables Menu button clicks
   * Why this matters: Opens the variables menu positioned to the right of the clicked button to prevent cutoff
   */
  const handleVariablesButtonClick = (field: 'system' | 'user', event: React.MouseEvent<HTMLButtonElement>) => {
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
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      
      const menuHeight = Math.min(window.innerHeight * 0.7, 600); // 70vh or 37.5rem max
      let topPosition = rect.top + window.scrollY;
      
      // Move both System and User Prompt menus up significantly to ensure full visibility
      if (field === 'system') {
        // For System Prompt, position menu higher
        topPosition = rect.top + window.scrollY - menuHeight + 200; // Move up significantly
      } else if (field === 'user') {
        // For User Prompt, position menu even higher to ensure full visibility
        topPosition = rect.top + window.scrollY - menuHeight + 150; // Move up even more
      }
      
      // Ensure it doesn't go above the viewport
      if (topPosition < window.scrollY + 20) {
        topPosition = window.scrollY + 20;
      }
      
      setVariablesButtonPosition({
        top: topPosition,
        left: rect.right + window.scrollX + 12 // Position to the right with 0.75rem gap
      });
    }
    
    setActivePromptField(field);
    setShowVariablesMenu(true);
    setVariableSearchTerm('');
  };

  /**
   * Toggle edit mode for generated content
   * Why this matters: Allows users to edit the generated content before copying/posting
   */
  const toggleEditMode = () => {
    if (isEditingContent) {
      // Save the edited content back to the current variation
      setGeneratedPost(editableContent);
      // Update the variations array with the edited content
      const updatedVariations = [...postVariations];
      updatedVariations[currentVariation] = editableContent;
      setPostVariations(updatedVariations);
      saveGeneratedPosts(updatedVariations);
    } else {
      // Enter edit mode - sync editable content with current post
      setEditableContent(generatedPost);
    }
    setIsEditingContent(!isEditingContent);
  };

  /**
   * Copy LinkedIn post to clipboard with optimized formatting
   * Why this matters: Provides seamless copying for LinkedIn posting with proper formatting preservation
   */
  const copyLinkedInPost = async () => {
    const contentToCopy = isEditingContent ? editableContent : generatedPost;
    if (!contentToCopy) return;
    
    try {
      // LinkedIn-optimized formatting: preserve line breaks and remove excessive spacing
      const linkedInFormattedPost = contentToCopy
        .trim()
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Convert triple+ line breaks to double
        .replace(/\n\s*\n/g, '\n\n'); // Ensure consistent double line breaks
      
      await navigator.clipboard.writeText(linkedInFormattedPost);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (error) {
      console.error('Failed to copy LinkedIn post:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = contentToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy method failed:', fallbackError);
        alert('Failed to copy content. Please select and copy manually.');
      }
    }
  };

  /**
   * Open LinkedIn sharing page with pre-populated content
   * Why this matters: Streamlines the posting process by directly opening LinkedIn with the content ready
   */
  const openLinkedInShare = () => {
    const contentToCopy = isEditingContent ? editableContent : generatedPost;
    if (!contentToCopy) return;
    
    // LinkedIn sharing URL with pre-populated text
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`;
    
    // Copy content to clipboard first, then open LinkedIn
    copyLinkedInPost().then(() => {
      // Open LinkedIn in a new tab
      window.open(linkedInUrl, '_blank', 'width=600,height=600,scrollbars=yes,resizable=yes');
      
      // Show enhanced UI message instead of alert
      setShowLinkedInMessage(true);
      setTimeout(() => setShowLinkedInMessage(false), 8000); // Show for 8 seconds
    });
  };

  /**
   * Generate alternative LinkedIn post variations
   * Why this matters: Provides users with fresh content alternatives without losing existing variations
   */
  const generateAlternativePost = async () => {
    if (!brandKit) return;
    
    // Use the same generation logic but with alternative prompting
    await generateLinkedInPost();
  };

  /**
   * Scroll to top of modal content
   * Why this matters: Ensures users see new content from the beginning when navigating between variations
   */
  const scrollToTop = () => {
    if (generatedContentRef.current) {
      generatedContentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      // Additional scroll to ensure we're at the very top
      setTimeout(() => {
        if (generatedContentRef.current) {
          const rect = generatedContentRef.current.getBoundingClientRect();
          const absoluteTop = window.pageYOffset + rect.top - 20; // 1.25rem padding from top
          window.scrollTo({
            top: absoluteTop,
            behavior: 'smooth'
          });
        }
      }, 300);
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
    setGeneratedPost('');
    setPostVariations([]);
    setCurrentVariation(0);
    setIsGenerating(false);
    setGenerationStep(0);
    setShowClearConfirmation(false);
    setIsEditingContent(false);
    setEditableContent('');
    
    // Clear saved generated posts from localStorage
    try {
      const savedData = localStorage.getItem('apollo_linkedin_posts');
      if (savedData) {
        const data = JSON.parse(savedData);
        const postId = post.id || post.title;
        if (data[postId]) {
          delete data[postId];
          localStorage.setItem('apollo_linkedin_posts', JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Error clearing saved posts:', error);
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
   * Navigate to previous variation
   * Why this matters: Allows users to browse through different generated post variations
   */
  const handlePreviousVariation = () => {
    if (currentVariation > 0) {
      setCurrentVariation(currentVariation - 1);
    } else {
      setCurrentVariation(postVariations.length - 1);
    }
  };

  /**
   * Navigate to next variation
   * Why this matters: Allows users to browse through different generated post variations
   */
  const handleNextVariation = () => {
    if (currentVariation < postVariations.length - 1) {
      setCurrentVariation(currentVariation + 1);
    } else {
      setCurrentVariation(0);
    }
  };

  /**
   * Handle viewing generated post on mobile
   * Why this matters: Shows generated post as a full-screen modal on mobile for better readability
   */
  const handleViewGeneratedPost = () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && generatedPost) {
      setShowGeneratedPostModal(true);
    }
  };

  /**
   * Insert variable into the appropriate prompt field
   * Why this matters: Allows users to easily add brand kit variables to their prompts without scrolling to bottom
   */
  const insertVariable = (variableValue: string) => {
    const textarea = activePromptField === 'system' ? systemPromptRef.current : userPromptRef.current;
    
    if (textarea) {
      textarea.focus();
      
      // Use document.execCommand to insert text while preserving undo stack and cursor position
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
    
    setHasUserInput(true);
    setShowVariablesMenu(false);
    setVariableSearchTerm('');
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
              Auto-saving LinkedIn prompts...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              LinkedIn prompts auto-saved
            </>
          )}
        </div>
      )}

      {/* CSS for enhanced LinkedIn message animations */}
      <style>
        {`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(-0.625rem);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          @keyframes progressBar {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }

          /* Mobile-specific styles for LinkedIn modal */
          @media (max-width: 48rem) {
            .linkedin-modal-header {
              padding: 1rem !important;
            }
            
            .linkedin-modal-header h2 {
              font-size: 1rem !important;
            }
            
            .linkedin-modal-header p {
              font-size: 0.875rem !important;
              margin: 0.25rem 0 0 0 !important;
            }
            
            .linkedin-modal-panel {
              padding: 1rem !important;
            }
            
            .linkedin-modal-layout {
              flex-direction: column !important;
            }

            /* Variables menu mobile popup modal */
            .linkedin-variables-menu {
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

            /* Show mobile view button and hide desktop content */
            .mobile-view-post-btn {
              display: block !important;
            }

            .generated-posts-display {
              display: none !important;
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

             /* Hide edit buttons on mobile */
             .mobile-hide-edit {
               display: none !important;
             }

             /* Adjust button containers when edit buttons are hidden */
             .linkedin-modal-layout .linkedin-action-buttons {
               gap: 1rem !important;
               justify-content: center !important;
             }

             /* Mobile optimization for all LinkedIn action buttons */
             .linkedin-action-buttons button {
               padding: 0.75rem 1rem !important;
               font-size: 0.875rem !important;
               min-height: 2.75rem !important;
               min-width: 7.5rem !important;
               justify-content: center !important;
             }

             /* Hide generated content section on mobile only when no content exists */
             .linkedin-generated-section:not(.has-content) {
               display: none !important;
             }

             /* Hide character count section, navigation, and placeholder on mobile */
             .linkedin-character-count-section,
             .linkedin-navigation-section,
             .generated-posts-display {
               display: none !important;
             }

             /* Hide placeholder content on mobile */
             .linkedin-placeholder-content {
               display: none !important;
             }

             /* Mobile optimization for top navigation */
             .linkedin-variations-nav {
               justify-content: center !important;
               width: 100% !important;
             }

             /* Reduce text area font size on mobile */
             .linkedin-modal-layout textarea {
               font-size: 0.75rem !important;
             }

             .linkedin-modal-layout textarea::placeholder {
               font-size: 0.75rem !important;
             }

             .linkedin-nav-controls {
               justify-content: center !important;
               width: 100% !important;
               flex-direction: column !important;
               gap: 0.5rem !important;
             }

             .linkedin-variation-counter {
               text-align: center !important;
               width: 100% !important;
               margin-bottom: 0.25rem !important;
               font-size: 0.8rem !important;
             }

             .linkedin-nav-controls button {
               padding: 0.5rem 0.75rem !important;
               font-size: 0.8rem !important;
               min-width: 80px !important;
               min-height: 2.5rem !important;
             }

             .linkedin-generate-alt-btn {
               margin-top: 0.5rem !important;
               width: 100% !important;
               max-width: 12.5rem !important;
               justify-content: center !important;
             }
          }
        `}
      </style>

      {isOpen && (
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
                  <div 
            className="linkedin-modal"
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              width: '100%',
              maxWidth: '480px', // Mobile-first: full width up to mobile max
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div 
              className="linkedin-modal-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '0.0625rem solid #e5e7eb',
                backgroundColor: '#0077b5',
                color: 'white',
                position: 'relative'
              }}
            >
              <div>
                <h2 style={{ fontWeight: '600', margin: 0 }}>
                  LinkedIn Thought Leadership Generator
                </h2>
                <p style={{ opacity: 0.9 }}>
                  Create viral LinkedIn posts using Reddit insights that position you as an industry expert
                </p>
              </div>
              <button
                onClick={onClose}
                className="linkedin-modal-close"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="linkedin-modal-layout" style={{ flex: 1, overflow: 'hidden' }}>
              {/* Left Panel - Prompts and Example Style */}
              <div className="linkedin-modal-panel"
              >
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: '#374151' }}>
                  Content Generation Settings
                </h3>

                {/* Instruction message when not using example style */}
                {!useExampleStyle && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '2rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '0.0625rem solid #e2e8f0'
                  }}>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#64748b', 
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      Check the "Use this style" box or expand Advanced Prompt Settings to generate posts.
                    </p>
                  </div>
                )}

                {/* Example Post Style Section - Collapsible */}
                {showExampleStyleSection && (
                  <>
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f0f9ff', borderRadius: '0.75rem', border: '0.0625rem solid #0077b5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#0077b5', margin: 0 }}>
                          Example Post Style (Optional)
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={useExampleStyle}
                            onChange={(e) => setUseExampleStyle(e.target.checked)}
                                                          style={{ width: '1rem', height: '1rem' }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>Use this style</span>
                        </label>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem', lineHeight: '1.4' }}>
                        Paste a viral LinkedIn post you admire. When enabled, this will override the user prompt and generate content in this exact style.
                      </p>
                      <textarea
                        value={examplePostStyle}
                        onChange={(e) => {
                          setExamplePostStyle(e.target.value);
                          setHasUserInput(true);
                        }}
                        placeholder="Paste in a viral LinkedIn post here."
                        rows={6}
                        className="content-creation-textarea"
                        style={{
                          width: '100%',
                          border: useExampleStyle ? '0.125rem solid #0077b5' : '0.0625rem solid #e5e7eb',
                          borderRadius: '0.5rem',
                          backgroundColor: '#fafafa',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          color: '#374151'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0077b5'}
                        onBlur={(e) => e.target.style.borderColor = useExampleStyle ? '#0077b5' : '#e5e7eb'}
                      />
                      
                      {/* Reddit Context - Always Included - Collapsible */}
                      <div style={{
                        marginTop: '1rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '0.5rem',
                        border: '0.0625rem solid #dee2e6'
                      }}>
                        <button
                          onClick={() => setShowRedditContext(!showRedditContext)}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: '0.5rem',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <h5 style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#495057', 
                            margin: 0
                          }}>
                            📊 Reddit Analysis Context (Auto-Included)
                          </h5>
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: '#6c757d',
                            transform: showRedditContext ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}>
                            ▼
                          </span>
                        </button>
                        
                        {showRedditContext && (
                          <div style={{ padding: '0 1rem 1rem 1rem' }}>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#6c757d', 
                              lineHeight: '1.4',
                              fontFamily: 'monospace',
                              backgroundColor: 'white',
                              padding: '0.75rem',
                              borderRadius: '0.25rem',
                              border: '0.0625rem solid #e9ecef'
                            }}>
                              <div><strong>📝 Reddit Title:</strong> {post.title}</div>
                              <div style={{marginTop: '0.5rem'}}><strong>📄 Reddit Content:</strong> {post.content || 'No additional content provided'}</div>
                              <div style={{marginTop: '0.5rem'}}><strong>🎯 Pain Point:</strong> {post.analysis.pain_point}</div>
                              <div style={{marginTop: '0.5rem'}}><strong>💡 Content Opportunity:</strong> {post.analysis.content_opportunity}</div>
                              <div style={{marginTop: '0.5rem'}}><strong>👥 Audience Insight:</strong> {post.analysis.audience_insight}</div>
                            </div>
                            <p style={{ 
                              fontSize: '0.7rem', 
                              color: '#6c757d', 
                              margin: '0.75rem 0 0 0',
                              fontStyle: 'italic'
                            }}>
                              This context is automatically included with your example post to ensure content is grounded in the Reddit analysis.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Generate Button for Example Style */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: '2rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <button
                          onClick={generateLinkedInPost}
                          disabled={isGenerating || !brandKit || !useExampleStyle || !examplePostStyle.trim()}
                          className="apollo-btn-gradient"
                          style={{
                            opacity: isGenerating || !brandKit || !useExampleStyle || !examplePostStyle.trim() ? 0.6 : 1,
                            cursor: isGenerating || !brandKit || !useExampleStyle || !examplePostStyle.trim() ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isGenerating ? (
                            <>
                              <Clock className="animate-spin" style={{width: '1rem', height: '1rem', marginRight: '0.5rem'}} />
                              {getMimicryMessages()[generationStep]}
                            </>
                          ) : (
                            <>
                              <Wand2 size={16} style={{marginRight: '0.5rem'}} />
                              Generate LinkedIn Post (Mimicry Mode)
                            </>
                          )}
                        </button>
                        {!brandKit && (
                          <p style={{ color: '#ef4444', fontWeight: '500', fontSize: '0.875rem', margin: 0 }}>
                            Please configure your Brand Kit first in the{' '}
                            <Link to="/brand-kit" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '600' }}>
                              Brand Kit page
                            </Link>
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Advanced Prompts Toggle */}
                {!useExampleStyle ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      onClick={() => {
                        const newAdvancedState = !showAdvancedPrompts;
                        setShowAdvancedPrompts(newAdvancedState);
                        // Collapse Example Style section when Advanced Settings is expanded
                        if (newAdvancedState) {
                          setShowExampleStyleSection(false);
                        } else {
                          setShowExampleStyleSection(true);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f8fafc',
                        border: '0.0625rem solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        color: '#475569',
                        width: '100%',
                        justifyContent: 'space-between'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <span>Advanced Prompt Settings</span>
                      <ChevronDown 
                        size={16} 
                        style={{ 
                          transform: showAdvancedPrompts ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }} 
                      />
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    marginBottom: '1rem',
                    padding: '1rem',
                    backgroundColor: '#fff7ed',
                    borderRadius: '0.5rem',
                    border: '0.0625rem solid #fed7aa'
                  }}>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#9a3412', 
                      margin: 0,
                      lineHeight: '1.5',
                      textAlign: 'center'
                    }}>
                      <strong>Mimicry Mode Active</strong><br/>
                      Uncheck "Use this style" above to access Advanced Prompt Settings and customize system/user prompts.
                    </p>
                  </div>
                )}

                {/* System Prompt - Only show if advanced prompts are open and not using example style */}
                {showAdvancedPrompts && !useExampleStyle && (
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
                        onClick={(e) => handleVariablesButtonClick('system', e)}
                        className="linkedin-modal-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#f3f4f6',
                          border: '0.0625rem solid #d1d5db',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
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
                      placeholder="Paste in a viral LinkedIn post you admire. When enabled, this will override the user prompt and generate content in this exact style."
                      rows={6}
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
                )}

                {/* User Prompt - Only show if advanced prompts are open and not using example style */}
                {showAdvancedPrompts && !useExampleStyle && (
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
                        onClick={(e) => handleVariablesButtonClick('user', e)}
                        className="linkedin-modal-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#f3f4f6',
                          border: '0.0625rem solid #d1d5db',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
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
                      placeholder="Provide specific instructions for LinkedIn content creation, including Reddit context and requirements for viral thought leadership posts..."
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
                )}

                {/* Generate Button for Advanced Prompts - Only show if advanced prompts are open and not using example style */}
                {showAdvancedPrompts && !useExampleStyle && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.75rem',
                    border: '0.0625rem solid #e2e8f0'
                  }}>
                    <button
                      onClick={generateLinkedInPost}
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
                          {getAdvancedMessages()[generationStep]}
                        </>
                      ) : (
                        <>
                          <Wand2 size={16} style={{marginRight: '0.5rem'}} />
                          Generate LinkedIn Post
                        </>
                      )}
                    </button>
                    {!brandKit && (
                      <p style={{ color: '#ef4444', fontWeight: '500', fontSize: '0.875rem', margin: '1rem 0 0 0', textAlign: 'center' }}>
                        Configure{' '}
                        <Link to="/brand-kit" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '600' }}>
                          Brand Kit
                        </Link>
                        {' '}to generate post
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Panel - Generated Content */}
              <div className={`linkedin-modal-panel linkedin-generated-section ${generatedPost ? 'has-content' : ''}`}
              >
                <div ref={generatedContentRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                    Generated LinkedIn Post
                  </h3>
                  
                  {postVariations.length > 0 && (
                    <div className="linkedin-variations-nav" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <div className="linkedin-nav-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="linkedin-variation-counter" style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                          Variation {currentVariation + 1} of {postVariations.length}
                        </span>
                        <button
                          onClick={() => setCurrentVariation((prev) => (prev > 0 ? prev - 1 : postVariations.length - 1))}
                          disabled={postVariations.length <= 1 || currentVariation === 0}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: (postVariations.length <= 1 || currentVariation === 0) ? '#f3f4f6' : 'white',
                            border: '0.0625rem solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: (postVariations.length <= 1 || currentVariation === 0) ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: (postVariations.length <= 1 || currentVariation === 0) ? '#9ca3af' : '#374151',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (postVariations.length > 1 && currentVariation > 0) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (postVariations.length > 1 && currentVariation > 0) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }
                          }}
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={() => {
                            setCurrentVariation((prev) => (prev < postVariations.length - 1 ? prev + 1 : 0));
                            setTimeout(() => scrollToTop(), 100);
                          }}
                          disabled={postVariations.length <= 1 || currentVariation === postVariations.length - 1}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: (postVariations.length <= 1 || currentVariation === postVariations.length - 1) ? '#f3f4f6' : 'white',
                            border: '0.0625rem solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: (postVariations.length <= 1 || currentVariation === postVariations.length - 1) ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: (postVariations.length <= 1 || currentVariation === postVariations.length - 1) ? '#9ca3af' : '#374151',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (postVariations.length > 1 && currentVariation < postVariations.length - 1) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (postVariations.length > 1 && currentVariation < postVariations.length - 1) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }
                          }}
                        >
                          Next →
                        </button>
                        
                        <button
                          onClick={generateAlternativePost}
                          disabled={isGenerating || !brandKit}
                          className="linkedin-generate-alt-btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.375rem 0.75rem',
                            backgroundColor: isGenerating || !brandKit ? '#f3f4f6' : '#f0f9ff',
                            color: isGenerating || !brandKit ? '#9ca3af' : '#0077b5',
                            border: `0.0625rem solid ${isGenerating || !brandKit ? '#e5e7eb' : '#0077b5'}`,
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: isGenerating || !brandKit ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (!isGenerating && brandKit) {
                              e.currentTarget.style.backgroundColor = '#0077b5';
                              e.currentTarget.style.color = 'white';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!isGenerating && brandKit) {
                              e.currentTarget.style.backgroundColor = '#f0f9ff';
                              e.currentTarget.style.color = '#0077b5';
                            }
                          }}
                        >
                          {isGenerating ? (
                            <>
                              <Clock className="animate-spin" style={{width: '14px', height: '14px'}} />
                              {useExampleStyle ? getMimicryMessages()[generationStep] : getAdvancedMessages()[generationStep]}
                            </>
                          ) : (
                            <>
                          <Wand2 size={14} />
                          Generate Alternative
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Character Count and Tips - Always Visible */}
                  <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: (isEditingContent ? editableContent.length : (generatedPost ? generatedPost.length : 0)) > 3000 ? '#fef2f2' : '#f0f9ff',
                    borderRadius: '0.75rem',
                  border: `0.0625rem solid ${(isEditingContent ? editableContent.length : (generatedPost ? generatedPost.length : 0)) > 3000 ? '#fecaca' : '#bfdbfe'}`
                    }}>
                      <div 
                        className="linkedin-char-count"
                        style={{ 
                          display: 'flex', 
                          marginBottom: '0.75rem'
                        }}
                      >
                          <div style={{
                      fontSize: '0.875rem', 
                      color: (isEditingContent ? editableContent.length : (generatedPost ? generatedPost.length : 0)) > 3000 ? '#dc2626' : '#0077b5', 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {(isEditingContent ? editableContent.length : (generatedPost ? generatedPost.length : 0)) > 3000 && (
                        <span style={{ fontSize: '1rem' }}>⚠️</span>
                      )}
                      Character count: {isEditingContent ? editableContent.length : (generatedPost ? generatedPost.length : 0)}/3000
                      {(isEditingContent ? editableContent.length : (generatedPost ? generatedPost.length : 0)) > 3000 && (
                        <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                          (Exceeds LinkedIn optimal limit)
                        </span>
                      )}
                        </div>
                        
                    {/* Action Buttons */}
                    {generatedPost && (
                        <div className="linkedin-action-buttons" style={{ 
                          display: 'flex', 
                          gap: '0.75rem', 
                          alignItems: 'center',
                          flexWrap: 'wrap', // Allow wrapping on mobile
                          justifyContent: 'center' // Center the buttons
                        }}>
                          {/* Edit/Save Button */}
                          <button
                            onClick={toggleEditMode}
                            className="linkedin-modal-btn mobile-hide-edit"
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
                                Edit Post
                              </>
                            )}
                          </button>

                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={copyLinkedInPost}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1rem',
                                backgroundColor: '#0077b5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: '2.75rem', // Touch-friendly
                                minWidth: '13.75rem',
                                justifyContent: 'center'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#005582';
                                e.currentTarget.style.transform = 'translateY(-0.0625)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#0077b5';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <Copy size={14} />
                            Copy LinkedIn Post
                            </button>
                            
                            {showCopiedMessage && (
                              <div style={{
                                position: 'absolute',
                                top: '3rem',
                                right: 0,
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

                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={openLinkedInShare}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              backgroundColor: '#f8fafc',
                              color: '#0077b5',
                              border: '0.0625rem solid #0077b5',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#0077b5';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                              e.currentTarget.style.color = '#0077b5';
                            }}
                            title="Automatically copies post and opens LinkedIn"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            Copy & Open LinkedIn
                          </button>
                          
                          {/* Enhanced LinkedIn message */}
                          {showLinkedInMessage && (
                            <div style={{
                              position: 'absolute',
                              top: '3.5rem',
                              right: 0,
                              width: '20rem',
                              padding: '1rem 1.25rem',
                              backgroundColor: '#0077b5',
                              color: 'white',
                              borderRadius: '0.75rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              boxShadow: '0 0.625rem 1.5625rem -0.1875rem rgba(0, 119, 181, 0.4), 0 0.25rem 0.375rem -0.125rem rgba(0, 119, 181, 0.2)',
                              zIndex: 1001,
                              border: '0.125rem solid #005582',
                              animation: 'fadeInScale 0.3s ease-out'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <div style={{
                                  width: '1.5rem',
                                  height: '1.5rem',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginTop: '0.125rem'
                                }}>
                                  <Check size={14} />
                        </div>
                                <div>
                                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                    Content Copied & LinkedIn Opened!
                      </div>
                                  <div style={{ fontSize: '0.8rem', lineHeight: '1.4', opacity: 0.95 }}>
                                    Your post is ready to paste in the LinkedIn composer. Just press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong> on Mac) to paste it.
                                  </div>
                                </div>
                              </div>
                              
                              {/* Progress bar */}
                              <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: '0.1875rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                borderRadius: '0 0 0.75rem 0.75rem',
                                width: '100%',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%',
                                  backgroundColor: 'white',
                                  borderRadius: '0 0 0.75rem 0.75rem',
                                  animation: 'progressBar 8s linear forwards'
                                }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0077b5' }}>
                      💡 LinkedIn Engagement Tips
                    </div>
                  </div>
                  
                  <ul style={{ 
                    fontSize: '0.75rem', 
                    color: '#374151', 
                    margin: '0.5rem 0 0 0', 
                    paddingLeft: '1.25rem',
                    lineHeight: '1.5'
                  }}>
                    <li>Post between 8-10 AM or 12-2 PM for best reach</li>
                    <li>Engage with comments within the first hour</li>
                    <li>Ask a question to encourage discussion</li>
                    <li>Tag relevant connections (2-3 max)</li>
                  </ul>
                  
                  {/* Clear Button - Centered */}
                  {generatedPost && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '0.0625rem solid #e5e7eb'
                    }}>
                      <button
                        onClick={clearGeneratedContent}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#fef2f2',
                          border: '0.0625rem solid #fecaca',
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
                  )}
                </div>

                {/* Mobile View Post Button */}
                {generatedPost && (
                  <div className="mobile-view-post-btn" style={{ display: 'none', marginBottom: '1rem' }}>
                    <button
                      onClick={handleViewGeneratedPost}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '1rem 1.5rem',
                        backgroundColor: '#0077b5',
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
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#005885')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0077b5')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      View LinkedIn Post
                    </button>
                  </div>
                )}

                {generatedPost ? (
                  <div className="generated-posts-display" style={{
                    border: '0.0625rem solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '2rem',
                    backgroundColor: 'white',
                    minHeight: '25rem',
                    position: 'relative'
                  }}>
                    {/* Variation Type Badge */}
                    {postVariations.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#0077b5',
                        color: 'white',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Variation {currentVariation + 1}
                      </div>
                    )}

                    {/* Edit Mode Indicator */}
                    {isEditingContent && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        ✏️ EDITING
                      </div>
                    )}

                    {isEditingContent ? (
                      <textarea
                        ref={editableContentRef}
                        value={editableContent}
                        onChange={(e) => setEditableContent(e.target.value)}
                        placeholder="Edit your LinkedIn post content here..."
                        style={{
                          width: '100%',
                          minHeight: '33.125rem',
                          padding: '1rem 1.25rem',
                          border: '0.125rem solid #f59e0b',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          backgroundColor: '#fffbf5',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          lineHeight: '1.6',
                          color: '#374151',
                          marginTop: postVariations.length > 1 ? '1.5rem' : '0'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#d97706'}
                        onBlur={(e) => e.target.style.borderColor = '#f59e0b'}
                      />
                    ) : (
                      <div style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.6',
                        fontSize: '1rem',
                        color: '#374151',
                        marginTop: postVariations.length > 1 ? '1.5rem' : '0'
                      }}>
                        {generatedPost}
                      </div>
                    )}
                    
                  </div>
                ) : (
                    <div className="linkedin-placeholder-content" style={{
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
                      <svg 
                        width="48" 
                        height="48" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                        style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block', color: '#0077b5' }}
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <p style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                        Your LinkedIn post will appear here
                      </p>
                      <p style={{ margin: 0 }}>
                        Configure your settings and click "Generate LinkedIn Post" to create viral thought leadership content
                      </p>
                      {!brandKit && (
                        <p style={{ marginTop: '1rem', color: '#ef4444', fontWeight: '500', margin: '1rem 0 0 0' }}>
                          Please configure your Brand Kit first in the{' '}
                          <Link to="/brand-kit" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '600' }}>
                            Brand Kit page
                          </Link>
                        </p>
                      )}
                          </div>
                  </div>
                )}
                
                {/* Navigation and Action Section - Below Generated Content */}
                {postVariations.length > 0 && generatedPost && generatedPost.trim().length > 0 && (
                  <div className="linkedin-navigation-section" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                          Variation {currentVariation + 1} of {postVariations.length}
                        </span>
                        <button
                          onClick={() => {
                            setCurrentVariation((prev) => (prev > 0 ? prev - 1 : postVariations.length - 1));
                            setTimeout(() => scrollToTop(), 100);
                          }}
                          disabled={postVariations.length <= 1 || currentVariation === 0}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: (postVariations.length <= 1 || currentVariation === 0) ? '#f3f4f6' : 'white',
                            border: '0.0625rem solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: (postVariations.length <= 1 || currentVariation === 0) ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: (postVariations.length <= 1 || currentVariation === 0) ? '#9ca3af' : '#374151',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (postVariations.length > 1 && currentVariation > 0) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (postVariations.length > 1 && currentVariation > 0) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }
                          }}
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={() => {
                            setCurrentVariation((prev) => (prev < postVariations.length - 1 ? prev + 1 : 0));
                            setTimeout(() => scrollToTop(), 100);
                          }}
                          disabled={postVariations.length <= 1 || currentVariation === postVariations.length - 1}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: (postVariations.length <= 1 || currentVariation === postVariations.length - 1) ? '#f3f4f6' : 'white',
                            border: '0.0625rem solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: (postVariations.length <= 1 || currentVariation === postVariations.length - 1) ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: (postVariations.length <= 1 || currentVariation === postVariations.length - 1) ? '#9ca3af' : '#374151',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (postVariations.length > 1 && currentVariation < postVariations.length - 1) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (postVariations.length > 1 && currentVariation < postVariations.length - 1) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }
                          }}
                        >
                          Next →
                        </button>
                      </div>
                      
                      <button
                        onClick={generateAlternativePost}
                        disabled={isGenerating || !brandKit}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.375rem 0.75rem',
                          backgroundColor: isGenerating || !brandKit ? '#f3f4f6' : '#f0f9ff',
                          color: isGenerating || !brandKit ? '#9ca3af' : '#0077b5',
                          border: `0.0625rem solid ${isGenerating || !brandKit ? '#e5e7eb' : '#0077b5'}`,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: isGenerating || !brandKit ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!isGenerating && brandKit) {
                            e.currentTarget.style.backgroundColor = '#0077b5';
                            e.currentTarget.style.color = 'white';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isGenerating && brandKit) {
                            e.currentTarget.style.backgroundColor = '#f0f9ff';
                            e.currentTarget.style.color = '#0077b5';
                          }
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <Clock className="animate-spin" style={{width: '10.25rem', height: '10.25rem'}} />
                            {useExampleStyle ? getMimicryMessages()[generationStep] : getAdvancedMessages()[generationStep]}
                          </>
                        ) : (
                          <>
                            <Wand2 size={14} />
                            Generate Alternative
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Character Count and Action Buttons - Only show when content is generated */}
                {postVariations.length > 0 && generatedPost && generatedPost.trim().length > 0 && (
                          <div className="linkedin-character-count-section" style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: generatedPost && generatedPost.length > 3000 ? '#fef2f2' : '#f0f9ff',
                  borderRadius: '0.75rem',
                  border: `0.0625rem solid ${generatedPost && generatedPost.length > 3000 ? '#fecaca' : '#bfdbfe'}`
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      fontSize: '0.875rem', 
                      color: generatedPost && generatedPost.length > 3000 ? '#dc2626' : '#0077b5', 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {generatedPost && generatedPost.length > 3000 && (
                        <span style={{ fontSize: '1rem' }}>⚠️</span>
                      )}
                      Character count: {generatedPost ? generatedPost.length : 0}/3000
                      {generatedPost && generatedPost.length > 3000 && (
                        <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                          (Exceeds LinkedIn optimal limit)
                        </span>
                      )}
                        </div>
                        
                    {/* Action Buttons */}
                    {generatedPost && (
                        <div className="linkedin-action-buttons" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                                Edit Post
                              </>
                            )}
                          </button>

                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={copyLinkedInPost}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1rem',
                                backgroundColor: '#0077b5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: '2.75rem',
                                minWidth: '13.125rem',
                                justifyContent: 'center'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#005582';
                                e.currentTarget.style.transform = 'translateY(-0.0625)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#0077b5';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <Copy size={14} />
                            Copy LinkedIn Post
                            </button>
                            
                            {showCopiedMessage && (
                              <div style={{
                                position: 'absolute',
                                top: '3rem',
                                right: 0,
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

                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={openLinkedInShare}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              backgroundColor: '#f8fafc',
                              color: '#0077b5',
                              border: '0.0625rem solid #0077b5',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#0077b5';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                              e.currentTarget.style.color = '#0077b5';
                            }}
                            title="Automatically copies post and opens LinkedIn"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            Copy & Open LinkedIn
                          </button>
                          
                          {/* Enhanced LinkedIn message */}
                          {showLinkedInMessage && (
                            <div style={{
                              position: 'absolute',
                              top: '3.5rem',
                              right: 0,
                              width: '20rem',
                              padding: '1rem 1.25rem',
                              backgroundColor: '#0077b5',
                              color: 'white',
                              borderRadius: '0.75rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              boxShadow: '0 0.625rem 1.5625rem -0.1875rem rgba(0, 119, 181, 0.4), 0 0.25rem 0.375rem -0.125rem rgba(0, 119, 181, 0.2)',
                              zIndex: 1001,
                              border: '0.125rem solid #005582',
                              animation: 'fadeInScale 0.3s ease-out'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <div style={{
                                  width: '1.5rem',
                                  height: '1.5rem',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginTop: '0.125rem'
                                }}>
                                  <Check size={14} />
                        </div>
                                <div>
                                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                    Content Copied & LinkedIn Opened!
                      </div>
                                  <div style={{ fontSize: '0.8rem', lineHeight: '1.4', opacity: 0.95 }}>
                                    Your post is ready to paste in the LinkedIn composer. Just press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong> on Mac) to paste it.
                                  </div>
                                </div>
                              </div>
                              
                              {/* Progress bar */}
                  <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: '0.1875rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                borderRadius: '0 0 0.75rem 0.75rem',
                                width: '100%',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%',
                                  backgroundColor: 'white',
                                  borderRadius: '0 0 0.75rem 0.75rem',
                                  animation: 'progressBar 8s linear forwards'
                                }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                                    {/* LinkedIn Engagement Tips */}
                  <div style={{ 
                    marginTop: '1rem'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0077b5',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      💡 LinkedIn Engagement Tips
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}>
                      <div style={{ marginBottom: '0.25rem' }}>• Post between 8-10 AM or 12-2 PM for best reach</div>
                      <div style={{ marginBottom: '0.25rem' }}>• Engage with comments within the first hour</div>
                      <div style={{ marginBottom: '0.25rem' }}>• Ask a question to encourage discussion</div>
                      <div>• Tag relevant connections (2-3 max)</div>
                    </div>
                  </div>
                  
                  {/* Clear Button - Centered */}
                  {generatedPost && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      paddingTop: '1rem',
                      borderTop: '0.0625rem solid #e5e7eb'
                    }}>
                      <button
                        onClick={clearGeneratedContent}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#fef2f2',
                          border: '0.0625rem solid #fecaca',
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
                )}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <LinkedInVariablesMenu
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

              {/* Mobile backdrop for variables menu */}
        {showVariablesMenu && window.innerWidth <= 768 && (
          <div 
            className="mobile-modal-backdrop"
            onClick={() => setShowVariablesMenu(false)}
          />
        )}

        {/* Mobile Generated Post Modal */}
        {showGeneratedPostModal && (
          <>
            <div 
              className="mobile-modal-backdrop"
              onClick={() => setShowGeneratedPostModal(false)}
            />
            <div style={{
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
                backgroundColor: '#0077b5',
                color: 'white'
              }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                  LinkedIn Post {postVariations.length > 1 ? `(Variation ${currentVariation + 1} of ${postVariations.length})` : ''}
                </h3>
                <button
                  onClick={() => setShowGeneratedPostModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.25rem',
                    color: 'white',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
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
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  fontSize: '1rem',
                  color: '#374151'
                }}>
                  {generatedPost}
                </div>

                {/* Character Count */}
                <div style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: generatedPost && generatedPost.length > 3000 ? '#fef2f2' : '#f0f9ff',
                  borderRadius: '0.5rem',
                  border: `0.0625rem solid ${generatedPost && generatedPost.length > 3000 ? '#fecaca' : '#bfdbfe'}`,
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: generatedPost && generatedPost.length > 3000 ? '#dc2626' : '#0077b5',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {generatedPost && generatedPost.length > 3000 && (
                      <span style={{ fontSize: '1rem' }}>⚠️</span>
                    )}
                    Character count: {generatedPost ? generatedPost.length : 0}/3000
                    {generatedPost && generatedPost.length > 3000 && (
                      <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                        (Exceeds LinkedIn optimal limit)
                      </span>
                    )}
                  </div>
                </div>

                {/* LinkedIn Engagement Tips */}
                <div style={{ 
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '0.5rem',
                  border: '0.0625rem solid #bfdbfe'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#0077b5',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    💡 LinkedIn Engagement Tips
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ marginBottom: '0.25rem' }}>• Post between 8-10 AM or 12-2 PM for best reach</div>
                    <div style={{ marginBottom: '0.25rem' }}>• Engage with comments within the first hour</div>
                    <div style={{ marginBottom: '0.25rem' }}>• Ask a question to encourage discussion</div>
                    <div>• Tag relevant connections (2-3 max)</div>
                  </div>
                </div>
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
                {/* Navigation buttons for variations */}
                {postVariations.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', width: '100%', justifyContent: 'center' }}>
                    <button
                      onClick={() => {
                        setCurrentVariation((prev) => (prev > 0 ? prev - 1 : postVariations.length - 1));
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'white',
                        border: '0.0625rem solid #d1d5db',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        transition: 'all 0.2s ease',
                        minWidth: '100px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => {
                        setCurrentVariation((prev) => (prev < postVariations.length - 1 ? prev + 1 : 0));
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'white',
                        border: '0.0625rem solid #d1d5db',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        transition: 'all 0.2s ease',
                        minWidth: '100px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap', // Allow wrapping on mobile
                  justifyContent: 'center' // Center the buttons
                }}>
                  <button
                    onClick={() => {
                      copyLinkedInPost();
                      setShowGeneratedPostModal(false);
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
                      minHeight: '2.75rem', // Touch-friendly
                      minWidth: '13.125rem',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
                  >
                    <Copy size={14} />
                    Copy Post
                  </button>

                  <button
                    onClick={() => {
                      openLinkedInShare();
                      setShowGeneratedPostModal(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#0077b5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '2.75rem', // Touch-friendly
                      minWidth: '180px',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#005885')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0077b5')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    Copy & Open LinkedIn
                  </button>
                </div>
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
              This will permanently delete all generated LinkedIn post variations and cannot be undone. Are you sure you want to continue?
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
    </>
  );
};

export default LinkedInPostModal; 
// Fixed: Added missing navigation handlers for Previous/Next variation browsing 