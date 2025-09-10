import { 
  GongAnalysisRequest, 
  GongAnalysisResponse, 
  LandingPageAnalysisRequest, 
  LandingPageAnalysisResult,
  StartGongConversationRequest,
  StartGongConversationResponse,
  SendGongMessageRequest,
  SendGongMessageResponse
} from '../types';
import { API_BASE_URL } from '../config/api';

/**
 * Service for handling Gong call analysis API operations
 * Why this matters: Centralizes API communication and provides consistent error handling
 */
class GongAnalysisService {
  private baseUrl: string;

  constructor(apiUrl?: string) {
    this.baseUrl = (apiUrl || API_BASE_URL).replace(/\/$/, '');
  }

  /**
   * Run bulk Gong call analysis with sentiment filtering
   * Why this matters: Enables CRO managers to analyze multiple calls simultaneously for comprehensive insights
   */
  async runAnalysis(request: GongAnalysisRequest): Promise<GongAnalysisResponse> {
    try {
      console.log('🚀 Starting Gong analysis workflow:', request);

      const response = await fetch(`${this.baseUrl}/api/gong-analysis/run-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gong analysis failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: GongAnalysisResponse = await response.json();
      console.log('✅ Gong analysis complete:', data);

      // Save analysis results to localStorage for persistence
      this.saveAnalysisResults(data);

      return data;

    } catch (error) {
      console.error('❌ Gong analysis failed:', error);
      throw error instanceof Error ? error : new Error('Gong analysis failed');
    }
  }

  /**
   * Analyze landing page with call insights for CRO recommendations
   * Why this matters: Combines call pain points with actual page content for actionable optimization recommendations
   */
  async analyzeLandingPage(request: LandingPageAnalysisRequest): Promise<LandingPageAnalysisResult> {
    try {
      console.log('🚀 Starting landing page analysis:', request);

      const response = await fetch(`${this.baseUrl}/api/gong-analysis/analyze-landing-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Landing page analysis failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: LandingPageAnalysisResult = await response.json();
      console.log('✅ Landing page analysis complete:', data);

      return data;

    } catch (error) {
      console.error('❌ Landing page analysis failed:', error);
      throw error instanceof Error ? error : new Error('Landing page analysis failed');
    }
  }

  /**
   * Start a new CRO-focused conversation with Gong call context
   * Why this matters: Enables conversational AI guidance for CRO optimization based on call insights
   */
  async startConversation(request: StartGongConversationRequest): Promise<StartGongConversationResponse> {
    try {
      console.log('🚀 Starting Gong conversation:', request);

      const response = await fetch(`${this.baseUrl}/api/gong-chat/start-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start conversation: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: StartGongConversationResponse = await response.json();
      console.log('✅ Gong conversation started:', data);

      return data;

    } catch (error) {
      console.error('❌ Failed to start Gong conversation:', error);
      throw error instanceof Error ? error : new Error('Failed to start conversation');
    }
  }

  /**
   * Send a message in an ongoing CRO conversation
   * Why this matters: Continues conversational CRO guidance with proper context and error handling
   */
  async sendMessage(request: SendGongMessageRequest): Promise<SendGongMessageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/gong-chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: SendGongMessageResponse = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error instanceof Error ? error : new Error('Failed to send message');
    }
  }

  /**
   * Get analysis history from localStorage
   * Why this matters: Provides access to previous analysis results for user convenience
   */
  getAnalysisHistory(): GongAnalysisResponse[] {
    try {
      const saved = localStorage.getItem('apollo-gong-analyses');
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading Gong analysis history:', error);
      return [];
    }
  }

  /**
   * Clear analysis history from localStorage
   * Why this matters: Allows users to reset their analysis history when needed
   */
  clearAnalysisHistory(): void {
    try {
      localStorage.removeItem('apollo-gong-analyses');
      console.log('✅ Gong analysis history cleared');
    } catch (error) {
      console.error('Error clearing Gong analysis history:', error);
    }
  }

  /**
   * Save analysis results to localStorage with history management
   * Why this matters: Maintains persistent history while preventing localStorage bloat
   */
  private saveAnalysisResults(data: GongAnalysisResponse): void {
    try {
      const history = this.getAnalysisHistory();
      
      // Add new analysis at the beginning
      history.unshift(data);
      
      // Keep only the last 10 analyses to prevent localStorage bloat
      const trimmedHistory = history.slice(0, 10);
      
      localStorage.setItem('apollo-gong-analyses', JSON.stringify(trimmedHistory));
      console.log('✅ Gong analysis saved to history');
      
    } catch (error) {
      console.error('Error saving Gong analysis to history:', error);
      
      // If localStorage is full, try to clear old data
      if (error instanceof DOMException && error.code === 22) {
        this.clearAnalysisHistory();
        try {
          localStorage.setItem('apollo-gong-analyses', JSON.stringify([data]));
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Validate URL format for landing page analysis
   * Why this matters: Prevents API calls with invalid URLs and provides immediate user feedback
   */
  validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url.trim()) {
      return { isValid: false, error: 'URL is required' };
    }

    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
      }
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Get service health status
   * Why this matters: Provides debugging information and service availability checks
   */
  async getServiceStatus(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/gong-chat/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Service check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Service status check failed:', error);
      throw error instanceof Error ? error : new Error('Service status check failed');
    }
  }
}

// Export singleton instance for easy use across components
export const gongAnalysisService = new GongAnalysisService();
export default gongAnalysisService; 