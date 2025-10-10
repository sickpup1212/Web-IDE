import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';

export type Language = 'html' | 'css' | 'javascript';
export type Theme = 'light' | 'dark';

interface CodeEditorProps {
  value: string;
  language: Language;
  onChange: (value: string) => void;
  placeholder?: string;
  fontSize?: number;
  tabSize?: number;
  theme?: Theme;
}

const languageExtensions = {
  html: html(),
  css: css(),
  javascript: javascript(),
};

/**
 * CodeEditor component - A code editor with syntax highlighting using CodeMirror
 *
 * Features:
 * - Advanced syntax highlighting using CodeMirror
 * - Line numbers and gutter
 * - Tab key inserts spaces
 * - Configurable font size, tab size, and theme
 * - Automatic code folding
 * - Bracket matching
 * - Search and replace
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
  placeholder = 'Enter your code here...',
  fontSize = 14,
  tabSize = 2,
  theme = 'light',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        languageExtensions[language],
        ...(theme === 'dark' ? [oneDark] : []),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorState.tabSize.of(tabSize),
        EditorView.theme({
          '&': {
            fontSize: `${fontSize}px`,
            height: '100%',
          },
          '.cm-scroller': {
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
            overflow: 'auto',
          },
          '.cm-gutters': {
            backgroundColor: theme === 'dark' ? '#282c34' : '#f5f5f5',
            color: theme === 'dark' ? '#858585' : '#666',
            border: 'none',
          },
          '.cm-content': {
            caretColor: theme === 'dark' ? '#528bff' : '#000',
          },
          '&.cm-focused': {
            outline: 'none',
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, theme, fontSize, tabSize]);

  // Update content when value prop changes externally
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
      viewRef.current.dispatch(transaction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="code-editor"
      style={{
        height: '100%',
        width: '100%',
      }}
    />
  );
};

export default CodeEditor;
