import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReaderOverlay } from '../components/ReaderOverlay';
import './styles.css';

console.log('LLM PDF View Loaded');

// Keep track of the active reader root and container
let reactRoot: ReactDOM.Root | null = null;
let overlayContainer: HTMLDivElement | null = null;

function showReaderMode() {
  if (overlayContainer) return; // Already open

  // 1. Create a top-level wrapper element
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'llm-pdf-view-container';
  
  // Isolate styles using Shadow DOM
  const shadowRoot = overlayContainer.attachShadow({ mode: 'open' });

  // 2. Inject the compiled extension stylesheet into the Shadow DOM
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('content.css');
  shadowRoot.appendChild(styleLink);

  // 3. Create the mounting node for React inside the Shadow DOM
  const appRoot = document.createElement('div');
  appRoot.id = 'llm-pdf-view-root';
  shadowRoot.appendChild(appRoot);

  // Append container to page body
  document.body.appendChild(overlayContainer);

  // 4. Mount React application
  reactRoot = ReactDOM.createRoot(appRoot);
  reactRoot.render(
    <React.StrictMode>
      <ReaderOverlay onClose={hideReaderMode} />
    </React.StrictMode>
  );
}

function hideReaderMode() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
}

function injectFloatingButton() {
  // Check if button is already injected
  if (document.getElementById('llm-pdf-floating-trigger')) return;

  const btn = document.createElement('button');
  btn.id = 'llm-pdf-floating-trigger';
  btn.className = 'llm-pdf-floating-btn';
  btn.type = 'button';
  btn.innerText = 'PDF View';

  // Add click event listener to toggle Reader Mode overlay
  btn.addEventListener('click', showReaderMode);

  // Since we want the button to use our extension styling, we can wrap it or style it directly.
  // We'll style it using inline rules or load it into a shadow root.
  // Actually, let's style it directly using inline styles to guarantee it looks beautiful on the page,
  // preventing host page styles from altering it.
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '2147483640',
    padding: '12px 20px',
    backgroundColor: '#0071e3',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  });

  // Hover effects (via JS event listeners to bypass stylesheet limitations on main DOM)
  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = '#0077ed';
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 16px rgba(0, 113, 227, 0.45)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = '#0071e3';
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 4px 12px rgba(0, 113, 227, 0.3)';
  });

  btn.addEventListener('mousedown', () => {
    btn.style.transform = 'translateY(0)';
  });

  document.body.appendChild(btn);
}

// Inject button once page load is complete or dynamically watch
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  injectFloatingButton();
} else {
  window.addEventListener('DOMContentLoaded', injectFloatingButton);
}

// Fallback observer in case body elements get re-rendered (e.g. page navigation in Claude/ChatGPT)
const observer = new MutationObserver(() => {
  if (!document.getElementById('llm-pdf-floating-trigger') && document.body) {
    injectFloatingButton();
  }
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: false });
} else {
  window.addEventListener('load', () => {
    observer.observe(document.body, { childList: true, subtree: false });
  });
}
