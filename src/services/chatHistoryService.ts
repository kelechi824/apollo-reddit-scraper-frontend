import { ChatMessage } from '../types';

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

class ChatHistoryService {
  private readonly STORAGE_KEY = 'apollo-chat-history';
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
}

// Export singleton instance
export const chatHistoryService = new ChatHistoryService();
export default chatHistoryService; 