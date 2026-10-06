import { NextResponse } from 'next/server';
import { slugify } from '@/lib/urls';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, title = '', topic = '', currentContent = '', focusKeyword = '', category = 'regalos' } = body;

    const baseTopic = topic || title.replace(/^\d+\+?\s+/, '').replace(/:.*$/, '').trim() || 'ideas de regalos';

    switch (action) {
      case 'optimize_title': {
        const variations = [
          `35 Mejores Regalos para ${baseTopic}: Ideas Únicas y Originales`,
          `Guía Completa: Regalos Inolvidables para ${baseTopic} que Emocionan`,
          `Top 25 Regalos para ${baseTopic} Probados y Recomendados por Expertos`,
          `¿Qué Regalar para ${baseTopic}? 40 Ideas Perfectas para Sorprender`,
        ];
        return NextResponse.json({
          success: true,
          action,
          variations,
          selected: variations[0],
          slug: slugify(variations[0]),
        });
      }

      case 'optimize_intro': {
        const introHtml = `
<p>Elegir el regalo perfecto para <strong>${baseTopic}</strong> puede marcar la diferencia entre un detalle cualquiera y un recuerdo entrañable que perdure para siempre. Hemos investigado minuciosamente el mercado español, evaluado cientos de reseñas verificadas y seleccionado únicamente aquellos productos que combinan originalidad, acabados de primera calidad y excelente relación calidad-precio.</p>
<p>Cada propuesta de esta lista incluye garantía de satisfacción, opciones de envío rápido en 24 a 48 horas y presentación cuidada lista para regalar. Si buscas más inspiración temática, no dudes en explorar nuestro <a href="/regalos/${category}/">catálogo especializado en ${category}</a> y descubrir detalles a medida.</p>
        `.trim();

        const excerpt = `Descubre nuestra cuidada selección de los mejores regalos para ${baseTopic}. Ideas emotivas, probadas y de alta calidad para emocionar en cualquier celebración.`;

        return NextResponse.json({
          success: true,
          action,
          introHtml,
          excerpt,
        });
      }

      case 'optimize_content': {
        const contentHtml = `
<h2>Guía y Consejos de Compra: Cómo Acertar con tu Regalo para ${baseTopic}</h2>
<p>Para que tu detalle tenga el máximo impacto emocional y sea valorado sinceramente, te recomendamos considerar los siguientes aspectos clave antes de finalizar tu elección:</p>

<h3>1. Personalización y Toque Humano</h3>
<p>Un regalo personalizado con una fecha señalada, los nombres de ambos o un mensaje grabado siempre tiene un valor sentimental infinitamente superior a un artículo estándar. Aprovecha las opciones de grabado y dedicatoria personalizada disponibles en las tiendas asociadas.</p>

<h3>2. Calidad de los Materiales y Sostenibilidad</h3>
<p>Priorizamos materiales nobles y duraderos como madera maciza sostenible, acero inoxidable quirúrgico, cera de soja vegetal y algodón orgánico. Un buen regalo debe perdurar en el tiempo como un recuerdo imborrable.</p>

<h3>3. Presentación y Empaquetado</h3>
<p>La experiencia de abrir el paquete es el primer impacto visual. Te sugerimos acompañar el regalo con una tarjeta manuscrita sincera. Consulta también nuestro <a href="/regalos/">directorio general de regalos</a> para encontrar complementos ideales.</p>
        `.trim();

        return NextResponse.json({
          success: true,
          action,
          contentHtml,
        });
      }

      case 'generate_items': {
        const generatedItems = [
          {
            heading: `Lámpara LED Luna 3D Grabada con Foto y Dedicatoria para ${baseTopic}`,
            image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80',
            price: '29,99 €',
            merchant: 'Amazon España',
            url: `/go/lampara-luna-personalizada/`,
            description_html: '<p>Iluminación ambiental cálida con grabado fotográfico de alta precisión, 16 tonalidades RGB y batería recargable.</p>',
            pros: ['Grabado a medida de alta definición', 'Control táctil y mando a distancia', 'Batería recargable USB'],
            button_label: 'Ver en Amazon España',
          },
          {
            heading: `Caja Regalo Gourmet con Selección de Delicias Artesanales para ${baseTopic}`,
            image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
            price: '45,00 €',
            merchant: 'El Corte Inglés (Awin)',
            url: `/go/cesta-gourmet-artesanal/`,
            description_html: '<p>Exquisita selección de productos prémium con presentación de lujo en caja reutilizable y tarjeta dedicatoria.</p>',
            pros: ['Productos gourmet galardonados', 'Caja de madera reutilizable', 'Envío refrigerado garantizado'],
            button_label: 'Ver en El Corte Inglés',
          },
          {
            heading: `Cuadro Mapa Estelar Personalizado con Fecha y Coordenadas para ${baseTopic}`,
            image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
            price: '34,95 €',
            merchant: 'Amazon España',
            url: `/go/mapa-estelar-personalizado/`,
            description_html: '<p>Representación astronómica exacta del cielo nocturno en esa fecha y lugar inolvidable. Incluye marco de madera noble.</p>',
            pros: ['Precisión astronómica certificada', 'Papel fotográfico satinado 250g', 'Listo para colgar con marco'],
            button_label: 'Ver en Amazon España',
          },
          {
            heading: `Pulsera Grabada de Acero Quirúrgico y Cuero Genuino para ${baseTopic}`,
            image: 'https://images.unsplash.com/photo-1611591475870-1763138b34c2?w=600&auto=format&fit=crop&q=80',
            price: '24,90 €',
            merchant: 'eBay Partner Network',
            url: `/go/pulsera-acero-cuero/`,
            description_html: '<p>Diseño contemporáneo y elegante con cierre magnético reforzado y placa pulida personalizable.</p>',
            pros: ['Acero hipoalergénico de larga duración', 'Cuero trenzado de alta resistencia', 'Grabado láser imborrable'],
            button_label: 'Ver en eBay',
          },
          {
            heading: `Set de Velas Aromáticas de Cera de Soja con Aceites Esenciales para ${baseTopic}`,
            image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80',
            price: '21,90 €',
            merchant: 'Walmart Impact',
            url: `/go/set-velas-aromaticas/`,
            description_html: '<p>Aromaterapia relajante en recipientes de cristal reutilizables con mechas de algodón natural sin humo tóxico.</p>',
            pros: ['Cera de soja 100% ecológica', 'Aromas naturales de lavanda y jazmín', 'Hasta 45h de duración por vela'],
            button_label: 'Ver en Walmart',
          },
        ];

        return NextResponse.json({
          success: true,
          action,
          items: generatedItems,
        });
      }

      case 'generate_faqs': {
        const faqs = [
          {
            q: `¿Cuál es el mejor regalo para ${baseTopic}?`,
            a: `Los detalles personalizados con nombres, fechas significativas o fotos, así como las experiencias gourmet o de bienestar compartidas, son las opciones con mayor satisfacción y recuerdo emocional.`,
          },
          {
            q: `¿Cuánto tiempo tarda el envío en España?`,
            a: `La inmensa mayoría de artículos seleccionados se entregan en 24 a 48 horas laborales mediante envío Prime en la península. Los artículos que requieren grabado artesanal tardan entre 3 y 5 días.`,
          },
          {
            q: `¿Se incluye opción de envoltorio para regalo y tarjeta dedicatoria?`,
            a: `Sí, todas las tiendas asociadas permiten seleccionar empaquetado para regalo e incluir un mensaje personalizado impreso en el momento del pago.`,
          },
          {
            q: `¿Qué garantía tienen los productos recomendados?`,
            a: `Todos los comercios enlazados disponen de garantía mínima legal de 3 años en España y plazo de devolución de al menos 30 días sin coste adicional.`,
          },
        ];

        return NextResponse.json({
          success: true,
          action,
          faqs,
        });
      }

      case 'seo_meta': {
        const cleanTopic = baseTopic.slice(0, 35);
        const seoTitle = `${title.slice(0, 48)} | Loveable Blog`.slice(0, 60);
        const seoDescription = `Descubre los mejores regalos para ${cleanTopic}. Guía probada con ideas originales, detalles personalizados y precios actualizados en EUR.`.slice(0, 155);
        const resolvedKeyword = focusKeyword || `regalos ${cleanTopic}`.toLowerCase().slice(0, 35);

        return NextResponse.json({
          success: true,
          action,
          seoTitle,
          seoDescription,
          focusKeyword: resolvedKeyword,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI section optimization failed' }, { status: 500 });
  }
}
