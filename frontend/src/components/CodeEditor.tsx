import React, { useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import '../styles/CodeEditor.css';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'html' | 'css' | 'javascript';
  placeholder?: string;
  fontSize?: number;
  tabSize?: number;
  theme?: 'light' | 'dark';
}

/**
 * CodeEditor component - A code editor with syntax highlighting
 *
 * Features:
 * - Syntax highlighting using Prism.js
 * - Monospace font styling
 * - Tab key inserts spaces instead of changing focus
 * - Configurable font size, tab size, and theme
 * - Language-specific placeholder text
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  placeholder,
  fontSize = 14,
  tabSize = 2,
  theme = 'light'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const getPrismLanguage = () => {
    switch (language) {
      case 'html':
        return 'markup';
      case 'css':
        return 'css';
      case 'javascript':
        return 'javascript';
      default:
        return 'markup';
    }
  };
  useEffect(() => {
    if (highlightRef.current) {
      const prismLang = getPrismLanguage();
      const codeElement = highlightRef.current.querySelector('code');
      if (codeElement && Prism.languages[prismLang]) {
        const highlighted = Prism.highlight(
          value || '',
          Prism.languages[prismLang],
          prismLang
        );
        codeElement.innerHTML = highlighted || value || '';
      }
    }
  }, [value, language]);
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      const highlightContainer = highlightRef.current.parentElement;
      if (highlightContainer) {
        highlightContainer.scrollTop = textareaRef.current.scrollTop;
        highlightContainer.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };
  /**
   * Handle tab key press to insert spaces instead of changing focus
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = ' '.repeat(tabSize);
      const newValue = value.substring(0, start) + spaces + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize;
      }, 0);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (language) {
      case 'html':
        return '<!-- Write your HTML here -->';
      case 'css':
        return '/* Write your CSS here */';
      case 'javascript':
        return '// Write your JavaScript here';
      default:
        return 'Write your code here';
    }
  };
  return (
    <div
      className={`code-editor code-editor--${theme}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="code-editor__wrapper">
        {/* Syntax highlighting overlay */}
        <div className="code-editor__highlight-container">
          <pre
            ref={highlightRef}
            className={`code-editor__highlight language-${getPrismLanguage()}`}
            aria-hidden="true"
          >
            <code className={`language-${getPrismLanguage()}`} />
          </pre>
        </div>
        {/* Textarea for input */}
        <textarea
          ref={textareaRef}
          className={`code-editor__textarea code-editor__textarea--${language}`}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={getPlaceholder()}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            tabSize: tabSize,
            MozTabSize: tabSize,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
