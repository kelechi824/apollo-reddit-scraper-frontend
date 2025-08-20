import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, ExternalLink, Globe, AlertTriangle, X, FileText, Check, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

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
}

const SitemapPage: React.FC = () => {
  const navigate = useNavigate();
  const [sitemaps, setSitemaps] = useState<SitemapData[]>([]);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
        // Convert date strings back to Date objects
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
   * Scrape sitemap and extract URL data
   * Why this matters: Core functionality to build knowledge base from sitemaps
   */
  const scrapeSitemap = async () => {
    if (!sitemapUrl.trim()) {
      setError('Please enter a sitemap URL');
      return;
    }

    // Basic URL validation
    if (!isValidUrl(sitemapUrl)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`🗺️ Starting sitemap scrape for: ${sitemapUrl}`);

      const response = await fetch(API_ENDPOINTS.sitemapScrape, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sitemapUrl: sitemapUrl.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to scrape sitemap');
      }

      // Create new sitemap data
      const newSitemap: SitemapData = {
        id: `sitemap-${Date.now()}`,
        sitemapUrl: result.data.sitemapUrl,
        urls: result.data.urls.map((url: any) => ({
          ...url,
          scrapedAt: new Date(url.scrapedAt)
        })),
        totalUrls: result.data.totalUrls,
        scrapedAt: new Date(result.data.scrapedAt)
      };

      // Add to sitemaps list
      setSitemaps(prev => [newSitemap, ...prev]);
      setSitemapUrl('');
      setSuccess(`Successfully scraped ${newSitemap.totalUrls} URLs from sitemap`);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (error) {
      console.error('❌ Sitemap scrape failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to scrape sitemap');
    } finally {
      setIsLoading(false);
    }
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
   * Show delete all confirmation modal
   * Why this matters: Provides safety check before clearing all sitemap data
   */
  const showDeleteAllConfirmation = () => {
    setShowDeleteAllModal(true);
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
   * Show delete sitemap confirmation modal
   * Why this matters: Provides safety check before deleting individual sitemaps
   */
  const showDeleteSitemapConfirmation = (sitemapId: string) => {
    setSitemapToDelete(sitemapId);
    setShowDeleteSitemapModal(true);
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
   * Show delete URL confirmation modal
   * Why this matters: Provides safety check before deleting individual URLs
   */
  const showDeleteUrlConfirmation = (sitemapId: string, urlId: string) => {
    setUrlToDelete({ sitemapId, urlId });
    setShowDeleteUrlModal(true);
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
              Sitemap Knowledge Base
            </h1>
            <p style={{ 
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: 0
            }}>
              Scrape sitemaps to build an Apollo internal linking knowledge base. URLs will be used for intelligent internal linking during content generation.
            </p>
          </div>
          
          {sitemaps.length > 0 && (
            <button
              onClick={showDeleteAllConfirmation}
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
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  backgroundColor: isLoading ? '#f3f4f6' : '#ffffff'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    scrapeSitemap();
                  }
                }}
              />
            </div>
            
            <button
              onClick={scrapeSitemap}
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
                  Scraping...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Scrape Sitemap
                </>
              )}
            </button>
          </div>
          
          {/* Loading Information Message */}
          {isLoading && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>ℹ️</span>
              <span>This might take 1-2 minutes. Do not exit this page.</span>
            </div>
          )}
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
                    {new URL(sitemap.sitemapUrl).hostname}
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
                    Scraped {sitemap.scrapedAt.toLocaleDateString()} • {sitemap.totalUrls} URLs
                  </p>
                </div>
                
                <button
                  onClick={() => showDeleteSitemapConfirmation(sitemap.id)}
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

              {/* URL Preview */}
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
                          onClick={() => showDeleteUrlConfirmation(sitemap.id, url.id)}
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

export default SitemapPage;
