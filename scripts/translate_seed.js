const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'data', 'seed.json');
const dbPath = path.join(__dirname, '..', 'data', 'db.json');

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// 1. Settings
seed.settings = {
  site: {
    site_name: 'Loveable Blog',
    site_tagline: 'Ideas de regalos significativas para cada persona, relación y ocasión.',
    site_description: 'Guías y sugerencias de regalos pensadas para sorprender a quien más quieres en cualquier momento especial.',
    organization_name: 'Loveable',
    organization_url: 'https://loveable.us',
    logo_url: '/images/loveable-logo.png',
    logo_fullsize_url: '/images/loveable-logo-fullsize.png',
    favicon_url: '/favicon.ico',
    default_og_image: '/images/loveable-logo-fullsize.png',
    locale: 'es',
    title_separator: '|',
    shop_url: 'https://loveable.us',
    shop_label: 'Tienda Loveable',
    contact_url: 'https://loveable.us/pages/contact-us',
    copyright: '© {year} Loveable LLC. Todos los derechos reservados.',
    footer_tagline: 'Ideas desde el corazón, hechas para compartir.',
    footer_about: 'Ideas y guías de regalos para cada persona, relación y momento significativo.',
    hero_eyebrow: 'Ideas con significado, hechas personales',
    hero_title: 'Encuentra un regalo que recordarán siempre',
    hero_lead: 'Explora guías detalladas para cada persona, relación y ocasión, y transforma la idea perfecta en un recuerdo inolvidable.',
    search_placeholder: 'Buscar ideas de regalos, personas u ocasiones...',
    cta_eyebrow: 'Hazlo personal',
    cta_title: '¿Encontraste la idea perfecta?',
    cta_text: 'Convierte tu inspiración en un regalo personalizado creado especialmente para ellos.',
    affiliate_disclosure: 'Este artículo puede contener enlaces de afiliados. Si compras a través de ellos, podemos recibir una pequeña comisión sin ningún coste adicional para ti.',
    posts_per_page: 24,
    ga4_id: '',
    gsc_verification: '',
    gsc_property: '',
    bing_verification: '',
    head_scripts: '',
    body_scripts: '',
    robots_extra: '',
    noindex_site: false,
  }
};

// 2. Categories
const catDict = {
  gifts: {
    name: 'Guías de Regalos',
    eyebrow: 'Ideas para regalar',
    short_intro: 'Descubre las mejores recomendaciones e ideas de regalos para cada persona y ocasión especial.',
  },
  recipients: {
    name: 'Destinatarios',
    eyebrow: 'Por persona',
    short_intro: 'Encuentra ideas pensadas con cariño para cada persona importante en tu vida.',
  },
  occasions: {
    name: 'Ocasiones',
    eyebrow: 'Momentos especiales',
    short_intro: 'Celebra aniversarios, cumpleaños, bodas y fiestas con regalos memorables.',
  },
  interests: {
    name: 'Intereses',
    eyebrow: 'Por afición',
    short_intro: 'Ideas originales adaptadas a sus pasiones, aficiones y estilo de vida.',
  },
  blog: {
    name: 'Blog',
    eyebrow: 'Historias e inspiración',
    short_intro: 'Consejos de relaciones, frases emotivas y reflexiones para compartir.',
  },
  women: {
    name: 'Mujeres',
    eyebrow: 'Regalos para ella',
    short_intro: 'Detalles elegantes, originales y significativos para sorprender a las mujeres de tu vida.',
  },
  mom: {
    name: 'Mamá',
    eyebrow: 'Para mamá',
    short_intro: 'Ideas tiernas y personalizadas para agradecerle todo su amor incondicional.',
  },
  men: {
    name: 'Hombres',
    eyebrow: 'Regalos para él',
    short_intro: 'Ideas prácticas, con estilo y originales para hombres de todas las edades.',
  },
  'kids-teens': {
    name: 'Niños y Adolescentes',
    eyebrow: 'Para jóvenes',
    short_intro: 'Regalos divertidos, educativos y creativos que despiertan su sonrisa e imaginación.',
  },
  friends: {
    name: 'Amigos',
    eyebrow: 'Para amistades',
    short_intro: 'Detalles cómplices para celebrar la verdadera amistad y los buenos momentos.',
  },
  dad: {
    name: 'Papá',
    eyebrow: 'Para papá',
    short_intro: 'Regalos emotivos y funcionales pensados para homenajear al mejor padre.',
  },
  couples: {
    name: 'Parejas',
    eyebrow: 'Para dos',
    short_intro: 'Experiencias y detalles románticos para fortalecer el vínculo y crear recuerdos juntos.',
  },
  anyone: {
    name: 'Para Todos',
    eyebrow: 'Ideas universales',
    short_intro: 'Aciertos seguros y detalles encantadores perfectos para cualquier persona.',
  },
  wedding: {
    name: 'Bodas',
    eyebrow: 'Para novios',
    short_intro: 'Regalos inolvidables para acompañar y celebrar el gran día de la pareja.',
  },
  valentine: {
    name: 'San Valentín',
    eyebrow: 'Día del Amor',
    short_intro: 'Ideas románticas y apasionadas para celebrar el amor este 14 de febrero.',
  },
  housewarming: {
    name: 'Nueva Casa',
    eyebrow: 'Hogar dulce hogar',
    short_intro: 'Detalles acogedores y prácticos para celebrar la inauguración de un nuevo hogar.',
  },
  halloween: {
    name: 'Halloween',
    eyebrow: 'Noche mágica',
    short_intro: 'Ideas temáticas, divertidas y espeluznantes para celebrar la noche de brujas.',
  },
  graduation: {
    name: 'Graduación',
    eyebrow: 'Nuevo comienzo',
    short_intro: 'Homenajes al esfuerzo académico y regalos de felicitación para nuevos graduados.',
  },
  christmas: {
    name: 'Navidad',
    eyebrow: 'Magia navideña',
    short_intro: 'La mejor selección de regalos llenos de ilusión para estas fiestas de Navidad.',
  },
  birthday: {
    name: 'Cumpleaños',
    eyebrow: 'Feliz cumpleaños',
    short_intro: 'Regalos alegres, personales y festivos para celebrar un nuevo año de vida.',
  },
  anniversary: {
    name: 'Aniversario',
    eyebrow: 'Años de amor',
    short_intro: 'Símbolos de amor y recuerdos eternos para conmemorar cada año juntos.',
  },
  popular: {
    name: 'Populares',
    eyebrow: 'Los favoritos',
    short_intro: 'Los regalos más elegidos, recomendados y mejor valorados por nuestra comunidad.',
  },
  'outdoors-sports': {
    name: 'Deportes y Aire Libre',
    eyebrow: 'Vida activa',
    short_intro: 'Equipamiento e ideas pensadas para amantes de la naturaleza, el trekking y el deporte.',
  },
  animals: {
    name: 'Amantes de los Animales',
    eyebrow: 'Mundo animal',
    short_intro: 'Detalles adorables para dueños orgullosos de perros, gatos y otras mascotas.',
  },
  relationship: {
    name: 'Relaciones de Pareja',
    eyebrow: 'Consejos de amor',
    short_intro: 'Guías y reflexiones para nutrir la intimidad, la confianza y la complicidad.',
  },
  quotes: {
    name: 'Frases y Dedicatorias',
    eyebrow: 'Palabras que inspiran',
    short_intro: 'Las frases más hermosas y emotivas para acompañar tus tarjetas de regalo.',
  },
  holiday: {
    name: 'Fiestas y Tradiciones',
    eyebrow: 'Espíritu festivo',
    short_intro: 'Tradiciones familiares, ideas de celebración y momentos únicos en el año.',
  },
  family: {
    name: 'Familia',
    eyebrow: 'Unión familiar',
    short_intro: 'Ideas y planes pensados para unir a padres, hijos, abuelos y hermanos.',
  },
  events: {
    name: 'Eventos y Celebraciones',
    eyebrow: 'Grandes momentos',
    short_intro: 'Guías de organización, etiquetas y detalles para ser el anfitrión perfecto.',
  },
};

seed.categories = seed.categories.map((c) => {
  const trans = catDict[c.slug];
  if (trans) {
    return {
      ...c,
      name: trans.name,
      eyebrow: trans.eyebrow,
      short_intro: trans.short_intro,
      description_html: `<p>${trans.short_intro}</p>`,
      seo_title: `${trans.name} | Loveable Blog`,
      seo_description: trans.short_intro,
    };
  }
  return c;
});

// 3. Products
const productTrans = {
  '67412e9b-4647-4ce9-93a4-f9b28ee510e3': {
    name: 'Lámina Personalizada del Mapa Estelar',
    notes: 'Impresión de alta resolución con constelaciones exactas y marco opcional.',
  },
  '406356d4-a79f-449e-93f7-e3884d036c0f': {
    name: 'Collar Personalizado con Nombre en Oro de 18K',
    notes: 'Joyería fina resistente al agua con grabado artesanal.',
  },
  '98a06c36-6621-4626-b71c-478439ad7a11': {
    name: 'Billetera de Viaje en Cuero Auténtico con RFID',
    notes: 'Piel genuina con costuras reforzadas y protección antirobo.',
  },
  '31959592-457a-4621-8b1e-9c17cc8f5e07': {
    name: 'Manta de Felpa Ultrasuave con Fotos Familiares',
    notes: 'Microfibra cálida e hipoalergénica con impresión de alta durabilidad.',
  },
  'ad7184b6-020d-4c32-a43b-fb450b4442c6': {
    name: 'Kit de Plantas de Escritorio con Maceta de Cerámica',
    notes: 'Sistema autorregable fácil de mantener para hogar y oficina.',
  },
  'c5411f18-8249-4a7f-a604-26cf9e6fa3a2': {
    name: 'Mochila Ergonómica de Senderismo Ligera 25L',
    notes: 'Tejido impermeable ripstop y espalda transpirable.',
  },
};

seed.products = seed.products.map((p) => {
  const pt = productTrans[p.id];
  if (pt) {
    return {
      ...p,
      name: pt.name,
      notes: pt.notes,
    };
  }
  return p;
});

// 4. Authors
seed.authors = seed.authors.map((a) => ({
  ...a,
  job_title: 'Editora Principal y Especialista en Regalos',
  bio_html: '<p>Apasionada por descubrir regalos con alma que transforman ocasiones especiales en recuerdos duraderos. Con más de 8 años de experiencia en curación de productos y tendencias de diseño.</p>',
}));

// 5. Posts Translations
const postTrans = {
  'sample-anniversary-gifts': {
    title: '15 Regalos de Aniversario Inolvidables para Sorprender a tu Pareja',
    excerpt: 'Descubre ideas románticas, detalles personalizados y experiencias únicas para conmemorar vuestro aniversario de una forma especial.',
    intro_html: '<p>Celebrar un aniversario es la ocasión perfecta para recordar el camino recorrido juntos y renovar las ilusiones compartidas. Encontrar un detalle que capture la esencia de vuestra historia no tiene por qué ser complicado. Hemos seleccionado las mejores ideas para que sorprendas a esa persona tan especial con un regalo que recordará para siempre.</p>',
    content_html: '<h2>Cómo elegir el regalo de aniversario ideal</h2><p>El mejor regalo es aquel que demuestra que conoces y valoras los gustos de tu pareja. No importa el presupuesto: lo que realmente marca la diferencia es el toque personal y la dedicación que pones al elegirlo.</p><h3>Consejos para acertar:</h3><ul><li><strong>Apuesta por la personalización:</strong> Los objetos grabados con fechas o nombres tienen un valor emocional incalculable.</li><li><strong>Crea recuerdos:</strong> Combina un detalle físico con una experiencia íntima, como una cena romántica o una escapada.</li><li><strong>Escucha los detalles cotidianos:</strong> A menudo tu pareja menciona cosas que le hacen ilusión semanas antes de la fecha.</li></ul>',
    seo_title: '15 Regalos de Aniversario Inolvidables | Loveable Blog',
    seo_description: 'Descubre las mejores ideas de regalos de aniversario para sorprender a tu pareja. Detalles personalizados y románticos para una fecha única.',
    items: [
      {
        heading: 'Lámina Personalizada del Mapa Estelar',
        image: 'https://storage.googleapis.com/loveable.appspot.com/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
        url: 'https://loveable.us/products/star-map',
        button_label: 'Ver en Tienda',
        price: '49,00 €',
        merchant: 'Loveable Store',
        description_html: '<p>Una representación visual exacta de las constelaciones en la fecha y el lugar donde comenzó vuestra historia de amor. Un recuerdo decorativo cargado de emoción.</p>',
        pros: ['Fecha y coordenadas 100% exactas', 'Impresión en papel de arte premium', 'Disponible con elegante marco de madera'],
      },
      {
        heading: 'Collar Personalizado con Nombre en Oro de 18K',
        image: 'https://storage.googleapis.com/loveable.appspot.com/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
        url: 'https://loveable.us/products/necklace',
        button_label: 'Ver en Tienda',
        price: '79,00 €',
        merchant: 'Loveable Store',
        description_html: '<p>Elegancia atemporal para llevar siempre cerca del corazón. Confeccionado en plata de ley con baño en oro de 18 quilates de alta durabilidad.</p>',
        pros: ['Grabado a mano artesanal', 'No se oscurece con el agua', 'Presentación en estuche de lujo para regalo'],
      },
      {
        heading: 'Billetera de Cuero Grabada con Mensaje Secreto',
        image: 'https://storage.googleapis.com/loveable.appspot.com/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
        url: 'https://loveable.us/products/wallet',
        button_label: 'Ver en Tienda',
        price: '45,00 €',
        merchant: 'Loveable Store',
        description_html: '<p>Billetera fina de piel auténtica que incluye un mensaje secreto grabado con láser en su interior. Práctica, resistente y muy emotiva.</p>',
        pros: ['Piel auténtica de grano superior', 'Protección de tarjetas RFID', 'Grabado discreto y duradero'],
      },
    ],
    faqs: [
      {
        q: '¿Qué regalo de aniversario es el más tradicional según los años?',
        a: 'El primer año suele celebrarse con papel, el quinto con madera, el décimo con estaño o aluminio, el 25 con plata y el 50 con oro.',
      },
      {
        q: '¿Con cuánta antelación conviene encargar un regalo personalizado?',
        a: 'Recomendamos realizar el pedido al menos 7 a 10 días antes para garantizar la producción artesanal y el envío a tiempo.',
      },
    ],
  },
  'sample-gifts-for-mom': {
    title: '12 Regalos Emotivos para Mamá que le Llegarán al Corazón',
    excerpt: 'Desde joyas personalizadas hasta detalles para el descanso y el hogar, encuentra el detalle perfecto para agradecerle todo lo que hace.',
    intro_html: '<p>Mamá se merece lo mejor cada día del año. Si buscas un detalle especial para su cumpleaños, el Día de la Madre o simplemente para sacarle una sonrisa sincera, aquí tienes nuestra cuidada selección de regalos pensados para ella.</p>',
    content_html: '<h2>El arte de sorprender a mamá</h2><p>A las madres les encantan los regalos que evocan la unión familiar y el cariño sincero. Un detalle personalizado con los nombres de sus hijos o una fecha memorable siempre será un acierto seguro.</p>',
    seo_title: '12 Regalos Emotivos para Mamá | Loveable Blog',
    seo_description: 'Encuentra el regalo perfecto para mamá: joyas personalizadas, mantas fotográficas y recuerdos inolvidables.',
  },
  'sample-gifts-for-dad': {
    title: '10 Regalos Prácticos y Originales para Papá que Realmente Usará',
    excerpt: 'Se acabaron las corbatas aburridas. Sorprende a papá con herramientas con estilo, accesorios de cuero y regalos útiles.',
    intro_html: '<p>Encontrar un regalo para papá suele parecer difícil, pero la clave está en combinar utilidad con un toque personalizado que le recuerde a sus hijos en el día a día.</p>',
    content_html: '<h2>Regalos que unen funcionalidad y emoción</h2><p>Desde organizadores para su escritorio hasta accesorios de viaje resistentes, estas ideas están pensadas para papás activos y hogareños por igual.</p>',
    seo_title: '10 Regalos Prácticos para Papá | Loveable Blog',
    seo_description: 'Descubre los mejores regalos para papá: accesorios de cuero, detalles grabados y regalos útiles.',
  },
  'sample-christmas-gifts': {
    title: 'Guía de Regalos de Navidad: Ideas Mágicas para Toda la Familia',
    excerpt: 'Llena de ilusión el árbol de Navidad con regalos únicos, originales y adaptados a todos los presupuestos.',
    intro_html: '<p>La Navidad es tiempo de compartir y celebrar. En esta guía completa te ayudamos a tachar toda tu lista de compras navideñas sin estrés y con la garantía de acertar.</p>',
    content_html: '<h2>Consejos para compras navideñas inteligentes</h2><p>Planificar tus regalos con tiempo te permite encontrar piezas personalizadas exclusivas y evitar las prisas de última hora.</p>',
    seo_title: 'Guía de Regalos de Navidad | Loveable Blog',
    seo_description: 'Ideas mágicas de regalos de Navidad para familiares, amigos y parejas. Acierta estas fiestas.',
  },
  'sample-birthday-gifts': {
    title: 'Regalos de Cumpleaños Originales: Guía Completa de Ideas',
    excerpt: 'Celebra un nuevo año de vida con regalos llenos de energía positiva, diversión y significado personal.',
    intro_html: '<p>Cada cumpleaños es una celebración única. Descubre ideas creativas que van mucho más allá de lo convencional para hacer sentir especial al cumpleañero.</p>',
    content_html: '<h2>Cómo elegir el regalo de cumpleaños perfecto</h2><p>Considera sus hobbies actuales, sus planes para el próximo año y el tipo de detalles que le hacen sonreír.</p>',
    seo_title: 'Regalos de Cumpleaños Originales | Loveable Blog',
    seo_description: 'Guía de ideas y sugerencias para acertar con regalos de cumpleaños inolvidables.',
  },
  'sample-outdoor-gifts': {
    title: 'Los Mejores Regalos para Amantes de la Naturaleza y el Deporte',
    excerpt: 'Equipamiento ligero, accesorios duraderos y tecnología útil para quienes disfrutan de las aventuras al aire libre.',
    intro_html: '<p>Para quienes disfrutan del senderismo, el camping o las escapadas a la montaña, los mejores regalos son aquellos que combinan ligereza, resistencia y practicidad en la naturaleza.</p>',
    content_html: '<h2>Qué busca un apasionado del aire libre</h2><p>La durabilidad y el peso ligero son fundamentales en cualquier equipamiento exterior.</p>',
    seo_title: 'Regalos para Amantes del Aire Libre | Loveable Blog',
    seo_description: 'Equipamiento y accesorios prácticos para senderistas y aventureros.',
  },
  'sample-wedding-gifts': {
    title: 'Regalos de Boda Memorables para Sorprender a los Novios',
    excerpt: 'Detalles que van más allá de la lista de bodas tradicional: recuerdos personalizados para su nueva vida juntos.',
    intro_html: '<p>Un enlace matrimonial es uno de los momentos más hermosos de la vida. Acompaña a la pareja en su gran día con un regalo que conserve viva la magia de su boda durante décadas.</p>',
    content_html: '<h2>Regalos que perduran en el tiempo</h2><p>Los detalles decorativos para el hogar con sus nombres y la fecha de la boda son los favoritos de los recién casados.</p>',
    seo_title: 'Regalos de Boda Memorables | Loveable Blog',
    seo_description: 'Ideas de regalos de boda emotivos y personalizados para celebrar el amor de los novios.',
  },
  'sample-pet-lover-gifts': {
    title: 'Regalos Encantadores para Amantes de los Perros y Gatos',
    excerpt: 'Para quienes consideran a sus mascotas como un miembro más de la familia: ideas tiernas y divertidas.',
    intro_html: '<p>Los dueños de mascotas adoran cualquier detalle que rinda homenaje a sus peludos compañeros. Aquí tienes las ideas más entrañables para conquistar su corazón.</p>',
    content_html: '<h2>Homenaje a los mejores amigos de cuatro patas</h2><p>Retratos ilustrados, mantas personalizadas y accesorios prácticos para el día a día.</p>',
    seo_title: 'Regalos para Amantes de los Animales | Loveable Blog',
    seo_description: 'Detalles personalizados y tiernos para dueños orgullosos de mascotas.',
  },
  'sample-graduation-gifts': {
    title: 'Regalos de Graduación para Celebrar un Gran Logro Académico',
    excerpt: 'Felicita a los nuevos graduados con detalles que impulsarán su nueva etapa profesional y personal.',
    intro_html: '<p>Graduarse supone el cierre de una etapa de esfuerzo y el inicio de emocionantes oportunidades. Descubre cómo felicitar a tu graduado favorito con clase y orgullo.</p>',
    content_html: '<h2>Regalos para el salto al mundo profesional</h2><p>Artículos elegantes de oficina, maletines de cuero y joyas conmemorativas.</p>',
    seo_title: 'Regalos de Graduación | Loveable Blog',
    seo_description: 'Celebra su graduación con detalles inspiradores y útiles para su futuro.',
  },
  'sample-gifts-for-her': {
    title: 'Guía de Regalos para Ella: Detalles Especiales que Enamoran',
    excerpt: 'Sorprende a tu novia, esposa, amiga o hermana con una cuidada selección de detalles elegantes y significativos.',
    intro_html: '<p>Buscar un detalle para ella es un momento para demostrar cuánto te importan sus gustos y su bienestar. Hemos reunido las mejores sugerencias para inspirarte.</p>',
    content_html: '<h2>Detalles que marcan la diferencia</h2><p>La combinación de diseño refinado y significado personal crea recuerdos imposibles de olvidar.</p>',
    seo_title: 'Guía de Regalos para Ella | Loveable Blog',
    seo_description: 'Ideas elegantes y románticas para regalar a mujeres especiales en tu vida.',
  },
  'sample-friend-gifts': {
    title: 'Regalos para Amigos: Ideas Divertidas para Celebrar la Amistad',
    excerpt: 'Detalles cómplices, regalos personalizados y planes geniales para agradecer la presencia de tus mejores amigos.',
    intro_html: '<p>Los buenos amigos hacen la vida mucho más bonita. Sorprende a ese amigo o amiga incondicional con un regalo que celebre vuestras risas y aventuras.</p>',
    content_html: '<h2>Celebrar la complicidad</h2><p>Regalos con guiños a anécdotas compartidas y momentos inolvidables.</p>',
    seo_title: 'Regalos para Amigos | Loveable Blog',
    seo_description: 'Ideas divertidas y significativas para regalar a tus mejores amigos.',
  },
  'sample-housewarming-gifts': {
    title: 'Regalos para una Nueva Casa: Ideas Cálidas y Prácticas',
    excerpt: 'Felicita a tus anfitriones con detalles decorativos, menaje de calidad y plantas para su nuevo hogar.',
    intro_html: '<p>Mudarse a un nuevo hogar marca el inicio de un nuevo capítulo. Descubre qué regalar en una inauguración de casa para sumar calidez y estilo al nuevo espacio.</p>',
    content_html: '<h2>Hacer de una casa un verdadero hogar</h2><p>Velas aromáticas, tablas de madera gourmet y textiles de calidad son apuestas seguras.</p>',
    seo_title: 'Regalos para Inauguración de Casa | Loveable Blog',
    seo_description: 'Detalles elegantes y prácticos para regalar a quien estrena hogar.',
  },
  'sample-date-night-ideas': {
    title: '10 Ideas Creativas para Citas Románticas que Enamorarán',
    excerpt: 'Rompe la rutina con planes originales en casa o al aire libre diseñados para reconectar en pareja.',
    intro_html: '<p>A veces caemos en la costumbre de la misma cena de siempre. Te proponemos 10 planes diferentes, románticos y muy divertidos para disfrutar de tiempo de calidad juntos.</p>',
    content_html: '<h2>Reavivar la chispa con planes diferentes</h2><p>Dedicar tiempo exclusivo a la pareja es esencial para una relación sólida y feliz. No necesitas gastar mucho dinero: solo ganas de compartir.</p><h3>3 planes destacados:</h3><ol><li><strong>Noche de cocina temática:</strong> Elegid un país al azar y preparad juntos la cena con música de fondo.</li><li><strong>Picnic bajo las estrellas:</strong> Una manta, velas y vuestras conversaciones favoritas.</li><li><strong>Cata a ciegas en casa:</strong> Vinos, quesos o chocolates para adivinar ingredientes.</li></ol>',
    seo_title: '10 Ideas para Citas Románticas | Loveable Blog',
    seo_description: 'Planes creativos y románticos para salir de la rutina y disfrutar en pareja.',
  },
  'sample-birthday-wishes': {
    title: '50 Frases de Cumpleaños Emotivas para Escribir en una Tarjeta',
    excerpt: 'Encuentra las palabras perfectas para felicitar a amigos, familiares y a tu pareja en su día especial.',
    intro_html: '<p>Acompañar un buen regalo de unas palabras sinceras multiplica su valor emocional. Aquí tienes medio centenar de dedicatorias para inspirarte.</p>',
    content_html: '<h2>El poder de una felicitación sentida</h2><p>Dedicar unos minutos a escribir a mano tus mejores deseos transforma cualquier tarjeta en un tesoro que guardarán con cariño.</p>',
    seo_title: '50 Frases de Cumpleaños Emotivas | Loveable Blog',
    seo_description: 'Frases hermosas y dedicatorias originales para tarjetas de cumpleaños.',
  },
  'sample-holiday-traditions': {
    title: 'Tradiciones Festivas para Crear Recuerdos Inolvidables en Familia',
    excerpt: 'Costumbres cálidas que fortalecen los lazos y convierten cada época festiva en un momento mágico.',
    intro_html: '<p>Las tradiciones son el hilo invisible que une a las generaciones. Te compartimos ideas sencillas para crear rituales entrañables en familia.</p>',
    content_html: '<h2>El valor de compartir momentos</h2><p>Desde calendarios de adviento caseros hasta cenas temáticas de temporada, estas ideas enriquecerán vuestras fiestas.</p>',
    seo_title: 'Tradiciones Festivas en Familia | Loveable Blog',
    seo_description: 'Ideas de tradiciones entrañables para disfrutar y celebrar en familia.',
  },
  'sample-family-activities': {
    title: 'Actividades Familiares Divertidas para Disfrutar en Casa',
    excerpt: 'Juegos, talleres creativos y planes caseros para pasar tardes inolvidables con niños y adultos.',
    intro_html: '<p>Quedarse en casa un fin de semana lluvioso puede ser la mejor aventura si cuentas con las ideas adecuadas para entretener a toda la familia.</p>',
    content_html: '<h2>Diversión para todas las edades</h2><p>Juegos de mesa cooperativos, noches de cine temático y repostería en equipo.</p>',
    seo_title: 'Actividades Familiares en Casa | Loveable Blog',
    seo_description: 'Planes caseros y juegos creativos para divertirse en familia.',
  },
  'sample-party-planning': {
    title: 'Guía Definitiva para Organizar una Fiesta Sorpresa Inolvidable',
    excerpt: 'Paso a paso para coordinar invitados, decoración y regalos sin que el homenajeado sospeche nada.',
    intro_html: '<p>Planificar una fiesta sorpresa exitosa requiere discreción, buena organización y mucho entusiasmo. Te contamos todos los secretos para lograrlo.</p>',
    content_html: '<h2>El secreto del éxito: la planificación</h2><p>Crea un grupo de coordinación discreto, asigna tareas y prepara un plan de distracción creíble para el momento clave.</p>',
    seo_title: 'Cómo Organizar una Fiesta Sorpresa | Loveable Blog',
    seo_description: 'Consejos y checklist completo para planificar una fiesta sorpresa perfecta.',
  },
  'about-us': {
    title: 'Sobre Nosotros',
    excerpt: 'Conoce la misión de Loveable Blog: inspirar momentos significativos a través de regalos personalizados.',
    intro_html: '<p>En Loveable creemos firmemente que un regalo es mucho más que un objeto: es un mensaje de afecto, un recuerdo tangible y una muestra sincera de gratitud.</p>',
    content_html: '<p>En <strong>Loveable Blog</strong> nos dedicamos a explorar, seleccionar y crear las mejores sugerencias de regalos para cada persona y ocasión especial. Nuestro equipo de redactores y especialistas en diseño analiza tendencias, calidad de materiales y opiniones para que siempre encuentres la idea perfecta.</p><h2>Nuestra Filosofía</h2><p>Creemos en el poder de los detalles personalizados. Las fechas grabadas, los mapas estelares y las piezas confeccionadas con cariño tienen la capacidad única de detener el tiempo y celebrar los lazos humanos que verdaderamente importan.</p>',
    seo_title: 'Sobre Nosotros | Loveable Blog',
    seo_description: 'Conoce la misión y el equipo detrás de Loveable Blog, tu guía de regalos personalizados.',
  },
};

seed.posts = seed.posts.map((p) => {
  const pt = postTrans[p.slug];
  if (pt) {
    return {
      ...p,
      title: pt.title,
      excerpt: pt.excerpt,
      intro_html: pt.intro_html,
      content_html: pt.content_html,
      seo_title: pt.seo_title,
      seo_description: pt.seo_description,
      ...(pt.items ? { items: pt.items } : {}),
      ...(pt.faqs ? { faqs: pt.faqs } : {}),
    };
  }
  return p;
});

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2), 'utf8');

console.log('Successfully translated seed.json and db.json to Spanish!');
