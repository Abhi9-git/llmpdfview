import React, { useState, useEffect, useRef } from 'react';
import type { Message, Theme } from '../types';
import { getCurrentAdapter } from '../adapters';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Toolbar } from './Toolbar';
import { exportToPDF } from '../services/pdfExport';

interface ReaderOverlayProps {
  onClose: () => void;
}

export const ReaderOverlay: React.FC<ReaderOverlayProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [theme, setTheme] = useState<Theme>('light');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Initialize theme from storage (fallback to localStorage if chrome.storage is not available)
  useEffect(() => {
    const handleThemeLoad = (savedTheme: string | null) => {
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'sepia') {
        setTheme(savedTheme as Theme);
      } else {
        // System preference default
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['readerTheme'], (result: { readerTheme?: string }) => {
        handleThemeLoad(result.readerTheme || null);
      });
    } else {
      handleThemeLoad(localStorage.getItem('readerTheme'));
    }
  }, []);

  // Update theme and persist it
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ readerTheme: newTheme });
    } else {
      localStorage.setItem('readerTheme', newTheme);
    }
  };

  // Fetch messages on mount
  useEffect(() => {
    // Disable body scrolling while overlay is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      try {
        const adapter = getCurrentAdapter();
        if (!adapter) {
          setErrorMsg('Unsupported website or chat interface not recognized.');
          return;
        }

        const extractedMessages = adapter.getMessages();
        if (extractedMessages.length === 0) {
          setErrorMsg(
            'No messages detected. Make sure you are in a chat thread and the page is fully loaded.'
          );
        } else {
          setMessages(extractedMessages);
        }
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        setErrorMsg(`Failed to extract messages: ${errMsg}`);
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      // Re-enable body scrolling on cleanup
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close overlay on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // PDF Generation Trigger
  const handleExportPDF = async () => {
    if (!sheetRef.current || messages.length === 0) return;
    setIsExporting(true);
    try {
      const siteName = window.location.hostname.replace('www.', '').split('.')[0];
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `llmpdfview_${siteName}_${dateStr}.pdf`;
      await exportToPDF(sheetRef.current, filename);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to generate PDF. Check console logs.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`llm-pdf-overlay theme-${theme}`}>
      <Toolbar
        activeTheme={theme}
        onChangeTheme={handleThemeChange}
        onExportPDF={handleExportPDF}
        onClose={onClose}
        isExporting={isExporting}
        messageCount={messages.length}
      />

      <div className="llm-pdf-reader-container">
        {errorMsg ? (
          <div className="llm-pdf-document-sheet">
            <div className="empty-state">
              <h3>Oops! Connection Issue</h3>
              <p>{errorMsg}</p>
              <button
                type="button"
                className="action-btn"
                onClick={onClose}
                style={{ marginTop: '20px', display: 'inline-block' }}
              >
                Go Back to Chat
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={sheetRef}
            id="llm-pdf-sheet-export-target"
            className="llm-pdf-document-sheet"
          >
            {messages.map((msg, index) => (
              <div key={index} className="message-turn">
                <div
                  className={`message-header ${
                    msg.role === 'user' ? 'message-header-user' : ''
                  }`}
                >
                  <span className="message-header-icon"></span>
                  {msg.role === 'user' ? 'User' : 'Assistant'}
                </div>
                <MarkdownRenderer content={msg.content} media={msg.media} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ReaderOverlay;
