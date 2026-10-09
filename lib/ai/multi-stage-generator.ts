import 'server-only';
import { db } from '@/lib/db';
import { callGemini, generateAiImage } from './gemini';
import { matchProductsForItems, searchProducts } from './product-matcher';
import { getR2Config, uploadBufferToR2 } from '@/lib/storage/r2';
import type { Post, Category, GiftItem, FaqItem, Redirect } from '@/lib/types';
import { randomUUID } from 'crypto';

export interface MultiStageGenerationRequest {
  topic: string;
  keyword?: string;
  keyword_id?: string;
  cluster?: string;
  silo?: string;
  target_slug?: string;
  min_words?: number; // default: 5000
  affiliate_tag?: string; // default: miregalo26-20
  publish?: boolean;
}

export interface MultiStageResult {
  post: Post;
  wordCount: number;
  heroImageUrl: string;
  itemCount: number;
  redirectsCreated: number;
  source: 'gemini_multi_stage' | 'fallback_engine';
}

function countWords(htmlOrText: string): number {
  return htmlOrText
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 0).length;
}

function cleanRecipientTopic(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^(ideas\s+de\s+regalos?\s+(para\s+|de\s+)?|qué\s+regalar\s+(a\s+)?(regalos\s+para\s+)?|mejores\s+regalos?\s+(para\s+)?|regalos?\s+(originales|personalizados|sentimentales|útiles|baratos|especiales|únicos|bonitos|divertidos|prácticos|creativos|inolvidables|de\s+última\s+hora|hechos\s+a\s+mano)\s+(para\s+)?)/i, '');
  return s.trim() || raw;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
      (slugLower === 'women' && (t.includes('mujer') || t.includes('esposa') || t.includes('novia') || t.includes('chica') || t.includes('amiga') || t.includes('hermana') || t.includes('suegra') || t.includes('cuñada') || t.includes('abuela') || t.includes('hija') || t.includes('maestra'))) ||
      (slugLower === 'men' && (t.includes('hombre') || t.includes('marido') || t.includes('esposo') || t.includes('novio') || t.includes('chico') || t.includes('amigo') || t.includes('hermano') || t.includes('suegro') || t.includes('cuñado') || t.includes('abuelo') || t.includes('hijo') || t.includes('maestro'))) ||
      (slugLower === 'mom' && (t.includes('mamá') || t.includes('mama') || t.includes('madre'))) ||
      (slugLower === 'dad' && (t.includes('papá') || t.includes('papa') || t.includes('padre'))) ||
      (slugLower === 'anniversary' && t.includes('aniversario')) ||
      (slugLower === 'birthday' && t.includes('cumpleaños')) ||
      (slugLower === 'christmas' && t.includes('navidad')) ||
      (slugLower === 'valentine' && (t.includes('san valentín') || t.includes('san valentin')))
    ) {
      matched.push(c);
    }
  }

  const giftsHub = categories.find((c) => c.slug === 'gifts') || categories[0];
  const primary = matched[0] || giftsHub;
  return { primary, all: matched.length > 0 ? matched : [primary] };
}

/**
 * Generates an AI hero image and uploads it to Cloudflare R2 bucket.
 * Returns public CDN URL or reliable fallback image.
 */
async function generateAndUploadHeroImage(topic: string, slug: string): Promise<string> {
  const cleanTopic = topic.trim();
  const prompt = `Professional editorial photography for an elegant gift guide article titled "${cleanTopic}". Luxurious wrapped present boxes with silk ribbons, soft warm ambient lighting, festive subtle decorations in background, warm tones, high-end magazine aesthetic, photorealistic, 8k resolution, shot on 35mm lens.`;

  try {
    const imgBuffer = await generateAiImage(prompt);
    if (imgBuffer) {
      const r2 = await getR2Config();
      if (r2) {
        const key = `articles/${slug}-hero.jpg`;
        const cdnUrl = await uploadBufferToR2(key, imgBuffer, 'image/jpeg', r2);
        if (cdnUrl) return cdnUrl;
      }
    }
  } catch (err) {
    console.warn('[MultiStage] AI image generation skipped or failed:', err);
  }

  return 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg';
}

/**
 * Main Multi-stage content generation engine to produce 5,000+ words in Spanish.
 */
export async function generateMultiStageArticle(
  req: MultiStageGenerationRequest
): Promise<MultiStageResult> {
  const [categories, { rows: authors }] = await Promise.all([
    db.find('categories', {}).then((r) => r.rows),
    db.find('authors', {}),
  ]);

  const rawTopic = req.topic || req.keyword || 'Regalos Especiales';
  const cleanTopic = rawTopic.trim();
  const recipientName = cleanRecipientTopic(cleanTopic);
  const cluster = req.cluster || 'General';
  const targetWords = req.min_words || 5000;

  // Tránh để slug bài viết trùng với hub silo catalog /regalos/...
  const slug = (req.target_slug && !req.target_slug.startsWith('/regalos') && !req.target_slug.startsWith('regalos/'))
    ? req.target_slug.replace(/^\/+|\/+$/g, '')
    : slugify(cleanTopic);

  const { primary: primaryCat, all: matchedCats } = guessCategory(cleanTopic, categories);
  const author = authors[0] || null;
  const affiliateTag = req.affiliate_tag || 'miregalo26-20';

  let title = `Los 12 Mejores Regalos para ${recipientName.charAt(0).toUpperCase() + recipientName.slice(1)}: Guía Completa de Compra`;
  let seoTitle = `Mejores Regalos para ${recipientName} (2026) | Miregalo`;
  let seoDescription = `Descubre los 12 mejores regalos para ${recipientName}. Análisis detallado, pros y contras, guía de compra completa de más de 5.000 palabras y consejos para acertar.`;
  let excerpt = `Nuestra selección definitiva con los regalos más originales, emotivos y prácticos para ${recipientName}. Calidad garantizada e ideas para sorprender con total seguridad.`;

  let introHtml = '';
  let contentHtml = '';
  let items: GiftItem[] = [];
  let faqs: FaqItem[] = [];
  let source: 'gemini_multi_stage' | 'fallback_engine' = 'fallback_engine';

  // -------------------------------------------------------------
  // STAGE 1: Dàn ý & Đề xuất 12 sản phẩm chi tiết qua Gemini AI
  // -------------------------------------------------------------
  const stage1Prompt = `
Eres el redactor jefe y experto en SEO y regalos para "Miregalo" (portal líder en España y Latinoamérica).
Diseña la estructura editorial para una MEGAYUDA DE COMPRAS en ESPAÑOL NATIVO de más de 5.000 palabras sobre: "${cleanTopic}" (Destinatario principal: ${recipientName}, Cluster: ${cluster}).

Genera un JSON con:
1. "title": Título H1 llamativo y optimizado para CTR (ej. "Los 12 Mejores Regalos para ${recipientName}: Ideas Únicas y Emocionantes para Acertar").
2. "seo_title": Título SEO menor a 60 caracteres.
3. "seo_description": Meta descripción de 145-155 caracteres.
4. "excerpt": Resumen introductorio de 150 caracteres.
5. "items_plan": Lista de exactamente 12 productos únicos, variados y de alta calidad adaptados a ${recipientName}. Para cada producto:
   - "heading": Nombre específico y atractivo del producto en español.
   - "category": Categoría temática (tecnología, moda, relax, gourmet, personalización, hogar...).
   - "price": Precio estimado en euros (ej: "39,99 €").
   - "amazon_query": Término de búsqueda para Amazon España (ej: "manta eléctrica franela suave").

Responde ÚNICAMENTE en JSON válido:
{
  "title": "...",
  "seo_title": "...",
  "seo_description": "...",
  "excerpt": "...",
  "items_plan": [
    { "heading": "...", "category": "...", "price": "...", "amazon_query": "..." }
  ]
}
`.trim();

  let stage1Data: any = null;
  try {
    const resText = await callGemini({
      prompt: stage1Prompt,
      model: 'gemini-3.5-flash',
      systemInstruction: 'Eres un editor profesional de Miregalo. Responde siempre con JSON válido en español.',
      responseMimeType: 'application/json',
    });
    if (resText) stage1Data = JSON.parse(resText);
  } catch (err) {
    console.warn('[MultiStage] Stage 1 Gemini call error:', err);
  }

  if (stage1Data?.title) {
    title = stage1Data.title;
    if (stage1Data.seo_title) seoTitle = stage1Data.seo_title;
    if (stage1Data.seo_description) seoDescription = stage1Data.seo_description;
    if (stage1Data.excerpt) excerpt = stage1Data.excerpt;
  }

  // Danh sách 12 sản phẩm kế hoạch
  const productPlan = (stage1Data?.items_plan && stage1Data.items_plan.length >= 10)
    ? stage1Data.items_plan.slice(0, 12)
    : [
        { heading: `Caja de Experiencias y Escapada con Encanto para ${recipientName}`, price: '59,90 €', amazon_query: 'smartbox escapada con encanto dos personas' },
        { heading: `Joya Personalizada Grabada en Plata de Ley 925`, price: '45,00 €', amazon_query: 'collar personalizado plata de ley grabado' },
        { heading: `Álbum de Recuerdos Prémium con Encuadernación Artesanal`, price: '29,99 €', amazon_query: 'album fotos scrapbook vintage artesanal' },
        { heading: `Masajeador Térmico Cervical y Lumbar Ergonómico`, price: '49,99 €', amazon_query: 'masajeador cervical cuello calor shiatsu' },
        { heading: `Lámpara de Luna 3D con Foto Personalizada y Control Táctil`, price: '32,50 €', amazon_query: 'lampara luna 3d personalizada luz led' },
        { heading: `Set Gourmet de Cata de Aceites de Oliva Virgen Extra Ecológicos`, price: '38,00 €', amazon_query: 'cesta gourmet aceites oliva virgen extra regalo' },
        { heading: `Bufanda de Cachemira Pura Tejida con Acabado Extra Suave`, price: '55,00 €', amazon_query: 'bufanda cachemira suave invierno mujer hombre' },
        { heading: `Taza Térmica Inteligente con Control Preciso de Temperatura`, price: '39,95 €', amazon_query: 'taza termica inteligente cafe temperatura' },
        { heading: `Huerto Urbano Doméstico con Kit Completo de Aromáticas`, price: '27,90 €', amazon_query: 'huerto urbano interior kit semillas aromaticas cocina' },
        { heading: `Vela Aromática de Cera de Soja Natural en Envase de Cerámica`, price: '22,50 €', amazon_query: 'vela aromatica cera de soja artesanal regalo' },
        { heading: `Manta Eléctrica Térmica con Niveles de Calor Regulables`, price: '42,00 €', amazon_query: 'manta termica franela sofa cama lavable' },
        { heading: `Cesta Spa Relajante de Baño con Aceites Esenciales Botánicos`, price: '36,00 €', amazon_query: 'cesta spa bano aceites esenciales mujer' },
      ];

  // -------------------------------------------------------------
  // STAGE 2: Đánh giá cực kỳ chuyên sâu cho 12 sản phẩm (~2.500 từ)
  // -------------------------------------------------------------
  const stage2Prompt = `
Como analista de productos de Miregalo, redacta una reseña EXTENSA, MINUCIOSA y PROFUNDA para cada uno de los siguientes ${productPlan.length} productos incluidos en el artículo "${title}":

${JSON.stringify(productPlan.map((p: any, i: number) => ({ id: i + 1, name: p.heading, price: p.price })))}

REGLAS DE EXTENSIÓN PARA CADA PRODUCTO:
1. "description_html": Debe contener al menos 3 párrafos completos en HTML (<p>...</p>) sumando unas 220-260 palabras por producto:
   - Párrafo 1: Análisis detallado del diseño, materiales de fabricación, ergonomía y prestaciones diferenciales.
   - Párrafo 2: La experiencia sensorial al desenvolver el paquete y por qué despierta una emoción genuina en ${recipientName}.
   - Párrafo 3: Escenarios cotidianos de uso, practicidad a largo plazo y consejos para aprovecharlo al máximo.
2. "pros": 4 ventajas muy específicas y tangibles.
3. "cons": 1 a 2 aspectos a tener en cuenta (para dotar de total credibilidad a la reseña).
4. "ideal_for": Perfil exacto de persona y ocasión idónea.

Responde ÚNICAMENTE en JSON:
{
  "reviews": [
    {
      "id": 1,
      "description_html": "<p>...</p><p>...</p><p>...</p>",
      "pros": ["...", "...", "...", "..."],
      "cons": ["..."],
      "ideal_for": "..."
    }
  ]
}
`.trim();

  let reviewsData: any = null;
  try {
    const resReviews = await callGemini({
      prompt: stage2Prompt,
      model: 'gemini-3.5-flash',
      systemInstruction: 'Eres un analista de productos exhaustivo. Escribe textos largos, detallados y elegantes en español.',
      responseMimeType: 'application/json',
    });
    if (resReviews) reviewsData = JSON.parse(resReviews);
  } catch (err) {
    console.warn('[MultiStage] Stage 2 Gemini call error:', err);
  }

  const reviewsMap = new Map<number, any>();
  if (reviewsData?.reviews && Array.isArray(reviewsData.reviews)) {
    reviewsData.reviews.forEach((r: any) => reviewsMap.set(r.id, r));
  }

  // Kết nối và tạo GiftItem cùng redirect Amazon Affiliate tag miregalo26-20
  const createdRedirects: Redirect[] = [];
  const cleanSlug = slug.replace(/\//g, '-').replace(/^-+|-+$/g, '');
  items = productPlan.map((p: any, index: number) => {
    const itemId = index + 1;
    const rev = reviewsMap.get(itemId);
    const redirectSlug = `/go/${cleanSlug}-item-${itemId}/`;

    const query = encodeURIComponent(p.amazon_query || p.heading);
    const amazonDestination = `https://www.amazon.es/s?k=${query}&tag=${affiliateTag}`;

    createdRedirects.push({
      id: `redir-${cleanSlug}-item-${itemId}`,
      source: redirectSlug,
      destination: amazonDestination,
      code: 302,
      hits: 0,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    // Thêm alias nếu slug gốc có slash
    if (cleanSlug !== slug) {
      createdRedirects.push({
        id: `redir-${slug.replace(/[^a-zA-Z0-9]/g, '-')}-item-${itemId}`,
        source: `/go/${slug}-item-${itemId}/`,
        destination: amazonDestination,
        code: 302,
        hits: 0,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const defaultDesc = `
<p>Elegir <strong>${p.heading}</strong> representa un acierto indiscutible si buscas sorprender a ${recipientName} con un detalle de calidad contrastada. Este producto destaca por su cuidada fabricación, sus acabados elegantes y la versatilidad de uso que ofrece en cualquier ocasión especial, convirtiéndose en un recuerdo memorable desde el primer instante en que se tiene entre las manos.</p>
<p>En nuestras pruebas y valoraciones editoriales, hemos comprobado que su presentación es impecable y satisface tanto a quienes valoran la funcionalidad diaria como a quienes buscan un toque de distinción y emoción genuina. Los materiales seleccionados garantizan una resistencia sobresaliente al paso del tiempo sin perder un ápice de su atractivo inicial.</p>
<p>Además, su integración en la rutina diaria resulta sumamente intuitiva, convirtiéndose rápidamente en ese tipo de regalo que se utiliza con frecuencia y que recuerda constantemente el cariño con el que fue elegido. Sin duda, una de las opciones más recomendadas de nuestra selección.</p>
`.trim();

    return {
      heading: p.heading,
      description_html: rev?.description_html || defaultDesc,
      pros: rev?.pros || [
        'Excelente relación calidad-precio y materiales prémium de larga duración',
        'Diseño cuidado que garantiza un impacto emocional inmediato',
        'Presentación atractiva lista para regalar sin necesidad de envoltorios adicionales',
        'Garantía de satisfacción y envío seguro en Amazon España',
      ],
      cons: rev?.cons || ['Conviene comprobar las dimensiones o disponibilidad con antelación'],
      price: p.price || '39,99 €',
      merchant: 'Amazon',
      url: redirectSlug,
      button_label: 'Ver oferta en Amazon',
      image: 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
    };
  });

  try {
    items = await matchProductsForItems(items);
  } catch (err) {
    console.warn('[MultiStage] matchProductsForItems warning:', err);
  }

  // -------------------------------------------------------------
  // STAGE 3: Cẩm nang mua sắm siêu chi tiết (> 1.600 từ)
  // -------------------------------------------------------------
  const stage3Prompt = `
Escribe una GUÍA DE COMPRA Y CONSEJOS EDITORIALES EN PROFUNDIDAD en formato HTML (usando <h2>, <h3>, <h4>, <p>, <ul>, <li>) para el artículo "${title}" enfocado a "${recipientName}".
Para cumplir los estándares de excelencia editorial de Miregalo, la sección debe ser SUMAMENTE EXTENSA, SUPERANDO LAS 1.600 PALABRAS en español fluido y profesional.

ESTRUCTURA EXIGIDA:
<h2>Guía de Compra Definitiva: Cómo Acertar al Regalar a ${recipientName}</h2>
1. <h3>1. Análisis Psicológico y Emocional del Regalo Perfecto</h3>
   (Al menos 4 párrafos extensos analizando el significado del detalle, la conexión afectiva y cómo transformar un objeto en un recuerdo duradero).
2. <h3>2. Criterios de Selección según Estilos de Vida y Aficiones</h3>
   (Detallar al menos 4 perfiles de ${recipientName}: amante del hogar y confort, entusiasta de la gastronomía y experiencias, persona activa o profesional, y amante de los detalles sentimentales y artesanales).
3. <h3>3. Guía de Presupuestos y Franjas de Precio</h3>
   (Desglosar minuciosamente qué buscar y qué esperar en cada franja: menos de 25 €, de 25 € a 60 €, y más de 60 €).
4. <h3>4. Los 7 Errores Más Graves al Comprar y Cómo Evitarlos</h3>
   (Analizar cada error con un párrafo completo de explicación y alternativa inteligente).
5. <h3>5. El Arte de la Presentación: Envoltorio, Tarjetas Manuscritas y Ceremonial de Entrega</h3>
   (Consejos prácticos paso a paso para maximizar el factor sorpresa).
6. <h3>6. Personalización Inteligente: Cuándo Aporta Valor y Cuándo Resulta Excesiva</h3>
   (Criterios estéticos para no caer en lo cursi ni en lo impersonal).
7. <h3>7. Checklist de Verificación Antes de Finalizar tu Compra</h3>
   (Lista de verificación completa con 6 puntos clave).

Responde ÚNICAMENTE en JSON:
{
  "buyer_guide_html": "<h2>...</h2>..."
}
`.trim();

  let guideData: any = null;
  try {
    const resGuide = await callGemini({
      prompt: stage3Prompt,
      model: 'gemini-3.5-flash',
      systemInstruction: 'Eres un ensayista y redactor de guías de compra prémium. Escribe contenido muy largo, profundo y estructurado en español.',
      responseMimeType: 'application/json',
    });
    if (resGuide) guideData = JSON.parse(resGuide);
  } catch (err) {
    console.warn('[MultiStage] Stage 3 Gemini call error:', err);
  }

  // Fallback Buyer's Guide dài hơn 1.500 từ
  const defaultBuyerGuide = `
<h2>Guía de Compra Definitiva: Cómo Acertar al Regalar a ${recipientName}</h2>
<p>Dar con el obsequio idóneo para <strong>${recipientName}</strong> no requiere gastar una fortuna, sino entender a fondo qué elementos generan un impacto emocional duradero. En un mercado saturado de opciones genéricas y propuestas masificadas, la verdadera maestría de regalar consiste en encontrar piezas que dialoguen con su día a día, sus aficiones o los momentos compartidos. A continuación, desglosamos los factores decisivos para que tu elección sea un éxito rotundo y memorable.</p>

<h3>1. Análisis Psicológico y Emocional del Regalo Perfecto</h3>
<p>El acto de regalar trasciende con creces el intercambio material de un producto. A nivel psicológico, un regalo funciona como un espejo de la relación: comunica cuánto conocemos a la otra persona, en qué medida valoramos su presencia en nuestras vidas y si hemos dedicado tiempo a reflexionar sobre lo que le hace verdaderamente feliz.</p>
<p>Cuando ${recipientName} recibe un detalle que conecta con sus aspiraciones o con un recuerdo íntimo, el cerebro activa respuestas de apego y gratitud profunda. Por el contrario, un objeto impersonal —comprado apresuradamente en el último minuto— suele transmitir desinterés, independientemente de lo costoso que haya sido en términos monetarios.</p>
<p>Por este motivo, en nuestra metodología editorial siempre anteponemos la empatía a la ostentación. El mejor regalo es aquel que consigue que quien lo recibe piense de inmediato: <em>«Esta persona realmente me conoce y sabe lo que me emociona»</em>.</p>

<h3>2. Criterios de Selección según Estilos de Vida y Aficiones</h3>
<p>Para no equivocarse, resulta fundamental identificar en qué momento vital se encuentra ${recipientName} y qué faceta de su día a día agradecería enriquecer:</p>
<ul>
  <li><strong>El perfil hogareño y amante del confort:</strong> Valora los momentos de tranquilidad, el recogimiento en casa y el autocuidado. Para este perfil, mantas térmicas ultrasuaves, difusores aromáticos de diseño o tazas inteligentes que mantienen el café caliente son aciertos que aportan placer tangible los 365 días del año.</li>
  <li><strong>El perfil gourmet y sibarita:</strong> Disfruta de la buena mesa, los productos de proximidad y las catas artesanales. Los estuches de aceites de oliva virgen extra de cosecha temprana, las cestas de quesos seleccionados o los kits de botánicos para coctelería ofrecen una experiencia multisensorial insuperable.</li>
  <li><strong>El perfil sentimental y nostálgico:</strong> Atesora los recuerdos, las fotografías y los símbolos de unión familiar. Los álbumes encuadernados en lino o piel, las joyas grabadas con fechas señaladas o las láminas personalizadas tocan directamente la fibra más sensible.</li>
  <li><strong>El perfil práctico y dinámico:</strong> Necesita soluciones versátiles que simplifiquen sus desplazamientos, su jornada laboral o su bienestar físico. Masajeadores portátiles, accesorios ergonómicos o dispositivos inteligentes de relax son sus mejores aliados.</li>
</ul>

<h3>3. Guía de Presupuestos y Franjas de Precio</h3>
<p>Tener claridad sobre el rango de inversión permite tomar decisiones sensatas sin renunciar a la excelencia:</p>
<ul>
  <li><strong>Franja accesible (Menos de 25 €):</strong> Lejos de ser opciones menores, en este segmento encontramos velas botánicas de cera de soja, sets de cultivo doméstico o libros de autor con encuadernación especial. La clave aquí es primar el buen gusto y el envoltorio sobre el tamaño del artículo.</li>
  <li><strong>Franja intermedia (De 25 € a 60 €):</strong> Es la zona más equilibrada en cuanto a relación calidad-precio. Engloba lámparas 3D personalizadas, prendas de abrigo en lana pura, sets gourmet de gama alta o masajeadores shiatsu. Ideal para aniversarios, navidades o cumpleaños señalados.</li>
  <li><strong>Franja prémium (Más de 60 €):</strong> Reservada para momentos excepcionales o regalos grupales. Comprende cajas de escapada rural con estancia y cena gourmet, piezas de joyería fina o dispositivos de relajación avanzada. Su impacto reside en la exclusividad y la experiencia integral que proporcionan.</li>
</ul>

<h3>4. Los 7 Errores Más Graves al Comprar y Cómo Evitarlos</h3>
<p>Incluso con la mejor voluntad, es fácil caer en trampas habituales que deslucen la ocasión:</p>
<ol>
  <li><strong>Comprar según tus propias preferencias:</strong> Proyectar lo que a ti te gustaría recibir es el error número uno. Despójate de tus sesgos y piensa únicamente en los hábitos de ${recipientName}.</li>
  <li><strong>Priorizar la cantidad sobre la solidez:</strong> Un solo detalle noble y bien terminado vale infinitamente más que un lote de objetos de plástico que acabarán olvidados en un trastero.</li>
  <li><strong>Ignorar las tallas o dimensiones reales:</strong> En ropa, calzado o piezas decorativas voluminosas, equivocarse de medida genera una molestia inmediata que empaña la sorpresa.</li>
  <li><strong>Olvidar la política de cambios y devoluciones:</strong> Verifica siempre que la tienda admita devoluciones ágiles en caso de que sea necesario un cambio de modelo o talla.</li>
  <li><strong>Descuidar el envoltorio:</strong> Presentar un paquete en la bolsa del supermercado o con celofán descuidado resta la mitad de la magia.</li>
  <li><strong>Omitir una dedicatoria escrita:</strong> Las palabras sentidas en papel duran toda la vida y multiplican el valor emocional de cualquier objeto.</li>
  <li><strong>Adquirir imitaciones o marcas dudosas:</strong> Apuesta siempre por distribuidores oficiales y productos con garantía demostrable para evitar decepciones de funcionamiento.</li>
</ol>

<h3>5. El Arte de la Presentación: Envoltorios, Dedicatorias y Ceremonial de Entrega</h3>
<p>La vivencia de recibir un regalo comienza mucho antes de ver el contenido: arranca cuando los ojos se posan en el envoltorio y las manos tocan la textura del papel. Recomendamos optar por papeles reciclados kraft de gramaje alto, cordeles de yute o algodón natural y pequeños elementos botánicos como una rama de romero o canela en rama.</p>
<p>Escribe a mano una tarjeta en la que detalles un recuerdo compartido o expliques con sencillez por qué pensaste en ${recipientName} al elegir ese obsequio. En un mundo digitalizado, la caligrafía personal es el lujo supremo de la cercanía.</p>
`.trim();

  // Bảng so sánh tổng quan (Comparison Table)
  const comparisonTableHtml = `
<div class="my-8 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
  <table class="min-w-full text-left text-sm text-gray-700">
    <thead class="bg-gray-50 text-xs uppercase font-semibold text-gray-900 border-b border-gray-200">
      <tr>
        <th class="px-6 py-4">Regalo Recomendado</th>
        <th class="px-6 py-4">Precio Aprox.</th>
        <th class="px-6 py-4">Punto Fuerte Principal</th>
        <th class="px-6 py-4 text-center">Disponibilidad</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      ${items
        .map(
          (it) => `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 font-medium text-gray-900">${it.heading}</td>
          <td class="px-6 py-4 font-semibold text-rose-600">${it.price || 'Consultar'}</td>
          <td class="px-6 py-4 text-gray-600">${it.pros?.[0] || 'Calidad prémium garantizada'}</td>
          <td class="px-6 py-4 text-center">
            <a href="${it.url}" target="_blank" rel="nofollow sponsored noopener" class="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition">
              Ver oferta
            </a>
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
</div>
`.trim();

  contentHtml = `
${comparisonTableHtml}
${guideData?.buyer_guide_html || defaultBuyerGuide}
`.trim();

  // -------------------------------------------------------------
  // STAGE 4: Mở bài, 8 FAQs và Lời kết (~900 từ)
  // -------------------------------------------------------------
  const stage4Prompt = `
Para el artículo "${title}" enfocado en "${recipientName}", redacta:
1. "intro_html": 3 párrafos cautivadores en HTML (<p>...</p>) sumando unas 220 palabras, explicando la dificultad de elegir, la importancia emocional de este detalle y el rigor analítico de nuestra selección.
2. "faqs": Exactamente 8 preguntas frecuentes minuciosas con respuestas LARGAS y bien fundamentadas (cada respuesta de 80-110 palabras en español).
3. "conclusion_html": 3 párrafos de conclusión editorial en HTML (<p>...</p>) sumando unas 200 palabras con resumen y llamada a la acción.

Responde ÚNICAMENTE en JSON:
{
  "intro_html": "<p>...</p><p>...</p><p>...</p>",
  "faqs": [
    { "q": "¿...?", "a": "..." }
  ],
  "conclusion_html": "<p>...</p><p>...</p><p>...</p>"
}
`.trim();

  let stage4Data: any = null;
  try {
    const resStage4 = await callGemini({
      prompt: stage4Prompt,
      model: 'gemini-3.5-flash',
      systemInstruction: 'Eres un escritor profesional en español. Genera textos muy ricos, empáticos y amplios.',
      responseMimeType: 'application/json',
    });
    if (resStage4) stage4Data = JSON.parse(resStage4);
  } catch (err) {
    console.warn('[MultiStage] Stage 4 Gemini call error:', err);
  }

  introHtml = stage4Data?.intro_html || `
<p>Encontrar el regalo idóneo para <strong>${recipientName}</strong> suele convertirse en una travesía repleta de dudas y comparaciones interminables. Con frecuencia recorremos escaparates o exploramos decenas de catálogos digitales solo para toparnos con propuestas repetitivas, impersonales o de calidad cuestionable. Sin embargo, cuando se trata de una figura tan querida y significativa, el objetivo va mucho más allá de cumplir con una fecha del calendario: buscamos expresar admiración sincera, gratitud incondicional y un cariño que perdure en el tiempo.</p>
<p>Para ahorrarte horas de incertidumbre y ofrecerte una guía con plenas garantías de acierto, nuestro equipo editorial ha probado, comparado y seleccionado las 12 mejores propuestas del mercado actual. Hemos valorado la nobleza de los materiales, el cuidado del empaquetado, la utilidad práctica en la rutina diaria y, muy especialmente, la capacidad de cada artículo para conmover a quien lo desenvuelve.</p>
<p>En las siguientes secciones encontrarás un desglose exhaustivo de cada producto con sus puntos fuertes y aspectos a considerar, acompañado de una tabla comparativa interactiva, un manual de compra con consejos profesionales y respuestas a las dudas más habituales para que tu elección sea impecable.</p>
`.trim();

  faqs = (stage4Data?.faqs && stage4Data.faqs.length >= 6)
    ? stage4Data.faqs
    : [
        {
          q: `¿Cuál es la opción más recomendada para ${recipientName} si dispongo de un presupuesto ajustado?`,
          a: `Cuando el presupuesto es contenido, los regalos que priorizan el valor sentimental y la artesanía siempre superan a los artículos puramente tecnológicos o comerciales. Un álbum encuadernado en lino con fotografías de momentos compartidos, una taza personalizada con un mensaje íntimo o una vela aromática de cera de soja natural ofrecen una calidez emocional inmensa por menos de 25 euros, demostrando dedicación, esmero y afecto sincero sin requerir un gran desembolso económico.`,
        },
        {
          q: `¿Con cuánta antelación conviene realizar la compra del regalo?`,
          a: `Nuestra recomendación editorial es encargar el obsequio con un margen de al menos 10 a 14 días laborables de antelación. Este tiempo es vital si eliges un artículo que requiera personalización —como grabados de nombres, impresión de fotografías o fechas conmemorativas— y te proporcionará la tranquilidad de inspeccionar los acabados a su llegada, preparar un envoltorio elegante y eludir imprevistos logísticos de última hora.`,
        },
        {
          q: `¿Qué regalar si ${recipientName} afirma que 'ya lo tiene todo' y no necesita nada?`,
          a: `Ante personas que cuentan con todas sus necesidades materiales cubiertas, el secreto radica en regalar bienestar, desconexión y vivencias placenteras. Las cajas de escapadas rurales con encanto, los pases de circuito termal, los lotes gourmet de cata o los masajeadores ergonómicos térmicos no saturan el espacio físico del hogar y proporcionan horas de deleite y relajación que se recuerdan con enorme cariño.`,
        },
        {
          q: `¿Es aconsejable adjuntar el ticket de cambio o factura de regalo?`,
          a: `Rotundamente sí. Aunque selecciones el detalle con la mayor de las ilusiones, facilitar un ticket de cambio sin precio visible para eventuales ajustes de talla, color o modelo es un gesto de consideración y respeto que jamás ofende, garantizando que el destinatario disfrute plenamente de su regalo con total comodidad.`,
        },
        {
          q: `¿Cómo acertar con un regalo personalizado sin resultar excesivo o cursi?`,
          a: `La clave de la elegancia en la personalización reside en la sobriedad tipográfica y la sutileza. Evita textos excesivamente largos o gráficos recargados y decántate por grabados sutiles de iniciales, coordenadas geográficas de un lugar especial o fechas emblemáticas en números romanos sobre materiales nobles como la plata de ley, la madera maciza o el cuero legítimo.`,
        },
        {
          q: `¿Qué precauciones debo tomar al comprar regalos por internet?`,
          a: `Comprueba siempre que el vendedor cuente con valoraciones verificadas, política de devoluciones gratuita y clara, y tiempos de entrega garantizados. En nuestra guía, todos los enlaces conducen a tiendas oficiales y distribuidores autorizados en Amazon España con pasarela de pago segura y soporte al cliente en español.`,
        },
        {
          q: `¿Es mejor un regalo útil para el día a día o un capricho que nunca se compraría?`,
          a: `La combinación perfecta es un capricho útil: un objeto que use con frecuencia pero de una gama o calidad notablemente superior a la que compraría para sí misma en un día ordinario. Por ejemplo, una manta térmica prémium, una bufanda de cachemira pura o una taza con control térmico elevan su confort cotidiano aportando ese toque de mimo y lujo que tanto se agradece.`,
        },
        {
          q: `¿Cómo influye la presentación en la valoración final del regalo?`,
          a: `La psicología del regalo demuestra que un envoltorio primoroso y una tarjeta escrita a mano aumentan hasta en un 40% la percepción de valor y afecto del receptor. Tómate cinco minutos para elegir un lazo bonito y redactar unas palabras sinceras; a menudo ese mensaje se guardará en un cajón durante décadas.`,
        },
      ];

  const conclusionHtml = stage4Data?.conclusion_html || `
<h2>Conclusión: El Verdadero Valor de Elegir con el Corazón</h2>
<p>Al concluir esta exhaustiva guía, conviene recordar que el mérito de un gran regalo no reside en la cifra inscrita en la factura, sino en la generosidad y el tiempo invertidos en ponerse en el lugar de ${recipientName}. Cuando un detalle consigue evocar una memoria entrañable o facilitar un instante de alivio y gozo en su rutina diaria, el objetivo se ha cumplido con creces.</p>
<p>Cualquiera de las 12 opciones aquí analizadas cuenta con el respaldo de nuestro equipo editorial y la satisfacción de miles de compradores. Te animamos a valorar qué propuesta sintoniza con mayor fuerza con su personalidad, preparar una entrega cuidada y disfrutar de la recompensa más hermosa: contemplar su expresión de sincera gratitud e ilusión al desenvolver tu obsequio.</p>
`.trim();

  contentHtml += `\n\n${conclusionHtml}`;

  if (stage1Data && reviewsData) {
    source = 'gemini_multi_stage';
  }

  // -------------------------------------------------------------
  // STAGE 5: Lưu các Redirects Affiliate vào Database
  // -------------------------------------------------------------
  for (const redir of createdRedirects) {
    try {
      const existing = await db.findOne('redirects', { source: redir.source });
      if (existing) {
        await db.update('redirects', existing.id, {
          destination: redir.destination,
          updated_at: new Date().toISOString(),
        });
      } else {
        await db.insert('redirects', redir);
      }
    } catch (err) {
      console.warn('[MultiStage] Error saving redirect:', redir.source, err);
    }
  }

  // -------------------------------------------------------------
  // STAGE 6: Kiểm tra & Bổ sung phân tích đảm bảo ĐẠT >= 5.000 TỪ
  // -------------------------------------------------------------
  let preliminaryText = `
    ${title} ${excerpt} ${introHtml}
    ${items.map((it) => `${it.heading} ${it.description_html} ${(it.pros || []).join(' ')} ${(it.cons || []).join(' ')}`).join(' ')}
    ${contentHtml}
    ${faqs.map((f) => `${f.q} ${f.a}`).join(' ')}
  `;
  let currentWords = countWords(preliminaryText);

  // Nếu chưa chạm ngưỡng 5.000 từ, tự động bổ sung ma trận kịch bản chuyên sâu
  if (currentWords < targetWords) {
    const additionalAnalysisHtml = `
<h2>Análisis Editorial Avanzado: Matriz de Decisiones y Kịch Bản Tặng Quà cho ${recipientName}</h2>
<p>Para aquellos compradores que buscan una certeza absoluta antes de tomar la decisión definitiva, hemos elaborado este estudio pormenorizado que cruza diferentes situaciones de entrega con las alternativas más idóneas de nuestro catálogo. Cada festividad o circunstancia vital impone unas expectativas concretas que conviene dominar con soltura.</p>

<h3>Escenario A: Celebraciones de Cumpleaños y Fechas de Nacimiento</h3>
<p>El aniversario de nacimiento es, por definición, la fiesta de la individualidad. En este día, el regalo debe rendir tributo exclusivo a los gustos de ${recipientName}, evitando por completo aquellos artículos de uso compartido familiar o electrodomésticos de limpieza doméstica que transmitan una idea de carga o trabajo.</p>
<p>Si la persona celebra un cambio de década (como los 30, 40, 50 o 60 años), los detalles conmemorativos cobran una trascendencia singular. Las joyas en plata u oro grabadas con la fecha exacta, las cajas de escapada rural para desconectar durante un fin de semana o los álbumes encuadernados que recopilan vivencias de todas sus etapas vitales se convierten en testimonios imborrables de afecto que adquieren mayor valor emocional con el paso del tiempo.</p>

<h3>Escenario B: Campaña Navideña, Reyes Magos y Amigo Invisible</h3>
<p>El invierno y las fiestas de fin de año se caracterizan por una búsqueda intensa de calidez, confort y momentos para compartir al calor del hogar. En esta época, los regalos que combinen una estética festiva con un bienestar palpable triunfan por encima de todo.</p>
<p>Las mantas térmicas ultrasuaves con niveles de temperatura graduables, las bufandas de cachemira pura que aíslan eficazmente del frío con una caricia aterciopelada, y los sets gourmet de cata de aceites o productos artesanales encajan a la perfección con el espíritu acogedor de la Navidad. Además, su presentación en envoltorios cuidados con lazos dorados o rojos eleva la anticipación bajo el árbol.</p>

<h3>Escenario C: Agradecimiento Espontáneo y Momentos de Superación Personal</h3>
<p>No siempre hace falta aguardar a una fecha oficial del calendario para tener un detalle hermoso con ${recipientName}. De hecho, los obsequios inesperados —aquellos que se entregan sin motivo aparente o como respaldo tras un período de esfuerzo y estrés— suelen ser los que dejan una huella más profunda en el corazón.</p>
<p>En tales circunstancias, las cestas spa de baño con extractos botánicos, los masajeadores cervicales para aliviar la tensión acumulada o las velas aromáticas de cera de soja simbolizan una invitación expresa al descanso y al cuidado propio, demostrando que estás pendiente de su salud física y serenidad mental.</p>

<h3>Guía de Materiales y Calidades: Cómo Distinguir un Producto Duradero</h3>
<p>Uno de los mayores compromisos editoriales de Miregalo es garantizar que cada artículo recomendado conserve sus propiedades intactas a lo largo de los años. Al evaluar las alternativas, presta especial atención a los siguientes estándares de calidad:</p>
<ul>
  <li><strong>Plata de Ley 925:</strong> Asegúrate de que las piezas de joyería lleven grabado el contraste oficial de 925, lo cual certifica un 92,5% de pureza en plata pura y previene irritaciones cutáneas o pérdidas de brillo prematuras.</li>
  <li><strong>Cera de Soja 100% Vegetal:</strong> A diferencia de las velas convencionales fabricadas con parafina derivada del petróleo, la cera de soja quema a menor temperatura, no emite toxinas y prolonga la difusión aromática hasta un 50% más de tiempo.</li>
  <li><strong>Tejidos Naturales frente a Sintéticos:</strong> Fibras nobles como la cachemira o la lana merina transpiran con naturalidad, regulan la temperatura corporal y resultan incomparablemente más suaves que las mezclas acrílicas de bajo coste.</li>
  <li><strong>Madera y Papel Certificados FSC:</strong> En álbumes, marcos o piezas decorativas, el sello de gestión forestal responsable garantiza una procedencia ética y una durabilidad estructural excepcional.</li>
</ul>

<h3>Resumen de Recomendaciones Editoriales por Perfil</h3>
<div class="my-6 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
  <p class="font-semibold text-gray-900 mb-2">Pautas Rápidas de Decisión:</p>
  <ul class="space-y-2 list-disc pl-5">
    <li><strong>Para quien prioriza la emoción y el recuerdo:</strong> Joya personalizada o álbum artesanal de recuerdos.</li>
    <li><strong>Para quien valora el relax y desconectar tras el trabajo:</strong> Masajeador shiatsu ergonómico o cesta de baño aromática.</li>
    <li><strong>Para los amantes de la gastronomía y las experiencias sensoriales:</strong> Set gourmet de cata o caja de escapada rural con encanto.</li>
    <li><strong>Para quienes buscan confort cotidiano y practicidad:</strong> Manta eléctrica térmica ultrasuave o taza inteligente con termostato.</li>
  </ul>
</div>
`.trim();

    contentHtml += `\n\n${additionalAnalysisHtml}`;
  }

  // -------------------------------------------------------------
  // STAGE 7: Sinh ảnh AI Hero Image & Upload Cloudflare R2
  // -------------------------------------------------------------
  const heroImageUrl = await generateAndUploadHeroImage(cleanTopic, slug);

  // -------------------------------------------------------------
  // STAGE 8: Lắp ráp bài Post hoàn chỉnh và Lưu vào Supabase
  // -------------------------------------------------------------
  const now = new Date().toISOString();
  const finalStatus = req.publish ? 'published' : 'draft';

  const newPost: Post = {
    id: randomUUID(),
    slug,
    title,
    type: 'gift',
    excerpt,
    intro_html: introHtml,
    content_html: contentHtml,
    items,
    faqs,
    primary_category_id: primaryCat.id,
    category_ids: matchedCats.map((c) => c.id),
    author_id: author ? author.id : null,
    status: finalStatus,
    featured: false,
    editor_pick: true,
    focus_keyword: cleanTopic,
    hero_image: heroImageUrl,
    hero_alt: title,
    og_image: heroImageUrl,
    seo_title: seoTitle,
    seo_description: seoDescription,
    canonical_url: `/${slug}/`,
    robots: 'index, follow',
    published_at: req.publish ? now : null,
    updated_at: now,
    created_at: now,
  };

  const existingPost = await db.findOne('posts', { slug });
  let savedPost: Post;
  if (existingPost) {
    savedPost = await db.update('posts', existingPost.id, {
      ...newPost,
      id: existingPost.id,
      created_at: existingPost.created_at,
    });
  } else {
    savedPost = await db.insert('posts', newPost);
  }

  if (req.keyword_id) {
    try {
      await db.update('keywords', req.keyword_id, {
        status: finalStatus === 'published' ? 'published' : 'writing',
        post_id: savedPost.id,
        updated_at: now,
      });
    } catch {}
  }

  // Tính tổng số từ thực tế của toàn bài viết
  const finalFullText = `
    ${savedPost.title}
    ${savedPost.excerpt}
    ${savedPost.intro_html}
    ${items.map((it) => `${it.heading} ${it.description_html} ${(it.pros || []).join(' ')} ${(it.cons || []).join(' ')}`).join(' ')}
    ${savedPost.content_html}
    ${faqs.map((f) => `${f.q} ${f.a}`).join(' ')}
  `;
  const finalWordCount = countWords(finalFullText);

  return {
    post: savedPost,
    wordCount: finalWordCount,
    heroImageUrl,
    itemCount: items.length,
    redirectsCreated: createdRedirects.length,
    source,
  };
}
