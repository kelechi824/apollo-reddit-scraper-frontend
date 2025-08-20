import React, { useState, useEffect } from 'react';
import { ExternalLink, Unlink } from 'lucide-react';

interface LinkHoverControlsProps {
  targetLink: HTMLAnchorElement | null;
  onRemoveLink: (link: HTMLAnchorElement) => void;
  onOpenLink: (url: string) => void;
}

interface Position {
  x: number;
  y: number;
}

const LinkHoverControls: React.FC<LinkHoverControlsProps> = ({
  targetLink,
  onRemoveLink,
  onOpenLink
}) => {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Calculate position for hover controls
   * Why this matters: Positions the control tooltip near the hovered link
   */
  useEffect(() => {
    if (targetLink) {
      const rect = targetLink.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setPosition({
        x: rect.left + scrollLeft + (rect.width / 2),
        y: rect.top + scrollTop - 50 // Position above the link
      });
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [targetLink]);

  /**
   * Handle link removal
   * Why this matters: Allows users to remove unwanted internal links
   */
  const handleRemoveLink = () => {
    if (targetLink) {
      onRemoveLink(targetLink);
      setIsVisible(false);
    }
  };

  /**
   * Handle link opening
   * Why this matters: Provides easy access to open links in new tabs
   */
  const handleOpenLink = () => {
    if (targetLink) {
      onOpenLink(targetLink.href);
      setIsVisible(false);
    }
  };

  if (!isVisible || !targetLink) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
        backgroundColor: '#1f2937',
        color: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.5rem',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        zIndex: 1000,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #374151',
        fontSize: '0.875rem',
        minWidth: '120px',
        justifyContent: 'center'
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Arrow pointing down */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #1f2937'
        }}
      />
      
      <button
        onClick={handleOpenLink}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: 'transparent',
          border: '1px solid #4b5563',
          borderRadius: '0.25rem',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: '0.75rem',
          transition: 'background-color 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#374151';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Open in new tab"
      >
        <ExternalLink size={12} />
        <span>Open</span>
      </button>

      <button
        onClick={handleRemoveLink}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: 'transparent',
          border: '1px solid #dc2626',
          borderRadius: '0.25rem',
          color: '#fca5a5',
          cursor: 'pointer',
          fontSize: '0.75rem',
          transition: 'background-color 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#dc2626';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#fca5a5';
        }}
        title="Remove link"
      >
        <Unlink size={12} />
        <span>Remove</span>
      </button>
    </div>
  );
};

export default LinkHoverControls;
