import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

function getFreshClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: {
      fetch: (url, opts) => fetch(url, { ...opts, keepalive: false }),
    },
  });
}

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const affiliateHtml = `
<div class="affiliate-disclosure-box" style="margin-top: 48px; padding: 20px 24px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; font-size: 0.9rem; color: #666; line-height: 1.6;">
  <p style="margin: 0;"><strong>Aviso de afiliación:</strong> En Miregalo participamos en el Programa de Afiliados de Amazon EU y otras plataformas. Esto significa que si realizas una compra a través de nuestros enlaces, podemos recibir una pequeña comisión sin ningún coste adicional para ti. Todos los productos son seleccionados de forma independiente por nuestro equipo editorial.</p>
</div>`;

async function processOnePost(post, index, total) {
  console.log(`\n[${index}/${total}] Bắt đầu xử lý: ${post.title} (${post.slug})`);

  const prompt = `Eres un redactor editorial experto en guías de regalos, comercio electrónico y SEO en español para la web Miregalo (España y Latinoamérica).
Necesitamos reescribir y personalizar completamente el contenido para este artículo que antes tenía texto duplicado genérico.

DATOS DEL ARTÍCULO:
- Título: "${post.title}"
- Keyword principal: "${post.focus_keyword || post.title}"
- Slug: "${post.slug}"
- Cantidad de productos: 10

TAREAS A GENERAR (devuelve estrictamente un objeto JSON válido):
1. "excerpt": Una meta descripción cautivadora, única y persuasiva de entre 140 y 155 caracteres que incluya la keyword de forma natural y llame al clic.
2. "intro_html": Exactamente 3 párrafos HTML (<p>...</p>) apasionantes, fluidos y 100% originales.
   - Párrafo 1: Gancho emocional específico sobre el tema "${post.title}", destacando por qué este tipo de detalle o regalo en Halloween marca la diferencia y mencionando la keyword en <strong>${post.focus_keyword || post.title}</strong>.
   - Párrafo 2: Consejos y visión práctica para acertar de lleno con este público/ocasión, mencionando estilos, ambientes o tendencias actuales.
   - Párrafo 3: Breve presentación de la selección que anima al lector a descubrir los 10 mejores productos elegidos por su originalidad, calidad y relación calidad-precio.
   - PROHIBIDO hablar de Samhain, raíces celtas, ni frases plantilla como "En un panorama contemporáneo donde abundan los tópicos de plástico desechable...". Debe ser 100% fresco y personalizado para "${post.title}".
3. "guide_h2": Un título H2 editorial atractivo para la sección de consejos de compra (ej: "Claves para acertar al elegir ${post.focus_keyword || post.title}").
4. "guide_html": 2 párrafos HTML (<p>...</p>) con consejos expertos y prácticos específicos para este tema.
5. "items": Un array de exactamente 10 objetos con nombres y descripciones de productos realistas y adaptados a este tema:
   [
     {
       "heading": "Nombre específico y atractivo del producto 1",
       "description_html": "<p>Descripción detallada y atractiva de 2 párrafos breves sobre qué es, por qué destaca y para quién es ideal.</p>",
       "pros": ["Ventaja destacada 1", "Ventaja 2", "Ventaja 3"],
       "cons": ["Punto a considerar o limitación menor"]
     },
     ... (hasta 10 productos)
   ]

Responde ÚNICAMENTE con el objeto JSON sin bloques de código markdown adicionales ni explicaciones fuera del JSON.`;

  try {
    let res;
    try {
      res = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });
    } catch (e) {
      console.warn(`  ⚠️ gemini-3.5-flash failed, trying gemini-3.5-flash-lite:`, e.message);
      res = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });
    }

    const parsed = JSON.parse(res.text.trim());

    // Update items
    const updatedItems = (post.items || []).map((it, idx) => {
      const gen = parsed.items?.[idx] || {};
      return {
        ...it,
        heading: gen.heading || it.heading,
        description_html: gen.description_html || it.description_html,
        pros: gen.pros || it.pros,
        cons: gen.cons || it.cons,
      };
    });

    // Replace repetitive first section in content_html
    let updatedContent = post.content_html || '';
    const firstH2Regex = /<h2[^>]*>Contexto Cultural y Evolución[\s\S]*?<\/p>/i;
    if (firstH2Regex.test(updatedContent)) {
      const replacement = `<h2>${parsed.guide_h2}</h2>\n${parsed.guide_html}`;
      updatedContent = updatedContent.replace(firstH2Regex, replacement);
    }

    // Place affiliate notice cleanly at bottom
    updatedContent = updatedContent.replace(/<div class="affiliate-disclosure-box"[\s\S]*?<\/div>/gi, '');
    updatedContent = updatedContent.trim() + '\n' + affiliateHtml;

    // Save to Supabase with fresh client and retry
    let updated = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const sb = getFreshClient();
        const { error: updErr } = await sb
          .from('posts')
          .update({
            excerpt: parsed.excerpt,
            intro_html: parsed.intro_html,
            content_html: updatedContent,
            items: updatedItems,
            status: 'published',
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        if (!updErr) {
          updated = true;
          break;
        }
        console.warn(`  ⚠️ Attempt ${attempt} failed:`, updErr.message);
      } catch (netErr) {
        console.warn(`  ⚠️ Attempt ${attempt} network error:`, netErr.message);
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    if (updated) {
      console.log(`  ✅ ĐÃ XUẤT BẢN THÀNH CÔNG: /${post.slug}/`);
    } else {
      console.error(`  ❌ KHÔNG THỂ LƯU: /${post.slug}/`);
    }
  } catch (err) {
    console.error(`  ❌ Lỗi xử lý post ${post.slug}:`, err.message);
  }
}

async function main() {
  console.log('=== TIẾN TRÌNH VIẾT LẠI VÀ XUẤT BẢN CÁC BÀI VIẾT PLANNED ===\n');

  const sb = getFreshClient();
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, slug, title, focus_keyword, excerpt, content_html, items')
    .eq('status', 'planned')
    .order('published_at', { ascending: true });

  if (error || !posts) {
    console.error('Lỗi lấy danh sách bài viết:', error);
    return;
  }

  console.log(`Tìm thấy ${posts.length} bài viết cần xử lý.`);

  for (let i = 0; i < posts.length; i++) {
    await processOnePost(posts[i], i + 1, posts.length);
    // Pause 1s between posts
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('\n=== TẤT CẢ CÁC BÀI ĐÃ ĐƯỢC XỬ LÝ XONG ===');
}

main().catch(console.error);
