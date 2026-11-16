import type { FaqItem, Post } from '@/lib/types';

/**
 * 10 preguntas frecuentes maestras en español (es-US / es-ES) con estructura Answer-First
 * diseñadas para aparecer en Google AI Overview (SGE), People Also Ask, ChatGPT Search y Perplexity.
 */
export const MASTER_MIREGALO_FAQS: FaqItem[] = [
  {
    q: '¿Cuáles son los mejores regalos originales para sorprender en cualquier ocasión en 2026?',
    a: 'Los mejores regalos originales en 2026 combinan utilidad diaria, personalización y valor emocional: dispositivos inteligentes para el hogar, joyería grabada a mano, sets de bienestar y aromaterapia, cafeteras de especialidad, proyectores portátiles 4K y cajas de experiencias gastronómicas con envío rápido a domicilio.'
  },
  {
    q: '¿Cómo elegir el regalo perfecto según la edad, relación y presupuesto?',
    a: 'Para acertar con cualquier regalo, aplica la regla de los 3 pilares de Miregalo: (1) Identifica un hobby o necesidad diaria de la persona; (2) Define un rango de presupuesto claro (menos de $25 para detalles, $30–$80 para cumpleaños/aniversarios y más de $100 para ocasiones especiales); y (3) Añade un toque personalizado o una nota escrita a mano.'
  },
  {
    q: '¿Qué regalar a mamá en el Día de la Madre o su cumpleaños para emocionarla?',
    a: 'Las ideas más valoradas para regalar a mamá incluyen collares personalizados con iniciales de los hijos, masajeadores cervicales térmicos, difusores ultrasónicos de aceites esenciales, álbumes fotográficos de tapa dura, sets de cuidado facial antiedad y batas de seda o algodón orgánico.'
  },
  {
    q: '¿Cuáles son las mejores ideas de regalos para hombres (papá, novio o esposo) que tienen de todo?',
    a: 'Para hombres que parecen tenerlo todo, destacan los regalos tecnológicos y de experiencia práctica: multiherramientas de acero inoxidable, auriculares con cancelación de ruido, carteras minimalistas con bloqueo RFID, kits de barbacoa gourmet, relojes deportivos inteligentes y sets de degustación de café o whisky.'
  },
  {
    q: '¿Qué regalos económicos por menos de $25 o $30 dólares se ven lujosos y bien pensados?',
    a: 'Con un presupuesto menor a $30 USD puedes elegir regalos de alto impacto visual como velas aromáticas de cera de soja en frasco de cristal, tazas térmicas aisladas al vacío, organizadores de escritorio en cuero vegano, lámparas LED de lectura recargables y cajas de chocolates artesanales.'
  },
  {
    q: '¿Qué regalar en un aniversario de pareja o San Valentín para crear un recuerdo inolvidable?',
    a: 'Los regalos más románticos para aniversario o San Valentín son los mapas estelares personalizados del día en que se conocieron, lámparas acrílicas 3D con fotografía grabada, juegos de cartas para conversar en pareja, joyería en plata de ley 925 y escapadas de fin de semana.'
  },
  {
    q: '¿Dónde comprar regalos online seguros con envío rápido en Estados Unidos y Latinoamérica?',
    a: 'En Miregalo.us seleccionamos y verificamos diariamente cientos de ideas de regalos disponibles en tiendas oficiales de confianza como Amazon US con envío Prime de 24 a 48 horas, políticas de devolución sencilla y valoraciones reales superiores a 4.5 estrellas.'
  },
  {
    q: '¿Con cuánta anticipación debo pedir un regalo personalizado o de temporada navideña?',
    a: 'Para regalos estándar con envío rápido, basta con pedirlos entre 2 y 4 días antes de la fecha especial. Sin embargo, para regalos personalizados con grabado láser, bordado o durante temporadas altas (Navidad, Black Friday, Día de la Madre y San Valentín), se recomienda comprar con 7 a 14 días de anticipación.'
  }
];

export function buildContextualFaqsForMiregaloPost(post: Partial<Post>): FaqItem[] {
  const existing = (post.faqs ?? []).filter((f) => f && f.q && f.a);
  if (existing.length >= 4) return existing;

  const cleanTitle = (post.title || 'Regalos Originales').replace(/\s*\|\s*Miregalo.*$/i, '').trim();
  const itemCount = Array.isArray(post.items) && post.items.length > 0 ? post.items.length : 12;
  const topNames = Array.isArray(post.items)
    ? post.items
        .map((it) => it?.heading)
        .filter(Boolean)
        .slice(0, 3)
        .join(', ')
    : '';

  const dynamicFaqs: FaqItem[] = [
    {
      q: `¿Cuáles son las mejores opciones dentro de "${cleanTitle}"?`,
      a: topNames
        ? `En nuestra guía actualizada de "${cleanTitle}" hemos analizado ${itemCount} opciones destacadas, entre las que sobresalen: ${topNames}. Todas han sido seleccionadas por su excelente relación calidad-precio, reseñas verificadas de compradores y facilidad de envío.`
        : `Nuestra selección editorial de "${cleanTitle}" reúne las mejores ideas valoradas por calidad, originalidad y utilidad práctica para sorprender en cualquier ocasión especial.`
    },
    {
      q: `¿Qué presupuesto se recomienda para comprar "${cleanTitle}"?`,
      a: `En esta guía de "${cleanTitle}" encontrarás alternativas adaptadas a todos los bolsillos: desde detalles económicos y originales por menos de $25 USD, opciones intermedias de $30 a $75 USD, hasta regalos premium inolvidables.`
    }
  ];

  const merged = [...existing, ...dynamicFaqs];
  for (const m of MASTER_MIREGALO_FAQS) {
    if (merged.length >= 5) break;
    if (!merged.some((x) => x.q === m.q)) {
      merged.push(m);
    }
  }
  return merged.slice(0, 5);
}

