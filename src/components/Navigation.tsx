import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Settings, BarChart3, BookOpen, FileText, PenTool, TrendingUp, Headphones, Monitor, ChevronRight, Users, Target, MessageCircle, Workflow, Swords, Database, Map, Package, Brain } from 'lucide-react';
import { FEATURE_FLAGS, FeatureFlags } from '../utils/featureFlags';

interface NavigationProps {
  onItemClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onItemClick }) => {
  const [showBlogSubMenu, setShowBlogSubMenu] = useState(false);
  const [showRedditAgentsSubMenu, setShowRedditAgentsSubMenu] = useState(false);
  const [showKitsSection, setShowKitsSection] = useState(false);
  const [showKnowledgeBaseSection, setShowKnowledgeBaseSection] = useState(false);


  /**
   * Handle Blog Agents click to toggle sub-menu
   * Why this matters: Provides access to blog history via click interaction
   */
  const handleBlogAgentsInteraction = (show: boolean) => {
    setShowBlogSubMenu(show);
  };

  /**
   * Handle Reddit Agents click to toggle sub-menu
   * Why this matters: Provides access to analysis history via click interaction
   */
  const handleRedditAgentsInteraction = (show: boolean) => {
    setShowRedditAgentsSubMenu(show);
  };

  /**
   * Toggle Kits section visibility
   * Why this matters: Allows users to expand/collapse the Kits section for cleaner navigation
   */
  const toggleKitsSection = () => {
    setShowKitsSection(!showKitsSection);
  };

  /**
   * Toggle Knowledge Base section visibility
   * Why this matters: Allows users to expand/collapse the Knowledge Base section for cleaner navigation
   */
  const toggleKnowledgeBaseSection = () => {
    setShowKnowledgeBaseSection(!showKnowledgeBaseSection);
  };



  return (
    <nav className="navigation navigation-expanded">
      {/* Apollo Logo Section */}
      <div className="nav-logo-section">
        <div className="apollo-logo-container">
          <img src="/Apollo_logo_transparent.png" alt="Apollo" className="apollo-logo-full" />
        </div>
      </div>
      
      <div className="nav-menu">
        <div className="nav-section nav-section-main">
          <div 
            className="nav-item-with-submenu"
            onClick={() => handleRedditAgentsInteraction(!showRedditAgentsSubMenu)}
          >
            <div className="nav-item nav-item-unclickable">
              <MessageCircle className="nav-icon" />
              Reddit Agents
              <ChevronRight className={`nav-submenu-icon ${showRedditAgentsSubMenu ? 'rotated' : ''}`} />
            </div>
            
            {showRedditAgentsSubMenu && (
              <div className="nav-submenu">
                <NavLink 
                  to="/app" 
                  className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                  onClick={onItemClick}
                >
                  <BarChart3 className="nav-icon" />
                  Subreddit Analyzer
                </NavLink>
                <NavLink 
                  to="/reddit-analysis-history" 
                  className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                  onClick={onItemClick}
                >
                  <Clock className="nav-icon" />
                  Analysis History
                </NavLink>
              </div>
            )}
          </div>
          
          <div 
            className="nav-item-with-submenu"
            onClick={() => handleBlogAgentsInteraction(!showBlogSubMenu)}
          >
            <div className="nav-item nav-item-unclickable">
              <PenTool className="nav-icon" />
              Blog Agents
              <ChevronRight className={`nav-submenu-icon ${showBlogSubMenu ? 'rotated' : ''}`} />
            </div>
            
            {showBlogSubMenu && (
              <div className="nav-submenu">
                <NavLink 
                  to="/blog-creator" 
                  className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                  onClick={onItemClick}
                >
                  <Workflow className="nav-icon" />
                  Create AEO Articles
                </NavLink>
                <NavLink 
                  to="/competitor-conquesting" 
                  className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                  onClick={onItemClick}
                >
                  <Swords className="nav-icon" />
                  Outrank Competitors
                </NavLink>
                <NavLink 
                  to="/blog-history" 
                  className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                  onClick={onItemClick}
                >
                  <Clock className="nav-icon" />
                  History
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
          
          {FEATURE_FLAGS.showGongAnalysis && (
            <NavLink 
              to="/gong-analysis" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onItemClick}
            >
              <Headphones className="nav-icon" />
              Gong Call Analyzer
            </NavLink>
          )}
          
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
            to="/cta-creator" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <Target className="nav-icon" />
            CTA Creator
          </NavLink>
          
          <NavLink 
            to="/playbooks-creator" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onItemClick}
          >
            <FileText className="nav-icon" />
            Playbook Creator
          </NavLink>
          
        </div>
        
        {/* Bottom utility sections */}
        <div className="nav-section-bottom">
          <div className="nav-section">
            <div 
              className="nav-item-with-submenu"
              onClick={toggleKitsSection}
            >
              <div className="nav-item nav-item-unclickable">
                <Package className="nav-icon" />
                <span>Kits</span>
                <ChevronRight className={`nav-submenu-icon ${showKitsSection ? 'rotated' : ''}`} />
              </div>
            </div>
            {showKitsSection && (
              <div className="nav-submenu">
                <NavLink 
                  to="/brand-kit" 
                  className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                  onClick={onItemClick}
                >
                  <BookOpen className="nav-icon" />
                  Brand Kit
                </NavLink>
                
                <NavLink 
                  to="/voc-kit" 
                  className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                  onClick={onItemClick}
                >
                  <Users className="nav-icon" />
                  VoC Kit
                </NavLink>
              </div>
            )}
          </div>
          
          <div className="nav-section">
            <div 
              className="nav-item-with-submenu"
              onClick={toggleKnowledgeBaseSection}
            >
              <div className="nav-item nav-item-unclickable">
                <Brain className="nav-icon" />
                <span>Knowledge Base</span>
                <ChevronRight className={`nav-submenu-icon ${showKnowledgeBaseSection ? 'rotated' : ''}`} />
              </div>
            </div>
            {showKnowledgeBaseSection && (
              <div className="nav-submenu">
                <NavLink 
                  to="/knowledge-base/sitemap" 
                  className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                  onClick={onItemClick}
                >
                  <Map className="nav-icon" />
                  Sitemap
                </NavLink>
              </div>
            )}
          </div>
          
          <div className="nav-section">
            <NavLink 
              to="/settings" 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onItemClick}
            >
              <Settings className="nav-icon" />
              <span>Settings</span>
            </NavLink>
          </div>
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
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            color: #6b7280;
            text-decoration: none;
            border-radius: 0.5rem;
            font-size: 0.75rem;
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
            width: 0.875rem;
            height: 0.875rem;
          }

          .nav-item-unclickable {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: #374151;
            text-decoration: none;
            border-radius: 0.5rem;

            cursor: default;
          }

          .nav-section-title.clickable {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            margin-bottom: 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
            user-select: none;

          }

          .nav-section-title.clickable:hover {
            color: #111827;
          }

          .nav-section-title.clickable .nav-submenu-icon {
            margin-top: 1px;
          }

          .nav-section-content {
            animation: slideDown 0.2s ease-out;
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