import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ExternalLink, Copy, Check, Eye, EyeOff } from 'lucide-react';

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

const SitemapDetailPage: React.FC = () => {
  const { sitemapId } = useParams<{ sitemapId: string }>();
  const navigate = useNavigate();
  const [sitemap, setSitemap] = useState<SitemapData | null>(null);
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  /**
   * Load sitemap data from localStorage
   * Why this matters: Retrieves the specific sitemap data for detailed view
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('apollo_sitemap_data');
      if (stored) {
        const sitemaps: SitemapData[] = JSON.parse(stored);
        const foundSitemap = sitemaps.find(s => s.id === sitemapId);
        if (foundSitemap) {
          setSitemap(foundSitemap);
        } else {
          console.error('Sitemap not found:', sitemapId);
          navigate('/knowledge-base/sitemap');
        }
      }
    } catch (error) {
      console.error('Failed to load sitemap data:', error);
      navigate('/knowledge-base/sitemap');
    }
  }, [sitemapId, navigate]);

  /**
   * Toggle expanded view for a URL
   * Why this matters: Shows/hides JSON details for individual URLs
   */
  const toggleUrlExpansion = (urlId: string) => {
    setExpandedUrls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(urlId)) {
        newSet.delete(urlId);
      } else {
        newSet.add(urlId);
      }
      return newSet;
    });
  };

  /**
   * Copy URL to clipboard
   * Why this matters: Easy access to URL for external use
   */
  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  /**
   * Delete individual URL from sitemap
   * Why this matters: Allows users to remove specific URLs from their knowledge base
   */
  const deleteUrl = (urlId: string) => {
    if (!sitemap) return;

    try {
      const stored = localStorage.getItem('apollo_sitemap_data');
      if (stored) {
        const sitemaps: SitemapData[] = JSON.parse(stored);
        const updatedSitemaps = sitemaps.map(s => 
          s.id === sitemap.id 
            ? {
                ...s,
                urls: s.urls.filter(url => url.id !== urlId),
                totalUrls: s.urls.filter(url => url.id !== urlId).length
              }
            : s
        );
        
        localStorage.setItem('apollo_sitemap_data', JSON.stringify(updatedSitemaps));
        
        // Update local state
        setSitemap(prev => prev ? {
          ...prev,
          urls: prev.urls.filter(url => url.id !== urlId),
          totalUrls: prev.urls.filter(url => url.id !== urlId).length
        } : null);
        
        setShowDeleteModal(false);
        setUrlToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete URL:', error);
    }
  };

  /**
   * Generate JSON representation for URL
   * Why this matters: Shows the exact format used for internal linking context
   */
  const generateUrlJson = (url: SitemapUrl) => {
    return {
      title: url.title,
      description: url.description,
      url: url.url
    };
  };

  if (!sitemap) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>Loading sitemap details...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/knowledge-base/sitemap')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#374151',
            marginBottom: '1rem'
          }}
        >
          <ArrowLeft size={16} />
          Back to Sitemaps
        </button>

        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Sitemap Details
        </h1>
        
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            <strong>Sitemap URL:</strong> {sitemap.sitemapUrl}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
            <strong>Total URLs:</strong> {sitemap.totalUrls} • <strong>Scraped:</strong> {new Date(sitemap.scrapedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* URLs List */}
      <div style={{
        backgroundColor: '#ffffff',
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
          All URLs ({sitemap.urls.length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sitemap.urls.map((url) => (
            <div
              key={url.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem',
                backgroundColor: '#fafafa'
              }}
            >
              {/* URL Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '500', 
                    color: '#111827',
                    margin: '0 0 0.25rem 0',
                    lineHeight: '1.4'
                  }}>
                    {url.title}
                  </h3>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    margin: '0 0 0.5rem 0',
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
                  <button
                    onClick={() => copyUrl(url.url)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: copiedUrl === url.url ? '#10b981' : '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Copy URL"
                  >
                    {copiedUrl === url.url ? <Check size={14} /> : <Copy size={14} />}
                  </button>

                  <button
                    onClick={() => window.open(url.url, '_blank')}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Open URL"
                  >
                    <ExternalLink size={14} />
                  </button>

                  <button
                    onClick={() => toggleUrlExpansion(url.id)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={expandedUrls.has(url.id) ? 'Hide JSON' : 'Show JSON'}
                  >
                    {expandedUrls.has(url.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  <button
                    onClick={() => {
                      setUrlToDelete(url.id);
                      setShowDeleteModal(true);
                    }}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete URL"
                  >
                    <Trash2 size={14} style={{ color: '#dc2626' }} />
                  </button>
                </div>
              </div>

              {/* Expanded JSON View */}
              {expandedUrls.has(url.id) && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  padding: '0.75rem',
                  marginTop: '0.75rem'
                }}>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    margin: '0 0 0.5rem 0'
                  }}>
                    JSON Format (used for internal linking):
                  </p>
                  <pre style={{
                    fontSize: '0.75rem',
                    color: '#1f2937',
                    backgroundColor: '#ffffff',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    border: '1px solid #e5e7eb',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {JSON.stringify(generateUrlJson(url), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {sitemap.urls.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <p>No URLs found in this sitemap.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Delete URL
            </h3>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              Are you sure you want to delete this URL from your knowledge base? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUrlToDelete(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => urlToDelete && deleteUrl(urlToDelete)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SitemapDetailPage;
