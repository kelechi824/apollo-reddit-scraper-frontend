import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Papa, { ParseResult } from 'papaparse';
import axios from 'axios';
import BackendDetailsPopup from '../components/BackendDetailsPopup';
import CompetitorContentActionModal from '../components/CompetitorContentActionModal';

type RowStatus = 'idle' | 'queued' | 'running' | 'completed' | 'error';

interface CompetitorRow {
  id: string;
  keyword: string;
  url: string;
  monthlyVolume?: number;
  avgDifficulty?: number;
  status: RowStatus;
  output?: string;
  createdAt: string;
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

interface CompetitorOption {
  key: string;
  label: string;
  csvPath?: string | null;
}

/**
 * CompetitorConquestingPage
 * Why this matters: Implements streaming CSV preload (6k+ rows) and a sticky-header
 * table with URL column, establishing the data foundation for the 4-step workflow.
 */
const CompetitorConquestingPage: React.FC = () => {
  const competitors: CompetitorOption[] = [
    { key: 'cognism', label: 'Cognism', csvPath: '/competitors/cognism.csv' },
    { key: 'kaspr', label: 'Kaspr (coming soon)', csvPath: null }
  ];

  const [selectedCompetitor, setSelectedCompetitor] = React.useState<string>('');
  const [rows, setRows] = React.useState<CompetitorRow[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loadedCount, setLoadedCount] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<'monthlyVolume' | 'avgDifficulty' | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [selectionMadeBySelectAll, setSelectionMadeBySelectAll] = React.useState<boolean>(false);
  const [bulkStatus, setBulkStatus] = React.useState<{ isRunning: boolean; total: number; completed: number; failed: number }>({ isRunning: false, total: 0, completed: 0, failed: 0 });
  const [popupState, setPopupState] = React.useState<{ isVisible: boolean; rowId: string | null; position: { x: number; y: number } }>({ isVisible: false, rowId: null, position: { x: 0, y: 0 } });
  const [isActionModalOpen, setIsActionModalOpen] = React.useState<boolean>(false);
  const [activeModalRowId, setActiveModalRowId] = React.useState<string | null>(null);
  // Pagination
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(200);
  // Persistence control
  const isInitialLoadRef = React.useRef<boolean>(true);
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  // Sequential execution controls
  const stopSequentialRef = React.useRef<boolean>(false);
  const [isSequentialRunning, setIsSequentialRunning] = React.useState<boolean>(false);
  const [sequentialRemaining, setSequentialRemaining] = React.useState<string[]>([]);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Dedup set to prevent duplicate keywords
  const loadedKeywordsRef = React.useRef<Set<string>>(new Set());
  // Used to batch updates for performance during streaming parse
  const batchRef = React.useRef<CompetitorRow[]>([]);
  // Cancel flag when switching competitors or unmounting
  const cancelledRef = React.useRef<boolean>(false);

  /**
   * parseCsvStream
   * Why this matters: Streams large CSVs without freezing the UI; batches state updates for performance.
   */
  const parseCsvStream = React.useCallback(async (csvUrl: string) => {
    setIsLoading(true);
    setError(null);
    setRows([]);
    setLoadedCount(0);
    loadedKeywordsRef.current = new Set();
    batchRef.current = [];
    cancelledRef.current = false;

    // Normalize to absolute URL
    // Build candidate URLs (backend first, then frontend public)
    const candidates: string[] = (() => {
      const list: string[] = [];
      if (csvUrl.includes('/competitors/cognism.csv')) {
        // Use appropriate backend URL for dev vs production
        const backendUrl = process.env.NODE_ENV === 'production' 
          ? 'https://apollo-reddit-scraper-backend.vercel.app/api/competitor-conquesting/csv/cognism'
          : 'http://localhost:3003/api/competitor-conquesting/csv/cognism';
        list.push(backendUrl);
        list.push(new URL('/competitors/cognism.csv', window.location.origin).toString());
      } else if (/^https?:\/\//i.test(csvUrl)) {
        list.push(csvUrl);
      } else {
        list.push(new URL(csvUrl, window.location.origin).toString());
      }
      return list;
    })();

    // Helper to try each URL until one succeeds
    const fetchCsvText = async (): Promise<string> => {
      let lastError: any = null;
      for (const url of candidates) {
        try {
          const resp = await fetch(url, { cache: 'no-cache' });
          if (resp.ok) {
            return await resp.text();
          }
          lastError = new Error(`HTTP ${resp.status} at ${url}`);
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError || new Error('Failed to fetch CSV from all candidates');
    };

    try {
      const csvText = await fetchCsvText();
      // Why this matters: `worker: true` offloads parsing to a Web Worker, preventing main-thread jank on large CSVs.
      const parsed = await new Promise<ParseResult<any>>((resolve) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          worker: true,
          complete: (results) => resolve(results)
        });
      });
      const data = Array.isArray((parsed as any).data) ? (parsed as any).data : [];

      const rowsOut: CompetitorRow[] = [];
      for (const item of data as any[]) {
        if (cancelledRef.current) break;
        const keywordRaw = (item.KEYWORDS ?? item.keyword ?? item.Keyword ?? '').toString().trim();
        const urlRaw = (item.URL ?? item.url ?? '').toString().trim();
        if (!keywordRaw || !urlRaw) continue;
        if (loadedKeywordsRef.current.has(keywordRaw)) continue;
        loadedKeywordsRef.current.add(keywordRaw);

        const monthlyVolume = Number(item['MONTHLY VOLUME'] ?? item.monthlyVolume ?? item.volume ?? '');
        const avgDifficulty = Number(item['AVG. DIFFICULTY'] ?? item.avgDifficulty ?? item.difficulty ?? '');

        rowsOut.push({
          id: `${keywordRaw}-${loadedKeywordsRef.current.size}`,
          keyword: keywordRaw,
          url: urlRaw,
          ...(Number.isFinite(monthlyVolume) ? { monthlyVolume } : {}),
          ...(Number.isFinite(avgDifficulty) ? { avgDifficulty } : {}),
          status: 'idle',
          createdAt: new Date().toISOString()
        });
      }

      setRows(rowsOut);
      setLoadedCount(rowsOut.length);
    } catch (e: any) {
      console.error('CSV preload failed:', e);
      setError(e?.message || 'Failed to load CSV');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * handleCompetitorChange
   * Why this matters: Centralizes competitor selection and modular CSV wiring for future datasets.
   */
  const handleCompetitorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedCompetitor(key);
    // Cancel any ongoing parse
    cancelledRef.current = true;
    // small timeout to ensure previous parser aborts before new parse starts
    setTimeout(() => {
      cancelledRef.current = false;
      const option = competitors.find(c => c.key === key);
      if (!option) return;
      if (!option.csvPath) {
        setRows([]);
        setLoadedCount(0);
        setError('Dataset coming soon');
        setIsLoading(false);
        return;
      }
      parseCsvStream(option.csvPath);
    }, 0);
  };

  /**
   * loadSavedProgress
   * Why this matters: Restores table state after refresh/navigation so work isn’t lost.
   */
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('apollo_competitor_conquesting_progress');
      if (!saved) {
        isInitialLoadRef.current = false;
        return;
      }
      const parsed = JSON.parse(saved);
      if (parsed.selectedCompetitor) setSelectedCompetitor(parsed.selectedCompetitor);
      if (Array.isArray(parsed.rows)) setRows(parsed.rows);
      if (Array.isArray(parsed.selectedRows)) setSelectedRows(new Set(parsed.selectedRows));
      if (parsed.sortField) setSortField(parsed.sortField);
      if (parsed.sortDirection) setSortDirection(parsed.sortDirection);
      if (Array.isArray(parsed.sequentialRemaining)) setSequentialRemaining(parsed.sequentialRemaining);
    } catch (err) {
      console.warn('[CompetitorConquesting] Failed to load saved progress:', err);
      localStorage.removeItem('apollo_competitor_conquesting_progress');
    } finally {
      // Defer a tick to avoid immediate save on mount
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 0);
    }
  }, []);

  /**
   * autoSaveProgress (debounced)
   * Why this matters: Persists state changes so reloads return to the same table view.
   */
  React.useEffect(() => {
    if (isInitialLoadRef.current) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    autoSaveTimeoutRef.current = setTimeout(() => {
      try {
        const progress = {
          selectedCompetitor,
          rows,
          selectedRows: Array.from(selectedRows),
          sortField,
          sortDirection,
          sequentialRemaining,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('apollo_competitor_conquesting_progress', JSON.stringify(progress));
      } catch (err) {
        console.warn('[CompetitorConquesting] Failed to save progress:', err);
      }
    }, 800);

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [selectedCompetitor, rows, selectedRows, sortField, sortDirection]);

  /**
   * clearPersistedData
   * Why this matters: Allows explicit reset when needed (kept internal to avoid accidental wipes).
   */
  const clearPersistedData = () => {
    try { localStorage.removeItem('apollo_competitor_conquesting_progress'); } catch {}
  };

  /**
   * deleteSelectedRows
   * Why this matters: Allows bulk removal of rows the user selected; also cleans up any pending sequential queue entries.
   */
  const deleteSelectedRows = () => {
    const idsToDelete = new Set(Array.from(selectedRows));
    setRows(prev => prev.filter(r => !idsToDelete.has(r.id)));
    setSequentialRemaining(prev => prev.filter(id => !idsToDelete.has(id)));
    setSelectedRows(new Set());
  };

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<boolean>(false);

  /**
   * Clip long text to avoid horizontal scroll
   * Why this matters: Keeps the table readable at common widths while showing key info.
   */
  const clippedStyle: React.CSSProperties = {
    width: '100%',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  /**
   * handleSort
   * Why this matters: Lets users prioritize by opportunity (high volume) or ease (low difficulty).
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
    // Why this matters: we no longer mutate `rows` for sorting; we sort in a memoized selector and reset to page 1.
    setPage(1);
  };

  // Why this matters: Memoized sorted view avoids re-sorting and heavy re-renders when unrelated state changes.
  const sortedRows = React.useMemo(() => {
    if (!sortField) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortField] ?? (sortField === 'monthlyVolume' ? -Infinity : Infinity);
      const bv = b[sortField] ?? (sortField === 'monthlyVolume' ? -Infinity : Infinity);
      if (av === bv) return 0;
      const base = (av as number) < (bv as number) ? -1 : 1;
      return sortDirection === 'asc' ? base : -base;
    });
    return copy;
  }, [rows, sortField, sortDirection]);

  // Why this matters: Render only a slice of rows to keep DOM light and scrolling smooth.
  const totalPages = React.useMemo(() => Math.max(1, Math.ceil(sortedRows.length / pageSize)), [sortedRows.length, pageSize]);
  const paginatedRows = React.useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize, totalPages]);

  // Keep page in range when rows/pageSize change
  React.useEffect(() => {
    setPage(p => Math.min(p, Math.max(1, Math.ceil(sortedRows.length / pageSize))));
  }, [sortedRows.length, pageSize]);

  /**
   * toggleRowSelection / selectAll / clearSelection
   * Why this matters: Enables targeted bulk execution on chosen keywords.
   */
  const toggleRowSelection = (rowId: string) => {
    setSelectedRows(prev => {
      const copy = new Set(prev);
      if (copy.has(rowId)) copy.delete(rowId); else copy.add(rowId);
      return copy;
    });
    setSelectionMadeBySelectAll(false);
  };
  const selectAll = () => { setSelectedRows(new Set(rows.map(r => r.id))); setSelectionMadeBySelectAll(true); };
  const clearSelection = () => { setSelectedRows(new Set()); setSelectionMadeBySelectAll(false); };

  /**
   * runBulkExecution
   * Why this matters: Processes many rows efficiently while respecting API limits (max 3 concurrent).
   */
  const runBulkExecution = async (targetRowIds?: string[]) => {
    const queue = (targetRowIds && targetRowIds.length > 0 ? targetRowIds : rows.map(r => r.id)).filter(id => {
      const row = rows.find(r => r.id === id);
      // Only process rows that are not running AND not completed (idle, error, or queued)
      return row && row.status !== 'running' && row.status !== 'completed';
    });
    // Only process up to 5 at a time even if more were passed in
    const limitedQueue = queue.slice(0, 5);
    if (limitedQueue.length === 0) return;

    setBulkStatus({ isRunning: true, total: limitedQueue.length, completed: 0, failed: 0 });

    // Mark all queued as queued
    setRows(prev => prev.map(r => (limitedQueue.includes(r.id) ? { ...r, status: 'queued' } : r)));

    const maxConcurrent = 5;
    let inFlight = 0;
    let cursor = 0;

    return new Promise<void>((resolve) => {
      const launchNext = () => {
        while (inFlight < maxConcurrent && cursor < limitedQueue.length) {
          const id = limitedQueue[cursor++];
          inFlight++;
          setRows(prev => prev.map(r => (r.id === id ? { ...r, status: 'running' } : r)));
          executeRow(id).then(() => {
            setBulkStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
          }).catch(() => {
            setBulkStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
          }).finally(() => {
            inFlight--;
            if (cursor < limitedQueue.length) {
              launchNext();
            } else if (inFlight === 0) {
              setBulkStatus(prev => ({ ...prev, isRunning: false }));
              resolve();
            }
          });
        }
      };
      launchNext();
    });
  };

  /**
   * runBulkExecutionSequential
   * Why this matters: Runs ALL selected rows one-by-one (no concurrency) when the user chooses
   * "Run Selected" so long, multi-row batches don’t overwhelm the backend.
   */
  const runBulkExecutionSequential = async (targetRowIds?: string[]) => {
    const queue = (targetRowIds && targetRowIds.length > 0 ? targetRowIds : rows.map(r => r.id)).filter(id => {
      const row = rows.find(r => r.id === id);
      // Only process rows that are not running AND not completed (idle, error, or queued)
      return row && row.status !== 'running' && row.status !== 'completed';
    });
    if (queue.length === 0) return;

    setBulkStatus({ isRunning: true, total: queue.length, completed: 0, failed: 0 });
    setIsSequentialRunning(true);
    stopSequentialRef.current = false;
    setSequentialRemaining(queue.slice());

    // Mark all queued as queued
    setRows(prev => prev.map(r => (queue.includes(r.id) ? { ...r, status: 'queued' } : r)));

    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      if (stopSequentialRef.current) {
        // Reset the current row back to idle/queued state
        setRows(prev => prev.map(r => {
          if (r.id === id) {
            // If it was running, set back to idle so it can be resumed
            return r.status === 'running' ? { ...r, status: 'idle' as const } : r;
          }
          // Reset any other queued rows back to idle
          return r.status === 'queued' ? { ...r, status: 'idle' as const } : r;
        }));
        
        // Save the remaining queue including the current row that was interrupted
        const remaining = queue.slice(i);
        setSequentialRemaining(remaining);
        setIsSequentialRunning(false);
        setBulkStatus(prev => ({ ...prev, isRunning: false }));
        return;
      }
      setRows(prev => prev.map(r => (r.id === id ? { ...r, status: 'running' } : r)));
      try {
        await executeRow(id);
        setBulkStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
      } catch (err: any) {
        // Check if this was due to stopping
        if (stopSequentialRef.current || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          // Reset the current row back to idle since it was interrupted
          setRows(prev => prev.map(r => {
            if (r.id === id) {
              return { ...r, status: 'idle' as const };
            }
            // Reset any other queued rows back to idle
            return r.status === 'queued' ? { ...r, status: 'idle' as const } : r;
          }));
          
          // Save remaining including current interrupted row
          const remaining = queue.slice(i);
          setSequentialRemaining(remaining);
          setIsSequentialRunning(false);
          setBulkStatus(prev => ({ ...prev, isRunning: false }));
          return; // Exit the loop
        } else {
          // It's a real error, not a stop
          setBulkStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      }
      // Update remaining list after each completion
      setSequentialRemaining(queue.slice(i + 1));
    }

    setBulkStatus(prev => ({ ...prev, isRunning: false }));
    setIsSequentialRunning(false);
    setSequentialRemaining([]);
  };

  /**
   * buildWorkflowDetailsFromResult
   * Why this matters: Transforms backend `workflow_data` into the UI-friendly shape the popup expects.
   */
  const buildWorkflowDetailsFromResult = (result: any): CompetitorRow['workflowDetails'] => {
    if (!result?.workflow_data) return undefined;
    const { workflow_data, generation_metadata } = result;
    const details: CompetitorRow['workflowDetails'] = { currentStage: 'completed' };

    if (workflow_data.firecrawl_analysis) {
      const fire = workflow_data.firecrawl_analysis;
      details.firecrawl = {
        urls_analyzed: fire.top_results?.map((r: any) => r.url) || (fire.url ? [fire.url] : []),
        competitor_titles: fire.top_results?.map((r: any) => r.title) || (fire.title ? [fire.title] : []),
        key_topics: fire.top_results?.flatMap((r: any) => r.key_topics || []) || [],
        content_structure_insights: fire.top_results?.map((r: any) => `${r.content_structure?.numbered_lists || 0} lists, ${r.content_structure?.bullet_points || 0} bullets, ${r.word_count || 0} words`) || [],
        search_metadata: fire.metadata || {}
      };
    }

    if (workflow_data.deep_research) {
      const dr = workflow_data.deep_research;
      details.deepResearch = {
        key_insights: dr.research_findings?.key_insights || [],
        market_trends: dr.research_findings?.market_trends || [],
        audience_needs: dr.research_findings?.audience_needs || [],
        content_gaps: dr.research_findings?.content_gaps || [],
        research_confidence: dr.research_depth?.confidence_score || 0,
        sources_analyzed: dr.research_depth?.sources_analyzed || 0,
        model_used: dr.research_metadata?.model_used || 'Unknown'
      };
    }

    if (workflow_data.gap_analysis) {
      const ga = workflow_data.gap_analysis;
      details.gapAnalysis = {
        identified_gaps: ga.analysis_summary?.identified_gaps || [],
        competitive_coverage: ga.analysis_summary?.competitive_coverage || '',
        recommended_angle: ga.analysis_summary?.recommended_content_angle || '',
        gap_scores: ga.gap_score || {},
        seo_suggestions: ga.content_strategy?.seo_optimization_suggestions || []
      };
    }

    if (generation_metadata) {
      details.contentGeneration = {
        processing_steps: generation_metadata.processing_steps || [],
        brand_variables_processed: 0,
        citations_count: 0,
        quality_score: generation_metadata.content_quality_score || 0,
        model_pipeline: generation_metadata.model_pipeline || []
      };
    }
    return details;
  };

  /**
   * executeRow
   * Why this matters: Runs the 4-step pipeline for a single keyword+URL row and stores results,
   * now using the same API structure as BlogCreatorPage with proper brand kit support.
   */
  const executeRow = async (rowId: string) => {
    setRows(prev => prev.map(r => (r.id === rowId ? { ...r, status: 'running' } : r)));
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    
    try {
      // Create a new AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      // Load brand kit like BlogCreatorPage does
      let brandKit = null;
      try {
        const savedBrandKit = localStorage.getItem('apollo_brand_kit');
        if (savedBrandKit) {
          brandKit = JSON.parse(savedBrandKit);
        }
      } catch (e) {
        console.warn('Failed to load brand kit:', e);
      }

      const backendUrl = process.env.NODE_ENV === 'production'
        ? 'https://apollo-reddit-scraper-backend.vercel.app'
        : 'http://localhost:3003';
        
      const resp = await axios.post(`${backendUrl}/api/competitor-conquesting/generate-content`, {
        keyword: row.keyword,
        url: row.url,
        brand_kit: brandKit,
        target_audience: '',
        content_length: 'medium',
        focus_areas: []
      }, {
        signal: controller.signal
      });
      
      const data = resp.data?.data || resp.data;
      const workflowDetails = buildWorkflowDetailsFromResult(data) || row.workflowDetails || {};
      
      // Update with metadata structure matching BlogCreatorPage
      const metadata = data?.metadata || {};
      const updatedRow = {
        ...row,
        status: 'completed' as const,
        output: String(data?.content || ''),
        workflowDetails,
        metadata: {
          title: metadata.title || `${row.keyword} - Competitor Conquesting`,
          description: metadata.description || `Outranking competitor for ${row.keyword}`,
          word_count: metadata.word_count || 0,
          seo_optimized: metadata.seo_optimized || true,
          citations_included: metadata.citations_included || false,
          brand_variables_processed: metadata.brand_variables_processed || 0,
          aeo_optimized: metadata.aeo_optimized || true
        }
      };
      
      setRows(prev => prev.map(r => (r.id === rowId ? updatedRow : r)));
    } catch (err: any) {
      // Check if the error is due to abort
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        // Request was aborted - re-throw so the sequential handler can deal with it
        console.log('Request aborted for row:', rowId);
        throw err;
      } else {
        console.error('Execute failed:', err?.message || err);
        
        // Enhanced error handling like BlogCreatorPage
        let errorMessage = 'Generation failed';
        if (err?.response?.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.';
        } else if (err?.response?.status >= 500) {
          errorMessage = 'Server error. Please try again.';
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        const errorRow = {
          ...row,
          status: 'error' as const,
          output: `Error: ${errorMessage}`,
          workflowDetails: {
            ...row.workflowDetails,
            currentStage: 'error',
            retryCount: (row.workflowDetails?.retryCount || 0) + 1,
            canResume: true
          }
        };
        
        setRows(prev => prev.map(r => (r.id === rowId ? errorRow : r)));
      }
    } finally {
      // Clear the abort controller reference
      abortControllerRef.current = null;
    }
  };

  /**
   * retryRow
   * Why this matters: Allows retrying failed generations like BlogCreatorPage does.
   */
  const retryRow = async (rowId: string) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    // Reset status and clear error message
    setRows(prev => prev.map(r => 
      r.id === rowId 
        ? { 
            ...r, 
            status: 'idle' as const,
            output: r.output?.startsWith('Error:') ? '' : (r.output || ''),
            workflowDetails: {
              ...r.workflowDetails,
              currentStage: 'pending'
            }
          }
        : r
    ));

    // Execute the row again
    await executeRow(rowId);
  };

  /**
   * openDetailsPopup / closeDetailsPopup
   * Why this matters: Shows backend workflow details with X-only close on this page.
   */
  const openDetailsPopup = (e: React.MouseEvent, rowId: string) => {
    setPopupState({ isVisible: true, rowId, position: { x: e.clientX, y: e.clientY } });
  };
  const closeDetailsPopup = () => setPopupState(prev => ({ ...prev, isVisible: false, rowId: null }));

  /**
   * openActionModal / closeActionModal / handleModalContentUpdate
   * Why this matters: Allows editing/regenerating output with tailored competitor prompts.
   */
  const openActionModal = (rowId: string) => {
    setActiveModalRowId(rowId);
    setIsActionModalOpen(true);
  };
  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setActiveModalRowId(null);
  };
  const handleModalContentUpdate = (rowId: string, newContent: string) => {
    setRows(prev => prev.map(r => (r.id === rowId ? { ...r, output: newContent } : r)));
  };

  return (
    <div style={{ padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Competitor Conquesting
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
        Run deep research on competitor keywords, perform gap analysis on their content, and generate 10x superior content
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.875rem', color: '#374151' }}>
          Competitor
          <select
            value={selectedCompetitor}
            onChange={handleCompetitorChange}
            style={{
              marginLeft: '0.5rem',
              padding: '0.5rem 0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: 'white'
            }}
          >
            <option value="" disabled>Select…</option>
            {competitors.map(c => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {isLoading && (
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Loading rows
          </span>
        )}
        {!isLoading && rows.length > 0 && (
          <span style={{ fontSize: '0.875rem', color: '#3AB981' }}>
            Loaded {rows.length.toLocaleString()} unique keywords
          </span>
        )}
        {error && (
          <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>
            {error}
          </span>
        )}

        {/* Bulk controls - Why this matters: removing marginLeft:auto left-aligns buttons next to the loaded count. */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => {
            const allSelected = selectedRows.size === rows.length && rows.length > 0;
            if ((selectionMadeBySelectAll && allSelected) || selectedRows.size > 0) {
              // Unselect All if selection came from Select All and all are still selected; otherwise unselect current selection
              clearSelection();
            } else {
              selectAll();
            }
          }} style={{ padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}>
            {(() => {
              const allSelected = selectedRows.size === rows.length && rows.length > 0;
              if (selectionMadeBySelectAll && allSelected) return 'Unselect All';
              if (selectedRows.size > 0) return `Unselect (${selectedRows.size})`;
              return 'Select All';
            })()}
          </button>
          {selectedRows.size > 0 && (
            <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer' }}>
              Delete Selected ({selectedRows.size})
            </button>
          )}
          <button onClick={() => runBulkExecutionSequential(Array.from(selectedRows))} disabled={bulkStatus.isRunning || selectedRows.size === 0} style={{ padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: bulkStatus.isRunning ? '#e5e7eb' : '#fff', cursor: bulkStatus.isRunning ? 'not-allowed' : 'pointer' }}>
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
            <button onClick={() => runBulkExecutionSequential(sequentialRemaining)} style={{ padding: '0.4rem 0.75rem', border: '1px solid #3AB981', borderRadius: '0.5rem', background: '#3AB981', color: '#fff', cursor: 'pointer' }}>
              Resume ({sequentialRemaining.length})
            </button>
          ) : null}
          <button onClick={() => runBulkExecution()} disabled={bulkStatus.isRunning || rows.length === 0} style={{ padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: bulkStatus.isRunning ? '#e5e7eb' : '#fff', cursor: bulkStatus.isRunning ? 'not-allowed' : 'pointer' }}>
            Run 5 Rows Concurrently
          </button>
          {bulkStatus.isRunning && (
            <span style={{ fontSize: '0.8rem', color: '#2563eb' }}>
              {bulkStatus.completed + bulkStatus.failed}/{bulkStatus.total} done
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden' }}>
        <div style={{ maxHeight: '65vh', overflow: 'auto' }}>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
            <colgroup>
              <col style={{ width: '32px' }} />
              <col style={{ width: '26%' }} />
              <col style={{ width: '34%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                  
                </th>
                <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>KEYWORDS</th>
                 <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>URL</th>
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
            <tbody style={{ fontSize: '0.875rem' }}>
              {paginatedRows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                    <input type="checkbox" aria-label={`select ${r.keyword}`} checked={selectedRows.has(r.id)} onChange={() => toggleRowSelection(r.id)} />
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={clippedStyle} title={r.keyword}>{r.keyword}</div>
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: '100%' }}>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                        <span style={clippedStyle} title={r.url}>{r.url}</span>
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                    {r.monthlyVolume ?? '—'}
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                    {r.avgDifficulty ?? '—'}
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => r.status === 'error' ? retryRow(r.id) : executeRow(r.id)}
                      disabled={r.status === 'running'}
                      style={{
                        padding: '0.3125rem 0.625rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        background: r.status === 'running' ? '#e5e7eb' : r.status === 'error' ? '#fef2f2' : '#ffffff',
                        color: r.status === 'error' ? '#dc2626' : '#111827',
                        cursor: r.status === 'running' ? 'not-allowed' : 'pointer',
                        fontSize: 'inherit'
                      }}
                      title={r.status === 'error' ? 'Click to retry generation' : r.status === 'completed' ? 'Re-run content generation' : 'Run content generation'}
                    >
                      {r.status === 'running' ? 'Running…' : r.status === 'error' ? 'Retry' : r.status === 'completed' ? 'Re-run' : 'Run'}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                      onClick={(e) => openDetailsPopup(e as any, r.id)}
                      disabled={!r.output || r.status === 'running'}
                      style={{
                        padding: '0.3125rem 0.625rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        background: r.output && r.status !== 'running' ? '#ffffff' : '#e5e7eb',
                        color: r.output && r.status !== 'running' ? '#111827' : '#9ca3af',
                        cursor: r.output && r.status !== 'running' ? 'pointer' : 'not-allowed',
                        fontSize: 'inherit'
                      }}
                      title={r.status === 'running' ? 'Please wait for generation to complete' : r.output ? 'Show backend workflow details' : 'No details available yet'}
                    >
                      Show
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => openActionModal(r.id)}
                      disabled={!r.output || r.status === 'running'}
                      style={{
                        padding: '0.3125rem 0.625rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        background: r.output && r.status !== 'running' ? '#EBF212' : '#e5e7eb',
                        color: r.output && r.status !== 'running' ? '#000000' : '#111827',
                        cursor: r.output && r.status !== 'running' ? 'pointer' : 'not-allowed',
                        fontSize: '0.8125rem'
                      }}
                      title={r.status === 'running' ? 'Please wait for generation to complete' : r.output ? 'View and edit generated content' : 'No content available yet'}
                    >
                      See Output
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && rows.length === 0 && !error && (
                <tr>
                  <td colSpan={8} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                    Select a competitor to preload keywords and URLs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls - Why this matters: limits rendered rows to keep UI snappy while browsing large datasets. */}
      {rows.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Page {page} of {totalPages} • Showing {paginatedRows.length} of {rows.length.toLocaleString()} rows
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
      )}

      {/* Delete Selected Confirmation Modal */}
      {showDeleteConfirm && (
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '36rem',
            width: '90%',
            boxShadow: '0 1.25rem 1.5625rem -0.3125rem rgba(0, 0, 0, 0.1), 0 0.625rem 0.625rem -0.3125rem rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: '#374151' }}>
                Delete Selected Rows?
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              This action will permanently delete {selectedRows.size} selected row{selectedRows.size > 1 ? 's' : ''}. This cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => { deleteSelectedRows(); setShowDeleteConfirm(false); }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backend Details Popup - manual dismiss for this page */}
      {popupState.isVisible && popupState.rowId && (
        <BackendDetailsPopup
          workflowDetails={rows.find(r => r.id === popupState.rowId)?.workflowDetails || {}}
          status={rows.find(r => r.id === popupState.rowId)?.status === 'running' ? 'running' : 'completed'}
          isVisible={true}
          position={popupState.position}
          onMouseEnter={() => {}}
          onMouseLeave={closeDetailsPopup}
          onMobileClose={closeDetailsPopup}
          dismissBehavior="manual"
        />
      )}

      {/* Competitor Content Action Modal */}
      {isActionModalOpen && activeModalRowId && (
        <CompetitorContentActionModal
          isOpen={true}
          onClose={closeActionModal}
          row={rows.find(r => r.id === activeModalRowId)!}
          brandKit={null}
          onContentUpdate={handleModalContentUpdate}
        />
      )}

      {/* Local styles for sticky header (explicit) */}
      <style>
        {`
          .sticky-header { position: sticky; top: 0; }
          @media (max-width: 1024px) {
            .keyword-cell, .url-cell { max-width: 240px; }
          }
        `}
      </style>
    </div>
  );
};

export default CompetitorConquestingPage;


