import type { CatalogUrl, FaqItem } from '@/lib/types';

export interface CatalogPageDetails {
  h1: string;
  eyebrow: string;
  lead: string;
  descriptionHtml: string;
  tips: { title: string; desc: string }[];
  faqs: FaqItem[];
  matchingTags: string[];
}

/**
 * Returns comprehensive Spanish editorial content, tips, FAQs, and tags for any Catalog URL.
 */
export function getCatalogContent(catalogUrl: CatalogUrl): CatalogPageDetails {
  const title = catalogUrl.page_title;
  const type = catalogUrl.url_type;
  const path = catalogUrl.url.toLowerCase();

  // Extract recipient slug or name if present
  let recipient = '';
  if (path.includes('/para-')) {
    const match = path.match(/\/para-([^\/]+)/);
    if (match) {
      recipient = match[1].replace(/-/g, ' ');
    }
  }

  // Determine tags for product matching
  const matchingTags: string[] = [];
  if (recipient) {
    matchingTags.push(recipient.replace(/\s+/g, '-'));
    if (recipient === 'mama') matchingTags.push('madre');
    if (recipient === 'papa') matchingTags.push('padre');
    if (recipient === 'novia' || recipient === 'esposa') matchingTags.push('mujer', 'romanticos');
    if (recipient === 'novio' || recipient === 'esposo') matchingTags.push('hombre');
  }

  if (path.includes('personalizados')) matchingTags.push('personalizados');
  if (path.includes('que-lo-tiene-todo')) matchingTags.push('que-lo-tiene-todo', 'originales');
  if (path.includes('ultima-hora')) matchingTags.push('ultima-hora', 'utiles');
  if (path.includes('cumpleanos')) matchingTags.push('cumpleanos');
  if (path.includes('navidad')) matchingTags.push('navidad');
  if (path.includes('san-valentin')) matchingTags.push('san-valentin', 'romanticos');
  if (path.includes('aniversario')) matchingTags.push('aniversario', 'romanticos');
  if (path.includes('dia-de-la-madre')) matchingTags.push('dia-de-la-madre', 'mama');
  if (path.includes('dia-del-padre')) matchingTags.push('dia-del-padre', 'papa');
  if (path.includes('originales')) matchingTags.push('originales');
  if (path.includes('utiles')) matchingTags.push('utiles');
  if (path.includes('sentimentales')) matchingTags.push('sentimentales');
  if (path.includes('romanticos')) matchingTags.push('romanticos');

  // Eyebrow
  let eyebrow = 'Guía de Regalos';
  if (type === 'RECIPIENT') eyebrow = 'Selección para Destinatarios';
  if (type === 'RECIPIENT_ATTRIBUTE') eyebrow = 'Edición Personalizada';
  if (type === 'RECIPIENT_PROBLEM') eyebrow = 'Ideas para Personas Difíciles';
  if (type === 'RECIPIENT_URGENCY') eyebrow = 'Envío Rápido y Última Hora';
  if (type === 'OCCASION') eyebrow = 'Celebraciones y Fechas Especiales';
  if (type === 'STYLE') eyebrow = 'Colección por Estilo';

  // Lead paragraph
  let lead = `Encuentra las mejores ideas de ${title.toLowerCase()}. Una selección cuidada de artículos originales, útiles y de calidad para sorprender con éxito garantizado.`;
  if (type === 'RECIPIENT_ATTRIBUTE') {
    lead = `Descubre detalles únicos grabados, con fotos o nombres especiales. Los regalos personalizados para ${recipient} demuestran dedicación y crean recuerdos imborrables.`;
  } else if (type === 'RECIPIENT_PROBLEM') {
    lead = `¿No sabes qué regalar a ${recipient} porque ya tiene de todo? Apuesta por experiencias, regalos tecnológicos prácticos y detalles creativos que nunca se esperaría.`;
  } else if (type === 'RECIPIENT_URGENCY') {
    lead = `¿Se te ha echado el tiempo encima? Aquí tienes regalos de última hora para ${recipient} con envío exprés en 24 horas y tarjetas digitales listas al instante.`;
  }

  // Description HTML
  const descriptionHtml = `
    <p>Elegir el regalo perfecto no tiene por qué ser complicado. Nuestro equipo analiza las opiniones de miles de compradores, la calidad de los materiales y la originalidad para ofrecerte solo lo mejor.</p>
    <p>Cada recomendación incluye especificaciones, tiendas de confianza y enlace directo para que puedas realizar tu compra de forma segura y al mejor precio.</p>
  `;

  // Buying tips
  const tips = [
    {
      title: 'Define el presupuesto y estilo',
      desc: 'Desde pequeños detalles simbólicos (menos de 20 €) hasta regalos prémium. Lo importante es que refleje vuestra conexión.',
    },
    {
      title: 'Prioriza la utilidad o la emoción',
      desc: 'Un buen regalo o bien resuelve una necesidad cotidiana facilitando el día a día, o bien toca la fibra sensible con un recuerdo personal.',
    },
    {
      title: 'Verifica los plazos de entrega',
      desc: 'Si optas por productos personalizados o fechas festivas señaladas, recuerda anticipar tu pedido con al menos 3 a 5 días de margen.',
    },
  ];

  // FAQs
  const faqs: FaqItem[] = [
    {
      q: `¿Cuáles son los mejores ${title.toLowerCase()} actualmente?`,
      a: `Los más valorados combinan originalidad y practicidad. Entre los favoritos destacan artículos de diseño, tecnología útil para el hogar y detalles personalizados con dedicatoria.`,
    },
    {
      q: `¿Con cuánta antelación debo encargar mi regalo?`,
      a: `Para artículos en stock de tiendas como Amazon o Fnac, el envío suele demorar entre 24 y 48 horas. Si eliges un artículo personalizado grabado, se aconseja entre 4 y 7 días hábiles.`,
    },
    {
      q: `¿Qué hacer si no conozco exactamente sus gustos?`,
      a: `Opta por regalos de experiencia (como cajas gourmet, sets de spa o suscripciones) o tarjetas de regalo digitales prémium en estuche de lujo.`,
    },
  ];

  return {
    h1: title,
    eyebrow,
    lead,
    descriptionHtml,
    tips,
    faqs,
    matchingTags,
  };
}
