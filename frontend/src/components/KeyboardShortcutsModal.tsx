import React, { useEffect } from 'react';
import '../styles/KeyboardShortcutsModal.css';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // File Operations
  { keys: 'Ctrl+S', description: 'Save project', category: 'File Operations' },
  { keys: 'Ctrl+Shift+S', description: 'Save project as new copy', category: 'File Operations' },

  // Editing
  { keys: 'Ctrl+Z', description: 'Undo last change', category: 'Editing' },
  { keys: 'Ctrl+Y or Ctrl+Shift+Z', description: 'Redo last undone change', category: 'Editing' },
  { keys: 'Tab', description: 'Insert spaces (tab size from settings)', category: 'Editing' },

  // Navigation
  { keys: 'Ctrl+/', description: 'Show keyboard shortcuts help', category: 'Navigation' },
  { keys: 'Esc', description: 'Close open modal/dialog', category: 'Navigation' },
];

/**
 * KeyboardShortcutsModal component - Display available keyboard shortcuts
 *
 * Features:
 * - Categorized list of keyboard shortcuts
 * - Close on Escape key
 * - Close on backdrop click
 */
const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Group shortcuts by category
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <div className="shortcuts-modal-backdrop" onClick={handleBackdropClick}>
      <div className="shortcuts-modal" role="dialog" aria-labelledby="shortcuts-title" aria-modal="true">
        <div className="shortcuts-modal__header">
          <h2 id="shortcuts-title" className="shortcuts-modal__title">Keyboard Shortcuts</h2>
          <button
            className="shortcuts-modal__close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            &times;
          </button>
        </div>

        <div className="shortcuts-modal__content">
          {categories.map(category => (
            <div key={category} className="shortcuts-modal__category">
              <h3 className="shortcuts-modal__category-title">{category}</h3>
              <div className="shortcuts-modal__list">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="shortcuts-modal__item">
                      <kbd className="shortcuts-modal__keys">{shortcut.keys}</kbd>
                      <span className="shortcuts-modal__description">{shortcut.description}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="shortcuts-modal__note">
            <strong>Note:</strong> On macOS, use <kbd>Cmd</kbd> instead of <kbd>Ctrl</kbd>
          </div>
        </div>

        <div className="shortcuts-modal__footer">
          <button
            className="button button--primary"
            onClick={onClose}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
