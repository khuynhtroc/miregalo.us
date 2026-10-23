import 'server-only';
import { randomUUID } from 'crypto';
import { callGemini } from '@/lib/ai/gemini';
import { db } from '@/lib/db';
import { submitUrlToGoogle } from '@/lib/indexing/google';
import { sharePostToAllChannels } from '@/lib/social';
import { SITE_URL } from '@/lib/urls';
import type { TrendingItem } from './social-listener';

export interface TrendingNewsPostResult {
  id: string;
  slug: string;
  title: string;
  url: string;
  wordCount: number;
  publishedAt: string;
  indexingStatus: string;
}

const DEFAULT_AUTHOR_ID = 'a91e5d32-949f-43e6-95b2-3e28406f0e4b';
const DEFAULT_CAT_ID = 'acbaa7d4-a347-4e39-948d-8670c2d3daf9'; // Halloween / Pop Occasions

/**
 * Generates and publishes an emergency trending news article to /blog/
 */
export async function generateTrendingNewsArticle(trend: TrendingItem): Promise<TrendingNewsPostResult> {
  console.log(`[News Generator] Starting AI generation for trend: "${trend.topic}" (${trend.source})`);

  const prompt = `
Actúa como un periodista digital de élite y experto en tendencias de consumo, cultura pop y regalos virales para la comunidad hispanohablante de Estados Unidos (español ES-US neutro, ágil y atractivo).

INFORMACIÓN DE LA TENDENCIA DETECTADA EN TIEMPO REAL (Últimas 4 a 24 horas):
- Tema / Palabra clave trending: "${trend.topic}"
- Titular de la noticia original: "${trend.newsHeadline}"
- Tráfico / Velocidad: "${trend.traffic}"
- Fuente: "${trend.source}"
- Ángulo de consumo / regalo sugerido: "${trend.giftAngle}"
- Imagen destacada: "${trend.picture}"

TU OBJETIVO:
Escribe un artículo periodístico de actualidad en formato NOTICIA VIRAL / TENDENCIA DE ESTILO DE VIDA (longitud: entre 1.200 y 1.800 palabras) para publicar en la sección /blog/ de Miregalo.us.
El artículo debe tener gancho para Google Discover y Google News, explicando qué acaba de ocurrir hoy, por qué se ha vuelto viral en TikTok y redes sociales, y cómo conseguir los productos, merchandising, ropa o regalos relacionados con entrega rápida en Estados Unidos (Amazon US en dólares $).

ESTRUCTURA OBLIGATORIA DEL ARTÍCULO:
1. Titular llamativo y periodístico (ej: "El fenómeno viral de [Tema]: Por qué todo el mundo está hablando de esto y cómo conseguirlo hoy en EE.UU.").
2. Introducción periodística ("Qué acaba de pasar en las últimas horas").
3. Sección H2: "El origen del furor: Por qué se ha vuelto viral en redes sociales".
4. Sección H2: "El impacto en las compras: Las mejores opciones y alternativas para conseguirlo hoy" (Incluye 3 o 4 productos concretos que un comprador en EE.UU. puede adquirir en Amazon, con precio realista en dólares USD $, pros y contras).
5. Sección H2: "Reacciones de la comunidad y lo que dicen los fanáticos".
6. Sección H2: "Preguntas Frecuentes sobre [Tema] (FAQ)" con 3 o 4 preguntas y respuestas útiles.
7. Aviso de transparencia editorial al final.

FORMATO DE SALIDA (DEBES RESPONDER EXCLUSIVAMENTE EN JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA, SIN TEXTO ANTES NI DESPUÉS):
{
  "title": "Titular de la noticia en español ES-US",
  "slug": "slug-limpio-sin-diacriticos-con-guiones",
  "excerpt": "Resumen periodístico en 150 caracteres para Google Discover y meta description.",
  "intro_html": "<p>Primeros 2 párrafos introductorios con la noticia de última hora...</p>",
  "content_html": "<div class='article-content'>...Todo el cuerpo del artículo con encabezados H2, H3, párrafos informativos, comparativa de productos y FAQs...</div>",
  "focus_keyword": "${trend.topic}",
  "seo_title": "Titular | Miregalo News",
  "seo_description": "Resumen SEO de 150 caracteres",
  "items": [
    {
      "heading": "Nombre específico del producto 1",
      "price": "$24.99",
      "image": "${trend.picture || 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&auto=format&fit=crop&q=80'}",
      "merchant": "Amazon Estados Unidos",
      "button_label": "Ver oferta en Amazon",
      "pros": ["Ventaja destacada 1", "Envío rápido con Prime"],
      "cons": ["Alta demanda en los últimos días"],
      "description_html": "<p>Descripción del producto y por qué es la mejor opción para esta tendencia...</p>"
    }
  ]
}
`.trim();

  const rawAiResponse = await callGemini({
    prompt,
    systemInstruction: 'Eres un editor jefe de un medio digital en Estados Unidos especializado en tendencias virales, compras inteligentes y cultura pop en español.',
    responseMimeType: 'application/json',
  });

  if (!rawAiResponse) {
    throw new Error('Gemini API did not return a response for trending topic.');
  }

  let parsed: any;
  try {
    const cleanJson = rawAiResponse.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(cleanJson);
  } catch (err: any) {
    console.error('[News Generator] JSON parse error:', err.message, rawAiResponse.slice(0, 300));
    throw new Error(`Failed to parse AI output: ${err.message}`);
  }

  // Ensure clean slug
  const cleanSlug = (parsed.slug || trend.topic)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);

  // Map product items to internal /go/ affiliate redirects
  const formattedItems = (parsed.items || []).map((item: any, idx: number) => ({
    ...item,
    url: `/go/${cleanSlug}-item-${idx + 1}/`,
    merchant: 'Amazon',
    button_label: item.button_label || 'Ver oferta en Amazon',
    image: item.image || trend.picture,
  }));

  const fullContentHtml = `
${parsed.intro_html || ''}

${parsed.content_html || ''}

<div class="my-8 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
  <p><strong>Nota editorial:</strong> Miregalo es una publicación independiente. Enlaces en esta noticia pueden generar una comisión de afiliación en compras cualificadas en Amazon Estados Unidos sin costo adicional para el lector.</p>
</div>
`.trim();

  const wordCount = fullContentHtml.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const nowIso = new Date().toISOString();
  const postId = randomUUID();

  // Create post record in DB
  const postRecord = {
    id: postId,
    slug: cleanSlug,
    title: parsed.title || trend.newsHeadline,
    excerpt: parsed.excerpt || trend.giftAngle,
    content_html: fullContentHtml,
    intro_html: parsed.intro_html || `<p>${trend.giftAngle}</p>`,
    items: formattedItems,
    primary_category_id: DEFAULT_CAT_ID,
    category_ids: [DEFAULT_CAT_ID],
    author_id: DEFAULT_AUTHOR_ID,
    type: 'blog' as const,
    status: 'published' as const,
    featured: true,
    editor_pick: true,
    published_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
    hero_image: trend.picture || 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&auto=format&fit=crop&q=80',
    hero_alt: parsed.title,
    og_image: trend.picture,
    focus_keyword: parsed.focus_keyword || trend.topic,
    seo_title: parsed.seo_title || `${parsed.title} | Miregalo`,
    seo_description: parsed.seo_description || parsed.excerpt,
  };

  // 1. Save into Supabase
  try {
    const existing = await db.findOne('posts', { slug: cleanSlug });
    if (existing) {
      await db.update('posts', existing.id, postRecord);
    } else {
      await db.insert('posts', postRecord);
    }
    console.log(`[News Generator] Saved trending post /blog/${cleanSlug}/ to database.`);
  } catch (err: any) {
    console.warn('[News Generator] DB insert warning, continuing:', err.message);
  }

  // 2. Fast-Indexing Submission to Google
  const fullPostUrl = `${SITE_URL}/blog/${cleanSlug}/`;
  let indexingStatus = 'submitted';

  try {
    await submitUrlToGoogle(fullPostUrl, 'URL_UPDATED');
    console.log(`[News Generator] Pushed URL to Google Indexing API: ${fullPostUrl}`);
  } catch (err: any) {
    indexingStatus = `failed (${err.message})`;
    console.warn('[News Generator] Google Indexing push failed:', err.message);
  }

  // 3. Automated Social Auto-Sharing (Pinterest, Facebook, Twitter, Medium)
  try {
    sharePostToAllChannels(postRecord as any).catch((socialErr) => {
      console.warn('[News Generator] Social auto-share error:', socialErr?.message || socialErr);
    });
  } catch (socialErr: any) {
    console.warn('[News Generator] Social auto-share error:', socialErr?.message || socialErr);
  }

  return {
    id: postId,
    slug: cleanSlug,
    title: postRecord.title,
    url: fullPostUrl,
    wordCount,
    publishedAt: nowIso,
    indexingStatus,
  };
}
