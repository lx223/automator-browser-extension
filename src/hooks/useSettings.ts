import { useState, useEffect } from 'react';
import { ExtensionSettings } from '../types/settings';
import { StorageService } from '../services/storageService';

export function useSettings() {
  const [settings, setSettings] = useState<ExtensionSettings>({
    extensionEnabled: true,
    theme: 'light',
    autoHighlight: false,
    highlightColor: '#ff6b6b'
  });
  const [isLoading, setIsLoading] = useState(true);

  const storageService = new StorageService();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await storageService.getSettings();
      setSettings(loadedSettings);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setIsLoading(false);
    }
  };

  const handleSettingChange = async <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await storageService.saveSetting(key, value);
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleResetSettings = async () => {
    const defaultSettings: ExtensionSettings = {
      extensionEnabled: true,
      theme: 'light',
      autoHighlight: false,
      highlightColor: '#ff6b6b'
    };
    
    try {
      setSettings(defaultSettings);
      await storageService.saveSettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  return {
    settings,
    isLoading,
    handleSettingChange,
    handleResetSettings
  };
}
