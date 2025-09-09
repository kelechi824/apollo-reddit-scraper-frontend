/**
 * UpdateNotification Component
 * 
 * Why this matters: This is the actual notification that appears in the lower right
 * corner when updates are available. It provides a clean, non-intrusive way to
 * inform users about new features and fixes, with a clear call-to-action to refresh.
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

interface UpdateNotificationProps {
  isVisible: boolean;
  summary: string;
  commits: GitHubCommit[];
  onRefresh: () => void;
  onDismiss: () => void;
}

/**
 * Update Notification Toast Component
 * Why this matters: This component appears in the lower right corner (like many SaaS apps)
 * to notify users of available updates. It's designed to be non-intrusive but noticeable,
 * with Apollo branding and smooth animations.
 */
const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  isVisible,
  summary,
  commits,
  onRefresh,
  onDismiss
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation states
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Small delay to trigger entrance animation
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    // Return undefined for the else case
    return undefined;
  }, [isVisible]);

  /**
   * Handle refresh action
   * Why this matters: When users click refresh, we want to perform a hard reload
   * to ensure they get the absolute latest version, clearing any cached assets.
   */
  const handleRefresh = () => {
    // Dismiss the notification first
    onDismiss();
    
    // Small delay to let the dismiss animation complete
    setTimeout(() => {
      // Hard refresh to get latest version
      window.location.reload();
    }, 200);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Professional Notification - Lower Right */}
      <div 
        className={`
          transform transition-all duration-300 ease-out
          ${isAnimating ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
        `}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          width: '280px',
          maxWidth: 'calc(100vw - 40px)',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Close button - top right */}
        <div 
          style={{
            padding: '16px 20px 0 20px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onDismiss}
            className="transition-colors"
            style={{
              color: '#9CA3AF',
              backgroundColor: 'transparent',
              border: 'none',
              padding: '4px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#6B7280';
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9CA3AF';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Dismiss notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div 
          style={{
            padding: '8px 20px 16px 20px',
            textAlign: 'center'
          }}
        >
          <h3 
            className="font-semibold text-gray-900"
            style={{
              fontSize: '16px',
              lineHeight: '1.4',
              margin: 0
            }}
          >
            New version available!
          </h3>
        </div>

        {/* Action Button */}
        <div 
          style={{
            padding: '0 20px 20px 20px',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <button
            onClick={handleRefresh}
            className="font-semibold transition-all duration-200 focus:outline-none"
            style={{
              backgroundColor: '#EBF212',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '14px',
              lineHeight: '1.4',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E5ED0F';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#EBF212';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #EBF212';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            Update
          </button>
        </div>
      </div>
    </>
  );
};

export default UpdateNotification;
