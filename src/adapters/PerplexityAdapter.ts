import type { ChatAdapter, Message } from '../types';
import { elementToMarkdown, extractMedia } from './utils';

export class PerplexityAdapter implements ChatAdapter {
  detect(): boolean {
    return window.location.hostname.includes('perplexity.ai');
  }

  getMessages(): Message[] {
    const selector = [
      'div[class*="query"]',
      '[class*="user-prompt"]',
      'div[class*="answer"]',
      '[class*="assistant-message"]'
    ].join(', ');

    const elements = document.querySelectorAll(selector);
    const messages: Message[] = [];

    elements.forEach((el) => {
      const className = (typeof el.className === 'string' ? el.className : '').toLowerCase();
      
      const isUser = 
        className.includes('query') || 
        className.includes('user-prompt');
      
      const role = isUser ? 'user' : 'assistant';
      const content = elementToMarkdown(el);
      const media = extractMedia(el);

      if (content || media.length > 0) {
        messages.push({
          role,
          content,
          ...(media.length > 0 ? { media } : {}),
        });
      }
    });

    return messages;
  }
}
