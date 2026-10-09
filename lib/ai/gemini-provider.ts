import { GoogleGenAI } from '@google/genai';
import type { AiProvider, GeneratePostInput, GeneratePostOutput, AiModelConfig } from './types';
import { GeneratedPostSchema } from './schemas';
import { MockAiProvider } from './mock-provider';

export class GeminiAiProvider implements AiProvider {
  readonly name = 'gemini';
  readonly isMock = false;
  private client: GoogleGenAI | null = null;
  private mockFallback = new MockAiProvider();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  async generateArticle(
    input: GeneratePostInput,
    config?: Partial<AiModelConfig>
  ): Promise<GeneratePostOutput> {
    // If no API key or dry-run requested, gracefully fall back to mock provider
    if (!this.client || process.env.AI_DRY_RUN === 'true') {
      return this.mockFallback.generateArticle(input, config);
    }

    const modelName = config?.model || 'gemini-3.8-flash';
    const prompt = `
      Actúa como un redactor profesional de guías de compra y regalos en español para un blog de comercio electrónico.
      Genera una guía de compra completa para el tema: "${input.topic}".
      Palabra clave objetivo: "${input.keyword || input.topic}".
      Cluster: "${input.cluster || 'General'}".
      Intención de búsqueda: "${input.intent || 'commercial investigation'}".

      Devuelve un JSON estrictamente estructurado según este esquema:
      - title: Título atractivo (máximo 70 caracteres)
      - slug: Slug limpio en minúsculas en español
      - excerpt: Resumen conciso (140-160 caracteres)
      - intro_html: Introducción de 2-3 párrafos
      - content_html: Sección de conclusión y consejos de compra
      - items: Lista de al menos 3 productos recomendados (heading, merchant, price en €, description_html, pros array, button_label)
      - faqs: Lista de 2 a 3 preguntas frecuentes con respuestas útiles
      - internal_links: 2 sugerencias de enlaces internos con anchor_text y target_url
      - seo_title: Título optimizado SEO
      - seo_description: Meta descripción optimizada
      - focus_keyword: Palabra clave principal
      - hero_image: URL de imagen de alta calidad
      - hero_alt: Texto alternativo
    `.trim();

    const response = await this.client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: config?.temperature ?? 0.7,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return GeneratedPostSchema.parse(parsed);
  }
}
