import { useState, useEffect } from 'react';
import { EditorSettings } from '../components/SettingsModal';

const SETTINGS_KEY = 'editorSettings';

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  theme: 'light'
};

/**
 * Custom hook to manage editor settings with localStorage persistence
 *
 * Features:
 * - Load settings from localStorage on mount
 * - Save settings to localStorage when changed
 * - Provide default settings if none exist
 */
export const useEditorSettings = () => {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as EditorSettings;
        // Validate settings
        const validSettings: EditorSettings = {
          fontSize: typeof parsed.fontSize === 'number' && parsed.fontSize >= 10 && parsed.fontSize <= 24
            ? parsed.fontSize
            : DEFAULT_SETTINGS.fontSize,
          tabSize: parsed.tabSize === 2 || parsed.tabSize === 4
            ? parsed.tabSize
            : DEFAULT_SETTINGS.tabSize,
          theme: parsed.theme === 'light' || parsed.theme === 'dark'
            ? parsed.theme
            : DEFAULT_SETTINGS.theme
        };
        setSettings(validSettings);
      }
    } catch (error) {
      console.error('Failed to load editor settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateSettings = (newSettings: EditorSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save editor settings:', error);
    }
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
      console.error('Failed to reset editor settings:', error);
    }
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoaded
  };
};
