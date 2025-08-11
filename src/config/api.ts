/**
 * API Configuration
 * Why this matters: Centralizes backend URL configuration to support different deployment environments
 * (Vercel, Netlify, local development) without hardcoding URLs throughout the codebase
 */

// Get the backend URL from environment variable or use defaults
// Why this matters: Allows different deployments to point to their respective backends
const getBackendUrl = (): string => {
  // First, check if REACT_APP_API_URL is set (used by Netlify and can be used by Vercel)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback to NODE_ENV-based logic
  if (process.env.NODE_ENV === 'production') {
    // Default to Vercel backend for production if no env var is set
    return 'https://apollo-reddit-scraper-backend.vercel.app';
  }
  
  // Local development
  return 'http://localhost:3003';
};

export const API_BASE_URL = getBackendUrl();

// Helper function to ensure URLs don't have trailing slashes
// Why this matters: Prevents double slashes in API URLs which can cause routing issues
export const buildApiUrl = (path: string): string => {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Export specific API endpoints for consistency
export const API_ENDPOINTS = {
  // Content generation endpoints
  generateContent: buildApiUrl('/api/content/generate'),
  generateMeta: buildApiUrl('/api/content/generate-meta'),
  
  // Playbook endpoints
  generatePlaybook: buildApiUrl('/api/playbooks/generate-content'),
  
  // Competitor conquesting endpoints
  competitorGenerateContent: buildApiUrl('/api/competitor-conquesting/generate-content'),
  competitorCsvCognism: buildApiUrl('/api/competitor-conquesting/csv/cognism'),
  
  // Add other endpoints as needed
};

console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_BASE_URL,
});
