import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';

interface CSVUploadResult {
  keywords: string[];
  totalProcessed: number;
  errors: string[];
}

interface LargeCSVUploaderProps {
  onUploadComplete: (result: CSVUploadResult) => void;
  disabled?: boolean;
}

interface UploadProgress {
  phase: 'validating' | 'parsing' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  details?: string;
}

const LargeCSVUploader: React.FC<LargeCSVUploaderProps> = ({ onUploadComplete, disabled = false }) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortController = useRef<AbortController | null>(null);

  /**
   * File validation before processing
   * Why this matters: Prevents wasted processing time on invalid files and provides clear feedback
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return { valid: false, error: 'Please upload a CSV file (.csv extension required)' };
    }

    // Check file size (100MB = 100 * 1024 * 1024 bytes)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 100MB` };
    }

    // Check for empty file
    if (file.size === 0) {
      return { valid: false, error: 'File appears to be empty' };
    }

    return { valid: true };
  };

  /**
   * Memory-efficient CSV parsing using Papa Parse streaming
   * Why this matters: Handles large files without loading everything into memory at once
   */
  const processCSVFile = async (file: File): Promise<CSVUploadResult> => {
    return new Promise((resolve, reject) => {
      const keywords: string[] = [];
      const errors: string[] = [];
      let rowCount = 0;
      let isFirstRow = true;
      let hasValidHeader = false;

      setUploadProgress({
        phase: 'parsing',
        progress: 0,
        message: 'Parsing CSV file...',
        details: 'Processing rows'
      });

      // Create abort controller for cancellation
      abortController.current = new AbortController();

      Papa.parse(file, {
        // Streaming configuration for large files
        chunk: (results, parser) => {
          if (abortController.current?.signal.aborted) {
            parser.abort();
            return;
          }

          // Process each chunk of data
          results.data.forEach((row: any, index: number) => {
            rowCount++;

            // Handle first row - check if it's a header
            if (isFirstRow) {
              isFirstRow = false;
              const firstCell = Array.isArray(row) ? row[0] : row;
              const cellStr = String(firstCell || '').toLowerCase().trim();
              
              // Skip header row if it looks like a header
              if (cellStr.includes('keyword') || cellStr.includes('term') || cellStr.includes('query')) {
                hasValidHeader = true;
                return;
              }
            }

            // Extract keyword from row
            let keyword = '';
            if (Array.isArray(row)) {
              keyword = String(row[0] || '').trim();
            } else if (typeof row === 'object' && row) {
              // Handle object format (with headers)
              const values = Object.values(row);
              keyword = String(values[0] || '').trim();
            } else {
              keyword = String(row || '').trim();
            }

            // Validate and add keyword
            if (keyword && keyword.length > 0) {
              if (keyword.length > 200) {
                errors.push(`Row ${rowCount}: Keyword too long (max 200 characters)`);
              } else {
                keywords.push(keyword);
              }
            } else if (rowCount > 1 || !hasValidHeader) {
              // Only log empty rows as errors if they're not the header
              errors.push(`Row ${rowCount}: Empty or invalid keyword`);
            }

            // Update progress every 100 rows
            if (rowCount % 100 === 0) {
              setUploadProgress(prev => prev ? {
                ...prev,
                progress: Math.min(90, (rowCount / 1000) * 90), // Estimate progress up to 90%
                details: `Processed ${rowCount} rows, found ${keywords.length} valid keywords`
              } : null);
            }
          });
        },

        // Configuration for robust parsing
        header: false, // We'll handle headers manually
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
        
        // Completion callback
        complete: (results) => {
          setUploadProgress({
            phase: 'processing',
            progress: 95,
            message: 'Finalizing keyword list...',
            details: `Found ${keywords.length} keywords`
          });

          // Remove duplicates while preserving order
          const uniqueKeywords = Array.from(new Set(keywords));
          const duplicatesRemoved = keywords.length - uniqueKeywords.length;

          if (duplicatesRemoved > 0) {
            errors.push(`Removed ${duplicatesRemoved} duplicate keywords`);
          }

          setUploadProgress({
            phase: 'complete',
            progress: 100,
            message: 'Upload complete!',
            details: `Processed ${uniqueKeywords.length} unique keywords`
          });

          resolve({
            keywords: uniqueKeywords,
            totalProcessed: rowCount,
            errors
          });
        },

        // Error callback
        error: (error) => {
          setUploadProgress({
            phase: 'error',
            progress: 0,
            message: 'Parse error occurred',
            details: error.message
          });
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  };

  /**
   * Handle file upload process
   * Why this matters: Orchestrates the complete upload workflow with proper error handling
   */
  const handleFileUpload = async (file: File) => {
    try {
      // Reset previous state
      setUploadProgress({
        phase: 'validating',
        progress: 0,
        message: 'Validating file...',
        details: `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`
      });

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadProgress({
          phase: 'error',
          progress: 0,
          message: 'Validation failed',
          details: validation.error || 'Invalid file'
        });
        return;
      }

      // Process the file
      const result = await processCSVFile(file);
      
      // Notify parent component
      setTimeout(() => {
        onUploadComplete(result);
        setUploadProgress(null);
      }, 1000); // Show success message briefly

    } catch (error) {
      setUploadProgress({
        phase: 'error',
        progress: 0,
        message: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  /**
   * Cancel ongoing upload
   * Why this matters: Allows users to cancel long-running uploads to try different files
   */
  const cancelUpload = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setUploadProgress(null);
  };

  /**
   * Handle file input change
   * Why this matters: Processes files when selected through file dialog
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow re-uploading same file
    event.target.value = '';
  };

  /**
   * Handle drag and drop events
   * Why this matters: Provides intuitive drag-and-drop interface for better UX
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    const csvFile = files.find(file => file.name.toLowerCase().endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setUploadProgress({
        phase: 'error',
        progress: 0,
        message: 'Invalid file type',
        details: 'Please drop a CSV file'
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  // Show progress overlay when uploading
  if (uploadProgress) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          {uploadProgress.phase === 'error' ? (
            <AlertCircle size={48} style={{ color: '#dc2626', margin: '0 auto' }} />
          ) : uploadProgress.phase === 'complete' ? (
            <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto' }} />
          ) : (
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
          )}
        </div>

        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          {uploadProgress.message}
        </h3>

        {uploadProgress.details && (
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            {uploadProgress.details}
          </p>
        )}

        {uploadProgress.phase !== 'error' && uploadProgress.phase !== 'complete' && (
          <>
            <div style={{ 
              width: '100%', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '0.5rem',
              height: '0.5rem',
              marginBottom: '1rem',
              overflow: 'hidden'
            }}>
              <div 
                style={{ 
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  borderRadius: '0.5rem',
                  transition: 'width 0.3s ease',
                  width: `${uploadProgress.progress}%`
                }}
              />
            </div>

            <button
              onClick={cancelUpload}
              className="apollo-btn-secondary"
              style={{ fontSize: '0.875rem' }}
            >
              <X size={16} />
              Cancel Upload
            </button>
          </>
        )}

        {uploadProgress.phase === 'error' && (
          <button
            onClick={() => setUploadProgress(null)}
            className="apollo-btn-primary"
            style={{ fontSize: '0.875rem' }}
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `2px dashed ${isDragging ? '#3b82f6' : '#d1d5db'}`,
        borderRadius: '0.5rem',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: isDragging ? '#eff6ff' : disabled ? '#f9fafb' : '#ffffff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1
      }}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      <Upload size={48} style={{ color: isDragging ? '#3b82f6' : '#9ca3af', margin: '0 auto 1rem' }} />
      
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
        {isDragging ? 'Drop CSV file here' : 'Upload CSV Keywords'}
      </h3>
      
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
        Drag and drop your CSV file here, or click to browse
      </p>

      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
        <p>• Supports files up to 100MB</p>
        <p>• First column should contain keywords</p>
        <p>• Headers are automatically detected and skipped</p>
      </div>

      <button
        className="apollo-btn-primary"
        disabled={disabled}
        style={{ 
          marginTop: '1rem',
          fontSize: '0.875rem',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <Upload size={16} />
        Select CSV File
      </button>
    </div>
  );
};

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default LargeCSVUploader; 