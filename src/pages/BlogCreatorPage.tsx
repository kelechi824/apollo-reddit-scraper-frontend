import React, { useState, useEffect, useRef } from 'react';
import { Play, Upload, MoreHorizontal, FileText, ExternalLink, Copy, RefreshCw, Trash2, X, AlertTriangle, Globe, Brain, BarChart3, Sparkles, Clock, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import BlogContentActionModal from '../components/BlogContentActionModal';
import BackendDetailsPopup from '../components/BackendDetailsPopup';
import { autoSaveBlogIfReady } from '../services/blogHistoryService';
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from '../config/api';


// Define interfaces for our data structure
interface KeywordRow {
  id: string;
  keyword: string;
  monthlyVolume?: number;
  avgDifficulty?: number;
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
  
  // Enhanced backend workflow details for popup display
  workflowDetails?: {
    firecrawl?: {
      urls_analyzed: string[];
      competitor_titles: string[];
      key_topics: string[];
      content_structure_insights: string[];
      search_metadata: any;
    };
    deepResearch?: {
      key_insights: string[];
      market_trends: string[];
      audience_needs: string[];
      content_gaps: string[];
      research_confidence: number;
      sources_analyzed: number;
      model_used: string;
    };
    gapAnalysis?: {
      identified_gaps: string[];
      competitive_coverage: string;
      recommended_angle: string;
      gap_scores: any;
      seo_suggestions: string[];
    };
    contentGeneration?: {
      processing_steps: string[];
      brand_variables_processed: number;
      citations_count: number;
      quality_score: number;
      model_pipeline: string[];
    };
    currentStage?: string;
    retryCount?: number;
    canResume?: boolean;
  };
}

interface CSVUploadResult {
  keywords: string[];
  totalProcessed: number;
  errors: string[];
}

/**
 * Extract detailed workflow information from backend workflowState
 * Why this matters: Transforms backend completedStages data into frontend-friendly format for popup display
 */
const extractWorkflowDetails = (workflowState: any): KeywordRow['workflowDetails'] => {
  console.log(`🔧 Extracting workflow details from workflowState:`, workflowState);
  
  const { completedStages, currentStage, retryCount, canResume } = workflowState;
  
  const workflowDetails: KeywordRow['workflowDetails'] = {
    currentStage,
    retryCount,
    canResume
  };

  console.log(`📋 CompletedStages keys: ${Object.keys(completedStages || {})}`, completedStages);

  // Extract Firecrawl data
  if (completedStages?.firecrawl) {
    console.log(`🌐 Processing Firecrawl data:`, completedStages.firecrawl);
    const firecrawl = completedStages.firecrawl;
    workflowDetails.firecrawl = {
      urls_analyzed: firecrawl.top_results?.map((r: any) => r.url) || [],
      competitor_titles: firecrawl.top_results?.map((r: any) => r.title) || [],
      key_topics: firecrawl.top_results?.flatMap((r: any) => r.key_topics || []) || [],
      content_structure_insights: firecrawl.top_results?.map((r: any) => 
        `${r.content_structure?.numbered_lists || 0} lists, ${r.content_structure?.bullet_points || 0} bullets, ${r.word_count || 0} words`
      ) || [],
      search_metadata: firecrawl.search_metadata
    };
    console.log(`✅ Extracted Firecrawl data:`, workflowDetails.firecrawl);
  } else {
    console.log(`❌ No Firecrawl data found in completedStages`);
  }

  // Extract Deep Research data
  if (completedStages?.deep_research) {
    console.log(`🧠 Processing Deep Research data:`, completedStages.deep_research);
    const deepResearch = completedStages.deep_research;
    workflowDetails.deepResearch = {
      key_insights: deepResearch.research_findings?.key_insights || [],
      market_trends: deepResearch.research_findings?.market_trends || [],
      audience_needs: deepResearch.research_findings?.audience_needs || [],
      content_gaps: deepResearch.research_findings?.content_gaps || [],
      research_confidence: deepResearch.research_depth?.confidence_score || 0,
      sources_analyzed: deepResearch.research_depth?.sources_analyzed || 0,
      model_used: deepResearch.research_metadata?.model_used || 'Unknown'
    };
    console.log(`✅ Extracted Deep Research data:`, workflowDetails.deepResearch);
  } else {
    console.log(`❌ No Deep Research data found in completedStages`);
  }

  // Extract Gap Analysis data
  if (completedStages?.gap_analysis) {
    console.log(`📊 Processing Gap Analysis data:`, completedStages.gap_analysis);
    const gapAnalysis = completedStages.gap_analysis;
    workflowDetails.gapAnalysis = {
      identified_gaps: gapAnalysis.analysis_summary?.identified_gaps || [],
      competitive_coverage: gapAnalysis.analysis_summary?.competitive_coverage || '',
      recommended_angle: gapAnalysis.analysis_summary?.recommended_content_angle || '',
      gap_scores: gapAnalysis.gap_score || {},
      seo_suggestions: gapAnalysis.content_strategy?.seo_optimization_suggestions || []
    };
    console.log(`✅ Extracted Gap Analysis data:`, workflowDetails.gapAnalysis);
  } else {
    console.log(`❌ No Gap Analysis data found in completedStages`);
  }

  // Extract Content Generation data (if available)
  if (completedStages?.content_generation) {
    console.log(`✨ Processing Content Generation data:`, completedStages.content_generation);
    workflowDetails.contentGeneration = {
      processing_steps: completedStages.content_generation.processing_steps || [],
      brand_variables_processed: 0, // Will be set from metadata
      citations_count: 0, // Will be set from metadata  
      quality_score: 0, // Will be set from metadata
      model_pipeline: ['Claude Sonnet 4'] // Basic info
    };
    console.log(`✅ Extracted Content Generation data:`, workflowDetails.contentGeneration);
  } else {
    console.log(`❌ No Content Generation data found in completedStages`);
  }

  console.log(`🎯 Final extracted workflowDetails:`, workflowDetails);
  return workflowDetails;
};

/**
 * Parse AI response to extract content and meta fields from JSON
 * Why this matters: Extracts metaSeoTitle and metaDescription from AI JSON responses
 */
const parseAIResponse = (responseText: string): { content: string; metaSeoTitle: string; metaDescription: string } => {
  console.log('🔍 [BlogCreator] Parsing AI response for meta fields, length:', responseText.length);
  
  try {
    // Try to parse as JSON directly first
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (firstError) {
      // If direct parsing fails, try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw firstError;
      }
    }

    // Check if we have the expected JSON structure
    if (parsed && typeof parsed === 'object') {
      const hasContent = parsed.content && typeof parsed.content === 'string';
      const hasTitle = parsed.metaSeoTitle && typeof parsed.metaSeoTitle === 'string';
      const hasDescription = parsed.metaDescription && typeof parsed.metaDescription === 'string';
      
      console.log('🔍 [BlogCreator] Parsed object structure:', {
        hasContent,
        hasTitle,
        hasDescription,
        keys: Object.keys(parsed)
      });
      
      if (hasContent || hasTitle || hasDescription) {
        console.log('✅ [BlogCreator] Successfully parsed JSON response:', {
          hasContent,
          hasTitle,
          hasDescription,
          contentLength: hasContent ? parsed.content.length : 0,
          titleLength: hasTitle ? parsed.metaSeoTitle.length : 0,
          descLength: hasDescription ? parsed.metaDescription.length : 0
        });
        
        return {
          content: hasContent ? parsed.content : responseText,
          metaSeoTitle: hasTitle ? parsed.metaSeoTitle : '',
          metaDescription: hasDescription ? parsed.metaDescription : ''
        };
      }
    }
  } catch (error) {
    console.log('❌ [BlogCreator] JSON parsing failed:', error);
  }

  console.log('⚠️ [BlogCreator] Falling back to content-only parsing');
  
  // Try to extract meta fields from the raw text if they exist
  let extractedTitle = '';
  let extractedDescription = '';
  
  // Look for patterns like "metaSeoTitle": "..."
  const titleMatch = responseText.match(/"metaSeoTitle"\s*:\s*"([^"]+)"/);
  const descMatch = responseText.match(/"metaDescription"\s*:\s*"([^"]+)"/);
  
  if (titleMatch) extractedTitle = titleMatch[1];
  if (descMatch) extractedDescription = descMatch[1];
  
  return {
    content: responseText,
    metaSeoTitle: extractedTitle,
    metaDescription: extractedDescription
  };
};

/**
 * Extract workflow details from final result for completed jobs
 * Why this matters: Fallback method to get workflow data when polling has completed
 */
const extractWorkflowDetailsFromResult = (result: any): KeywordRow['workflowDetails'] => {
  if (!result?.workflow_data) return undefined;

  const { workflow_data } = result;
  const workflowDetails: KeywordRow['workflowDetails'] = {
    currentStage: 'completed'
  };

  // Extract from workflow_data structure
  if (workflow_data.firecrawl_analysis) {
    const firecrawl = workflow_data.firecrawl_analysis;
    workflowDetails.firecrawl = {
      urls_analyzed: firecrawl.top_results?.map((r: any) => r.url) || [],
      competitor_titles: firecrawl.top_results?.map((r: any) => r.title) || [],
      key_topics: firecrawl.top_results?.flatMap((r: any) => r.key_topics || []) || [],
      content_structure_insights: firecrawl.top_results?.map((r: any) => 
        `${r.content_structure?.numbered_lists || 0} lists, ${r.content_structure?.bullet_points || 0} bullets, ${r.word_count || 0} words`
      ) || [],
      search_metadata: firecrawl.search_metadata
    };
  }

  if (workflow_data.deep_research) {
    const deepResearch = workflow_data.deep_research;
    workflowDetails.deepResearch = {
      key_insights: deepResearch.research_findings?.key_insights || [],
      market_trends: deepResearch.research_findings?.market_trends || [],
      audience_needs: deepResearch.research_findings?.audience_needs || [],
      content_gaps: deepResearch.research_findings?.content_gaps || [],
      research_confidence: deepResearch.research_depth?.confidence_score || 0,
      sources_analyzed: deepResearch.research_depth?.sources_analyzed || 0,
      model_used: deepResearch.research_metadata?.model_used || 'Unknown'
    };
  }

  if (workflow_data.gap_analysis) {
    const gapAnalysis = workflow_data.gap_analysis;
    workflowDetails.gapAnalysis = {
      identified_gaps: gapAnalysis.analysis_summary?.identified_gaps || [],
      competitive_coverage: gapAnalysis.analysis_summary?.competitive_coverage || '',
      recommended_angle: gapAnalysis.analysis_summary?.recommended_content_angle || '',
      gap_scores: gapAnalysis.gap_score || {},
      seo_suggestions: gapAnalysis.content_strategy?.seo_optimization_suggestions || []
    };
  }

  // Extract content generation details
  if (result.generation_metadata) {
    workflowDetails.contentGeneration = {
      processing_steps: result.generation_metadata.processing_steps || [],
      brand_variables_processed: result.metadata?.brand_variables_processed || 0,
      citations_count: result.metadata?.citations_included ? 1 : 0,
      quality_score: result.generation_metadata.content_quality_score || 0,
      model_pipeline: result.generation_metadata.model_pipeline || []
    };
  }

  return workflowDetails;
};

const BlogCreatorPage: React.FC = () => {
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectionMadeBySelectAll, setSelectionMadeBySelectAll] = useState<boolean>(false);
  const [showUploadErrorModal, setShowUploadErrorModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showIndividualDeleteModal, setShowIndividualDeleteModal] = useState(false);
  const [keywordToDelete, setKeywordToDelete] = useState<string | null>(null);

  // Blog Content Action Modal state
  const [showContentActionModal, setShowContentActionModal] = useState(false);
  const [selectedKeywordForActions, setSelectedKeywordForActions] = useState<KeywordRow | null>(null);

  // Backend Details Popup state
  const [popupState, setPopupState] = useState<{
    isVisible: boolean;
    keywordId: string | null;
    position: { x: number; y: number };
  }>({
    isVisible: false,
    keywordId: null,
    position: { x: 0, y: 0 }
  });
  
  // Popup hide timeout for better hover experience
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);
  // New state for enhanced concurrent processing tracking
  const [concurrentExecutions, setConcurrentExecutions] = useState<Set<string>>(new Set());
  const [bulkExecutionStatus, setBulkExecutionStatus] = useState<{
    isRunning: boolean;
    total: number;
    completed: number;
    failed: number;
  }>({ isRunning: false, total: 0, completed: 0, failed: 0 });

  // Sequential execution controls
  const stopSequentialRef = useRef<boolean>(false);
  const [isSequentialRunning, setIsSequentialRunning] = useState<boolean>(false);
  const [sequentialRemaining, setSequentialRemaining] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-save state and refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Sorting state
  const [sortField, setSortField] = useState<'monthlyVolume' | 'avgDifficulty' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(200);

  // Memoized sorted view to avoid re-sorting on every render
  const sortedKeywords = React.useMemo(() => {
    if (!sortField) return keywords;
    const copy = [...keywords];
    copy.sort((a, b) => {
      const av = a[sortField] ?? (sortField === 'monthlyVolume' ? -Infinity : Infinity);
      const bv = b[sortField] ?? (sortField === 'monthlyVolume' ? -Infinity : Infinity);
      if (av === bv) return 0;
      const base = (av as number) < (bv as number) ? -1 : 1;
      return sortDirection === 'asc' ? base : -base;
    });
    return copy;
  }, [keywords, sortField, sortDirection]);

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
    console.log(`🎯 Selected CTA anchor text: "${selectedCTA}" (${randomIndex + 1}/${ctaOptions.length})`);
    return selectedCTA;
  };

  /**
   * Generate UTM-tracked Apollo signup URL for blog creator
   * Why this matters: Creates UTM-tracked URLs to measure blog creator campaign effectiveness for specific keywords
   */
  const generateBlogCreatorSignupURL = (keyword: string): string => {
    const baseURL = 'https://www.apollo.io/sign-up';
    
    if (!keyword) {
      return baseURL;
    }
    
    // Generate UTM campaign parameter from keyword (sanitize for URL)
    const sanitizedKeyword = keyword.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single underscore
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .trim();
      
    const utmCampaign = `blog_creator_${sanitizedKeyword}`;
    const url = `${baseURL}?utm_campaign=${utmCampaign}`;
    
    console.log(`🔗 Generated Apollo signup URL with UTM: ${url}`);
    return url;
  };

  // Calculate total pages and paginated keywords
  const totalPages = React.useMemo(() => Math.max(1, Math.ceil(sortedKeywords.length / pageSize)), [sortedKeywords.length, pageSize]);
  const paginatedKeywords = React.useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return sortedKeywords.slice(start, start + pageSize);
  }, [sortedKeywords, page, pageSize, totalPages]);

  // Keep page in range when keywords/pageSize change
  React.useEffect(() => {
    setPage(p => Math.min(p, Math.max(1, Math.ceil(sortedKeywords.length / pageSize))));
  }, [sortedKeywords.length, pageSize]);

  /**
   * Handle column sorting
   * Why this matters: Allows users to prioritize by opportunity (high volume) or ease (low difficulty).
   */
  const handleSort = (field: 'monthlyVolume' | 'avgDifficulty') => {
    let nextDirection: 'asc' | 'desc' = 'desc';
    if (sortField === field) {
      nextDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      nextDirection = field === 'monthlyVolume' ? 'desc' : 'asc';
    }
    setSortField(field);
    setSortDirection(nextDirection);
    setPage(1); // Reset to first page when sorting
  };

  /**
   * Load saved progress from localStorage on mount
   * Why this matters: Restores user's Blog Creator workflow progress across page refreshes, preventing data loss.
   */
  useEffect(() => {
    const savedProgress = localStorage.getItem('apollo_blog_creator_progress');
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        
        // Restore keywords with proper Date objects and optional properties
        if (progress.keywords && Array.isArray(progress.keywords)) {
          const restoredKeywords = progress.keywords.map((keyword: any) => {
            const baseKeyword = {
              ...keyword,
              createdAt: new Date(keyword.createdAt) // Convert ISO string back to Date
            };
            
            // Ensure optional properties are properly handled
            if (keyword.monthlyVolume !== undefined) {
              baseKeyword.monthlyVolume = keyword.monthlyVolume;
            }
            if (keyword.avgDifficulty !== undefined) {
              baseKeyword.avgDifficulty = keyword.avgDifficulty;
            }
            
            return baseKeyword;
          });
          setKeywords(restoredKeywords);
        }
        
        // Restore selected rows
        if (progress.selectedRows && Array.isArray(progress.selectedRows)) {
          setSelectedRows(new Set(progress.selectedRows));
        }
        
        // Restore sort state
        if (progress.sortField) {
          setSortField(progress.sortField);
        }
        if (progress.sortDirection) {
          setSortDirection(progress.sortDirection);
        }
        
        // Restore sequential execution state
        if (Array.isArray(progress.sequentialRemaining)) {
          setSequentialRemaining(progress.sequentialRemaining);
        }
        
        console.log('Blog Creator progress restored from localStorage');
      } catch (error) {
        console.error('Error loading saved Blog Creator progress:', error);
        // Clear corrupted data
        localStorage.removeItem('apollo_blog_creator_progress');
      }
    }

    // After initial load, allow auto-save to work
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, []);

  /**
   * Auto-save progress to localStorage with debouncing
   * Why this matters: Prevents users from losing their keywords and workflow progress when the page refreshes or crashes.
   */
  useEffect(() => {
    // Skip auto-save if this is the initial load from localStorage
    if (isInitialLoadRef.current) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set auto-save status to saving
    setAutoSaveStatus('saving');

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      try {
        const progressData = {
          keywords: keywords.map(keyword => ({
            ...keyword,
            // Store full content - don't truncate as it breaks the workflow after refresh
            output: keyword.output,
            createdAt: keyword.createdAt.toISOString() // Convert Date to ISO string for storage
          })),
          selectedRows: Array.from(selectedRows), // Convert Set to Array for storage
          sortField,
          sortDirection,
          sequentialRemaining,
          timestamp: new Date().toISOString()
        };
        
        try {
          localStorage.setItem('apollo_blog_creator_progress', JSON.stringify(progressData));
          setAutoSaveStatus('saved');
        } catch (storageError: any) {
          // Handle localStorage quota exceeded
          if (storageError.name === 'QuotaExceededError') {
            console.warn('LocalStorage quota exceeded, clearing old data and retrying...');
            // Clear old auto-save data and try again with minimal data
            localStorage.removeItem('apollo_blog_creator_progress');
            const minimalData = {
              keywords: keywords.map(keyword => ({
                id: keyword.id,
                keyword: keyword.keyword,
                status: keyword.status,
                progress: keyword.progress,
                output: keyword.status === 'completed' ? keyword.output : '', // Only save completed content
                createdAt: keyword.createdAt.toISOString(),
                metadata: keyword.metadata,
                monthlyVolume: keyword.monthlyVolume,
                avgDifficulty: keyword.avgDifficulty
              })),
              selectedRows: Array.from(selectedRows),
              timestamp: new Date().toISOString()
            };
            localStorage.setItem('apollo_blog_creator_progress', JSON.stringify(minimalData));
            setAutoSaveStatus('saved');
          } else {
            throw storageError;
          }
        }
        
        // Clear the "saved" status after 2 seconds
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (error) {
        console.error('Blog Creator auto-save failed:', error);
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
  }, [keywords, selectedRows, sortField, sortDirection, sequentialRemaining]);






  /**
   * Reset sorting to original upload order
   * Why this matters: Allows users to return to the original keyword order after exploring different sorts
   */
  const resetSorting = () => {
    setSortField(null);
    setSortDirection('desc');
  };

  /**
   * Clear saved progress (for debugging or manual reset)
   * Why this matters: Allows users to start fresh by clearing localStorage data.
   */
  const clearSavedProgress = (): void => {
    localStorage.removeItem('apollo_blog_creator_progress');
    setKeywords([]);
    setSelectedRows(new Set());
    setSortField(null);
    setSortDirection('desc');
    setSequentialRemaining([]);
    setIsSequentialRunning(false);
    setUploadError(null);
    setUploadSuccess(null);
    console.log('Blog Creator progress cleared');
  };

  /**
   * Handle CSV upload completion from LargeCSVUploader
   * Why this matters: Processes the robust CSV upload results with smart deduplication to preserve existing workflow states
   */
  const handleCSVUploadComplete = (result: CSVUploadResult) => {
    try {
      // Clear previous messages
      setUploadError(null);
      setUploadSuccess(null);

      // Get existing keywords (case-insensitive for comparison)
      const existingKeywords = keywords.map(k => k.keyword.toLowerCase().trim());
      
      // Filter out duplicates - only add truly new keywords
      const newUniqueKeywords = result.keywords.filter(keyword => 
        !existingKeywords.includes(keyword.toLowerCase().trim())
      );

      // Count duplicates found
      const duplicatesFound = result.keywords.length - newUniqueKeywords.length;

      // Convert only new keywords to KeywordRow format
      const newKeywordRows = newUniqueKeywords.map((keyword, index) => ({
        id: `keyword-${Date.now()}-${index}`,
        keyword: keyword,
        // monthlyVolume and avgDifficulty will be populated from CSV or manual entry later
        status: 'pending' as const,
        progress: '',
        output: '',
        createdAt: new Date()
      }));

      // Add only new keywords to existing list (preserving existing states)
      setKeywords(prev => [...prev, ...newKeywordRows]);

      // Set success message with deduplication info
      let successMsg = '';
      if (newUniqueKeywords.length > 0 && duplicatesFound > 0) {
        successMsg = `Added ${newUniqueKeywords.length} new keywords (${duplicatesFound} duplicates skipped to preserve existing workflow states)`;
      } else if (newUniqueKeywords.length > 0) {
        successMsg = `Successfully added ${newUniqueKeywords.length} new keywords`;
      } else {
        successMsg = `No new keywords added - all ${duplicatesFound} keywords already exist`;
      }
      setUploadSuccess(successMsg);

      // Show processing info and errors if any
      if (result.errors.length > 0) {
        const errorMsg = `Upload processed ${result.totalProcessed} rows with ${result.errors.length} warnings: ${result.errors.slice(0, 2).join(', ')}${result.errors.length > 2 ? '...' : ''}`;
        setUploadError(errorMsg);
        setShowUploadErrorModal(true);
      }

      // No need to collapse upload section since we now use compact button

      // Clear messages after 7 seconds (longer to read deduplication info)
      setTimeout(() => {
        setUploadSuccess(null);
        setUploadError(null);
      }, 7000);

    } catch (error) {
      setUploadError('Failed to process uploaded keywords');
      setShowUploadErrorModal(true);
      console.error('Error processing CSV upload:', error);
    }
  };

  /**
   * Handle direct CSV file upload from compact button
   * Why this matters: Provides streamlined upload without taking up page space
   */
  const handleDirectCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear previous errors
      setUploadError(null);
      setUploadSuccess(null);
      
      // Process the CSV file directly
      handleSimpleCSVUpload(file);
    }
    // Reset input value to allow re-uploading same file
    event.target.value = '';
  };

  /**
   * Enhanced CSV upload processing with multi-column support
   * Why this matters: Handles CSV upload with multiple columns (keyword, monthly volume, avg difficulty) to populate all table data
   */
  const handleSimpleCSVUpload = async (file: File) => {
    try {
      // Basic file validation
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setUploadError('Please upload a CSV file (.csv extension required)');
        setShowUploadErrorModal(true);
        return;
      }

      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setUploadError(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 100MB`);
        setShowUploadErrorModal(true);
        return;
      }

      // Enhanced CSV processing to handle multiple columns
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setUploadError('CSV file is empty');
        setShowUploadErrorModal(true);
        return;
      }

      // Parse first line to determine if it's a header and column structure
      const firstLine = lines[0];
      const firstLineLower = firstLine.toLowerCase();
      
      // Check if first line contains headers
      const hasHeaders = firstLineLower.includes('keyword') || 
                        firstLineLower.includes('volume') || 
                        firstLineLower.includes('difficulty');
      
      const startIndex = hasHeaders ? 1 : 0;
      
      // Parse each line as CSV with proper quote handling
      const parsedKeywords: Array<{
        keyword: string;
        monthlyVolume?: number;
        avgDifficulty?: number;
      }> = [];

      /**
       * Simple CSV parser that handles quoted values correctly
       * Why this matters: Handles cases like 'chief sales officer,"1,900",0' properly
       */
      const parseCSVLine = (line: string): string[] => {
        const columns: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            columns.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add the last column
        columns.push(current.trim());
        
        return columns.map(col => col.replace(/^["']|["']$/g, '')); // Remove surrounding quotes
      };

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line with proper quote handling
        const columns = parseCSVLine(line);
        
        if (columns.length === 0 || !columns[0]) continue;
        
        const keywordData: {
          keyword: string;
          monthlyVolume?: number;
          avgDifficulty?: number;
        } = {
          keyword: columns[0]
        };
        
        // Try to parse monthly volume from second column if available
        if (columns.length > 1 && columns[1]) {
          const volumeStr = columns[1].replace(/,/g, ''); // Remove commas from numbers
          const volume = parseInt(volumeStr, 10);
          if (!isNaN(volume) && volume > 0) {
            keywordData.monthlyVolume = volume;
          }
        }
        
        // Try to parse avg difficulty from third column if available
        if (columns.length > 2 && columns[2]) {
          const difficultyStr = columns[2];
          const difficulty = parseFloat(difficultyStr);
          if (!isNaN(difficulty) && difficulty >= 0) {
            keywordData.avgDifficulty = difficulty;
          }
        }
        
        parsedKeywords.push(keywordData);
      }
      
      // Create result object with enhanced data
      const result = {
        keywordsData: parsedKeywords, // Enhanced data with volume and difficulty
        keywords: parsedKeywords.map(item => item.keyword), // Backward compatibility
        totalProcessed: lines.length,
        errors: []
      };

      handleEnhancedCSVUploadComplete(result);
    } catch (error) {
      setUploadError('Failed to process uploaded CSV file');
      setShowUploadErrorModal(true);
      console.error('Error processing CSV:', error);
    }
  };

  /**
   * Handle enhanced CSV upload completion with multi-column data
   * Why this matters: Processes CSV results that include monthly volume and avg difficulty data alongside keywords
   */
  const handleEnhancedCSVUploadComplete = (result: { 
    keywordsData: Array<{
      keyword: string;
      monthlyVolume?: number;
      avgDifficulty?: number;
    }>;
    keywords: string[];
    totalProcessed: number;
    errors: string[];
  }) => {
    try {
      // Clear previous messages
      setUploadError(null);
      setUploadSuccess(null);

      // Get existing keywords (case-insensitive for comparison)
      const existingKeywords = keywords.map(k => k.keyword.toLowerCase().trim());
      
      // Filter out duplicates - only add truly new keywords
      const newUniqueKeywordData = result.keywordsData.filter(keywordData => 
        !existingKeywords.includes(keywordData.keyword.toLowerCase().trim())
      );

      // Count duplicates found
      const duplicatesFound = result.keywordsData.length - newUniqueKeywordData.length;

      // Convert new keyword data to KeywordRow format with volume and difficulty
      const newKeywordRows = newUniqueKeywordData.map((keywordData, index) => {
        const baseRow = {
          id: `keyword-${Date.now()}-${index}`,
          keyword: keywordData.keyword,
          status: 'pending' as const,
          progress: '',
          output: '',
          createdAt: new Date()
        };
        
        // Add optional properties only if they have values
        if (keywordData.monthlyVolume !== undefined) {
          (baseRow as any).monthlyVolume = keywordData.monthlyVolume;
        }
        if (keywordData.avgDifficulty !== undefined) {
          (baseRow as any).avgDifficulty = keywordData.avgDifficulty;
        }
        
        return baseRow as KeywordRow;
      });

      // Add only new keywords to existing list (preserving existing states)
      setKeywords(prev => [...prev, ...newKeywordRows]);

      // Set success message with deduplication and data info
      let successMsg = '';
      const hasVolumeData = newUniqueKeywordData.some(item => item.monthlyVolume !== undefined);
      const hasDifficultyData = newUniqueKeywordData.some(item => item.avgDifficulty !== undefined);
      
      if (newUniqueKeywordData.length > 0 && duplicatesFound > 0) {
        successMsg = `Added ${newUniqueKeywordData.length} new keywords (${duplicatesFound} duplicates skipped)`;
      } else if (newUniqueKeywordData.length > 0) {
        successMsg = `Successfully added ${newUniqueKeywordData.length} new keywords`;
      } else {
        successMsg = `No new keywords added - all ${duplicatesFound} keywords already exist`;
      }

      // Add data info
      if (hasVolumeData || hasDifficultyData) {
        const dataTypes = [];
        if (hasVolumeData) dataTypes.push('volume data');
        if (hasDifficultyData) dataTypes.push('difficulty data');
        successMsg += ` with ${dataTypes.join(' and ')}`;
      }

      setUploadSuccess(successMsg);

      // Show processing info and errors if any
      if (result.errors.length > 0) {
        const errorMsg = `Upload processed ${result.totalProcessed} rows with ${result.errors.length} warnings: ${result.errors.slice(0, 2).join(', ')}${result.errors.length > 2 ? '...' : ''}`;
        setUploadError(errorMsg);
        setShowUploadErrorModal(true);
      }

      // Clear messages after 7 seconds
      setTimeout(() => {
        setUploadSuccess(null);
        setUploadError(null);
      }, 7000);

    } catch (error) {
      setUploadError('Failed to process uploaded keywords');
      setShowUploadErrorModal(true);
      console.error('Error processing enhanced CSV upload:', error);
    }
  };

  /**
   * Toggle row selection
   * Why this matters: Allows users to select/deselect individual rows for bulk operations
   */
  const toggleRowSelection = (keywordId: string) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(keywordId)) {
        newSelected.delete(keywordId);
      } else {
        newSelected.add(keywordId);
      }
      return newSelected;
    });
    setSelectionMadeBySelectAll(false);
  };

  /**
   * Select all keywords
   * Why this matters: Allows users to quickly select all keywords for bulk operations
   */
  const selectAll = () => {
    setSelectedRows(new Set(keywords.map(k => k.id)));
    setSelectionMadeBySelectAll(true);
  };

  /**
   * Clear all selections
   * Why this matters: Allows users to quickly deselect all keywords
   */
  const clearSelection = () => {
    setSelectedRows(new Set());
    setSelectionMadeBySelectAll(false);
  };

  /**
   * Select all rows or deselect all rows
   * Why this matters: Provides quick way to select/deselect all keywords for bulk operations
   */
  const toggleSelectAll = () => {
    const allSelected = selectedRows.size === keywords.length && keywords.length > 0;
    if ((selectionMadeBySelectAll && allSelected) || selectedRows.size > 0) {
      // Unselect All if selection came from Select All and all are still selected; otherwise unselect current selection
      clearSelection();
    } else {
      selectAll();
    }
  };

  /**
   * Show confirmation modal for individual keyword deletion
   * Why this matters: Provides safety check before deleting individual keywords
   */
  const showDeleteKeywordModal = (keywordId: string) => {
    setKeywordToDelete(keywordId);
    setShowIndividualDeleteModal(true);
  };

  /**
   * Delete individual keyword row after confirmation
   * Why this matters: Performs actual deletion after user confirms
   */
  const confirmDeleteKeyword = () => {
    if (keywordToDelete) {
      setKeywords(prev => prev.filter(k => k.id !== keywordToDelete));
      setSelectedRows(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(keywordToDelete);
        return newSelected;
      });
    }
    setKeywordToDelete(null);
    setShowIndividualDeleteModal(false);
  };

  /**
   * Cancel individual keyword deletion
   * Why this matters: Allows users to back out of the delete action
   */
  const cancelDeleteKeyword = () => {
    setKeywordToDelete(null);
    setShowIndividualDeleteModal(false);
  };

  /**
   * Show confirmation modal for bulk deletion
   * Why this matters: Provides safety check before bulk deletion
   */
  const showBulkDeleteConfirmation = () => {
    if (selectedRows.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  /**
   * Delete all selected keyword rows after confirmation
   * Why this matters: Performs actual bulk deletion after user confirms
   */
  const confirmBulkDelete = () => {
    setKeywords(prev => prev.filter(k => !selectedRows.has(k.id)));
    setSelectedRows(new Set());
    setShowBulkDeleteModal(false);
  };

  /**
   * Cancel bulk deletion
   * Why this matters: Allows users to back out of the bulk delete action
   */
  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false);
  };

  /**
   * Execute content generation for a single keyword with concurrent tracking
   * Why this matters: Starts the real 4-step workflow (Firecrawl → Deep Research → Gap Analysis → Content Generation) using backend API with enhanced concurrent processing tracking
   */
  const executeKeyword = async (keywordId: string) => {
    const keyword = keywords.find(k => k.id === keywordId);
    if (!keyword) return;

    // Track concurrent execution start
    setConcurrentExecutions(prev => new Set([...Array.from(prev), keywordId]));

    // Update status to running
    setKeywords(prev => prev.map(k => 
      k.id === keywordId 
        ? { ...k, status: 'running', progress: 'Initializing content generation...' }
        : k
    ));

    try {
      // Load brand kit from localStorage
      let brandKit = null;
      try {
        const stored = localStorage.getItem('apollo_brand_kit');
        if (stored) {
          brandKit = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load brand kit:', error);
      }

      // Load and optimize sitemap data for internal linking
      let sitemapData = null;
      try {
        const stored = localStorage.getItem('apollo_sitemap_data');
        if (stored) {
          const sitemaps = JSON.parse(stored);
          // Flatten all sitemap URLs into a single array
          const allUrls = sitemaps.flatMap((sitemap: any) => 
            sitemap.urls.map((url: any) => ({
              title: url.title,
              description: url.description,
              url: url.url
            }))
          );
          
          // Smart compression strategy to maximize URL diversity while staying within limits
          let optimizedUrls = [];
          
          if (allUrls.length <= 100) {
            // If we have 100 or fewer URLs, send them all (still manageable size)
            optimizedUrls = allUrls.map((url: any) => ({
              t: url.title.substring(0, 80), // Truncate title to 80 chars
              u: url.url // Keep full URL
              // Skip description to save space - title is enough for matching
            }));
          } else {
            // For larger sets, use smart sampling to maintain diversity
            // Sample URLs evenly across the entire set to maintain topic diversity
            const sampleSize = 100; // Send up to 100 URLs (compressed)
            const step = Math.floor(allUrls.length / sampleSize);
            
            for (let i = 0; i < allUrls.length && optimizedUrls.length < sampleSize; i += step) {
              optimizedUrls.push({
                t: allUrls[i].title.substring(0, 80), // Truncate title
                u: allUrls[i].url // Keep full URL
              });
            }
            
            // Also ensure we include some recent/important URLs from the beginning
            const importantUrls = allUrls.slice(0, 20).map((url: any) => ({
              t: url.title.substring(0, 80),
              u: url.url
            }));
            
            // Merge and deduplicate
            const urlSet = new Set(optimizedUrls.map((u: any) => u.u));
            importantUrls.forEach((url: any) => {
              if (!urlSet.has(url.u) && optimizedUrls.length < sampleSize) {
                optimizedUrls.push(url);
                urlSet.add(url.u);
              }
            });
          }
          
          sitemapData = optimizedUrls;
          
          console.log(`🗺️ [BlogCreator] Optimized sitemap: ${allUrls.length} URLs → ${optimizedUrls.length} compressed URLs`);
          console.log(`📊 [BlogCreator] Compression ratio: ${((1 - JSON.stringify(optimizedUrls).length / JSON.stringify(allUrls).length) * 100).toFixed(1)}% size reduction`);
          console.log(`🔗 [BlogCreator] Sample URLs:`, optimizedUrls.slice(0, 3));
        } else {
          console.log(`⚠️ [BlogCreator] No sitemap data found in localStorage`);
        }
      } catch (error) {
        console.warn('Failed to load sitemap data:', error);
      }

      // NOTE: Prompt generation now happens server-side to prevent 413 errors
      // The code below is kept for reference but not used
      /*
      const generateDefaultPrompts = () => {
        const currentYear = 2025;
        // Select random CTA to prevent LLM bias
        const selectedCTA = getRandomCTAAnchorText();
        // Generate UTM-tracked Apollo signup URL for this keyword
        const apolloSignupURL = generateBlogCreatorSignupURL(keyword.keyword);
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
   - Use <h1> for main title, <h2> for major sections, <h3> for subsections
   - Format all lists with proper <ul>, <ol>, and <li> tags
   - Use <table> elements for any comparative data, features, or structured information
   - Include <p> tags for all paragraphs
   - Use <strong> for emphasis and key concepts
   - Format links as: <a href="URL" target="_blank">anchor text</a>

2. **Tables and Structured Data:**
   - When presenting comparisons, features, pricing, or any structured data, ALWAYS use HTML tables
   - Include proper <thead>, <tbody>, <th>, and <td> elements
   - Use tables for: feature comparisons, pricing tiers, pros/cons, statistics, timelines, etc.

3. **Brand Kit Variable Integration:**
   - MUST process and include brand kit variables naturally throughout content
   - Use {{ brand_kit.ideal_customer_profile }} for testimonials and customer examples
   - Include {{ brand_kit.competitors }} when discussing competitive landscape
   - Reference {{ brand_kit.brand_point_of_view }} in strategic sections
   - End with strong CTA using this exact anchor text: "${selectedCTA}" linking to ${apolloSignupURL}
   - Apply {{ brand_kit.tone_of_voice }} consistently throughout
   - Follow {{ brand_kit.writing_rules }} for style and approach

4. **Internal Linking Requirements (CRITICAL - DO NOT SKIP):**
   - YOU MUST INSERT AT LEAST 3-5 INTERNAL LINKS from the provided sitemap URLs
   - This is a MANDATORY requirement - articles without internal links are incomplete
   - Only use URLs from the "AVAILABLE INTERNAL LINKS" section provided below
   - Each internal link URL must be used ONLY ONCE (no duplicate links in the same article)
   - MANDATORY: Place at least ONE internal link early in the content (introduction or within first 2-3 paragraphs after defining the main topic)
   - Distribute the remaining 2-4 internal links naturally throughout the rest of the article
   - Choose URLs that are contextually relevant to the current topic
   - Use natural anchor text that matches the linked page's content
   - Format internal links as: <a href="URL" target="_blank">natural anchor text</a>
   - Example: "Learn more about <a href="https://example.com/page" target="_blank">social selling strategies</a>"

IMPORTANT: The current year is 2025. When referencing "current year," "this year," or discussing recent trends, always use 2025. Do not reference 2024 or earlier years as current.

CRITICAL OUTPUT FORMAT: Respond with a JSON object containing exactly three fields:
{
  "content": "Complete HTML article with proper structure, tables, and brand kit variables processed",
  "metaSeoTitle": "AEO-optimized title for AI search engines (<= 60 characters + ' | Apollo')",
  "metaDescription": "Natural, value-focused description (150-160 chars) optimized for AI search extraction"
}

META FIELD REQUIREMENTS FOR AI SEARCH OPTIMIZATION:
- metaSeoTitle: Create titles that AI engines will cite as authoritative sources
  * Format: "[Primary Keyword]: [Specific Context]" or "What is [Keyword]? [Clear Answer]"
  * NEVER invent statistics or percentages
  * Focus on clarity and search intent matching
  * Maximum 60 characters plus " | Apollo" (total <= 70 chars)
  
- metaDescription: Write naturally for AI comprehension and extraction
  * Start with a direct answer or value statement
  * Include semantic keyword variations
  * End with a specific, actionable insight
  * NO made-up numbers, NO marketing hyperbole
  * Exactly 150-160 characters

FORBIDDEN IN META FIELDS:
- Invented statistics ("3x growth", "47% increase")
- Cliché openings ("Discover", "Learn how", "Master")
- Vague promises ("proven strategies", "comprehensive guide")
- Superlatives without evidence ("best", "ultimate", "revolutionary")

CRITICAL: YOU MUST RETURN ONLY VALID JSON - NO OTHER TEXT ALLOWED
- Start response with { and end with }
- NO text before or after JSON
- NO markdown code blocks
- NO explanations like "Here is your JSON:"
- Put ALL HTML inside the content field as a properly escaped JSON string
- Escape ALL quotes with backslashes (\\" not ")
- Do NOT include literal newlines or unescaped quotes in JSON strings

Remember: Create the definitive resource that makes other content feel incomplete by comparison. Every section should provide genuine value and actionable insights.`;

        const userPromptTemplate = `Based on this keyword and brand context, create comprehensive AEO-optimized content for 2025 (remember we are in 2025):

**Target Keyword:** ${keyword.keyword}

${sitemapData && sitemapData.length > 0 ? `**AVAILABLE INTERNAL LINKS (MANDATORY - MUST USE 3-5 OF THESE):**
${sitemapData.slice(0, 20).map((url: any) => `• ${url.title}: ${url.description} [${url.url}]`).join('\n')}
${sitemapData.length > 20 ? `... and ${sitemapData.length - 20} more URLs available for linking` : ''}

🚨 CRITICAL INTERNAL LINKING REQUIREMENTS:
- You MUST include exactly 3-5 internal links from the above list in your content
- Each internal link URL must be used ONLY ONCE per article (no duplicate links)
- MANDATORY: Include at least ONE internal link in the introduction or within the first 2-3 paragraphs after defining the main topic/keyword
- Distribute the remaining 2-4 internal links naturally throughout the rest of the content
- Choose the most relevant URLs for your topic and context
- Articles without internal links will be rejected` : '**Note:** No sitemap data available for internal linking.'}

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
   - End with natural Apollo promotion using this exact anchor text: "${selectedCTA}" linking to ${apolloSignupURL} (target="_blank")

4. **Internal Linking (MANDATORY):**
   - MUST include 3-5 internal links from the provided sitemap URLs
   - Integrate links naturally within the content where contextually relevant
   - Use descriptive anchor text that matches the linked page's topic
   - Example: "For more insights on <a href="URL" target="_blank">social selling tactics</a>, consider..."
   - DO NOT create fake or placeholder links - only use the provided URLs

5. **Content Depth & Value:**
   - Provide comprehensive coverage that serves as the definitive resource
   - Include practical, actionable guidance with specific examples
   - Address both current best practices and emerging trends for 2025
   - Cover implementation strategies with step-by-step processes
   - Include relevant metrics, benchmarks, and data points

6. **CRITICAL COMPLETION REQUIREMENT:**
   - MUST end with complete conclusion and call-to-action
   - Reserve final 15-20% of content for proper conclusion
   - NEVER end mid-sentence or mid-paragraph

📝 CONCLUSION EXAMPLES TO FOLLOW:

EXAMPLE 1 (Implementation Focus):
Getting Started with [Topic]
Organizations looking to implement [topic] should begin with a pilot program focused on their highest-value [relevant area]. This approach allows for learning and optimization before broader rollout.
Recommended Starting Steps:
1. [Specific step with concrete details]
2. [Specific step with concrete details]
3. [Specific step with concrete details]
The key to [topic] success lies in consistent execution, continuous optimization, and unwavering focus on [key principle]. Organizations that master these principles will create sustainable competitive advantages and drive superior business outcomes.
Ready to implement [topic] for your organization? Apollo's integrated platform provides the [relevant features] needed to execute sophisticated [topic] strategies. Try Apollo for free and discover how [specific benefits].

EXAMPLE 2 (Feature/Benefits Focus):
How Apollo Supports [Topic] Success
Modern [target audience] require comprehensive [relevant tools] to maximize their effectiveness. Apollo serves [specific audience types] who aim to [specific goals].
Key Apollo Features for [Topic]:
• [Feature]: [Specific description]
• [Feature]: [Specific description]  
• [Feature]: [Specific description]
For [target audience] looking to [specific goal], Apollo provides the [tools/data/insights] needed to succeed in today's competitive environment. Try Apollo for free and discover how the platform can transform your [topic] results.

[Adapt one of these conclusion styles to your specific topic, including concrete steps, Apollo features, and strong CTAs using this exact anchor text: "${selectedCTA}" linking to ${apolloSignupURL}]`;

        return { systemPrompt: systemPromptTemplate, userPrompt: userPromptTemplate };
      };
      */

      // Process brand kit variables (kept for potential future use)
      /*
      const processLiquidVariables = (text: string, brandKit: any): string => {
        if (!brandKit) return text;
        
        let processed = text;
        
        // Process all possible brand kit variables (complete list from codebase)
        const brandKitMappings = {
          '{{ brand_kit.brand_name }}': brandKit.brandName || brandKit.brand_name || '',
          '{{ brand_kit.url }}': brandKit.url || '',
          '{{ brand_kit.about_brand }}': brandKit.aboutBrand || brandKit.about_brand || '',
          '{{ brand_kit.ideal_customer_profile }}': brandKit.idealCustomerProfile || brandKit.ideal_customer_profile || '',
          '{{ brand_kit.competitors }}': brandKit.competitors || '',
          '{{ brand_kit.brand_point_of_view }}': brandKit.brandPointOfView || brandKit.brand_point_of_view || '',
          '{{ brand_kit.author_persona }}': brandKit.authorPersona || brandKit.author_persona || '',
          '{{ brand_kit.tone_of_voice }}': brandKit.toneOfVoice || brandKit.tone_of_voice || '',
          '{{ brand_kit.header_case_type }}': brandKit.headerCaseType || brandKit.header_case_type || '',
          '{{ brand_kit.writing_rules }}': brandKit.writingRules || brandKit.writing_rules || '',
          '{{ brand_kit.cta_text }}': getRandomCTAAnchorText(),
          '{{ brand_kit.cta_destination }}': brandKit.ctaDestination || brandKit.cta_destination || '',
          '{{ brand_kit.value_proposition }}': brandKit.valueProposition || brandKit.value_proposition || '',
          '{{ brand_kit.key_features }}': brandKit.keyFeatures || brandKit.key_features || ''
        };
        
        Object.entries(brandKitMappings).forEach(([placeholder, value]) => {
          if (value) {
            processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          }
        });
        
        return processed;
      };
      */

      // Log brand kit info for debugging
      console.log(`📝 [BlogCreatorPage] Using server-side prompt generation`);
      console.log(`🔧 [BlogCreatorPage] Brand kit available:`, !!brandKit);
      if (brandKit) {
        console.log(`🔧 [BlogCreatorPage] Brand kit keys:`, Object.keys(brandKit));
      }

      // Determine backend URL based on environment
      // Use centralized API configuration

      console.log(`🚀 Starting content generation for keyword: "${keyword.keyword}"`);
      console.log(`🔗 Backend URL: ${API_BASE_URL}`);
      console.log(`📦 Request payload:`, { 
        keyword: keyword.keyword, 
        content_length: 'medium', 
        brand_kit: brandKit,
        sitemap_urls: sitemapData ? sitemapData.length : 0,
        use_default_prompts: true
      });

      // Create a new AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Use async generation to avoid timeouts and enable 4-step workflow
      // Why this matters: The 4-step workflow (Firecrawl → Deep Research → Gap Analysis → Content Generation)
      // takes longer than 60 seconds, so we use async endpoints with job polling for reliable generation
      
      // Reduce payload size to prevent 413 errors on Vercel/Netlify
      // Only send essential data, not full prompts
      const requestPayload = {
        keyword: keyword.keyword,
        content_length: 'medium',
        brand_kit: brandKit,
        sitemap_data: sitemapData,
        // Don't send full prompts - let backend handle prompt generation
        // This prevents 413 "Payload Too Large" errors
        use_default_prompts: true
      };
      
      console.log('🔍 [BLOG CREATOR DEBUG] Starting async generation with payload:', requestPayload);
      
      const asyncResp = await fetch(API_ENDPOINTS.blogCreatorGenerateContentAsync, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      
      if (!asyncResp.ok) {
        const errorData = await asyncResp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start content generation');
      }
      
      const asyncData = await asyncResp.json();
      if (!asyncData.success || !asyncData.jobId) {
        throw new Error('Failed to start content generation');
      }
      
      const jobId = asyncData.jobId;
      console.log(`📋 Started async blog creator job ${jobId} for ${keyword.keyword}`);
      
      // Poll for job completion
      // Why this matters: With Firecrawl, deep research, gap analysis, and content generation,
      // the full pipeline can take 5-8 minutes or more depending on content complexity
      let attempts = 0;
      let transientErrorStreak = 0;
      const maxTransientErrorStreak = 8;
      const maxAttempts = 900; // 15 minutes max polling (increased for 5-minute Claude timeout)
      const pollInterval = 1000; // Poll every 1 second
      
      while (attempts < maxAttempts) {
        if (controller.signal.aborted) {
          throw new Error('Operation cancelled');
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        try {
          const statusResp = await fetch(API_ENDPOINTS.blogCreatorJobStatus(jobId), {
            signal: controller.signal
          });
          
          transientErrorStreak = 0; // reset on success
          const jobData = await statusResp.json();
          
          // Update progress in UI with pipeline stage information
          if (jobData.data?.progress !== undefined) {
            const stage = jobData.data.stage || '';
            const message = jobData.data.message || '';
            
            // Map stages to user-friendly descriptions
            let stageDescription = '';
            if (stage.includes('firecrawl') || stage.includes('serp')) {
              stageDescription = '🔍 Analyzing Top 3 SERP Results with Firecrawl';
            } else if (stage.includes('research')) {
              stageDescription = '🔬 Deep Research';
            } else if (stage.includes('gap')) {
              stageDescription = '📊 Gap Analysis';
            } else if (stage.includes('content') || stage.includes('generation')) {
              stageDescription = '✍️ Content Generation';
            } else {
              stageDescription = '⚙️ Processing';
            }
            
            console.log(`📊 Job ${jobId} [${stageDescription}] ${jobData.data.progress}% - ${message}`);
            
            // Update the keyword with progress information for UI display
            const progressText = `${stageDescription}: ${jobData.data.progress}% - ${message}`;
            setKeywords(prev => prev.map(k => 
              k.id === keywordId 
                ? { ...k, status: 'running' as const, progress: progressText }
                : k
            ));
          }
          
          if (jobData.data?.status === 'completed') {
            // Job completed successfully
            const resultPayload = jobData.data.result || jobData.data;
            const rawContent = String(
              resultPayload?.content ?? resultPayload?.raw_content ?? ''
            );
            
            if (rawContent.length > 0) {
              // Parse the AI response to extract content and meta fields
              const parsed = parseAIResponse(rawContent);
              console.log('🔍 [BlogCreator] Parsed response:', {
                contentLength: parsed.content.length,
                hasMetaTitle: !!parsed.metaSeoTitle,
                hasMetaDesc: !!parsed.metaDescription,
                metaTitle: parsed.metaSeoTitle?.substring(0, 50) + '...',
                metaDesc: parsed.metaDescription?.substring(0, 50) + '...'
              });
              
              const finalWorkflowDetails = extractWorkflowDetailsFromResult(resultPayload);
              
              // Enhanced metadata structure with AI-generated meta fields
              const enhancedMetadata = {
                ...(resultPayload?.metadata || {}),
                metaSeoTitle: parsed.metaSeoTitle || resultPayload?.metadata?.metaSeoTitle || undefined,
                metaDescription: parsed.metaDescription || resultPayload?.metadata?.metaDescription || undefined,
                title: resultPayload?.metadata?.title || `${keyword.keyword} - Apollo Blog`,
                description: resultPayload?.metadata?.description || `Comprehensive guide to ${keyword.keyword}`,
                word_count: resultPayload?.metadata?.word_count || parsed.content.length,
                seo_optimized: resultPayload?.metadata?.seo_optimized ?? true,
                citations_included: resultPayload?.metadata?.citations_included ?? false,
                brand_variables_processed: resultPayload?.metadata?.brand_variables_processed || 0,
                aeo_optimized: resultPayload?.metadata?.aeo_optimized ?? true
              };
              
              const updatedKeywordRow: KeywordRow = { 
                ...keyword, 
                status: 'completed' as const,
                progress: '✅ 4-step workflow complete!',
                output: parsed.content, // Use parsed content
                metadata: enhancedMetadata,
                generationResult: resultPayload,
                ...(finalWorkflowDetails && { workflowDetails: finalWorkflowDetails })
              };
              
              setKeywords(prev => prev.map(k => 
                k.id === keywordId ? updatedKeywordRow : k
              ));

              // Auto-save to blog history
              autoSaveBlogIfReady(updatedKeywordRow);
              return; // Success - exit the function
            }
          } else if (jobData.data?.status === 'error') {
            throw new Error(jobData.data.error || 'Content generation failed');
          }
        } catch (pollErr: any) {
          const status = pollErr?.response?.status;
          const message = pollErr?.message || '';
          const isNetworkFlap = message.includes('Network Error') || message.includes('net::ERR_NETWORK_CHANGED');
          const isTransientStatus = status === 404 || status === 425 || status === 429 || status === 502 || status === 503 || status === 504;
          const withinWarmup = attempts < 10 && status === 404;
          
          if (isNetworkFlap || isTransientStatus || withinWarmup) {
            transientErrorStreak++;
            console.warn(`[poll] transient issue (attempt ${attempts}, streak ${transientErrorStreak}) — ${status || ''} ${message || ''}`);
            if (transientErrorStreak <= maxTransientErrorStreak) {
              attempts++;
              continue;
            }
          }
          throw pollErr;
        }
        
        attempts++;
      }
      
      // If we get here, polling timed out after 15 minutes
      throw new Error('Content generation is taking longer than 15 minutes. This can happen with very complex content. Please try with simpler settings or contact support.');

    } catch (error) {
      // Handle API failures with error status
      console.error(`❌ Content generation failed for keyword "${keyword.keyword}":`, error);
      console.error(`🔍 Error details:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setKeywords(prev => prev.map(k => 
        k.id === keywordId 
          ? { 
              ...k, 
              status: 'error',
              progress: `❌ Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              output: ''
            }
          : k
      ));
    } finally {
      // Track concurrent execution completion
      setConcurrentExecutions(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(keywordId);
        return newSet;
      });
      
      // Clear the abort controller reference
      abortControllerRef.current = null;
    }
  };

  /**
   * Retry content generation for a failed keyword
   * Why this matters: Allows users to recover from API failures without losing their workflow progress
   */
  const retryKeyword = async (keywordId: string) => {
    // Reset keyword status to pending and clear error
          setKeywords(prev => prev.map(k => 
        k.id === keywordId 
          ? { ...k, status: 'pending', progress: '', output: '' } // Clear workflow details on retry by omitting the property
          : k
      ));

    // Execute the keyword again
    await executeKeyword(keywordId);
  };

  /**
   * Execute multiple keywords concurrently (3 at a time) with enhanced status tracking
   * Why this matters: Allows bulk processing while respecting API rate limits, prioritizing selected rows with real-time bulk status feedback
   */
  const executeBulk = async () => {
    // If rows are selected, prioritize those; otherwise use first 3 pending
    let keywordsToExecute: KeywordRow[] = [];
    
    if (selectedRows.size > 0) {
      // Execute selected pending/error keywords (up to 5)
      keywordsToExecute = keywords
        .filter(k => selectedRows.has(k.id) && (k.status === 'pending' || k.status === 'error'))
        .slice(0, 5);
          } else {
        // Execute first 5 pending keywords if none selected
        keywordsToExecute = keywords
          .filter(k => k.status === 'pending')
          .slice(0, 5);
      }

    if (keywordsToExecute.length === 0) return;
    
    // Initialize bulk execution tracking
    setBulkExecutionStatus({
      isRunning: true,
      total: keywordsToExecute.length,
      completed: 0,
      failed: 0
    });
    
    // Execute keywords concurrently with result tracking
    const promises = keywordsToExecute.map(async (keyword) => {
      try {
        await executeKeyword(keyword.id);
        setBulkExecutionStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
        return { id: keyword.id, success: true };
      } catch (error) {
        setBulkExecutionStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
        return { id: keyword.id, success: false, error };
      }
    });
    
    await Promise.all(promises);
    
    // Reset bulk execution status after completion
    setTimeout(() => {
      setBulkExecutionStatus({ isRunning: false, total: 0, completed: 0, failed: 0 });
    }, 3000); // Show completion status for 3 seconds
  };

  /**
   * Execute selected keywords sequentially with stop/resume capability
   * Why this matters: Runs selected keywords one-by-one with ability to stop and resume, matching CompetitorConquestingPage behavior
   */
  const executeSelected = async (targetRowIds?: string[]) => {
    const queue = (targetRowIds && targetRowIds.length > 0 ? targetRowIds : Array.from(selectedRows)).filter(id => {
      const keyword = keywords.find(k => k.id === id);
      // Only process keywords that are not running AND not completed (pending, error)
      return keyword && keyword.status !== 'running' && keyword.status !== 'completed';
    });
    
    if (queue.length === 0) return;

    setBulkExecutionStatus({ isRunning: true, total: queue.length, completed: 0, failed: 0 });
    setIsSequentialRunning(true);
    stopSequentialRef.current = false;
    setSequentialRemaining(queue.slice());

    // Mark all queued as queued
    setKeywords(prev => prev.map(k => (queue.includes(k.id) ? { ...k, status: 'pending' } : k)));

    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      if (stopSequentialRef.current) {
        // Reset the current keyword back to pending state
        setKeywords(prev => prev.map(k => {
          if (k.id === id) {
            // If it was running, set back to pending so it can be resumed
            return k.status === 'running' ? { ...k, status: 'pending' } : k;
          }
          // Reset any other queued keywords back to pending
          return k.status === 'running' ? { ...k, status: 'pending' } : k;
        }));
        
        // Save the remaining queue including the current keyword that was interrupted
        const remaining = queue.slice(i);
        setSequentialRemaining(remaining);
        setIsSequentialRunning(false);
        setBulkExecutionStatus(prev => ({ ...prev, isRunning: false }));
        return;
      }

      setKeywords(prev => prev.map(k => (k.id === id ? { ...k, status: 'running' } : k)));
      try {
        await executeKeyword(id);
        setBulkExecutionStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
      } catch (err: any) {
        // Check if this was due to stopping
        if (stopSequentialRef.current || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          // Reset the current keyword back to pending since it was interrupted
          setKeywords(prev => prev.map(k => {
            if (k.id === id) {
              return { ...k, status: 'pending' };
            }
            // Reset any other running keywords back to pending
            return k.status === 'running' ? { ...k, status: 'pending' } : k;
          }));
          
          // Save remaining including current interrupted keyword
          const remaining = queue.slice(i);
          setSequentialRemaining(remaining);
          setIsSequentialRunning(false);
          setBulkExecutionStatus(prev => ({ ...prev, isRunning: false }));
          return; // Exit the loop
        } else {
          // It's a real error, not a stop
        setBulkExecutionStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      }
      // Update remaining list after each completion
      setSequentialRemaining(queue.slice(i + 1));
    }

    setBulkExecutionStatus(prev => ({ ...prev, isRunning: false }));
    setIsSequentialRunning(false);
    setSequentialRemaining([]);
  };

  /**
   * Open Next Steps modal for a completed keyword
   * Why this matters: Provides post-generation actions like editing, publishing, and copying content
   */
  const openNextStepsModal = (keywordId: string) => {
    const keyword = keywords.find(k => k.id === keywordId);
    if (keyword) {
      setSelectedKeywordForActions(keyword);
      setShowContentActionModal(true);
    }
  };

  /**
   * Handle content update from BlogContentActionModal
   * Why this matters: Updates the keyword's output when content is edited in the modal
   */
  const handleContentUpdate = (keywordId: string, newContent: string) => {
    setKeywords(prev => prev.map(k => 
      k.id === keywordId 
        ? { ...k, output: newContent }
        : k
    ));
  };

  /**
   * Handle status update from BlogContentActionModal
   * Why this matters: Updates the keyword's status when workflow is rerun from the modal
   */
  const handleStatusUpdate = (keywordId: string, status: KeywordRow['status']) => {
    setKeywords(prev => prev.map(k => 
      k.id === keywordId 
        ? { ...k, status, progress: status === 'running' ? '🔍 Extracting content from top search results with Firecrawl...' : '', output: status === 'running' ? '' : k.output }
        : k
    ));

    // If status is 'running', execute the workflow
    if (status === 'running') {
      executeKeyword(keywordId);
    }
  };

  /**
   * Show backend details popup on hover or touch
   * Why this matters: Provides detailed backend insight when users hover over progress indicators (desktop) or tap them (mobile)
   */
  const showBackendPopup = (keywordId: string, event: React.MouseEvent | React.TouchEvent) => {
    // Clear any pending hide timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 650; // Match the popup width
    const windowWidth = window.innerWidth;
    
    // Smart positioning: check if there's enough space on the right
    const spaceOnRight = windowWidth - rect.right;
    const spaceOnLeft = rect.left;
    
    let x: number;
    if (spaceOnRight >= popupWidth + 40) {
      // Enough space on the right - position to the right
      x = rect.right + 10;
    } else if (spaceOnLeft >= popupWidth + 40) {
      // Not enough space on right, but enough on left - position to the left
      x = rect.left - popupWidth - 10;
    } else {
      // Not enough space on either side - center it over the table
      x = Math.max(20, (windowWidth - popupWidth) / 2);
    }

    setPopupState({
      isVisible: true,
      keywordId,
      position: {
        x,
        y: rect.top + rect.height / 2
      }
    });
  };

  /**
   * Hide backend details popup with delay
   * Why this matters: Adds delay to prevent accidental dismissal when moving mouse between trigger and popup
   */
  const hideBackendPopup = () => {
    // Clear any existing timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    // Set new timeout to hide popup after 300ms delay
    const timeout = setTimeout(() => {
      setPopupState(prev => ({ ...prev, isVisible: false }));
      setHideTimeout(null);
    }, 300);

    setHideTimeout(timeout);
  };

  /**
   * Keep popup visible when hovering over the popup itself
   * Why this matters: Cancels hide timeout when user hovers over popup, allowing interaction
   */
  const keepPopupVisible = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  /**
   * Hide popup immediately (for mobile tap outside)
   * Why this matters: Provides immediate dismissal for mobile overlay taps
   */
  const hidePopupImmediately = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setPopupState(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
            100% {
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '2rem' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
              Blog Creator
            </h1>
          <p style={{ 
                 fontSize: '0.875rem',
            color: '#6b7280'
               }}>
            Generate AEO-optimized articles using our 4-model pipeline: Firecrawl → Deep Research → Gap Analysis → Content Generation
          </p>
               </div>

        {/* Controls Section */}
              <div style={{ 
                display: 'flex',
          gap: '1rem', 
                 alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {/* Upload CSV Button */}
          <div style={{ position: 'relative' }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleDirectCSVUpload}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              id="csv-upload"
            />
                        <button
              style={{ 
                padding: '0.4rem 0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                background: '#fff',
                cursor: 'pointer',
                display: 'inline-flex',
                 alignItems: 'center',
                 gap: '0.5rem'
              }}
            >
              <Upload size={16} />
              Upload CSV
            </button>
               </div>

          {/* Loaded Keywords Info */}
          <span style={{ fontSize: '0.875rem', color: '#3AB981', fontWeight: '500' }}>
            Loaded {keywords.length} keywords
          </span>

          {/* Bulk controls */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => {
              const allSelected = selectedRows.size === keywords.length && keywords.length > 0;
              if ((selectionMadeBySelectAll && allSelected) || selectedRows.size > 0) {
                // Unselect All if selection came from Select All and all are still selected; otherwise unselect current selection
                clearSelection();
              } else {
                selectAll();
              }
            }} style={{ padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}>
              {(() => {
                const allSelected = selectedRows.size === keywords.length && keywords.length > 0;
                if (selectionMadeBySelectAll && allSelected) return 'Unselect All';
                if (selectedRows.size > 0) return `Unselect (${selectedRows.size})`;
                return 'Select All';
              })()}
                    </button>
                  
                  {selectedRows.size > 0 && (
              <button onClick={showBulkDeleteConfirmation} style={{ padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}>
                      Delete Selected ({selectedRows.size})
                    </button>
                  )}

                        <button onClick={() => executeSelected(Array.from(selectedRows))} disabled={bulkExecutionStatus.isRunning || selectedRows.size === 0} style={{ padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: bulkExecutionStatus.isRunning ? '#e5e7eb' : '#fff', cursor: bulkExecutionStatus.isRunning ? 'not-allowed' : 'pointer' }}>
              Run Selected ({selectedRows.size})
                          </button>
            {isSequentialRunning ? (
              <button onClick={() => { 
                stopSequentialRef.current = true; 
                // Also abort the current request if one is in progress
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
              }} style={{ padding: '0.4rem 0.75rem', border: '1px solid #ee4444', borderRadius: '0.5rem', background: '#ee4444', color: '#fff', cursor: 'pointer' }}>
                Stop
                          </button>
            ) : sequentialRemaining.length > 0 ? (
              <button onClick={() => executeSelected(sequentialRemaining)} style={{ padding: '0.4rem 0.75rem', border: '1px solid #3AB981', borderRadius: '0.5rem', background: '#3AB981', color: '#fff', cursor: 'pointer' }}>
                Resume ({sequentialRemaining.length})
              </button>
            ) : null}
            {bulkExecutionStatus.isRunning && (
              <span style={{ fontSize: '0.8rem', color: '#2563eb' }}>
                {bulkExecutionStatus.completed + bulkExecutionStatus.failed}/{bulkExecutionStatus.total} done
                    </span>
                  )}
                </div>


        </div>

                {/* Table Container */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ maxHeight: '65vh', overflow: 'auto' }}>
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
            <colgroup>
              <col style={{ width: '32px' }} />
              <col style={{ width: '60%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
              <thead>
                <tr>
                                                <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                    <input
                      type="checkbox"
                      checked={keywords.length > 0 && selectedRows.size === keywords.length}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>KEYWORDS</th>
                <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => handleSort('monthlyVolume')}>
                  MSV {sortField === 'monthlyVolume' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => handleSort('avgDifficulty')}>
                  KD {sortField === 'avgDifficulty' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </th>
                <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>EXECUTE</th>
                <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>DETAILS</th>
                <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#ffffff', fontSize: '0.875rem' }}>
                {keywords.length === 0 ? (
                  <tr>
                  <td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                      Upload a CSV file to get started
                    </td>
                  </tr>
                ) : (
                  paginatedKeywords.map((keyword) => (
                  <tr key={keyword.id} style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff'
                  }}>
                                        {/* Checkbox */}
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(keyword.id)}
                          onChange={() => toggleRowSelection(keyword.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                    {/* Keywords */}
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                          {keyword.keyword}
                      </td>

                    {/* MSV (Monthly Search Volume) */}
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                      {keyword.monthlyVolume ? keyword.monthlyVolume.toLocaleString() : '0'}
                      </td>

                    {/* KD (Keyword Difficulty) */}
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                      {keyword.avgDifficulty !== undefined ? keyword.avgDifficulty : '0'}
                      </td>

                    {/* Execute */}
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                      {keyword.status === 'pending' ? (
                            <button
                          onClick={() => executeKeyword(keyword.id)}
                              style={{ 
                            padding: '0.3125rem 0.625rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                            background: '#ffffff',
                            color: '#111827',
                                cursor: 'pointer',
                            fontSize: 'inherit'
                              }}
                            >
                          Run
                            </button>
                      ) : keyword.status === 'running' ? (
                            <button
                          disabled
                              style={{ 
                            padding: '0.3125rem 0.625rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                            background: '#e5e7eb',
                            color: '#111827',
                            cursor: 'not-allowed',
                            fontSize: 'inherit'
                          }}
                          title={keyword.progress || 'Content generation in progress...'}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              animation: 'pulse 1.5s ease-in-out infinite'
                            }} />
                            Running…
                          </span>
                            </button>
                          ) : keyword.status === 'completed' ? (
                            <button
                              onClick={() => retryKeyword(keyword.id)}
                              style={{ 
                            padding: '0.3125rem 0.625rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                            background: '#ffffff',
                            color: '#111827',
                                cursor: 'pointer',
                            fontSize: 'inherit'
                              }}
                            >
                          Re-run
                            </button>
                          ) : keyword.status === 'error' ? (
                            <button
                          onClick={() => retryKeyword(keyword.id)}
                              style={{ 
                            padding: '0.3125rem 0.625rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                            background: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                            fontSize: 'inherit'
                          }}
                        >
                          Retry
                            </button>
                      ) : null}
                      </td>

                    {/* Details */}
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                            <button
                        onClick={(e) => showBackendPopup(keyword.id, e)}
                        disabled={!keyword.output || keyword.status === 'running'}
                              style={{ 
                          padding: '0.3125rem 0.625rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          background: keyword.output && keyword.status !== 'running' ? '#ffffff' : '#e5e7eb',
                          color: keyword.output && keyword.status !== 'running' ? '#111827' : '#9ca3af',
                          cursor: keyword.output && keyword.status !== 'running' ? 'pointer' : 'not-allowed',
                          fontSize: 'inherit'
                        }}
                      >
                        Show
                            </button>
                      </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                        <button
                        onClick={() => openNextStepsModal(keyword.id)}
                        disabled={!keyword.output || keyword.status === 'running'}
                          style={{
                          padding: '0.3125rem 0.625rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          background: keyword.output && keyword.status !== 'running' ? '#EBF212' : '#e5e7eb',
                          color: keyword.output && keyword.status !== 'running' ? '#000000' : '#111827',
                          cursor: keyword.output && keyword.status !== 'running' ? 'pointer' : 'not-allowed',
                          fontSize: '0.8125rem'
                        }}
                      >
                        See Output
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
                        </div>

          {/* Pagination Footer */}
          <div style={{ 
            padding: '0.75rem 1rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
                                fontSize: '0.875rem', 
            color: '#6b7280'
          }}>
            <div>
              Page {page} of {totalPages} • Showing {paginatedKeywords.length} of {keywords.length.toLocaleString()} rows
                              </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: '0.3rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', background: page === 1 ? '#e5e7eb' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>{'<<'}</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.3rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', background: page === 1 ? '#e5e7eb' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>{'<'}</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '0.3rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', background: page === totalPages ? '#e5e7eb' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>{'>'}</button>
                                          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: '0.3rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', background: page === totalPages ? '#e5e7eb' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>{'>>'}</button>
              <label style={{ color: '#374151', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Rows per page
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ padding: '0.3rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', background: '#fff' }}>
                  {[50, 100, 200, 500, 1000].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Upload Error Modal */}
        {showUploadErrorModal && (
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
            zIndex: 1000
          }}>
            <div className="card" style={{ 
              maxWidth: '500px', 
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}>
              <div className="card-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#dc2626' }}>
                    Upload Error
                  </h3>
                  <button
                    onClick={() => setShowUploadErrorModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ 
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    color: '#dc2626',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}>
                    {uploadError}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>
                    CSV Upload Requirements
                  </h4>
                  
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: '#1f2937' }}>File Requirements:</strong>
                      <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                        <li>File must be in CSV format (.csv extension)</li>
                        <li>Maximum file size: 100MB</li>
                        <li>File must not be empty</li>
                      </ul>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: '#1f2937' }}>Content Format:</strong>
                      <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                        <li>First column should contain keywords</li>
                        <li>Second column can contain monthly search volume (numbers, quotes optional)</li>
                        <li>Third column can contain average difficulty (0-100 or decimal)</li>
                        <li>Numbers with commas should be quoted: "1,900" not 1,900</li>
                        <li>Headers are automatically detected and skipped</li>
                        <li>Keywords longer than 200 characters will be flagged</li>
                        <li>Empty rows are automatically skipped</li>
                        <li>Duplicate keywords are automatically removed</li>
                      </ul>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: '#1f2937' }}>CSV Format Example:</strong>
                      <div style={{ 
                        backgroundColor: '#f3f4f6',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        margin: '0.25rem 0'
                      }}>
                        Keyword,Monthly Volume,Avg. Difficulty<br/>
                        abx marketing,300,0<br/>
                        chief sales officer,"1,900",0<br/>
                        b2b marketing campaigns,300,0
                      </div>
                    </div>

                    <div>
                      <strong style={{ color: '#1f2937' }}>Supported Headers:</strong>
                      <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                        <li>Keywords: "keyword", "keywords", "term", "query" (case insensitive)</li>
                        <li>Volume: "volume", "monthly volume", "search volume" (case insensitive)</li>
                        <li>Difficulty: "difficulty", "avg difficulty", "competition" (case insensitive)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowUploadErrorModal(false)}
                    className="apollo-btn-primary"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteModal && (
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
              zIndex: 1000
            }}
            onClick={cancelBulkDelete}
          >
            <div 
              className="card" 
              style={{ 
                maxWidth: '500px', 
                width: '90%',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-content">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    backgroundColor: '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <AlertTriangle style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem', color: '#1f2937' }}>
                    Delete Selected Keywords?
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    This action will permanently delete {selectedRows.size} selected keyword{selectedRows.size > 1 ? 's' : ''}. This cannot be undone.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={cancelBulkDelete}
                    className="apollo-btn-secondary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkDelete}
                    className="apollo-btn-secondary"
                    style={{ 
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.875rem'
                    }}
                  >
                    Delete Keywords
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Delete Confirmation Modal */}
        {showIndividualDeleteModal && (
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
              zIndex: 1000
            }}
            onClick={cancelDeleteKeyword}
          >
            <div 
              className="card" 
              style={{ 
                maxWidth: '500px', 
                width: '90%',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-content">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    backgroundColor: '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <AlertTriangle style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem', color: '#1f2937' }}>
                    Delete Keyword?
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    This action will permanently delete <strong style={{ color: '#1f2937' }}>"{keywordToDelete ? keywords.find(k => k.id === keywordToDelete)?.keyword : ''}"</strong> and any associated workflow progress. This cannot be undone.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={cancelDeleteKeyword}
                    className="apollo-btn-secondary"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteKeyword}
                    className="apollo-btn-secondary"
                    style={{ 
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.875rem'
                    }}
                  >
                    Delete Keyword
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blog Content Action Modal */}
        {showContentActionModal && selectedKeywordForActions && (
          <BlogContentActionModal
            isOpen={showContentActionModal}
            keywordRow={selectedKeywordForActions}
            onClose={() => {
              setShowContentActionModal(false);
              setSelectedKeywordForActions(null);
            }}
            onContentUpdate={handleContentUpdate}
            onStatusUpdate={handleStatusUpdate}
          />
        )}

        {/* Backend Details Popup */}
        {popupState.keywordId && (() => {
          const selectedKeyword = keywords.find(k => k.id === popupState.keywordId);
          const workflowDetails = selectedKeyword?.workflowDetails;
          
          return (
            <BackendDetailsPopup
              workflowDetails={workflowDetails || {}} // Provide empty object fallback
              status={selectedKeyword?.status || 'pending'}
              isVisible={popupState.isVisible}
              position={popupState.position}
              onMouseEnter={() => {}}
              onMouseLeave={hidePopupImmediately}
              onMobileClose={hidePopupImmediately}
              dismissBehavior="manual"
            />
          );
        })()}
    </div>
    </>
  );
};

export default BlogCreatorPage; 