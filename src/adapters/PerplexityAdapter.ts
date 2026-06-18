import type { ChatAdapter, Message } from '../types';
import { elementToMarkdown } from './utils';

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
      const className = el.className.toLowerCase();
      
      const isUser = 
        className.includes('query') || 
        className.includes('user-prompt');
      
      const role = isUser ? 'user' : 'assistant';
      const content = elementToMarkdown(el);

      if (content) {
        messages.push({
          role,
          content,
        });
      }
    });

    return messages;
  }
}
