/**
 * Frontend Jokes Service - Fetches entertaining jokes during loading states
 * Why this matters: Improves user experience by providing entertainment during wait times,
 * reducing perceived loading duration and keeping users engaged
 */

import { API_BASE_URL } from '../config/api';

export interface Joke {
  id: string;
  text: string;
  category: 'sales' | 'social_media' | 'marketing' | 'prospecting' | 'crm';
  tags: string[];
  generated_at: string;
}

export interface JokeResponse {
  success: boolean;
  joke?: Joke;
  jokes?: Joke[];
  count?: number;
  category?: string;
  timestamp: string;
  error?: string;
  message?: string;
}

class JokesService {
  private baseUrl = `${API_BASE_URL}/api/jokes`;

  /**
   * Get a random joke from all categories
   * Why this matters: Provides variety and keeps the loading experience fresh
   */
  async getRandomJoke(): Promise<Joke | null> {
    try {
      console.log('🎭 JokesService: Fetching from URL:', `${this.baseUrl}/random`);
      const response = await fetch(`${this.baseUrl}/random`);
      console.log('🎭 JokesService: Response status:', response.status);
      
      const data: JokeResponse = await response.json();
      console.log('🎭 JokesService: Response data:', data);
      
      if (data.success && data.joke) {
        console.log('🎭 JokesService: Successfully got joke:', data.joke.text);
        return data.joke;
      }
      
      console.warn('🎭 JokesService: Failed to fetch random joke:', data.message);
      return null;
    } catch (error) {
      console.error('🎭 JokesService: Error fetching random joke:', error);
      return null;
    }
  }

  /**
   * Get a random joke from a specific category
   * Why this matters: Allows contextual jokes based on what the user is doing
   */
  async getRandomJokeByCategory(category: Joke['category']): Promise<Joke | null> {
    try {
      const response = await fetch(`${this.baseUrl}/category/${category}`);
      const data: JokeResponse = await response.json();
      
      if (data.success && data.joke) {
        return data.joke;
      }
      
      console.warn(`Failed to fetch ${category} joke:`, data.message);
      return null;
    } catch (error) {
      console.error(`Error fetching ${category} joke:`, error);
      return null;
    }
  }

  /**
   * Get multiple random jokes for longer loading periods
   * Why this matters: Provides variety during extended loading times
   */
  async getMultipleRandomJokes(count: number = 3): Promise<Joke[]> {
    try {
      const response = await fetch(`${this.baseUrl}/multiple/${count}`);
      const data: JokeResponse = await response.json();
      
      if (data.success && data.jokes) {
        return data.jokes;
      }
      
      console.warn('Failed to fetch multiple jokes:', data.message);
      return [];
    } catch (error) {
      console.error('Error fetching multiple jokes:', error);
      return [];
    }
  }

  /**
   * Get jokes by specific tags for contextual humor
   * Why this matters: Allows matching jokes to specific contexts like Reddit analysis, CRM, etc.
   */
  async getJokesByTags(tags: string[]): Promise<Joke[]> {
    try {
      const response = await fetch(`${this.baseUrl}/by-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      });
      
      const data: JokeResponse = await response.json();
      
      if (data.success && data.jokes) {
        return data.jokes;
      }
      
      console.warn('Failed to fetch jokes by tags:', data.message);
      return [];
    } catch (error) {
      console.error('Error fetching jokes by tags:', error);
      return [];
    }
  }

  /**
   * Get all available joke categories
   * Why this matters: Allows frontend to know what categories are available
   */
  async getAvailableCategories(): Promise<Joke['category'][]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`);
      const data = await response.json();
      
      if (data.success && data.categories) {
        return data.categories;
      }
      
      console.warn('Failed to fetch categories:', data.message);
      return ['sales', 'social_media', 'marketing', 'prospecting', 'crm'];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return ['sales', 'social_media', 'marketing', 'prospecting', 'crm'];
    }
  }

  /**
   * Get a contextual joke based on the current analysis context using AI
   * Why this matters: Provides highly relevant humor based on what the user is analyzing
   */
  async getContextualJoke(keywords?: string): Promise<Joke | null> {
    if (!keywords || keywords.trim().length === 0) {
      return this.getRandomJoke();
    }

    try {
      const response = await fetch(`${this.baseUrl}/contextual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords: keywords.trim() }),
      });
      
      const data: JokeResponse = await response.json();
      
      if (data.success && data.joke) {
        return data.joke;
      }
      
      console.warn('Failed to fetch contextual joke:', data.message);
      // Fallback to random joke
      return this.getRandomJoke();
    } catch (error) {
      console.error('Error fetching contextual joke:', error);
      // Fallback to random joke
      return this.getRandomJoke();
    }
  }

  /**
   * Fallback jokes for when API is unavailable
   * Why this matters: Ensures users still get entertainment even if the backend is down
   */
  getFallbackJoke(): Joke {
    const fallbackJokes: Joke[] = [
      {
        id: 'fallback_1',
        text: "Why don't salespeople ever get lost? Because they always know how to find their way to a close! 🎯",
        category: 'sales',
        tags: ['closing', 'navigation'],
        generated_at: new Date().toISOString()
      },
      {
        id: 'fallback_2',
        text: "What's a social media manager's favorite type of coffee? Anything that goes viral! ☕",
        category: 'social_media',
        tags: ['viral', 'coffee'],
        generated_at: new Date().toISOString()
      },
      {
        id: 'fallback_3',
        text: "Why don't marketers ever get lost? They always have a clear customer journey map! 🗺️",
        category: 'marketing',
        tags: ['customer_journey', 'navigation'],
        generated_at: new Date().toISOString()
      },
      {
        id: 'fallback_4',
        text: "What do you call a salesperson who works from home? A remote closer! 🏠",
        category: 'sales',
        tags: ['remote', 'closing'],
        generated_at: new Date().toISOString()
      },
      {
        id: 'fallback_5',
        text: "Why did the CRM go to the doctor? It had too many duplicate contacts! 🏥",
        category: 'crm',
        tags: ['duplicates', 'health'],
        generated_at: new Date().toISOString()
      }
    ];

    const randomIndex = Math.floor(Math.random() * fallbackJokes.length);
    const selectedJoke = fallbackJokes[randomIndex];
    
    // Add timestamp to make each fallback joke unique
    return {
      ...selectedJoke,
      id: `${selectedJoke.id}_${Date.now()}`,
      generated_at: new Date().toISOString()
    };
  }
}

export default new JokesService();
