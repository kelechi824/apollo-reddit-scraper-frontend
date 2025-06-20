import React from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Settings, BarChart3 } from 'lucide-react';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <div className="nav-menu">
        <div className="nav-section">
          <div className="nav-section-title">Platform</div>
          <NavLink 
            to="/app" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <BarChart3 className="nav-icon" />
            Analysis
          </NavLink>
          
          <NavLink 
            to="/history" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Clock className="nav-icon" />
            History
          </NavLink>
          
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
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