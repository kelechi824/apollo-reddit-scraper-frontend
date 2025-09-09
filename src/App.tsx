import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './App.css';
import Navigation from './components/Navigation';
import UpdateNotificationSystem from './components/UpdateNotificationSystem';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import CROPage from './pages/CROPage';
import PlaybooksPage from './pages/PlaybooksPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import BrandKitPage from './pages/BrandKitPage';
import VoCKitPage from './pages/VoCKitPage';
import CTACreatorPage from './pages/CTACreatorPage';
import BlogCreatorPage from './pages/BlogCreatorPage';
import GongAnalysisPage from './pages/GongAnalysisPage';
import LandingPageAnalyzer from './pages/LandingPageAnalyzer';
import BlogHistoryPage from './pages/BlogHistoryPage';
import CompetitorConquestingPage from './pages/CompetitorConquestingPage';
import SitemapPage from './pages/SitemapPage';
import SitemapPageEnhanced from './pages/SitemapPageEnhanced';
import SitemapDetailPage from './pages/SitemapDetailPage';
import UncoverPage from './pages/UncoverPage';
import { FEATURE_FLAGS, FeatureFlags } from './utils/featureFlags';

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
      {/* Main Layout - Full viewport without header */}
      <div className="main-layout sidebar-expanded">
        {/* Left Navigation */}
        <div className="navigation-container">
          <Navigation />
        </div>

        {/* Page Content */}
        <div className="page-content">
          <Routes>
            <Route path="/app" element={<AppPage />} />
            <Route path="/uncover" element={<UncoverPage />} />
            {FEATURE_FLAGS.showCRO && <Route path="/cro" element={<CROPage />} />}
            {FEATURE_FLAGS.showLandingPageAnalyzer && <Route path="/landing-page-analyzer" element={<LandingPageAnalyzer />} />}
            <Route path="/gong-analysis" element={<GongAnalysisPage />} />
            <Route path="/playbooks-creator" element={<PlaybooksPage />} />
            <Route path="/blog-creator" element={<BlogCreatorPage />} />
            <Route path="/competitor-conquesting" element={<CompetitorConquestingPage />} />
            <Route path="/blog-history" element={<BlogHistoryPage />} />
            <Route path="/brand-kit" element={<BrandKitPage />} />
            <Route path="/cta-creator" element={<CTACreatorPage />} />
            <Route path="/voc-kit" element={<VoCKitPage />} />
            <Route path="/knowledge-base/sitemap" element={<SitemapPageEnhanced />} />
            <Route path="/knowledge-base/sitemap-old" element={<SitemapPage />} />
            <Route path="/knowledge-base/sitemap/details/:sitemapId" element={<SitemapDetailPage />} />
            <Route path="/reddit-analysis-history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>

      {/* Update Notification System - appears on all pages */}
      <UpdateNotificationSystem 
        enabled={true}
        checkInterval={5 * 60 * 1000} // 5 minutes
        maxCommitsToShow={5}
      />
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
