import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import Preview from '../components/Preview';
import SaveAsModal from '../components/SaveAsModal';
import SettingsModal from '../components/SettingsModal';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';
import ChatModal from '../components/ChatModal';
import { getProject, updateProject, createProject } from '../services/projects';
import { useToast } from '../context/ToastContext';
import { useEditorHistory } from '../hooks/useEditorHistory';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { EditorHistoryState } from '../utils/historyManager';
import { formatCode } from '../utils/formatCode';
import { Project } from '../types';
import '../styles/Editor.css';

interface EditorState {
  projectId: number | null;
  projectName: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  saveStatus: 'saved' | 'unsaved' | 'saving' | null;
}

// Debounced preview state
interface PreviewState {
  html: string;
  css: string;
  js: string;
}

/**
 * Editor component - Main code editor interface
 *
 * Features:
 * - Three-column layout for HTML, CSS, and JavaScript
 * - Load existing projects via URL parameter
 * - Track unsaved changes with dirty flag
 * - Save and Save As functionality
 * - Navigate back to dashboard
 */
const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [state, setState] = useState<EditorState>({
    projectId: null,
    projectName: 'Untitled Project',
    htmlCode: '',
    cssCode: '',
    jsCode: '',
    isDirty: false,
    isLoading: false,
    error: null,
    isSaving: false,
    saveStatus: null
  });

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'javascript'>('html');
  const [showPreview, setShowPreview] = useState(true);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [saveAsMode, setSaveAsMode] = useState<'save' | 'saveAs'>('save');
  const saveStatusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Editor settings
  const { settings, updateSettings } = useEditorSettings();

  // Debounced preview state - updates 300ms after user stops typing
  const [previewState, setPreviewState] = useState<PreviewState>({
    html: '',
    css: '',
    js: ''
  });

  // History restoration handler
  const handleHistoryRestore = useCallback((historyState: EditorHistoryState) => {
    setState(prev => ({
      ...prev,
      htmlCode: historyState.html,
      cssCode: historyState.css,
      jsCode: historyState.js,
      isDirty: true
    }));
  }, []);

  // Initialize history hook
  const { undo, redo, canUndo, canRedo, clearHistory } = useEditorHistory({
    html: state.htmlCode,
    css: state.cssCode,
    js: state.jsCode,
    onRestore: handleHistoryRestore,
    debounceMs: 500
  });

  /**
   * Load project data when component mounts or ID changes
   */
  useEffect(() => {
    const loadProject = async () => {
      if (!id) {
        // New project - no need to load anything
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const projectId = parseInt(id, 10);
        if (isNaN(projectId)) {
          throw new Error('Invalid project ID');
        }

        const project: Project = await getProject(projectId);

        setState(prev => ({
          ...prev,
          projectId: project.id,
          projectName: project.name,
          htmlCode: project.html_code || '',
          cssCode: project.css_code || '',
          jsCode: project.js_code || '',
          isDirty: false,
          isLoading: false,
          error: null
        }));

        // Initialize preview state with loaded project
        setPreviewState({
          html: project.html_code || '',
          css: project.css_code || '',
          js: project.js_code || ''
        });

        // Clear history when loading a project
        clearHistory();
      } catch (error: any) {
        console.error('Failed to load project:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to load project'
        }));
      }
    };

    loadProject();
  }, [id, clearHistory]);

  /**
   * Debounce preview updates (300ms)
   * Updates preview state 300ms after user stops typing
   */
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setPreviewState({
        html: state.htmlCode,
        css: state.cssCode,
        js: state.jsCode
      });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [state.htmlCode, state.cssCode, state.jsCode]);

  /**
   * Warn user before leaving with unsaved changes
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isDirty]);


  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

  /**
   * Update HTML code and mark as dirty
   */
  const handleHtmlChange = (value: string) => {
    setState(prev => ({
      ...prev,
      htmlCode: value,
      isDirty: true
    }));
  };

  /**
   * Update CSS code and mark as dirty
   */
  const handleCssChange = (value: string) => {
    setState(prev => ({
      ...prev,
      cssCode: value,
      isDirty: true
    }));
  };

  /**
   * Update JavaScript code and mark as dirty
   */
  const handleJsChange = (value: string) => {
    setState(prev => ({
      ...prev,
      jsCode: value,
      isDirty: true
    }));
  };

  /**
   * Navigate back to dashboard
   */
  const handleBackToDashboard = () => {
    if (state.isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) {
        return;
      }
    }
    navigate('/dashboard');
  };

  /**
   * Save project to backend
   */
  const saveProject = async (projectId: number, name: string, html: string, css: string, js: string) => {
    setState(prev => ({ ...prev, isSaving: true, saveStatus: 'saving' }));

    try {
      const updatedProject = await updateProject(projectId, {
        name,
        html_code: html,
        css_code: css,
        js_code: js
      });

      setState(prev => ({
        ...prev,
        isDirty: false,
        isSaving: false,
        saveStatus: 'saved',
        projectName: updatedProject.name
      }));

      showToast('Project saved successfully', 'success');

      // Clear "Saved" status after 3 seconds
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
      saveStatusTimerRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, saveStatus: null }));
      }, 3000);
    } catch (error: any) {
      setState(prev => ({ ...prev, isSaving: false, saveStatus: 'unsaved' }));
      showToast(error.message || 'Failed to save project', 'error');
    }
  };

  /**
   * Create new project
   */
  const createNewProject = async (name: string, html: string, css: string, js: string) => {
    setState(prev => ({ ...prev, isSaving: true, saveStatus: 'saving' }));

    try {
      const newProject = await createProject(name, html, css, js);

      setState(prev => ({
        ...prev,
        projectId: newProject.id,
        projectName: newProject.name,
        isDirty: false,
        isSaving: false,
        saveStatus: 'saved'
      }));

      // Update URL without page reload
      navigate(`/editor/${newProject.id}`, { replace: true });

      showToast('Project created successfully', 'success');

      // Clear "Saved" status after 3 seconds
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
      saveStatusTimerRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, saveStatus: null }));
      }, 3000);
    } catch (error: any) {
      setState(prev => ({ ...prev, isSaving: false, saveStatus: 'unsaved' }));
      showToast(error.message || 'Failed to create project', 'error');
    }
  };

  /**
   * Handle Save button click
   * For existing projects: save directly
   * For new projects: show Save As modal
   */
  const handleSave = useCallback(() => {
    if (state.projectId) {
      // Existing project - save directly
      saveProject(
        state.projectId,
        state.projectName,
        state.htmlCode,
        state.cssCode,
        state.jsCode
      );
    } else {
      // New project - show modal to get name
      setSaveAsMode('save');
      setShowSaveAsModal(true);
    }
  }, [state.projectId, state.projectName, state.htmlCode, state.cssCode, state.jsCode]);

  /**
   * Keyboard shortcuts for undo/redo, save, and settings
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z - Redo
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
      // Ctrl+Y or Cmd+Y - Redo (alternative)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
      // Ctrl+S or Cmd+S - Save
      else if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Shift+S or Cmd+Shift+S - Save As
      else if ((e.ctrlKey || e.metaKey) && e.key === 's' && e.shiftKey) {
        e.preventDefault();
        handleSaveAs();
      }
      // Ctrl+/ or Cmd+/ - Show keyboard shortcuts (help)
      else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canUndo, canRedo, undo, redo, handleSave]);

  /**
   * Handle Save As button click
   * Always show modal to get a new name
   */
  const handleSaveAs = () => {
    setSaveAsMode('saveAs');
    setShowSaveAsModal(true);
  };

  /**
   * Handle save from modal
   */
  const handleModalSave = (name: string) => {
    setShowSaveAsModal(false);

    if (saveAsMode === 'saveAs') {
      // Always create new project for Save As
      createNewProject(name, state.htmlCode, state.cssCode, state.jsCode);
    } else {
      // Save mode for new project
      createNewProject(name, state.htmlCode, state.cssCode, state.jsCode);
    }
  };

  /**
   * Toggle preview visibility (useful for mobile)
   */
  const togglePreview = () => {
    setShowPreview(prev => !prev);
  };

  /**
   * Format code for the active editor using Prettier
   */
  const handleFormatCode = async () => {
    try {
      let formattedCode: string;

      switch (activeTab) {
        case 'html':
          formattedCode = await formatCode(state.htmlCode, 'html');
          handleHtmlChange(formattedCode);
          showToast('HTML formatted successfully', 'success');
          break;
        case 'css':
          formattedCode = await formatCode(state.cssCode, 'css');
          handleCssChange(formattedCode);
          showToast('CSS formatted successfully', 'success');
          break;
        case 'javascript':
          formattedCode = await formatCode(state.jsCode, 'javascript');
          handleJsChange(formattedCode);
          showToast('JavaScript formatted successfully', 'success');
          break;
      }
    } catch (error: any) {
      showToast('Failed to format code: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="editor editor--loading">
        <div className="editor__loading-spinner">Loading project...</div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="editor editor--error">
        <div className="editor__error">
          <h2>Error Loading Project</h2>
          <p>{state.error}</p>
          <button onClick={handleBackToDashboard} className="button button--primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor">
      {/* Header */}
      <header className="editor__header">
        <div className="editor__header-left">
          <h1 className="editor__project-name">
            {state.projectName}
            {state.isDirty && <span className="editor__dirty-indicator"> *</span>}
          </h1>
          {/* Save status indicator */}
          {state.saveStatus && (
            <span className={`editor__save-status editor__save-status--${state.saveStatus}`}>
              {state.saveStatus === 'saving' && 'Saving...'}
              {state.saveStatus === 'saved' && 'Saved'}
              {state.saveStatus === 'unsaved' && 'Unsaved changes'}
            </span>
          )}
        </div>
        <div className="editor__header-right">
          {/* Undo/Redo buttons */}
          <button
            onClick={undo}
            className="button button--secondary editor__undo-btn"
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            className="button button--secondary editor__redo-btn"
            disabled={!canRedo}
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            ↷ Redo
          </button>
          <button
            onClick={togglePreview}
            className="button button--secondary editor__toggle-preview"
            aria-label={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="button button--secondary"
            title="Editor Settings"
            aria-label="Open editor settings"
          >
            ⚙ Settings
          </button>
          <button
            onClick={() => setShowChatModal(true)}
            className="button button--secondary editor__ai-chat-btn"
            title="Open AI Assistant"
            aria-label="Open AI chat assistant"
          >
            💬 AI Chat
          </button>
          <button
            onClick={handleSave}
            className="button button--primary"
            disabled={!state.isDirty || state.isSaving}
            title="Save (Ctrl+S)"
          >
            {state.isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleSaveAs}
            className="button button--secondary"
            disabled={state.isSaving}
          >
            Save As
          </button>
          <button
            onClick={handleBackToDashboard}
            className="button button--secondary"
            disabled={state.isSaving}
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Editor Tabs */}
      <div className="editor__tabs">
        <div className="editor__tabs-left">
          <button
            className={`editor__tab ${activeTab === 'html' ? 'editor__tab--active' : ''}`}
            onClick={() => setActiveTab('html')}
          >
            HTML
          </button>
          <button
            className={`editor__tab ${activeTab === 'css' ? 'editor__tab--active' : ''}`}
            onClick={() => setActiveTab('css')}
          >
            CSS
          </button>
          <button
            className={`editor__tab ${activeTab === 'javascript' ? 'editor__tab--active' : ''}`}
            onClick={() => setActiveTab('javascript')}
          >
            JavaScript
          </button>
        </div>
        <div className="editor__tabs-right">
          <button
            className="button button--secondary button--small editor__format-btn"
            onClick={handleFormatCode}
            title="Format current code"
            aria-label="Format code"
          >
            Format Code
          </button>
        </div>
      </div>

      {/* Editor Layout with Split View */}
      <div className={`editor__layout ${showPreview ? 'editor__layout--split' : ''}`}>
        {/* Editor Content */}
        <div className="editor__content">
          <div className={`editor__pane ${activeTab === 'html' ? 'editor__pane--active' : ''}`}>
            <CodeEditor
              value={state.htmlCode}
              onChange={handleHtmlChange}
              language="html"
              fontSize={settings.fontSize}
              tabSize={settings.tabSize}
              theme={settings.theme}
            />
          </div>
          <div className={`editor__pane ${activeTab === 'css' ? 'editor__pane--active' : ''}`}>
            <CodeEditor
              value={state.cssCode}
              onChange={handleCssChange}
              language="css"
              fontSize={settings.fontSize}
              tabSize={settings.tabSize}
              theme={settings.theme}
            />
          </div>
          <div className={`editor__pane ${activeTab === 'javascript' ? 'editor__pane--active' : ''}`}>
            <CodeEditor
              value={state.jsCode}
              onChange={handleJsChange}
              language="javascript"
              fontSize={settings.fontSize}
              tabSize={settings.tabSize}
              theme={settings.theme}
            />
          </div>
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <div className="editor__preview">
            <Preview
              html={previewState.html}
              css={previewState.css}
              js={previewState.js}
            />
          </div>
        )}
      </div>

      {/* Save As Modal */}
      <SaveAsModal
        isOpen={showSaveAsModal}
        onClose={() => setShowSaveAsModal(false)}
        onSave={handleModalSave}
        defaultName={saveAsMode === 'saveAs' ? '' : state.projectName}
        isLoading={state.isSaving}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={updateSettings}
        currentSettings={settings}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* AI Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        codeContext={{
          html: state.htmlCode,
          css: state.cssCode,
          js: state.jsCode,
        }}
      />
    </div>
  );
};

export default Editor;
