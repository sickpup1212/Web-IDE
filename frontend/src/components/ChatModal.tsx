import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, checkAIStatus, ChatMessage, CodeContext } from '../services/ai';
import '../styles/ChatModal.css';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeContext: CodeContext;
}

/**
 * ChatModal component - AI chat interface
 *
 * Features:
 * - Modal overlay with chat interface
 * - Scrollable chat history area
 * - Message input and send button
 * - "Include project code" checkbox
 * - Format code blocks in responses
 * - Chat history persistence in localStorage
 * - Copy button for code blocks
 * - Timestamps for messages
 * - Clear chat functionality
 * - AI service availability check
 */
const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, codeContext }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [includeCode, setIncludeCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  // Check AI service status when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsCheckingStatus(true);
      checkAIStatus().then((available) => {
        setIsAIAvailable(available);
        setIsCheckingStatus(false);
        if (!available) {
          setError('AI service is not configured. Please ask your administrator to set up the ANTHROPIC_API_KEY.');
        }
      }).catch(() => {
        setIsAIAvailable(false);
        setIsCheckingStatus(false);
        setError('Failed to check AI service status. Please try again later.');
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('ai-chat-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setChatHistory(parsedHistory);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('ai-chat-history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);
  /**
   * Handle sending a message to the AI
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isAIAvailable) {
      return;
    }
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    setInputMessage('');
    setError(null);
    setIsLoading(true);
    try {
      const contextToSend = includeCode ? codeContext : undefined;
      const response = await sendMessage(
        userMessage.content,
        contextToSend,
        chatHistory
      );
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to get response from AI');
    } finally {
      setIsLoading(false);
    }
  };
  /**
   * Handle Enter key press in input
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  /**
   * Clear chat history
   */
  const handleClearChat = () => {
    const confirmed = window.confirm('Are you sure you want to clear the chat history?');
    if (confirmed) {
      setChatHistory([]);
      localStorage.removeItem('ai-chat-history');
      setError(null);
    }
  };

  /**
   * Copy code block content to clipboard
   */
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  /**
   * Format message content with code blocks
   */
  const formatMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
          const language = match[1] || 'plaintext';
          const code = match[2].trim();
          return (
            <div key={index} className="chat-modal__code-block">
              <div className="chat-modal__code-header">
                <span className="chat-modal__code-language">{language}</span>
                <button
                  className="chat-modal__copy-button"
                  onClick={() => handleCopyCode(code)}
                  title="Copy code"
                >
                  Copy
                </button>
              </div>
              <pre className="chat-modal__code">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
      }
      return (
        <span key={index} className="chat-modal__text">
          {part.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {line}
              {lineIndex < part.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      );
    });
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  if (!isOpen) {
    return null;
  }
  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-modal__header">
          <h2 className="chat-modal__title">AI Assistant</h2>
          <div className="chat-modal__header-actions">
            {chatHistory.length > 0 && (
              <button
                className="chat-modal__clear-button"
                onClick={handleClearChat}
                title="Clear chat history"
              >
                Clear Chat
              </button>
            )}
            <button
              className="chat-modal__close-button"
              onClick={onClose}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
        </div>
        {/* Chat History Area */}
        <div className="chat-modal__history" ref={chatHistoryRef}>
          {isCheckingStatus && (
            <div className="chat-modal__empty-state">
              <p>Checking AI service status...</p>
            </div>
          )}
          {!isCheckingStatus && isAIAvailable === false && (
            <div className="chat-modal__empty-state">
              <p style={{ color: '#f44336', fontWeight: 'bold' }}>AI Service Not Available</p>
              <p className="chat-modal__empty-hint">
                The AI assistant is currently not configured. Please contact your administrator to set up the ANTHROPIC_API_KEY in the backend environment configuration.
              </p>
              <p className="chat-modal__empty-hint" style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
                To enable AI chat:
                <br />1. Get an API key from https://console.anthropic.com/
                <br />2. Update the ANTHROPIC_API_KEY in backend/.env
                <br />3. Restart the backend server
              </p>
            </div>
          )}
          {!isCheckingStatus && isAIAvailable && chatHistory.length === 0 && !isLoading && (
            <div className="chat-modal__empty-state">
              <p>Start a conversation with the AI assistant!</p>
              <p className="chat-modal__empty-hint">
                Ask questions about HTML, CSS, JavaScript, or get help with your code.
              </p>
            </div>
          )}
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`chat-modal__message chat-modal__message--${message.role}`}
            >
              <div className="chat-modal__message-header">
                <span className="chat-modal__message-role">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <span className="chat-modal__message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className="chat-modal__message-content">
                {formatMessageContent(message.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-modal__message chat-modal__message--assistant">
              <div className="chat-modal__message-header">
                <span className="chat-modal__message-role">AI Assistant</span>
              </div>
              <div className="chat-modal__message-content chat-modal__loading">
                <span className="chat-modal__loading-dot"></span>
                <span className="chat-modal__loading-dot"></span>
                <span className="chat-modal__loading-dot"></span>
                <span className="chat-modal__loading-text">AI is thinking...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="chat-modal__error">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
        {/* Input Area */}
        <div className="chat-modal__input-area">
          <div className="chat-modal__input-wrapper">
            <textarea
              className="chat-modal__input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isAIAvailable === false
                  ? "AI service not configured - chat disabled"
                  : "Ask a question or request help with your code..."
              }
              rows={3}
              disabled={isLoading || isCheckingStatus || isAIAvailable === false}
            />
          </div>
          <div className="chat-modal__controls">
            <label className="chat-modal__checkbox-label">
              <input
                type="checkbox"
                checked={includeCode}
                onChange={(e) => setIncludeCode(e.target.checked)}
                disabled={isLoading || isCheckingStatus || isAIAvailable === false}
              />
              <span>Include project code</span>
            </label>
            <button
              className="chat-modal__send-button"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || isCheckingStatus || isAIAvailable === false}
            >
              {isLoading ? 'Sending...' : isAIAvailable === false ? 'AI Unavailable' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
