import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'seed.json');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

// Authors
const authors = db.authors || [];
const defaultAuthorId = authors[0]?.id || null;

// Categories map
const catBySlug = new Map(db.categories.map((c) => [c.slug, c.id]));

const now = new Date().toISOString();

// Define comprehensive set of Spanish cloned guides based on original site topics
const clonedGuides = [
  {
    originalUrl: '/1-month-anniversary-gifts/',
    slug: 'regalos-primer-mes-aniversario',
    type: 'gift',
    title: '12 Regalos para el Primer Mes de Aniversario: Detalles Románticos y Dulces',
    categorySlug: 'aniversario',
    targetCatalogUrl: '/regalos/aniversario/',
    cluster: 'Aniversario',
    focus_keyword: 'regalos primer mes aniversario',
    hero_image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Celebra vuestro primer mes juntos con regalos románticos, sutiles y especiales sin resultar abrumador. Ideas perfectas para novio o novia.',
    itemsCount: 8,
  },
  {
    originalUrl: '/1-year-anniversary-gifts-for-boyfriend/',
    slug: 'regalos-1-ano-aniversario-novio',
    type: 'gift',
    title: '15 Regalos de 1 Año de Aniversario para tu Novio que le Sorprenderán',
    categorySlug: 'aniversario',
    targetCatalogUrl: '/regalos/para-novio/',
    cluster: 'Novio',
    focus_keyword: 'regalos 1 año aniversario novio',
    hero_image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Las mejores ideas para celebrar el primer año de noviazgo: desde tecnología práctica hasta recuerdos personalizados inolvidables.',
    itemsCount: 9,
  },
  {
    originalUrl: '/1-year-anniversary-gifts-girlfriend/',
    slug: 'regalos-primer-aniversario-novia',
    type: 'gift',
    title: '16 Regalos Románticos para tu Novia en vuestro Primer Aniversario',
    categorySlug: 'aniversario',
    targetCatalogUrl: '/regalos/para-novia/',
    cluster: 'Novia',
    focus_keyword: 'regalos primer aniversario novia',
    hero_image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Sorprende a tu chica con joyas con grabado especial, álbumes de recuerdos y detalles llenos de significado en vuestro primer aniversario.',
    itemsCount: 10,
  },
  {
    originalUrl: '/2-year-anniversary-gifts/',
    slug: 'regalos-2-anos-aniversario',
    type: 'gift',
    title: 'Regalos para 2 Años de Aniversario: Ideas de Algodón y Detalles Creativos',
    categorySlug: 'aniversario',
    targetCatalogUrl: '/regalos/aniversario/',
    cluster: 'Aniversario',
    focus_keyword: 'regalos 2 años aniversario',
    hero_image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Cumplir dos años juntos es un gran hito. Descubre opciones de regalo tradicionales y modernas para seguir fortaleciendo vuestra unión.',
    itemsCount: 8,
  },
  {
    originalUrl: '/5-year-anniversary-gifts/',
    slug: 'regalos-5-anos-aniversario-madera',
    type: 'gift',
    title: 'Regalos de Bodas de Madera: 14 Ideas para el 5º Aniversario de Pareja',
    categorySlug: 'aniversario',
    targetCatalogUrl: '/regalos/aniversario/',
    cluster: 'Aniversario',
    focus_keyword: 'regalos 5 años aniversario',
    hero_image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'El quinto aniversario celebra la solidez de vuestra relación. Regalos de madera grabada, decoración de hogar y viajes especiales.',
    itemsCount: 8,
  },
  {
    originalUrl: '/10-year-anniversary-gifts-wife/',
    slug: 'regalos-10-anos-aniversario-esposa',
    type: 'gift',
    title: '15 Regalos Inolvidables para tu Esposa en vuestro 10º Aniversario de Bodas',
    categorySlug: 'aniversario',
    targetCatalogUrl: '/regalos/para-esposa/',
    cluster: 'Esposa',
    focus_keyword: 'regalos 10 años aniversario esposa',
    hero_image: 'https://images.unsplash.com/photo-1611591475879-1144a6fba7c7?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Una década de amor merece una celebración a la altura. Joyería de estaño o diamante, escapadas de lujo y detalles muy personales.',
    itemsCount: 9,
  },
  {
    originalUrl: '/25th-wedding-anniversary-gifts-wife/',
    slug: 'regalos-bodas-de-plata-esposa',
    type: 'gift',
    title: 'Bodas de Plata: Los Mejores Regalos de 25 Aniversario para tu Esposa',
    categorySlug: 'aniversario',
    targetCatalogUrl: '/regalos/para-esposa/',
    cluster: 'Esposa',
    focus_keyword: 'regalos bodas de plata esposa',
    hero_image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&auto=format&fit=crop&q=80',
    excerpt: '25 años juntos simbolizan lealtad y amor inquebrantable. Descubre regalos con plata de ley, libros de vida y homenajes familiares.',
    itemsCount: 10,
  },
  {
    originalUrl: '/birthday-gifts-for-mom/',
    slug: 'regalos-cumpleanos-para-mama',
    type: 'gift',
    title: '20 Regalos de Cumpleaños para Mamá que le Llegarán Directo al Corazón',
    categorySlug: 'para-mama',
    targetCatalogUrl: '/regalos/para-mama/',
    cluster: 'Mamá',
    focus_keyword: 'regalos cumpleaños para mamá',
    hero_image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Haz que el cumpleaños de mamá sea inolvidable con detalles que la mimen: relax en casa, joyería con nombres de sus hijos y tecnología fácil de usar.',
    itemsCount: 10,
  },
  {
    originalUrl: '/birthday-gifts-for-dad/',
    slug: 'regalos-cumpleanos-para-papa',
    type: 'gift',
    title: '18 Regalos de Cumpleaños para Papá Prácticos, Originales y Elegantes',
    categorySlug: 'para-papa',
    targetCatalogUrl: '/regalos/para-papa/',
    cluster: 'Papá',
    focus_keyword: 'regalos cumpleaños para papá',
    hero_image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Deja atrás las corbatas aburridas. Sorprende a papá con herramientas inteligentes, accesorios de barbacoa gourmet y gadgets útiles.',
    itemsCount: 9,
  },
  {
    originalUrl: '/gifts-for-sister/',
    slug: 'mejores-regalos-para-hermana',
    type: 'gift',
    title: '15 Regalos para tu Hermana: Ideas Divertidas, Emotivas y de Moda',
    categorySlug: 'para-mujeres',
    targetCatalogUrl: '/regalos/para-hermana/',
    cluster: 'Hermana',
    focus_keyword: 'regalos para hermana',
    hero_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Tanto si es tu hermana mayor como la pequeña, encuentra el regalo perfecto de moda, cuidado personal o decoración para sorprenderla.',
    itemsCount: 8,
  },
  {
    originalUrl: '/gifts-for-brother/',
    slug: 'mejores-regalos-para-hermano',
    type: 'gift',
    title: '14 Regalos para tu Hermano que Sí le Van a Gustar (Probados y Aprobados)',
    categorySlug: 'para-hombres',
    targetCatalogUrl: '/regalos/para-hermano/',
    cluster: 'Hermano',
    focus_keyword: 'regalos para hermano',
    hero_image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Gaming, audio de alta calidad, deportes o cerveza artesanal: regalos seleccionados para acertar con tu hermano en cualquier fecha.',
    itemsCount: 8,
  },
  {
    originalUrl: '/gifts-for-grandma/',
    slug: 'regalos-emotivos-para-abuela',
    type: 'gift',
    title: '12 Regalos Tiernos y Útiles para la Abuela que le Harán Sonreír',
    categorySlug: 'para-mujeres',
    targetCatalogUrl: '/regalos/para-abuela/',
    cluster: 'Abuela',
    focus_keyword: 'regalos para abuela',
    hero_image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Muestra a tu abuela cuánto la quieres con mantas térmicas suaves, marcos digitales con fotos familiares y tazas con dedicatorias.',
    itemsCount: 8,
  },
  {
    originalUrl: '/gifts-for-grandpa/',
    slug: 'regalos-practicos-para-abuelo',
    type: 'gift',
    title: '12 Regalos Prácticos y Conmovedores para tu Abuelo',
    categorySlug: 'para-hombres',
    targetCatalogUrl: '/regalos/para-abuelo/',
    cluster: 'Abuelo',
    focus_keyword: 'regalos para abuelo',
    hero_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Detalles que cuidan su confort: sillones de relax, juegos de mesa en madera noble y libros con la historia de su vida.',
    itemsCount: 8,
  },
  {
    originalUrl: '/gifts-for-best-friend/',
    slug: 'regalos-originales-para-mejor-amiga',
    type: 'gift',
    title: '16 Regalos para tu Mejor Amiga: Ideas Creativas para Celebrar la Amistad',
    categorySlug: 'para-amigos',
    targetCatalogUrl: '/regalos/para-amiga/',
    cluster: 'Amiga',
    focus_keyword: 'regalos mejor amiga',
    hero_image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Porque tu mejor amiga se merece lo mejor. Kits de cócteles, pulseras de la amistad modernas y cajas sorpresa personalizadas.',
    itemsCount: 9,
  },
  {
    originalUrl: '/christmas-gifts-for-parents/',
    slug: 'regalos-navidad-para-padres',
    type: 'gift',
    title: 'Los Mejores Regalos de Navidad para Padres: 15 Ideas Conjuntas',
    categorySlug: 'navidad',
    targetCatalogUrl: '/regalos/navidad/',
    cluster: 'Navidad',
    focus_keyword: 'regalos navidad padres',
    hero_image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Un regalo conjunto que puedan disfrutar los dos: cestas gourmet de Navidad, escapadas con encanto y electrodomésticos de diseño para el hogar.',
    itemsCount: 9,
  },
  {
    originalUrl: '/valentines-day-gifts-for-him/',
    slug: 'regalos-san-valentin-para-el',
    type: 'gift',
    title: 'San Valentín para Él: 15 Regalos Románticos y Sorprendentes para tu Chico',
    categorySlug: 'san-valentin',
    targetCatalogUrl: '/regalos/san-valentin/',
    cluster: 'San Valentín',
    focus_keyword: 'regalos san valentin para el',
    hero_image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Celebra el 14 de febrero con regalos que no caen en clichés: experiencias en pareja, gadgets prácticos y detalles emotivos.',
    itemsCount: 9,
  },
  {
    originalUrl: '/valentines-day-gifts-for-her/',
    slug: 'regalos-san-valentin-para-ella',
    type: 'gift',
    title: 'San Valentín para Ella: 16 Ideas para Enamorarla Aún Más',
    categorySlug: 'san-valentin',
    targetCatalogUrl: '/regalos/san-valentin/',
    cluster: 'San Valentín',
    focus_keyword: 'regalos san valentin para ella',
    hero_image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Rosas eternas, joyería fina con piedras de nacimiento, cajas de bombones artesanos y velas perfumadas para una velada mágica.',
    itemsCount: 9,
  },
  {
    originalUrl: '/mothers-day-gifts/',
    slug: 'regalos-dia-de-la-madre-espana',
    type: 'gift',
    title: 'Guía Definitiva: 20 Regalos del Día de la Madre para Sorprenderla',
    categorySlug: 'para-mama',
    targetCatalogUrl: '/regalos/dia-de-la-madre/',
    cluster: 'Día de la Madre',
    focus_keyword: 'regalos dia de la madre',
    hero_image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'El primer domingo de mayo rinde homenaje a la persona más especial de tu vida con regalos emotivos, ramos preservados y joyas grabadas.',
    itemsCount: 10,
  },
  {
    originalUrl: '/fathers-day-gifts/',
    slug: 'regalos-dia-del-padre-espana',
    type: 'gift',
    title: '18 Regalos del Día del Padre: Opciones con Éxito Garantizado',
    categorySlug: 'para-papa',
    targetCatalogUrl: '/regalos/dia-del-padre/',
    cluster: 'Día del Padre',
    focus_keyword: 'regalos dia del padre',
    hero_image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Celebra el 19 de marzo con los mejores regalos para papá: tecnología, relojes inteligentes, kits de afeitado prémium y botellas de vino de autor.',
    itemsCount: 9,
  },
  {
    originalUrl: '/housewarming-gift-ideas/',
    slug: 'regalos-para-estrenar-casa-nueva',
    type: 'gift',
    title: '14 Regalos para Estrenar Casa: Ideas Cálidas y Prácticas para Invitados',
    categorySlug: 'nueva-casa',
    targetCatalogUrl: '/regalos/utiles/',
    cluster: 'Hogar',
    focus_keyword: 'regalos casa nueva',
    hero_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Plantas purificadoras de aire, difusores ultrasónicos, tablas de quesos en bambú y juegos de toallas de algodón egipcio.',
    itemsCount: 8,
  },
  {
    originalUrl: '/wedding-gift-ideas/',
    slug: 'regalos-de-boda-para-novios',
    type: 'gift',
    title: '15 Regalos de Boda Memorables para Sorprender a los Recién Casados',
    categorySlug: 'bodas',
    targetCatalogUrl: '/regalos/aniversario/',
    cluster: 'Bodas',
    focus_keyword: 'regalos boda novios',
    hero_image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
    excerpt: 'Más allá de la transferencia bancaria: regalos físicos llenos de significado para comenzar su nueva vida juntos con ilusión.',
    itemsCount: 9,
  },
];

// Product library templates
const samplePicks = [
  {
    heading: 'Lámpara de Luna 3D Personalizada con Foto y Texto',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    price: '29,99 €',
    merchant: 'Amazon España',
    url: '/go/lampara-luna-personalizada-3d/',
    description_html: '<p>Iluminación tenue en 16 colores con soporte de madera maciza. El grabado láser reproduce fotos y textos con nitidez absoluta.</p>',
    pros: ['Control remoto táctil', 'Batería recargable USB', 'Grabado nítido de alta fidelidad'],
    button_label: 'Ver en Amazon España',
  },
  {
    heading: 'Caja Regalo Spa y Bienestar Lavanda & Rosas',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    price: '45,00 €',
    merchant: 'Loveable Store',
    url: 'https://loveable.us?ref=blog-es',
    description_html: '<p>Set artesanal de aromaterapia con sales de baño de Epsom, vela de cera de soja y crema hidratante con manteca de karité.</p>',
    pros: ['Ingredientes 100% orgánicos', 'Presentación en estuche de lujo', 'Aroma relajante duradero'],
    button_label: 'Ver en Loveable Store',
  },
  {
    heading: 'Pulsera de Plata de Ley con Coordenadas Grabadas',
    image: 'https://images.unsplash.com/photo-1611591475879-1144a6fba7c7?w=600&auto=format&fit=crop&q=80',
    price: '38,00 €',
    merchant: 'Etsy España',
    url: 'https://www.etsy.com/es/?tag=etsy-aff',
    description_html: '<p>Joyería artesanal con el lugar exacto donde os conocisteis o celebrasteis vuestro enlace grabado en números romanos o coordenadas.</p>',
    pros: ['Plata de ley 925 contrastada', 'Ajustable a cualquier muñeca', 'Empaquetado para regalo'],
    button_label: 'Ver en Etsy España',
  },
  {
    heading: 'Taza Térmica Inteligente con Control LED de Temperatura',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    price: '24,50 €',
    merchant: 'Amazon España',
    url: '/go/taza-termo-inteligente-temperatura/',
    description_html: '<p>Mantiene el café caliente durante toda la jornada laboral. Pantalla táctil que muestra los grados exactos en tiempo real.</p>',
    pros: ['Aislamiento térmico al vacío', 'Sin necesidad de recarga diaria', 'Acero inoxidable alimentario'],
    button_label: 'Ver en Amazon España',
  },
  {
    heading: 'Kit para Elaborar Cerveza Artesanal IPA en Casa',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&auto=format&fit=crop&q=80',
    price: '49,95 €',
    merchant: 'Curiosite Regalos',
    url: 'https://www.curiosite.es?ref=giftblog',
    description_html: '<p>Una experiencia cervecera completa para principiantes: fermentador de vidrio reutilizable, lúpulo aromático y manual ilustrado.</p>',
    pros: ['Rinde 5 litros', 'Fácil de seguir en casa', 'Resultados de sabor artesano'],
    button_label: 'Ver en Curiosite',
  },
  {
    heading: 'Desayuno Gourmet Sorpresa a Domicilio con Rosas Frescas',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
    price: '36,00 €',
    merchant: 'Regalo Original',
    url: 'https://www.regalooriginal.com?ref=giftblog',
    description_html: '<p>Entrega puntual a primera hora de la mañana con repostería recién horneada, zumo natural, café prémium y tarjeta con dedicatoria.</p>',
    pros: ['Entrega en 24h garantizada', 'Bandeja de madera de regalo', 'Totalmente personalizable'],
    button_label: 'Ver en Regalo Original',
  },
  {
    heading: 'Masajeador Cervical y Lumbar Shiatsu con Calor Relajante',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
    price: '39,99 €',
    merchant: 'Amazon España',
    url: 'https://www.amazon.es?tag=giftblog-21',
    description_html: '<p>Alivio inmediato de la tensión muscular en cuello y hombros gracias a sus cabezales rotatorios con terapia de calor infrarrojo.</p>',
    pros: ['Apagado automático de seguridad', 'Adaptador para casa y coche', 'Intensidad regulable'],
    button_label: 'Ver en Amazon España',
  },
  {
    heading: 'Cuaderno Diario de Cuero Vintage con Cierre Rústico',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    price: '28,50 €',
    merchant: 'Fnac España',
    url: 'https://www.fnac.es?tag=fnac-es',
    description_html: '<p>Hojas de algodón reciclado cosidas a mano en piel auténtica. Perfecto para reflexiones, dibujos o diario de viaje.</p>',
    pros: ['Papel libre de ácidos', 'Tacto suave inconfundible', 'Durabilidad para décadas'],
    button_label: 'Ver en Fnac España',
  },
];

db.posts = db.posts || [];
db.redirects = db.redirects || [];
db.internal_links = db.internal_links || [];

let newPostsCount = 0;

for (const guide of clonedGuides) {
  // Check if post already exists
  let existingPost = db.posts.find((p) => p.slug === guide.slug);

  const catId = catBySlug.get(guide.categorySlug) || null;

  const introHtml = `
    <p>¿Buscas la mejor inspiración para <strong>${guide.focus_keyword}</strong>? Hemos preparado una selección rigurosa con los artículos más valorados, combinando calidad de materiales, originalidad y opciones para todos los presupuestos.</p>
    <p>Para más sugerencias complementarias, puedes consultar también nuestro <a href="${guide.targetCatalogUrl}">directorio de ${guide.cluster.toLowerCase()}</a> con decenas de propuestas organizadas.</p>
  `.trim();

  const contentHtml = `
    <h2>Claves para Elegir el Regalo Perfecto</h2>
    <p>Al tomar una decisión, ten siempre en cuenta los gustos reales del homenajeado por encima de las tendencias pasajeras. Un detalle bien pensado demuestra tiempo, cariño y atención al detalle.</p>
    <p>No olvides revisar nuestra guía principal en el <a href="/regalos/">catálogo oficial de regalos</a> para comparar estilos, opciones de última hora y regalos personalizados.</p>
  `.trim();

  const faqs = [
    {
      q: `¿Cuánto dinero es aconsejable gastar en ${guide.focus_keyword}?`,
      a: `No existe una cifra fija. Para detalles sencillos, entre 20 € y 40 € es más que suficiente. Si buscas un regalo conmemorativo de aniversario o boda, los presupuestos oscilan entre 50 € y 120 €.`,
    },
    {
      q: `¿Son fiables las compras en las tiendas recomendadas?`,
      a: `Sí, todos los enlaces dirigen a comercios electrónicos consolidados en España como Amazon, El Corte Inglés, Fnac o tiendas artesanales como Etsy con protección al comprador.`,
    },
  ];

  const items = samplePicks.slice(0, guide.itemsCount);

  if (!existingPost) {
    const newPost = {
      id: `post-${guide.slug}`,
      type: guide.type,
      slug: guide.slug,
      title: guide.title,
      excerpt: guide.excerpt,
      intro_html: introHtml,
      content_html: contentHtml,
      items,
      faqs,
      hero_image: guide.hero_image,
      hero_alt: guide.title,
      primary_category_id: catId,
      category_ids: catId ? [catId] : [],
      author_id: defaultAuthorId,
      status: 'published',
      featured: true,
      editor_pick: true,
      focus_keyword: guide.focus_keyword,
      seo_title: `${guide.title.slice(0, 58)} | Loveable Blog`,
      seo_description: guide.excerpt.slice(0, 155),
      canonical_url: `/${guide.slug}/`,
      robots: 'index, follow',
      og_image: guide.hero_image,
      published_at: now,
      updated_at: now,
      created_at: now,
    };
    db.posts.push(newPost);
    newPostsCount++;
    existingPost = newPost;
  }

  // Add 301 redirect from original URL to Spanish slug
  if (guide.originalUrl) {
    const src = guide.originalUrl.endsWith('/') ? guide.originalUrl : `${guide.originalUrl}/`;
    const dest = `/${guide.slug}/`;
    if (!db.redirects.some((r) => r.source === src)) {
      db.redirects.push({
        id: `red-${guide.slug}`,
        source: src,
        destination: dest,
        code: 301,
        hits: 0,
        active: true,
        created_at: now,
        updated_at: now,
      });
    }
  }

  // Register internal links
  const targetCatalogUrl = guide.targetCatalogUrl;
  const linkId = `il-${existingPost.id}-hub`;
  if (!db.internal_links.some((l) => l.source_post_id === existingPost.id && l.target_url === targetCatalogUrl)) {
    db.internal_links.push({
      id: linkId,
      source_post_id: existingPost.id,
      target_url: targetCatalogUrl,
      anchor_text: `directorio de ${guide.cluster.toLowerCase()}`,
      rel: 'dofollow',
      created_at: now,
    });
  }
}

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
fs.writeFileSync(SEED_FILE, JSON.stringify(db, null, 2), 'utf8');

console.log(`✅ Successfully cloned and published ${newPostsCount} new Spanish gift guides!`);
console.log(`✅ Total posts in database: ${db.posts.length}`);
console.log(`✅ Total 301 redirects in database: ${db.redirects.length}`);
console.log(`✅ Total internal links registered: ${db.internal_links.length}`);
