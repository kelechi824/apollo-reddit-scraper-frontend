import React from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Settings, BarChart3, BookOpen, FileText } from 'lucide-react';

interface NavigationProps {
  onItemClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onItemClick }) => {
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