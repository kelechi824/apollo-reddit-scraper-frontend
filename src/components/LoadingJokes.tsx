import React, { useState, useEffect } from 'react';
import { Smile, RefreshCw } from 'lucide-react';
import jokesService, { Joke } from '../services/jokesService';

interface LoadingJokesProps {
  /** Keywords from the current analysis to provide contextual jokes */
  keywords?: string;
  /** How often to change jokes (in milliseconds) */
  rotationInterval?: number;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Custom className */
  className?: string;
}

/**
 * LoadingJokes Component
 * Why this matters: Entertains users during loading states with sales and marketing jokes,
 * reducing perceived wait time and keeping users engaged while analysis runs
 */
const LoadingJokes: React.FC<LoadingJokesProps> = ({
  keywords,
  rotationInterval = 16000, // Change joke every 16 seconds - gives users time to read
  style,
  className
}) => {
  const [currentJoke, setCurrentJoke] = useState<Joke | null>(null);
  const [isLoadingJoke, setIsLoadingJoke] = useState(true);
  const [jokeIndex, setJokeIndex] = useState(0);
  const [recentJokeIds, setRecentJokeIds] = useState<string[]>([]);

  /**
   * Fetch a new joke based on context or randomly, avoiding recent duplicates
   * Why this matters: Provides fresh content and prevents showing the same joke consecutively
   */
  const fetchNewJoke = async () => {
    console.log('🎭 LoadingJokes: Fetching new joke...', { keywords, recentJokeIds });
    setIsLoadingJoke(true);
    
    try {
      let joke: Joke | null = null;
      let attempts = 0;
      const maxAttempts = 5; // Prevent infinite loops
      
      // Try to get a joke that hasn't been shown recently
      while (attempts < maxAttempts) {
        console.log(`🎭 LoadingJokes: Getting random joke from API (attempt ${attempts + 1})...`);
        joke = await jokesService.getRandomJoke();
        
        // If we got a joke and it's not in recent history, use it
        if (joke && !recentJokeIds.includes(joke.id)) {
          console.log('🎭 LoadingJokes: Got new unique joke:', joke.text);
          break;
        }
        
        // If it's a duplicate, try again (unless it's our last attempt)
        if (joke && recentJokeIds.includes(joke.id) && attempts < maxAttempts - 1) {
          console.log('🎭 LoadingJokes: Joke was recently shown, trying again...');
          joke = null;
        }
        
        attempts++;
      }
      
      console.log('🎭 LoadingJokes: Final API response:', joke);
      
      // Final fallback to offline joke if API fails
      if (!joke) {
        console.log('🎭 LoadingJokes: API failed, using fallback joke');
        joke = jokesService.getFallbackJoke();
      }
      
      // Update recent jokes history (keep last 10 jokes to avoid repeats)
      if (joke) {
        setRecentJokeIds(prev => {
          const updated = [joke!.id, ...prev].slice(0, 10); // Keep last 10 joke IDs
          return updated;
        });
      }
      
      setCurrentJoke(joke);
      setJokeIndex(prev => prev + 1);
      console.log('🎭 LoadingJokes: Set new joke:', joke?.text);
    } catch (error) {
      console.error('🎭 LoadingJokes: Error fetching joke:', error);
      // Use fallback joke on error
      const fallbackJoke = jokesService.getFallbackJoke();
      setCurrentJoke(fallbackJoke);
      
      // Add fallback joke to recent history too
      setRecentJokeIds(prev => [fallbackJoke.id, ...prev].slice(0, 10));
    } finally {
      setIsLoadingJoke(false);
    }
  };

  /**
   * Initialize with first joke on mount
   * Why this matters: Ensures users see entertainment immediately when loading starts
   */
  useEffect(() => {
    fetchNewJoke();
  }, [keywords]); // Re-fetch when keywords change for better context

  /**
   * Set up joke rotation timer
   * Why this matters: Keeps content fresh during longer loading periods
   */
  useEffect(() => {
    if (rotationInterval <= 0) return;

    const interval = setInterval(() => {
      fetchNewJoke();
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [rotationInterval, keywords]);

  /**
   * Get emoji based on joke category
   * Why this matters: Provides visual variety and category recognition
   */
  const getCategoryEmoji = (category: Joke['category']): string => {
    switch (category) {
      case 'sales':
        return '💼';
      case 'social_media':
        return '📱';
      case 'marketing':
        return '📊';
      case 'prospecting':
        return '🎯';
      case 'crm':
        return '🗃️';
      default:
        return '😄';
    }
  };

  if (!currentJoke) {
    return (
      <div 
        className={`loading-jokes-container ${className || ''}`}
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.75rem',
          margin: '1rem',
          ...style
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem',
          color: '#6b7280'
        }}>
          <RefreshCw 
            style={{ 
              width: '1rem', 
              height: '1rem',
              animation: 'spin 1s linear infinite'
            }} 
          />
          <span style={{ fontSize: '0.875rem' }}>Loading entertainment...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`loading-jokes-container ${className || ''}`}
      style={{
        padding: '1.5rem',
        textAlign: 'center',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        margin: '1rem',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...style
      }}
    >
      {/* Background decoration */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <Smile style={{ 
            width: '1.25rem', 
            height: '1.25rem', 
            color: '#3b82f6' 
          }} />
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            Humor Break
          </h4>
        </div>

        {/* Analysis Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: '#6b7280',
          marginBottom: '1rem'
        }}>
          <span>While we analyze your Reddit insights...</span>
          {isLoadingJoke && (
            <RefreshCw 
              style={{ 
                width: '0.875rem', 
                height: '0.875rem',
                animation: 'spin 1s linear infinite'
              }} 
            />
          )}
        </div>

        {/* Joke Text */}
        <div 
          key={jokeIndex} // Force re-render for animation
          style={{
            fontSize: '1rem',
            lineHeight: '1.6',
            color: '#1f2937',
            fontWeight: '500',
            animation: 'fadeInUp 0.6s ease-out',
            minHeight: '4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 1rem',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto'
          }}
        >
          {currentJoke.text}
        </div>

      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.2);
            }
          }

          /* Mobile responsive styles */
          @media (max-width: 768px) {
            .loading-jokes-container {
              margin: 0.5rem !important;
              padding: 1rem !important;
              min-height: 180px !important;
            }
            
            .loading-jokes-container h4 {
              font-size: 0.8125rem !important;
            }
            
            .loading-jokes-container > div:nth-child(2) > div:nth-child(2) {
              font-size: 0.9375rem !important;
              min-height: 4rem !important;
              padding: 0 0.5rem !important;
              line-height: 1.5 !important;
            }
            
            .loading-jokes-container > div:nth-child(2) > div:nth-child(3) {
              font-size: 0.6875rem !important;
            }
          }
          
          @media (max-width: 480px) {
            .loading-jokes-container {
              margin: 0.25rem !important;
              padding: 0.75rem !important;
              min-height: 160px !important;
            }
            
            .loading-jokes-container > div:nth-child(2) > div:nth-child(2) {
              font-size: 0.875rem !important;
              min-height: 3.5rem !important;
              padding: 0 0.25rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingJokes;
