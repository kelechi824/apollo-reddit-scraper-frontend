import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLinkHoverControlsReturn {
  targetLink: HTMLAnchorElement | null;
  isHovering: boolean;
  handleLinkHover: (event: MouseEvent) => void;
  handleLinkLeave: (event: MouseEvent) => void;
  removeLink: (link: HTMLAnchorElement) => void;
  openLink: (url: string) => void;
}

/**
 * Custom hook for managing link hover controls in generated content
 * Why this matters: Provides interactive controls for internal links without cluttering the UI
 */
export const useLinkHoverControls = (
  contentRef: React.RefObject<HTMLElement | null>
): UseLinkHoverControlsReturn => {
  const [targetLink, setTargetLink] = useState<HTMLAnchorElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle mouse enter on links
   * Why this matters: Shows hover controls when user hovers over internal links
   */
  const handleLinkHover = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Show controls for all links that are apollo.io links (internal links)
    if (target.tagName === 'A') {
      const link = target as HTMLAnchorElement;
      const href = link.href;
      
      // Check if it's an apollo.io link (internal link)
      if (href && (href.includes('apollo.io') && !href.includes('sign-up'))) {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        
        // Small delay to prevent flickering
        hoverTimeoutRef.current = setTimeout(() => {
          setTargetLink(link);
          setIsHovering(true);
        }, 150);
      }
    }
  }, []);

  /**
   * Handle mouse leave from links
   * Why this matters: Hides hover controls when user stops hovering
   */
  const handleLinkLeave = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    if (target.tagName === 'A') {
      // Clear any pending hover timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      // Delay hiding to allow moving to the control tooltip
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovering(false);
        setTargetLink(null);
      }, 300);
    }
  }, []);

  /**
   * Remove a link by converting it back to plain text
   * Why this matters: Allows users to remove unwanted internal links
   */
  const removeLink = useCallback((link: HTMLAnchorElement) => {
    if (link && link.parentNode) {
      // Create a text node with the link's text content
      const textNode = document.createTextNode(link.textContent || '');
      
      // Replace the link with the text node
      link.parentNode.replaceChild(textNode, link);
      
      // Hide the controls
      setTargetLink(null);
      setIsHovering(false);
      
      console.log('🔗 Internal link removed:', link.textContent);
    }
  }, []);

  /**
   * Open a link in a new tab
   * Why this matters: Provides easy access to linked content
   */
  const openLink = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    console.log('🔗 Internal link opened:', url);
  }, []);

  /**
   * Set up event listeners for link hover detection
   * Why this matters: Automatically detects when users hover over internal links
   */
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    // Add event listeners for mouseover and mouseout
    contentElement.addEventListener('mouseover', handleLinkHover);
    contentElement.addEventListener('mouseout', handleLinkLeave);

    // Cleanup function
    return () => {
      contentElement.removeEventListener('mouseover', handleLinkHover);
      contentElement.removeEventListener('mouseout', handleLinkLeave);
      
      // Clear any pending timeouts
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [handleLinkHover, handleLinkLeave, contentRef]);

  /**
   * Enhanced link detection for internal apollo.io links
   * Why this matters: Ensures all apollo.io links have proper target attributes
   */
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    // Find all apollo.io links and ensure they open in new tabs
    const links = contentElement.querySelectorAll('a[href]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.includes('apollo.io') && !link.getAttribute('target')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }, [contentRef]);

  return {
    targetLink,
    isHovering,
    handleLinkHover,
    handleLinkLeave,
    removeLink,
    openLink
  };
};
