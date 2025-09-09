/**
 * useUpdateChecker Hook
 * 
 * Why this matters: This hook is the core of our update notification system.
 * It periodically checks GitHub for new commits, manages notification state,
 * and provides methods to dismiss updates. It runs in the background while
 * users are using the app to detect new deployments.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLatestCommits, filterMeaningfulCommits, getCommitSummary } from '../services/githubApi';

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { 
      date: string;
      name: string;
    };
  };
  html_url: string;
}

interface UpdateCheckerState {
  hasUpdate: boolean;
  latestCommits: GitHubCommit[];
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
  summary: string;
}

interface UpdateCheckerOptions {
  checkInterval?: number; // in milliseconds, default 5 minutes
  enabled?: boolean; // allow users to disable checking
  maxCommitsToShow?: number; // limit commits shown in notification
}

/**
 * Custom hook for checking GitHub repository updates
 * Why this matters: Centralizes all update checking logic in a reusable hook
 * that can be used across components. Handles polling, error states, and
 * localStorage persistence automatically.
 */
export const useUpdateChecker = (options: UpdateCheckerOptions = {}) => {
  const {
    checkInterval = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    maxCommitsToShow = 5
  } = options;

  const [state, setState] = useState<UpdateCheckerState>({
    hasUpdate: false,
    latestCommits: [],
    isChecking: false,
    lastChecked: null,
    error: null,
    summary: 'No updates available'
  });

  // Use ref to store interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get last known commit from localStorage
  const getLastKnownCommit = useCallback((): string | null => {
    try {
      return localStorage.getItem('apollo-last-known-commit');
    } catch (error) {
      console.warn('Failed to read last known commit from localStorage:', error);
      return null;
    }
  }, []);

  // Save last known commit to localStorage
  const setLastKnownCommit = useCallback((sha: string) => {
    try {
      localStorage.setItem('apollo-last-known-commit', sha);
    } catch (error) {
      console.warn('Failed to save last known commit to localStorage:', error);
    }
  }, []);

  /**
   * Check for updates from GitHub API
   * Why this matters: This is the core function that fetches new commits
   * and determines if there are meaningful updates to notify users about.
   */
  const checkForUpdates = useCallback(async (force = false) => {
    if (!enabled && !force) return;

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const lastKnownCommit = getLastKnownCommit();
      const lastKnownDate = lastKnownCommit ? undefined : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours if no known commit
      
      console.log('Checking for updates...', { lastKnownCommit, lastKnownDate });
      
      // Fetch commits since last known commit or last 24 hours
      const allCommits = await fetchLatestCommits(lastKnownDate);
      const meaningfulCommits = filterMeaningfulCommits(allCommits);
      
      // Filter out commits we've already seen
      const newCommits = lastKnownCommit 
        ? meaningfulCommits.filter(commit => {
            // Find the index of the last known commit
            const lastKnownIndex = meaningfulCommits.findIndex(c => c.sha === lastKnownCommit);
            const currentIndex = meaningfulCommits.findIndex(c => c.sha === commit.sha);
            // Only include commits that are newer (lower index) than the last known commit
            return lastKnownIndex === -1 || currentIndex < lastKnownIndex;
          })
        : meaningfulCommits;

      const hasNewUpdates = newCommits.length > 0;
      const commitsToShow = newCommits.slice(0, maxCommitsToShow);
      const summary = getCommitSummary(commitsToShow);

      setState(prev => ({
        ...prev,
        hasUpdate: hasNewUpdates,
        latestCommits: commitsToShow,
        isChecking: false,
        lastChecked: new Date(),
        error: null,
        summary
      }));

      console.log('Update check complete:', {
        totalCommits: allCommits.length,
        meaningfulCommits: meaningfulCommits.length,
        newCommits: newCommits.length,
        hasUpdate: hasNewUpdates
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to check for updates:', error);
      
      setState(prev => ({
        ...prev,
        isChecking: false,
        error: errorMessage,
        lastChecked: new Date()
      }));
    }
  }, [enabled, getLastKnownCommit, maxCommitsToShow]);

  /**
   * Dismiss the current update notification
   * Why this matters: When users click the notification or dismiss it,
   * we need to mark the current commits as "seen" so they don't get
   * notified about the same commits again.
   */
  const dismissUpdate = useCallback(() => {
    if (state.latestCommits.length > 0) {
      const latestSha = state.latestCommits[0].sha;
      setLastKnownCommit(latestSha);
      
      setState(prev => ({
        ...prev,
        hasUpdate: false,
        latestCommits: [],
        summary: 'No updates available'
      }));

      console.log('Update dismissed, marked commit as seen:', latestSha);
    }
  }, [state.latestCommits, setLastKnownCommit]);

  /**
   * Manually trigger an update check
   * Why this matters: Allows components to force a check when needed,
   * like when user clicks a "check now" button or when app gains focus.
   */
  const forceCheck = useCallback(() => {
    checkForUpdates(true);
  }, [checkForUpdates]);

  /**
   * Reset the update checker state
   * Why this matters: Useful for testing or when user wants to reset
   * their notification preferences.
   */
  const reset = useCallback(() => {
    try {
      localStorage.removeItem('apollo-last-known-commit');
      setState({
        hasUpdate: false,
        latestCommits: [],
        isChecking: false,
        lastChecked: null,
        error: null,
        summary: 'No updates available'
      });
      console.log('Update checker reset');
    } catch (error) {
      console.warn('Failed to reset update checker:', error);
    }
  }, []);

  // Set up periodic checking
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkForUpdates();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(() => {
      checkForUpdates();
    }, checkInterval);

    // Cleanup interval on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, checkInterval, checkForUpdates]);

  // Check for updates when page becomes visible (user returns to tab)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, check for updates
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkForUpdates]);

  return {
    // State
    hasUpdate: state.hasUpdate,
    latestCommits: state.latestCommits,
    isChecking: state.isChecking,
    lastChecked: state.lastChecked,
    error: state.error,
    summary: state.summary,
    
    // Actions
    checkForUpdates: forceCheck,
    dismissUpdate,
    reset,
    
    // Configuration
    enabled,
    checkInterval
  };
};
