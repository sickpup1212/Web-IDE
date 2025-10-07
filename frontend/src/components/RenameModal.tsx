import React, { useState, useEffect, useRef } from 'react';
import '../styles/RenameModal.css';

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  onRename: (newName: string) => void;
  onCancel: () => void;
}

/**
 * RenameModal component displays a modal for renaming a project
 * with validation for name length (1-255 chars)
 */
const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  currentName,
  onRename,
  onCancel,
}) => {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset name when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError('');
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentName]);

  // Close dialog on Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  // Validate name
  const validateName = (value: string): boolean => {
    if (value.trim().length === 0) {
      setError('Project name is required');
      return false;
    }
    if (value.length > 255) {
      setError('Project name must be 255 characters or less');
      return false;
    }
    setError('');
    return true;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    // Clear error when user starts typing
    if (error) {
      validateName(value);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateName(name)) {
      const trimmedName = name.trim();
      if (trimmedName !== currentName) {
        onRename(trimmedName);
      } else {
        // Name hasn't changed, just close
        onCancel();
      }
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="rename-modal-backdrop" onClick={handleBackdropClick}>
      <div className="rename-modal">
        <div className="rename-modal-header">
          <h3 className="rename-modal-title">Rename Project</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rename-modal-body">
            <label htmlFor="project-name" className="rename-modal-label">
              Project Name
            </label>
            <input
              ref={inputRef}
              id="project-name"
              type="text"
              className={`rename-modal-input ${error ? 'rename-modal-input-error' : ''}`}
              value={name}
              onChange={handleChange}
              placeholder="Enter project name"
              maxLength={255}
            />
            {error && <p className="rename-modal-error">{error}</p>}
          </div>

          <div className="rename-modal-footer">
            <button
              type="button"
              className="rename-modal-btn rename-modal-btn-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rename-modal-btn rename-modal-btn-save"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
