export interface ExtensionSettings {
  extensionEnabled: boolean;
  theme: string;
  autoHighlight: boolean;
  highlightColor: string;
}

export interface ScreenshotCache {
  dataUrl: string;
  timestamp: number;
}

export interface ScreenshotResponse {
  success: boolean;
  dataUrl?: string;
  error?: string;
}
