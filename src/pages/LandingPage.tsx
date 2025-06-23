import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Target, Users, Menu, X } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Close mobile menu when navigation item is clicked
   * Why this matters: Improves UX by automatically closing menu after navigation
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="landing-page">
      {/* Header - matching app page */}
      <header>
        <div className="header-container">
          <div className="header-left">
            {/* Mobile Hamburger Menu Button */}
            <button 
              className="mobile-menu-toggle mobile-only"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="apollo-logo-header">
              <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
            </Link>
            
            {/* Header Navigation */}
            <nav className="header-navigation">
              <a href="#" className="header-nav-item">Platform</a>
              <a href="#" className="header-nav-item">Roles</a>
              <a href="#" className="header-nav-item">Resources</a>
              <a href="#" className="header-nav-item">Pricing</a>
            </nav>
          </div>
          
          {/* Header Actions */}
          <div className="header-actions">
            <a href="#" className="header-demo-link desktop-only">Get a demo</a>
            <a href="#" className="header-login-btn">Log in</a>
            <a href="#" className="header-signup-btn">Sign up for free</a>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay mobile-only" onClick={closeMobileMenu}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            {/* Landing page mobile menu content */}
            <div className="landing-mobile-menu">
              <div className="nav-section">
                <div className="nav-section-title">Navigation</div>
                <a href="#" className="nav-item" onClick={closeMobileMenu}>
                  <span>Platform</span>
                </a>
                <a href="#" className="nav-item" onClick={closeMobileMenu}>
                  <span>Roles</span>
                </a>
                <a href="#" className="nav-item" onClick={closeMobileMenu}>
                  <span>Resources</span>
                </a>
                <a href="#" className="nav-item" onClick={closeMobileMenu}>
                  <span>Pricing</span>
                </a>
                <Link to="/app" className="nav-item" onClick={closeMobileMenu}>
                  <BarChart3 className="nav-icon" />
                  <span>Start Analysis</span>
                </Link>
              </div>
              <div className="mobile-menu-actions">
                <a href="#" className="mobile-action-btn" onClick={closeMobileMenu}>Get a demo</a>
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
            <Link to="/app" className="apollo-btn-primary btn-large">
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