import 'server-only';
import { GoogleGenAI } from '@google/genai';

/**
 * Returns a configured GoogleGenAI instance if GEMINI_API_KEY is available.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  responseMimeType?: string;
  responseSchema?: unknown;
}

/**
 * Calls Google Gemini API if key is present.
 * Returns null if no API key is configured.
 */
export async function callGemini(options: GenerateTextOptions): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const model = options.model || 'gemini-2.5-flash';

  try {
    const config: Record<string, unknown> = {};
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.responseMimeType) {
      config.responseMimeType = options.responseMimeType;
    }
    if (options.responseSchema) {
      config.responseSchema = options.responseSchema;
    }

    const response = await ai.models.generateContent({
      model,
      contents: options.prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    return response.text || null;
  } catch (err) {
    console.error('Gemini API call error:', err);
    return null;
  }
}
