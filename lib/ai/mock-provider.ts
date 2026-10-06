import type { AiProvider, GeneratePostInput, GeneratePostOutput, AiModelConfig } from './types';
import { GeneratedPostSchema } from './schemas';
import { slugify } from '@/lib/urls';

/**
 * High-fidelity Mock AI Provider.
 * Generates schema-compliant Spanish gift guides and reviews without calling external LLM APIs.
 * Guarantees zero cost and satisfies the "DO NOT generate real content" requirement.
 */
export class MockAiProvider implements AiProvider {
  readonly name = 'mock';
  readonly isMock = true;

  async generateArticle(
    input: GeneratePostInput,
    _config?: Partial<AiModelConfig>
  ): Promise<GeneratePostOutput> {
    const topic = input.topic || 'Ideas de Regalos Únicos';
    const keyword = input.keyword || topic.toLowerCase();
    const slug = input.targetPath
      ? input.targetPath.replace(/^\/regalos\//, '').replace(/^\/|\/$/g, '').replace(/\//g, '-')
      : slugify(topic);

    const title = `Guía Completa: ${topic.charAt(0).toUpperCase() + topic.slice(1)} para Sorprender`;
    const excerpt = `Descubre las mejores opciones de ${keyword} con recomendaciones probadas, análisis detallados y consejos de compra exclusivos en español.`;

    const rawOutput: GeneratePostOutput = {
      title,
      slug,
      focus_keyword: keyword,
      excerpt,
      intro_html: `
        <p>Encontrar el detalle perfecto para <strong>${keyword}</strong> requiere equilibrio entre originalidad, utilidad y emoción. Hemos seleccionado cuidadosamente los productos mejor valorados para ayudarte a acertar.</p>
        <p>Cada propuesta ha sido analizada según su calidad, relación calidad-precio y opiniones verificadas de compradores reales en España.</p>
      `.trim(),
      content_html: `
        <h2>Conclusión y Recomendaciones Finales</h2>
        <p>A la hora de elegir entre estas opciones de ${keyword}, considera el estilo de vida del destinatario y tu presupuesto disponible. Un detalle personalizado o una experiencia compartida siempre marcará la diferencia.</p>
      `.trim(),
      items: [
        {
          heading: `Kit de Regalo Prémium Seleccionado para ${input.cluster || 'Ocasiones Especiales'}`,
          image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
          price: '34,90 €',
          merchant: 'Amazon España',
          url: 'https://www.amazon.es?tag=giftblog-21',
          description_html: '<p>Una selección elegante con presentación prémium lista para regalar. Calidad de acabados garantizada.</p>',
          pros: ['Presentación lista para regalar', 'Materiales sostenibles', 'Envío exprés 24h'],
          button_label: 'Ver en Amazon España',
        },
        {
          heading: 'Detalle Personalizado con Dedicatoria Grabada',
          image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          price: '29,99 €',
          merchant: 'Etsy España',
          url: 'https://www.etsy.com/es/?tag=etsy-aff',
          description_html: '<p>Personalización artesanal con nombre o fecha especial. El toque emotivo que marca la diferencia.</p>',
          pros: ['Grabado a medida', 'Artesanía única', 'Gran impacto sentimental'],
          button_label: 'Ver en Etsy España',
        },
        {
          heading: 'Set Experiencia Gourmet Relajación y Bienestar',
          image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
          price: '45,00 €',
          merchant: 'Miregalo Store',
          url: 'https://miregalo.us?ref=blog-es',
          description_html: '<p>Pack completo de autocuidado y relajación con aromas naturales y aceites esenciales de primera calidad.</p>',
          pros: ['Aromaterapia 100% natural', 'Caja regalo de madera', 'Valoración 4.9/5'],
          button_label: 'Ver en Miregalo Store',
        },
      ],
      faqs: [
        {
          q: `¿Cuál es la opción más recomendada para ${keyword}?`,
          a: `Depende de la cercanía con la persona, pero las opciones personalizadas y los sets de experiencia son las que mayor satisfacción generan.`,
        },
        {
          q: `¿Cuánto tiempo tarda el envío de estos regalos?`,
          a: `La mayoría de artículos cuentan con entrega rápida en 24 a 48 horas en toda la península, salvo detalles con grabado manual que requieren 3 a 5 días.`,
        },
        {
          q: `¿Se puede incluir una tarjeta con mensaje personalizado?`,
          a: `Sí, tanto Amazon como las tiendas colaboradoras permiten añadir envoltorio para regalo và tarjeta con dedicatoria personalizada.`,
        },
      ],
      internal_links: [
        {
          anchor_text: 'catálogo oficial de regalos',
          target_url: '/regalos/',
        },
        {
          anchor_text: 'guías de regalos personalizados',
          target_url: '/regalos/originales/',
        },
      ],
      seo_title: `${title.slice(0, 55)} | Miregalo`,
      seo_description: excerpt.slice(0, 155),
      hero_image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&auto=format&fit=crop&q=80',
      hero_alt: `Guía de ${keyword}`,
      suggested_category_slug: 'regalos',
    };

    // Strict validation with Zod
    return GeneratedPostSchema.parse(rawOutput);
  }
}
