import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';

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
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
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
    // Code block highlighting
    code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const isBlock = !!match;

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

  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
export default MarkdownRenderer;
