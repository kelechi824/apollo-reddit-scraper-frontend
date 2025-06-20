import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Clock, Settings } from 'lucide-react';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">


      <div className="nav-menu">
        <NavLink 
          to="/app" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Home style={{width: '1.25rem', height: '1.25rem'}} />
          Analysis
        </NavLink>
        
        <NavLink 
          to="/history" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Clock style={{width: '1.25rem', height: '1.25rem'}} />
          History
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings style={{width: '1.25rem', height: '1.25rem'}} />
          Settings
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation; 