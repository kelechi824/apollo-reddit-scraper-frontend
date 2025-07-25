import { ChatMessage, GongAnalyzedCall } from '../types';

export interface ChatHistoryItem {
  id: string;
  postId: string;
  postTitle: string;
  postSubreddit: string;
  conversationId: string;
  messages: ChatMessage[];
  conversationStage: string;
  lastUpdated: string;
  createdAt: string;
}

/**
 * Interface for Gong call conversation history items
 * Why this matters: Enables CRO conversation persistence across sessions with call-specific context
 */
export interface GongChatHistoryItem {
  id: string;
  callId: string;
  callTitle: string;
  callSentiment: 'positive' | 'negative' | 'neutral';
  callDate: string;
  callDuration: number;
  conversationId: string;
  messages: ChatMessage[];
  conversationStage: string;
  lastUpdated: string;
  createdAt: string;
}

class ChatHistoryService {
  private readonly STORAGE_KEY = 'apollo-chat-history';
  private readonly GONG_STORAGE_KEY = 'apollo-gong-chat-history';
  private readonly MAX_HISTORY_ITEMS = 50; // Limit to prevent localStorage bloat

  /**
   * Save or update a conversation in history
   * Why this matters: Preserves conversation context across page refreshes and sessions.
   */
  saveConversation(
    postId: string,
    postTitle: string,
    postSubreddit: string,
    conversationId: string,
    messages: ChatMessage[],
    conversationStage: string
  ): void {
    const historyItems = this.getHistory();
    const existingIndex = historyItems.findIndex(item => item.postId === postId);
    
    const conversationItem: ChatHistoryItem = {
      id: existingIndex >= 0 ? historyItems[existingIndex].id : this.generateId(),
      postId,
      postTitle,
      postSubreddit,
      conversationId,
      messages: [...messages], // Deep copy to avoid reference issues
      conversationStage,
      lastUpdated: new Date().toISOString(),
      createdAt: existingIndex >= 0 ? historyItems[existingIndex].createdAt : new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing conversation
      historyItems[existingIndex] = conversationItem;
    } else {
      // Add new conversation at the beginning
      historyItems.unshift(conversationItem);
    }

    // Limit history size
    if (historyItems.length > this.MAX_HISTORY_ITEMS) {
      historyItems.splice(this.MAX_HISTORY_ITEMS);
    }

    this.saveHistory(historyItems);
  }

  /**
   * Get conversation for a specific post
   * Why this matters: Allows resuming conversations when reopening the same post.
   */
  getConversationForPost(postId: string): ChatHistoryItem | null {
    const historyItems = this.getHistory();
    return historyItems.find(item => item.postId === postId) || null;
  }

  /**
   * Get all chat history sorted by last updated
   * Why this matters: Provides a list of all previous conversations for the history UI.
   */
  getHistory(): ChatHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  /**
   * Delete a specific conversation
   * Why this matters: Allows users to clean up their chat history.
   */
  deleteConversation(postId: string): void {
    const historyItems = this.getHistory();
    const filteredItems = historyItems.filter(item => item.postId !== postId);
    this.saveHistory(filteredItems);
  }

  /**
   * Clear all chat history
   * Why this matters: Provides a way to reset all conversations if needed.
   */
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get conversation count for a specific time period
   * Why this matters: Provides usage statistics for the feature.
   */
  getConversationCount(days: number = 7): number {
    const historyItems = this.getHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return historyItems.filter(item => 
      new Date(item.lastUpdated) > cutoffDate
    ).length;
  }

  // =============================================================================
  // GONG CALL CONVERSATION METHODS
  // =============================================================================

  /**
   * Save or update a Gong call conversation in history
   * Why this matters: Preserves CRO conversation context across page refreshes and sessions.
   */
  saveGongConversation(
    callId: string,
    callTitle: string,
    callSentiment: 'positive' | 'negative' | 'neutral',
    callDate: string,
    callDuration: number,
    conversationId: string,
    messages: ChatMessage[],
    conversationStage: string
  ): void {
    const historyItems = this.getGongHistory();
    const existingIndex = historyItems.findIndex(item => item.callId === callId);
    
    const conversationItem: GongChatHistoryItem = {
      id: existingIndex >= 0 ? historyItems[existingIndex].id : this.generateId(),
      callId,
      callTitle,
      callSentiment,
      callDate,
      callDuration,
      conversationId,
      messages: [...messages], // Deep copy to avoid reference issues
      conversationStage,
      lastUpdated: new Date().toISOString(),
      createdAt: existingIndex >= 0 ? historyItems[existingIndex].createdAt : new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing conversation
      historyItems[existingIndex] = conversationItem;
    } else {
      // Add new conversation at the beginning
      historyItems.unshift(conversationItem);
    }

    // Limit history size
    if (historyItems.length > this.MAX_HISTORY_ITEMS) {
      historyItems.splice(this.MAX_HISTORY_ITEMS);
    }

    this.saveGongHistory(historyItems);
  }

  /**
   * Save Gong conversation from analyzed call data
   * Why this matters: Convenient method to save conversations using call analysis data
   */
  saveGongConversationFromCall(
    call: GongAnalyzedCall,
    conversationId: string,
    messages: ChatMessage[],
    conversationStage: string
  ): void {
    this.saveGongConversation(
      call.id,
      call.title,
      call.sentiment,
      call.date,
      call.duration,
      conversationId,
      messages,
      conversationStage
    );
  }

  /**
   * Get Gong conversation for a specific call
   * Why this matters: Allows resuming CRO conversations when reopening the same call.
   */
  getGongConversationForCall(callId: string): GongChatHistoryItem | null {
    const historyItems = this.getGongHistory();
    return historyItems.find(item => item.callId === callId) || null;
  }

  /**
   * Get all Gong chat history sorted by last updated
   * Why this matters: Provides a list of all previous CRO conversations for the history UI.
   */
  getGongHistory(): GongChatHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.GONG_STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading Gong chat history:', error);
      return [];
    }
  }

  /**
   * Delete a specific Gong conversation
   * Why this matters: Allows users to clean up their CRO chat history.
   */
  deleteGongConversation(callId: string): void {
    const historyItems = this.getGongHistory();
    const filteredItems = historyItems.filter(item => item.callId !== callId);
    this.saveGongHistory(filteredItems);
  }

  /**
   * Clear all Gong chat history
   * Why this matters: Provides a way to reset all CRO conversations if needed.
   */
  clearGongHistory(): void {
    localStorage.removeItem(this.GONG_STORAGE_KEY);
  }

  /**
   * Get Gong conversation count for a specific time period
   * Why this matters: Provides usage statistics for the CRO feature.
   */
  getGongConversationCount(days: number = 7): number {
    const historyItems = this.getGongHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return historyItems.filter(item => 
      new Date(item.lastUpdated) > cutoffDate
    ).length;
  }

  private saveHistory(historyItems: ChatHistoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(historyItems));
    } catch (error) {
      console.error('Error saving chat history:', error);
      // If localStorage is full, try to clear old conversations
      if (error instanceof DOMException && error.code === 22) {
        this.clearOldConversations();
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(historyItems));
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError);
        }
      }
    }
  }

  private clearOldConversations(): void {
    const historyItems = this.getHistory();
    // Keep only the 20 most recent conversations
    const recentItems = historyItems
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 20);
    
    this.saveHistory(recentItems);
  }

  private generateId(): string {
    return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save Gong chat history to localStorage with error handling
   * Why this matters: Persists CRO conversation data with proper error recovery
   */
  private saveGongHistory(historyItems: GongChatHistoryItem[]): void {
    try {
      localStorage.setItem(this.GONG_STORAGE_KEY, JSON.stringify(historyItems));
    } catch (error) {
      console.error('Error saving Gong chat history:', error);
      // If localStorage is full, try to clear old conversations
      if (error instanceof DOMException && error.code === 22) {
        this.clearOldGongConversations();
        try {
          localStorage.setItem(this.GONG_STORAGE_KEY, JSON.stringify(historyItems));
        } catch (retryError) {
          console.error('Failed to save Gong chat history even after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Clear old Gong conversations to free up localStorage space
   * Why this matters: Prevents localStorage bloat while preserving recent CRO conversations
   */
  private clearOldGongConversations(): void {
    const historyItems = this.getGongHistory();
    // Keep only the 20 most recent conversations
    const recentItems = historyItems
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 20);
    
    this.saveGongHistory(recentItems);
  }
}

// Export singleton instance
export const chatHistoryService = new ChatHistoryService();
export default chatHistoryService; 