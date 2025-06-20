import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Target, Users } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Header - matching app page */}
      <header>
        <div className="header-container">
          <div className="header-left">
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
            <a href="#" className="header-demo-link">Get a demo</a>
            <a href="#" className="header-login-btn">Log in</a>
            <a href="#" className="header-signup-btn">Sign up for free</a>
          </div>
        </div>
      </header>

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