import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

const AppLayout: React.FC = () => {
  return (
    <div className="app-container">
      {/* Header */}
      <header>
        <div className="header-container">
          <Link to="/" className="apollo-logo-header">
            <img src="/Apollo_logo_transparent.png" alt="Apollo Logo" />
          </Link>
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
