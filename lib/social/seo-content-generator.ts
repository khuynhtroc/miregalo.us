/**
 * SEO Social Copywriting & GEO Content Optimization Engine for MiRegalo.us
 * Cấu trúc chuẩn 5 trụ cột khi đăng lên Facebook Fanpage & các kênh Mạng Xã Hội:
 * 1. Hook Headline: Tiêu đề nổi bật kèm icon theo danh mục
 * 2. Đoạn dẫn nhập & Giá trị trải nghiệm (Storytelling Hook)
 * 3. Tự động phát hiện và định dạng rõ ràng:
 *    📍 Địa chỉ / Khu vực phục vụ (Cobertura & Ubicación): Làm sạch và hiển thị chuẩn chỉ
 *    📞 Hotline tư vấn & đặt dịch vụ 24/7: Tự động gộp và loại bỏ các số điện thoại trùng lặp
 * 4. Mẹo bỏ túi & Kêu gọi hành động (Pocket Tip & CTA)
 * 5. Cụm 8 – 12 Hashtags chuẩn SEO Facebook & SEO GEO (US Hispanic & Español)
 */

export interface SeoPostSource {
  title?: string;
  category?: string;
  excerpt?: string;
  summary?: string;
  seo_description?: string;
  seoDescription?: string;
  url?: string;
  urlPath?: string;
  slug?: string;
  tags?: string[];
  type?: string;
  [key: string]: any;
}

/**
 * Chuyển chuỗi tiếng Tây Ban Nha / tiếng Việt thành PascalCase cho Hashtag
 * VD: "Regalos de Navidad para mamá" -> "RegalosDeNavidadMama"
 */
export function toHashtagSlug(str: string): string {
  if (!str) return '';
  const mainPart = str.split(/[–—\-:|]/)[0].trim() || str;
  const noTone = mainPart
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  const stopWords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'para', 'por', 'con', 'en', 'al', 'y', 'o', 'que',
    'mas', 'mejor', 'mejores', 'como', 'tu', 'su', 'sus', 'este', 'esta',
  ]);

  const words = noTone
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w.toLowerCase()) && !/^\d+$/.test(w));

  return words
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

/**
 * Chuẩn hóa số điện thoại (hỗ trợ US +1, ES +34, VN +84) để hiển thị đẹp và đồng nhất
 */
function formatPhoneNumber(digits: string): string {
  // US 10 digits
  if (digits.length === 10 && !digits.startsWith('0')) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // VN 10 digits starting with 0
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  // ES 9 digits
  if (digits.length === 9) {
    return `+34 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return digits;
}

/**
 * Tự động bóc tách, làm sạch Địa chỉ và gộp/loại bỏ số điện thoại trùng lặp
 */
export function extractPracticalInfo(
  text: string,
  post: Partial<SeoPostSource> = {}
): { address: string; phone: string; cleanIntro: string } {
  let address = '';
  let phone = '';
  let cleanIntro = text || '';

  // 1. Phát hiện và khử trùng lặp số điện thoại (US, ES, VN, Quốc tế)
  const phoneSet = new Set<string>();
  const phoneRegex = /(?:\+\d{1,3}[\s.-]?)?\(?\d{3,4}\)?[\s.-]+\d{3}[\s.-]+\d{3,4}/g;
  let match: RegExpExecArray | null;
  while ((match = phoneRegex.exec(text || '')) !== null) {
    const raw = match[0];
    let digits = raw.replace(/\D/g, '');
    // Chuẩn hóa mã quốc gia để khử trùng lặp tuyệt đối (+1 US, +84 VN, +34 ES)
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    } else if (digits.length === 11 && digits.startsWith('84')) {
      digits = '0' + digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('34')) {
      digits = digits.slice(2);
    }
    if (digits.length >= 9 && digits.length <= 11) {
      phoneSet.add(digits);
    }
  }

  if (phoneSet.size > 0) {
    phone = Array.from(phoneSet).map(formatPhoneNumber).join(' • ');
  }

  // 2. Phát hiện và làm sạch Địa chỉ (nếu có trong văn bản)
  const addrMatch = (text || '').match(/(?:Dirección|Ubicación|Địa chỉ|Address)[\s:]*([^\n\r]+)/i);
  if (addrMatch) {
    let rawAddr = addrMatch[1].trim();
    rawAddr = rawAddr.replace(/(?:Teléfono|Tel|Hotline|Điện thoại|SĐT|Phone)[\s:].*$/i, '');
    rawAddr = rawAddr.trim().replace(/[.,;–-]+$/, '').trim();
    if (rawAddr.length >= 4) {
      address = rawAddr;
    }
  }

  // 3. Làm sạch đoạn dẫn nhập (loại bỏ rác crawl, lỗi chính tả cũ như Navipapa, câu cụt)
  cleanIntro = cleanIntro
    .replace(/navipapa/gi, 'Navidad')
    .replace(/(?:Teléfono|Tel|Hotline|Điện thoại|SĐT|Phone)[\s:]*[^\n\r]+/gi, '')
    .replace(/(?:Dirección|Ubicación|Địa chỉ|Address)[\s:]*[^.\n]*(?:\.|$)?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  cleanIntro = cleanIntro.replace(/^[–\-.,;:\s]+/, '').replace(/[–\-.,;:\s]+$/, '').trim();

  if (cleanIntro && !/[.!?]$/.test(cleanIntro)) {
    cleanIntro += '.';
  }

  return { address, phone, cleanIntro };
}

/**
 * Nhận diện chủ đề bài viết quà tặng trên MiRegalo.us
 */
export function detectGiftTopic(title: string, category: string, excerpt: string, tags: string[] = []): string {
  const combined = `${title} ${category} ${excerpt} ${(tags || []).join(' ')}`.toLowerCase();

  if (/navidad|navideñ|nochebuena|reyes magos|amigo secreto|intercambio|christmas|santa|invierno|fin de año/.test(combined)) {
    return 'christmas';
  }
  if (/aniversario|novio|novia|pareja|esposo|esposa|san valentín|san valentin|amor|romántic|romantic|boda|compromiso|citas/.test(combined)) {
    return 'romance';
  }
  if (/cumpleaños|cumpleanos|edad|años|anos|fiesta|celebración/.test(combined)) {
    return 'birthday';
  }
  if (/bebé|bebe|niño|nino|niña|nina|juguete|infantil|recién nacido|baby shower|bautizo/.test(combined)) {
    return 'kids';
  }
  if (/tecnología|tecnologia|gadget|gamer|gaming|videojuego|electrónic|auriculares|smartwatch|computadora|móvil|celular/.test(combined)) {
    return 'tech';
  }
  if (/hogar|casa|cocina|decoración|decoracion|jardín|jardin|mudanza|inauguración|café|cafe|vino/.test(combined)) {
    return 'home';
  }
  if (/belleza|moda|joyería|joyeria|perfume|cuidado|maquillaje|spa|relax|bienestar|fitness|deporte/.test(combined)) {
    return 'lifestyle';
  }
  if (/mamá|mama|madre|papá|papa|padre|abuelo|abuela|hermano|hermana|familia|amigo|amiga|profesor|jefe/.test(combined)) {
    return 'family';
  }
  return 'general';
}

/**
 * Xây dựng bài đăng Facebook chuẩn SEO 5 trụ cột & Tối ưu SEO GEO cho MiRegalo.us
 */
export function buildOptimizedFacebookStatus(post: SeoPostSource, siteUrl = 'https://www.miregalo.us'): string {
  const rawTitle = (post.title || 'Guía de Regalos Originales')
    .replace(/navipapa/gi, 'Navidad')
    .trim();
  const rawCategory = (post.category || '').trim();
  const rawExcerpt = (post.excerpt || post.summary || post.seo_description || post.seoDescription || '').trim();
  const rawTags = Array.isArray(post.tags) ? post.tags : [];

  const postPath = post.urlPath || post.url || (post.slug ? `/${post.slug}/` : '');
  const normalizedPath = postPath.startsWith('/') ? postPath : `/${postPath}`;
  const fullUrl = post.url?.startsWith('http')
    ? post.url
    : `${siteUrl.replace(/\/$/, '')}${normalizedPath.endsWith('/') ? normalizedPath : `${normalizedPath}/`}`;

  const topic = detectGiftTopic(rawTitle, rawCategory, rawExcerpt, rawTags);
  const { address, phone, cleanIntro } = extractPracticalInfo(rawExcerpt, post);

  // 1. HOOK HEADLINE: TIÊU ĐỀ NỔI BẬT KÈM ICON THEO DANH MỤC
  let hookTitle = '';
  let defaultStoryHook = '';
  let pocketTip = '';

  switch (topic) {
    case 'christmas':
      hookTitle = `🎄 [ESPECIAL NAVIDAD & FIESTAS] • ${rawTitle.toUpperCase()}`;
      defaultStoryHook = `La magia de la Navidad se vive en cada detalle que compartimos con quienes más queremos. Hemos seleccionado cuidadosamente las ideas de regalos más originales, emotivas y mejor valoradas para que sorprendas a tu familia y seres queridos en estas fiestas sin complicarte.`;
      pocketTip = `💡 Consejo experto: ¡Guarda esta guía ahora! Los regalos más buscados de Navidad suelen agotarse rápido o subir de precio en los días previos a Nochebuena.`;
      break;

    case 'romance':
      hookTitle = `💝 [AMOR, PAREJAS & ANIVERSARIO] • ${rawTitle.toUpperCase()}`;
      defaultStoryHook = `Celebrar el amor merece un detalle tan único como su historia juntos. Descubre nuestra selección exclusiva de regalos románticos, personalizados y llenos de significado para emocionar a tu pareja desde el primer instante.`;
      pocketTip = `💡 Consejo experto: Acompaña tu regalo con una nota escrita a mano recordando un momento especial juntos; ese toque íntimo multiplica por diez el valor emocional del detalle.`;
      break;

    case 'birthday':
      hookTitle = `🎂 [CELEBRACIÓN & CUMPLEAÑOS] • ${rawTitle.toUpperCase()}`;
      defaultStoryHook = `¿Buscas un regalo de cumpleaños que realmente deje huella? Analizamos las mejores opciones según gustos, edades y personalidades para ayudarte a elegir un obsequio inolvidable, práctico y lleno de alegría.`;
      pocketTip = `💡 Consejo experto: Elige una opción que conecte con sus pasatiempos actuales y verifica siempre los tiempos de envío rápido para que llegue antes del gran día.`;
      break;

    case 'kids':
      hookTitle = `🧸 [REGALOS PARA NIÑOS & BEBÉS] • ${rawTitle.toUpperCase()}`;
      defaultStoryHook = `No hay nada más hermoso que ver la sonrisa de un niño al descubrir su regalo favorito. Reunimos opciones seguras, educativas y súper divertidas que estimulan su creatividad y acompañan cada etapa de su crecimiento.`;
      pocketTip = `💡 Consejo experto: Revisa siempre la edad recomendada por el fabricante y prioriza materiales seguros, duraderos y fáciles de limpiar.`;
      break;

    case 'tech':
      hookTitle = `🎧 [TECNOLOGÍA & GADGETS TOP] • ${rawTitle.toUpperCase()}`;
      defaultStoryHook = `Para los amantes de la innovación, el entretenimiento y la comodidad diaria: descubre los gadgets y accesorios tecnológicos más sorprendentes del momento con la mejor relación calidad-precio del mercado.`;
      pocketTip = `💡 Consejo experto: Compara las especificaciones clave y aprovecha los descuentos de temporada a través de nuestros enlaces verificados.`;
      break;

    case 'home':
      hookTitle = `🏡 [HOGAR, ESTILO & DECORACIÓN] • ${rawTitle.toUpperCase()}`;
      defaultStoryHook = `Transforma cualquier espacio en un rincón cálido y acogedor con regalos pensados para disfrutar del hogar. Ideas elegantes, funcionales y con mucho estilo que encantan a primera vista.`;
      pocketTip = `💡 Consejo experto: Los regalos en tonos neutros o personalizables se adaptan fácilmente a cualquier estilo de decoración interior.`;
      break;

    case 'lifestyle':
      hookTitle = `✨ [MODA, BELLEZA & BIENESTAR] • ${rawTitle.toUpperCase()}`;
      defaultStoryHook = `Regalar bienestar y cuidado personal es demostrar cuánto te importa su felicidad. Explora nuestra selección de detalles sofisticados para consentir, relajar y hacer brillar a esa persona tan especial.`;
      pocketTip = `💡 Consejo experto: Opta por sets de regalo o presentaciones premium que ofrecen una experiencia completa desde el momento de abrir la caja.`;
      break;

    case 'family':
      hookTitle = `👨‍👩‍👧‍👦 [DETALLES PARA FAMILIA & AMIGOS] • ${rawTitle.toUpperCase()}`;
      defaultStoryHook = `Porque la familia y los verdaderos amigos merecen lo mejor en cada ocasión especial. Encuentra aquí ideas entrañables, útiles y originales para agradecer su cariño incondicional.`;
      pocketTip = `💡 Consejo experto: Los detalles personalizados o que crean recuerdos en familia suelen ser los más atesorados año tras año.`;
      break;

    default:
      hookTitle = `🎁 [GUÍA DE REGALOS ORIGINALES] • ${rawTitle.toUpperCase()}`;
      defaultStoryHook = `¿Quieres acertar seguro con tu próximo regalo? Nuestro equipo ha recopilado las ideas más creativas, útiles y mejor valoradas para que encuentres el detalle perfecto en cuestión de minutos.`;
      pocketTip = `💡 Consejo experto: Guarda esta publicación en tus favoritos para tener siempre a mano las mejores ideas cuando se acerque una fecha especial.`;
      break;
  }

  // 2. ĐOẠN DẪN NHẬP & GIÁ TRỊ TRẢI NGHIỆM (STORYTELLING HOOK)
  const storytellingHook =
    cleanIntro && cleanIntro.length > 45
      ? `${cleanIntro}\n\n${defaultStoryHook}`
      : defaultStoryHook;

  // 3. TỰ ĐỘNG PHÁT HIỆN & ĐỊNH DẠNG RÕ RÀNG (ĐỊA CHỈ / KHU VỰC & HOTLINE / DỊCH VỤ 24/7)
  const locationText =
    address ||
    'Envíos rápidos a todo EE. UU. (Miami, Los Ángeles, Houston, Nueva York, Chicago...) y España';
  const hotlineText =
    phone ||
    'Asesoría gratuita y catálogo de compras online disponible 24/7 en MiRegalo.us';

  const infoLines: string[] = [
    `📍 Cobertura & Ubicación: ${locationText}`,
    `📞 Atención & Pedidos 24/7: ${hotlineText}`,
  ];

  // 4. MẸO BỎ TÚI & KÊU GỌI HÀNH ĐỘNG (CTA)
  const ctaSection = `👉 Descubre la guía completa con precios, fotos y enlaces directos de compra aquí:\n🔗 ${fullUrl}`;

  // 5. CỤM 8 – 12 HASHTAGS CHUẨN SEO FACEBOOK & SEO GEO
  const hashtagSet = new Set<string>([
    '#MiRegalo',
    '#IdeasDeRegalos',
    '#RegalosOriginales',
    '#GuiaDeRegalos',
    '#RegalosUSA',
    '#LatinosEnUSA',
  ]);

  // Thêm hashtags theo chủ đề
  if (topic === 'christmas') {
    hashtagSet.add('#RegalosDeNavidad');
    hashtagSet.add('#Navidad2026');
    hashtagSet.add('#AmigoSecreto');
  } else if (topic === 'romance') {
    hashtagSet.add('#RegalosParaParejas');
    hashtagSet.add('#DetallesDeAmor');
    hashtagSet.add('#RegalosDeAniversario');
  } else if (topic === 'birthday') {
    hashtagSet.add('#RegalosDeCumpleanos');
    hashtagSet.add('#SorpresaDeCumpleanos');
  } else if (topic === 'kids') {
    hashtagSet.add('#RegalosParaNinos');
    hashtagSet.add('#JuguetesOriginales');
  } else if (topic === 'tech') {
    hashtagSet.add('#RegalosTecnologicos');
    hashtagSet.add('#GadgetsOriginales');
  } else if (topic === 'home') {
    hashtagSet.add('#RegalosParaElHogar');
    hashtagSet.add('#DecoracionHogar');
  } else if (topic === 'lifestyle') {
    hashtagSet.add('#BellezaYBienestar');
    hashtagSet.add('#DetallesEspeciales');
  } else if (topic === 'family') {
    hashtagSet.add('#RegalosParaLaFamilia');
    hashtagSet.add('#DetallesConAmor');
  }

  // Hashtag tên riêng bài viết (PascalCase)
  const titleTag = toHashtagSlug(rawTitle);
  if (titleTag && titleTag.length >= 4) {
    hashtagSet.add(`#${titleTag}`);
  }

  // Bổ sung các thẻ SEO GEO thị trường Mỹ & Tây Ban Nha để đảm bảo tối thiểu 8-10 hashtags
  const fallbackGeoTags = [
    '#ComunidadHispana',
    '#ComprasOnlineUSA',
    '#OfertasAmazon',
    '#DetallesUnicos',
    '#Miami',
    '#California',
    '#Texas',
  ];

  for (const tag of fallbackGeoTags) {
    if (hashtagSet.size >= 10) break;
    hashtagSet.add(tag);
  }

  // Cắt gọn nghiêm ngặt trong khoảng 8 - 12 hashtags
  let finalHashtags = Array.from(hashtagSet);
  if (finalHashtags.length > 12) {
    finalHashtags = finalHashtags.slice(0, 12);
  }

  const hashtagLine = finalHashtags.join(' ');

  // Ghép toàn bộ 5 trụ cột
  const sections: string[] = [
    hookTitle,
    '',
    storytellingHook,
    '',
    ...infoLines,
    '',
    pocketTip,
    '',
    ctaSection,
    '',
    hashtagLine,
  ];

  return sections
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n')
    .trim();
}

/**
 * Tự động tạo bài đăng Telegram chuẩn định dạng HTML cho MiRegalo.us
 */
export function buildOptimizedTelegramMessage(post: SeoPostSource, siteUrl = 'https://www.miregalo.us'): string {
  const rawTitle = (post.title || 'Guía de Regalos Originales')
    .replace(/navipapa/gi, 'Navidad')
    .trim();
  const rawCategory = (post.category || '').trim();
  const rawExcerpt = (post.excerpt || post.summary || post.seo_description || '').trim();
  const rawTags = Array.isArray(post.tags) ? post.tags : [];

  const postPath = post.urlPath || post.url || (post.slug ? `/${post.slug}/` : '');
  const normalizedPath = postPath.startsWith('/') ? postPath : `/${postPath}`;
  const fullUrl = post.url?.startsWith('http')
    ? post.url
    : `${siteUrl.replace(/\/$/, '')}${normalizedPath.endsWith('/') ? normalizedPath : `${normalizedPath}/`}`;

  const topic = detectGiftTopic(rawTitle, rawCategory, rawExcerpt, rawTags);
  const { address, phone, cleanIntro } = extractPracticalInfo(rawExcerpt, post);

  let icon = '🎁';
  let label = 'GUÍA DE REGALOS ORIGINALES';
  if (topic === 'christmas') {
    icon = '🎄';
    label = 'ESPECIAL NAVIDAD & FIESTAS';
  } else if (topic === 'romance') {
    icon = '💝';
    label = 'AMOR, PAREJAS & ANIVERSARIO';
  } else if (topic === 'birthday') {
    icon = '🎂';
    label = 'CELEBRACIÓN & CUMPLEAÑOS';
  } else if (topic === 'kids') {
    icon = '🧸';
    label = 'REGALOS PARA NIÑOS & BEBÉS';
  } else if (topic === 'tech') {
    icon = '🎧';
    label = 'TECNOLOGÍA & GADGETS TOP';
  }

  let text = `${icon} <b>[${label}]</b>\n`;
  text += `<b>${rawTitle}</b>\n\n`;

  if (cleanIntro && cleanIntro.length > 20) {
    text += `${cleanIntro}\n\n`;
  }

  text += `📍 <b>Cobertura:</b> ${address || 'Envíos rápidos en todo EE. UU. y España'}\n`;
  text += `📞 <b>Soporte 24/7:</b> ${phone || 'Catálogo verificado en MiRegalo.us'}\n\n`;
  text += `👉 <a href="${fullUrl}">Ver la guía completa con precios y ofertas aquí</a>\n\n`;
  text += `#MiRegalo #IdeasDeRegalos #RegalosUSA #LatinosEnUSA`;

  return text;
}
