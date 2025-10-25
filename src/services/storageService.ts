import { ExtensionSettings } from '../types/settings';

export class StorageService {
  async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get([
        'extensionEnabled',
        'theme',
        'autoHighlight',
        'highlightColor'
      ]);
      
      return {
        extensionEnabled: result.extensionEnabled ?? true,
        theme: result.theme ?? 'light',
        autoHighlight: result.autoHighlight ?? false,
        highlightColor: result.highlightColor ?? '#ff6b6b'
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        extensionEnabled: true,
        theme: 'light',
        autoHighlight: false,
        highlightColor: '#ff6b6b'
      };
    }
  }

  async saveSetting<K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    }
  }

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    try {
      await chrome.storage.sync.set(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async getLocalData(key: string): Promise<any> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key];
    } catch (error) {
      console.error('Error getting local data:', error);
      return null;
    }
  }

  async setLocalData(key: string, value: any): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error('Error setting local data:', error);
      throw error;
    }
  }

  async removeLocalData(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error('Error removing local data:', error);
      throw error;
    }
  }
}
