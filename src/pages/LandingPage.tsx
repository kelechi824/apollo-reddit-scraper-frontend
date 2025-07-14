import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Target, Users, Menu, X, ChevronRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Add responsive styles
  React.useEffect(() => {
    const style = document.createElement('style');
          style.textContent = `
        @media (min-width: 48.0625rem) {
          body .landing-page .apollo-hero-cta .apollo-btn-primary.btn-large,
          body .landing-page .apollo-hero-cta .apollo-btn-primary {
            padding: calc(1rem + 0.125rem) calc(2rem + 0.125rem) !important;
            min-height: auto !important;
          }
        }
              @media (max-width: 48rem) {
          body .landing-page .apollo-hero-cta .apollo-btn-primary.btn-large,
          body .landing-page .apollo-hero-cta .apollo-btn-primary {
            padding: 0.75rem 1rem !important;
            min-height: auto !important;
            max-width: 37.5rem !important;
            min-width: auto !important;
            width: auto !important;
          }
          body .apollo-mobile-start-btn {
            padding: 0.75rem 0.5rem !important;
          }
        }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  /**
   * Handle body scroll lock when mobile menu is open
   * Why this matters: Prevents background scrolling when mobile menu overlay is active
   */
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  /**
   * Toggle mobile menu visibility
   * Why this matters: Provides mobile users with access to navigation in a standard slide-in pattern
   */
  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    } else {
      setIsMobileMenuOpen(true);
      setIsClosing(false);
    }
  };

  /**
   * Close mobile menu with animation
   * Why this matters: Provides smooth exit animation for better UX
   */
  const closeMobileMenu = () => {
    setIsClosing(true);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  return (
    <div className="landing-page">
      {/* Header - matching app page */}
      <header>
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="apollo-logo-header">
              <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
            </Link>
          </div>
          
          {/* Header Actions */}
          <div className="header-actions">
            <a href="#" className="header-signup-btn">Sign up for free</a>
            
            {/* Mobile Hamburger Menu Button - Right aligned on mobile */}
            <button 
              className="mobile-menu-toggle mobile-only"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className={`mobile-menu-overlay mobile-only ${isClosing ? 'closing' : ''}`} 
          onClick={closeMobileMenu}
        >
          <div 
            className={`mobile-menu-content ${isClosing ? 'closing' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Landing page mobile menu content */}
            <div className="landing-mobile-menu">
              <div className="nav-section">
                {/* Start Free Analysis Button in Mobile Menu */}
                <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                  <Link 
                    to="/app" 
                    className="apollo-mobile-start-btn"
                    onClick={closeMobileMenu}
                    style={{
                      display: 'inline-block',
                      padding: '0.5rem 2rem',
                      backgroundColor: '#EBF212',
                      color: '#000',
                      textDecoration: 'none',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      border: '0.125rem solid #EBF212',
                      minWidth: '12.5rem',
                      width: 'auto'
                    }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#d4d41a';
                    e.currentTarget.style.borderColor = '#d4d41a';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#EBF212';
                    e.currentTarget.style.borderColor = '#EBF212';
                  }}
                >
                  Start free analysis
                </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apollo-style Hero Section */}
      <div className="apollo-hero-section">
        <div className="apollo-hero-container">
          <h1 className="apollo-hero-title">
            Reddit Prospecting & Content Creation Tool
          </h1>
          
          <p className="apollo-hero-subtitle">
            Turn Reddit discussions into actionable business intelligence. Discover customer pain points, buying signals, and content opportunities—then transform insights into compelling content with AI.
          </p>
          
          <div className="apollo-hero-cta">
            <Link 
              to="/app" 
              className="apollo-btn-primary btn-large"
              style={{
                maxWidth: window.innerWidth <= 768 ? '25rem' : 'auto',
                width: 'auto'
              }}
            >
              Start free analysis
            </Link>
          </div>
          
          <div className="apollo-social-proof">
            <div className="apollo-stars">
              ⭐ ⭐ ⭐ ⭐ ⭐
            </div>
            <span className="apollo-rating">4.8/5 based on 2,500+ analyses | Trusted by businesses</span>
          </div>
        </div>
      </div>

      {/* Company Logos Section */}
      <div className="apollo-logos-section">
        <div className="apollo-logos-container">
          <p className="apollo-logos-text">Trusted by businesses worldwide</p>
                     <div className="apollo-logos-grid">
             <div className="apollo-logo-item">AUTODESK</div>
             <div className="apollo-logo-item">Dolby</div>
             <div className="apollo-logo-item">Veeva</div>
             <div className="apollo-logo-item">Redis</div>
             <div className="apollo-logo-item">CYERA</div>
             <div className="apollo-logo-item">docusign</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 