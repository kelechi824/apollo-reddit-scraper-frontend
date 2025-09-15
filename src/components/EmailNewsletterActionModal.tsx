import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, ExternalLink, Copy, Check, RefreshCw, FileText, Table, BarChart3, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import googleDocsService from '../services/googleDocsService';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';

// Interface for NewsletterRow
interface NewsletterRow {
  id: string;
  jobTitle: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: string;
  newsletters: string[];
  mcpData?: {
    totalEmails: number;
    totalDelivered: number;
    totalOpened: number;
    totalReplied: number;
    openingRate: number;
    replyRate: number;
  };
  createdAt: Date;
  metadata?: {
    processingTime: number;
    mcpUsed: boolean;
    toolsCalled: number;
  };
}

interface EmailNewsletterActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsletterRow: NewsletterRow;
  onContentUpdate?: (rowId: string, newsletters: string[]) => void;
}

/**
 * EmailNewsletterActionModal Component
 * 
 * A comprehensive action modal for editing, regenerating, and exporting email newsletters.
 * Provides individual newsletter editing, Google Docs/Sheets integration, and copy functionality.
 * 
 * Features:
 * - Edit individual newsletters (5 separate text areas)
 * - Regenerate individual newsletters with Apollo data context
 * - Export to Google Docs (individual newsletters)
 * - Export to Google Sheets (batch export all newsletters)
 * - Copy functionality for individual newsletters
 * - Apollo CTA customization
 * - Email performance data display
 */
const EmailNewsletterActionModal: React.FC<EmailNewsletterActionModalProps> = ({
  isOpen,
  onClose,
  newsletterRow,
  onContentUpdate
}) => {
  // Debug: Log the newsletterRow data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 EmailNewsletterActionModal - newsletterRow data:', {
        id: newsletterRow.id,
        jobTitle: newsletterRow.jobTitle,
        status: newsletterRow.status,
        mcpData: newsletterRow.mcpData,
        newslettersLength: newsletterRow.newsletters.length
      });
    }
  }, [isOpen, newsletterRow]);

  // State management
  const [editableNewsletters, setEditableNewsletters] = useState<string[]>(newsletterRow.newsletters);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isOpeningSheets, setIsOpeningSheets] = useState<boolean>(false);
  const [isRegeneratingIndex, setIsRegeneratingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedSubject, setCopiedSubject] = useState<boolean>(false);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [currentNewsletterIndex, setCurrentNewsletterIndex] = useState<number>(0);

  // Separate editing states for subject and body
  const [editingSubject, setEditingSubject] = useState<string>('');
  const [editingBody, setEditingBody] = useState<string>('');

  // References
  const modalRef = useRef<HTMLDivElement>(null);

  /**
   * Handle escape key press
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  /**
   * Sync editing states when newsletter index changes
   */
  useEffect(() => {
    const currentNewsletter = editableNewsletters[currentNewsletterIndex] || '';
    const parsed = parseEmailContent(currentNewsletter);
    setEditingSubject(parsed.subject);
    setEditingBody(parsed.body);
  }, [currentNewsletterIndex, editableNewsletters]);

  /**
   * Navigation functions
   */
  const goToPreviousNewsletter = () => {
    setCurrentNewsletterIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextNewsletter = () => {
    setCurrentNewsletterIndex(prev => Math.min(editableNewsletters.length - 1, prev + 1));
  };

  /**
   * Handle subject line change
   */
  const handleSubjectChange = (newSubject: string) => {
    setEditingSubject(newSubject);
    updateNewsletterFromParts(newSubject, editingBody);
  };

  /**
   * Handle email body change
   */
  const handleBodyChange = (newBody: string) => {
    setEditingBody(newBody);
    updateNewsletterFromParts(editingSubject, newBody);
  };

  /**
   * Update newsletter content from separate subject and body parts
   */
  const updateNewsletterFromParts = (subject: string, body: string) => {
    const reconstructedNewsletter = `Subject Line:

${subject}

Email Body:

${body}`;

    const newNewsletters = [...editableNewsletters];
    newNewsletters[currentNewsletterIndex] = reconstructedNewsletter;
    setEditableNewsletters(newNewsletters);
    setHasUnsavedChanges(true);
  };

  /**
   * Save changes
   */
  const handleSaveChanges = () => {
    if (onContentUpdate) {
      onContentUpdate(newsletterRow.id, editableNewsletters);
    }
    setHasUnsavedChanges(false);
  };

  /**
   * Copy newsletter to clipboard (updated for current index)
   */
  const handleCopyNewsletter = async () => {
    try {
      await navigator.clipboard.writeText(editableNewsletters[currentNewsletterIndex]);
      setCopiedIndex(currentNewsletterIndex);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy newsletter:', error);
    }
  };

  /**
   * Copy subject line to clipboard
   */
  const handleCopySubject = async () => {
    try {
      const { subject } = parseEmailContent(editableNewsletters[currentNewsletterIndex] || '');
      await navigator.clipboard.writeText(subject);
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } catch (error) {
      console.error('Failed to copy subject:', error);
    }
  };

  /**
   * Copy email body to clipboard
   */
  const handleCopyBody = async () => {
    try {
      const { body } = parseEmailContent(editableNewsletters[currentNewsletterIndex] || '');
      await navigator.clipboard.writeText(body);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    } catch (error) {
      console.error('Failed to copy body:', error);
    }
  };

  /**
   * Export individual newsletter to Google Docs (updated for current index)
   */
  const handleExportToDocs = async () => {
    try {
      await googleDocsService.authenticate();
      await googleDocsService.initialize();

      const title = `${getNewsletterTheme(currentNewsletterIndex)} - ${newsletterRow.jobTitle}`;
      const htmlContent = `<h1>${title}</h1><p>${editableNewsletters[currentNewsletterIndex].replace(/\n/g, '</p><p>')}</p>`;

      const docUrl = await googleDocsService.createDocument(title, htmlContent);
      window.open(docUrl, '_blank');
    } catch (error) {
      console.error('Failed to export to Google Docs:', error);
      alert('Failed to export to Google Docs. Please try again.');
    }
  };

  /**
   * Regenerate individual newsletter (updated for current index)
   */
  const handleRegenerateNewsletter = async () => {
    setIsRegeneratingIndex(currentNewsletterIndex);

    try {
      const response = await fetch(API_ENDPOINTS.emailNewsletter.regenerate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobTitle: newsletterRow.jobTitle,
          newsletterIndex: currentNewsletterIndex,
          mcpData: newsletterRow.mcpData,
          currentNewsletter: editableNewsletters[currentNewsletterIndex]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Update the newsletter
      const newNewsletters = [...editableNewsletters];
      newNewsletters[currentNewsletterIndex] = result.newsletter;
      setEditableNewsletters(newNewsletters);
      setHasUnsavedChanges(true);

    } catch (error) {
      console.error('Failed to regenerate newsletter:', error);
      alert('Failed to regenerate newsletter. Please try again.');
    } finally {
      setIsRegeneratingIndex(null);
    }
  };

  /**
   * Export all newsletters to Google Sheets
   */
  const handleExportToSheets = async () => {
    setIsOpeningSheets(true);
    
    try {
      // Use existing blog data append functionality to create spreadsheet
      await googleDocsService.authenticate();
      await googleDocsService.initialize();
      
      // Create newsletter data in blog format that can use existing appendBlogData
      const newsletterData = {
        title: `${newsletterRow.jobTitle} Email Newsletters`,
        content: editableNewsletters.map((newsletter, index) => 
          `**Newsletter ${index + 1} (${getNewsletterTheme(index)}):**\n\n${newsletter}`
        ).join('\n\n---\n\n'),
        keywords: [newsletterRow.jobTitle, 'email', 'newsletter', 'outreach'],
        targetAudience: newsletterRow.jobTitle,
        brandKit: null,
        meta_title: `${newsletterRow.jobTitle} Email Newsletters`,
        meta_description: `Email newsletter sequences for ${newsletterRow.jobTitle}`,
        author: 'Email Newsletter Agent'
      };

      // Use existing blog data append functionality
      const result = await (googleDocsService as any).appendBlogData(newsletterData);
      
      if (result.success) {
        window.open(result.spreadsheetUrl, '_blank');
      } else {
        throw new Error('Failed to create spreadsheet');
      }
      
    } catch (error) {
      console.error('Failed to export to Google Sheets:', error);
      alert('Failed to export to Google Sheets. Please try again.');
    } finally {
      setIsOpeningSheets(false);
    }
  };

  /**
   * Get newsletter theme/title
   */
  const getNewsletterTheme = (index: number): string => {
    const themes = [
      'Data-Driven Outreach Strategies',
      'Executive Engagement Best Practices',
      'Industry-Specific Email Templates',
      'Performance Benchmarking Insights',
      'Advanced Prospecting Techniques'
    ];
    return themes[index] || `Newsletter ${index + 1}`;
  };

  /**
   * Parse email content to extract subject and body
   */
  const parseEmailContent = (content: string) => {
    const lines = content.split('\n');
    let subject = '';
    let body = '';

    // Find "Subject Line:" and "Email Body:" sections
    const subjectLineIndex = lines.findIndex(line => /^subject\s*line[:\s]*$/i.test(line.trim()));
    const emailBodyIndex = lines.findIndex(line => /^email\s*body[:\s]*$/i.test(line.trim()));

    if (subjectLineIndex !== -1) {
      // Get the first non-empty line after "Subject Line:"
      for (let i = subjectLineIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length > 0) {
          subject = line;
          break;
        }
      }

      // If we found "Email Body:", get content after it
      if (emailBodyIndex !== -1 && emailBodyIndex + 1 < lines.length) {
        body = lines.slice(emailBodyIndex + 1).join('\n').trim();
      } else {
        // If no "Email Body:" found, get everything after the subject line (skip one line)
        body = lines.slice(subjectLineIndex + 2).join('\n').trim();
      }
    } else {
      // Fallback: Look for "Email Body:" and try to infer subject from content before it
      if (emailBodyIndex !== -1) {
        // Get content before "Email Body:" as potential subject
        const beforeEmailBody = lines.slice(0, emailBodyIndex).join('\n').trim();
        const afterEmailBody = lines.slice(emailBodyIndex + 1).join('\n').trim();

        // If content before "Email Body:" looks like a subject (reasonable length), use it
        if (beforeEmailBody.length > 0 && beforeEmailBody.length < 200 && !beforeEmailBody.includes('\n\n')) {
          subject = beforeEmailBody;
          body = afterEmailBody;
        } else {
          // Otherwise, use first line as subject
          subject = lines[0]?.trim() || '';
          body = afterEmailBody;
        }
      } else {
        // No clear structure, use first line as subject
        const firstLine = lines[0]?.trim() || '';
        if (firstLine.length > 0 && firstLine.length < 150) {
          subject = firstLine;
          body = lines.slice(1).join('\n').trim();
        } else {
          // If first line is too long, use fallback subject
          subject = `${getNewsletterTheme(currentNewsletterIndex)} - ${newsletterRow.jobTitle}`;
          body = content;
        }
      }
    }

    return {
      subject: subject || `${getNewsletterTheme(currentNewsletterIndex)} - ${newsletterRow.jobTitle}`,
      body: body || content
    };
  };

  if (!isOpen) return null;

  return (
    <>
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
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          ref={modalRef}
          style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            width: '100%',
            maxWidth: '85vw',
            height: '95vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                  {newsletterRow.jobTitle} Email Newsletters
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                  {editableNewsletters.length} newsletters • Generated {new Date(newsletterRow.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {hasUnsavedChanges && (
                <button 
                  onClick={handleSaveChanges}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3AB981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Check style={{ width: '1rem', height: '1rem' }} />
                  Save Changes
                </button>
              )}
              
              <button 
                onClick={handleExportToSheets} 
                disabled={isOpeningSheets}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: isOpeningSheets ? '#e5e7eb' : '#f3f4f6',
                  color: isOpeningSheets ? '#6b7280' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: isOpeningSheets ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {isOpeningSheets ? (
                  <>
                    <RefreshCw style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Table style={{ width: '1rem', height: '1rem' }} />
                    Export to Sheets
                  </>
                )}
              </button>
              
              <button 
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>
          </div>

          {/* Apollo Data Summary */}
          {newsletterRow.mcpData && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <img
                  src="/apollo logo only.png"
                  alt="Apollo"
                  style={{ width: '1rem', height: '1rem' }}
                />
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                  Apollo Email Performance Data
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div style={{
                  backgroundColor: '#EBF212',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Delivered</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                    {newsletterRow.mcpData.totalDelivered.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#EBF212',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Opened</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                    {newsletterRow.mcpData.totalOpened.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#EBF212',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Replied</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                    {newsletterRow.mcpData.totalReplied.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#EBF212',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Opening Rate</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                    {(newsletterRow.mcpData.openingRate * 100).toFixed(2)}%
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#EBF212',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Reply Rate</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                    {(newsletterRow.mcpData.replyRate * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Newsletter Split View */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left Pane - Email Preview */}
            <div style={{
              flex: 1,
              borderRight: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f3f4f6'
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #d1d5db',
                backgroundColor: '#e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Mail style={{ width: '1.25rem', height: '1.25rem', color: '#4b5563' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Email Preview
                  </h3>
                </div>

                {/* Navigation Controls */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Newsletter {currentNewsletterIndex + 1} of {editableNewsletters.length}: {getNewsletterTheme(currentNewsletterIndex)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={goToPreviousNewsletter}
                      disabled={currentNewsletterIndex === 0}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: currentNewsletterIndex === 0 ? '#f9fafb' : '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        cursor: currentNewsletterIndex === 0 ? 'not-allowed' : 'pointer',
                        color: currentNewsletterIndex === 0 ? '#9ca3af' : '#374151',
                        fontSize: '0.875rem'
                      }}
                    >
                      <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
                      Previous
                    </button>

                    <button
                      onClick={goToNextNewsletter}
                      disabled={currentNewsletterIndex === editableNewsletters.length - 1}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: currentNewsletterIndex === editableNewsletters.length - 1 ? '#f9fafb' : '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        cursor: currentNewsletterIndex === editableNewsletters.length - 1 ? 'not-allowed' : 'pointer',
                        color: currentNewsletterIndex === editableNewsletters.length - 1 ? '#9ca3af' : '#374151',
                        fontSize: '0.875rem'
                      }}
                    >
                      Next
                      <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Preview Content */}
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Subject Line Section */}
                  <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#E5E7EB'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>
                        SUBJECT LINE
                      </div>
                      <button
                        onClick={handleCopySubject}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: copiedSubject ? '#d1fae5' : '#f3f4f6',
                          border: `1px solid ${copiedSubject ? '#10b981' : '#d1d5db'}`,
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          color: copiedSubject ? '#065f46' : '#374151',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                        title="Copy subject line"
                      >
                        {copiedSubject ? (
                          <>
                            <Check style={{ width: '0.75rem', height: '0.75rem' }} />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy style={{ width: '0.75rem', height: '0.75rem' }} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', lineHeight: '1.4' }}>
                      {parseEmailContent(editableNewsletters[currentNewsletterIndex] || '').subject}
                    </div>
                  </div>

                  {/* Email Body Section */}
                  <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.5rem 0.5rem',
                      backgroundColor: '#f8fafc'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>
                        EMAIL BODY
                      </div>
                      <button
                        onClick={handleCopyBody}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: copiedBody ? '#d1fae5' : '#f3f4f6',
                          border: `1px solid ${copiedBody ? '#10b981' : '#d1d5db'}`,
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          color: copiedBody ? '#065f46' : '#374151',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                        title="Copy email body"
                      >
                        {copiedBody ? (
                          <>
                            <Check style={{ width: '0.75rem', height: '0.75rem' }} />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy style={{ width: '0.75rem', height: '0.75rem' }} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div style={{
                      flex: 1,
                      padding: '1rem 1.5rem 1.5rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                      color: '#374151',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: 'white',
                      overflowY: 'auto'
                    }}>
                      {parseEmailContent(editableNewsletters[currentNewsletterIndex] || '').body}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Pane - Newsletter Editor */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white'
            }}>
              <div style={{
                padding: '1.61em',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                      Newsletter Editor
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                      {(editingSubject + ' ' + editingBody).split(' ').filter(word => word.length > 0).length} words • {(editingSubject + editingBody).length} characters
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={handleRegenerateNewsletter}
                      disabled={isRegeneratingIndex === currentNewsletterIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        cursor: isRegeneratingIndex === currentNewsletterIndex ? 'not-allowed' : 'pointer',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }}
                      title="Regenerate this newsletter"
                    >
                      {isRegeneratingIndex === currentNewsletterIndex ? (
                        <RefreshCw style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Wand2 style={{ width: '1rem', height: '1rem' }} />
                      )}
                      Regenerate
                    </button>

                    <button
                      onClick={handleExportToDocs}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }}
                      title="Export to Google Docs"
                    >
                      <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                      Export
                    </button>

                    <button
                      onClick={handleCopyNewsletter}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: copiedIndex === currentNewsletterIndex ? '#d1fae5' : 'transparent',
                        border: `1px solid ${copiedIndex === currentNewsletterIndex ? '#10b981' : '#d1d5db'}`,
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        color: copiedIndex === currentNewsletterIndex ? '#10b981' : '#6b7280',
                        fontSize: '0.875rem'
                      }}
                      title="Copy to clipboard"
                    >
                      {copiedIndex === currentNewsletterIndex ? (
                        <>
                          <Check style={{ width: '1rem', height: '1rem' }} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy style={{ width: '1rem', height: '1rem' }} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Separate Editor Fields */}
              <div style={{ flex: 1, padding: '1.61em', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Subject Line Editor */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editingSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter email subject line..."
                  />
                </div>

                {/* Email Body Editor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Email Body
                  </label>
                  <textarea
                    value={editingBody}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    style={{
                      width: '100%',
                      flex: 1,
                      minHeight: '300px',
                      padding: '1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                      resize: 'none',
                      fontFamily: 'inherit',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter email body content..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailNewsletterActionModal;