// Feature flags configuration - centralized control for feature visibility
export interface FeatureFlags {
  showCRO: boolean;
  showGongAnalysis: boolean;
  showLandingPageAnalyzer: boolean;
  showBlogCreator: boolean;
  showPlaybooksCreator: boolean;
  showBrandKit: boolean;
  showGongFullConversationTab: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  showCRO: false, // Hide CRO for production
  showGongAnalysis: false,
  showLandingPageAnalyzer: false, // Hide Landing Page Analyzer from navigation
  showBlogCreator: true,
  showPlaybooksCreator: true,
  showBrandKit: true,
  showGongFullConversationTab: false, // Hide until transcript data is available
}; 