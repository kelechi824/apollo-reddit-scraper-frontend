import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface SettingsState {
  theme: 'light' | 'dark';
  autoSave: boolean;
  defaultLimit: number;
  apiUrl: string;
  notifications: boolean;
  autoRefresh: boolean;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'light',
    autoSave: true,
    defaultLimit: 5,
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3003',
    notifications: true,
    autoRefresh: false
  });

  const [saved, setSaved] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('apollo-settings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Save settings to localStorage
   * Why this matters: Persists user preferences across browser sessions
   */
  const handleSave = () => {
    localStorage.setItem('apollo-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /**
   * Reset settings to defaults
   * Why this matters: Allows users to quickly restore default configuration
   */
  const handleReset = () => {
    const defaultSettings: SettingsState = {
      theme: 'light',
      autoSave: true,
      defaultLimit: 5,
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3003',
      notifications: true,
      autoRefresh: false
    };
    setSettings(defaultSettings);
    localStorage.setItem('apollo-settings', JSON.stringify(defaultSettings));
  };

  /**
   * Update individual setting
   * Why this matters: Provides granular control over each setting option
   */
  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Show confirmation modal for clearing all data
   * Why this matters: Provides a custom modal experience instead of browser popup for better UX
   */
  const showClearConfirmation = () => {
    setShowConfirmModal(true);
  };

  /**
   * Clear all data after confirmation
   * Why this matters: Performs the actual deletion of all data after user confirms
   */
  const confirmClearData = () => {
    localStorage.clear();
    handleReset();
    setShowConfirmModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /**
   * Cancel the clear data action
   * Why this matters: Allows users to back out of the destructive action
   */
  const cancelClearData = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="settings-page">
      {/* Settings Header */}
      <div className="settings-header">
        <div className="settings-header-content">
          <div className="settings-title-section">
            <div className="settings-title-wrapper">
              <Settings style={{width: '2rem', height: '2rem'}} />
              <div className="settings-title-text">
                <h1 className="page-title">Settings</h1>
                <p className="settings-subtitle">
                  Customize your analysis preferences and app behavior
                </p>
              </div>
            </div>
          </div>
          
          <div className="settings-actions-section desktop-settings-actions">
            <button
              onClick={handleReset}
              className="apollo-btn-secondary"
            >
              <RotateCcw style={{width: '1rem', height: '1rem'}} />
              <span className="reset-btn-text">Reset to Defaults</span>
              <span className="reset-btn-text-short">Reset</span>
            </button>
            <button
              onClick={handleSave}
              className={`apollo-btn-primary ${saved ? 'saved' : ''}`}
            >
              <Save style={{width: '1rem', height: '1rem'}} />
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Header Styles */}
      <style>
        {`
          .settings-header {
            padding: 2rem 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 2rem;
            position: relative;
          }

          .settings-header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 2rem;
            flex-wrap: wrap;
          }

          .settings-title-section {
            flex: 1;
            min-width: 0;
          }

          .settings-title-wrapper {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
          }

          .settings-title-text {
            flex: 1;
            min-width: 0;
          }

          @media (min-width: 641px) {
            .settings-title-text {
              transform: translateY(-0.25rem);
            }
          }

          @media (max-width: 640px) {
            .settings-title-text {
              transform: translateY(-0.125rem);
            }
          }

          .page-title {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
            color: #111827;
            line-height: 1.2;
          }

          .settings-subtitle {
            margin: 0.5rem 0 0 0;
            font-size: 1rem;
            color: #6b7280;
            font-weight: 500;
          }

          .settings-actions-section {
            position: absolute;
            right: 0;
            top: 0.25rem;
            flex-shrink: 0;
            display: flex;
            gap: 0.75rem;
          }

          .reset-btn-text-short {
            display: none;
          }

          .mobile-settings-actions {
            display: none;
          }

          @media (max-width: 640px) {
            .desktop-settings-actions {
              display: none !important;
            }

            .mobile-settings-actions {
              display: flex;
              justify-content: center;
              gap: 0.75rem;
              margin-top: 2rem;
              padding: 0 1rem;
            }

            .settings-header {
              padding: 1rem 0 1.5rem 0;
            }

            .settings-header-content {
              flex-direction: column;
              gap: 1.5rem;
              align-items: stretch;
            }

            .settings-title-wrapper {
              gap: 0.75rem;
            }

            .page-title {
              font-size: 1.75rem;
            }

            .settings-subtitle {
              font-size: 0.875rem;
            }

            .reset-btn-text {
              display: none;
            }

            .reset-btn-text-short {
              display: inline;
            }
          }

          @media (max-width: 480px) {
            .page-title {
              font-size: 1.5rem;
            }

            .settings-title-wrapper {
              gap: 0.5rem;
            }

            .settings-title-wrapper svg {
              width: 1.5rem !important;
              height: 1.5rem !important;
            }

            .mobile-settings-actions {
              flex-direction: column;
              gap: 1rem;
            }

            .mobile-settings-actions .apollo-btn-secondary,
            .mobile-settings-actions .apollo-btn-primary {
              width: 100%;
              justify-content: center;
            }
          }

          /* Settings Content Improvements */
          .settings-content {
            max-width: 800px;
            margin: 0 auto;
          }

          .settings-section {
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .section-title {
            margin: 0 0 1.5rem 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 0.75rem;
          }

          .setting-group {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .setting-item {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .setting-label {
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
            line-height: 1.4;
          }

          .setting-description {
            display: block;
            font-weight: 400;
            color: #6b7280;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            line-height: 1.4;
          }

          .setting-select, .setting-input {
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            background: white;
            transition: all 0.2s ease;
            width: 100%;
            max-width: 300px;
          }

          .setting-select:focus, .setting-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .setting-checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            cursor: pointer;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            background: #f9fafb;
            transition: all 0.2s ease;
            font-weight: 500;
            color: #374151;
            line-height: 1.4;
          }

          .setting-checkbox-label:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
          }

          .setting-checkbox {
            width: 1.125rem;
            height: 1.125rem;
            border-radius: 0.25rem;
            border: 2px solid #d1d5db;
            background: white;
            cursor: pointer;
            flex-shrink: 0;
            margin-top: 0.125rem;
          }

          .setting-checkbox:checked {
            background-color: #3b82f6;
            border-color: #3b82f6;
          }

          .setting-checkbox-content {
            flex: 1;
            min-width: 0;
          }

          .setting-checkbox-title {
            font-weight: 600;
            color: #111827;
            margin-bottom: 0.25rem;
            line-height: 1.4;
          }

          .setting-danger-btn {
            padding: 0.75rem 1.5rem;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            max-width: 200px;
          }

          .setting-danger-btn:hover {
            background: #dc2626;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
          }

          @media (max-width: 640px) {
            .settings-section {
              padding: 1.5rem;
              margin-bottom: 1.5rem;
            }

            .section-title {
              font-size: 1.125rem;
              margin-bottom: 1.25rem;
            }

            .setting-group {
              gap: 1.25rem;
            }

            .setting-checkbox-label {
              padding: 0.875rem;
            }

            .setting-checkbox-title {
              font-size: 0.875rem;
            }

            .setting-select, .setting-input {
              max-width: 100%;
            }
          }
        `}
      </style>

      {/* Settings Content */}
      <div className="settings-content">
        {/* Appearance Section */}
        <div className="settings-section">
          <h2 className="section-title">Appearance</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label className="setting-label">
                Theme
                <span className="setting-description">Choose your preferred interface theme</span>
              </label>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark')}
                className="setting-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark (Coming Soon)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="settings-section">
          <h2 className="section-title">Analysis Preferences</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label className="setting-label">
                Default Analysis Limit
                <span className="setting-description">Number of posts to analyze by default</span>
              </label>
              <select
                value={settings.defaultLimit}
                onChange={(e) => updateSetting('defaultLimit', parseInt(e.target.value))}
                className="setting-select"
              >
                <option value={3}>3 posts (Quick)</option>
                <option value={5}>5 posts (Recommended)</option>
                <option value={10}>10 posts (Comprehensive)</option>
              </select>
            </div>

            <div className="setting-item">
              <label className="setting-checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSetting('autoSave', e.target.checked)}
                  className="setting-checkbox"
                />
                <div className="setting-checkbox-content">
                  <div className="setting-checkbox-title">Auto-save Analysis Results</div>
                  <span className="setting-description">Automatically save completed analyses to history</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* API Section */}
        <div className="settings-section">
          <h2 className="section-title">API Configuration</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label className="setting-label">
                API Base URL
                <span className="setting-description">Backend server endpoint</span>
              </label>
              <input
                type="url"
                value={settings.apiUrl}
                onChange={(e) => updateSetting('apiUrl', e.target.value)}
                className="setting-input"
                placeholder="http://localhost:3001"
              />
            </div>

            <div className="setting-item">
              <label className="setting-checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => updateSetting('autoRefresh', e.target.checked)}
                  className="setting-checkbox"
                />
                <div className="setting-checkbox-content">
                  <div className="setting-checkbox-title">Auto-refresh Connection Status</div>
                  <span className="setting-description">Automatically check backend connection every 30 seconds</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <h2 className="section-title">Notifications</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label className="setting-checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => updateSetting('notifications', e.target.checked)}
                  className="setting-checkbox"
                />
                <div className="setting-checkbox-content">
                  <div className="setting-checkbox-title">Enable Notifications</div>
                  <span className="setting-description">Show notifications for completed analyses and errors</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="settings-section">
          <h2 className="section-title">Data Management</h2>
          <div className="setting-group">
            <div className="setting-item">
              <label className="setting-label">
                Clear All Data
                <span className="setting-description">Remove all stored analyses and settings</span>
              </label>
              <button
                onClick={showClearConfirmation}
                className="setting-danger-btn"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="mobile-settings-actions">
        <button
          onClick={handleReset}
          className="apollo-btn-secondary"
        >
          <RotateCcw style={{width: '1rem', height: '1rem'}} />
          Reset
        </button>
        <button
          onClick={handleSave}
          className={`apollo-btn-primary ${saved ? 'saved' : ''}`}
        >
          <Save style={{width: '1rem', height: '1rem'}} />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className={`confirmation-modal-backdrop ${showConfirmModal ? 'open' : ''}`}>
          <div className={`confirmation-modal ${showConfirmModal ? 'open' : ''}`}>
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                <AlertTriangle style={{width: '1.5rem', height: '1.5rem'}} />
              </div>
              <h3 className="confirmation-modal-title">Clear All Data?</h3>
              <p className="confirmation-modal-message">
                This action cannot be undone and will permanently delete all your saved analyses, settings, and preferences.
              </p>
            </div>
            <div className="confirmation-modal-actions">
              <button
                onClick={cancelClearData}
                className="confirmation-modal-btn confirmation-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearData}
                className="confirmation-modal-btn confirmation-modal-btn-confirm"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage; 