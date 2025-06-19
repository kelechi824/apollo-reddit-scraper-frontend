import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Configure axios defaults
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3003',
  timeout: 10000,
});

function App() {
  const [backendStatus, setBackendStatus] = useState(null);

  // Test backend connection on load
  useEffect(() => {
    const testBackend = async () => {
      try {
        const response = await api.get('/health');
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
    <div className="min-h-screen bg-apollo-gray">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              {/* Apollo Logo Placeholder */}
              <div className="w-8 h-8 bg-apollo-yellow rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-apollo-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-apollo-black">Apollo Reddit Scraper</h1>
                <p className="text-sm text-gray-500">Content Analysis & Insights</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected' ? 'bg-green-500' : 
                backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {backendStatus === 'connected' ? 'Connected' : 
                 backendStatus === 'disconnected' ? 'Disconnected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Reddit Content Analysis
            </h2>
            <p className="text-gray-600 mb-8">
              Discover pain points, audience insights, and content opportunities from Reddit discussions
            </p>
            
            {backendStatus === 'connected' ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800">
                  ✅ Backend connected successfully! Ready to start analyzing Reddit content.
                </p>
              </div>
            ) : backendStatus === 'disconnected' ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">
                  ❌ Backend connection failed. Please ensure the backend is running on localhost:3003
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">
                  ⏳ Connecting to backend...
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Apollo Reddit Scraper - MVP v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
