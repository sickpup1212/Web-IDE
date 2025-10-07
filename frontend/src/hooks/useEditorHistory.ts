/**
 * useEditorHistory Hook
 *
 * Custom hook for managing editor history with undo/redo functionality
 * Integrates with the HistoryManager utility
 * Provides debounced history updates to avoid storing every keystroke
 */

import { useRef, useCallback, useEffect } from 'react';
import { HistoryManager, EditorHistoryState } from '../utils/historyManager';

export interface UseEditorHistoryOptions {
  html: string;
  css: string;
  js: string;
  onRestore: (state: EditorHistoryState) => void;
  debounceMs?: number;
}

export interface UseEditorHistoryReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

/**
 * Hook for managing editor history
 */
export function useEditorHistory({
  html,
  css,
  js,
  onRestore,
  debounceMs = 500
}: UseEditorHistoryOptions): UseEditorHistoryReturn {
  const historyManagerRef = useRef(new HistoryManager());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);
  const lastSavedStateRef = useRef<EditorHistoryState | null>(null);

  /**
   * Push current state to history (debounced)
   */
  useEffect(() => {
    // Don't push to history if we're currently restoring a state
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      const currentState: EditorHistoryState = {
        html,
        css,
        js,
        timestamp: Date.now()
      };

      // Only push if state has actually changed
      if (
        !lastSavedStateRef.current ||
        lastSavedStateRef.current.html !== html ||
        lastSavedStateRef.current.css !== css ||
        lastSavedStateRef.current.js !== js
      ) {
        historyManagerRef.current.pushState(currentState);
        lastSavedStateRef.current = currentState;
      }
    }, debounceMs);

    // Cleanup timer
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [html, css, js, debounceMs]);

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    const currentState: EditorHistoryState = {
      html,
      css,
      js,
      timestamp: Date.now()
    };

    const previousState = historyManagerRef.current.undo(currentState);

    if (previousState) {
      isRestoringRef.current = true;
      onRestore(previousState);
      lastSavedStateRef.current = previousState;
    }
  }, [html, css, js, onRestore]);

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    const currentState: EditorHistoryState = {
      html,
      css,
      js,
      timestamp: Date.now()
    };

    const nextState = historyManagerRef.current.redo(currentState);

    if (nextState) {
      isRestoringRef.current = true;
      onRestore(nextState);
      lastSavedStateRef.current = nextState;
    }
  }, [html, css, js, onRestore]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    historyManagerRef.current.clear();
    lastSavedStateRef.current = null;
  }, []);

  return {
    undo,
    redo,
    canUndo: historyManagerRef.current.canUndo(),
    canRedo: historyManagerRef.current.canRedo(),
    clearHistory
  };
}
