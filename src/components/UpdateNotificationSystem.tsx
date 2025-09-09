/**
 * UpdateNotificationSystem Component
 * 
 * Why this matters: This is the complete integrated system that combines
 * the useUpdateChecker hook with the UpdateNotification UI component.
 * This is what will be used in the actual application to show real
 * update notifications to users.
 */

import React from 'react';
import { useUpdateChecker } from '../hooks/useUpdateChecker';
import UpdateNotification from './UpdateNotification';

interface UpdateNotificationSystemProps {
  enabled?: boolean;
  checkInterval?: number; // in milliseconds
  maxCommitsToShow?: number;
}

/**
 * Complete Update Notification System
 * Why this matters: This component provides the full update notification
 * experience by combining the update detection logic with the UI component.
 * It can be dropped into any page to provide automatic update notifications.
 */
const UpdateNotificationSystem: React.FC<UpdateNotificationSystemProps> = ({
  enabled = true,
  checkInterval = 5 * 60 * 1000, // 5 minutes default
  maxCommitsToShow = 5
}) => {
  const {
    hasUpdate,
    latestCommits,
    summary,
    dismissUpdate
  } = useUpdateChecker({
    enabled,
    checkInterval,
    maxCommitsToShow
  });

  /**
   * Handle refresh action
   * Why this matters: When users click "Refresh Now", we want to dismiss
   * the notification first, then perform a hard reload to ensure they get
   * the absolute latest version with no cached assets.
   */
  const handleRefresh = () => {
    // Dismiss the notification to mark commits as seen
    dismissUpdate();
    
    // Small delay to let the dismiss animation complete
    setTimeout(() => {
      // Hard refresh to get latest version
      window.location.reload();
    }, 200);
  };

  return (
    <UpdateNotification
      isVisible={hasUpdate}
      summary={summary}
      commits={latestCommits}
      onRefresh={handleRefresh}
      onDismiss={dismissUpdate}
    />
  );
};

export default UpdateNotificationSystem;
