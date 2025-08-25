import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, ExternalLink, Globe, AlertTriangle, X, FileText, Check, Loader2, Pause, Play } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { makeApiRequest } from '../utils/apiHelpers';

interface SitemapUrl {
  id: string;
  title: string;
  description: string;
  url: string;
  scrapedAt: Date;
  contentPreview?: string;
}

interface SitemapData {
  id: string;
  sitemapUrl: string;
  urls: SitemapUrl[];
  totalUrls: number;
  scrapedAt: Date;
  sessionId?: string;
  pendingUrls?: string[];
  status?: 'parsing' | 'scraping' | 'paused' | 'completed' | 'failed';
  progress?: number;
}

const SitemapPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [sitemaps, setSitemaps] = useState<SitemapData[]>([]);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeScrapingId, setActiveScrapingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Modal states
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteSitemapModal, setShowDeleteSitemapModal] = useState(false);
  const [showDeleteUrlModal, setShowDeleteUrlModal] = useState(false);
  const [sitemapToDelete, setSitemapToDelete] = useState<string | null>(null);
  const [urlToDelete, setUrlToDelete] = useState<{ sitemapId: string; urlId: string } | null>(null);

  /**
   * Load saved sitemaps from localStorage on mount
   * Why this matters: Restores user's sitemap data across page refreshes
   */
  useEffect(() => {
    const saved = localStorage.getItem('apollo_sitemap_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const restoredSitemaps = data.map((sitemap: any) => ({
          ...sitemap,
          scrapedAt: new Date(sitemap.scrapedAt),
          urls: sitemap.urls.map((url: any) => ({
            ...url,
            scrapedAt: new Date(url.scrapedAt)
          }))
        }));
        setSitemaps(restoredSitemaps);
      } catch (error) {
        console.error('Error loading sitemap data:', error);
      }
    }
  }, []);

  /**
   * Auto-save sitemaps to localStorage when data changes
   * Why this matters: Persists sitemap data without requiring manual saves
   */
  useEffect(() => {
    if (sitemaps.length > 0) {
      localStorage.setItem('apollo_sitemap_data', JSON.stringify(sitemaps));
    }
  }, [sitemaps]);

  /**
   * Start sitemap processing with chunked approach
   * Why this matters: Prevents timeouts by breaking work into smaller pieces
   */
  const startSitemapProcessing = async () => {
    if (!sitemapUrl.trim()) {
      setError('Please enter a sitemap URL');
      return;
    }

    if (!isValidUrl(sitemapUrl)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`🗺️ Starting sitemap parse for: ${sitemapUrl}`);

      // Step 1: Parse sitemap to get all URLs
      const parseResult = await makeApiRequest(API_ENDPOINTS.sitemapParse, {
        method: 'POST',
        body: JSON.stringify({
          sitemapUrl: sitemapUrl.trim()
        }),
      });

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse sitemap');
      }

      // The response is wrapped by makeApiRequest, so parseResult.data contains our actual response
      const response = parseResult.data;
      
      // Check if response has the expected structure
      if (!response || !response.success || !response.data) {
        throw new Error('Invalid response structure from server');
      }
      
      const { urls, totalUrls, sessionId } = response.data;
      
      if (!urls || !Array.isArray(urls)) {
        throw new Error('Invalid response: URLs not found in response');
      }
      
      console.log(`📋 Found ${totalUrls} URLs in sitemap`);

      // Create new sitemap entry
      const newSitemap: SitemapData = {
        id: `sitemap-${Date.now()}`,
        sitemapUrl,
        urls: [],
        totalUrls,
        scrapedAt: new Date(),
        sessionId,
        pendingUrls: urls,
        status: 'scraping',
        progress: 0
      };

      setSitemaps(prev => [newSitemap, ...prev]);
      setSitemapUrl('');
      setIsLoading(false);
      
      // IMPORTANT: Set activeScrapingId and wait for state update before starting scraping
      setActiveScrapingId(newSitemap.id);
      
      // Use setTimeout to ensure state is updated before starting progressive scraping
      setTimeout(() => {
        console.log('Starting delayed progressive scraping with activeScrapingId:', newSitemap.id);
        scrapeSitemapProgressively(newSitemap.id, urls, sessionId, true);
      }, 100);

    } catch (error) {
      console.error('❌ Sitemap processing failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to process sitemap');
      setIsLoading(false);
    }
  };

  /**
   * Progressively scrape URLs in chunks
   * Why this matters: Processes URLs in small batches to avoid timeouts
   */
  const scrapeSitemapProgressively = async (
    sitemapId: string, 
    urls: string[], 
    sessionId: string,
    isActive: boolean = true  // Pass this explicitly to avoid state sync issues
  ) => {
    console.log(`🚀 Starting progressive scraping for ${urls.length} URLs`);
    const CHUNK_SIZE = 10; // Process 10 URLs at a time
    let processedCount = 0;
    let allScrapedUrls: SitemapUrl[] = [];

    for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
      // Check if paused or cancelled - use the passed isActive flag for initial check
      const currentActiveId = activeScrapingId || (isActive ? sitemapId : null);
      if (isPaused || (currentActiveId !== sitemapId && i > 0)) {
        console.log(`⏸️ Scraping ${isPaused ? 'paused' : 'cancelled'} - activeId: ${currentActiveId}, sitemapId: ${sitemapId}`);
        setSitemaps(prev => prev.map(s => 
          s.id === sitemapId 
            ? { ...s, status: isPaused ? 'paused' : 'completed' }
            : s
        ));
        break;
      }

      const chunk = urls.slice(i, Math.min(i + CHUNK_SIZE, urls.length));
      
      try {
        console.log(`🔍 Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(urls.length / CHUNK_SIZE)} with ${chunk.length} URLs`);
        
        const chunkResult = await makeApiRequest(API_ENDPOINTS.sitemapScrapeChunk, {
          method: 'POST',
          body: JSON.stringify({
            urls: chunk,
            sessionId
          }),
        });

        console.log('Chunk result:', chunkResult);

        if (chunkResult.success && chunkResult.data) {
          // Handle the wrapped response structure
          const chunkResponse = chunkResult.data;
          if (!chunkResponse.success || !chunkResponse.data) {
            console.warn('Invalid chunk response structure:', chunkResponse);
            continue;
          }
          
          const scrapedUrls = chunkResponse.data.urls.map((url: any) => ({
            ...url,
            scrapedAt: new Date(url.scrapedAt)
          }));
          
          allScrapedUrls = [...allScrapedUrls, ...scrapedUrls];
          processedCount += chunkResponse.data.processed;
          console.log(`✅ Processed ${processedCount}/${urls.length} URLs so far`);
          
          // Update sitemap with progress
          setSitemaps(prev => prev.map(sitemap => 
            sitemap.id === sitemapId
              ? {
                  ...sitemap,
                  urls: allScrapedUrls,
                  progress: (processedCount / urls.length) * 100,
                  pendingUrls: urls.slice(processedCount)
                }
              : sitemap
          ));
        }

      } catch (error) {
        console.error(`❌ Chunk processing failed:`, error);
        // Add error details to help debug
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        // Continue with next chunk even if this one fails
      }

      // Small delay between chunks to avoid overwhelming the server
      if (i + CHUNK_SIZE < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Mark as completed
    setSitemaps(prev => prev.map(sitemap => 
      sitemap.id === sitemapId
        ? {
            ...sitemap,
            status: 'completed',
            progress: 100,
            pendingUrls: []
          }
        : sitemap
    ));

    setActiveScrapingId(null);
    setSuccess(`Successfully scraped ${processedCount} URLs from sitemap`);
    setTimeout(() => setSuccess(null), 5000);
  };

  /**
   * Pause/Resume scraping
   * Why this matters: Allows users to control the scraping process
   */
  const togglePause = () => {
    setIsPaused(!isPaused);
    
    if (!isPaused) {
      // Pausing
      setSitemaps(prev => prev.map(s => 
        s.id === activeScrapingId 
          ? { ...s, status: 'paused' }
          : s
      ));
    } else {
      // Resuming
      const sitemap = sitemaps.find(s => s.id === activeScrapingId);
      if (sitemap && sitemap.pendingUrls && sitemap.sessionId) {
        setSitemaps(prev => prev.map(s => 
          s.id === activeScrapingId 
            ? { ...s, status: 'scraping' }
            : s
        ));
        scrapeSitemapProgressively(
          sitemap.id, 
          sitemap.pendingUrls, 
          sitemap.sessionId,
          true
        );
      }
    }
  };

  /**
   * Cancel active scraping
   * Why this matters: Allows users to stop a long-running process
   */
  const cancelScraping = () => {
    setActiveScrapingId(null);
    setIsPaused(false);
  };

  /**
   * Validate URL format
   * Why this matters: Ensures valid URLs before making API requests
   */
  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  /**
   * Delete all sitemaps after confirmation
   * Why this matters: Allows users to clear all knowledge base data
   */
  const confirmDeleteAll = () => {
    setSitemaps([]);
    localStorage.removeItem('apollo_sitemap_data');
    setShowDeleteAllModal(false);
    setSuccess('All sitemap data cleared');
    setTimeout(() => setSuccess(null), 3000);
  };

  /**
   * Delete individual sitemap after confirmation
   * Why this matters: Allows users to remove specific sitemaps
   */
  const confirmDeleteSitemap = () => {
    if (sitemapToDelete) {
      setSitemaps(prev => prev.filter(s => s.id !== sitemapToDelete));
      setSitemapToDelete(null);
      setShowDeleteSitemapModal(false);
    }
  };

  /**
   * Delete individual URL after confirmation
   * Why this matters: Allows users to remove specific URLs from sitemaps
   */
  const confirmDeleteUrl = () => {
    if (urlToDelete) {
      setSitemaps(prev => prev.map(sitemap => 
        sitemap.id === urlToDelete.sitemapId
          ? {
              ...sitemap,
              urls: sitemap.urls.filter(url => url.id !== urlToDelete.urlId),
              totalUrls: sitemap.urls.filter(url => url.id !== urlToDelete.urlId).length
            }
          : sitemap
      ));
      setUrlToDelete(null);
      setShowDeleteUrlModal(false);
    }
  };

  /**
   * Navigate to details page for a sitemap
   * Why this matters: Provides access to full URL listing and management
   */
  const viewSitemapDetails = (sitemapId: string) => {
    navigate(`/knowledge-base/sitemap/details/${sitemapId}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '2rem' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              Sitemap Knowledge Base (Enhanced)
            </h1>
            <p style={{ 
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>
              Scrape large sitemaps progressively without timeouts. URLs will be used for intelligent internal linking during content generation.
            </p>
          </div>
          
          {sitemaps.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Trash2 size={16} />
              Delete Knowledge Base
            </button>
          )}
        </div>

        {/* Sitemap URL Input */}
        <div style={{ 
          backgroundColor: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Sitemap URL
          </h2>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ maxWidth: '600px', width: '100%' }}>
              <input
                type="url"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                placeholder="e.g: www.example.com/sitemap.xml"
                disabled={isLoading || activeScrapingId !== null}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  backgroundColor: isLoading || activeScrapingId !== null ? '#f3f4f6' : '#ffffff'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading && !activeScrapingId) {
                    startSitemapProcessing();
                  }
                }}
              />
            </div>
            
            {activeScrapingId ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={togglePause}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={cancelScraping}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={startSitemapProcessing}
                disabled={isLoading || !sitemapUrl.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isLoading || !sitemapUrl.trim() ? '#9ca3af' : '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: isLoading || !sitemapUrl.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minWidth: '140px',
                  justifyContent: 'center'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Start Scraping
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            color: '#dc2626',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '0.5rem',
            color: '#1e40af',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Check size={16} />
            {success}
          </div>
        )}
      </div>

      {/* Sitemaps List */}
      {sitemaps.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280',
          fontSize: '1rem'
        }}>
          <Globe size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
          <p style={{ margin: '0 0 0.5rem' }}>No sitemaps in the knowledge base yet.</p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Scrape a sitemap to start building the internal linking knowledge base.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sitemaps.map((sitemap) => (
            <div
              key={sitemap.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Sitemap Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: '#111827',
                    marginBottom: '0.25rem'
                  }}>
                    {(() => {
                      try {
                        return new URL(sitemap.sitemapUrl).hostname;
                      } catch {
                        return sitemap.sitemapUrl;
                      }
                    })()}
                  </h3>
                  <p style={{ 
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0 0 0.5rem'
                  }}>
                    {sitemap.sitemapUrl}
                  </p>
                  <p style={{ 
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    margin: 0
                  }}>
                    Scraped {sitemap.scrapedAt.toLocaleDateString()} • {sitemap.urls.length}/{sitemap.totalUrls} URLs processed
                    {sitemap.status && sitemap.status !== 'completed' && ` • Status: ${sitemap.status}`}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setSitemapToDelete(sitemap.id);
                    setShowDeleteSitemapModal(true);
                  }}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Delete sitemap"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Progress Bar */}
              {sitemap.status === 'scraping' && sitemap.progress !== undefined && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Processing URLs...
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {sitemap.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${sitemap.progress}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      transition: 'width 0.3s ease',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              )}

              {/* URL Preview */}
              {sitemap.urls.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    marginBottom: '0.75rem'
                  }}>
                    URLs Preview (showing first 5)
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sitemap.urls.slice(0, 5).map((url) => (
                      <div
                        key={url.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: '0.75rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '0.5rem',
                          border: '1px solid #f3f4f6'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#111827',
                            margin: '0 0 0.25rem',
                            wordBreak: 'break-word'
                          }}>
                            {url.title}
                          </p>
                          <p style={{ 
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            margin: '0 0 0.25rem',
                            lineHeight: '1.4'
                          }}>
                            {url.description}
                          </p>
                          <a 
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.75rem',
                              color: '#3b82f6',
                              textDecoration: 'none',
                              wordBreak: 'break-all'
                            }}
                          >
                            {url.url}
                          </a>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                          <a
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '0.25rem',
                              backgroundColor: 'transparent',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              color: '#6b7280',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Open URL"
                          >
                            <ExternalLink size={12} />
                          </a>
                          <button
                            onClick={() => {
                              setUrlToDelete({ sitemapId: sitemap.id, urlId: url.id });
                              setShowDeleteUrlModal(true);
                            }}
                            style={{
                              padding: '0.25rem',
                              backgroundColor: 'transparent',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Delete URL"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* See All Button */}
              {sitemap.urls.length > 5 && (
                <button
                  onClick={() => viewSitemapDetails(sitemap.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FileText size={16} />
                  See All ({sitemap.urls.length})
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
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
          onClick={() => setShowDeleteAllModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                Delete Knowledge Base?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                This action will permanently delete all {sitemaps.length} sitemap{sitemaps.length > 1 ? 's' : ''} and {sitemaps.reduce((sum, s) => sum + s.totalUrls, 0)} URLs from your knowledge base. This cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAll}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Delete Knowledge Base
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sitemap Confirmation Modal */}
      {showDeleteSitemapModal && sitemapToDelete && (
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
          onClick={() => setShowDeleteSitemapModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                Delete Sitemap?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                This action will permanently delete this sitemap and all its URLs from your knowledge base. This cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteSitemapModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSitemap}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Delete Sitemap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete URL Confirmation Modal */}
      {showDeleteUrlModal && urlToDelete && (
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
          onClick={() => setShowDeleteUrlModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                Delete URL?
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                This action will permanently remove this URL from your knowledge base. This cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteUrlModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUrl}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Delete URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add spinner animation */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default SitemapPageEnhanced;
