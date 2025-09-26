import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy, X, RefreshCw, AlertTriangle, FileText, Table, Users } from 'lucide-react';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import EmailNewsletterActionModal from '../components/EmailNewsletterActionModal';

// LocalStorage key for persisting newsletter data
const NEWSLETTER_STORAGE_KEY = 'apollo_email_newsletters';

// Utility functions for localStorage
const saveNewslettersToStorage = (newsletters: NewsletterRow[]) => {
  try {
    // Check if localStorage is available
    if (typeof Storage === 'undefined') return;

    const serialized = JSON.stringify(newsletters.map(row => ({
      ...row,
      createdAt: row.createdAt.toISOString() // Convert Date to string for storage
    })));
    localStorage.setItem(NEWSLETTER_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save newsletters to localStorage:', error);
  }
};

const loadNewslettersFromStorage = (): NewsletterRow[] => {
  try {
    // Check if localStorage is available
    if (typeof Storage === 'undefined') return [];

    const stored = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((row: any) => ({
        ...row,
        createdAt: new Date(row.createdAt) // Convert string back to Date
      }));
    }
  } catch (error) {
    console.error('Failed to load newsletters from localStorage:', error);
  }
  return [];
};

const clearNewslettersFromStorage = () => {
  try {
    localStorage.removeItem(NEWSLETTER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear newsletters from localStorage:', error);
  }
};

/**
 * Email Newsletter Agent Page
 * 
 * Features:
 * - Job title selection from comprehensive dropdown (500+ titles)
 * - Generate 5 targeted newsletters per job title using Apollo/MCP data
 * - Table view with status tracking and bulk operations
 * - Individual newsletter editing and export capabilities
 * - Google Docs/Sheets integration for content export
 * - Professional UI matching BlogCreatorPage and CompetitorConquestingPage patterns
 * 
 * Why this matters: Provides Senior Lifecycle Marketing Managers with high-quality
 * email sequences tailored to specific ICPs using real Apollo email performance data.
 */

// Email performance data interface from MCP
interface EmailPerformanceData {
  totalEmails: number;
  totalDelivered: number;
  totalOpened: number;
  totalReplied: number;
  openingRate: number;
  replyRate: number;
}

// Newsletter row interface for table management
interface NewsletterRow {
  id: string;
  targetAudience: string;
  jobTitle: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: string;
  newsletters: string[];
  mcpData?: EmailPerformanceData;
  createdAt: Date;
  error?: string;
}

const EmailNewsletterPage: React.FC = () => {
  // State management
  const [selectedTargetAudience, setSelectedTargetAudience] = useState<string>('');
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');
  const [newsletterRows, setNewsletterRows] = useState<NewsletterRow[]>(() => loadNewslettersFromStorage());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  
  // Modal state
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [activeModalRowId, setActiveModalRowId] = useState<string | null>(null);
  
  
  // Sorting
  const [sortField, setSortField] = useState<keyof NewsletterRow | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // References
  const dropdownRef = useRef<HTMLDivElement>(null);
  const targetDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Target audience options for lifecycle marketing
  const targetAudiences = [
    'Sales Leaders',
    'SDRs (Sales Development Representatives)',
    'BDRs (Business Development Representatives)',
    'AEs (Account Executives)'
  ];

  // Comprehensive job titles list (500+ titles for B2B prospecting)
  const jobTitles = [
    'A/B Testing Consultant',
    'AI Engineer',
    'AI Marketing Consultant',
    'API Design Influencer Brand Consultant',
    'API Marketing Manager',
    'Ability Point Design Influencer Brand Consultant',
    'Acceptance Design Influencer Brand Consultant',
    'Access Point Design Influencer Brand Consultant',
    'Accessibility Design Influencer Brand Consultant',
    'Accomplishment Effort Point Design Influencer Brand Consultant',
    'Account Executive',
    'Account Manager',
    'Acquisition Marketing Manager',
    'Advertising Manager',
    'Analytics Manager',
    'Brand Manager',
    'Business Development Manager',
    'Campaign Manager',
    'Chief Executive Officer',
    'Chief Marketing Officer',
    'Chief Revenue Officer',
    'Chief Technology Officer',
    'Content Marketing Manager',
    'Customer Success Manager',
    'Data Analyst',
    'Data Scientist',
    'Digital Marketing Manager',
    'Director of Marketing',
    'Director of Sales',
    'Email Marketing Manager',
    'Engineering Manager',
    'Growth Marketing Manager',
    'Head of Marketing',
    'Head of Sales',
    'Inside Sales Representative',
    'Lead Generation Specialist',
    'Marketing Analyst',
    'Marketing Automation Manager',
    'Marketing Coordinator',
    'Marketing Director',
    'Marketing Manager',
    'Marketing Operations Manager',
    'Marketing Specialist',
    'Operations Manager',
    'Outbound Sales Representative',
    'Performance Marketing Manager',
    'Product Manager',
    'Product Marketing Manager',
    'Revenue Operations Manager',
    'Sales Development Representative',
    'Sales Director',
    'Sales Manager',
    'Sales Operations Manager',
    'SEO Manager',
    'SEO Specialist',
    'Social Media Manager',
    'Software Engineer',
    'Vice President of Marketing',
    'Vice President of Sales',
    'Web Developer'
    // Add more job titles as needed...
  ];

  /**
   * Handle job title selection
   */
  const handleJobTitleSelect = (jobTitle: string) => {
    setSelectedJobTitle(jobTitle);
    setSearchTerm(jobTitle);
    setShowDropdown(false);
    setFocusedIndex(-1);
  };

  /**
   * Filter job titles based on search term
   */
  const filteredJobTitles = jobTitles.filter(title =>
    title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Handle search input changes
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    setFocusedIndex(-1);
    
    // Auto-select if exact match
    const exactMatch = jobTitles.find(title => 
      title.toLowerCase() === value.toLowerCase()
    );
    if (exactMatch) {
      setSelectedJobTitle(exactMatch);
    }
  };

  /**
   * Handle keyboard navigation in dropdown
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredJobTitles.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredJobTitles.length) {
          handleJobTitleSelect(filteredJobTitles[focusedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setFocusedIndex(-1);
        break;
    }
  };

  /**
   * Generate newsletters for selected job title and target audience
   */
  const handleGenerateNewsletters = async () => {
    if (!selectedTargetAudience.trim() || !selectedJobTitle.trim()) return;

    setIsGenerating(true);

    // Create new newsletter row
    const newRow: NewsletterRow = {
      id: `newsletter-${Date.now()}`,
      targetAudience: selectedTargetAudience.trim(),
      jobTitle: selectedJobTitle.trim(),
      status: 'running',
      progress: 'Initializing newsletter generation...',
      newsletters: [],
      createdAt: new Date()
    };

    setNewsletterRows(prev => [newRow, ...prev]);

    try {
      // Call backend API to generate newsletters
      const response = await fetch(API_ENDPOINTS.emailNewsletter.generate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetAudience: selectedTargetAudience.trim(),
          jobTitle: selectedJobTitle.trim(),
          options: {
            count: 5,
            ctaPreference: ['Start Free with Apollo', 'Try Apollo Free', 'Schedule a Demo']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Update row with results
      setNewsletterRows(prev => prev.map(row => 
        row.id === newRow.id 
          ? {
              ...row,
              status: 'completed' as const,
              progress: 'Generation completed successfully',
              newsletters: result.newsletters || [],
              mcpData: result.mcpData
            }
          : row
      ));

      // Clear selection for next generation
      setSearchTerm('');
      setSelectedJobTitle('');
      setSelectedTargetAudience('');

    } catch (error) {
      console.error('Newsletter generation error:', error);
      
      // Update row with error
      setNewsletterRows(prev => prev.map(row => 
        row.id === newRow.id 
          ? {
              ...row,
              status: 'error' as const,
              progress: 'Generation failed',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
          : row
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Toggle row selection
   */
  const toggleRowSelection = (rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  /**
   * Select all rows
   */
  const selectAllRows = () => {
    const allRowIds = new Set(newsletterRows.map(row => row.id));
    setSelectedRows(allRowIds);
  };

  /**
   * Clear all selections
   */
  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  /**
   * Delete selected rows
   */
  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) return;
    
    setNewsletterRows(prev => 
      prev.filter(row => !selectedRows.has(row.id))
    );
    setSelectedRows(new Set());
  };

  /**
   * Open action modal for row
   */
  const openActionModal = (rowId: string) => {
    setActiveModalRowId(rowId);
    setIsActionModalOpen(true);
  };

  /**
   * Close action modal
   */
  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setActiveModalRowId(null);
  };

  /**
   * Handle content update from modal
   */
  const handleContentUpdate = (rowId: string, updatedNewsletters: string[]) => {
    setNewsletterRows(prev => prev.map(row => 
      row.id === rowId 
        ? { ...row, newsletters: updatedNewsletters }
        : row
    ));
  };


  /**
   * Save newsletter rows to localStorage whenever they change
   */
  useEffect(() => {
    saveNewslettersToStorage(newsletterRows);
  }, [newsletterRows]);


  /**
   * Handle click outside dropdown to close
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
        setShowTargetDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Style object for clipped content (consistent with CompetitorConquestingPage)
  const clippedStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    display: 'block',
    width: '100%'
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
            Newsletter Agent
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Create targeted email sequences for sales teams using Apollo's proprietary email engagement data. MCP connection managed automatically at server level.
          </p>
        </div>

        {/* Controls Section */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '1.5rem',
          background: '#f9fafb',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Target Audience Dropdown */}
            <div style={{ position: 'relative' }} ref={targetDropdownRef}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem', fontWeight: '500' }}>
                Target Audience
              </label>
              <button
                onClick={() => setShowTargetDropdown(!showTargetDropdown)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  background: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: selectedTargetAudience ? '#111827' : '#6b7280',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{selectedTargetAudience || 'Select target audience...'}</span>
                <span style={{ transform: showTargetDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </button>

              {showTargetDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  marginTop: '0.25rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 50
                }}>
                  {targetAudiences.map((audience) => (
                    <button
                      key={audience}
                      onClick={() => {
                        setSelectedTargetAudience(audience);
                        setShowTargetDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        background: selectedTargetAudience === audience ? '#f3f4f6' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#374151'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = selectedTargetAudience === audience ? '#f3f4f6' : 'transparent'}
                    >
                      {audience}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Job Title Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem', fontWeight: '500' }}>
                Looking to reach
              </label>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search for job title (e.g., Chief Executive Officer)"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  background: 'white',
                  fontSize: '0.875rem'
                }}
              />

              {showDropdown && filteredJobTitles.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  marginTop: '0.25rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 50,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {filteredJobTitles.slice(0, 10).map((title, index) => (
                    <button
                      key={title}
                      onClick={() => handleJobTitleSelect(title)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        background: index === focusedIndex ? '#f3f4f6' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      {title}
                    </button>
                  ))}
                  {filteredJobTitles.length > 10 && (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      {filteredJobTitles.length - 10} more results...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button and Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleGenerateNewsletters}
              disabled={!selectedTargetAudience.trim() || !selectedJobTitle.trim() || isGenerating}
              style={{
                padding: '0.625rem 1.25rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                background: (!selectedTargetAudience.trim() || !selectedJobTitle.trim() || isGenerating) ? '#e5e7eb' : '#3AB981',
                color: (!selectedTargetAudience.trim() || !selectedJobTitle.trim() || isGenerating) ? '#6b7280' : 'white',
                cursor: (!selectedTargetAudience.trim() || !selectedJobTitle.trim() || isGenerating) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {isGenerating ? <RefreshCw style={{ width: '1rem', height: '1rem', animation: 'pulse 1s infinite' }} /> : <FileText style={{ width: '1rem', height: '1rem' }} />}
              {isGenerating ? 'Generating...' : 'Generate Newsletter Sequence'}
            </button>

            {isGenerating && (
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Creating personalized email sequence...
              </span>
            )}
            {!isGenerating && newsletterRows.length > 0 && (
              <span style={{ fontSize: '0.875rem', color: '#3AB981' }}>
                {newsletterRows.length.toLocaleString()} sequence{newsletterRows.length !== 1 ? 's' : ''} generated
              </span>
            )}

          </div>
        </div>


        {/* Bulk controls */}
        {newsletterRows.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <button
              onClick={selectedRows.size > 0 ? clearSelection : selectAllRows}
              style={{
                padding: '0.4rem 0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {selectedRows.size > 0 ? `Unselect (${selectedRows.size})` : 'Select All'}
            </button>
            {selectedRows.size > 0 && (
              <button
                onClick={deleteSelectedRows}
                style={{
                  padding: '0.4rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Delete Selected ({selectedRows.size})
              </button>
            )}
          </div>
        )}

        {/* Table Container */}
        {newsletterRows.length > 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <div style={{ maxHeight: '65vh', overflow: 'auto' }}>
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
                <colgroup>
                  <col style={{ width: '32px' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                      <input
                        type="checkbox"
                        checked={newsletterRows.length > 0 && selectedRows.size === newsletterRows.length}
                        onChange={selectedRows.size > 0 ? clearSelection : selectAllRows}
                        style={{ cursor: 'pointer', marginTop: '4px' }}
                      />
                    </th>
                    <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>TARGET AUDIENCE</th>
                    <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>JOB TITLE</th>
                    <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>STATUS</th>
                    <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>PROGRESS</th>
                    <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>EMAILS</th>
                    <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>CREATED</th>
                    <th className="sticky-header" style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.875rem' }}>
                  {newsletterRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => toggleRowSelection(row.id)}
                          style={{ marginTop: '8px' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={clippedStyle} title={row.targetAudience}>
                          {row.targetAudience?.includes('(') ? row.targetAudience.split('(')[0].trim() : row.targetAudience}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={clippedStyle} title={row.jobTitle}>{row.jobTitle}</div>
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          ...(row.status === 'completed' ? { background: '#d1fae5', color: '#065f46' } :
                             row.status === 'error' ? { background: '#fee2e2', color: '#dc2626' } :
                             row.status === 'running' ? { background: '#dbeafe', color: '#1d4ed8' } :
                             { background: '#f3f4f6', color: '#374151' })
                        }}>
                          {row.status === 'running' && <RefreshCw style={{ width: '0.75rem', height: '0.75rem', animation: 'pulse 1s infinite' }} />}
                          {row.status === 'error' && <AlertTriangle style={{ width: '0.75rem', height: '0.75rem' }} />}
                          {row.status === 'completed' && <Check style={{ width: '0.75rem', height: '0.75rem' }} />}
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                        {row.error ? (
                          <span style={{ color: '#dc2626' }} title={row.error}>
                            {row.error.length > 50 ? `${row.error.substring(0, 50)}...` : row.error}
                          </span>
                        ) : (
                          <div style={clippedStyle} title={row.progress}>{row.progress}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                        {row.newsletters.length > 0 ? `${row.newsletters.length} emails` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                        {row.createdAt.toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                        {row.status === 'completed' && row.newsletters.length > 0 && (
                          <button
                            onClick={() => openActionModal(row.id)}
                            style={{
                              padding: '0.3125rem 0.625rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #e5e7eb',
                              background: '#EBF212',
                              color: '#000000',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Users style={{ width: '0.75rem', height: '0.75rem' }} />
                            Manage
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <FileText style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>No email sequences generated yet</h3>
            <p style={{ marginBottom: '0.5rem' }}>Select your target audience and the job title you want to reach</p>
            <p style={{ fontSize: '0.875rem' }}>Generate personalized email sequences powered by Apollo's engagement data</p>
          </div>
        )}

        {/* Action Modal */}
        {isActionModalOpen && activeModalRowId && (
          <EmailNewsletterActionModal
            isOpen={isActionModalOpen}
            onClose={closeActionModal}
            newsletterRow={newsletterRows.find(row => row.id === activeModalRowId)!}
            onContentUpdate={handleContentUpdate}
          />
        )}
      </div>
    </>
  );
};

export default EmailNewsletterPage;