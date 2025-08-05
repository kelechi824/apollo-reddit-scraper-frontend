/**
 * Blog History Service
 * Manages saving, loading, and organizing blog content history
 */

interface BlogHistoryItem {
  id: string;
  keyword: string;
  title: string;
  content: string;
  metaDescription: string;
  timestamp: string;
  wordCount: number;
  status: 'completed';
  metadata?: {
    seo_optimized: boolean;
    citations_included: boolean;
    brand_variables_processed: number;
    aeo_optimized: boolean;
  };
  originalKeywordRow?: any; // For modal compatibility
}

const BLOG_HISTORY_KEY = 'apollo-blog-history';

/**
 * Save blog content to history
 * Why this matters: Automatically preserves completed blog content for later access
 */
export const saveBlogToHistory = (blogData: {
  keyword: string;
  title: string;
  content: string;
  metaDescription?: string;
  metadata?: any;
  originalKeywordRow?: any;
}): void => {
  try {
    const existingHistory = getBlogHistory();
    
    // Generate word count
    const wordCount = countWords(blogData.content);
    
    // Create history item
    const historyItem: BlogHistoryItem = {
      id: generateHistoryId(),
      keyword: blogData.keyword,
      title: blogData.title || `Blog Post: ${blogData.keyword}`,
      content: blogData.content,
      metaDescription: blogData.metaDescription || '',
      timestamp: new Date().toISOString(),
      wordCount,
      status: 'completed',
      metadata: {
        seo_optimized: blogData.metadata?.seo_optimized || false,
        citations_included: blogData.metadata?.citations_included || false,
        brand_variables_processed: blogData.metadata?.brand_variables_processed || 0,
        aeo_optimized: blogData.metadata?.aeo_optimized || false,
      },
      originalKeywordRow: blogData.originalKeywordRow
    };

    // Check for duplicates (same keyword and similar content)
    const isDuplicate = existingHistory.some(item => 
      item.keyword.toLowerCase() === blogData.keyword.toLowerCase() &&
      item.content.substring(0, 200) === blogData.content.substring(0, 200)
    );

    if (!isDuplicate) {
      const updatedHistory = [historyItem, ...existingHistory];
      localStorage.setItem(BLOG_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      console.log(`Blog content saved to history: ${blogData.keyword}`);
    } else {
      console.log(`Duplicate blog content not saved: ${blogData.keyword}`);
    }
  } catch (error) {
    console.error('Error saving blog to history:', error);
  }
};

/**
 * Get all blog history items
 * Why this matters: Retrieves all saved blog content for display in history page
 */
export const getBlogHistory = (): BlogHistoryItem[] => {
  try {
    const historyData = localStorage.getItem(BLOG_HISTORY_KEY);
    if (!historyData) return [];
    
    const history = JSON.parse(historyData);
    
    // Sort by timestamp (most recent first)
    return history.sort((a: BlogHistoryItem, b: BlogHistoryItem) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error loading blog history:', error);
    return [];
  }
};

/**
 * Delete specific blog from history
 * Why this matters: Allows users to remove individual blog entries they no longer need
 */
export const deleteBlogFromHistory = (blogId: string): void => {
  try {
    const existingHistory = getBlogHistory();
    const updatedHistory = existingHistory.filter(item => item.id !== blogId);
    localStorage.setItem(BLOG_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    console.log(`Blog deleted from history: ${blogId}`);
  } catch (error) {
    console.error('Error deleting blog from history:', error);
  }
};

/**
 * Clear all blog history
 * Why this matters: Provides bulk deletion functionality for users who want to start fresh
 */
export const clearAllBlogHistory = (): void => {
  try {
    localStorage.removeItem(BLOG_HISTORY_KEY);
    console.log('All blog history cleared');
  } catch (error) {
    console.error('Error clearing blog history:', error);
  }
};

/**
 * Get blog history count
 * Why this matters: Provides quick access to history stats without loading full data
 */
export const getBlogHistoryCount = (): number => {
  try {
    const history = getBlogHistory();
    return history.length;
  } catch (error) {
    console.error('Error getting blog history count:', error);
    return 0;
  }
};

/**
 * Generate unique ID for history items
 * Why this matters: Ensures each history item has a unique identifier for management
 */
const generateHistoryId = (): string => {
  return `blog_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Count words in content
 * Why this matters: Provides accurate word count for blog content metadata
 */
const countWords = (content: string): number => {
  if (!content || typeof content !== 'string') return 0;
  
  // Remove HTML tags and normalize whitespace
  const cleanContent = content
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (!cleanContent) return 0;
  
  return cleanContent.split(' ').length;
};

/**
 * Check if content should be auto-saved
 * Why this matters: Determines when blog content is ready for history storage
 */
export const shouldAutoSaveBlog = (keywordRow: any): boolean => {
  return keywordRow.status === 'completed' && 
         keywordRow.output && 
         keywordRow.output.trim().length > 100; // Minimum content length
};

/**
 * Extract blog data from keyword row for history saving
 * Why this matters: Transforms BlogCreatorPage keyword row data into history-compatible format
 */
export const extractBlogDataFromKeywordRow = (keywordRow: any): any => {
  try {
    // Parse the output if it's a JSON string
    let parsedOutput = keywordRow.output;
    if (typeof keywordRow.output === 'string' && keywordRow.output.startsWith('{')) {
      try {
        parsedOutput = JSON.parse(keywordRow.output);
      } catch (e) {
        // If parsing fails, treat as plain text content
        parsedOutput = { content: keywordRow.output };
      }
    }

    return {
      keyword: keywordRow.keyword,
      title: parsedOutput.metaSeoTitle || parsedOutput.title || keywordRow.metadata?.title || `Blog Post: ${keywordRow.keyword}`,
      content: parsedOutput.content || parsedOutput.blog_content || keywordRow.output,
      metaDescription: parsedOutput.metaDescription || parsedOutput.meta_description || keywordRow.metadata?.description || '',
      metadata: {
        seo_optimized: keywordRow.metadata?.seo_optimized || false,
        citations_included: keywordRow.metadata?.citations_included || false,
        brand_variables_processed: keywordRow.metadata?.brand_variables_processed || 0,
        aeo_optimized: keywordRow.metadata?.aeo_optimized || false,
      },
      originalKeywordRow: keywordRow
    };
  } catch (error) {
    console.error('Error extracting blog data from keyword row:', error);
    return null;
  }
};

/**
 * Auto-save blog content when keyword row is completed
 * Why this matters: Automatically preserves completed blog content without user intervention
 */
export const autoSaveBlogIfReady = (keywordRow: any): void => {
  if (shouldAutoSaveBlog(keywordRow)) {
    const blogData = extractBlogDataFromKeywordRow(keywordRow);
    if (blogData) {
      saveBlogToHistory(blogData);
    }
  }
};