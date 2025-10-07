import React, { useState, useEffect, useRef } from 'react';
import '../styles/SaveAsModal.css';

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
  isLoading?: boolean;
}

/**
 * SaveAsModal component
 *
 * Modal for entering a project name when saving a new project
 * or using "Save As" functionality
 *
 * Features:
 * - Input field for project name
 * - Validation (1-255 chars, required)
 * - Loading state during save operation
 * - Error display
 * - Auto-focus on input when opened
 * - Close on Escape key
 * - Close on backdrop click
 */
const SaveAsModal: React.FC<SaveAsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
  isLoading = false,
}) => {
  const [projectName, setProjectName] = useState(defaultName);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setProjectName(defaultName);
      setError('');
      // Auto-focus the input field
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultName]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  /**
   * Validate project name
   */
  const validateName = (name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Project name is required';
    }
    if (name.trim().length > 255) {
      return 'Project name must be 255 characters or less';
    }
    return null;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateName(projectName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    onSave(projectName.trim());
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal save-as-modal">
        <div className="modal__header">
          <h2 className="modal__title">Save Project</h2>
          <button
            className="modal__close-button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-group">
              <label htmlFor="project-name" className="form-label">
                Project Name
              </label>
              <input
                ref={inputRef}
                id="project-name"
                type="text"
                className={`form-input ${error ? 'form-input--error' : ''}`}
                value={projectName}
                onChange={handleInputChange}
                placeholder="Enter project name"
                disabled={isLoading}
                maxLength={255}
                autoComplete="off"
              />
              {error && <p className="form-error">{error}</p>}
            </div>
          </div>

          <div className="modal__footer">
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button--primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveAsModal;
