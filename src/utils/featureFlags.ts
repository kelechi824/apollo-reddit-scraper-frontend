// Feature flags configuration - centralized control for feature visibility
export interface FeatureFlags {
  showCRO: boolean;
  showGongAnalysis: boolean;
  showLandingPageAnalyzer: boolean;
  showBlogCreator: boolean;
  showPlaybooksCreator: boolean;
  showBrandKit: boolean;
  showGongFullConversationTab: boolean;
  showPreviewArticle: boolean;
  showConcurrentExecution: boolean; // Controls visibility of "Run 5 Rows Concurrently" feature
  showAllSubreddits: boolean; // Controls visibility of "All Subreddits" option in dropdown
  showIndividualPostsView: boolean; // Controls visibility of "View Individual Posts" button
}

export const FEATURE_FLAGS: FeatureFlags = {
  showCRO: false, // Hide CRO for production
  showGongAnalysis: false,
  showLandingPageAnalyzer: false, // Hide Landing Page Analyzer from navigation
  showBlogCreator: true,
  showPlaybooksCreator: true,
  showBrandKit: true,
  showGongFullConversationTab: false, // Hide until transcript data is available
  showPreviewArticle: false, // Hide Preview Article button functionality
  showConcurrentExecution: false, // Hide concurrent execution feature for now
  showAllSubreddits: false, // Set to false to hide "All Subreddits" option
  showIndividualPostsView: false, // Set to false to hide "View Individual Posts" button
}; 