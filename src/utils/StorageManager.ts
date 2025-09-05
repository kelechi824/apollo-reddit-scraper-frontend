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

  static getStorageStats(): StorageStats {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    const total = 5 * 1024 * 1024;
    return {
      used,
      available: total - used,
      total
    };
  }

  private static compressData(data: any): string {
    const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
      if (value === null || value === undefined) return undefined;
      return value;
    }));
    
    return JSON.stringify(cleaned);
  }

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

  static setItem(key: string, data: any): boolean {
    try {
      const stats = this.getStorageStats();
      const dataString = JSON.stringify(data);
      
      if (dataString.length > this.MAX_ITEM_SIZE) {
        console.warn(`Data for ${key} is large, attempting compression`);
        
        try {
          const compressed = this.compressData(data);
          const storageItem: StorageItem = {
            data: JSON.parse(compressed),
            timestamp: Date.now(),
            compressed: true
          };
          
          localStorage.setItem(key, JSON.stringify(storageItem));
          return true;
        } catch (compressionError) {
          console.warn('Compression failed, trying minimal version');
        }
      } else {
        const storageItem: StorageItem = {
          data,
          timestamp: Date.now()
        };
        
        localStorage.setItem(key, JSON.stringify(storageItem));
        return true;
      }
    } catch (error) {
      console.warn(`Storage failed for ${key}, trying fallback strategies`);
    }

    try {
      this.clearOldData();
      const storageItem: StorageItem = {
        data: this.createMinimalAnalysis(data),
        timestamp: Date.now(),
        compressed: true
      };
      
      localStorage.setItem(key, JSON.stringify(storageItem));
      return true;
    } catch (fallbackError) {
      console.error(`Failed to save ${key} even with fallback:`, fallbackError);
      return false;
    }
  }

  static getItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      try {
        const storageItem: StorageItem = JSON.parse(item);
        if (storageItem.data !== undefined) {
          return storageItem.data;
        }
      } catch {
        return JSON.parse(item);
      }

      return null;
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  static clearOldData(): void {
    const keys = Object.values(this.STORAGE_KEYS);
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);

    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const storageItem: StorageItem = JSON.parse(item);
          if (storageItem.timestamp && storageItem.timestamp < cutoffTime) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        localStorage.removeItem(key);
      }
    });
  }

  static saveAnalysisResults(results: any): boolean {
    return this.setItem(this.STORAGE_KEYS.ANALYSIS_RESULTS, results);
  }

  static getAnalysisResults(): any {
    return this.getItem(this.STORAGE_KEYS.ANALYSIS_RESULTS);
  }

  static saveAnalysisBackup(backup: any): boolean {
    return this.setItem(this.STORAGE_KEYS.ANALYSIS_BACKUP, backup);
  }

  static getAnalysisBackup(): any {
    return this.getItem(this.STORAGE_KEYS.ANALYSIS_BACKUP);
  }

  static updateAnalysesHistory(newAnalysis: any): boolean {
    try {
      const existing = this.getItem(this.STORAGE_KEYS.ANALYSES_HISTORY) || [];
      const updated = [newAnalysis, ...existing].slice(0, 10);
      
      return this.setItem(this.STORAGE_KEYS.ANALYSES_HISTORY, updated);
    } catch (error) {
      console.error('Failed to update analyses history:', error);
      return false;
    }
  }

  static getAnalysesHistory(): any[] {
    return this.getItem(this.STORAGE_KEYS.ANALYSES_HISTORY) || [];
  }

  static clearAll(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

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
