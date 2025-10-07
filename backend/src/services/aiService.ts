import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful coding assistant specialized in web development.
Your expertise includes HTML, CSS, and JavaScript.

When helping users:
- Provide clear, concise explanations
- Include practical code examples
- Explain why certain approaches are better
- Consider modern web development best practices
- Be encouraging and patient with beginners
- If code context is provided, reference it in your responses

When examining user code:
- Point out potential issues or bugs
- Suggest improvements for readability and performance
- Explain what the code does in simple terms
- Recommend best practices

Always format code in your responses using markdown code blocks with appropriate language tags (html, css, js for JavaScript).`;

interface CodeContext {
  html?: string;
  css?: string;
  js?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class AIService {
  private client: Anthropic | null = null;
  private readonly model = 'claude-3-5-sonnet-20241022';
  private readonly maxTokens = 4096;

  constructor() {
    // Initialize Anthropic client only if API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      console.warn('ANTHROPIC_API_KEY is not configured. AI chat functionality will not be available.');
      this.client = null;
    } else {
      try {
        this.client = new Anthropic({
          apiKey: apiKey,
        });
      } catch (error) {
        console.error('Failed to initialize Anthropic client:', error);
        this.client = null;
      }
    }
  }

  /**
   * Format code context into a readable prompt section
   */
  private formatCodeContext(codeContext?: CodeContext): string {
    if (!codeContext || (!codeContext.html && !codeContext.css && !codeContext.js)) {
      return '';
    }

    let contextStr = '\n\nHere is the user\'s current project code:\n\n';

    if (codeContext.html) {
      contextStr += '**HTML:**\n```html\n' + codeContext.html + '\n```\n\n';
    }

    if (codeContext.css) {
      contextStr += '**CSS:**\n```css\n' + codeContext.css + '\n```\n\n';
    }

    if (codeContext.js) {
      contextStr += '**JavaScript:**\n```js\n' + codeContext.js + '\n```\n\n';
    }

    return contextStr;
  }

  /**
   * Send a chat message to Claude and get a response
   * @param message - The user's message
   * @param codeContext - Optional code context to include
   * @param conversationHistory - Optional previous messages for context
   * @returns The AI's response message
   */
  async sendChatMessage(
    message: string,
    codeContext?: CodeContext,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    // Check if client is initialized
    if (!this.client) {
      throw new Error(
        'AI service is not available. Please configure ANTHROPIC_API_KEY in your environment variables.'
      );
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    try {
      // Format the user message with code context if provided
      const formattedMessage = message + this.formatCodeContext(codeContext);

      // Build messages array with conversation history
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      // Add conversation history if provided
      if (conversationHistory && conversationHistory.length > 0) {
        // Limit history to last 10 messages to avoid token limits
        const recentHistory = conversationHistory.slice(-10);
        messages.push(...recentHistory);
      }

      // Add the current message
      messages.push({
        role: 'user',
        content: formattedMessage,
      });

      // Call Anthropic API
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: SYSTEM_PROMPT,
        messages: messages,
      });

      // Extract and return the response text
      if (response.content && response.content.length > 0) {
        const textContent = response.content.find((block) => block.type === 'text');
        if (textContent && 'text' in textContent) {
          return textContent.text;
        }
      }

      throw new Error('No response content received from AI');
    } catch (error: any) {
      // Handle specific Anthropic API errors
      if (error.status === 401) {
        throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY configuration.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      } else if (error.status === 500 || error.status === 503) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else if (error.message && error.message.includes('API key')) {
        throw new Error('API key configuration error: ' + error.message);
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Network error. Unable to connect to AI service.');
      } else if (error.message) {
        throw new Error('AI service error: ' + error.message);
      } else {
        throw new Error('An unexpected error occurred while processing your request.');
      }
    }
  }

  /**
   * Check if the AI service is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }
}

// Export singleton instance
export default new AIService();
