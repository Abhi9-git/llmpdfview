import type { ChatAdapter, Message } from '../types';
import { elementToMarkdown, extractMedia } from './utils';

export class ChatGPTAdapter implements ChatAdapter {
  detect(): boolean {
    return window.location.hostname.includes('chatgpt.com');
  }

  getMessages(): Message[] {
    const messageElements = document.querySelectorAll('[data-message-author-role]');
    const messages: Message[] = [];

    messageElements.forEach((el) => {
      const roleAttr = el.getAttribute('data-message-author-role');
      if (roleAttr === 'user' || roleAttr === 'assistant') {
        // Find inside container or markdown content inside ChatGPT turns if applicable
        const contentContainer = el.querySelector('.markdown, .prose') || el;
        const content = elementToMarkdown(contentContainer);
        const media = extractMedia(el);

        if (content || media.length > 0) {
          messages.push({
            role: roleAttr,
            content,
            ...(media.length > 0 ? { media } : {}),
          });
        }
      }
    });

    return messages;
  }
}
