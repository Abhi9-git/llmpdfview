import React, { useState, useEffect } from 'react';
import './popup.css';

export const Popup: React.FC = () => {
  const [supportedSite, setSupportedSite] = useState<string | null>(null);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        const url = tabs[0]?.url || '';

        if (url.includes('chatgpt.com')) {
          setSupportedSite('ChatGPT');
        } else if (url.includes('claude.ai')) {
          setSupportedSite('Claude');
        } else if (url.includes('gemini.google.com')) {
          setSupportedSite('Gemini');
        } else if (url.includes('perplexity.ai')) {
          setSupportedSite('Perplexity');
        }
      });
    }
  }, []);

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo-area">
          <span className="logo-icon">📄</span>
          <h1>LLM PDF View</h1>
        </div>
        <span className="version">v1.0.0</span>
      </header>

      <main className="popup-body">
        {supportedSite ? (
          <div className="status-card active">
            <span className="status-dot green"></span>
            <span className="status-text">
              Active on <strong>{supportedSite}</strong>
            </span>
          </div>
        ) : (
          <div className="status-card inactive">
            <span className="status-dot gray"></span>
            <span className="status-text">Navigate to a supported chat to use</span>
          </div>
        )}

        <section className="info-section">
          <h3>How to Use</h3>
          <ol className="step-list">
            <li>
              Open a conversation on <strong>ChatGPT</strong>, <strong>Claude</strong>, <strong>Gemini</strong>, or <strong>Perplexity</strong>.
            </li>
            <li>
              Click the floating <span className="highlight-pill">PDF View</span> button in the bottom-right corner of the page.
            </li>
            <li>
              Read in a clean, distraction-free environment, swap themes, and hit <span className="highlight-pill">Export PDF</span>.
            </li>
          </ol>
        </section>

        <section className="features-section">
          <h3>Supported Platforms</h3>
          <div className="platforms-grid">
            <div className={`platform-badge ${supportedSite === 'ChatGPT' ? 'active' : ''}`}>
              ChatGPT
            </div>
            <div className={`platform-badge ${supportedSite === 'Claude' ? 'active' : ''}`}>
              Claude
            </div>
            <div className={`platform-badge ${supportedSite === 'Gemini' ? 'active' : ''}`}>
              Gemini
            </div>
            <div className={`platform-badge ${supportedSite === 'Perplexity' ? 'active' : ''}`}>
              Perplexity
            </div>
          </div>
        </section>
      </main>

      <footer className="popup-footer">
        <p>Press <kbd>Esc</kbd> anytime to exit Reader Mode</p>
      </footer>
    </div>
  );
};

export default Popup;
