import React, { useState, useEffect, useRef } from 'react';
import '../styles/Preview.css';

interface PreviewProps {
  html: string;
  css: string;
  js: string;
}

interface PreviewError {
  message: string;
  line?: number;
  column?: number;
}

/**
 * Preview component - Displays live preview of HTML/CSS/JS code
 *
 * Features:
 * - Real-time preview using iframe
 * - Error handling for JavaScript errors
 * - Toolbar with refresh and open in new tab options
 * - Loading state indicator
 */
const Preview: React.FC<PreviewProps> = ({ html, css, js }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<PreviewError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Combine HTML, CSS, and JavaScript into a complete document
   */
  const combineCode = (htmlCode: string, cssCode: string, jsCode: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    ${cssCode}
  </style>
</head>
<body>
  ${htmlCode}
  <script>
    // Error handling wrapper
    window.addEventListener('error', function(event) {
      window.parent.postMessage({
        type: 'error',
        message: event.message,
        line: event.lineno,
        column: event.colno
      }, '*');
    });

    // User code
    try {
      ${jsCode}
    } catch (error) {
      window.parent.postMessage({
        type: 'error',
        message: error.message,
        line: error.lineNumber,
        column: error.columnNumber
      }, '*');
    }
  </script>
</body>
</html>`;
  };

  /**
   * Listen for error messages from iframe
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'error') {
        setError({
          message: event.data.message,
          line: event.data.line,
          column: event.data.column
        });
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  /**
   * Update iframe content when code changes
   */
  useEffect(() => {
    // Clear any previous errors
    setError(null);
    setIsLoading(true);

    // Small delay to show loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [html, css, js, refreshKey]);

  /**
   * Manually refresh the preview
   */
  const handleRefresh = () => {
    setError(null);
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Open preview in a new tab
   */
  const handleOpenInNewTab = () => {
    const combinedCode = combineCode(html, css, js);
    const blob = new Blob([combinedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    // Clean up the object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const combinedCode = combineCode(html, css, js);

  return (
    <div className="preview">
      {/* Preview Toolbar */}
      <div className="preview__toolbar">
        <span className="preview__title">Preview</span>
        <div className="preview__toolbar-actions">
          <button
            onClick={handleRefresh}
            className="preview__toolbar-button"
            title="Refresh preview"
            aria-label="Refresh preview"
          >
            ↻
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="preview__toolbar-button"
            title="Open in new tab"
            aria-label="Open in new tab"
          >
            ⧉
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="preview__content">
        {isLoading && (
          <div className="preview__loading">
            <div className="preview__loading-spinner">Loading...</div>
          </div>
        )}

        {error && (
          <div className="preview__error-overlay">
            <div className="preview__error-content">
              <h3 className="preview__error-title">JavaScript Error</h3>
              <p className="preview__error-message">{error.message}</p>
              {error.line && (
                <p className="preview__error-location">
                  Line {error.line}{error.column ? `, Column ${error.column}` : ''}
                </p>
              )}
              <button
                onClick={() => setError(null)}
                className="preview__error-dismiss"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          srcDoc={combinedCode}
          title="Preview"
          className="preview__iframe"
          sandbox="allow-scripts allow-modals"
        />
      </div>
    </div>
  );
};

export default Preview;
