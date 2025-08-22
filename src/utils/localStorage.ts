/**
 * localStorage Utility Functions
 * Why this matters: Provides centralized localStorage management with quota handling
 * to prevent QuotaExceededError across the application.
 */

export interface StorageQuotaInfo {
  canSave: boolean;
  sizeInfo: string;
  usedKB: number;
  totalKB: number;
  percentage: number;
}

/**
 * Check localStorage quota and available space
 * Why this matters: Prevents QuotaExceededError by checking available space before saving.
 */
export const checkLocalStorageQuota = (data: string): StorageQuotaInfo => {
  try {
    const dataSize = new Blob([data]).size;
    const dataSizeKB = Math.round(dataSize / 1024);
    
    // Calculate current localStorage usage
    let currentUsage = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        currentUsage += localStorage[key].length;
      }
    }
    
    const currentUsageKB = Math.round(currentUsage / 1024);
    const estimatedTotalKB = Math.round((currentUsage + dataSize) / 1024);
    
    // Most browsers have 5-10MB limit, we'll be conservative with 4MB
    const quotaLimitKB = 4 * 1024; // 4MB in KB
    
    return {
      canSave: estimatedTotalKB < quotaLimitKB,
      sizeInfo: `Data: ${dataSizeKB}KB, Current: ${currentUsageKB}KB, Estimated Total: ${estimatedTotalKB}KB`,
      usedKB: currentUsageKB,
      totalKB: quotaLimitKB,
      percentage: Math.round((currentUsageKB / quotaLimitKB) * 100)
    };
  } catch (error) {
    console.error('Error checking localStorage quota:', error);
    return { 
      canSave: false, 
      sizeInfo: 'Unable to check quota',
      usedKB: 0,
      totalKB: 4096,
      percentage: 0
    };
  }
};

/**
 * Get current localStorage usage statistics
 * Why this matters: Provides real-time feedback about storage consumption.
 */
export const getStorageUsage = (): { used: number; total: number; percentage: number } => {
  try {
    let currentUsage = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        currentUsage += localStorage[key].length;
      }
    }
    
    const usedKB = Math.round(currentUsage / 1024);
    const totalKB = 4 * 1024; // 4MB conservative limit
    const percentage = Math.round((usedKB / totalKB) * 100);
    
    return { used: usedKB, total: totalKB, percentage };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return { used: 0, total: 4096, percentage: 0 };
  }
};

/**
 * Safely set localStorage item with quota checking and automatic cleanup
 * Why this matters: Prevents QuotaExceededError and automatically attempts to free space.
 */
export const safeSetLocalStorage = (key: string, value: string): { success: boolean; error?: string; freedKB?: number } => {
  try {
    const quotaCheck = checkLocalStorageQuota(value);
    
    if (!quotaCheck.canSave) {
      // Attempt automatic cleanup
      console.log('Storage full, attempting automatic cleanup...');
      const cleanup = autoFreeLocalStorageSpace();
      
      if (cleanup.freedKB > 0) {
        console.log(`Freed ${cleanup.freedKB}KB of storage space`);
        
        // Try again after cleanup
        const retryQuotaCheck = checkLocalStorageQuota(value);
        if (retryQuotaCheck.canSave) {
          localStorage.setItem(key, value);
          return { 
            success: true, 
            freedKB: cleanup.freedKB 
          };
        }
      }
      
      return {
        success: false,
        error: `Storage quota exceeded even after cleanup. ${quotaCheck.sizeInfo}`,
        freedKB: cleanup.freedKB
      };
    }
    
    localStorage.setItem(key, value);
    return { success: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Last resort: try cleanup even if quota check passed
      const cleanup = autoFreeLocalStorageSpace();
      
      if (cleanup.freedKB > 0) {
        try {
          localStorage.setItem(key, value);
          return { 
            success: true, 
            freedKB: cleanup.freedKB 
          };
        } catch (retryError) {
          return {
            success: false,
            error: 'Storage quota exceeded even after emergency cleanup.',
            freedKB: cleanup.freedKB
          };
        }
      }
      
      return {
        success: false,
        error: 'Storage quota exceeded. Try reducing content size or clearing browser data.'
      };
    }
    
    return {
      success: false,
      error: `Failed to save to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Compress text data by trimming whitespace
 * Why this matters: Reduces storage size by removing unnecessary whitespace.
 */
export const compressTextData = (data: Record<string, any>): Record<string, any> => {
  const compress = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim();
    } else if (Array.isArray(obj)) {
      return obj.map(compress);
    } else if (obj !== null && typeof obj === 'object') {
      const compressed: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        compressed[key] = compress(value);
      }
      return compressed;
    }
    return obj;
  };
  
  return compress(data);
};

/**
 * Clear old localStorage entries to free up space
 * Why this matters: Provides a way to clean up storage when quota is exceeded.
 */
export const clearOldLocalStorageEntries = (keysToKeep: string[] = []): number => {
  try {
    let freedSpace = 0;
    const keysToRemove: string[] = [];
    
    // Find entries that are not in the keep list
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && !keysToKeep.includes(key)) {
        // Prioritize removing draft entries and old data
        if (key.includes('_draft') || key.includes('_temp') || key.includes('_cache')) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove identified entries
    keysToRemove.forEach(key => {
      const size = localStorage[key]?.length || 0;
      localStorage.removeItem(key);
      freedSpace += size;
    });
    
    return Math.round(freedSpace / 1024); // Return freed space in KB
  } catch (error) {
    console.error('Error clearing localStorage entries:', error);
    return 0;
  }
};

/**
 * Automatically attempt to free up localStorage space
 * Why this matters: Tries to resolve quota issues automatically before failing.
 */
export const autoFreeLocalStorageSpace = (): { freedKB: number; newUsage: StorageQuotaInfo } => {
  const importantKeys = [
    'apollo_brand_kit',
    'apollo_voc_kit', 
    'apollo_cta_creator_results',
    'apollo_cta_creator_inputs'
  ];
  
  // First, clear draft and temporary files
  const freedKB = clearOldLocalStorageEntries(importantKeys);
  
  // Get updated usage info
  const newUsage = getStorageUsage();
  
  return { freedKB, newUsage: { 
    canSave: true, 
    sizeInfo: `Freed ${freedKB}KB`, 
    usedKB: newUsage.used, 
    totalKB: newUsage.total, 
    percentage: newUsage.percentage 
  }};
};

/**
 * Get detailed localStorage breakdown by key
 * Why this matters: Helps users understand what's taking up space.
 */
export const getLocalStorageBreakdown = (): Array<{ key: string; sizeKB: number; type: string }> => {
  const breakdown: Array<{ key: string; sizeKB: number; type: string }> = [];
  
  try {
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const sizeKB = Math.round(localStorage[key].length / 1024);
        let type = 'other';
        
        if (key.includes('apollo_brand_kit')) type = 'brand-kit';
        else if (key.includes('apollo_voc_kit')) type = 'voc-kit';
        else if (key.includes('apollo_cta_creator')) type = 'cta-creator';
        else if (key.includes('apollo_blog_creator')) type = 'blog-creator';
        else if (key.includes('_draft')) type = 'draft';
        else if (key.includes('_temp') || key.includes('_cache')) type = 'temporary';
        
        breakdown.push({ key, sizeKB, type });
      }
    }
    
    // Sort by size descending
    breakdown.sort((a, b) => b.sizeKB - a.sizeKB);
  } catch (error) {
    console.error('Error getting localStorage breakdown:', error);
  }
  
  return breakdown;
};
