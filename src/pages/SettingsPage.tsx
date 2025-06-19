import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';

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
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    notifications: true,
    autoRefresh: false
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('apollo-settings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
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
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
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

  return (
    <div className="settings-page">
      {/* Settings Header */}
      <div className="settings-header">
        <div className="flex items-center gap-3">
          <Settings style={{width: '2rem', height: '2rem'}} />
          <h1 className="page-title">Settings</h1>
        </div>
        <div className="settings-actions">
          <button
            onClick={handleReset}
            className="apollo-btn-secondary"
          >
            <RotateCcw style={{width: '1rem', height: '1rem'}} />
            Reset to Defaults
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
                Auto-save Analysis Results
                <span className="setting-description">Automatically save completed analyses to history</span>
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
                Auto-refresh Connection Status
                <span className="setting-description">Automatically check backend connection every 30 seconds</span>
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
                Enable Notifications
                <span className="setting-description">Show notifications for completed analyses and errors</span>
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
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                    localStorage.clear();
                    handleReset();
                    window.alert('All data cleared successfully.');
                  }
                }}
                className="setting-danger-btn"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 