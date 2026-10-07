import 'server-only';
import { db } from '@/lib/db';
import { callGemini } from './gemini';
import { scrapeSourceArticle } from './crawler';
import { matchProductsForItems } from './product-matcher';
import type { Post, Category, GiftItem, FaqItem } from '@/lib/types';
import { randomUUID } from 'crypto';

export interface GenerationRequest {
  topic?: string;
  keyword?: string;
  source_url?: string;
  target_slug?: string;
  post_type?: 'gift' | 'blog' | 'page';
  category_id?: string;
  author_id?: string;
  publish?: boolean;
}

export interface GeneratedPostResult {
  post: Post;
  source: 'gemini' | 'template_engine';
  scraped: boolean;
}

/**
 * Finds the most suitable category for a topic based on keywords.
 */
function guessCategory(topic: string, categories: Category[]): { primary: Category; all: Category[] } {
  const t = topic.toLowerCase();
  const matched: Category[] = [];

  for (const c of categories) {
    if (c.group === 'hub') continue;
    const nameLower = c.name.toLowerCase();
    const slugLower = c.slug.toLowerCase();

    if (
      t.includes(nameLower) ||
      t.includes(slugLower) ||
      (slugLower === 'women' && (t.includes('wife') || t.includes('her') || t.includes('mujer') || t.includes('esposa') || t.includes('novia'))) ||
      (slugLower === 'men' && (t.includes('husband') || t.includes('him') || t.includes('hombre') || t.includes('novio') || t.includes('marido') || t.includes('boyfriend'))) ||
      (slugLower === 'mom' && (t.includes('mother') || t.includes('mamá') || t.includes('mama'))) ||
      (slugLower === 'dad' && (t.includes('father') || t.includes('papá') || t.includes('papa'))) ||
      (slugLower === 'anniversary' && (t.includes('anniversary') || t.includes('aniversario'))) ||
      (slugLower === 'birthday' && (t.includes('birthday') || t.includes('cumpleaños') || t.includes('bday'))) ||
      (slugLower === 'christmas' && (t.includes('christmas') || t.includes('navidad') || t.includes('xmas'))) ||
      (slugLower === 'valentine' && (t.includes('valentine') || t.includes('san valentín') || t.includes('san valentin'))) ||
      (slugLower === 'wedding' && (t.includes('wedding') || t.includes('boda') || t.includes('novios'))) ||
      (slugLower === 'couples' && (t.includes('couple') || t.includes('pareja')))
    ) {
      matched.push(c);
    }
  }

  const giftsHub = categories.find((c) => c.slug === 'gifts') || categories[0];
  const primary = matched[0] || giftsHub;
  return { primary, all: matched.length > 0 ? matched : [primary] };
}

/**
 * Clean slug helper
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fallback generator that crafts high-converting, native Spanish gift guides or blog posts.
 */
function generateWithTemplateEngine(
  topic: string,
  slug: string,
  category: Category,
  postType: 'gift' | 'blog' | 'page',
  scrapedItems?: GiftItem[]
): Partial<Post> {
  const isGift = postType === 'gift';
  const cleanTopic = topic.replace(/^[-_\s]+|[-_\s]+$/g, '').trim();

  const title = isGift
    ? `12 Regalos Inolvidables para ${cleanTopic}: Ideas que Realmente Emocionan`
    : `Guía Completa para ${cleanTopic}: Consejos y Momentos Especiales`;

  const excerpt = `Descubre nuestra cuidada selección de ideas y detalles para ${cleanTopic}. Regalos pensados para sorprender, emocionar y crear recuerdos únicos.`;

  const intro_html = `
<p>Encontrar el regalo perfecto para <strong>${cleanTopic}</strong> no tiene por qué ser una tarea complicada. A veces buscamos algo que transmita exactamente cuánto nos importa esa persona, pero las opciones en las tiendas convencionales resultan repetitivas o impersonales.</p>
<p>Para ayudarte a acertar con total seguridad, nuestro equipo ha seleccionado las mejores recomendaciones teniendo en cuenta la originalidad, la calidad de los materiales y el impacto emocional. Ya sea para una fecha señalada o simplemente para tener un detalle sincero, aquí encontrarás la inspiración perfecta.</p>
`.trim();

  const defaultItems: GiftItem[] = [
    {
      heading: `Lámina Personalizada de Recuerdos Especiales`,
      image: 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
      url: '/go/engraved-star-map-print/',
      button_label: 'Ver en Tienda',
      price: '45,00 €',
      merchant: 'Miregalo Store',
      description_html: `<p>Una pieza de decoración elegante y emotiva que captura los momentos más significativos. Diseñada con papel artístico de alta gama y marco personalizable.</p>`,
      pros: ['Personalización 100% a medida', 'Acabado en papel de arte premium', 'Ideal para colocar en salón o dormitorio'],
    },
    {
      heading: `Joya Grabada con Fecha Significativa`,
      image: 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
      url: '/go/custom-name-necklace/',
      button_label: 'Ver en Tienda',
      price: '69,00 €',
      merchant: 'Miregalo Store',
      description_html: `<p>Un accesorio delicado y atemporal bañado en oro que se convertirá en su joya favorita de uso diario. Incluye grabado artesanal duradero.</p>`,
      pros: ['Material hipoalergénico resistente al agua', 'Grabado artesanal de alta precisión', 'Estuche de presentación de regalo incluido'],
    },
    {
      heading: `Organizador de Cuero Hecho a Mano`,
      image: 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
      url: '/go/leather-travel-wallet/',
      button_label: 'Ver en Tienda',
      price: '55,00 €',
      merchant: 'Miregalo Store',
      description_html: `<p>El equilibrio perfecto entre funcionalidad y elegancia. Fabricado en piel genuina suave con costuras reforzadas para durar muchos años.</p>`,
      pros: ['Piel auténtica de primera calidad', 'Múltiples compartimentos prácticos', 'Envejece ganando belleza y carácter'],
    },
    {
      heading: `Manta Ultrasuave con Mensaje Personalizado`,
      image: 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
      url: '/go/photo-memory-blanket/',
      button_label: 'Ver en Tienda',
      price: '49,90 €',
      merchant: 'Miregalo Store',
      description_html: `<p>Un abrazo cálido en forma de regalo. Esta manta de felpa de tacto sedoso es perfecta para las tardes de relax en el sofá.</p>`,
      pros: ['Tejido extrasuave y transpirable', 'Lavable a máquina sin perder color', 'Mensaje emotivo impreso en alta definición'],
    },
    {
      heading: `Set de Experiencias Gourmet para Degustación`,
      image: 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
      url: 'https://miregalo.us',
      button_label: 'Ver en Tienda',
      price: '59,00 €',
      merchant: 'Gourmet Selection',
      description_html: `<p>Una experiencia para los sentidos que invita a compartir momentos inolvidables. Incluye productos artesanales de denominación de origen.</p>`,
      pros: ['Selección exclusiva de productos gourmet', 'Presentación en caja de madera rústica', 'Perfecto para compartir en pareja o familia'],
    },
  ];

  const items = scrapedItems && scrapedItems.length > 0 ? scrapedItems : defaultItems;

  const content_html = `
<h2>Claves para elegir el mejor detalle</h2>
<p>Al buscar un regalo para <strong>${cleanTopic}</strong>, la clave principal está en la empatía: pensar en qué le aporta alegría, bienestar o le ayuda en su día a día. Los detalles que incluyen un componente personalizado tienen una tasa de satisfacción mucho mayor, ya que demuestran dedicación y tiempo invertido.</p>
<h3>Qué tener en cuenta antes de decidirte:</h3>
<ul>
  <li><strong>El valor del recuerdo:</strong> Los objetos que cuentan una historia perduran en el tiempo mucho más que los regalos genéricos.</li>
  <li><strong>La utilidad real:</strong> Asegúrate de que el detalle encaja con sus aficiones y estilo de vida cotidiano.</li>
  <li><strong>La presentación:</strong> Una tarjeta escrita a mano con unas palabras sinceras multiplica el valor de cualquier detalle.</li>
</ul>
<p>Cualquiera de las opciones de esta lista ha sido seleccionada con mimo para asegurar que tu sorpresa sea todo un éxito.</p>
`.trim();

  const faqs: FaqItem[] = [
    {
      q: `¿Cuál es el mejor momento para encargar un regalo para ${cleanTopic}?`,
      a: `Lo ideal es realizar tu pedido con al menos 1 a 2 semanas de antelación, especialmente si se trata de artículos personalizados que requieren producción artesanal.`,
    },
    {
      q: `¿Qué presupuesto se recomienda destinar?`,
      a: `No existe una cifra fija. Entre 30 € y 80 € encontrarás detalles personalizados de altísima calidad que causan una impresión inolvidable sin necesidad de gastar de más.`,
    },
    {
      q: `¿Es recomendable añadir una dedicatoria personal?`,
      a: `Totalmente. Una nota breve explicando por qué elegiste ese regalo o recordando una anécdota especial es lo que transforma un buen regalo en un recuerdo eterno.`,
    },
  ];

  return {
    title,
    slug,
    type: postType,
    excerpt,
    intro_html,
    content_html,
    items: isGift ? items : [],
    faqs,
    seo_title: `${title.slice(0, 55)} | Miregalo`,
    seo_description: excerpt.slice(0, 155),
    hero_image: items[0]?.image || 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
    hero_alt: title,
    status: 'draft',
  };
}

/**
 * Main AI generation entry point:
 * Translates/generates articles in fluent native Spanish.
 */
export async function generateContent(req: GenerationRequest): Promise<GeneratedPostResult> {
  const [categories, { rows: authors }] = await Promise.all([
    db.find('categories', {}).then((r) => r.rows),
    db.find('authors', {}),
  ]);

  let scrapedData = null;
  let rawTopic = req.topic || req.keyword || '';
  let targetSlug = req.target_slug;

  // 1. If source_url provided, scrape original structure from blog.loveable.us
  if (req.source_url) {
    scrapedData = await scrapeSourceArticle(req.source_url);
    if (scrapedData) {
      if (!rawTopic) rawTopic = scrapedData.title;
      if (!targetSlug) targetSlug = scrapedData.slug;
    }
  }

  if (!rawTopic && targetSlug) {
    rawTopic = targetSlug.replace(/-/g, ' ');
  }

  if (!rawTopic) {
    rawTopic = 'Regalos Especiales y Personalizados';
  }

  // 2. Determine slug & category
  const slug = targetSlug || slugify(rawTopic);
  const { primary: primaryCat, all: matchedCats } = guessCategory(rawTopic, categories);
  const author = req.author_id ? authors.find((a) => a.id === req.author_id) || authors[0] : authors[0];
  const postType = req.post_type || (slug.startsWith('blog-') ? 'blog' : 'gift');

  let generatedData: Partial<Post> | null = null;
  let source: 'gemini' | 'template_engine' = 'template_engine';

  // 3. Try Gemini API generation if key is configured
  const prompt = `
Eres un editor senior y experto en SEO y redacción de contenidos en español para la web "Miregalo".
Tu tarea es generar un artículo de regalo (Gift Guide o Blog Post) de altísima calidad en ESPAÑOL NATIVO.

DATOS DE ENTRADA:
- Tema / Keyword: "${rawTopic}"
- Tipo de contenido: "${postType}"
- Slug objetivo: "${slug}"
- Categoría: "${primaryCat.name}"
${scrapedData ? `- Contenido original de referencia en inglés: \n${JSON.stringify({ title: scrapedData.title, excerpt: scrapedData.excerpt, itemsCount: scrapedData.items.length, items: scrapedData.items.slice(0, 6) })}` : ''}

REGLAS ESTRICTAS:
1. IDIOMA: Todo el texto generado DEBE ser en ESPAÑOL fluido, natural, persuasivo y elegante (es-ES / es-Latam neutro).
2. TÍTULO: Llamativo, optimizado para CTR y SEO, menor a 65 caracteres.
3. EXCERPT: Gancho cautivador de 140 a 160 caracteres.
4. INTRO_HTML: 2 párrafos en HTML con etiquetas <p> explicando el contexto, por qué es difícil elegir y qué criterios de selección usamos.
5. ITEMS (si es gift guide): 6 a 8 productos de regalo recomendados. Cada uno con:
   - "heading": Nombre del regalo en español.
   - "description_html": Párrafo de reseña en español explicando por qué es genial.
   - "pros": Array de 3 a 4 ventajas en español.
   - "price": Precio estimado en euros (ej: "39,99 €").
   - "merchant": Nombre de tienda ("Miregalo Store", "Amazon", "Etsy", etc.).
   - "button_label": "Ver en Tienda" o "Comprar ahora".
6. CONTENT_HTML: Sección de guía de compra en HTML (etiquetas <h2>, <h3>, <p>, <ul>, <li>) con consejos expertos.
7. FAQS: 3 preguntas frecuentes con respuestas útiles en español.

DEVUELVE ÚNICAMENTE UN OBJETO JSON VÁLIDO con la siguiente estructura:
{
  "title": "...",
  "excerpt": "...",
  "seo_title": "...",
  "seo_description": "...",
  "intro_html": "...",
  "content_html": "...",
  "items": [
    {
      "heading": "...",
      "description_html": "...",
      "pros": ["...", "..."],
      "price": "...",
      "merchant": "...",
      "button_label": "Ver en Tienda"
    }
  ],
  "faqs": [
    { "q": "...", "a": "..." }
  ]
}
`.trim();

  try {
    const aiText = await callGemini({
      prompt,
      systemInstruction: 'Eres un redactor experto en SEO y regalos para la plataforma Miregalo. Respondes siempre en JSON válido en español.',
      responseMimeType: 'application/json',
    });

    if (aiText) {
      const parsed = JSON.parse(aiText);
      if (parsed.title) {
        generatedData = {
          title: parsed.title,
          slug,
          type: postType,
          excerpt: parsed.excerpt || '',
          seo_title: parsed.seo_title || `${parsed.title.slice(0, 55)} | Miregalo`,
          seo_description: parsed.seo_description || parsed.excerpt?.slice(0, 155),
          intro_html: parsed.intro_html || '',
          content_html: parsed.content_html || '',
          items: parsed.items || [],
          faqs: parsed.faqs || [],
          hero_image: scrapedData?.hero_image || 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
          hero_alt: parsed.title,
        };
        source = 'gemini';
      }
    }
  } catch (err) {
    console.warn('Gemini generation skipped or failed, using intelligent fallback engine:', err);
  }

  // 4. Fallback if Gemini not available or failed
  if (!generatedData) {
    const scrapedGiftItems: GiftItem[] = (scrapedData?.items || []).map((it) => ({
      heading: it.heading,
      image: it.image,
      description_html: `<p>${it.description}</p>`,
      pros: it.pros.length > 0 ? it.pros : ['Diseño exclusivo y de calidad', 'Personalización garantizada', 'Envío rápido'],
      price: it.price || '45,00 €',
      merchant: it.merchant || 'Miregalo Store',
      button_label: 'Ver en Tienda',
    }));

    generatedData = generateWithTemplateEngine(
      rawTopic,
      slug,
      primaryCat,
      postType,
      scrapedGiftItems.length > 0 ? scrapedGiftItems : undefined
    );
  }

  // 5. Match items with affiliate product library
  if (generatedData.items && generatedData.items.length > 0) {
    generatedData.items = await matchProductsForItems(generatedData.items);
  }

  // 6. Build final post record
  const now = new Date().toISOString();
  const finalStatus = req.publish ? 'published' : 'draft';

  const newPost: Post = {
    id: randomUUID(),
    slug,
    title: generatedData.title || rawTopic,
    type: postType,
    excerpt: generatedData.excerpt || '',
    intro_html: generatedData.intro_html || '',
    content_html: generatedData.content_html || '',
    items: generatedData.items || [],
    faqs: generatedData.faqs || [],
    primary_category_id: req.category_id || primaryCat.id,
    category_ids: matchedCats.map((c) => c.id),
    author_id: author ? author.id : null,
    status: finalStatus,
    featured: false,
    editor_pick: false,
    focus_keyword: rawTopic,
    hero_image: generatedData.hero_image || '',
    hero_alt: generatedData.hero_alt || generatedData.title || '',
    og_image: generatedData.hero_image || '',
    seo_title: generatedData.seo_title || '',
    seo_description: generatedData.seo_description || '',
    canonical_url: '',
    robots: 'index, follow',
    published_at: req.publish ? now : null,
    updated_at: now,
    created_at: now,
  };

  // Check if post with this slug already exists; if so, update it
  const existing = await db.findOne('posts', { slug });
  let savedPost: Post;
  if (existing) {
    savedPost = await db.update('posts', existing.id, {
      ...newPost,
      id: existing.id,
      created_at: existing.created_at,
    });
  } else {
    savedPost = await db.insert('posts', newPost);
  }

  // 7. Update status in keywords table if keyword matches
  try {
    const keywordRow = await db.findOne('keywords', { target_path: `/${slug}/` });
    if (keywordRow) {
      await db.update('keywords', keywordRow.id, {
        status: finalStatus === 'published' ? 'published' : 'writing',
        post_id: savedPost.id,
      });
    }
  } catch {
    // non-fatal
  }

  return {
    post: savedPost,
    source,
    scraped: !!scrapedData,
  };
}
