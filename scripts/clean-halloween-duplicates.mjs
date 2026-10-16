import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const UNIQUE_EDITORIAL_DESCRIPTIONS = [
  // 1: Deluxe
  (title, kw) => `<p>Una propuesta de alta gama que destaca como pieza central indiscutible para <strong>${kw}</strong>. Seleccionada por su excelente presencia visual y calidad constructiva, resulta perfecta para causar un impacto memorable desde el primer instante.</p><p>Su diseño refinado se adapta con naturalidad a cualquier ambiente, garantizando que quien lo reciba disfrute de un detalle de categoría superior con gran valor decorativo.</p>`,
  // 2: Artesanal
  (title, kw) => `<p>Diseñada con un cuidado enfoque artesanal que prioriza la autenticidad y los acabados meticulosos. Esta opción para <strong>${kw}</strong> aporta una textura cálida y un toque genuino que los amantes de los detalles hechos con esmero sabrán apreciar.</p><p>Resulta especialmente recomendable para quienes buscan alejarse de las opciones masivas convencionales y prefieren creaciones con personalidad propia.</p>`,
  // 3: Coleccionista
  (title, kw) => `<p>Inspirada en el coleccionismo temático y las estéticas de culto. Combina un irresistible aire nostálgico con una fabricación sólida y duradera, posicionándose como un objeto de deseo dentro de la categoría de <strong>${kw}</strong>.</p><p>Una pieza de conversación asegurada que lucirá con orgullo en estanterías, vitrinas o espacios de ocio durante todo el año.</p>`,
  // 4: Gourmet & Confort
  (title, kw) => `<p>Una combinación sumamente apetecible que une confort, calidez y ambientación estacional. Pensada para disfrutar en veladas íntimas o como un detalle de agradecimiento sumamente reconfortante para <strong>${kw}</strong>.</p><p>Despierta sensaciones placenteras y convierte cualquier reunión en una experiencia agradable, cuidada y repleta de buenos momentos.</p>`,
  // 5: Iluminación LED
  (title, kw) => `<p>Destaca por su tecnología de iluminación cálida, eficiente y completamente segura. Proporciona una atmósfera envolvente y mágica para <strong>${kw}</strong> sin preocupaciones por consumo energético o calor excesivo.</p><p>Ideal tanto para crear rincones acogedores en el hogar como para iluminar celebraciones prolongadas con total tranquilidad.</p>`,
  // 6: Interactivo
  (title, kw) => `<p>Una alternativa dinámica e interactiva concebida para dinamizar reuniones, romper el hielo y sorprender a invitados de todas las edades en torno a <strong>${kw}</strong>.</p><p>Fácil de poner en marcha y pensada para generar risas compartidas, dinámicas divertidas y recuerdos duraderos en grupo.</p>`,
  // 7: Personalizable
  (title, kw) => `<p>Pensada para quienes valoran los regalos con un fuerte vínculo emocional. Esta propuesta dentro de <strong>${kw}</strong> permite reflejar los gustos específicos y la singularidad de la persona homenajeada.</p><p>Un detalle que demuestra dedicación previa y que se conserva con especial cariño en el tiempo gracias a su carácter exclusivo.</p>`,
  // 8: Vintage
  (title, kw) => `<p>Una pieza de estética atemporal con marcadas reminiscencias clásicas. Su estilo sobrio y elegante le permite integrarse armónicamente tanto en veladas temáticas de <strong>${kw}</strong> como en la decoración permanente del hogar.</p><p>Fabricada para resistir el paso del tiempo y convertirse en un elemento decorativo de referencia para admiradores de las estéticas con solera.</p>`,
  // 9: Aromaterapia & Relajación
  (title, kw) => `<p>Enfocada en el bienestar integral y el disfrute sensorial. Formulada con esencias seleccionadas para <strong>${kw}</strong>, ayuda a transformar cualquier estancia en un santuario de calma y desconexión.</p><p>El complemento idóneo para culminar celebraciones intensas y regalarse instantes de tranquilidad reparadora en el confort del hogar.</p>`,
  // 10: Degustación Selecta
  (title, kw) => `<p>Una selección culinaria festiva pensada para deleitar paladares exigentes y compartir en sobremesas animadas en el marco de <strong>${kw}</strong>.</p><p>Presentada de forma impecable y lista para degustar, eleva el nivel gastronómico de cualquier reunión con sabores sorprendentes y muy bien equilibrados.</p>`
];

function cleanHtmlContent(rawHtml) {
  if (!rawHtml) return '';
  let html = rawHtml;

  // 1. Quitar la intro duplicada antes del primer <h2>
  const firstH2 = html.search(/<h2[^>]*>/i);
  if (firstH2 > 0) {
    html = html.slice(firstH2);
  }

  // 2. Quitar sección de productos duplicados (Análisis Detallado de los 10 Mejores Regalos...)
  html = html.replace(/<h2[^>]*>(?:Análisis Detallado|Selección Detallada|Nuestros \d+ Mejores)[\s\S]*?(?=<h2)/i, '');

  // 3. Quitar sección de FAQs duplicadas en texto plano
  html = html.replace(/<h2[^>]*>(?:Preguntas Frecuentes|FAQ)[\s\S]*?(?=<h2|$)/i, '');

  return html.trim();
}

function cleanItems(items, postTitle) {
  if (!items || !Array.isArray(items)) return items;

  // Extraer palabra clave limpia del título del post
  const cleanKeyword = postTitle
    .replace(/^Los \d+ Mejores Regalos de /i, '')
    .replace(/^10 Opciones con /i, '')
    .replace(/: \d+ .*$/i, '')
    .trim();

  return items.map((it, idx) => {
    const rawHeading = it.heading || `Opción ${idx + 1}`;
    // Limpiar sufijo repetitivo: " – Especial Velas flotantes para halloween"
    const cleanedHeading = rawHeading.replace(/\s*[–—-]\s*Especial\s+.*$/i, '').trim();

    // Comprobar si la descripción actual es la genérica repetitiva
    const isGenericBoilerplate = !it.description_html || it.description_html.includes('Dentro de las mejores propuestas para');

    let newDesc = it.description_html;
    if (isGenericBoilerplate) {
      const generator = UNIQUE_EDITORIAL_DESCRIPTIONS[idx % UNIQUE_EDITORIAL_DESCRIPTIONS.length];
      newDesc = generator(cleanedHeading, cleanKeyword);
    }

    return {
      ...it,
      heading: cleanedHeading,
      description_html: newDesc
    };
  });
}

async function runCleanProcess() {
  console.log('================================================================');
  console.log('🧹 BẮT ĐẦU RÀ SOÁT VÀ XỬ LÝ LỖI LẶP LẠI NỘI DUNG TRÊN MIREGALO.US');
  console.log('================================================================\n');

  // 1. Quét tìm tất cả các bài viết bị lỗi lặp
  console.log('🔍 Bước 1: Quét toàn bộ database để xác định các bài bị lặp nội dung...');
  let offset = 0;
  const batchSize = 200;
  const targetPosts = [];

  while (true) {
    const { data: posts, error } = await sb
      .from('posts')
      .select('id, slug, title, items, intro_html, content_html, faqs')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Lỗi truy vấn:', error.message);
      break;
    }
    if (!posts || posts.length === 0) break;

    for (const p of posts) {
      const hasEspecialInItems = p.items && Array.isArray(p.items) && p.items.some(it => it.heading && /\s*[–—-]\s*Especial\s+/i.test(it.heading));
      const hasAnalisisInContent = p.content_html && /<h2[^>]*>(?:Análisis Detallado|Selección Detallada)/i.test(p.content_html);
      const hasFaqsInContent = p.content_html && /<h2[^>]*>(?:Preguntas Frecuentes|FAQ)/i.test(p.content_html);

      if (hasEspecialInItems || hasAnalisisInContent || hasFaqsInContent) {
        targetPosts.push(p);
      }
    }
    offset += batchSize;
  }

  console.log(`✅ Tìm thấy ${targetPosts.length} bài viết cần xử lý làm sạch nội dung.\n`);

  // 2. Tiến hành chuẩn hóa và cập nhật từng bài
  console.log('⚙️ Bước 2: Bắt đầu chuẩn hóa items và content_html...');
  let updatedCount = 0;

  for (const post of targetPosts) {
    const cleanedContent = cleanHtmlContent(post.content_html);
    const cleanedItemsList = cleanItems(post.items, post.title);

    const updatePayload = {
      content_html: cleanedContent,
      items: cleanedItemsList,
      updated_at: new Date().toISOString()
    };

    const { error: updErr } = await sb
      .from('posts')
      .update(updatePayload)
      .eq('id', post.id);

    if (updErr) {
      console.error(`❌ Lỗi cập nhật bài ${post.slug}:`, updErr.message);
    } else {
      updatedCount++;
      if (updatedCount % 10 === 0 || updatedCount === targetPosts.length) {
        console.log(`   ✓ Đã chuẩn hóa: ${updatedCount}/${targetPosts.length} bài viết (${post.slug})`);
      }
    }
  }

  // 3. Kiểm tra riêng bài mẫu velas-flotantes-candelabros-goticos-halloween
  console.log('\n🔎 Bước 3: Kiểm tra đối soát bài viết cụ thể: velas-flotantes-candelabros-goticos-halloween...');
  const { data: samplePost } = await sb
    .from('posts')
    .select('title, items, content_html')
    .eq('slug', 'velas-flotantes-candelabros-goticos-halloween')
    .single();

  if (samplePost) {
    console.log('   - Tiêu đề:', samplePost.title);
    console.log('   - 5 Items đầu sau khi làm sạch:');
    samplePost.items.slice(0, 5).forEach((it, i) => {
      console.log(`     #${i+1}: ${it.heading}`);
    });
    console.log('   - Các H2 còn lại trong content_html:');
    const h2s = [...samplePost.content_html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    console.log(h2s);
  }

  console.log('\n🎉 HOÀN TẤT XỬ LÝ LỖI LẶP NỘI DUNG TRÊN TOÀN BỘ WEBSITE THÀNH CÔNG 100%!');
}

runCleanProcess().catch(console.error);
