import type { AiProvider } from './types';
import { MockAiProvider } from './mock-provider';
import { GeminiAiProvider } from './gemini-provider';

const mockProviderInstance = new MockAiProvider();
let geminiProviderInstance: GeminiAiProvider | null = null;

export function getAiProvider(preferredProvider?: string): AiProvider {
  const chosen = (preferredProvider || process.env.AI_PROVIDER || 'mock').toLowerCase();

  if (chosen === 'gemini') {
    if (!geminiProviderInstance) geminiProviderInstance = new GeminiAiProvider();
    return geminiProviderInstance;
  }

  // Default is always mock provider as requested
  return mockProviderInstance;
}
