/**
 * Google Docs API Service
 * Why this matters: Handles authentication and document creation with Google Docs API
 * for seamless content publishing workflow using Google Identity Services (GIS).
 */

interface GoogleAuthResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GoogleDocsRequest {
  title: string;
  content: string;
}

// Declare Google Identity Services types
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
        };
      };
    };
    gapi: any;
  }
}

class GoogleDocsService {
  private clientId: string;
  private scopes: string;
  private isInitialized: boolean = false;
  private tokenClient: any = null;
  private accessToken: string = '';

  constructor() {
    this.clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
    this.scopes = 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file';
  }

  /**
   * Initialize Google APIs and Identity Services
   * Why this matters: Loads both GAPI for API calls and GIS for modern OAuth authentication.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.clientId) {
      throw new Error('Google Client ID is not configured. Please check your environment variables.');
    }

    // Load Google APIs and Identity Services
    await Promise.all([
      this.loadGapi(),
      this.loadGoogleIdentityServices()
    ]);

    this.isInitialized = true;
  }

  /**
   * Load Google APIs (GAPI) for making API calls
   * Why this matters: Needed for Google Docs and Drive API calls.
   */
  private async loadGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = async () => {
          await new Promise<void>((gapiResolve) => {
            window.gapi.load('client', gapiResolve);
          });
          
          await window.gapi.client.init({
            discoveryDocs: [
              'https://docs.googleapis.com/$discovery/rest?version=v1',
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
            ]
          });
          
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google APIs script'));
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }

  /**
   * Load Google Identity Services (GIS) for OAuth authentication
   * Why this matters: Modern OAuth flow that replaces the deprecated auth2 library.
   */
  private async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          // Initialize the token client
          this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: this.scopes,
            callback: (response: any) => {
              if (response.error) {
                console.error('Token client error:', response);
                return;
              }
              this.accessToken = response.access_token;
              console.log('Successfully received access token');
            },
          });
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if user is authenticated
   * Why this matters: Determines if we need to prompt for authentication.
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Authenticate user with Google using modern OAuth flow
   * Why this matters: Prompts user for Google account access to create documents.
   */
  async authenticate(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      // Set up callback for this specific authentication request
      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error('Authentication error:', response);
          reject(new Error(`Authentication failed: ${response.error}`));
          return;
        }
        
        this.accessToken = response.access_token;
        console.log('Authentication successful');
        resolve();
      };

      // Request access token
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  /**
   * Convert HTML content to Google Docs format
   * Why this matters: Transforms HTML into Google Docs API-compatible requests.
   */
  private convertHtmlToDocsRequests(htmlContent: string): any[] {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    const requests: any[] = [];
    let index = 1; // Start after title

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          requests.push({
            insertText: {
              location: { index },
              text: text + '\n'
            }
          });
          index += text.length + 1;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        
        switch (element.tagName.toLowerCase()) {
          case 'h1':
          case 'h2':
          case 'h3':
            const headingText = element.textContent?.trim();
            if (headingText) {
              requests.push({
                insertText: {
                  location: { index },
                  text: headingText + '\n\n'
                }
              });
              
              // Apply heading style
              const headingLevel = parseInt(element.tagName.charAt(1));
              requests.push({
                updateParagraphStyle: {
                  range: {
                    startIndex: index,
                    endIndex: index + headingText.length
                  },
                  paragraphStyle: {
                    namedStyleType: `HEADING_${headingLevel}`
                  },
                  fields: 'namedStyleType'
                }
              });
              
              index += headingText.length + 2;
            }
            break;
            
          case 'p':
            const pText = element.textContent?.trim();
            if (pText) {
              requests.push({
                insertText: {
                  location: { index },
                  text: pText + '\n\n'
                }
              });
              index += pText.length + 2;
            }
            break;
            
          case 'ul':
          case 'ol':
            element.childNodes.forEach(child => {
              if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toLowerCase() === 'li') {
                const liText = child.textContent?.trim();
                if (liText) {
                  const bulletText = element.tagName.toLowerCase() === 'ul' ? '• ' : '1. ';
                  requests.push({
                    insertText: {
                      location: { index },
                      text: bulletText + liText + '\n'
                    }
                  });
                  index += bulletText.length + liText.length + 1;
                }
              }
            });
            requests.push({
              insertText: {
                location: { index },
                text: '\n'
              }
            });
            index += 1;
            break;
            
          case 'strong':
          case 'b':
            const boldText = element.textContent?.trim();
            if (boldText) {
              requests.push({
                insertText: {
                  location: { index },
                  text: boldText
                }
              });
              
              // Apply bold formatting
              requests.push({
                updateTextStyle: {
                  range: {
                    startIndex: index,
                    endIndex: index + boldText.length
                  },
                  textStyle: {
                    bold: true
                  },
                  fields: 'bold'
                }
              });
              
              index += boldText.length;
            }
            break;
            
          default:
            // Process child nodes for other elements
            element.childNodes.forEach(processNode);
            break;
        }
      }
    };

    tempDiv.childNodes.forEach(processNode);
    return requests;
  }

  /**
   * Create new Google Doc with content
   * Why this matters: Creates a new document and populates it with formatted content.
   */
  async createDocument(title: string, htmlContent: string): Promise<string> {
    if (!this.isAuthenticated()) {
      await this.authenticate();
    }

    try {
      // Set the access token for GAPI requests
      window.gapi.client.setToken({
        access_token: this.accessToken
      });

      // Create new document
      const createResponse = await window.gapi.client.docs.documents.create({
        resource: {
          title: title
        }
      });

      const documentId = createResponse.result.documentId;
      
      if (!documentId) {
        throw new Error('Failed to create document');
      }

      // Convert HTML to Google Docs requests
      const requests = this.convertHtmlToDocsRequests(htmlContent);
      
      if (requests.length > 0) {
        // Apply content to document
        await window.gapi.client.docs.documents.batchUpdate({
          documentId: documentId,
          resource: {
            requests: requests
          }
        });
      }

      // Return the document URL
      return `https://docs.google.com/document/d/${documentId}/edit`;
      
    } catch (error) {
      console.error('Error creating Google Doc:', error);
      throw new Error('Failed to create Google Document. Please try again.');
    }
  }

  /**
   * Sign out user
   * Why this matters: Allows users to disconnect their Google account.
   */
  async signOut(): Promise<void> {
    this.accessToken = '';
    
    // Revoke the access token if it exists
    if (this.accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST',
          headers: {
            'Content-type': 'application/x-www-form-urlencoded'
          }
        });
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }
  }
}

// Global type declarations for Google APIs
declare global {
  interface Window {
    gapi: any;
  }
}

export const googleDocsService = new GoogleDocsService();
export default googleDocsService; 