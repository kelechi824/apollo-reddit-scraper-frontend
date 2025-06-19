import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        {/* Header */}
        <header>
          <div className="header-container">
            <div className="apollo-logo-header">
              <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
            </div>
          </div>
        </header>

        {/* Main Headline Section */}
        <div className="main-headline">
          <h1 className="main-title">Reddit Content Analysis</h1>
          <p className="main-subtitle">
            Discover pain points, audience insights, and content opportunities from Reddit discussions with AI-powered analysis
          </p>
        </div>

        {/* Main Layout */}
        <div className="main-layout">
          {/* Left Navigation */}
          <Navigation />

          {/* Page Content */}
          <div className="page-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
