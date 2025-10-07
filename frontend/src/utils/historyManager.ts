/**
 * History Manager Utility
 *
 * Manages undo/redo functionality for the editor
 * Maintains separate stacks for undo and redo operations
 * Limits history to 50 states to prevent memory issues
 */

export interface EditorHistoryState {
  html: string;
  css: string;
  js: string;
  timestamp: number;
}

export class HistoryManager {
  private undoStack: EditorHistoryState[] = [];
  private redoStack: EditorHistoryState[] = [];
  private readonly maxHistorySize: number = 50;

  /**
   * Push a new state to the undo stack
   * Clears the redo stack when a new change is made
   */
  pushState(state: EditorHistoryState): void {
    // Add to undo stack
    this.undoStack.push(state);

    // Limit stack size to prevent memory issues
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift(); // Remove oldest state
    }

    // Clear redo stack when new change is made
    this.redoStack = [];
  }

  /**
   * Undo the last change
   * Returns the previous state, or null if nothing to undo
   */
  undo(currentState: EditorHistoryState): EditorHistoryState | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    // Push current state to redo stack
    this.redoStack.push(currentState);

    // Limit redo stack size
    if (this.redoStack.length > this.maxHistorySize) {
      this.redoStack.shift();
    }

    // Pop and return previous state from undo stack
    return this.undoStack.pop()!;
  }

  /**
   * Redo the last undone change
   * Returns the next state, or null if nothing to redo
   */
  redo(currentState: EditorHistoryState): EditorHistoryState | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    // Push current state back to undo stack
    this.undoStack.push(currentState);

    // Limit undo stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    // Pop and return next state from redo stack
    return this.redoStack.pop()!;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all history
   * Useful when loading a new project
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get the size of the undo stack
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get the size of the redo stack
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }
}

// Export singleton instance
export const historyManager = new HistoryManager();
