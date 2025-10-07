import React, { useState, useEffect } from 'react';
import '../styles/SettingsModal.css';

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  theme: 'light' | 'dark';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: EditorSettings) => void;
  currentSettings: EditorSettings;
}

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 24;

/**
 * SettingsModal component - Configure editor preferences
 *
 * Features:
 * - Font size adjustment (10-24px)
 * - Tab size selection (2 or 4 spaces)
 * - Theme selection (light/dark)
 * - Settings persistence in localStorage
 */
const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings
}) => {
  const [settings, setSettings] = useState<EditorSettings>(currentSettings);

  // Update local state when currentSettings change
  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

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

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= FONT_SIZE_MIN && value <= FONT_SIZE_MAX) {
      setSettings(prev => ({ ...prev, fontSize: value }));
    }
  };

  const handleTabSizeChange = (tabSize: number) => {
    setSettings(prev => ({ ...prev, tabSize }));
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleCancel = () => {
    setSettings(currentSettings); // Reset to original settings
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div className="settings-modal-backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal" role="dialog" aria-labelledby="settings-title" aria-modal="true">
        <div className="settings-modal__header">
          <h2 id="settings-title" className="settings-modal__title">Editor Settings</h2>
          <button
            className="settings-modal__close"
            onClick={handleCancel}
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>

        <div className="settings-modal__content">
          {/* Font Size Setting */}
          <div className="settings-modal__section">
            <label htmlFor="font-size" className="settings-modal__label">
              Font Size: {settings.fontSize}px
            </label>
            <div className="settings-modal__control">
              <input
                id="font-size"
                type="range"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                value={settings.fontSize}
                onChange={handleFontSizeChange}
                className="settings-modal__slider"
                aria-label="Font size"
              />
              <div className="settings-modal__range-labels">
                <span>{FONT_SIZE_MIN}px</span>
                <span>{FONT_SIZE_MAX}px</span>
              </div>
            </div>
            <input
              type="number"
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              value={settings.fontSize}
              onChange={handleFontSizeChange}
              className="settings-modal__number-input"
              aria-label="Font size number input"
            />
          </div>

          {/* Tab Size Setting */}
          <div className="settings-modal__section">
            <label className="settings-modal__label">Tab Size</label>
            <div className="settings-modal__button-group">
              <button
                className={`settings-modal__button ${settings.tabSize === 2 ? 'settings-modal__button--active' : ''}`}
                onClick={() => handleTabSizeChange(2)}
                aria-pressed={settings.tabSize === 2}
              >
                2 spaces
              </button>
              <button
                className={`settings-modal__button ${settings.tabSize === 4 ? 'settings-modal__button--active' : ''}`}
                onClick={() => handleTabSizeChange(4)}
                aria-pressed={settings.tabSize === 4}
              >
                4 spaces
              </button>
            </div>
          </div>

          {/* Theme Setting */}
          <div className="settings-modal__section">
            <label className="settings-modal__label">Theme</label>
            <div className="settings-modal__button-group">
              <button
                className={`settings-modal__button ${settings.theme === 'light' ? 'settings-modal__button--active' : ''}`}
                onClick={() => handleThemeChange('light')}
                aria-pressed={settings.theme === 'light'}
              >
                Light
              </button>
              <button
                className={`settings-modal__button ${settings.theme === 'dark' ? 'settings-modal__button--active' : ''}`}
                onClick={() => handleThemeChange('dark')}
                aria-pressed={settings.theme === 'dark'}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="settings-modal__section">
            <label className="settings-modal__label">Preview</label>
            <div
              className={`settings-modal__preview code-editor code-editor--${settings.theme}`}
              style={{ fontSize: `${settings.fontSize}px` }}
            >
              <pre className="settings-modal__preview-code">
                {`function hello() {\n${' '.repeat(settings.tabSize)}console.log('Hello!');\n}`}
              </pre>
            </div>
          </div>
        </div>

        <div className="settings-modal__footer">
          <button
            className="button button--secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="button button--primary"
            onClick={handleSave}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
