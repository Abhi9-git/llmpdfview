import type { ChatAdapter } from '../types';
import { ChatGPTAdapter } from './ChatGPTAdapter';
import { ClaudeAdapter } from './ClaudeAdapter';
import { GeminiAdapter } from './GeminiAdapter';
import { PerplexityAdapter } from './PerplexityAdapter';

const adapters: ChatAdapter[] = [
  new ChatGPTAdapter(),
  new ClaudeAdapter(),
  new GeminiAdapter(),
  new PerplexityAdapter(),
];

export function getCurrentAdapter(): ChatAdapter | null {
  for (const adapter of adapters) {
    if (adapter.detect()) {
      return adapter;
    }
  }
  return null;
}

export * from './ChatGPTAdapter';
export * from './ClaudeAdapter';
export * from './GeminiAdapter';
export * from './PerplexityAdapter';
export * from './utils';
