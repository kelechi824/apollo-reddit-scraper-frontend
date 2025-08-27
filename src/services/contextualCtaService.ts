/**
 * Contextual CTA Service
 * Why this matters: Provides a centralized service for enhancing content with contextual CTAs
 * across all workflows (Blog Creator, Competitor Conquesting, Reddit Content Creation)
 */

import { API_ENDPOINTS } from '../config/api';
import { makeApiRequest } from '../utils/apiHelpers';

export interface ContextualCtaRequest {
  content: string;
  contentFormat?: 'html' | 'markdown' | 'text';
  targetKeyword: string;
  campaignType?: 'blog_creator' | 'competitor_conquesting';
  competitorName?: string;
  maxCtasPerArticle?: number;
  ctaConfidenceThreshold?: number;
  insertionStrategy?: 'conservative' | 'moderate' | 'aggressive';
}

export interface ContextualCtaResponse {
  success: boolean;
  originalContent: string;
  enhancedContent: string;
  insertionAnalytics: {
    totalCtasInserted: number;
    averageConfidenceScore: number;
    insertionPoints: Array<{
      paragraphIndex: number;
      confidenceScore: number;
      ctaType: string;
      apolloSolutionUrl: string;
    }>;
  };
  error?: string;
}

class ContextualCtaService {
  /**
   * Enhance content with contextual CTAs
   * Why this matters: Transforms regular content into engagement-driving content with contextual CTAs
   * that are naturally integrated at paragraph endings.
   */
  async enhanceContentWithCtas(request: ContextualCtaRequest): Promise<ContextualCtaResponse> {
    try {
      console.log(`🎯 Enhancing content with contextual CTAs for keyword: "${request.targetKeyword}"`);
      
      const apiResult = await makeApiRequest(API_ENDPOINTS.enhanceWithCtas, {
        method: 'POST',
        body: JSON.stringify({
          content: request.content,
          contentFormat: request.contentFormat || 'html',
          targetKeyword: request.targetKeyword,
          campaignType: request.campaignType || 'blog_creator',
          competitorName: request.competitorName,
          maxCtasPerArticle: request.maxCtasPerArticle || 3,
          ctaConfidenceThreshold: request.ctaConfidenceThreshold || 60,
          insertionStrategy: request.insertionStrategy || 'moderate'
        }),
      });

      if (!apiResult.success) {
        throw new Error(apiResult.error || apiResult.message || 'Failed to enhance content with CTAs');
      }

      return apiResult.data as ContextualCtaResponse;
    } catch (error) {
      console.error('Error enhancing content with contextual CTAs:', error);
      throw error;
    }
  }

  /**
   * Check if content should be enhanced with contextual CTAs
   * Why this matters: Determines if content is suitable for CTA enhancement based on length and structure
   */
  shouldEnhanceContent(content: string, minWordCount: number = 500): boolean {
    // Remove HTML tags for word counting
    const textContent = content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    
    // Check if content has enough paragraphs for CTA insertion
    const paragraphCount = content.split(/<\/p>|<\/div>|<\/section>/i).length - 1;
    
    return wordCount >= minWordCount && paragraphCount >= 3;
  }

  /**
   * Extract target keyword from various content sources
   * Why this matters: Automatically determines the target keyword for CTA enhancement
   */
  extractTargetKeyword(
    title?: string,
    keyword?: string,
    postTitle?: string,
    competitorUrl?: string
  ): string {
    // Priority order: explicit keyword > post title > content title > competitor domain
    if (keyword) return keyword;
    if (postTitle) return postTitle;
    if (title) return title;
    if (competitorUrl) {
      // Extract domain name as fallback keyword
      try {
        const domain = new URL(competitorUrl).hostname.replace('www.', '');
        return domain.split('.')[0];
      } catch {
        return 'sales automation';
      }
    }
    return 'sales automation'; // Default fallback
  }

  /**
   * Determine campaign type based on workflow context
   * Why this matters: Ensures proper UTM tracking and CTA messaging based on the content source
   */
  determineCampaignType(
    workflowType?: string,
    competitorName?: string,
    isRedditContent?: boolean
  ): 'blog_creator' | 'competitor_conquesting' {
    if (competitorName || workflowType === 'competitor_conquesting') {
      return 'competitor_conquesting';
    }
    return 'blog_creator';
  }
}

export const contextualCtaService = new ContextualCtaService();
export default contextualCtaService;
