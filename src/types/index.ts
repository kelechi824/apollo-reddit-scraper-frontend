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

// Brand Kit and Chat Types
export interface BrandKitVariable {
  id: string;
  name: string;
  value: string;
  category: 'company' | 'product' | 'messaging' | 'contact';
}

export interface ChatHistoryEntry {
  id: string;
  conversation_id: string;
  title: string;
  created_at: string;
  message_count: number;
}

// CRO Types (matching backend)
export interface PageTextContent {
  title: string;
  headings: string[];
  bodyText: string;
  buttonTexts: string[];
  links: string[];
  metaDescription?: string;
}

export interface ExtractedPainPoint {
  id: string;
  text: string;
  category: 'manual_tasks' | 'data_quality' | 'deliverability' | 'compliance' | 'integration' | 'cost' | 'other';
  emotionalTrigger: 'frustration' | 'anxiety' | 'excitement' | 'relief' | 'fear' | 'neutral';
  frequency: number;
  confidence: number;
  callId: string;
  speakerId: string;
  timestamp?: number;
}

export interface CustomerPhrase {
  id: string;
  phrase: string;
  frequency: number;
  category: string;
  context: 'early_call' | 'mid_call' | 'late_call' | 'objection' | 'excitement';
  callIds: string[];
}

export interface CopyAnalysisResult {
  id: string;
  url: string;
  pageContent: PageTextContent;
  painPointAlignment: {
    painPoint: ExtractedPainPoint;
    relevanceScore: number;
    recommendations: string[];
  }[];
  customerLanguageGaps: {
    missingPhrase: CustomerPhrase;
    suggestedPlacement: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  overallScore: number;
  keyRecommendations: string[];
  timestamp: string;
}

export interface CROAnalysisResponse {
  success: boolean;
  analysis: CopyAnalysisResult;
  screenshot?: {
    id: string;
    pageTitle: string;
    viewport: { width: number; height: number };
    timestamp: string;
  };
  message: string;
}

// Simple Gong Fetch Types (for fetching calls without analysis)
export interface GongCall {
  id: string;
  title: string;
  started: string;
  duration?: number;
  primaryUserId: string;
  direction: 'Inbound' | 'Outbound' | 'Conference' | 'Unknown';
  system?: string;
  scope?: string;
  media?: string;
  url?: string;
  participants?: any[];
  scheduled?: string;
  workspaceId?: string;
  meetingUrl?: string;
  calendarEventId?: string;
}

export interface GongFetchCallsRequest {
  daysBack: number;
  limit: number;
}

export interface GongFetchCallsResponse {
  success: boolean;
  calls: GongCall[];
  total_found: number;
  message: string;
}

// Conversation Details Types (for fetching full call insights)
export interface GongCallHighlights {
  brief: string;
  callId: string;
  callOutcome: string | null;
  highlights: any[];
  keyPoints: Array<{
    text: string;
  }>;
  topics: Array<{
    name: string;
    duration: number;
  }>;
  trackers: Array<{
    name: string;
    count: number;
  }>;
  speakers: any[];
}

export interface GongConversationDetails {
  callId: string;
  timestamp: string;
  highlights: GongCallHighlights;
  extensiveData: any;
}

export interface GongCallWithDetails extends GongCall {
  conversationDetails?: GongConversationDetails;
}

export interface GongFetchCallsWithDetailsResponse {
  success: boolean;
  calls: GongCallWithDetails[];
  total_found: number;
  message: string;
}

// Gong Analysis Types (matching backend)
export interface GongAnalysisRequest {
  daysBack: number;
  limit: number;
  sentiment?: 'positive' | 'negative' | 'all';
}

export interface GongAnalyzedCall {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  analysis: {
    callSummary: string;
    painPoints: ExtractedPainPoint[];
    croOpportunity: {
      adCopyIdeas: string[];
      googleAdsHeadlines: string[];
      googleAdsDescriptions: string[];
      landingPageRecommendations: string[];
    };
  };
  highlights: any;
  extensive_data: any;
  call_rank: number;
  analysis_timestamp: string;
}

export interface GongAnalysisResponse {
  success: boolean;
  analyzed_calls: GongAnalyzedCall[];
  analysis_metadata?: {
    total_calls_found: number;
    total_calls_analyzed: number;
    sentiment_filter_applied: string;
    date_range: {
      days_back: number;
      start_date: string;
      end_date: string;
    };
    analysis_timestamp: string;
    processing_time_ms: number;
  };
  gong_results?: {
    calls: any[];
    total_found: number;
    sentiment_filter: string;
    search_timestamp: string;
  };
  workflow_id: string;
  completed_at: string;
  message?: string;
  errors?: string[];
}

export interface LandingPageAnalysisRequest {
  url: string;
  callInsights: GongAnalyzedCall[];
}

export interface LandingPageAnalysisResult {
  url: string;
  screenshot: string;
  extractedContent: PageTextContent;
  croRecommendations: {
    headlineImprovements: string[];
    copyImprovements: string[];
    googleAdsVariations: {
      headlines: string[];
      descriptions: string[];
    };
    conversionOptimizations: string[];
  };
}

// Gong Chat Types for CRO Conversations
export interface StartGongConversationRequest {
  call_id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  callSummary: string;
  painPoints: ExtractedPainPoint[];
  croOpportunity: {
    adCopyIdeas: string[];
    googleAdsHeadlines: string[];
    googleAdsDescriptions: string[];
    landingPageRecommendations: string[];
  };
}

export interface StartGongConversationResponse {
  conversation_id: string;
  initial_message: ChatMessage;
}

export interface SendGongMessageRequest {
  conversation_id: string;
  message: string;
}

export interface SendGongMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  conversation_stage?: string;
} 