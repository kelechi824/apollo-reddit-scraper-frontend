import React, { useState, useEffect, useRef } from 'react';
import { Play, Upload, MoreHorizontal, FileText, ExternalLink, Copy, RefreshCw, Trash2, X, AlertTriangle, Globe, Brain, BarChart3, Sparkles, Clock, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import BlogContentActionModal from '../components/BlogContentActionModal';
import BackendDetailsPopup from '../components/BackendDetailsPopup';


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

  // Auto-save state and refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Sorting state
  const [sortField, setSortField] = useState<'monthlyVolume' | 'avgDifficulty' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
            createdAt: keyword.createdAt.toISOString() // Convert Date to ISO string for storage
          })),
          selectedRows: Array.from(selectedRows), // Convert Set to Array for storage
          sortField,
          sortDirection,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('apollo_blog_creator_progress', JSON.stringify(progressData));
        
        setAutoSaveStatus('saved');
        
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
  }, [keywords, selectedRows, sortField, sortDirection]);

  /**
   * Handle column sorting
   * Why this matters: Allows users to sort keywords by volume (highest first) or difficulty (lowest first) for strategic prioritization
   */
  const handleSort = (field: 'monthlyVolume' | 'avgDifficulty') => {
    let newDirection: 'asc' | 'desc' = 'desc';
    
    // If clicking the same field, toggle direction
    if (sortField === field) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // For new field, default to desc for volume (highest first) and asc for difficulty (lowest first)
      newDirection = field === 'monthlyVolume' ? 'desc' : 'asc';
    }
    
    setSortField(field);
    setSortDirection(newDirection);
  };

  /**
   * Get sorted keywords array
   * Why this matters: Applies current sort settings to keywords, handling undefined values properly
   */
  const getSortedKeywords = () => {
    if (!sortField) return keywords;
    
    return [...keywords].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Handle undefined values - put them at the end
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      // Normal numeric comparison
      const comparison = aValue - bValue;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

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
  };

  /**
   * Select all rows or deselect all rows
   * Why this matters: Provides quick way to select/deselect all keywords for bulk operations
   */
  const toggleSelectAll = () => {
    if (selectedRows.size === keywords.length) {
      // If all are selected, deselect all
      setSelectedRows(new Set());
    } else {
      // Select all
      setSelectedRows(new Set(keywords.map(k => k.id)));
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

      // Generate default prompts with brand kit integration (same as BlogContentActionModal)
      const generateDefaultPrompts = () => {
        const currentYear = 2025;
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
   - End with strong CTA using {{ brand_kit.cta_text }} and {{ brand_kit.cta_destination }}
   - Apply {{ brand_kit.tone_of_voice }} consistently throughout
   - Follow {{ brand_kit.writing_rules }} for style and approach

IMPORTANT: The current year is 2025. When referencing "current year," "this year," or discussing recent trends, always use 2025. Do not reference 2024 or earlier years as current.

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY clean HTML content without any markdown code blocks, explanatory text, or meta-commentary
- DO NOT include phrases like "Here's the content:" or HTML code block markers
- Start directly with the HTML content and end with the closing HTML tag
- No markdown formatting, no code block indicators, no explanatory paragraphs

Remember: Create the definitive resource that makes other content feel incomplete by comparison. Every section should provide genuine value and actionable insights.`;

        const userPromptTemplate = `Based on this keyword and brand context, create comprehensive AEO-optimized content for 2025 (remember we are in 2025):

**Target Keyword:** ${keyword.keyword}

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
   - End with natural Apollo promotion using {{ brand_kit.cta_text }} {{ brand_kit.cta_destination }} (target="_blank")

4. **Content Depth & Value:**
   - Provide comprehensive coverage that serves as the definitive resource
   - Include practical, actionable guidance with specific examples
   - Address both current best practices and emerging trends for 2025
   - Cover implementation strategies with step-by-step processes
   - Include relevant metrics, benchmarks, and data points

5. **CRITICAL COMPLETION REQUIREMENT:**
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

[Adapt one of these conclusion styles to your specific topic, including concrete steps, Apollo features, and strong CTAs using {{ brand_kit.cta_text }} {{ brand_kit.cta_destination }}]`;

        return { systemPrompt: systemPromptTemplate, userPrompt: userPromptTemplate };
      };

      // Generate default prompts
      const { systemPrompt: defaultSystemPrompt, userPrompt: defaultUserPrompt } = generateDefaultPrompts();

      // Process brand kit variables in prompts if brand kit is available
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
          '{{ brand_kit.cta_text }}': brandKit.ctaText || brandKit.cta_text || '',
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

      const processedSystemPrompt = brandKit ? processLiquidVariables(defaultSystemPrompt, brandKit) : defaultSystemPrompt;
      const processedUserPrompt = brandKit ? processLiquidVariables(defaultUserPrompt, brandKit) : defaultUserPrompt;

      console.log(`📝 [BlogCreatorPage] Using default prompts with brand kit integration`);
      console.log(`🔧 [BlogCreatorPage] Brand kit available:`, !!brandKit);
      console.log(`🔧 [BlogCreatorPage] System prompt length:`, processedSystemPrompt.length);
      console.log(`🔧 [BlogCreatorPage] User prompt length:`, processedUserPrompt.length);
      if (brandKit) {
        console.log(`🔧 [BlogCreatorPage] Brand kit keys:`, Object.keys(brandKit));
      }

      // Determine backend URL based on environment
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://apollo-reddit-scraper-backend.vercel.app'
        : 'http://localhost:3003';

      console.log(`🚀 Starting content generation for keyword: "${keyword.keyword}"`);
      console.log(`🔗 Backend URL: ${backendUrl}`);
      console.log(`📦 Request payload:`, { 
        keyword: keyword.keyword, 
        content_length: 'medium', 
        brand_kit: brandKit,
        system_prompt: processedSystemPrompt.length + ' chars',
        user_prompt: processedUserPrompt.length + ' chars'
      });

      // Start synchronous content generation with default prompts (no polling needed)
      const response = await fetch(`${backendUrl}/api/blog-creator/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.keyword,
          content_length: 'medium',
          brand_kit: brandKit,
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt
        })
      });

      console.log(`📡 API Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ API Error response:`, errorData);
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const responseData = await response.json();
      const { data: result } = responseData;
      console.log(`✅ Content generation completed successfully for keyword: ${keyword.keyword}`);

      // Process the result directly (no polling needed)
      console.log(`📊 Processing completed result for keyword: ${keyword.keyword}`);
      // Process the completed result directly (no polling needed in synchronous approach)
      const finalWorkflowDetails = extractWorkflowDetailsFromResult(result);
      setKeywords(prev => prev.map(k => 
        k.id === keywordId 
          ? { 
              ...k, 
              status: 'completed',
              progress: '✅ Content generation complete!',
              output: result.content || '',
              metadata: result.metadata,
              generationResult: result,
              ...(finalWorkflowDetails && { workflowDetails: finalWorkflowDetails })
            }
          : k
      ));

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
   * Execute selected keywords (retry for failed, execute for pending) with enhanced tracking
   * Why this matters: Provides targeted bulk processing for user-selected keywords with real-time status feedback
   */
  const executeSelected = async () => {
    if (selectedRows.size === 0) return;

    const selectedKeywords = keywords
      .filter(k => selectedRows.has(k.id) && (k.status === 'pending' || k.status === 'error'))
      .slice(0, 5); // Limit to 5 concurrent executions

    if (selectedKeywords.length === 0) return;

    // Initialize bulk execution tracking for selected keywords
    setBulkExecutionStatus({
      isRunning: true,
      total: selectedKeywords.length,
      completed: 0,
      failed: 0
    });

    // Execute/retry selected keywords concurrently with result tracking
    const promises = selectedKeywords.map(async (keyword) => {
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
      {/* Auto-save status indicator */}
      {autoSaveStatus && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 50,
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
              <Clock className="animate-spin" style={{ width: '0.75rem', height: '0.75rem' }} />
              Auto-saving progress...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              Progress auto-saved
            </>
          )}
        </div>
      )}

      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Hero Section */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ padding: '2rem 1rem', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>
              Blog Creator
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '768px', margin: '0 auto 2rem' }}>
              Generate AEO-optimized articles using our 4-model pipeline:
            </p>
            
            {/* Modern Pipeline Visualization */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '1rem',
              flexWrap: 'wrap',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
                             {/* Step 1: Firecrawl */}
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 background: '#F67318',
                 borderRadius: '1rem',
                 padding: '0.5rem 1rem',
                 color: 'white',
                 fontWeight: '600',
                 fontSize: '0.875rem',
                 boxShadow: '0 4px 6px -1px rgba(246, 115, 24, 0.3)',
                 minWidth: '140px',
                 justifyContent: 'center',
                 gap: '0.5rem'
               }}>
                 <Globe size={16} />
                 Firecrawl
               </div>

              {/* Arrow 1 */}
              <div style={{ 
                color: '#d1d5db', 
                fontSize: '1.25rem', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                →
              </div>

                             {/* Step 2: Deep Research */}
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 background: '#3BB591',
                 borderRadius: '1rem',
                 padding: '0.5rem 1rem',
                 color: 'white',
                 fontWeight: '600',
                 fontSize: '0.875rem',
                 boxShadow: '0 4px 6px -1px rgba(59, 181, 145, 0.3)',
                 minWidth: '160px',
                 justifyContent: 'center',
                 gap: '0.5rem'
               }}>
                 <Brain size={16} />
                 Deep Research
               </div>

              {/* Arrow 2 */}
              <div style={{ 
                color: '#d1d5db', 
                fontSize: '1.25rem', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                →
              </div>

                             {/* Step 3: Gap Analysis */}
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 background: '#7D3DED',
                 borderRadius: '1rem',
                 padding: '0.5rem 1rem',
                 color: 'white',
                 fontWeight: '600',
                 fontSize: '0.875rem',
                 boxShadow: '0 4px 6px -1px rgba(125, 61, 237, 0.3)',
                 minWidth: '150px',
                 justifyContent: 'center',
                 gap: '0.5rem'
               }}>
                 <BarChart3 size={16} />
                 Gap Analysis
               </div>

              {/* Arrow 3 */}
              <div style={{ 
                color: '#d1d5db', 
                fontSize: '1.25rem', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                →
              </div>

                             {/* Step 4: Content Generation */}
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 background: '#EBF212',
                 borderRadius: '1rem',
                 padding: '0.5rem 1rem',
                 color: 'black',
                 fontWeight: '600',
                 fontSize: '0.875rem',
                 boxShadow: '0 4px 6px -1px rgba(235, 242, 18, 0.3)',
                 minWidth: '180px',
                 justifyContent: 'center',
                 gap: '0.5rem'
               }}>
                 <Sparkles size={16} />
                 Content Generation
               </div>
            </div>

            {/* Mobile-responsive CSS */}
            <style>
              {`
                @media (max-width: 768px) {
                  .pipeline-step {
                    min-width: 120px !important;
                    font-size: 0.75rem !important;
                    padding: 0.5rem 1rem !important;
                  }
                  .pipeline-arrow {
                    transform: rotate(90deg);
                    margin: 0.5rem 0;
                  }
                }
              `}
            </style>
          </div>
        </div>
      </div>

      {/* Main Content */}
              <div style={{ padding: '2rem 1rem', width: '100%' }}>
        {/* Control Panel */}
        <div style={{ marginBottom: '1.5rem' }}>
          {/* Upload Status Messages */}
          {(uploadSuccess || uploadError) && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-content">
                {uploadSuccess && (
                  <div style={{ 
                    padding: '0.75rem 1rem',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    borderRadius: '0.5rem',
                    color: '#166534',
                    fontSize: '0.875rem',
                    marginBottom: uploadError ? '0.5rem' : 0
                  }}>
                    ✅ {uploadSuccess}
                  </div>
                )}
                {uploadError && (
                  <div style={{ 
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.5rem',
                    color: '#dc2626',
                    fontSize: '0.875rem'
                  }}>
                    ⚠️ {uploadError}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Bulk Execute Control */}
          <div className="card">
            <div className="card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Primary bulk execution button */}
                  {selectedRows.size > 0 ? (
                    <button
                      onClick={executeSelected}
                      disabled={keywords.filter(k => selectedRows.has(k.id) && (k.status === 'pending' || k.status === 'error')).length === 0}
                      className="apollo-btn-primary"
                      style={{ 
                        opacity: keywords.filter(k => selectedRows.has(k.id) && (k.status === 'pending' || k.status === 'error')).length === 0 ? 0.5 : 1 
                      }}
                    >
                      <Play size={16} />
                      Execute Selected ({Math.min(keywords.filter(k => selectedRows.has(k.id) && (k.status === 'pending' || k.status === 'error')).length, 5)})
                    </button>
                  ) : (
                    <button
                      onClick={executeBulk}
                      disabled={keywords.filter(k => k.status === 'pending').length === 0}
                      className="apollo-btn-primary"
                      style={{ opacity: keywords.filter(k => k.status === 'pending').length === 0 ? 0.5 : 1 }}
                    >
                      <Play size={16} />
                      Execute 5 Rows
                    </button>
                  )}

                  {/* Secondary bulk execute for first 3 pending when rows are selected */}
                  {selectedRows.size > 0 && keywords.filter(k => k.status === 'pending').length > 0 && (
                    <button
                      onClick={executeBulk}
                      className="apollo-btn-secondary"
                    >
                      <Play size={16} />
                      Execute Next 5 Pending
                    </button>
                  )}
                  
                  {selectedRows.size > 0 && (
                    <button
                      onClick={showBulkDeleteConfirmation}
                      className="apollo-btn-secondary"
                      style={{ 
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none'
                      }}
                    >
                      <Trash2 size={16} />
                      Delete Selected ({selectedRows.size})
                    </button>
                  )}
                </div>

                {/* Enhanced Execution Status Info with Concurrent Processing Feedback */}
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {bulkExecutionStatus.isRunning ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#eff6ff',
                      borderRadius: '0.375rem',
                      border: '1px solid #dbeafe'
                    }}>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid #3b82f6', 
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span style={{ color: '#1e40af', fontWeight: '500' }}>
                        Running {concurrentExecutions.size} concurrent workflow{concurrentExecutions.size > 1 ? 's' : ''} • 
                        {bulkExecutionStatus.completed}/{bulkExecutionStatus.total} completed
                        {bulkExecutionStatus.failed > 0 && ` • ${bulkExecutionStatus.failed} failed`}
                      </span>
                    </div>
                  ) : selectedRows.size > 0 ? (
                    <span>
                      {selectedRows.size} row{selectedRows.size > 1 ? 's' : ''} selected • 
                      {keywords.filter(k => selectedRows.has(k.id) && (k.status === 'pending' || k.status === 'error')).length} ready to execute/retry • 
                      Max 5 concurrent executions
                      {sortField && (
                        <span style={{ color: '#3b82f6', marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          • Sorted by {sortField === 'monthlyVolume' ? 'Volume' : 'Difficulty'} ({sortDirection === 'desc' ? '↓' : '↑'})
                          <button
                            onClick={resetSorting}
                            style={{
                              padding: '0.125rem 0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e5e7eb';
                              e.currentTarget.style.color = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                              e.currentTarget.style.color = '#6b7280';
                            }}
                            title="Reset to original order"
                          >
                            <X size={10} />
                            Reset
                          </button>
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>
                      {keywords.filter(k => k.status === 'pending').length} pending • 
                      {keywords.filter(k => k.status === 'error').length} failed • 
                      {keywords.filter(k => k.status === 'completed').length} completed
                      {concurrentExecutions.size > 0 && ` • ${concurrentExecutions.size} running`}
                      {sortField && (
                        <span style={{ color: '#3b82f6', marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          • Sorted by {sortField === 'monthlyVolume' ? 'Volume' : 'Difficulty'} ({sortDirection === 'desc' ? '↓' : '↑'})
                          <button
                            onClick={resetSorting}
                            style={{
                              padding: '0.125rem 0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e5e7eb';
                              e.currentTarget.style.color = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                              e.currentTarget.style.color = '#6b7280';
                            }}
                            title="Reset to original order"
                          >
                            <X size={10} />
                            Reset
                          </button>
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Airtable-like Table */}
        <div className="card" style={{ overflow: 'auto', maxHeight: '70vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ 
                backgroundColor: '#f9fafb', 
                borderBottom: '1px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: '60px' }}>
                    <input
                      type="checkbox"
                      checked={keywords.length > 0 && selectedRows.size === keywords.length}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                      title="Select all"
                    />
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Keywords
                      <div style={{ position: 'relative' }}>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleDirectCSVUpload}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                          id="compact-csv-upload"
                        />
                        <button
                          style={{ 
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            fontWeight: '500',
                            backgroundColor: '#EBF212',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Upload CSV file"
                        >
                          <Upload size={12} />
                          Upload CSV
                        </button>
                      </div>
                    </div>
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      textAlign: 'left', 
                      fontSize: '0.75rem', 
                      fontWeight: '500', 
                      color: '#6b7280', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      width: '120px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      position: 'relative'
                    }}
                    onClick={() => handleSort('monthlyVolume')}
                    title="Click to sort by Monthly Volume"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      Monthly Volume
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.25rem' }}>
                        <ChevronUp 
                          size={12} 
                          style={{ 
                            color: sortField === 'monthlyVolume' && sortDirection === 'asc' ? '#3b82f6' : '#6b7280',
                            marginBottom: '-2px'
                          }} 
                        />
                        <ChevronDown 
                          size={12} 
                          style={{ 
                            color: sortField === 'monthlyVolume' && sortDirection === 'desc' ? '#3b82f6' : '#6b7280' 
                          }} 
                        />
                      </div>
                    </div>
                  </th>
                  <th 
                    style={{ 
                      padding: '0.75rem 1.5rem', 
                      textAlign: 'left', 
                      fontSize: '0.75rem', 
                      fontWeight: '500', 
                      color: '#6b7280', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      width: '120px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      position: 'relative'
                    }}
                    onClick={() => handleSort('avgDifficulty')}
                    title="Click to sort by Avg. Difficulty"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      Avg. Difficulty
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.25rem' }}>
                        <ChevronUp 
                          size={12} 
                          style={{ 
                            color: sortField === 'avgDifficulty' && sortDirection === 'asc' ? '#3b82f6' : '#6b7280',
                            marginBottom: '-2px'
                          }} 
                        />
                        <ChevronDown 
                          size={12} 
                          style={{ 
                            color: sortField === 'avgDifficulty' && sortDirection === 'desc' ? '#3b82f6' : '#6b7280' 
                          }} 
                        />
                      </div>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Execute
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Output
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Next Steps
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: '60px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#ffffff' }}>
                {keywords.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
                      Upload a CSV file to get started
                    </td>
                  </tr>
                ) : (
                  getSortedKeywords().map((keyword) => (
                    <tr key={keyword.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: selectedRows.has(keyword.id) ? '#f0f9ff' : '#ffffff' }}>
                      {/* Selection Checkbox */}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(keyword.id)}
                          onChange={() => toggleRowSelection(keyword.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* Keywords Column */}
                      <td style={{ padding: '1rem 1.5rem', maxWidth: '350px', minWidth: '280px' }}>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '500', 
                          color: '#1f2937',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={keyword.keyword} // Show full keyword on hover
                        >
                          {keyword.keyword}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {keyword.createdAt.toLocaleDateString()}
                        </div>
                      </td>

                      {/* Monthly Volume Column */}
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center', width: '120px' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                          {keyword.monthlyVolume ? keyword.monthlyVolume.toLocaleString() : '-'}
                        </div>
                      </td>

                      {/* Avg. Difficulty Column */}
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center', width: '120px' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                          {keyword.avgDifficulty !== undefined ? keyword.avgDifficulty : '-'}
                        </div>
                      </td>

                      {/* Execute Column */}
                      <td style={{ padding: '1rem 1.5rem', width: '280px', minWidth: '280px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                          {keyword.status === 'error' ? (
                            <button
                              onClick={() => retryKeyword(keyword.id)}
                              style={{ 
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                backgroundColor: '#f59e0b',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '0.375rem',
                                whiteSpace: 'nowrap',
                                width: 'fit-content',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <RefreshCw size={14} />
                              Retry
                            </button>
                          ) : keyword.status === 'completed' ? (
                            <button
                              onClick={() => retryKeyword(keyword.id)}
                              style={{ 
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                backgroundColor: '#6b7280',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '0.375rem',
                                whiteSpace: 'nowrap',
                                width: 'fit-content',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <RefreshCw size={14} />
                              Regenerate
                            </button>
                          ) : (
                            <button
                              onClick={() => executeKeyword(keyword.id)}
                              disabled={keyword.status === 'running'}
                              style={{ 
                                padding: keyword.status === 'running' ? '0.25rem 0.5rem' : '0.25rem 0.4rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                backgroundColor: keyword.status === 'running' ? '#6b7280' : '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '0.375rem',
                                opacity: keyword.status === 'running' ? 0.6 : 1,
                                cursor: keyword.status === 'running' ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap',
                                width: keyword.status === 'running' ? '90px' : '65px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Play size={14} />
                              {keyword.status === 'running' ? 'Running...' : 'Play'}
                            </button>
                          )}
                          
                          {/* Enhanced progress indicator for running keywords with concurrent processing indicator */}
                          {keyword.status === 'running' && (
                            <div 
                              style={{ 
                                fontSize: '0.75rem', 
                                color: '#6b7280', 
                                width: '100%',
                                maxWidth: '250px',
                                wordWrap: 'break-word',
                                whiteSpace: 'normal',
                                lineHeight: '1.3',
                                marginTop: '0.25rem',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                borderRadius: '0.25rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => showBackendPopup(keyword.id, e)}
                              onMouseLeave={hideBackendPopup}
                              onClick={(e) => showBackendPopup(keyword.id, e)} // Mobile tap support
                              title="Hover/tap for detailed backend progress"
                            >
                              {concurrentExecutions.size > 1 && (
                                <div style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.25rem',
                                  marginBottom: '0.25rem',
                                  padding: '0.125rem 0.375rem',
                                  backgroundColor: '#e0f2fe',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.6875rem',
                                  color: '#0369a1',
                                  fontWeight: '500'
                                }}>
                                  🔄 Concurrent ({concurrentExecutions.size} running)
                                </div>
                              )}
                              {keyword.progress}
                            </div>
                          )}
                          
                          {/* Error message for failed keywords */}
                          {keyword.status === 'error' && (
                            <div 
                              style={{ 
                                fontSize: '0.75rem', 
                                color: '#dc2626', 
                                width: '100%',
                                maxWidth: '250px',
                                wordWrap: 'break-word',
                                whiteSpace: 'normal',
                                lineHeight: '1.3',
                                marginTop: '0.25rem',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                borderRadius: '0.25rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => showBackendPopup(keyword.id, e)}
                              onMouseLeave={hideBackendPopup}
                              onClick={(e) => showBackendPopup(keyword.id, e)} // Mobile tap support
                              title="Hover/tap for detailed error information"
                            >
                              {keyword.progress}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Output Column */}
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ maxWidth: '200px' }}>
                          {keyword.status === 'completed' ? (
                            <div 
                              style={{ 
                                fontSize: '0.875rem', 
                                color: '#1f2937',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                borderRadius: '0.25rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => showBackendPopup(keyword.id, e)}
                              onMouseLeave={hideBackendPopup}
                              onClick={(e) => showBackendPopup(keyword.id, e)} // Mobile tap support
                              title="Hover/tap for detailed generation results"
                            >
                              <div style={{ marginBottom: '0.25rem', fontWeight: '500' }}>Article Generated</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {keyword.output.split('\n')[0].replace('# ', '')}
                              </div>
                            </div>
                          ) : keyword.status === 'error' ? (
                            <div 
                              style={{ 
                                fontSize: '0.875rem', 
                                color: '#dc2626',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                borderRadius: '0.25rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => showBackendPopup(keyword.id, e)}
                              onMouseLeave={hideBackendPopup}
                              onClick={(e) => showBackendPopup(keyword.id, e)} // Mobile tap support
                              title="Hover/tap for error details"
                            >
                              Generation failed
                            </div>
                          ) : keyword.status === 'running' ? (
                            <div 
                              style={{ 
                                fontSize: '0.875rem', 
                                color: '#2563eb',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                borderRadius: '0.25rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => showBackendPopup(keyword.id, e)}
                              onMouseLeave={hideBackendPopup}
                              onClick={(e) => showBackendPopup(keyword.id, e)} // Mobile tap support
                              title="Hover/tap for live progress details"
                            >
                              Processing...
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                              Pending
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Next Steps Column */}
                      <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                        {keyword.status === 'completed' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => openNextStepsModal(keyword.id)}
                              className="apollo-btn-primary"
                              style={{ 
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.875rem'
                              }}
                            >
                              Actions
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                            Complete generation first
                          </div>
                        )}
                      </td>

                      {/* Individual Delete Action */}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => showDeleteKeywordModal(keyword.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="Delete keyword"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
              onMouseEnter={keepPopupVisible}
              onMouseLeave={hideBackendPopup}
              onMobileClose={hidePopupImmediately}
            />
          );
        })()}
      </div>
    </div>
    </>
  );
};

export default BlogCreatorPage; 