import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, ExternalLink, Paperclip, Image as ImageIcon, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
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
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'positive' | 'negative' | null>>({});
  const [showThanksMessage, setShowThanksMessage] = useState<string | null>(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Determine backend URL based on environment  
      // Why this matters: Ensures production deployments use the correct backend URL
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://apollo-reddit-scraper-backend.vercel.app'
        : 'http://localhost:3003';
      
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/chat/message`, {
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
    
    // Add minimum 3-second animation time for better user experience
    const startTime = Date.now();
    const minAnimationTime = 3000; // 3 seconds
    
    try {
      const request: StartConversationRequest = {
        post_id: post.id,
        title: post.title,
        content: post.content || '',
        pain_point: post.analysis.pain_point,
        audience_insight: post.analysis.audience_insight
      };

      // Determine backend URL based on environment
      // Why this matters: Ensures production deployments use the correct backend URL  
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://apollo-reddit-scraper-backend.vercel.app'
        : 'http://localhost:3003';
      
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/chat/start-conversation`, {
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
      
      // Ensure minimum animation time has passed
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minAnimationTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
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
      
      // Ensure minimum animation time even for fallback
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minAnimationTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      // Add fallback message
      const fallbackMessage: ChatMessage = {
        id: 'fallback-1',
        role: 'assistant',
        content: `Welcome to the discovery process! I'm here to help you dig deeper into this pain point: "${post.analysis.pain_point}"\n\nWhat specific challenges do you think this person faces in their daily workflow?`,
        timestamp: new Date().toISOString()
      };
      setMessages([fallbackMessage]);
      setConversationId('fallback-conversation'); // Set fallback conversation ID
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
      // Determine backend URL based on environment
    // Why this matters: Ensures production deployments use the correct backend URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://apollo-reddit-scraper-backend.vercel.app'
      : 'http://localhost:3003';
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: inputMessage.trim()
        }),
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
   * Handle key down events in textarea
   * Why this matters: Provides intuitive chat UX with keyboard shortcuts, allowing Shift+Enter for new lines.
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Handle file input change
   * Why this matters: Allows users to attach images for visual context in conversations.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAttachedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Remove attached image
   * Why this matters: Allows users to remove accidentally attached images before sending.
   */
  const removeAttachedImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Open file picker
   * Why this matters: Provides easy access to image attachment functionality.
   */
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle copying assistant message content
   * Why this matters: Allows users to easily copy AI insights for use in their own communications.
   */
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      
      // Show copied message
      setShowCopiedMessage(messageId);
      
      // Hide copied message after 2 seconds
      setTimeout(() => {
        setShowCopiedMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setShowCopiedMessage(messageId);
        setTimeout(() => {
          setShowCopiedMessage(null);
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  /**
   * Handle feedback on AI responses
   * Why this matters: Collects user feedback for reinforcement learning and improving AI responses.
   */
  const handleMessageFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    // Update local state
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: feedback
    }));

    // Show thanks message
    setShowThanksMessage(messageId);
    
    // Hide thanks message after 3 seconds
    setTimeout(() => {
      setShowThanksMessage(null);
    }, 3000);

    // Send feedback to backend for collection
    try {
      // Determine backend URL based on environment
    // Why this matters: Ensures production deployments use the correct backend URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://apollo-reddit-scraper-backend.vercel.app'
      : 'http://localhost:3003';
      await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_id: messageId,
          feedback: feedback,
          post_id: post.id
        }),
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
      // Don't show error to user, just log it
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
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#D93801',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '0.75rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#B8310A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#D93801';
                }}
              >
                Join conversation on Reddit
                <ExternalLink style={{width: '0.75rem', height: '0.75rem', marginLeft: '0.375rem'}} />
              </a>
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
                  
                  {/* Feedback buttons for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="dig-deeper-feedback-section">
                      <div className="dig-deeper-feedback-buttons">
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="dig-deeper-feedback-btn dig-deeper-copy-btn"
                          title="Copy message"
                        >
                          <Copy style={{ width: '0.875rem', height: '0.875rem' }} />
                        </button>
                        <button
                          onClick={() => handleMessageFeedback(message.id, 'positive')}
                          className={`dig-deeper-feedback-btn ${messageFeedback[message.id] === 'positive' ? 'active positive' : ''}`}
                          title="This response was helpful"
                        >
                          <ThumbsUp style={{ width: '0.875rem', height: '0.875rem' }} />
                        </button>
                        <button
                          onClick={() => handleMessageFeedback(message.id, 'negative')}
                          className={`dig-deeper-feedback-btn ${messageFeedback[message.id] === 'negative' ? 'active negative' : ''}`}
                          title="This response could be improved"
                        >
                          <ThumbsDown style={{ width: '0.875rem', height: '0.875rem' }} />
                        </button>
                      </div>
                      
                      {/* Copied message */}
                      {showCopiedMessage === message.id && (
                        <div className="dig-deeper-copied-message">
                          <Check style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                          Copied!
                        </div>
                      )}
                      
                      {/* Thanks message */}
                      {showThanksMessage === message.id && (
                        <div className="dig-deeper-thanks-message">
                          Thanks for your feedback!
                        </div>
                      )}
                    </div>
                  )}
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
          {/* Image Preview */}
          {imagePreview && (
            <div style={{ 
              padding: '1rem', 
              borderTop: '0.0625rem solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: '#f9fafb'
            }}>
              <img 
                src={imagePreview} 
                alt="Attached" 
                style={{ 
                  width: '3.75rem', 
                  height: '3.75rem', 
                  objectFit: 'cover', 
                  borderRadius: '0.5rem',
                  border: '0.0625rem solid #d1d5db'
                }} 
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500' }}>
                  {attachedImage?.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                  Image attached
                </p>
              </div>
              <button
                onClick={removeAttachedImage}
                style={{
                  padding: '0.5rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          )}
          
          <div className="dig-deeper-input-container">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share your thoughts..."
              disabled={isLoading}
              className="dig-deeper-input dig-deeper-textarea"
              rows={3}
              style={{
                resize: 'none',
                minHeight: '80px',
                maxHeight: '12.5rem',
                overflowY: 'auto',
                width: '100%'
              }}
            />
            
            <div className="dig-deeper-action-row">
              <button
                onClick={openFilePicker}
                disabled={isLoading}
                className="dig-deeper-attach-btn"
                title="Attach image"
              >
                <ImageIcon style={{ width: '1.125rem', height: '1.125rem', marginRight: '0.5rem' }} />
                Attach Image
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || !conversationId}
                className="dig-deeper-send-btn-optimized"
              >
                <Send style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Send
              </button>
            </div>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <div className="dig-deeper-input-hint">
            Press Enter to send • Shift+Enter for new line • ESC to close
          </div>
        </div>
      </div>
    </>
  );
};

export default DigDeeperModal; 