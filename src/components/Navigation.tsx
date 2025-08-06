import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Settings, BarChart3, BookOpen, FileText, PenTool, TrendingUp, Headphones, Monitor, ChevronRight, Users, Target } from 'lucide-react';
import { FEATURE_FLAGS, FeatureFlags } from '../utils/featureFlags';

interface NavigationProps {
  onItemClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onItemClick }) => {
  const [showBlogSubMenu, setShowBlogSubMenu] = useState(false);

  /**
   * Handle Blog Creator hover/click to show sub-menu
   * Why this matters: Provides access to blog history via hover/click interaction
   */
  const handleBlogCreatorInteraction = (show: boolean) => {
    setShowBlogSubMenu(show);
  };

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
          
          <div 
            className="nav-item-with-submenu"
            onMouseEnter={() => handleBlogCreatorInteraction(true)}
            onMouseLeave={() => handleBlogCreatorInteraction(false)}
          >
            <NavLink 
              to="/blog-creator" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onItemClick}
            >
              <PenTool className="nav-icon" />
              Blog Creator
              <ChevronRight className={`nav-submenu-icon ${showBlogSubMenu ? 'rotated' : ''}`} />
            </NavLink>
            
            {showBlogSubMenu && (
              <div className="nav-submenu">
                <NavLink 
                  to="/blog-history" 
                  className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                  onClick={onItemClick}
                >
                  <Clock className="nav-icon" />
                  Blogs History
                </NavLink>
              </div>
            )}
          </div>
          
          {FEATURE_FLAGS.showCRO && (
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
          
          {FEATURE_FLAGS.showLandingPageAnalyzer && (
            <NavLink 
              to="/landing-page-analyzer" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onItemClick}
            >
              <Monitor className="nav-icon" />
              Landing Page CRO Analyzer
            </NavLink>
          )}
          
          <NavLink 
            to="/brand-kit" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <BookOpen className="nav-icon" />
            Brand Kit
          </NavLink>
          
          <NavLink 
            to="/cta-creator" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <Target className="nav-icon" />
            CTA Creator
          </NavLink>
          
          <NavLink 
            to="/voc-kit" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <Users className="nav-icon" />
            VoC Kit
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

      {/* Sub-menu Styles */}
      <style>
        {`
          .nav-item-with-submenu {
            position: relative;
          }

          .nav-submenu-icon {
            width: 1rem;
            height: 1rem;
            margin-left: auto;
            transition: transform 0.2s ease;
          }

          .nav-submenu-icon.rotated {
            transform: rotate(90deg);
          }

          .nav-submenu {
            margin-left: 1rem;
            border-left: 2px solid #e5e7eb;
            padding-left: 0.75rem;
            margin-top: 0.5rem;
            animation: slideDown 0.2s ease-out;
          }

          .nav-submenu-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: #6b7280;
            text-decoration: none;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
          }

          .nav-submenu-item:hover {
            background-color: #f3f4f6;
            color: #111827;
          }

          .nav-submenu-item.active {
            background-color: #f3f4f6;
            color: #111827;
            font-weight: 600;
          }

          .nav-submenu-item .nav-icon {
            width: 1rem;
            height: 1rem;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-0.5rem);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Mobile-specific styles */
          @media (max-width: 768px) {
            .nav-item-with-submenu {
              /* On mobile, use click instead of hover */
            }
          }
        `}
      </style>
    </nav>
  );
};

export default Navigation; 