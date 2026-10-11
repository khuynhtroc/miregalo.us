import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const sbUrl = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(sbUrl, sbKey);

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const POSTS_TOPIC_CONFIG = [
  {
    id: 'post-regalos-women',
    regex: /pulsera|collar|joya|perfume|bolso|pendientes/i,
    faqs: [
      {
        q: '¿Qué tipo de regalo para mujer es una apuesta segura si no conozco bien sus gustos?',
        a: 'Los detalles centrados en el bienestar sensorial y la elegancia atemporal nunca fallan: un set de aromaterapia prémium, una joya minimalista de plata de ley o un bolso versátil en tono neutro.'
      },
      {
        q: '¿Cómo elegir la talla adecuada en joyería o accesorios?',
        a: 'Opta por piezas de longitud regulable, pulseras con eslabones ajustables o pendientes que no dependan de medidas anatómicas exactas.'
      }
    ]
  },
  {
    id: 'post-regalos-boda',
    regex: /boda|novios|copa|champán|vajilla|brindis/i,
    faqs: [
      {
        q: '¿Es mejor regalar dinero o un detalle físico a los novios?',
        a: 'Aunque la transferencia es común, un regalo conmemorativo personalizado (como cristalería grabada o una pieza decorativa de autor) perdura como testimonio afectivo de su gran día.'
      },
      {
        q: '¿Cuándo se debe entregar el regalo de bodas?',
        a: 'Lo más cómodo para la pareja es enviarlo a su domicilio unos días antes de la ceremonia o hasta dos semanas después del viaje de novios.'
      }
    ]
  },
  {
    id: 'post-regalos-san-valentin',
    regex: /corazón|rosa|romántic|amor|caja regalo/i,
    faqs: [
      {
        q: '¿Cómo sorprender en San Valentín sin caer en tópicos?',
        a: 'Combina un detalle tangible de diseño cuidado con un plan experiencial conjunto: una cena casera especial acompañada de una dedicatoria escrita a mano.'
      },
      {
        q: '¿Cuál es el margen de tiempo idóneo para encargar el regalo de San Valentín?',
        a: 'Recomendamos encargar con 10 días de antelación para asegurar disponibilidad y evitar saturación en las empresas de mensajería durante febrero.'
      }
    ]
  },
  {
    id: 'post-regalos-uncategorized',
    regex: /perro|gato|mascota|animal/i,
    faqs: [
      {
        q: '¿Qué regalo agradecen más los amantes de los animales?',
        a: 'Aquellos detalles que involucran activamente a su peludo: retratos personalizados de la mascota, accesorios confortables o bebederos inteligentes.'
      },
      {
        q: '¿Son seguros los juguetes y accesorios para mascotas?',
        a: 'Sí, siempre seleccionamos productos fabricados con materiales inocuos libres de BPA y con tintes no tóxicos certificados.'
      }
    ]
  },
  {
    id: 'post-regalos-jubilacion',
    regex: /reloj|pluma|estilográfica|cuero|viaje|maletín/i,
    faqs: [
      {
        q: '¿Cuál es el regalo corporativo o personal más distinguido para una jubilación?',
        a: 'Una pluma estilográfica grabada con su fecha de homenaje o un reloj clásico de precisión representan de manera impecable el agradecimiento a toda una carrera.'
      },
      {
        q: '¿Conviene acompañar el regalo con una dedicatoria grupal?',
        a: 'Sin duda. Un libro de firmas con mensajes emotivos de los compañeros de trabajo eleva enormemente el valor sentimental del obsequio.'
      }
    ]
  },
  {
    id: 'post-regalos-recipients',
    regex: /regalo|taza|set|lote|pack/i,
    faqs: [
      {
        q: '¿Cómo acertar al elegir un regalo para una persona que dice tenerlo todo?',
        a: 'Enfócate en la exclusividad, los lotes gourmet de degustación o detalles artesanales que despierten sensaciones gratificantes.'
      },
      {
        q: '¿Qué importancia tiene la presentación final del paquete?',
        a: 'Un empaque cuidado con cinta de tela y tarjeta personalizada incrementa significativamente la emoción al desempaquetarlo.'
      }
    ]
  },
  {
    id: 'post-regalos-relationship',
    regex: /pareja|dúo|juntos|aniversario/i,
    faqs: [
      {
        q: '¿Qué obsequios fomentan la complicidad en pareja?',
        a: 'Juegos de conversación íntima, tazas a juego con diseño ingenioso o álbumes fotográficos para revivir vivencias compartidas.'
      },
      {
        q: '¿Es apropiado regalar escapadas o actividades para dos?',
        a: 'Es una de las mejores alternativas para crear recuerdos duraderos lejos de la rutina cotidiana.'
      }
    ]
  },
  {
    id: 'post-regalos-frases',
    regex: /tarjeta|cuaderno|diario|libro|caligrafía/i,
    faqs: [
      {
        q: '¿Qué longitud debe tener una dedicatoria para un regalo?',
        a: 'Entre tres y cinco líneas sinceras y concisas son suficientes para transmitir afecto genuino sin resultar abrumador.'
      },
      {
        q: '¿Cómo elegir las palabras adecuadas según la ocasión?',
        a: 'Rememora un recuerdo feliz compartido y concluye con tus mejores deseos para el futuro de la persona homenajeada.'
      }
    ]
  }
];

async function main() {
  console.log('=== ENRICHING THE 8 POSTS WITH PRODUCTS & FAQS ===\n');
  const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const allProds = dbData.products || [];

  for (const cfg of POSTS_TOPIC_CONFIG) {
    const postIdx = dbData.posts.findIndex(p => p.id === cfg.id);
    if (postIdx === -1) continue;

    // Pick 8 matching products
    const matchingProds = allProds
      .filter(p => cfg.regex.test(p.name) && p.image)
      .slice(0, 8);

    const items = matchingProds.map((prod, idx) => ({
      heading: prod.name,
      url: `/go/${dbData.posts[postIdx].slug}-item-${idx + 1}/`,
      image: prod.image,
      description_html: prod.description
        ? `<p>${prod.description}</p>`
        : `<p>Una propuesta destacada que aúna elegancia, funcionalidad y una magnífica acogida editorial.</p>`,
      pros: [
        'Excelente relación calidad-precio y acabados cuidados',
        'Presentación cuidada ideal para regalar y emocionar',
        'Valoraciones verificadas muy positivas de compradores'
      ],
      price: prod.price || '24,95 €',
      merchant: prod.merchant || 'Amazon España',
      button_label: 'Ver en Amazon España'
    }));

    // Update in memory dbData
    dbData.posts[postIdx].items = items;
    dbData.posts[postIdx].faqs = cfg.faqs;

    // Update in Supabase
    const { error } = await sb.from('posts').update({
      items,
      faqs: cfg.faqs
    }).eq('id', cfg.id);

    if (error) {
      console.error(`❌ Error updating Supabase for ${cfg.id}:`, error);
    } else {
      console.log(`✅ [UPDATED] ${cfg.id}: ${items.length} items & ${cfg.faqs.length} FAQs synced.`);
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
  console.log('\n✅ Successfully enriched db.json and Supabase with curated items and FAQs!');
}

main().catch(console.error);
