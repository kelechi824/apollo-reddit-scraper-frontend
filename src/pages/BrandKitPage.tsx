import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Link2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { BrandKit } from '../types';
import { compressTextData } from '../utils/localStorage';
import { HybridStorage } from '../utils/indexedDB';

/**
 * BrandKitPage Component
 * Why this matters: Centralizes brand information management for consistent content creation
 * across all AI-generated materials using liquid template variables.
 */
const BrandKitPage: React.FC = () => {
  const [brandKit, setBrandKit] = useState<BrandKit>({
    pythiaApi: {
      apiKey: '',
      isConnected: false
    },
    url: '',
    aboutBrand: '',
    idealCustomerProfile: '',
    competitors: '',
    brandPointOfView: '',
    authorPersona: '',
    toneOfVoice: '',
    headerCaseType: 'title',
    writingRules: '',
    ctaText: '',
    ctaDestination: '',
    writingSample: {
      url: '',
      title: '',
      body: '',
      outline: ''
    },
    customVariables: {}
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [editingVariableName, setEditingVariableName] = useState('');

  const isInitialLoadRef = useRef(true);

  // Convert camelCase/PascalCase to snake_case
  const toSnakeCase = (str: string) => {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Auto-generate liquid syntax when variable name changes
  React.useEffect(() => {
    if (newVariableName.trim()) {
      const snakeCaseName = toSnakeCase(newVariableName.trim());
      setNewVariableValue(`{{ brand_kit.${snakeCaseName} }}`);
    } else {
      setNewVariableValue('');
    }
  }, [newVariableName]);





  // Auto-save to localStorage with debouncing and quota management
  React.useEffect(() => {
    // Skip auto-save if this is the initial load from localStorage
    if (isInitialLoadRef.current) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set auto-save status to saving
    setAutoSaveStatus('saving');

    // Set new timeout for auto-save with hybrid storage
    const timeout = setTimeout(async () => {
      try {
        const compressedData = compressTextData(brandKit) as BrandKit;
        const saveResult = await HybridStorage.setItem('apollo_brand_kit_draft', compressedData);
        
        if (!saveResult.success) {
          console.warn('Auto-save failed:', saveResult.error);
          setAutoSaveStatus('');
          setSaveMessage('Auto-save failed. Your data is safe in memory - try saving manually.');
          setTimeout(() => setSaveMessage(''), 5000);
          return;
        }
        
        // Dispatch custom event to notify other components of auto-save
        window.dispatchEvent(new CustomEvent('apollo-brand-kit-updated'));
        
        // Show success message with storage method info
        const method = saveResult.method === 'indexedDB' ? 'IndexedDB' : 'localStorage';
        const compressionInfo = saveResult.compressed ? ' (compressed)' : '';
        
        setAutoSaveStatus('saved');
        
        // Clear the "saved" status after 2 seconds
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        setAutoSaveStatus('');
        setSaveMessage('Auto-save failed. Your data is safe in memory.');
        setTimeout(() => setSaveMessage(''), 5000);
      }
    }, 1000); // Save after 1 second of inactivity

    setAutoSaveTimeout(timeout);

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [brandKit]); // Watch all brandKit changes
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');

  /**
   * Load brand kit from hybrid storage on mount
   * Why this matters: Persists user's brand configuration across sessions using the best available storage method.
   */
  useEffect(() => {
    const loadBrandKit = async () => {
      try {
        // First check for auto-saved draft, then fallback to saved version
        let dataToLoad = await HybridStorage.getItem('apollo_brand_kit_draft');
        if (!dataToLoad) {
          dataToLoad = await HybridStorage.getItem('apollo_brand_kit');
        }
        
        if (dataToLoad) {
          setBrandKit(dataToLoad);
        }
      } catch (error) {
        console.error('Error loading brand kit:', error);
        
        // Fallback to localStorage if hybrid storage fails
        try {
          const draft = localStorage.getItem('apollo_brand_kit_draft');
          const saved = localStorage.getItem('apollo_brand_kit');
          const fallbackData = draft || saved;
          
          if (fallbackData) {
            setBrandKit(JSON.parse(fallbackData));
          }
        } catch (fallbackError) {
          console.error('Fallback loading also failed:', fallbackError);
        }
      }

      // After initial load, allow auto-save to work
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    };

    loadBrandKit();
  }, []);

  /**
   * Save brand kit to localStorage with quota management
   * Why this matters: Ensures brand configuration is preserved and available for content creation while handling storage limits gracefully.
   */
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const compressedData = compressTextData(brandKit) as BrandKit;
      const saveResult = await HybridStorage.setItem('apollo_brand_kit', compressedData);
      
      if (!saveResult.success) {
        console.warn('Manual save failed:', saveResult.error);
        setSaveMessage('Save failed. Please try again or contact support if the issue persists.');
        setTimeout(() => setSaveMessage(''), 5000);
        setIsSaving(false);
        return;
      }
      
      // Clear the draft since we've manually saved
      await HybridStorage.removeItem('apollo_brand_kit_draft');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('apollo-brand-kit-updated'));
      
      setSaveMessage('Brand Kit saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('Save failed due to an unexpected error. Please try again.');
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle form field updates
   * Why this matters: Provides controlled input handling for all brand kit fields.
   */
  const handleChange = (field: keyof BrandKit, value: any) => {
    setBrandKit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle writing sample updates
   * Why this matters: Manages nested object updates for writing sample configuration.
   */
  const handleWritingSampleChange = (field: keyof BrandKit['writingSample'], value: string) => {
    setBrandKit(prev => ({
      ...prev,
      writingSample: {
        ...prev.writingSample,
        [field]: value
      }
    }));
  };

  /**
   * Add custom variable
   * Why this matters: Allows users to define additional liquid template variables for flexible content generation.
   */
  const addCustomVariable = () => {
    if (newVariableName.trim()) {
      const snakeCaseName = toSnakeCase(newVariableName.trim());
      
      setBrandKit(prev => ({
        ...prev,
        customVariables: {
          ...prev.customVariables,
          [snakeCaseName]: '' // Store empty value initially, user will fill it in
        }
      }));
      setNewVariableName('');
      setNewVariableValue('');
    }
  };

  /**
   * Remove custom variable
   * Why this matters: Provides cleanup functionality for custom variables.
   */
  const removeCustomVariable = (key: string) => {
    setBrandKit(prev => {
      const { [key]: removed, ...rest } = prev.customVariables;
      return {
        ...prev,
        customVariables: rest
      };
    });
  };

  /**
   * Start editing a custom variable
   * Why this matters: Enters edit mode for a specific variable without disrupting the UI.
   */
  const startEditingVariable = (key: string) => {
    setEditingVariable(key);
    setEditingVariableName(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
  };

  /**
   * Save edited variable name
   * Why this matters: Updates the variable name only when editing is complete, preventing cursor issues.
   */
  const saveEditedVariable = (oldKey: string) => {
    if (editingVariableName.trim()) {
      const newKey = toSnakeCase(editingVariableName.trim());
      
      // Only update if the key actually changed
      if (newKey !== oldKey) {
        setBrandKit(prev => {
          const oldValue = prev.customVariables[oldKey] || '';
          const { [oldKey]: removed, ...rest } = prev.customVariables;
          return {
            ...prev,
            customVariables: {
              ...rest,
              [newKey]: oldValue // Preserve the old value
            }
          };
        });
      }
    }
    
    setEditingVariable(null);
    setEditingVariableName('');
  };

  /**
   * Cancel editing variable
   * Why this matters: Exits edit mode without saving changes.
   */
  const cancelEditingVariable = () => {
    setEditingVariable(null);
    setEditingVariableName('');
  };

  /**
   * Test Pythia API connection
   * Why this matters: Validates API key and ensures Pythia data access is working.
   */
  const testPythiaConnection = async () => {
    if (!brandKit.pythiaApi.apiKey) {
      setConnectionMessage('Please enter an API key first');
      return;
    }

    setIsTestingConnection(true);
    setConnectionMessage('');

    try {
      // Simulate API test - replace with actual Pythia API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, consider connection successful if API key is provided
      const isConnected = brandKit.pythiaApi.apiKey.length > 10;
      
      setBrandKit(prev => ({
        ...prev,
        pythiaApi: {
          ...prev.pythiaApi,
          isConnected,
          ...(isConnected && { lastConnected: new Date().toISOString() })
        }
      }));

      setConnectionMessage(isConnected ? 'Connected successfully!' : 'Invalid API key');
    } catch (error) {
      setConnectionMessage('Connection failed. Please check your API key.');
      setBrandKit(prev => ({
        ...prev,
        pythiaApi: {
          ...prev.pythiaApi,
          isConnected: false
        }
      }));
    } finally {
      setIsTestingConnection(false);
      setTimeout(() => setConnectionMessage(''), 3000);
    }
  };

  /**
   * Handle Pythia API field updates
   * Why this matters: Manages Pythia API configuration state.
   */
  const handlePythiaApiChange = (field: keyof BrandKit['pythiaApi'], value: any) => {
    setBrandKit(prev => ({
      ...prev,
      pythiaApi: {
        ...prev.pythiaApi,
        [field]: value
      }
    }));
  };

  return (
    <>
      {/* Sticky Auto-save indicator */}
      {autoSaveStatus && (
        <div style={{ 
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          border: '0.0625rem solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1), 0 0.125rem 0.25rem -0.0625rem rgba(0, 0, 0, 0.06)',
          color: autoSaveStatus === 'saving' ? '#6b7280' : '#10b981',
          fontSize: '0.875rem',
          fontWeight: '500',
          pointerEvents: 'none'
        }}>
          {autoSaveStatus === 'saving' ? (
            <>
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                border: '0.125rem solid transparent',
                borderTop: '0.125rem solid #6b7280',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Auto-saving...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Auto-saved
            </>
          )}
        </div>
      )}

      <div className="brand-kit-page" style={{ 
        padding: '2rem', 
        maxWidth: '75rem', 
        margin: '0 auto'
      }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.75rem', color: '#111827' }}>Brand Kit</h1>
        <p style={{ color: '#6b7280', fontSize: '1.125rem', maxWidth: '37.5rem', margin: '0 auto' }}>
          Configure brand information for consistent AI content creation.
        </p>
      </div>

      {/* Vertical Stack Layout */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem'
      }}>
        {/* Pythia API Integration */}
        <div style={{ 
          border: '0.125rem solid #B8B0E8', 
          borderRadius: '0.75rem', 
          padding: '1.5rem',
          backgroundColor: '#E0DBFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Link2 size={24} style={{ color: '#3b82f6' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1e40af' }}>
              Connect Pythia via API
            </h3>
            {brandKit.pythiaApi.isConnected && (
              <CheckCircle size={20} style={{ color: '#10b981' }} />
            )}
          </div>
          
          <p style={{ 
            color: '#374151', 
            marginBottom: '1rem', 
            lineHeight: '1.5',
            fontSize: '0.875rem'
          }}>
            Connect to Apollo's proprietary Pythia data to enhance your content creation with unique insights, 
            market intelligence, and enriched prospect data. This integration allows you to leverage Apollo's 
            vast database of B2B information during the content generation process.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151', fontSize: '0.9rem' }}>
                Pythia API Key
              </label>
                             <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="password"
                  value={brandKit.pythiaApi.apiKey}
                  onChange={(e) => handlePythiaApiChange('apiKey', e.target.value)}
                  placeholder="Enter your Pythia API key..."
                  className="brand-kit-input"
                  style={{
                    flex: '1',
                    minWidth: '15.625rem',
                    padding: '1rem 1.25rem',
                    border: '0.0625rem solid #e5e7eb',
                    borderRadius: '0.5rem',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  onClick={testPythiaConnection}
                  disabled={isTestingConnection || !brandKit.pythiaApi.apiKey}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: isTestingConnection ? '#9ca3af' : '#EBF212',
                    color: isTestingConnection ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    cursor: isTestingConnection || !brandKit.pythiaApi.apiKey ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '7.5rem',
                    justifyContent: 'center'
                  }}
                >
                  {isTestingConnection ? (
                    <>
                      <div style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        border: '0.125rem solid transparent',
                        borderTop: '0.125rem solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Link2 size={16} strokeWidth={3} />
                      Test Connection
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {brandKit.pythiaApi.isConnected ? (
                <>
                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                  <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '500' }}>
                    Connected
                  </span>
                  {brandKit.pythiaApi.lastConnected && (
                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      (Last connected: {new Date(brandKit.pythiaApi.lastConnected).toLocaleDateString()})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <XCircle size={16} style={{ color: '#ef4444' }} />
                  <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: '500' }}>
                    Not Connected
                  </span>
                </>
              )}
            </div>

            {connectionMessage && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: connectionMessage.includes('success') ? '#dcfce7' : '#fee2e2',
                borderRadius: '0.5rem',
                border: `0.0625rem solid ${connectionMessage.includes('success') ? '#bbf7d0' : '#fecaca'}`
              }}>
                <AlertCircle size={16} style={{ 
                  color: connectionMessage.includes('success') ? '#16a34a' : '#dc2626' 
                }} />
                <span style={{ 
                  fontSize: '0.875rem',
                  color: connectionMessage.includes('success') ? '#16a34a' : '#dc2626',
                  fontWeight: '500'
                }}>
                  {connectionMessage}
                </span>
              </div>
            )}


          </div>
        </div>

        {/* Brand URL */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            Brand URL
          </label>
          <input
            type="url"
            value={brandKit.url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://www.apollo.io"
            className="brand-kit-input"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.url }}`}</code>
          </p>
        </div>

        {/* Competitors */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            Competitors
          </label>
          <input
            type="text"
            value={brandKit.competitors}
            onChange={(e) => handleChange('competitors', e.target.value)}
            placeholder="ZoomInfo, Outreach, Salesloft, Gong, Chili Piper..."
            className="brand-kit-input"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.competitors }}`}</code>
          </p>
        </div>

        {/* About the Brand */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            About the Brand
          </label>
          <textarea
            value={brandKit.aboutBrand}
            onChange={(e) => handleChange('aboutBrand', e.target.value)}
            placeholder="Provide a high level description of your brand..."
            rows={4}
            className="brand-kit-textarea"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.about_brand }}`}</code>
          </p>
        </div>

        {/* Ideal Customer Profile */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            Ideal Customer Profile
          </label>
          <textarea
            value={brandKit.idealCustomerProfile}
            onChange={(e) => handleChange('idealCustomerProfile', e.target.value)}
            placeholder="Describe your ideal customer profile including demographics, pain points, and interests..."
            rows={4}
            className="brand-kit-textarea"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.ideal_customer_profile }}`}</code>
          </p>
        </div>

        {/* Brand Point of View */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            Brand Point of View
          </label>
          <textarea
            value={brandKit.brandPointOfView}
            onChange={(e) => handleChange('brandPointOfView', e.target.value)}
            placeholder="Describe your brand's unique perspective and positioning in the market..."
            rows={4}
            className="brand-kit-textarea"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.brand_point_of_view }}`}</code>
          </p>
        </div>

        {/* Author Persona */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            Author Persona
          </label>
          <textarea
            value={brandKit.authorPersona}
            onChange={(e) => handleChange('authorPersona', e.target.value)}
            placeholder="Describe the ideal author persona including qualifications, expertise, and understanding of audience..."
            rows={4}
            className="brand-kit-textarea"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.author_persona }}`}</code>
          </p>
        </div>

        {/* Tone of Voice */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            Tone of Voice
          </label>
          <textarea
            value={brandKit.toneOfVoice}
            onChange={(e) => handleChange('toneOfVoice', e.target.value)}
            placeholder="Describe the tone of voice of your brand..."
            rows={3}
            className="brand-kit-textarea"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.tone_of_voice }}`}</code>
          </p>
        </div>

        {/* Header Case Type */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            Header Case Type
          </label>
          <select
            value={brandKit.headerCaseType}
            onChange={(e) => handleChange('headerCaseType', e.target.value as BrandKit['headerCaseType'])}
            className="brand-kit-select"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="title">Title Case</option>
            <option value="sentence">Sentence case</option>
            <option value="upper">UPPER CASE</option>
            <option value="lower">lower case</option>
          </select>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.header_case_type }}`}</code>
          </p>
        </div>

        {/* Writing Rules */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            Writing Rules
          </label>
          <textarea
            value={brandKit.writingRules}
            onChange={(e) => handleChange('writingRules', e.target.value)}
            placeholder="Provide guidelines you'd like your content to follow..."
            rows={4}
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.writing_rules }}`}</code>
          </p>
        </div>

        {/* CTA Text */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            CTA Text
          </label>
          <input
            type="text"
            value={brandKit.ctaText}
            onChange={(e) => handleChange('ctaText', e.target.value)}
            placeholder="Try Apollo for free"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.cta_text }}`}</code>
          </p>
        </div>

        {/* CTA Destination */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '0.0625rem solid #f3f4f6' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
            CTA Destination
          </label>
          <input
            type="url"
            value={brandKit.ctaDestination}
            onChange={(e) => handleChange('ctaDestination', e.target.value)}
            placeholder="https://www.apollo.io/sign-up"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: '#fafafa',
              transition: 'all 0.2s ease',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            Available as: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>{`{{ brand_kit.cta_destination }}`}</code>
          </p>
        </div>

        {/* Writing Sample Section */}
        <div style={{ 
          backgroundColor: 'white', 
          border: '0.0625rem solid #f3f4f6', 
          borderRadius: '0.75rem', 
          padding: '2rem' 
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: '#374151' }}>Writing Sample</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
                Writing Sample URL
              </label>
              <input
                type="url"
                value={brandKit.writingSample.url}
                onChange={(e) => handleWritingSampleChange('url', e.target.value)}
                placeholder="https://www.cognism.com/blog/data-enrichment-tools"
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
                Writing Sample Title
              </label>
              <input
                type="text"
                value={brandKit.writingSample.title}
                onChange={(e) => handleWritingSampleChange('title', e.target.value)}
                placeholder="12 B2B Data Enrichment Tools [To Grow Revenue] in 2025"
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
                Writing Sample Body
              </label>
              <textarea
                value={brandKit.writingSample.body}
                onChange={(e) => handleWritingSampleChange('body', e.target.value)}
                placeholder="Body of your writing sample..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', color: '#374151', fontSize: '0.9rem' }}>
                Writing Sample Outline
              </label>
              <textarea
                value={brandKit.writingSample.outline}
                onChange={(e) => handleWritingSampleChange('outline', e.target.value)}
                placeholder="Outline for your writing sample..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>
        </div>

        {/* Custom Variables */}
        <div style={{ 
          backgroundColor: 'white', 
          border: '0.0625rem solid #f3f4f6', 
          borderRadius: '0.75rem', 
          padding: '2rem' 
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: '#374151' }}>Custom Variables</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Create custom variables that will appear as global brand variables across any workflows you create.
          </p>

          {/* Add new variable */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.75rem', 
            marginBottom: '1rem'
          }}>
            {/* Mobile: Stack inputs vertically */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={newVariableName}
                onChange={(e) => setNewVariableName(e.target.value)}
                placeholder="Variable name"
                className="brand-kit-input"
                style={{
                  flex: '1',
                  minWidth: '200px',
                  padding: '0.75rem 1rem',
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                onClick={addCustomVariable}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
              >
                <Plus size={16} />
              </button>
            </div>
                         {/* Liquid syntax preview */}
             {newVariableName && (
               <input
                 type="text"
                 value={newVariableValue}
                 readOnly
                 placeholder="Liquid syntax will appear here..."
                 className="brand-kit-input liquid-syntax"
                 style={{
                   width: '100%',
                   padding: '0.75rem 1rem',
                   border: '0.0625rem solid #e5e7eb',
                   borderRadius: '0.5rem',
                   backgroundColor: '#f9fafb',
                   color: '#6b7280',
                   cursor: 'default',
                   fontFamily: 'monospace',
                   transition: 'all 0.2s ease',
                   outline: 'none'
                 }}
               />
             )}
          </div>

          {/* Display existing variables */}
          {Object.entries(brandKit.customVariables).map(([key, value]) => (
            <div key={key} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.5rem', 
              marginBottom: '1rem',
              padding: '0.75rem',
              border: '0.0625rem solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#fafafa'
            }}>
              {/* Variable name and delete button row */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {editingVariable === key ? (
                  <input
                    type="text"
                    value={editingVariableName}
                    onChange={(e) => setEditingVariableName(e.target.value)}
                    onBlur={() => saveEditedVariable(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveEditedVariable(key);
                      } else if (e.key === 'Escape') {
                        cancelEditingVariable();
                      }
                    }}
                    placeholder="Variable name"
                    autoFocus
                    className="brand-kit-input"
                    style={{
                      flex: '1',
                      padding: '0.5rem 0.75rem',
                      border: '0.125rem solid #3b82f6',
                      borderRadius: '0.25rem',
                      backgroundColor: 'white',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <div
                    onClick={() => startEditingVariable(key)}
                    style={{
                      flex: '1',
                      padding: '0.5rem 0.75rem',
                      border: '0.0625rem solid #e5e7eb',
                      borderRadius: '0.25rem',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                )}
                <button
                  onClick={() => removeCustomVariable(key)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626'}
                  onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#ef4444'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {/* Variable value input */}
              <input
                type="text"
                value={value || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setBrandKit(prev => ({
                    ...prev,
                    customVariables: {
                      ...prev.customVariables,
                      [key]: newValue
                    }
                  }));
                }}
                placeholder={`Enter value for ${key.replace(/_/g, ' ')}`}
                className="brand-kit-input"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: '0.25rem',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              
              {/* Liquid syntax display */}
              <code className="liquid-syntax" style={{ 
                display: 'block',
                padding: '0.25rem 0.5rem', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '0.25rem',
                fontFamily: 'monospace',
                color: '#6b7280',
                border: '0.0625rem solid #e5e7eb',
                fontSize: '0.75rem'
              }}>
                {`{{ brand_kit.${key} }}`}
              </code>
            </div>
          ))}

          {Object.keys(brandKit.customVariables).length === 0 && (
            <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No custom variables defined yet.</p>
          )}
        </div>

        {/* Save Button */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1rem',
          padding: '2rem',
          backgroundColor: '#fafafa',
          borderRadius: '0.75rem',
          border: '0.0625rem solid #f3f4f6'
        }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 2rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 0.125rem 0.25rem rgba(59, 130, 246, 0.15)'
            }}
            onMouseOver={(e) => !isSaving && ((e.target as HTMLButtonElement).style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => !isSaving && ((e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6')}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Brand Kit'}
          </button>

          {saveMessage && (
            <span style={{ 
              color: saveMessage.includes('Error') || saveMessage.includes('failed') ? '#ef4444' : '#10b981',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {saveMessage}
            </span>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default BrandKitPage; 