import React, { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import type { MessageMedia } from '../types';

// Import Prism languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

interface MarkdownRendererProps {
  content: string;
  media?: MessageMedia[];
}

const allowedUrlProtocols = ['http:', 'https:', 'mailto:'];

function transformMarkdownUrl(url: string): string {
  if (url.startsWith('data:image/') || url.startsWith('blob:')) {
    return url;
  }

  try {
    const parsedUrl = new URL(url, window.location.href);
    return allowedUrlProtocols.includes(parsedUrl.protocol) ? url : '';
  } catch {
    return '';
  }
}

/**
 * A single image with error handling and click-to-zoom.
 */
const ChatImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className="image-error-fallback">
        <span className="image-error-icon">🖼️</span>
        <span className="image-error-text">Image unavailable</span>
        {alt && alt !== 'image' && <span className="image-error-alt">{alt}</span>}
      </div>
    );
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        className="chat-image"
        loading="eager"
        onClick={() => setZoomed(true)}
        onError={handleError}
      />
      {zoomed && (
        <div className="image-lightbox" onClick={() => setZoomed(false)}>
          <div className="image-lightbox-backdrop" />
          <img src={src} alt={alt} className="image-lightbox-img" />
          <button type="button" className="image-lightbox-close" onClick={() => setZoomed(false)}>
            ✕
          </button>
        </div>
      )}
    </>
  );
};

/**
 * Render an SVG inline in the DOM rather than as a sandboxed <img>.
 * This preserves all internal styles, gradients, fonts, and transforms
 * exactly as they appeared on the original LLM page.
 */
const InlineSvg: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const svgMarkup = React.useMemo(() => {
    try {
      if (src.startsWith('data:image/svg+xml;base64,')) {
        const base64 = src.slice('data:image/svg+xml;base64,'.length);
        return decodeURIComponent(escape(atob(base64)));
      }
      return null;
    } catch {
      return null;
    }
  }, [src]);

  if (!svgMarkup) {
    return <ChatImage src={src} alt={alt} />;
  }

  return (
    <div
      className="svg-diagram-inline"
      role="img"
      aria-label={alt}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, media }) => {
  useEffect(() => {
    // Fallback highlight call to ensure DOM is highlighted after initial render
    Prism.highlightAll();
  }, [content]);

  const components = {
    // Custom table component to ensure table has standard responsive wrappers
    table: ({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) => (
      <div className="table-container">
        <table {...props}>{children}</table>
      </div>
    ),
    // Image component with error handling and zoom
    img: ({ src, alt, ...props }: React.ComponentPropsWithoutRef<'img'>) => {
      if (!src) return null;
      // Render SVG data URIs inline for full visual fidelity
      if (src.startsWith('data:image/svg+xml;base64,')) {
        return <InlineSvg src={src} alt={alt || 'diagram'} />;
      }
      return <ChatImage src={src} alt={alt || 'image'} {...props} />;
    },
    // Code block highlighting + Mermaid styled code blocks
    code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const isBlock = !!match;

      // Mermaid code blocks — render as a styled diagram placeholder
      if (isBlock && language === 'mermaid') {
        const mermaidSource = String(children).replace(/\n$/, '');
        return (
          <div className="mermaid-diagram">
            <div className="mermaid-header">
              <span className="mermaid-icon">📊</span>
              <span>Mermaid Diagram</span>
            </div>
            <pre className="mermaid-source">
              <code>{mermaidSource}</code>
            </pre>
          </div>
        );
      }

      if (isBlock && language) {
        const codeString = String(children).replace(/\n$/, '');
        try {
          const grammar = Prism.languages[language] || Prism.languages.markup;
          const highlighted = Prism.highlight(codeString, grammar, language);
          return (
            <pre className={`language-${language}`}>
              <code
                className={`language-${language}`}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          );
        } catch (e) {
          console.warn(`Prism failed to highlight language: ${language}`, e);
          return (
            <pre className={className}>
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          );
        }
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  // Filter out media items whose src is already embedded in the markdown content
  // to avoid showing duplicates
  const standaloneMedia = media?.filter((m) => !content.includes(m.src)) || [];

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={transformMarkdownUrl}
      >
        {content}
      </ReactMarkdown>

      {/* Render standalone media that wasn't embedded in the markdown text */}
      {standaloneMedia.length > 0 && (
        <div className={`media-gallery ${standaloneMedia.length === 1 ? 'media-gallery-single' : ''}`}>
          {standaloneMedia.map((item, idx) => (
            item.type === 'svg' && item.src.startsWith('data:image/svg+xml;base64,')
              ? <InlineSvg key={idx} src={item.src} alt={item.alt} />
              : <ChatImage key={idx} src={item.src} alt={item.alt} />
          ))}
        </div>
      )}
    </div>
  );
};
export default MarkdownRenderer;
