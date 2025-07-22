import React, { useState, useEffect, useRef } from 'react';
import { Play, Upload, MoreHorizontal, FileText, ExternalLink, Copy, RefreshCw, Trash2, X, AlertTriangle, Globe, Brain, BarChart3, Sparkles, Clock, CheckCircle } from 'lucide-react';
import BlogContentActionModal from '../components/BlogContentActionModal';


// Define interfaces for our data structure
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

interface CSVUploadResult {
  keywords: string[];
  totalProcessed: number;
  errors: string[];
}

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

  /**
   * Load saved progress from localStorage on mount
   * Why this matters: Restores user's Blog Creator workflow progress across page refreshes, preventing data loss.
   */
  useEffect(() => {
    const savedProgress = localStorage.getItem('apollo_blog_creator_progress');
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        
        // Restore keywords with proper Date objects
        if (progress.keywords && Array.isArray(progress.keywords)) {
          const restoredKeywords = progress.keywords.map((keyword: any) => ({
            ...keyword,
            createdAt: new Date(keyword.createdAt) // Convert ISO string back to Date
          }));
          setKeywords(restoredKeywords);
        }
        
        // Restore selected rows
        if (progress.selectedRows && Array.isArray(progress.selectedRows)) {
          setSelectedRows(new Set(progress.selectedRows));
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
  }, [keywords, selectedRows]);

  /**
   * Clear saved progress (for debugging or manual reset)
   * Why this matters: Allows users to start fresh by clearing localStorage data.
   */
  const clearSavedProgress = (): void => {
    localStorage.removeItem('apollo_blog_creator_progress');
    setKeywords([]);
    setSelectedRows(new Set());
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
   * Simple CSV upload processing
   * Why this matters: Handles CSV upload without requiring the full LargeCSVUploader component UI
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

      // Simple CSV processing (we'll enhance this to use Papa Parse like LargeCSVUploader)
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header if present
      const startIndex = lines.length > 0 && 
        lines[0].toLowerCase().includes('keyword') ? 1 : 0;
      
      const uploadedKeywords = lines.slice(startIndex).map(line => line.trim()).filter(line => line);
      
      // Create result object matching CSVUploadResult interface
      const result = {
        keywords: uploadedKeywords,
        totalProcessed: lines.length,
        errors: []
      };

      handleCSVUploadComplete(result);
    } catch (error) {
      setUploadError('Failed to process uploaded CSV file');
      setShowUploadErrorModal(true);
      console.error('Error processing CSV:', error);
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

      // Determine backend URL based on environment
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://apollo-reddit-scraper-backend.vercel.app'
        : 'http://localhost:3003';

      console.log(`🚀 Starting content generation for keyword: "${keyword.keyword}"`);
      console.log(`🔗 Backend URL: ${backendUrl}`);
      console.log(`📦 Request payload:`, { keyword: keyword.keyword, content_length: 'medium', brand_kit: brandKit });

      // Start async content generation
      const response = await fetch(`${backendUrl}/api/blog-creator/generate-content-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.keyword,
          content_length: 'medium',
          brand_kit: brandKit
        })
      });

      console.log(`📡 API Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ API Error response:`, errorData);
        throw new Error(errorData.error || 'Failed to start content generation');
      }

      const responseData = await response.json();
      const { jobId } = responseData;
      console.log(`✅ Job started successfully with ID: ${jobId}`);

      // Poll for progress updates
      console.log(`🔄 Starting polling for job ${jobId}`);
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${backendUrl}/api/blog-creator/job-status/${jobId}`);
          if (!statusResponse.ok) {
            console.error(`❌ Status polling failed: ${statusResponse.status} ${statusResponse.statusText}`);
            throw new Error('Failed to get job status');
          }

          const statusData = await statusResponse.json();
          const { status, progress, message, result, error } = statusData.data;
          console.log(`📊 Job ${jobId} status:`, { status, message, progress });

          // Update progress message
          setKeywords(prev => prev.map(k => 
            k.id === keywordId 
              ? { ...k, progress: message }
              : k
          ));

          if (status === 'completed') {
            clearInterval(pollInterval);
            // Update with final result
            setKeywords(prev => prev.map(k => 
              k.id === keywordId 
                ? { 
                    ...k, 
                    status: 'completed',
                    progress: '✅ Content generation complete!',
                    output: result.content || '',
                    metadata: result.metadata,
                    generationResult: result
                  }
                : k
            ));
          } else if (status === 'error') {
            clearInterval(pollInterval);
            // Update with error
            setKeywords(prev => prev.map(k => 
              k.id === keywordId 
                ? { 
                    ...k, 
                    status: 'error',
                    progress: `❌ Generation failed: ${error}`,
                    output: ''
                  }
                : k
            ));
          }
        } catch (pollError) {
          console.error('Failed to poll job status:', pollError);
          clearInterval(pollInterval);
          setKeywords(prev => prev.map(k => 
            k.id === keywordId 
              ? { 
                  ...k, 
                  status: 'error',
                  progress: '❌ Failed to get generation status',
                  output: ''
                }
              : k
          ));
        }
      }, 2000); // Poll every 2 seconds

      // Set timeout to prevent infinite polling (10 minutes max)
      setTimeout(() => {
        clearInterval(pollInterval);
        setKeywords(prev => prev.map(k => 
          k.id === keywordId && k.status === 'running'
            ? { 
                ...k, 
                status: 'error',
                progress: '❌ Generation timed out after 10 minutes',
                output: ''
              }
            : k
        ));
      }, 600000); // 10 minutes

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
        ? { ...k, status: 'pending', progress: '', output: '' }
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
      // Execute selected pending/error keywords (up to 3)
      keywordsToExecute = keywords
        .filter(k => selectedRows.has(k.id) && (k.status === 'pending' || k.status === 'error'))
        .slice(0, 3);
    } else {
      // Execute first 3 pending keywords if none selected
      keywordsToExecute = keywords
        .filter(k => k.status === 'pending')
        .slice(0, 3);
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
      .slice(0, 3); // Limit to 3 concurrent executions

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
        <div className="max-w-7xl" style={{ padding: '2rem 1rem' }}>
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
                 padding: '0.75rem 1.25rem',
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
                 padding: '0.75rem 1.25rem',
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
                 padding: '0.75rem 1.25rem',
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
                 padding: '0.75rem 1.25rem',
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
      <div className="max-w-7xl" style={{ padding: '2rem 1rem' }}>
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
                      Execute Selected ({Math.min(keywords.filter(k => selectedRows.has(k.id) && (k.status === 'pending' || k.status === 'error')).length, 3)})
                    </button>
                  ) : (
                    <button
                      onClick={executeBulk}
                      disabled={keywords.filter(k => k.status === 'pending').length === 0}
                      className="apollo-btn-primary"
                      style={{ opacity: keywords.filter(k => k.status === 'pending').length === 0 ? 0.5 : 1 }}
                    >
                      <Play size={16} />
                      Execute 3 Rows
                    </button>
                  )}

                  {/* Secondary bulk execute for first 3 pending when rows are selected */}
                  {selectedRows.size > 0 && keywords.filter(k => k.status === 'pending').length > 0 && (
                    <button
                      onClick={executeBulk}
                      className="apollo-btn-secondary"
                    >
                      <Play size={16} />
                      Execute Next 3 Pending
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
                      Max 3 concurrent executions
                    </span>
                  ) : (
                    <span>
                      {keywords.filter(k => k.status === 'pending').length} pending • 
                      {keywords.filter(k => k.status === 'error').length} failed • 
                      {keywords.filter(k => k.status === 'completed').length} completed
                      {concurrentExecutions.size > 0 && ` • ${concurrentExecutions.size} running`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Airtable-like Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
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
                          className="apollo-btn-secondary"
                          style={{ 
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            fontWeight: '500'
                          }}
                          title="Upload CSV file"
                        >
                          <Upload size={12} />
                          Upload CSV
                        </button>
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
                    <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>
                      Upload a CSV file to get started
                    </td>
                  </tr>
                ) : (
                  keywords.map((keyword) => (
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
                      <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                          {keyword.keyword}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {keyword.createdAt.toLocaleDateString()}
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
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#6b7280', 
                              width: '100%',
                              maxWidth: '250px',
                              wordWrap: 'break-word',
                              whiteSpace: 'normal',
                              lineHeight: '1.3',
                              marginTop: '0.25rem'
                            }}>
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
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#dc2626', 
                              width: '100%',
                              maxWidth: '250px',
                              wordWrap: 'break-word',
                              whiteSpace: 'normal',
                              lineHeight: '1.3',
                              marginTop: '0.25rem'
                            }}>
                              {keyword.progress}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Output Column */}
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ maxWidth: '200px' }}>
                          {keyword.status === 'completed' ? (
                            <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                              <div style={{ marginBottom: '0.25rem', fontWeight: '500' }}>Article Generated</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {keyword.output.split('\n')[0].replace('# ', '')}
                              </div>
                            </div>
                          ) : keyword.status === 'error' ? (
                            <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                              Generation failed
                            </div>
                          ) : keyword.status === 'running' ? (
                            <div style={{ fontSize: '0.875rem', color: '#2563eb' }}>
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
                              <MoreHorizontal size={14} />
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
                        <li>Headers are automatically detected and skipped</li>
                        <li>Keywords longer than 200 characters will be flagged</li>
                        <li>Empty rows are automatically skipped</li>
                        <li>Duplicate keywords are automatically removed</li>
                      </ul>
                    </div>

                    <div>
                      <strong style={{ color: '#1f2937' }}>Supported Headers:</strong>
                      <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                        <li>"keyword", "keywords", "term", "query" (case insensitive)</li>
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
      </div>
    </div>
    </>
  );
};

export default BlogCreatorPage; 