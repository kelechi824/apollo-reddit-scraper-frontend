import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import BrandKitPage from './pages/BrandKitPage';

const AppLayout: React.FC = () => {
  return (
    <div className="app-container">
      {/* Header */}
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

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Navigation */}
        <Navigation />

        {/* Page Content */}
        <div className="page-content">
          <Routes>
            <Route path="/app" element={<AppPage />} />
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
