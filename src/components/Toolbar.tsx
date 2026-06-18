import React from 'react';
import type { Theme } from '../types';

interface ToolbarProps {
  activeTheme: Theme;
  onChangeTheme: (theme: Theme) => void;
  onExportPDF: () => void;
  onClose: () => void;
  isExporting: boolean;
  messageCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTheme,
  onChangeTheme,
  onExportPDF,
  onClose,
  isExporting,
  messageCount,
}) => {
  return (
    <div className="llm-pdf-toolbar">
      <div className="llm-pdf-toolbar-title">
        LLM PDF View — Reader Mode ({messageCount} {messageCount === 1 ? 'message' : 'messages'})
      </div>
      <div className="llm-pdf-toolbar-actions">
        {/* Theme Switcher Group */}
        <div className="theme-button-group">
          {(['light', 'dark', 'sepia'] as Theme[]).map((theme) => (
            <button
              key={theme}
              type="button"
              className={`theme-btn ${activeTheme === theme ? 'active' : ''}`}
              onClick={() => onChangeTheme(theme)}
              title={`Switch to ${theme} theme`}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </div>

        {/* PDF Export Button */}
        <button
          type="button"
          className="action-btn action-btn-primary"
          onClick={onExportPDF}
          disabled={isExporting || messageCount === 0}
        >
          {isExporting ? (
            <>
              <span className="spinner"></span>
              Exporting...
            </>
          ) : (
            'Export PDF'
          )}
        </button>

        {/* Close Button */}
        <button
          type="button"
          className="action-btn"
          onClick={onClose}
          title="Exit Reader Mode"
        >
          Close
        </button>
      </div>
    </div>
  );
};
export default Toolbar;
