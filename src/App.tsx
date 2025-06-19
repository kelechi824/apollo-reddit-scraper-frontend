import React, { useState, useEffect } from 'react';
import axios, { AxiosResponse } from 'axios';
import './App.css';
import { 
  ConnectionStatus, 
  HealthCheckResponse, 
  ApiClientConfig,
  API_ENDPOINTS 
} from './types';
import AnalysisInterface from './components/AnalysisInterface';

// Configure axios defaults
const apiConfig: ApiClientConfig = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3003',
  timeout: 10000,
};

const api = axios.create(apiConfig);

const App: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<ConnectionStatus>('connecting');

  // Test backend connection on load
  useEffect(() => {
    const testBackend = async (): Promise<void> => {
      try {
        const response: AxiosResponse<HealthCheckResponse> = await api.get(API_ENDPOINTS.HEALTH);
        setBackendStatus('connected');
        console.log('Backend connection successful:', response.data);
      } catch (error) {
        setBackendStatus('disconnected');
        console.error('Backend connection failed:', error);
      }
    };

    testBackend();
  }, []);

  return (
    <div className="min-h-screen apollo-bg-primary">
      {/* Header */}
      <header>
        <div className="max-w-7xl header-container">
          {/* Apollo Logo - Using Actual Logo File */}
          <div className="apollo-authentic-logo">
            <img 
              src="/Apollo_logo_transparent.png" 
              alt="Apollo Logo"
              style={{height: '80px', width: 'auto'}}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {backendStatus === 'connected' ? (
          <AnalysisInterface apiUrl={apiConfig.baseURL} />
        ) : (
          <div className="max-w-5xl" style={{padding: '0 1.5rem'}}>
            <div className="apollo-card-lg" style={{padding: '4rem'}}>
              <div className="text-center">
                <div className="apollo-logo" style={{width: '5rem', height: '5rem', margin: '0 auto 2rem auto'}}>
                  <img 
                    src="/Apollo_logo_transparent.png" 
                    alt="Apollo Logo" 
                  />
                </div>
                
                <h2 style={{fontSize: '2.5rem', fontWeight: '800', color: '#111827', marginBottom: '1.5rem'}}>
                  Reddit Scraper & Content Analysis Platform
                </h2>
                <p style={{fontSize: '1.25rem', color: '#4b5563', marginBottom: '3rem', maxWidth: '48rem', margin: '0 auto 3rem auto', lineHeight: '1.6'}}>
                  Transform Reddit discussions into actionable business insights with AI-powered analysis
                </p>
                
                {backendStatus === 'disconnected' ? (
                  <div className="error-container">
                    <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="error-title">Backend Connection Failed</p>
                      <p className="error-text">Please ensure the backend server is running on localhost:3003</p>
                    </div>
                  </div>
                ) : (
                  <div style={{background: '#fef3c7', border: '2px solid #fcd34d', borderRadius: '1.5rem', padding: '2rem', color: '#92400e'}}>
                    <div className="flex items-center justify-center gap-4">
                      <div className="animate-spin" style={{width: '2rem', height: '2rem', border: '3px solid #d97706', borderTop: '3px solid transparent', borderRadius: '50%'}}></div>
                      <div>
                        <p style={{fontSize: '1.125rem', fontWeight: '700', margin: '0'}}>Connecting to Backend</p>
                        <p style={{margin: '0.25rem 0 0 0'}}>Establishing connection to analysis services...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer>
        <div className="max-w-7xl footer-content">
          <p className="footer-text">Apollo Reddit Scraper - Professional Business Intelligence Platform</p>
          <p className="footer-meta">MVP v1.0.0 | Powered by OpenAI & Reddit API</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
