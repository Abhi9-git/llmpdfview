export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export type Theme = 'light' | 'dark' | 'sepia';

export interface ChatAdapter {
  getMessages(): Message[];
  detect(): boolean;
}
