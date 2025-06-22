import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Clock, CheckCircle, Copy, Check, ChevronDown, Search } from 'lucide-react';
import { AnalyzedPost, BrandKit, ContentCreationRequest } from '../types';

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
      style={{
        position: 'fixed',
        top: variablesButtonPosition.top,
        left: variablesButtonPosition.left,
        width: '400px',
        maxHeight: '70vh',
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
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

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
  const [currentVariation, setCurrentVariation] = useState(0);
  const [postVariations, setPostVariations] = useState<string[]>([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const userPromptRef = useRef<HTMLTextAreaElement>(null);
  const variablesMenuRef = useRef<HTMLDivElement>(null);
  const systemVariablesButtonRef = useRef<HTMLButtonElement>(null);
  const userVariablesButtonRef = useRef<HTMLButtonElement>(null);

  // Generation progress messages
  const generationMessages = [
    'Analyzing post style...',
    'Crafting thought leadership content...',
    'Optimizing for LinkedIn engagement...',
    'Finalizing variations...'
  ];

  useEffect(() => {
    if (isOpen && post) {
      loadSavedData();
      setHasUserInput(false);
      setAutoSaveStatus('');
      
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
          return;
        }
      }
    } catch (error) {
      console.error('Error loading saved prompts:', error);
    }
    
    generateInitialPrompts();
  };

  const generateInitialPrompts = () => {
    const currentYear = new Date().getFullYear();
    const systemPromptTemplate = `You are a world-class LinkedIn thought leader and viral content creator specializing in ${post.analysis.pain_point}. Your expertise lies in transforming industry insights into compelling, engagement-driving LinkedIn posts that position the author as a trusted authority.

CURRENT YEAR: ${currentYear}

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

OUTPUT FORMAT: Return only the LinkedIn post content, no explanations.`;

    const userPromptTemplate = `Create a viral LinkedIn thought leadership post using this Reddit insight:

**Reddit Context:**
Title: ${post.title}
Pain Point: ${post.analysis.pain_point}
Content Opportunity: ${post.analysis.content_opportunity}
Audience: ${post.analysis.audience_insight}

**Post Requirements:**
1. Start with a hook that stops scrolling
2. Share a valuable insight about ${post.analysis.pain_point}
3. Include a brief story or example
4. Position the author as someone who understands this challenge
5. End with an engaging question or call-to-action
6. Mention {{ brand_kit.about_brand }} naturally where relevant
7. Use {{ brand_kit.tone_of_voice }} throughout
8. Include {{ brand_kit.cta_text }} at the end if appropriate

Create a post that would make industry professionals think "This person really gets it" and want to engage.`;

    setSystemPrompt(systemPromptTemplate);
    setUserPrompt(userPromptTemplate);
  };

  /**
   * Generate LinkedIn post with style mimicry or advanced prompts
   * Why this matters: Creates viral LinkedIn content using either style mimicry or custom prompts with variation support
   */
  const generateLinkedInPost = async () => {
    if (!brandKit) return;
    
    setIsGenerating(true);
    setGenerationStep(0);
    
    try {
      // Progress through generation steps
      const progressInterval = setInterval(() => {
        setGenerationStep(prev => (prev + 1) % generationMessages.length);
      }, 1500);

      let finalSystemPrompt = '';
      let finalUserPrompt = '';

      if (useExampleStyle && examplePostStyle.trim()) {
        // Style Mimicry Mode - analyze and replicate the example post style
        finalSystemPrompt = `You are an expert LinkedIn content strategist specializing in viral post analysis and style replication. Your task is to analyze the provided example post and create new content that matches its exact style, structure, tone, and engagement mechanics.

STYLE ANALYSIS REQUIREMENTS:
- Identify the post's hook strategy and opening technique
- Analyze sentence structure, paragraph breaks, and formatting patterns
- Determine the storytelling approach and narrative flow
- Extract the engagement mechanics (questions, calls-to-action, etc.)
- Understand the tone of voice and personality traits
- Note any unique stylistic elements or signature phrases

REPLICATION REQUIREMENTS:
- Match the exact structure and flow of the example post
- Use the same hook style and opening technique
- Replicate the paragraph breaks and formatting
- Mirror the tone of voice and writing personality
- Apply the same engagement strategy and closing technique
- Maintain similar post length and pacing
- Use similar language patterns and vocabulary level

OUTPUT: Create 3 distinct variations that all follow the analyzed style but cover different aspects of the Reddit insight. Return as a JSON array of strings.`;

        finalUserPrompt = `EXAMPLE POST TO ANALYZE AND REPLICATE:
"${examplePostStyle}"

CONTENT TO TRANSFORM USING THIS STYLE:
Reddit Title: ${post.title}
Pain Point: ${post.analysis.pain_point}
Content Opportunity: ${post.analysis.content_opportunity}
Audience Insight: ${post.analysis.audience_insight}

BRAND CONTEXT:
${brandKit.aboutBrand || 'Professional services company'}
Tone: ${brandKit.toneOfVoice || 'Professional yet approachable'}

TASK: Create 3 LinkedIn posts that use the EXACT style, structure, and engagement mechanics of the example post, but transform the Reddit insights into relevant professional content. Each variation should:

1. **Variation 1**: Focus on the main pain point and personal experience
2. **Variation 2**: Emphasize industry trends and strategic insights  
3. **Variation 3**: Highlight actionable solutions and lessons learned

Ensure each post matches the example's style while being authentic and valuable to a professional audience.`;
      } else {
        // Advanced Prompts Mode - use custom system and user prompts
        finalSystemPrompt = systemPrompt;
        finalUserPrompt = userPrompt;
      }

      // Replace brand kit variables in prompts
      const processedSystemPrompt = replaceBrandKitVariables(finalSystemPrompt, brandKit);
      const processedUserPrompt = replaceBrandKitVariables(finalUserPrompt, brandKit);

      // Call the content generation API
      const response = await fetch('/api/content/generate', {
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
      
      // Handle both single post and variations response formats
      let variations: string[] = [];
      if (Array.isArray(data.content)) {
        variations = data.content;
      } else if (data.variations && Array.isArray(data.variations)) {
        variations = data.variations;
      } else if (data.content) {
        // Single post response - create variations by splitting or duplicating
        variations = [data.content];
      } else {
        throw new Error('Invalid response format');
      }

      // Ensure we have at least one variation
      if (variations.length === 0) {
        variations = ['Error generating content. Please try again.'];
      }

      // Set the generated content
      setPostVariations(variations);
      setCurrentVariation(0);
      setGeneratedPost(variations[0]);
      
      // Save the generated posts
      saveGeneratedPosts(variations);
      
    } catch (error) {
      console.error('Error generating LinkedIn post:', error);
      const errorMessage = 'Sorry, there was an error generating your LinkedIn post. Please try again.';
      setPostVariations([errorMessage]);
      setGeneratedPost(errorMessage);
      setCurrentVariation(0);
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
   * Handle Variables Menu button clicks
   * Why this matters: Opens the variables menu positioned to the right of the clicked button to prevent cutoff
   */
  const handleVariablesButtonClick = (field: 'system' | 'user', event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    const menuHeight = Math.min(window.innerHeight * 0.7, 600); // 70vh or 600px max
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
      left: rect.right + window.scrollX + 12 // Position to the right with 12px gap
    });
    
    setActivePromptField(field);
    setShowVariablesMenu(true);
    setVariableSearchTerm('');
  };

  /**
   * Copy LinkedIn post to clipboard with optimized formatting
   * Why this matters: Provides seamless copying for LinkedIn posting with proper formatting preservation
   */
  const copyLinkedInPost = async () => {
    if (!generatedPost) return;
    
    try {
      // LinkedIn-optimized formatting: preserve line breaks and remove excessive spacing
      const linkedInFormattedPost = generatedPost
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
        textArea.value = generatedPost;
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
    if (!generatedPost) return;
    
    // LinkedIn sharing URL with pre-populated text
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`;
    
    // Copy content to clipboard first, then open LinkedIn
    copyLinkedInPost().then(() => {
      // Open LinkedIn in a new tab
      window.open(linkedInUrl, '_blank', 'width=600,height=600,scrollbars=yes,resizable=yes');
      
      // Show instruction message
      setTimeout(() => {
        alert('Content copied to clipboard! Paste it into the LinkedIn post composer that just opened.');
      }, 500);
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
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            width: '99%',
            maxWidth: '1600px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#0077b5',
              color: 'white'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.25rem', margin: 0 }}>
                  LinkedIn Thought Leadership Generator
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                  Create viral LinkedIn posts using Reddit insights that position you as an industry expert
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: 'white',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left Panel - Prompts and Example Style */}
              <div style={{ 
                flex: '0 0 45%', 
                padding: '2rem', 
                borderRight: '1px solid #e5e7eb', 
                overflowY: 'auto',
                backgroundColor: 'white'
              }}>
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
                    border: '1px solid #e2e8f0'
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
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #0077b5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#0077b5', margin: 0 }}>
                          Example Post Style (Optional)
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={useExampleStyle}
                            onChange={(e) => setUseExampleStyle(e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
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
                          padding: '1rem 1.25rem',
                          border: useExampleStyle ? '2px solid #0077b5' : '1px solid #e5e7eb',
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
                        onFocus={(e) => e.target.style.borderColor = '#0077b5'}
                        onBlur={(e) => e.target.style.borderColor = useExampleStyle ? '#0077b5' : '#e5e7eb'}
                      />
                    </div>

                    {/* Generate Button for Example Style */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: '2rem'
                    }}>
                      <button
                        onClick={generateLinkedInPost}
                        disabled={isGenerating || !brandKit || !useExampleStyle || !examplePostStyle.trim()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.875rem 2rem',
                          backgroundColor: isGenerating || !brandKit || !useExampleStyle || !examplePostStyle.trim() ? '#9ca3af' : '#0077b5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: isGenerating || !brandKit || !useExampleStyle || !examplePostStyle.trim() ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 119, 181, 0.2)',
                          opacity: !useExampleStyle || !examplePostStyle.trim() ? 0.5 : 1
                        }}
                        onMouseOver={(e) => {
                          if (!isGenerating && brandKit && useExampleStyle && examplePostStyle.trim()) {
                            e.currentTarget.style.backgroundColor = '#005582';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 119, 181, 0.3)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isGenerating && brandKit && useExampleStyle && examplePostStyle.trim()) {
                            e.currentTarget.style.backgroundColor = '#0077b5';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 119, 181, 0.2)';
                          }
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
                            Generate LinkedIn Post (Mimicry Mode)
                          </>
                        )}
                      </button>
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
                        border: '1px solid #e2e8f0',
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
                    border: '1px solid #fed7aa'
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
                      <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                        System Prompt
                      </label>
                      <button
                        ref={systemVariablesButtonRef}
                        onClick={(e) => handleVariablesButtonClick('system', e)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.8rem',
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
                        padding: '1rem 1.25rem',
                        border: '1px solid #e5e7eb',
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
                )}

                {/* User Prompt - Only show if advanced prompts are open and not using example style */}
                {showAdvancedPrompts && !useExampleStyle && (
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                        User Prompt
                      </label>
                      <button
                        ref={userVariablesButtonRef}
                        onClick={(e) => handleVariablesButtonClick('user', e)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.8rem',
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
                        padding: '1rem 1.25rem',
                        border: '1px solid #e5e7eb',
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
                )}

                {/* Generate Button for Advanced Prompts - Only show if advanced prompts are open and not using example style */}
                {showAdvancedPrompts && !useExampleStyle && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <button
                      onClick={generateLinkedInPost}
                      disabled={isGenerating || !brandKit}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.875rem 2rem',
                        backgroundColor: isGenerating || !brandKit ? '#9ca3af' : '#0077b5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: isGenerating || !brandKit ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 119, 181, 0.2)'
                      }}
                      onMouseOver={(e) => {
                        if (!isGenerating && brandKit) {
                          e.currentTarget.style.backgroundColor = '#005582';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 119, 181, 0.3)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isGenerating && brandKit) {
                          e.currentTarget.style.backgroundColor = '#0077b5';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 119, 181, 0.2)';
                        }
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
                          Generate LinkedIn Post
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Panel - Generated Content */}
              <div style={{ flex: '0 0 55%', padding: '2rem', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                    Generated LinkedIn Post
                  </h3>
                  
                  {postVariations.length > 0 && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                          Variation {currentVariation + 1} of {postVariations.length}
                        </span>
                        <button
                          onClick={() => setCurrentVariation((prev) => (prev > 0 ? prev - 1 : postVariations.length - 1))}
                          disabled={postVariations.length <= 1}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: postVariations.length <= 1 ? '#f3f4f6' : 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: postVariations.length <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: postVariations.length <= 1 ? '#9ca3af' : '#374151',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (postVariations.length > 1) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (postVariations.length > 1) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#d1d5db';
                            }
                          }}
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={() => setCurrentVariation((prev) => (prev < postVariations.length - 1 ? prev + 1 : 0))}
                          disabled={postVariations.length <= 1}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: postVariations.length <= 1 ? '#f3f4f6' : 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: postVariations.length <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: postVariations.length <= 1 ? '#9ca3af' : '#374151',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (postVariations.length > 1) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (postVariations.length > 1) {
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
                          border: `1px solid ${isGenerating || !brandKit ? '#e5e7eb' : '#0077b5'}`,
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
                        <Wand2 size={14} />
                        Generate Alternative
                      </button>
                    </div>
                  )}
                </div>

                {generatedPost ? (
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '2rem',
                    backgroundColor: 'white',
                    minHeight: '400px',
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
                        Style {currentVariation + 1}
                      </div>
                    )}

                    <div style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6',
                      fontSize: '1rem',
                      color: '#374151',
                      marginTop: postVariations.length > 1 ? '1.5rem' : '0'
                    }}>
                      {generatedPost}
                    </div>
                    
                    <div style={{
                      marginTop: '2rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            Character count: {generatedPost.length}/3000
                          </div>
                          
                          {/* Engagement Tips */}
                          <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#f0f9ff',
                            borderRadius: '0.5rem',
                            border: '1px solid #bfdbfe',
                            maxWidth: '300px'
                          }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0077b5', marginBottom: '0.25rem' }}>
                              💡 LinkedIn Engagement Tips
                            </div>
                            <ul style={{ 
                              fontSize: '0.7rem', 
                              color: '#374151', 
                              margin: 0, 
                              paddingLeft: '1rem',
                              lineHeight: '1.4'
                            }}>
                              <li>Post between 8-10 AM or 12-2 PM for best reach</li>
                              <li>Engage with comments within the first hour</li>
                              <li>Ask a question to encourage discussion</li>
                              <li>Tag relevant connections (2-3 max)</li>
                            </ul>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={copyLinkedInPost}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: '#0077b5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#005582';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#0077b5';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <Copy size={14} />
                              Copy to LinkedIn
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
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                zIndex: 1000
                              }}>
                                <Check style={{ width: '0.875rem', height: '0.875rem' }} />
                                Copied!
                              </div>
                            )}
                          </div>

                          <button
                            onClick={openLinkedInShare}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1rem',
                              backgroundColor: '#f8fafc',
                              color: '#0077b5',
                              border: '1px solid #0077b5',
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
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            Open LinkedIn
                          </button>
                        </div>
                      </div>
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
                    </div>
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
    </>
  );
};

export default LinkedInPostModal; 