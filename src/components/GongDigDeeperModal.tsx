import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, ExternalLink, Paperclip, Image as ImageIcon, ThumbsUp, ThumbsDown, Copy, Check, TrendingUp, Users, Clock } from 'lucide-react';
import { 
  ChatMessage, 
  StartGongConversationRequest, 
  StartGongConversationResponse,
  SendGongMessageRequest,
  SendGongMessageResponse,
  GongAnalyzedCall 
} from '../types';
import { chatHistoryService } from '../services/chatHistoryService';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';

interface GongDigDeeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: GongAnalyzedCall;
}

/**
 * GongDigDeeperModal Component
 * Why this matters: Provides CRO-focused AI guidance that transforms customer call insights
 * into actionable landing page optimizations and conversion rate improvements.
 */
const GongDigDeeperModal: React.FC<GongDigDeeperModalProps> = ({ isOpen, onClose, call }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStage, setConversationStage] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
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
   * Why this matters: Ensures CRO managers always see the latest optimization recommendation.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Test if a Gong conversation still exists on the backend
   * Why this matters: Prevents errors when trying to use expired conversation IDs from localStorage.
   */
  const testConversationExists = async (conversationId: string) => {
    try {
      // Send a test message to see if conversation exists
      // Determine backend URL based on environment
      // Why this matters: Ensures production deployments use the correct backend URL
      // Use centralized API configuration
      
      const response = await fetch(buildApiUrl('/api/gong-chat/message'), {
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
        console.log('Backend Gong conversation expired, starting fresh');
        setMessages([]);
        setConversationId(null);
        setConversationStage('');
        setIsResumedConversation(false);
        startConversation();
      } else {
        // Conversation exists, but don't add ping/pong messages to UI
        const data = await response.json();
        if (data.assistant_message?.content === '__PONG__') {
          console.log('Gong conversation verified, continuing with existing messages');
        }
      }
    } catch (error) {
      console.log('Error testing Gong conversation, starting fresh:', error);
      // On error, start fresh
      setMessages([]);
      setConversationId(null);
      setConversationStage('');
      setIsResumedConversation(false);
      startConversation();
    }
  };

  /**
   * Start new CRO conversation when modal opens
   * Why this matters: Initializes CRO optimization guidance with specific call context and customer insights.
   */
  const startConversation = async () => {
    if (!call) return;

    setIsInitializing(true);
    
    // Add minimum 3-second animation time for better user experience
    const startTime = Date.now();
    const minAnimationTime = 3000; // 3 seconds
    
    try {
      const request: StartGongConversationRequest = {
        call_id: call.id,
        title: call.title,
        date: call.date,
        duration: call.duration,
        participants: call.participants,
        sentiment: call.sentiment,
        callSummary: call.analysis.callSummary,
        painPoints: call.analysis.painPoints,
        croOpportunity: call.analysis.croOpportunity
      };

      // Determine backend URL based on environment  
      // Why this matters: Ensures production deployments use the correct backend URL
      // Use centralized API configuration
      
      const response = await fetch(buildApiUrl('/api/gong-chat/start-conversation'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to start CRO conversation');
      }

      const data: StartGongConversationResponse = await response.json();
      
      // Ensure minimum animation time has passed
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minAnimationTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setConversationId(data.conversation_id);
      setMessages([data.initial_message]);
      setConversationStage('Opportunity Assessment');

      // Save initial conversation to history (using call-specific key)
      chatHistoryService.saveConversation(
        `gong-${call.id}`,
        call.title,
        `Call Analysis`,
        data.conversation_id,
        [data.initial_message],
        'Opportunity Assessment'
      );

    } catch (error) {
      console.error('Error starting CRO conversation:', error);
      
      // Ensure minimum animation time even for fallback
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minAnimationTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      // Add fallback message with CRO focus
      const fallbackMessage: ChatMessage = {
        id: 'fallback-1',
        role: 'assistant',
        content: `Welcome to your CRO optimization session! I'm here to help you turn insights from this ${call.sentiment} call into actionable conversion improvements.\n\nBased on the call summary, what specific landing page elements do you think need the most attention for conversion optimization?`,
        timestamp: new Date().toISOString()
      };
      setMessages([fallbackMessage]);
      setConversationId('fallback-conversation'); // Set fallback conversation ID
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Send message to CRO AI and get response
   * Why this matters: Continues the CRO optimization process with contextual AI guidance focused on conversion improvements.
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
    const baseUrl = API_BASE_URL;
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/gong-chat/message`, {
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

      const data: SendGongMessageResponse = await response.json();
      const updatedMessages = [...messages, userMessage, data.assistant_message];
      setMessages(updatedMessages);
      
      const newStage = data.conversation_stage || conversationStage;
      if (data.conversation_stage) {
        setConversationStage(newStage);
      }

      // Save conversation to history (using call-specific key)
      if (conversationId) {
        chatHistoryService.saveConversation(
          `gong-${call.id}`,
          call.title,
          'Call Analysis',
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
      console.error('Error sending message to CRO AI:', error);
      // Add fallback response with CRO focus
      const fallbackResponse: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble processing that optimization request right now. Can you share more details about the specific conversion challenge you're facing?",
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
   * Why this matters: Provides intuitive chat UX with keyboard shortcuts for rapid CRO discussion.
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Handle file input change
   * Why this matters: Allows CRO managers to attach landing page screenshots for visual analysis.
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
   * Why this matters: Provides easy access to image attachment functionality for landing page analysis.
   */
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle copying CRO recommendation content
   * Why this matters: Allows CRO managers to easily copy AI recommendations for implementation.
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
   * Handle feedback on CRO AI responses
   * Why this matters: Collects feedback to improve CRO recommendation quality and relevance.
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
    const baseUrl = API_BASE_URL;
      await fetch(`${baseUrl.replace(/\/$/, '')}/api/gong-chat/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_id: messageId,
          feedback: feedback,
          call_id: call.id
        }),
      });
    } catch (error) {
      console.error('Error sending CRO feedback:', error);
      // Don't show error to user, just log it
    }
  };

  /**
   * Format call duration for display
   * Why this matters: Provides context about call length for CRO analysis depth.
   */
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  /**
   * Get sentiment color and icon
   * Why this matters: Visual context helps CRO managers understand call outcome at a glance.
   */
  const getSentimentDisplay = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return { color: '#10B981', label: 'Positive Call', icon: '😊' };
      case 'negative':
        return { color: '#EF4444', label: 'Challenging Call', icon: '😐' };
      default:
        return { color: '#6B7280', label: 'Neutral Call', icon: '😐' };
    }
  };

  /**
   * Load conversation from history or start new one
   * Why this matters: Preserves CRO optimization conversations across sessions.
   */
  useEffect(() => {
    if (isOpen && call) {
      // Only process if this is a different call or we don't have a conversation loaded
      if (currentCallId !== call.id) {
        setCurrentCallId(call.id);
        
        // Try to load existing conversation from history (using call-specific key)
        const existingConversation = chatHistoryService.getConversationForPost(`gong-${call.id}`);
        
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
  }, [isOpen, call, currentCallId]);

  /**
   * Auto-scroll to bottom when new messages arrive
   * Why this matters: Keeps the CRO optimization conversation flowing naturally.
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

  const sentimentDisplay = getSentimentDisplay(call.sentiment);

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
      
      {/* Modal - Very Wide for CRO Analysis */}
      <div 
        className={`dig-deeper-modal ${isOpen ? 'open' : ''}`}
        style={{
          visibility: isOpen ? 'visible' : 'hidden',
          width: '95vw',
          maxWidth: '80rem', // Much wider for CRO analysis
          height: '90vh'
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
                <h2 className="dig-deeper-modal-title">Apollo CRO AI Assistant</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="dig-deeper-modal-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Call Context */}
          <div className="dig-deeper-modal-context">
            <h3 className="dig-deeper-modal-context-title">Optimizing Insights From:</h3>
            <p className="dig-deeper-modal-context-post">{call.title}</p>
            <div className="dig-deeper-modal-context-meta">
              <span 
                className="dig-deeper-modal-badge"
                style={{ 
                  backgroundColor: sentimentDisplay.color,
                  color: 'white'
                }}
              >
                {sentimentDisplay.icon} {sentimentDisplay.label}
              </span>
              <span className="dig-deeper-modal-badge">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(call.duration)}
              </span>
              <span className="dig-deeper-modal-badge">
                <Users className="w-3 h-3 mr-1" />
                {call.participants.length} participants
              </span>
              {conversationStage && (
                <span 
                  className="dig-deeper-modal-stage"
                  style={{ 
                    backgroundColor: '#EBF212',
                    color: '#000'
                  }}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
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
              <span className="dig-deeper-modal-loading-text">Starting CRO optimization session...</span>
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
                          title="Copy CRO recommendation"
                        >
                          <Copy style={{ width: '0.875rem', height: '0.875rem' }} />
                        </button>
                        <button
                          onClick={() => handleMessageFeedback(message.id, 'positive')}
                          className={`dig-deeper-feedback-btn ${messageFeedback[message.id] === 'positive' ? 'active positive' : ''}`}
                          title="This CRO guidance was helpful"
                        >
                          <ThumbsUp style={{ width: '0.875rem', height: '0.875rem' }} />
                        </button>
                        <button
                          onClick={() => handleMessageFeedback(message.id, 'negative')}
                          className={`dig-deeper-feedback-btn ${messageFeedback[message.id] === 'negative' ? 'active negative' : ''}`}
                          title="This CRO guidance could be improved"
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
                          Thanks for your CRO feedback!
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
                <span className="dig-deeper-typing-text">Analyzing CRO opportunities...</span>
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
                  Landing page screenshot attached
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
              placeholder="Ask about conversion optimization strategies..."
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
                title="Attach landing page screenshot"
              >
                <ImageIcon style={{ width: '1.125rem', height: '1.125rem', marginRight: '0.5rem' }} />
                Attach Screenshot
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || !conversationId}
                className="dig-deeper-send-btn-optimized"
                style={{ backgroundColor: '#EBF212', color: '#000' }}
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
            Press Enter to send • Shift+Enter for new line • ESC to close • Share your landing page challenges
          </div>
        </div>
      </div>
    </>
  );
};

export default GongDigDeeperModal; 