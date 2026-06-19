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
    const processed: Element[] = [];
    const messages: Message[] = [];

    elements.forEach((el) => {
      // Skip elements that are ancestors or descendants of already-processed elements.
      // This prevents the overlapping selectors from extracting the same message content
      // multiple times (e.g. a <user-query-content> tag that also matches [class*="user-query"]).
      const isDuplicate = processed.some(
        (prev) => prev.contains(el) || el.contains(prev)
      );
      if (isDuplicate) return;

      processed.push(el);

      const tagName = el.tagName.toUpperCase();
      const className = (typeof el.className === 'string' ? el.className : '').toLowerCase();

      const isUser =
        tagName === 'USER-QUERY-CONTENT' ||
        className.includes('user-query') ||
        className.includes('query-content');

      const role = isUser ? 'user' : 'assistant';
      const content = elementToMarkdown(el);

      if (content) {
        // Skip if this is a consecutive message with the same role and identical content
        const last = messages[messages.length - 1];
        if (last && last.role === role && last.content === content) return;

        messages.push({
          role,
          content,
        });
      }
    });

    return messages;
  }
}
