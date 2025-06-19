// API Response Types
export interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  message: string;
  timestamp: string;
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  description: string;
  documentation: {
    health: string;
    info: string;
    endpoints: {
      reddit: string;
      analysis: string;
      sheets: string;
    };
  };
}

// Backend Connection Status
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

// Form Types
export interface SearchFormData {
  keywords: string;
  subreddits: string;
}

export interface ParsedFormData {
  keywords: string[];
  subreddits: string[];
  keywordsString: string;
  subredditsString: string;
}

// Reddit Types (matching backend)
export interface RedditPost {
  id: string;
  title: string;
  content: string;
  score: number;
  comments: number;
  subreddit: string;
  url: string;
  permalink: string;
  author: string;
  engagement: number;
  created_utc: number;
}

export interface ContentAnalysisResult {
  pain_point: string;
  audience_insight: string;
  content_opportunity: string;
  urgency_level: 'high' | 'medium' | 'low';
  target_demographic: string;
}

export interface AnalyzedPost extends RedditPost {
  analysis: ContentAnalysisResult;
  post_rank: number;
  analysis_timestamp: string;
}

// API Client Types
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}

// Search History (localStorage)
export interface SearchHistoryItem {
  id: string;
  keywords: string[];
  subreddits: string[];
  timestamp: string;
  results_count?: number;
}

// Component Props Types
export interface StatusIndicatorProps {
  status: ConnectionStatus;
}

export interface SearchFormProps {
  onSubmit: (data: ParsedFormData) => void;
  isLoading: boolean;
}

export interface ResultsDisplayProps {
  results: AnalyzedPost[];
  isLoading: boolean;
  onExport?: () => void;
}

export interface PostCardProps {
  post: AnalyzedPost;
  index: number;
}

// App State Types
export interface AppState {
  backendStatus: ConnectionStatus;
  searchResults: AnalyzedPost[];
  isSearching: boolean;
  searchHistory: SearchHistoryItem[];
  currentSearch?: ParsedFormData;
}

// Environment Variables
export interface EnvironmentConfig {
  REACT_APP_API_URL: string;
  REACT_APP_APP_NAME: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type NonEmptyArray<T> = [T, ...T[]];

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  INFO: '/',
  REDDIT_SEARCH: '/api/reddit/search',
  ANALYZE_POSTS: '/api/analysis/analyze-posts',
  EXPORT_SHEETS: '/api/sheets/save-results',
} as const;

// Subreddit Options
export const SUBREDDIT_OPTIONS = [
  'sales',
  'techsales', 
  'salestechniques',
  'prospecting'
] as const;

export type SubredditOption = typeof SUBREDDIT_OPTIONS[number]; 