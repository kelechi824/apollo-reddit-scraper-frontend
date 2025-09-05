/**
 * StorageManager - Centralized localStorage management with quota handling
 * Why this matters: Provides safe storage operations with automatic compression and fallback strategies
 */

export interface StorageNotification {
  type: 'compressed' | 'minimal' | null;
  show: boolean;
}

export class StorageManager {
  private static readonly ANALYSIS_BACKUP_KEY = 'apollo-analysis-backup';
  private static readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit

  /**
   * Save analysis backup with automatic compression and fallback
   * Why this matters: Ensures data persistence across page refreshes while handling storage constraints
   */
  static saveAnalysisBackup(backupData: any): boolean {
    try {
      const dataString = JSON.stringify(backupData);
      
      // Check if data is too large (estimate ~4MB limit to be safe)
      if (dataString.length > this.MAX_STORAGE_SIZE) {
        console.warn('Analysis data too large for localStorage, creating compressed backup');
        return this.saveCompressedBackup(backupData);
      } else {
        localStorage.setItem(this.ANALYSIS_BACKUP_KEY, dataString);
        return true;
      }
    } catch (error) {
      console.error('Failed to save analysis backup to localStorage:', error);
      return this.saveMinimalBackup(backupData);
    }
  }

  /**
   * Save compressed version of backup data
   * Why this matters: Reduces storage size while preserving essential data
   */
  private static saveCompressedBackup(backupData: any): boolean {
    try {
      const compressedBackup = {
        analyzedPosts: backupData.analyzedPosts.map((post: any) => ({
          id: post.id,
          title: post.title,
          subreddit: post.subreddit,
          created_utc: post.created_utc,
          score: post.score,
          comments: post.comments,
          permalink: post.permalink,
          url: post.url,
          author: post.author,
          // Keep only first 500 chars of content to save space
          content: post.content ? post.content.substring(0, 500) + (post.content.length > 500 ? '...' : '') : '',
          // Keep analysis but truncate long text
          analysis: {
            pain_point: post.analysis?.pain_point?.substring(0, 1000) || '',
            audience_insight: post.analysis?.audience_insight?.substring(0, 1000) || '',
            content_opportunity: post.analysis?.content_opportunity?.substring(0, 1000) || ''
          },
          has_comment_insights: post.has_comment_insights,
          comment_analysis: post.comment_analysis ? {
            total_comments_analyzed: post.comment_analysis.total_comments_analyzed,
            keyword_mentions: post.comment_analysis.keyword_mentions,
            brand_sentiment_breakdown: post.comment_analysis.brand_sentiment_breakdown,
            helpfulness_sentiment_breakdown: post.comment_analysis.helpfulness_sentiment_breakdown,
            // Keep only first 5 comments to save space
            top_comments: post.comment_analysis.top_comments?.slice(0, 5) || [],
            key_themes: post.comment_analysis.key_themes?.slice(0, 10) || []
          } : undefined
        })),
        workflowId: backupData.workflowId,
        totalFound: backupData.totalFound,
        keywords: backupData.keywords,
        patternAnalysis: backupData.patternAnalysis ? {
          ...backupData.patternAnalysis,
          // Compress pattern analysis
          overall_summary: {
            ...backupData.patternAnalysis.overall_summary,
            community_narrative: backupData.patternAnalysis.overall_summary.community_narrative?.substring(0, 1000) || ''
          },
          categories: backupData.patternAnalysis.categories.map((cat: any) => ({
            ...cat,
            description: cat.description.substring(0, 500) + (cat.description.length > 500 ? '...' : ''),
            posts: cat.posts.slice(0, 10) // Keep only first 10 posts per category
          }))
        } : null,
        _compressed: true // Flag to indicate this is compressed data
      };
      
      localStorage.setItem(this.ANALYSIS_BACKUP_KEY, JSON.stringify(compressedBackup));
      return true;
    } catch (error) {
      console.error('Failed to save compressed backup:', error);
      return this.saveMinimalBackup(backupData);
    }
  }

  /**
   * Save minimal backup with just essential navigation data
   * Why this matters: Last resort fallback that preserves core functionality
   */
  private static saveMinimalBackup(backupData: any): boolean {
    try {
      // Clear any existing backup first
      localStorage.removeItem(this.ANALYSIS_BACKUP_KEY);
      
      // Create minimal backup with just essential navigation data
      const minimalBackup = {
        analyzedPosts: backupData.analyzedPosts.map((post: any) => ({
          id: post.id,
          title: post.title,
          subreddit: post.subreddit,
          created_utc: post.created_utc,
          score: post.score,
          comments: post.comments,
          permalink: post.permalink,
          url: post.url,
          author: post.author,
          content: post.content || '',
          // Preserve analysis for DigDeeperModal
          analysis: {
            pain_point: post.analysis?.pain_point || '',
            audience_insight: post.analysis?.audience_insight || '',
            content_opportunity: post.analysis?.content_opportunity || '',
            urgency_level: post.analysis?.urgency_level || 'medium'
          }
        })),
        workflowId: backupData.workflowId,
        totalFound: backupData.totalFound,
        keywords: backupData.keywords,
        patternAnalysis: null,
        _minimal: true // Flag to indicate this is minimal data
      };
      
      localStorage.setItem(this.ANALYSIS_BACKUP_KEY, JSON.stringify(minimalBackup));
      console.warn('Saved minimal analysis backup due to storage constraints');
      return false; // Return false to trigger notification
    } catch (minimalError) {
      console.error('Failed to save even minimal backup:', minimalError);
      return false;
    }
  }

  /**
   * Get analysis backup from localStorage
   * Why this matters: Retrieves persisted data for page refresh recovery
   */
  static getAnalysisBackup(): any | null {
    try {
      const stored = localStorage.getItem(this.ANALYSIS_BACKUP_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the structure before using
        if (parsed && Array.isArray(parsed.analyzedPosts) && parsed.workflowId) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to restore analysis backup:', error);
      localStorage.removeItem(this.ANALYSIS_BACKUP_KEY);
    }
    return null;
  }

  /**
   * Clear analysis backup
   * Why this matters: Cleanup when starting fresh analysis
   */
  static clearAnalysisBackup(): void {
    localStorage.removeItem(this.ANALYSIS_BACKUP_KEY);
  }
}
