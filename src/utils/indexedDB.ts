/**
 * IndexedDB Storage Manager for Enterprise-Grade Data Handling
 * Why this matters: Provides unlimited storage capacity (GBs vs MBs) with proper
 * database features for handling large brand kit data like enterprise SaaS applications.
 */

interface StorageItem {
  id: string;
  data: any;
  timestamp: number;
  version: number;
  compressed?: boolean;
}

interface StorageStats {
  usedBytes: number;
  availableBytes: number;
  itemCount: number;
  oldestItem: number;
  newestItem: number;
}

class IndexedDBManager {
  private dbName = 'ApolloRedditScraperDB';
  private version = 1;
  private storeName = 'brandData';
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB connection
   * Why this matters: Sets up the database schema and ensures compatibility across browsers.
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('version', 'version', { unique: false });
        }
      };
    });
  }

  /**
   * Store data with automatic compression for large items
   * Why this matters: Handles large brand kit data efficiently with compression.
   */
  async setItem(key: string, data: any): Promise<{ success: boolean; error?: string; compressed?: boolean }> {
    try {
      if (!this.db) await this.init();

      const serialized = JSON.stringify(data);
      const sizeKB = new Blob([serialized]).size / 1024;
      
      let finalData = serialized;
      let compressed = false;

      // Compress if data is larger than 100KB
      if (sizeKB > 100) {
        try {
          // Use browser's built-in compression if available
          if ('CompressionStream' in window) {
            const stream = new CompressionStream('gzip');
            const writer = stream.writable.getWriter();
            const reader = stream.readable.getReader();
            
            writer.write(new TextEncoder().encode(serialized));
            writer.close();
            
            const chunks: Uint8Array[] = [];
            let done = false;
            
            while (!done) {
              const { value, done: readerDone } = await reader.read();
              done = readerDone;
              if (value) chunks.push(value);
            }
            
            const compressedArray = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
            let offset = 0;
            for (const chunk of chunks) {
              compressedArray.set(chunk, offset);
              offset += chunk.length;
            }
            
            finalData = Array.from(compressedArray).join(',');
            compressed = true;
          }
        } catch (compressionError) {
          console.warn('Compression failed, storing uncompressed:', compressionError);
        }
      }

      const item: StorageItem = {
        id: key,
        data: finalData,
        timestamp: Date.now(),
        version: 1,
        compressed
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve({ success: true, compressed });
        request.onerror = () => resolve({ 
          success: false, 
          error: `IndexedDB write failed: ${request.error?.message}` 
        });
      });
    } catch (error) {
      return { 
        success: false, 
        error: `Storage failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Retrieve data with automatic decompression
   * Why this matters: Seamlessly handles compressed and uncompressed data.
   */
  async getItem(key: string): Promise<any> {
    try {
      if (!this.db) await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = async () => {
          const item = request.result as StorageItem;
          if (!item) {
            resolve(null);
            return;
          }

          let data = item.data;

          // Decompress if needed
          if (item.compressed && 'DecompressionStream' in window) {
            try {
              const compressedArray = new Uint8Array(data.split(',').map(Number));
              const stream = new DecompressionStream('gzip');
              const writer = stream.writable.getWriter();
              const reader = stream.readable.getReader();

              writer.write(compressedArray);
              writer.close();

              const chunks: Uint8Array[] = [];
              let done = false;

              while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) chunks.push(value);
              }

              const decompressedArray = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
              let offset = 0;
              for (const chunk of chunks) {
                decompressedArray.set(chunk, offset);
                offset += chunk.length;
              }

              data = new TextDecoder().decode(decompressedArray);
            } catch (decompressionError) {
              console.warn('Decompression failed, using raw data:', decompressionError);
            }
          }

          try {
            resolve(JSON.parse(data));
          } catch (parseError) {
            console.error('Failed to parse stored data:', parseError);
            resolve(null);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  /**
   * Remove item from storage
   * Why this matters: Provides cleanup functionality for managing storage space.
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      if (!this.db) await this.init();

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Failed to remove item:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   * Why this matters: Provides insights into storage usage for monitoring and optimization.
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      if (!this.db) await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result as StorageItem[];
          
          let usedBytes = 0;
          let oldestItem = Date.now();
          let newestItem = 0;

          items.forEach(item => {
            usedBytes += new Blob([JSON.stringify(item)]).size;
            oldestItem = Math.min(oldestItem, item.timestamp);
            newestItem = Math.max(newestItem, item.timestamp);
          });

          // Estimate available bytes (IndexedDB typically allows 50% of disk space)
          const availableBytes = 1024 * 1024 * 1024 * 10; // Conservative 10GB estimate

          resolve({
            usedBytes,
            availableBytes,
            itemCount: items.length,
            oldestItem,
            newestItem
          });
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        usedBytes: 0,
        availableBytes: 1024 * 1024 * 1024 * 10,
        itemCount: 0,
        oldestItem: Date.now(),
        newestItem: Date.now()
      };
    }
  }

  /**
   * Clean up old items to free space
   * Why this matters: Automatic maintenance to prevent storage bloat.
   */
  async cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      if (!this.db) await this.init();

      const cutoffTime = Date.now() - maxAge;
      let deletedCount = 0;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            // Skip important items (brand_kit, voc_kit)
            if (!cursor.value.id.includes('_draft') && !cursor.value.id.includes('_temp')) {
              cursor.continue();
              return;
            }

            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const indexedDBManager = new IndexedDBManager();

/**
 * Hybrid storage utility that uses IndexedDB for large data and localStorage for small data
 * Why this matters: Provides the best of both worlds - fast access for small data, unlimited capacity for large data.
 */
export class HybridStorage {
  private static readonly LARGE_DATA_THRESHOLD = 50 * 1024; // 50KB

  /**
   * Intelligently store data based on size
   */
  static async setItem(key: string, data: any): Promise<{ success: boolean; error?: string; method?: 'localStorage' | 'indexedDB'; compressed?: boolean }> {
    const serialized = JSON.stringify(data);
    const sizeBytes = new Blob([serialized]).size;

    // Use localStorage for small data
    if (sizeBytes < this.LARGE_DATA_THRESHOLD) {
      try {
        localStorage.setItem(key, serialized);
        return { success: true, method: 'localStorage' };
      } catch (error) {
        // Fallback to IndexedDB if localStorage fails
        const result = await indexedDBManager.setItem(key, data);
        return { ...result, method: 'indexedDB' };
      }
    }

    // Use IndexedDB for large data
    const result = await indexedDBManager.setItem(key, data);
    return { ...result, method: 'indexedDB' };
  }

  /**
   * Retrieve data from appropriate storage
   */
  static async getItem(key: string): Promise<any> {
    // Try localStorage first (faster)
    try {
      const localData = localStorage.getItem(key);
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.warn('localStorage read failed, trying IndexedDB:', error);
    }

    // Try IndexedDB
    return await indexedDBManager.getItem(key);
  }

  /**
   * Remove from both storages
   */
  static async removeItem(key: string): Promise<boolean> {
    let success = true;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage remove failed:', error);
      success = false;
    }

    const indexedDBSuccess = await indexedDBManager.removeItem(key);
    return success && indexedDBSuccess;
  }

  /**
   * Get comprehensive storage statistics
   */
  static async getStorageStats(): Promise<{
    localStorage: { used: number; total: number; percentage: number };
    indexedDB: StorageStats;
    recommendation: string;
  }> {
    // localStorage stats
    let localStorageUsed = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageUsed += localStorage[key].length;
        }
      }
    } catch (error) {
      console.warn('Failed to calculate localStorage usage:', error);
    }

    const localStorageTotal = 5 * 1024 * 1024; // 5MB typical limit
    const localStoragePercentage = Math.round((localStorageUsed / localStorageTotal) * 100);

    // IndexedDB stats
    const indexedDBStats = await indexedDBManager.getStorageStats();

    // Enterprise-focused recommendation
    let recommendation = 'Enterprise Storage Ready';
    if (indexedDBStats.usedBytes > 0) {
      recommendation = 'Enterprise Storage Active - Unlimited Capacity';
    } else if (localStoragePercentage > 90) {
      recommendation = 'Enterprise Storage Will Activate Automatically';
    }

    return {
      localStorage: {
        used: Math.round(localStorageUsed / 1024),
        total: Math.round(localStorageTotal / 1024),
        percentage: localStoragePercentage
      },
      indexedDB: indexedDBStats,
      recommendation
    };
  }
}
