import { BRAND_COLORS, DEFAULT_COLORS } from '../constants/brandColors';
import { getDomainFromUrl } from './urlUtils';

export function getColorsForDomain(domain: string): {primary: string, secondary: string} {
  return BRAND_COLORS[domain] || DEFAULT_COLORS;
}

export function createEnhancedPlaceholderScreenshot(tab: chrome.tabs.Tab): {success: boolean, dataUrl: string} {
  const domain = getDomainFromUrl(tab.url || '');
  const title = (tab.title || 'Untitled').substring(0, 25);
  const colors = getColorsForDomain(domain);
  
  const svg = `
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <rect width="200" height="150" fill="url(#grad)" rx="8"/>
      <circle cx="100" cy="50" r="20" fill="white" opacity="0.9" filter="url(#shadow)"/>
      <text x="100" cy="55" text-anchor="middle" fill="${colors.primary}" font-family="Arial" font-size="16" font-weight="bold">${domain.charAt(0).toUpperCase()}</text>
      <text x="100" y="85" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="600">${title}</text>
      <text x="100" y="105" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial" font-size="10">${domain}</text>
    </svg>
  `;
  
  return { success: true, dataUrl: 'data:image/svg+xml;base64,' + btoa(svg) };
}
