// Content script that runs in the context of web pages
// This script has access to the DOM and can interact with the page

console.log('Content script loaded');

// Function to inject styles into the page
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .overtabbed-extension-highlight {
      background-color: rgba(255, 255, 0, 0.3) !important;
      border: 2px solid #ff6b6b !important;
      border-radius: 4px !important;
    }
  `;
  document.head.appendChild(style);
}

// Function to highlight elements on the page
function highlightElements() {
  const elements = document.querySelectorAll('h1, h2, h3, p');
  elements.forEach((element, index) => {
    if (index < 5) { // Only highlight first 5 elements
      element.classList.add('overtabbed-extension-highlight');
    }
  });
}

// Initialize content script
function init() {
  console.log('Initializing content script');
  injectStyles();
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightElements);
  } else {
    highlightElements();
  }
}

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'HIGHLIGHT_ELEMENTS':
      highlightElements();
      sendResponse({ success: true });
      break;
      
    case 'GET_PAGE_INFO':
      sendResponse({
        title: document.title,
        url: window.location.href,
        elementCount: document.querySelectorAll('*').length
      });
      break;
      
    default:
      console.log('Unknown message type:', message.type);
      sendResponse({ success: false });
  }
  
  return true; // Indicate we will send a response
});

// Initialize when script loads
init();
