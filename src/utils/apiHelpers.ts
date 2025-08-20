/**
 * API Helper Utilities
 * Why this matters: Provides robust error handling for API responses to prevent
 * JSON parsing errors that cause production build failures
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Safe JSON response parser that handles both JSON and text responses
 * Why this matters: In production, error responses might return HTML or plain text
 * instead of JSON, causing "Unexpected token" errors when parsed
 */
export async function safeJsonParse<T = any>(response: Response): Promise<ApiResponse<T>> {
  try {
    // First check if the response indicates JSON content
    const contentType = response.headers.get('content-type');
    const isJsonResponse = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      // For error responses, try to get the text first
      const errorText = await response.text();
      
      // If it looks like JSON, try to parse it
      if (isJsonResponse || errorText.trim().startsWith('{')) {
        try {
          const errorData = JSON.parse(errorText);
          return {
            success: false,
            error: errorData.error || errorData.message || 'API Error',
            message: errorData.message || errorText
          };
        } catch {
          // If JSON parsing fails, return the text as error
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            message: errorText || 'Unknown API error'
          };
        }
      } else {
        // Non-JSON error response (HTML error page, plain text, etc.)
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: errorText || 'Unknown API error'
        };
      }
    }
    
    // For successful responses, parse as JSON
    const responseText = await response.text();
    
    if (!responseText.trim()) {
      return {
        success: true,
        data: {} as T
      };
    }
    
    try {
      const data = JSON.parse(responseText);
      return {
        success: true,
        data
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText.substring(0, 200) + '...');
      
      return {
        success: false,
        error: 'Invalid JSON response from server',
        message: `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`
      };
    }
  } catch (networkError) {
    console.error('Network or response error:', networkError);
    return {
      success: false,
      error: 'Network error',
      message: networkError instanceof Error ? networkError.message : 'Unknown network error'
    };
  }
}

/**
 * Make an API request with robust error handling
 * Why this matters: Provides a consistent interface for all API calls
 * with proper error handling for production environments
 */
export async function makeApiRequest<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    return await safeJsonParse<T>(response);
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: 'Request failed',
      message: error instanceof Error ? error.message : 'Unknown request error'
    };
  }
}

/**
 * Build API URL with proper trailing slash handling
 * Why this matters: Ensures consistent URL formatting across the application
 */
export function buildApiUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
