import React from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Settings, BarChart3, BookOpen, FileText, PenTool, TrendingUp, Headphones, Monitor } from 'lucide-react';

interface FeatureFlags {
  showCRO: boolean;
  showGongAnalysis: boolean;
  showLandingPageAnalyzer: boolean;
  showBlogCreator: boolean;
  showPlaybooksCreator: boolean;
  showBrandKit: boolean;
}

interface NavigationProps {
  onItemClick?: () => void;
  featureFlags?: FeatureFlags;
}

const Navigation: React.FC<NavigationProps> = ({ onItemClick, featureFlags }) => {
  return (
    <nav className="navigation">
      <div className="nav-menu">
        <div className="nav-section">
          <div className="nav-section-title">Tools</div>
          <NavLink 
            to="/app" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <BarChart3 className="nav-icon" />
            Analysis
          </NavLink>
          
          <NavLink 
            to="/playbooks-creator" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <FileText className="nav-icon" />
            Playbooks Creator
          </NavLink>
          
          <NavLink 
            to="/blog-creator" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <PenTool className="nav-icon" />
            Blog Creator
          </NavLink>
          
          {featureFlags?.showCRO && (
            <NavLink 
              to="/cro" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onItemClick}
            >
              <TrendingUp className="nav-icon" />
              Conversion Rate Optimizer
            </NavLink>
          )}
          
          <NavLink 
            to="/gong-analysis" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <Headphones className="nav-icon" />
            Gong Call Analyzer
          </NavLink>
          
          <NavLink 
            to="/landing-page-analyzer" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <Monitor className="nav-icon" />
            Landing Page CRO Analyzer
          </NavLink>
          
          <NavLink 
            to="/brand-kit" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <BookOpen className="nav-icon" />
            Brand Kit
          </NavLink>
          
          <NavLink 
            to="/history" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <Clock className="nav-icon" />
            History
          </NavLink>
          
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <Settings className="nav-icon" />
            Settings
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 