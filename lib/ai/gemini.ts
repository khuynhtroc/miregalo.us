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

  const modelsToTry = [
    options.model || 'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
  ];

  for (const model of modelsToTry) {
    try {
      const config: Record<string, unknown> = {};
      if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
      if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
      if (options.responseSchema) config.responseSchema = options.responseSchema;

      const response = await ai.models.generateContent({
        model,
        contents: options.prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[Gemini] Model ${model} call error:`, err?.message || err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return null;
}

/**
 * Generates an image using Imagen 3 via Google GenAI SDK.
 * Returns Buffer of image if successful, or null on failure.
 */
export async function generateAiImage(prompt: string): Promise<Buffer | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  try {
    const res = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    const image = res.generatedImages?.[0]?.image;
    if (image?.imageBytes) {
      return Buffer.from(image.imageBytes, 'base64');
    }
    return null;
  } catch (err) {
    console.error('Gemini image generation error:', err);
    return null;
  }
}

