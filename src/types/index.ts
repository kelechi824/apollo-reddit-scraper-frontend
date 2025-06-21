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
}

export interface AnalyzedPost extends RedditPost {
  analysis: ContentAnalysisResult;
  post_rank: number;
  analysis_timestamp: string;
}

// Chat Types for "Dig Deeper" Feature
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  reddit_post_context: {
    post_id: string;
    title: string;
    content: string;
    pain_point: string;
    audience_insight: string;
  };
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'expired';
}

export interface StartConversationRequest {
  post_id: string;
  title: string;
  content: string;
  pain_point: string;
  audience_insight: string;
}

export interface StartConversationResponse {
  conversation_id: string;
  initial_message: ChatMessage;
}

export interface SendMessageRequest {
  conversation_id: string;
  message: string;
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  conversation_stage?: string;
}

// Workflow Types
export interface WorkflowRequest {
  keywords: string[];
  subreddits: string[];
  limit?: number;
  export_to_sheets?: {
    spreadsheet_id: string;
    sheet_name?: string;
  };
}

export interface RedditSearchResponse {
  posts: RedditPost[];
  total_found: number;
  keywords_used: string;
  subreddits_used: string;
  search_timestamp: string;
}

export interface WorkflowResponse {
  success: boolean;
  reddit_results: RedditSearchResponse;
  analyzed_posts: AnalyzedPost[];
  sheets_export?: any;
  workflow_id: string;
  completed_at: string;
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

// Brand Kit Types for Content Creation
export interface BrandKit {
  pythiaApi: {
    apiKey: string;
    isConnected: boolean;
    lastConnected?: string;
  };
  url: string;
  aboutBrand: string;
  idealCustomerProfile: string;
  competitors: string;
  brandPointOfView: string;
  authorPersona: string;
  toneOfVoice: string;
  headerCaseType: 'title' | 'sentence' | 'upper' | 'lower';
  writingRules: string;
  ctaText: string;
  ctaDestination: string;
  writingSample: {
    url: string;
    title: string;
    body: string;
    outline: string;
  };
  customVariables: Record<string, string>;
}

export interface ContentCreationRequest {
  post_context: {
    title: string;
    content: string;
    pain_point: string;
    content_opportunity: string;
    audience_summary: string;
  };
  brand_kit: BrandKit;
  system_prompt: string;
  user_prompt: string;
}

export interface ContentCreationResponse {
  content: string;
  title: string;
  description: string;
  generated_at: string;
}

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  INFO: '/',
  REDDIT_SEARCH: '/api/reddit/search',
  ANALYZE_POSTS: '/api/analysis/analyze-posts',
  EXPORT_SHEETS: '/api/sheets/save-results',
  CHAT_START: '/api/chat/start-conversation',
  CHAT_MESSAGE: '/api/chat/message',
  CHAT_CONVERSATION: '/api/chat/conversation',
  CHAT_STATUS: '/api/chat/status',
} as const;

// Subreddit Options
export const SUBREDDIT_OPTIONS = [
  'sales',
  'techsales', 
  'salestechniques',
  'prospecting'
] as const;

export type SubredditOption = typeof SUBREDDIT_OPTIONS[number]; 