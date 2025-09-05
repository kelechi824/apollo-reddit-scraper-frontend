/**
 * Smart localStorage management utility
 * Why this matters: Handles localStorage quota limits gracefully and provides data compression
 */

interface StorageItem {
  data: any;
  timestamp: number;
  compressed?: boolean;
}

interface StorageStats {
  used: number;
  available: number;
  total: number;
}

export class StorageManager {
  private static readonly MAX_ITEM_SIZE = 2 * 1024 * 1024; // 2MB per item
  private static readonly STORAGE_KEYS = {
    ANALYSIS_RESULTS: 'apollo-analysis-results',
    ANALYSIS_BACKUP: 'apollo-analysis-backup',
    ANALYSES_HISTORY: 'apollo-analyses'
  };

  /**
   * Get approximate localStorage usage stats
   * Why this matters: Helps us understand storage constraints before hitting limits
   */
  static getStorageStats(): StorageStats {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Most browsers have 5-10MB limit, we'll assume 5MB to be safe
    const total = 5 * 1024 * 1024;
    return {
      used,
      available: total - used,
      total
    };
  }

  /**
   * Compress data using simple JSON compression techniques
   * Why this matters: Reduces storage size by removing redundant data and whitespace
   */
  private static compressData(data: any): string {
    // Remove null/undefined values and compress JSON
    const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
      if (value === null || value === undefined) return undefined;
      return value;
    }));
    
    return JSON.stringify(cleaned);
  }

  /**
   * Create a minimal version of analysis data for storage
   * Why this matters: When full data is too large, we save essential info for navigation
   */
  private static createMinimalAnalysis(data: any): any {
    if (!data.analyzed_posts) return data;
    
    return {
      workflow_id: data.workflow_id,
      timestamp: Date.now(),
      analyzed_posts: data.analyzed_posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        score: post.score,
        created_utc: post.created_utc
      })),
      reddit_results: {
        total_posts: data.reddit_results?.total_posts || 0,
        keyword: data.reddit_results?.keyword || '',
        subreddit: data.reddit_results?.subreddit || ''
      },
      _minimal: true
    };
  }

  /**
   * Smart setItem with compression and fallback strategies
   * Why this matters: Prevents quota exceeded errors by trying multiple storage strategies
   */
  static setItem(key: string, data: any): boolean {
    try {
      const stats = this.getStorageStats();
      const dataString = JSON.stringify(data);
      
      // If data is too large, try compression first
      if (dataString.length > this.MAX_ITEM_SIZE) {
        console.warn(`Data for ${key} is large (${(dataString.length / 1024 / 1024).toFixed(2)}MB), attempting compression`);
        
        try {
          const compressed = this.compressData(data);
          const storageItem: StorageItem = {
            data: JSON.parse(compressed),
            timestamp: Date.now(),
            compressed: true
          };
          
          localStorage.setItem(key, JSON.stringify(storageItem));
          console.log(`✅ Compressed data saved for ${key}`);
          return true;
        } catch (compressionError) {
          console.warn('Compression failed, trying minimal version');
        }
      } else {
        // Try normal storage first
        const storageItem: StorageItem = {
          data,
          timestamp: Date.now()
        };
        
        localStorage.setItem(key, JSON.stringify(storageItem));
        console.log(`✅ Data saved for ${key}`);
        return true;
      }
    } catch (error) {
      console.warn(`Storage failed for ${key}, trying fallback strategies`);
    }

    // Fallback 1: Clear old data and try again
    try {
      this.clearOldData();
      const storageItem: StorageItem = {
        data: this.createMinimalAnalysis(data),
        timestamp: Date.now(),
        compressed: true
      };
      
      localStorage.setItem(key, JSON.stringify(storageItem));
      console.log(`✅ Minimal data saved for ${key} after cleanup`);
      return true;
    } catch (fallbackError) {
      console.error(`Failed to save ${key} even with fallback:`, fallbackError);
      return false;
    }
  }

  /**
   * Smart getItem with decompression support
   * Why this matters: Retrieves data regardless of whether it was compressed or not
   */
  static getItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      // Try to parse as StorageItem first
      try {
        const storageItem: StorageItem = JSON.parse(item);
        if (storageItem.data !== undefined) {
          return storageItem.data;
        }
      } catch {
        // If not a StorageItem, try direct parse (backward compatibility)
        return JSON.parse(item);
      }

      return null;
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Clear old data to free up space
   * Why this matters: Removes outdated analysis data to make room for new data
   */
  static clearOldData(): void {
    const keys = Object.values(this.STORAGE_KEYS);
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const storageItem: StorageItem = JSON.parse(item);
          if (storageItem.timestamp && storageItem.timestamp < cutoffTime) {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed old data for ${key}`);
          }
        }
      } catch (error) {
        // If we can't parse it, it might be old format - remove it
        localStorage.removeItem(key);
        console.log(`🗑️ Removed unparseable data for ${key}`);
      }
    });
  }

  /**
   * Save analysis results with smart storage management
   * Why this matters: Specifically handles analysis results with proper fallback strategies
   */
  static saveAnalysisResults(results: any): boolean {
    return this.setItem(this.STORAGE_KEYS.ANALYSIS_RESULTS, results);
  }

  /**
   * Get analysis results
   * Why this matters: Retrieves saved analysis results for the UI
   */
  static getAnalysisResults(): any {
    return this.getItem(this.STORAGE_KEYS.ANALYSIS_RESULTS);
  }

  /**
   * Save analysis backup with smart storage management
   * Why this matters: Creates a backup of analysis data for recovery
   */
  static saveAnalysisBackup(backup: any): boolean {
    return this.setItem(this.STORAGE_KEYS.ANALYSIS_BACKUP, backup);
  }

  /**
   * Get analysis backup
   * Why this matters: Retrieves backup data for recovery scenarios
   */
  static getAnalysisBackup(): any {
    return this.getItem(this.STORAGE_KEYS.ANALYSIS_BACKUP);
  }

  /**
   * Update analyses history with size management
   * Why this matters: Maintains a history of analyses without exceeding storage limits
   */
  static updateAnalysesHistory(newAnalysis: any): boolean {
    try {
      const existing = this.getItem(this.STORAGE_KEYS.ANALYSES_HISTORY) || [];
      const updated = [newAnalysis, ...existing].slice(0, 10); // Keep only 10 most recent
      
      return this.setItem(this.STORAGE_KEYS.ANALYSES_HISTORY, updated);
    } catch (error) {
      console.error('Failed to update analyses history:', error);
      return false;
    }
  }

  /**
   * Get analyses history
   * Why this matters: Retrieves the list of previous analyses for navigation
   */
  static getAnalysesHistory(): any[] {
    return this.getItem(this.STORAGE_KEYS.ANALYSES_HISTORY) || [];
  }

  /**
   * Clear all Apollo-related storage
   * Why this matters: Provides a way to reset storage when needed
   */
  static clearAll(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ Cleared all Apollo storage data');
  }

  /**
   * Get storage usage report
   * Why this matters: Helps debug storage issues and monitor usage
   */
  static getUsageReport(): { [key: string]: number } {
    const report: { [key: string]: number } = {};
    
    Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
      const item = localStorage.getItem(key);
      report[name] = item ? item.length : 0;
    });
    
    const stats = this.getStorageStats();
    report['TOTAL_USED'] = stats.used;
    report['AVAILABLE'] = stats.available;
    
    return report;
  }
}