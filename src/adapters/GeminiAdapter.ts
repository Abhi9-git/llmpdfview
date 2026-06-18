import type { ChatAdapter, Message } from '../types';
import { elementToMarkdown } from './utils';

export class GeminiAdapter implements ChatAdapter {
  detect(): boolean {
    return window.location.hostname.includes('gemini.google.com');
  }

  getMessages(): Message[] {
    const selector = [
      'user-query-content',
      '[class*="user-query"]',
      'div[class*="query-content"]',
      'message-content',
      '[class*="message-content"]',
      'div.message-inner-container'
    ].join(', ');

    const elements = document.querySelectorAll(selector);
    const messages: Message[] = [];

    elements.forEach((el) => {
      const tagName = el.tagName.toUpperCase();
      const className = el.className.toLowerCase();
      
      const isUser = 
        tagName === 'USER-QUERY-CONTENT' || 
        className.includes('user-query') || 
        className.includes('query-content');
      
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
