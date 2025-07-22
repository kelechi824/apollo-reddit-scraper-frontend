import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './App.css';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import PlaybooksPage from './pages/PlaybooksPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import BrandKitPage from './pages/BrandKitPage';
import BlogCreatorPage from './pages/BlogCreatorPage';

const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
    <div className="app-container">
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="apollo-logo-header">
              <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
            </Link>
          </div>
          
          {/* Header Actions */}
          <div className="header-actions">
            <button className="header-signup-btn">Sign up for free</button>
            
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
            <Navigation onItemClick={closeMobileMenu} />
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Navigation */}
        <Navigation />

        {/* Page Content */}
        <div className="page-content">
          <Routes>
            <Route path="/app" element={<AppPage />} />
            <Route path="/playbooks-creator" element={<PlaybooksPage />} />
            <Route path="/blog-creator" element={<BlogCreatorPage />} />
            <Route path="/brand-kit" element={<BrandKitPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
};

export default App;
