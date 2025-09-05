/**
 * Debug utilities for localStorage monitoring
 * Why this matters: Helps developers monitor and debug storage usage issues
 */

import { StorageManager } from './storageManager';

export class StorageDebug {
  /**
   * Log current storage usage to console
   * Why this matters: Provides visibility into storage consumption for debugging
   */
  static logStorageUsage(): void {
    const report = StorageManager.getUsageReport();
    const stats = StorageManager.getStorageStats();
    
    console.group('📊 Apollo Storage Usage Report');
    console.log('Total localStorage used:', (stats.used / 1024 / 1024).toFixed(2) + 'MB');
    console.log('Available space:', (stats.available / 1024 / 1024).toFixed(2) + 'MB');
    console.log('Usage percentage:', ((stats.used / stats.total) * 100).toFixed(1) + '%');
    
    console.group('Apollo-specific storage:');
    Object.entries(report).forEach(([key, size]) => {
      if (key !== 'TOTAL_USED' && key !== 'AVAILABLE') {
        console.log(`${key}:`, (size / 1024).toFixed(1) + 'KB');
      }
    });
    console.groupEnd();
    
    console.groupEnd();
  }

  /**
   * Clear all Apollo storage and log the action
   * Why this matters: Provides a way to reset storage during debugging
   */
  static clearAllStorage(): void {
    console.warn('🗑️ Clearing all Apollo storage data...');
    StorageManager.clearAll();
    console.log('✅ Storage cleared successfully');
    this.logStorageUsage();
  }

  /**
   * Test storage capacity by trying to store increasingly large data
   * Why this matters: Helps identify the actual storage limits in the current browser
   */
  static testStorageCapacity(): void {
    console.group('🧪 Testing localStorage capacity...');
    
    const testKey = 'apollo-capacity-test';
    let testSize = 1024; // Start with 1KB
    let maxSize = 0;
    
    try {
      while (testSize <= 10 * 1024 * 1024) { // Test up to 10MB
        const testData = 'x'.repeat(testSize);
        localStorage.setItem(testKey, testData);
        maxSize = testSize;
        console.log(`✅ Successfully stored ${(testSize / 1024 / 1024).toFixed(2)}MB`);
        testSize *= 2; // Double the size each time
      }
    } catch (error) {
      console.log(`❌ Failed at ${(testSize / 1024 / 1024).toFixed(2)}MB:`, error);
      console.log(`📏 Maximum successful size: ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    } finally {
      // Clean up test data
      localStorage.removeItem(testKey);
      console.groupEnd();
    }
  }

  /**
   * Monitor storage usage in real-time
   * Why this matters: Helps track storage consumption during app usage
   */
  static startStorageMonitoring(intervalMs: number = 5000): () => void {
    console.log('🔍 Starting storage monitoring...');
    
    const interval = setInterval(() => {
      const stats = StorageManager.getStorageStats();
      const usagePercent = (stats.used / stats.total) * 100;
      
      if (usagePercent > 80) {
        console.warn(`⚠️ Storage usage high: ${usagePercent.toFixed(1)}%`);
        this.logStorageUsage();
      }
    }, intervalMs);

    // Return cleanup function
    return () => {
      clearInterval(interval);
      console.log('🔍 Storage monitoring stopped');
    };
  }

  /**
   * Add storage debug methods to window for browser console access
   * Why this matters: Allows developers to debug storage issues from browser console
   */
  static addToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as any).apolloStorageDebug = {
        logUsage: () => this.logStorageUsage(),
        clearAll: () => this.clearAllStorage(),
        testCapacity: () => this.testStorageCapacity(),
        startMonitoring: (interval?: number) => this.startStorageMonitoring(interval),
        getReport: () => StorageManager.getUsageReport(),
        getStats: () => StorageManager.getStorageStats()
      };
      
      console.log('🔧 Apollo storage debug tools added to window.apolloStorageDebug');
      console.log('Available methods: logUsage(), clearAll(), testCapacity(), startMonitoring(), getReport(), getStats()');
    }
  }
}

// Auto-add to window in development
if (process.env.NODE_ENV === 'development') {
  StorageDebug.addToWindow();
}
