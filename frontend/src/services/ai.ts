import api from './api';

/**
 * Interface for chat messages
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Interface for code context
 */
export interface CodeContext {
  html?: string;
  css?: string;
  js?: string;
}

/**
 * Interface for AI API response
 */
interface AIResponse {
  message: string;
}

/**
 * Interface for AI API error response
 */
interface AIErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any[];
  };
}

/**
 * Send a message to the AI chat endpoint
 *
 * @param message - The user's message
 * @param codeContext - Optional code context (HTML, CSS, JS)
 * @param conversationHistory - Optional conversation history
 * @returns Promise resolving to the AI's response message
 */
export async function sendMessage(
  message: string,
  codeContext?: CodeContext,
  conversationHistory?: ChatMessage[]
): Promise<string> {
  try {
    const includeCode = !!codeContext && (
      !!codeContext.html ||
      !!codeContext.css ||
      !!codeContext.js
    );

    const payload: any = {
      message,
      includeCode,
    };

    // Add code context if provided
    if (includeCode && codeContext) {
      payload.html = codeContext.html || '';
      payload.css = codeContext.css || '';
      payload.js = codeContext.js || '';
    }

    // Add conversation history if provided (limit to last 20 messages)
    if (conversationHistory && conversationHistory.length > 0) {
      payload.conversationHistory = conversationHistory.slice(-20).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    const response = await api.post<AIResponse>('/ai/chat', payload);
    return response.data.message;
  } catch (error: any) {
    console.error('AI service error:', error);

    // Handle specific error responses
    if (error.response) {
      const errorData: AIErrorResponse = error.response.data;

      // Rate limit error
      if (error.response.status === 429) {
        throw new Error(
          errorData.error?.message ||
          'You have reached the rate limit. Please try again later.'
        );
      }

      // Service unavailable
      if (error.response.status === 503) {
        throw new Error(
          errorData.error?.message ||
          'AI service is currently unavailable. Please try again later.'
        );
      }

      // Validation error
      if (error.response.status === 400) {
        throw new Error(
          errorData.error?.message ||
          'Invalid request. Please check your message and try again.'
        );
      }

      // Authentication error
      if (error.response.status === 401) {
        throw new Error('You must be logged in to use the AI assistant.');
      }

      // Generic error with message from backend
      if (errorData.error?.message) {
        throw new Error(errorData.error.message);
      }
    }

    // Network error
    if (error.message === 'Network Error') {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }

    // Generic fallback error
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

/**
 * Check if the AI service is available
 *
 * @returns Promise resolving to availability status
 */
export async function checkAIStatus(): Promise<boolean> {
  try {
    const response = await api.get<{ available: boolean }>('/ai/status');
    return response.data.available;
  } catch (error) {
    console.error('Failed to check AI status:', error);
    return false;
  }
}
