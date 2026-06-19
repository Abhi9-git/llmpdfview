export interface MessageMedia {
  type: 'image' | 'svg';
  /** Image source — data URI, blob URL, or https URL */
  src: string;
  /** Alt text / caption */
  alt: string;
  /** Raw SVG markup (only when type === 'svg') */
  svgMarkup?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  /** Extracted images, SVGs, and diagrams from the message */
  media?: MessageMedia[];
}

export type Theme = 'light' | 'dark' | 'sepia';

export interface ChatAdapter {
  getMessages(): Message[];
  detect(): boolean;
}
