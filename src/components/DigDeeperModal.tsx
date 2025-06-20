import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { 
  ChatMessage, 
  StartConversationRequest, 
  StartConversationResponse,
  SendMessageRequest,
  SendMessageResponse,
  AnalyzedPost 
} from '../types';
import { chatHistoryService } from '../services/chatHistoryService';

interface DigDeeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: AnalyzedPost;
}

/**
 * DigDeeperModal Component
 * Why this matters: Provides an AI-powered socratic learning interface that guides users
 * through pain point discovery and Apollo solution positioning in real-time.
 */
const DigDeeperModal: React.FC<DigDeeperModalProps> = ({ isOpen, onClose, post }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStage, setConversationStage] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [isResumedConversation, setIsResumedConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Scroll to bottom of messages
   * Why this matters: Ensures users always see the latest message in the conversation.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Test if a conversation still exists on the backend
   * Why this matters: Prevents errors when trying to use expired conversation IDs from localStorage.
   */
  const testConversationExists = async (conversationId: string) => {
    try {
      // Send a test message to see if conversation exists
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3003'}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: '__PING__' // Special ping message
        }),
      });

      if (!response.ok) {
        // Conversation doesn't exist, start fresh
        console.log('Backend conversation expired, starting fresh');
        setMessages([]);
        setConversationId(null);
        setConversationStage('');
        setIsResumedConversation(false);
        startConversation();
      } else {
        // Conversation exists, but don't add ping/pong messages to UI
        const data = await response.json();
        if (data.assistant_message?.content === '__PONG__') {
          console.log('Conversation verified, continuing with existing messages');
        }
      }
    } catch (error) {
      console.log('Error testing conversation, starting fresh:', error);
      // On error, start fresh
      setMessages([]);
      setConversationId(null);
      setConversationStage('');
      setIsResumedConversation(false);
      startConversation();
    }
  };

  /**
   * Start new conversation when modal opens
   * Why this matters: Initializes the socratic learning journey with specific Reddit post context.
   */
  const startConversation = async () => {
    if (!post) return;

    setIsInitializing(true);
    try {
      const request: StartConversationRequest = {
        post_id: post.id,
        title: post.title,
        content: post.content || '',
        pain_point: post.analysis.pain_point,
        audience_insight: post.analysis.audience_insight
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3003'}/api/chat/start-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data: StartConversationResponse = await response.json();
      setConversationId(data.conversation_id);
      setMessages([data.initial_message]);
      setConversationStage('Pain Exploration');

      // Save initial conversation to history
      chatHistoryService.saveConversation(
        post.id,
        post.title,
        post.subreddit,
        data.conversation_id,
        [data.initial_message],
        'Pain Exploration'
      );

    } catch (error) {
      console.error('Error starting conversation:', error);
      // Add fallback message
      const fallbackMessage: ChatMessage = {
        id: 'fallback-1',
        role: 'assistant',
        content: `Welcome to the discovery process! I'm here to help you dig deeper into this pain point: "${post.analysis.pain_point}"\n\nWhat specific challenges do you think this person faces in their daily workflow?`,
        timestamp: new Date().toISOString()
      };
      setMessages([fallbackMessage]);
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Send message to AI and get response
   * Why this matters: Continues the socratic discovery process with contextual AI responses.
   */
  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const request: SendMessageRequest = {
        conversation_id: conversationId,
        message: inputMessage.trim()
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3003'}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: SendMessageResponse = await response.json();
      const updatedMessages = [...messages, userMessage, data.assistant_message];
      setMessages(updatedMessages);
      
      const newStage = data.conversation_stage || conversationStage;
      if (data.conversation_stage) {
        setConversationStage(newStage);
      }

      // Save conversation to history
      if (conversationId) {
        chatHistoryService.saveConversation(
          post.id,
          post.title,
          post.subreddit,
          conversationId,
          updatedMessages,
          newStage
        );
      }

      // Refocus input field after receiving response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      // Add fallback response
      const fallbackResponse: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble processing that right now. Can you rephrase your thoughts about this challenge?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackResponse]);
      
      // Refocus input field after fallback response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key press in input
   * Why this matters: Provides intuitive chat UX with keyboard shortcuts.
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Load conversation from history or start new one
   * Why this matters: Preserves conversation across page refreshes and allows resuming chats.
   */
  useEffect(() => {
    if (isOpen && post) {
      // Only process if this is a different post or we don't have a conversation loaded
      if (currentPostId !== post.id) {
        setCurrentPostId(post.id);
        
        // Try to load existing conversation from history
        const existingConversation = chatHistoryService.getConversationForPost(post.id);
        
        if (existingConversation) {
          // Try to resume existing conversation
          setMessages(existingConversation.messages);
          setConversationId(existingConversation.conversationId);
          setConversationStage(existingConversation.conversationStage);
          setInputMessage('');
          setIsResumedConversation(true);
          
          // Test if the backend conversation still exists by sending a ping
          testConversationExists(existingConversation.conversationId);
        } else {
          // Start new conversation
          setMessages([]);
          setConversationId(null);
          setConversationStage('');
          setInputMessage('');
          setIsResumedConversation(false);
          startConversation();
        }
      }
    }
  }, [isOpen, post, currentPostId]);

  /**
   * Auto-scroll to bottom when new messages arrive
   * Why this matters: Keeps the conversation flowing naturally.
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Focus input when modal opens
   * Why this matters: Ready for user interaction immediately.
   */
  useEffect(() => {
    if (isOpen && !isInitializing) {
      inputRef.current?.focus();
    }
  }, [isOpen, isInitializing]);

  /**
   * Handle ESC key to close modal
   * Why this matters: Standard modal behavior for accessibility.
   */
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`dig-deeper-modal-backdrop ${isOpen ? 'open' : ''}`}
        style={{
          visibility: isOpen ? 'visible' : 'hidden'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`dig-deeper-modal ${isOpen ? 'open' : ''}`}
        style={{
          visibility: isOpen ? 'visible' : 'hidden'
        }}
      >
        
        {/* Header */}
        <div className="dig-deeper-modal-header">
          <div className="dig-deeper-modal-header-top">
            <div className="dig-deeper-modal-branding">
              <div className="dig-deeper-modal-logo">
                <img src="/apollo logo only.png" alt="Apollo" />
              </div>
              <div>
                <h2 className="dig-deeper-modal-title">Apollo Conversation AI Assistant</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="dig-deeper-modal-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Post Context */}
          <div className="dig-deeper-modal-context">
            <h3 className="dig-deeper-modal-context-title">Exploring:</h3>
            <p className="dig-deeper-modal-context-post">{post.title}</p>
            <div className="dig-deeper-modal-context-meta">
              <span className="dig-deeper-modal-badge">r/{post.subreddit}</span>
              {conversationStage && (
                <span className="dig-deeper-modal-stage">
                  {conversationStage}
                </span>
              )}
              {isResumedConversation && (
                <span className="dig-deeper-modal-resumed">
                  Resumed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="dig-deeper-modal-messages">
          {isInitializing ? (
            <div className="dig-deeper-modal-loading">
              <div className="loading-spinner"></div>
              <span className="dig-deeper-modal-loading-text">Starting discovery session...</span>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`dig-deeper-message ${message.role}`}>
                <div className={`dig-deeper-message-content ${message.role}`}>
                  <div>{message.content}</div>
                  <div className={`dig-deeper-message-time ${message.role}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="dig-deeper-typing">
              <div className="dig-deeper-typing-content">
                <div className="loading-spinner loading-spinner-sm"></div>
                <span className="dig-deeper-typing-text">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="dig-deeper-modal-input">
          <div className="dig-deeper-input-row">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts..."
              disabled={isLoading || isInitializing}
              className="dig-deeper-input"
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || isInitializing}
              className="dig-deeper-send-btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="dig-deeper-input-hint">
            Press Enter to send • ESC to close
          </div>
        </div>
      </div>
    </>
  );
};

export default DigDeeperModal; 