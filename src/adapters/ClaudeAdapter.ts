import type { ChatAdapter, Message } from '../types';
import { elementToMarkdown } from './utils';

export class ClaudeAdapter implements ChatAdapter {
  detect(): boolean {
    return window.location.hostname.includes('claude.ai');
  }

  getMessages(): Message[] {
    // Select elements that correspond to either user messages or Claude assistant responses in chronological order
    const selector = [
      'div[data-testid="user-message"]',
      'div[class*="user-message"]',
      'div.font-claude-response',
      'div[class*="claude-message"]',
      '[data-testid="claude-message"]'
    ].join(', ');

    const elements = document.querySelectorAll(selector);
    const messages: Message[] = [];

    elements.forEach((el) => {
      // Determine if it is a user message based on testid or class names
      const isUser = 
        el.getAttribute('data-testid') === 'user-message' || 
        el.className.includes('user-message');
      
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
