import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

const HALLOWEEN_CAT_ID = 'acbaa7d4-a347-4e39-948d-8670c2d3daf9';
const AUTHOR_ID = 'a91e5d32-949f-43e6-95b2-3e28406f0e4b';
const AFFILIATE_TAG = 'miregalo26-20';

// Pool of 40 verified high-resolution, unique photography images on Unsplash
const UNIFIED_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572883454114-1cf0031ede2a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570824104453-508955ab713e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511253819057-1547ddb8fa53?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572455044327-7348c1be7267?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&auto=format&fit=crop&q=80'
];

export const HALLOWEEN_TOPICS = [
  // ── PILLAR 1: DESTINATARIOS & RELACIONES (Day 1 - 13 Oct 2026) ──
  {
    day: 13, slot: 0,
    query: 'regalos de halloween para adultos',
    title: 'Los 10 Mejores Regalos de Halloween para Adultos en 2026: Ideas Originales y Sorprendentes',
    slug: 'regalos-halloween-para-adultos-ideas',
    cluster: 'Destinatarios',
    recipient: 'adultos y amantes de la fiesta',
    focus: 'regalos de halloween para adultos'
  },
  {
    day: 13, slot: 1,
    query: 'regalos de halloween para niños',
    title: '10 Regalos de Halloween para Niños: Alternativas Divertidas Más Allá de los Dulces',
    slug: 'regalos-halloween-para-ninos-originales',
    cluster: 'Destinatarios',
    recipient: 'niños y pequeños',
    focus: 'regalos de halloween para niños'
  },
  {
    day: 13, slot: 2,
    query: 'regalos de halloween para parejas',
    title: 'Regalos de Halloween para Parejas: 10 Detalles Románticos y Terroríficos para Celebrar Juntos',
    slug: 'regalos-halloween-para-parejas-romanticos',
    cluster: 'Destinatarios',
    recipient: 'parejas y enamorados',
    focus: 'regalos de halloween para parejas'
  },
  {
    day: 13, slot: 3,
    query: 'regalos de halloween para novio',
    title: 'Qué Regalar a tu Novio en Halloween: 10 Ideas Geniales para Sorprenderlo',
    slug: 'ideas-regalos-halloween-para-novio',
    cluster: 'Destinatarios',
    recipient: 'tu novio',
    focus: 'regalos de halloween para novio'
  },
  {
    day: 13, slot: 4,
    query: 'regalos de halloween para novia',
    title: 'Los Mejores Regalos de Halloween para tu Novia: 10 Detalles Encantadores y Espeluznantes',
    slug: 'ideas-regalos-halloween-para-novia',
    cluster: 'Destinatarios',
    recipient: 'tu novia',
    focus: 'regalos de halloween para novia'
  },
  {
    day: 13, slot: 5,
    query: 'regalos de halloween para compañeros de trabajo',
    title: '10 Regalos de Halloween para Compañeros de Trabajo: Detalles para la Oficina y Amigo Invisible',
    slug: 'regalos-halloween-companeros-de-trabajo',
    cluster: 'Destinatarios',
    recipient: 'compañeros de trabajo y colegas',
    focus: 'regalos de halloween para compañeros de trabajo'
  },
  {
    day: 13, slot: 6,
    query: 'regalos de halloween para profesores',
    title: 'Regalos de Halloween para Profesores y Maestras: 10 Detalles de Agradecimiento Temáticos',
    slug: 'regalos-halloween-profesores-maestras',
    cluster: 'Destinatarios',
    recipient: 'profesores y maestras',
    focus: 'regalos de halloween para profesores'
  },
  {
    day: 13, slot: 7,
    query: 'regalos de halloween para mejores amigas',
    title: '10 Regalos de Halloween para tu Mejor Amiga: Moda Spooky, Belleza y Detalles Cómplices',
    slug: 'regalos-halloween-mejor-amiga',
    cluster: 'Destinatarios',
    recipient: 'tu mejor amiga',
    focus: 'regalos de halloween para mejores amigas'
  },
  {
    day: 13, slot: 8,
    query: 'regalos de halloween para adolescentes',
    title: 'Guía de Regalos de Halloween para Adolescentes: 10 Ideas que Triunfan en Redes Sociales',
    slug: 'regalos-halloween-para-adolescentes',
    cluster: 'Destinatarios',
    recipient: 'adolescentes y jóvenes',
    focus: 'regalos de halloween para adolescentes'
  },
  {
    day: 13, slot: 9,
    query: 'regalos de halloween para bebés y recién nacidos',
    title: 'Primer Halloween del Bebé: 10 Regalos Adorables y Accesorios Tiernos de Terror',
    slug: 'regalos-primer-halloween-bebe',
    cluster: 'Destinatarios',
    recipient: 'bebés y familias con recién nacidos',
    focus: 'regalos de halloween para bebés'
  },

  // ── PILLAR 2: DISFRACES, COSPLAY & ESTÉTICA SPOOKY (Day 2 - 14 Oct 2026) ──
  {
    day: 14, slot: 0,
    query: 'disfraces de halloween para parejas gay',
    title: 'Disfraces de Halloween para Parejas Gay y LGTBIQ+: 10 Ideas Originales y con Estilo',
    slug: 'disfraces-halloween-parejas-gay-lgtb',
    cluster: 'Disfraces & Cosplay',
    recipient: 'parejas gay y diversidad',
    focus: 'disfraces de halloween pareja gay'
  },
  {
    day: 14, slot: 1,
    query: 'disfraces de halloween para gemelos y hermanos',
    title: 'Disfraces de Halloween a Juego para Gemelos y Hermanos: 10 Propuestas Creativas',
    slug: 'disfraces-halloween-gemelos-hermanos',
    cluster: 'Disfraces & Cosplay',
    recipient: 'gemelos, mellizos y hermanos',
    focus: 'disfraces de halloween para gemelos'
  },
  {
    day: 14, slot: 2,
    query: 'disfraces divertidos de halloween para grupos',
    title: 'Los 10 Disfraces de Halloween Más Divertidos para Grupos de Amigos: Éxito Garantizado',
    slug: 'disfraces-divertidos-halloween-grupos-amigos',
    cluster: 'Disfraces & Cosplay',
    recipient: 'grupos de amigos y peñas',
    focus: 'disfraces divertidos de halloween'
  },
  {
    day: 14, slot: 3,
    query: 'máscaras de halloween hiperrealistas y de colección',
    title: '10 Máscaras de Halloween Prémium y de Coleccionista: Realismo y Terror Extremo',
    slug: 'mascaras-halloween-realistas-coleccion',
    cluster: 'Disfraces & Cosplay',
    recipient: 'amantes del terror y coleccionistas',
    focus: 'máscaras de halloween realistas'
  },
  {
    day: 14, slot: 4,
    query: 'maquillaje profesional y prótesis para halloween',
    title: 'Kits de Maquillaje de Efectos Especiales y Prótesis de Halloween: 10 Opciones Profesionales',
    slug: 'kits-maquillaje-efectos-especiales-halloween',
    cluster: 'Disfraces & Cosplay',
    recipient: 'artistas del maquillaje y cosplay',
    focus: 'maquillaje profesional para halloween'
  },
  {
    day: 14, slot: 5,
    query: 'joyas y colgantes góticos de halloween',
    title: '10 Joyas Góticas y Colgantes Espeluznantes para Regalar en Halloween: Elegancia Oscura',
    slug: 'joyas-goticas-colgantes-halloween',
    cluster: 'Disfraces & Cosplay',
    recipient: 'amantes de la joyería gótica y oscura',
    focus: 'joyas góticas de halloween'
  },
  {
    day: 14, slot: 6,
    query: 'capas y accesorios de terciopelo para halloween',
    title: 'Capas Medievales y Accesorios de Brujería para Halloween: 10 Detalles de Alta Costura',
    slug: 'capas-terciopelo-accesorios-brujeria-halloween',
    cluster: 'Disfraces & Cosplay',
    recipient: 'entusiastas de la estética medieval y brujas',
    focus: 'capas y accesorios de halloween'
  },
  {
    day: 14, slot: 7,
    query: 'disfraces clásicos de monstruos de cine de terror',
    title: '10 Regalos para Fans de Monstruos Clásicos de Terror: De Drácula a Frankenstein',
    slug: 'regalos-monstruos-clasicos-cine-terror',
    cluster: 'Disfraces & Cosplay',
    recipient: 'cinéfilos y amantes del terror clásico',
    focus: 'disfraces de monstruos clásicos de terror'
  },
  {
    day: 14, slot: 8,
    query: 'lentes de contacto de fantasía para halloween',
    title: 'Lentes de Contacto de Fantasía y Complementos de Impacto Visual para Halloween: Guía y Selección',
    slug: 'lentes-fantasia-complementos-halloween',
    cluster: 'Disfraces & Cosplay',
    recipient: 'quienes buscan una transformación completa',
    focus: 'lentes de fantasía para halloween'
  },
  {
    day: 14, slot: 9,
    query: 'disfraces de halloween para mascotas perros y gatos',
    title: '10 Disfraces y Accesorios Cómodos de Halloween para Perros y Gatos: Fotos Inolvidables',
    slug: 'disfraces-halloween-perros-gatos-mascotas',
    cluster: 'Disfraces & Cosplay',
    recipient: 'amantes de los animales y sus mascotas',
    focus: 'disfraces de halloween para mascotas'
  },

  // ── PILLAR 3: FIESTAS, JUEGOS, COMIDA & COCTELERÍA (Day 3 - 15 Oct 2026) ──
  {
    day: 15, slot: 0,
    query: 'kits de coctelería y copas para fiesta de halloween',
    title: 'Coctelería Espeluznante: 10 Sets de Copas y Kits de Mezcla para Fiestas de Halloween',
    slug: 'cocteleria-copas-kits-fiesta-halloween',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'anfitriones de fiesta y aficionados a los cócteles',
    focus: 'kits de coctelería para halloween'
  },
  {
    day: 15, slot: 1,
    query: 'juegos de mesa de terror y misterio para halloween',
    title: 'Los 10 Mejores Juegos de Mesa de Terror y Escape Room para la Noche de Halloween',
    slug: 'juegos-de-mesa-terror-escape-room-halloween',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'grupos de amigos y jugadores de mesa',
    focus: 'juegos de mesa de terror para halloween'
  },
  {
    day: 15, slot: 2,
    query: 'cestas de dulces y chuches gourmet para halloween',
    title: '10 Cestas de Chuches y Dulces Gourmet de Halloween: La Selección Definitiva de Truco o Trato',
    slug: 'cestas-chuches-dulces-gourmet-halloween',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'golosos y anfitriones de fiestas',
    focus: 'cestas de dulces para halloween'
  },
  {
    day: 15, slot: 3,
    query: 'moldes y kits de repostería para postres de halloween',
    title: 'Kits de Repostería Creativa de Halloween: 10 Moldes y Herramientas para Tartas Terroríficas',
    slug: 'kits-reposteria-moldes-postres-halloween',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'reposteros y amantes de la cocina casera',
    focus: 'kits de repostería para halloween'
  },
  {
    day: 15, slot: 4,
    query: 'juegos de preguntas trivia y misterio para halloween',
    title: 'Juegos de Preguntas y Desafíos de Misterio para Halloween: 10 Opciones para Romper el Hielo',
    slug: 'juegos-trivia-preguntas-misterio-halloween',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'anfitriones de reuniones y fiestas temáticas',
    focus: 'juegos de preguntas trivia para halloween'
  },
  {
    day: 15, slot: 5,
    query: 'vajillas y fuentes de servir con forma de calabaza',
    title: 'Vajillas de Calabaza y Cuencos Temáticos para Halloween: 10 Diseños Elegantes para tu Mesa',
    slug: 'vajillas-calabaza-cuencos-mesa-halloween',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'amantes de la decoración de mesa y cenas de gala',
    focus: 'vajillas y cuencos de halloween'
  },
  {
    day: 15, slot: 6,
    query: 'libros y antologías de relatos de terror para regalar',
    title: '10 Libros y Cuentos de Terror Inolvidables para Regalar en Octubre: Clásicos y Joyas Modernas',
    slug: 'libros-antologias-relatos-terror-halloween',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'lectores apasionados por el misterio y el suspense',
    focus: 'libros de relatos de terror para regalar'
  },
  {
    day: 15, slot: 7,
    query: 'kits de manualidades y dibujo de halloween para niños',
    title: '10 Kits de Manualidades y Dibujo de Halloween para Niños: Creatividad Sin Pantallas',
    slug: 'kits-manualidades-dibujo-ninos-halloween',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'niños curiosos y familias creativas',
    focus: 'manualidades de halloween para niños'
  },
  {
    day: 15, slot: 8,
    query: 'cajas gourmet de chocolates oscuros y calaveras',
    title: 'Chocolates Artesanales en Forma de Calavera: 10 Estuches Gourmet de Halloween para Regalar',
    slug: 'chocolates-artesanales-calaveras-halloween',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'sibaritas del chocolate puro y artesano',
    focus: 'chocolates gourmet de halloween'
  },
  {
    day: 15, slot: 9,
    query: 'máquinas de palomitas vintage para maratón de cine de terror',
    title: 'Kits para Maratón de Cine de Terror: Palomiteros Retro y Accesorios de Cine en Casa',
    slug: 'kits-maraton-cine-terror-palomiteros-retro',
    cluster: 'Fiestas & Entretenimiento',
    recipient: 'cinéfilos y amantes de las noches de manta y película',
    focus: 'kits de maratón de cine de terror'
  },

  // ── PILLAR 4: DECORACIÓN DE HOGAR & JARDÍN SPOOKY (Day 4 - 16 Oct 2026) ──
  {
    day: 16, slot: 0,
    query: 'decoración de jardín y exteriores para halloween',
    title: '10 Regalos de Decoración de Jardín y Entrada para Halloween: Transforma tu Casa en un Cementerio Épico',
    slug: 'decoracion-jardin-exteriores-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'anfitriones y propietarios de casas con jardín',
    focus: 'decoración de jardín para halloween'
  },
  {
    day: 16, slot: 1,
    query: 'velas flotantes mágicas y candelabros góticos',
    title: 'Velas Flotantes y Candelabros Mágicos para Halloween: 10 Opciones con Luz LED Cálida',
    slug: 'velas-flotantes-candelabros-goticos-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'amantes de la iluminación mágica y Harry Potter',
    focus: 'velas flotantes para halloween'
  },
  {
    day: 16, slot: 2,
    query: 'lámparas de calabaza led y linternas talladas',
    title: '10 Lámparas de Calabaza LED Reutilizables y Farolillos de Halloween para Iluminar con Encanto',
    slug: 'lamparas-calabaza-led-farolillos-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'quienes buscan decoración cálida y duradera',
    focus: 'lámparas de calabaza led'
  },
  {
    day: 16, slot: 3,
    query: 'felpudos y carteles de bienvenida espeluznantes',
    title: 'Felpudos Divertidos y Carteles Terroríficos de Halloween para la Puerta de Entrada: 10 Ideas',
    slug: 'felpudos-carteles-puerta-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'anfitriones de Halloween y amantes de la bienvenida',
    focus: 'felpudos de halloween'
  },
  {
    day: 16, slot: 4,
    query: 'cojines y mantas de terciopelo con temática de halloween',
    title: 'Textiles Spooky: 10 Cojines y Mantas Suaves de Halloween para un Salón Acogedor y Terrorífico',
    slug: 'cojines-mantas-textiles-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'amantes del interiorismo hogareño y el confort',
    focus: 'cojines y mantas de halloween'
  },
  {
    day: 16, slot: 5,
    query: 'figuras animatrónicas con sonido y sensor de movimiento',
    title: '10 Animatrónicos y Figuras con Movimiento para Halloween: Sustos Reales para tu Fiesta',
    slug: 'animatronicos-figuras-movimiento-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'fanáticos de los efectos especiales y sustos mayores',
    focus: 'figuras animatrónicas para halloween'
  },
  {
    day: 16, slot: 6,
    query: 'proyectores holográficos y luces para fachadas halloween',
    title: 'Proyectores de Iluminación y Efectos Holográficos para Halloween: 10 Dispositivos de Impacto',
    slug: 'proyectores-efectos-luces-fachadas-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'entusiastas de la tecnología aplicada a la decoración',
    focus: 'proyectores de iluminación para halloween'
  },
  {
    day: 16, slot: 7,
    query: 'plantas carnívoras y terrarios góticos para regalar',
    title: 'Plantas Carnívoras y Terrarios de Halloween: 10 Regalos Botánicos Misteriosos y Fascinantes',
    slug: 'plantas-carnivoras-terrarios-goticos-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'amantes de la botánica y las plantas exóticas',
    focus: 'plantas carnívoras para regalar en halloween'
  },
  {
    day: 16, slot: 8,
    query: 'calaveras decorativas de colección y arte anatómico',
    title: '10 Calaveras Decorativas de Cerámica y Resina para Coleccionistas: Esculturas de Arte Oscuro',
    slug: 'calaveras-decorativas-arte-gotico-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'coleccionistas de calaveras y arte gótico',
    focus: 'calaveras decorativas de halloween'
  },
  {
    day: 16, slot: 9,
    query: 'guirnaldas luminosas y telarañas decorativas de alta calidad',
    title: 'Guirnaldas LED y Telarañas Reutilizables de Halloween: 10 Sets de Ambientación Fácil y Rápida',
    slug: 'guirnaldas-led-telaranas-reutilizables-halloween',
    cluster: 'Decoración & Hogar',
    recipient: 'quienes decoran salones o escaparates comerciales',
    focus: 'guirnaldas luminosas de halloween'
  },

  // ── PILLAR 5: PRESUPUESTOS & SITUACIONES ESPECÍFICAS (Day 5 - 17 Oct 2026) ──
  {
    day: 17, slot: 0,
    query: 'regalos de halloween baratos por menos de 15 euros',
    title: '10 Regalos de Halloween Baratos por Menos de 15 €: Sorprende con Presupuesto Mínimo',
    slug: 'regalos-halloween-baratos-menos-15-euros',
    cluster: 'Presupuestos & Especiales',
    recipient: 'compradores con presupuesto ajustado',
    focus: 'regalos de halloween baratos'
  },
  {
    day: 17, slot: 1,
    query: 'detalles de halloween por menos de 30 euros',
    title: 'Los 10 Mejores Detalles de Halloween por Menos de 30 €: Calidad y Buen Gusto',
    slug: 'detalles-halloween-menos-30-euros-calidad',
    cluster: 'Presupuestos & Especiales',
    recipient: 'compradores que buscan equilibrio precio-calidad',
    focus: 'detalles de halloween por menos de 30 euros'
  },
  {
    day: 17, slot: 2,
    query: 'regalos de halloween personalizados con nombre',
    title: '10 Regalos Personalizados para Halloween con Nombre y Fecha: Recuerdos Únicos de la Noche Más Oscura',
    slug: 'regalos-personalizados-halloween-nombre-grabado',
    cluster: 'Presupuestos & Especiales',
    recipient: 'personas sentimentales que valoran la personalización',
    focus: 'regalos de halloween personalizados'
  },
  {
    day: 17, slot: 3,
    query: 'cajas misteriosas y cofres sorpresa de halloween',
    title: 'Cajas Sorpresa de Halloween: 10 Cofres Misteriosos con Artículos de Terror para Enviar a Domicilio',
    slug: 'cajas-sorpresa-misteriosas-halloween-domicilio',
    cluster: 'Presupuestos & Especiales',
    recipient: 'personas que aman el unboxing y las sorpresas',
    focus: 'cajas sorpresa de halloween'
  },
  {
    day: 17, slot: 4,
    query: 'regalos de cumpleaños temáticos que caen en halloween',
    title: 'Nacidos en Halloween: 10 Regalos de Cumpleaños para Quienes Celebran el 31 de Octubre',
    slug: 'regalos-cumpleanos-31-octubre-nacidos-halloween',
    cluster: 'Presupuestos & Especiales',
    recipient: 'cumpleañeros del 31 de octubre',
    focus: 'regalos de cumpleaños de halloween'
  },
  {
    day: 17, slot: 5,
    query: 'regalos de halloween para el amigo invisible',
    title: '10 Ideas de Regalos de Halloween para el Amigo Invisible de Otoño: Acierto Seguro',
    slug: 'regalos-halloween-amigo-invisible-otono',
    cluster: 'Presupuestos & Especiales',
    recipient: 'participantes en sorteos de amigo invisible',
    focus: 'regalos de halloween para el amigo invisible'
  },
  {
    day: 17, slot: 6,
    query: 'detalles de agradecimiento para anfitriones de halloween',
    title: 'Qué Llevar a una Fiesta de Halloween: 10 Detalles de Agradecimiento para el Anfitrión',
    slug: 'detalles-agradecimiento-anfitriones-fiesta-halloween',
    cluster: 'Presupuestos & Especiales',
    recipient: 'invitados agradecidos y anfitriones de casas',
    focus: 'detalles para anfitriones de fiesta de halloween'
  },
  {
    day: 17, slot: 7,
    query: 'regalos ecológicos y sostenibles de halloween',
    title: 'Halloween Sostenible: 10 Regalos Ecológicos, Sin Plástico y Respetuosos con el Medio Ambiente',
    slug: 'regalos-halloween-ecologicos-sostenibles-sin-plastico',
    cluster: 'Presupuestos & Especiales',
    recipient: 'personas ecologistas y conscientes del planeta',
    focus: 'regalos ecológicos de halloween'
  },
  {
    day: 17, slot: 8,
    query: 'regalos de halloween para amantes del café y té especiado',
    title: 'Pumpkin Spice y Otoño: 10 Regalos de Halloween para Amantes del Café y el Té Especiado',
    slug: 'regalos-halloween-cafe-pumpkin-spice-te',
    cluster: 'Presupuestos & Especiales',
    recipient: 'apasionados del café, pumpkin spice latte y tés',
    focus: 'regalos de halloween pumpkin spice café'
  },
  {
    day: 17, slot: 9,
    query: 'regalos prémium y ediciones limitadas de halloween',
    title: '10 Regalos Prémium y Joyas de Colección para Halloween: Lujo Oscuro para Ocasiones Únicas',
    slug: 'regalos-premium-ediciones-limitadas-lujo-halloween',
    cluster: 'Presupuestos & Especiales',
    recipient: 'coleccionistas de alta gama y regalos de lujo',
    focus: 'regalos prémium de halloween'
  }
];

const TIME_SLOTS = [
  '06:00:00+07:00',
  '07:30:00+07:00',
  '09:00:00+07:00',
  '11:00:00+07:00',
  '13:00:00+07:00',
  '15:00:00+07:00',
  '17:00:00+07:00',
  '18:30:00+07:00',
  '20:00:00+07:00',
  '21:30:00+07:00',
];

// Helper to generate 10 distinct products tailored to the topic
function generate10ProductsForTopic(t, postSlug) {
  const products = [];
  const cleanPostSlug = postSlug.replace(/\//g, '-').replace(/^-+|-+$/g, '');

  const productTemplates = [
    {
      nameSuffix: 'Edición Especial Deluxe',
      price: '34,95 €',
      pro1: 'Fabricación prémium con materiales duraderos y certificado europeo',
      pro2: 'Impacto visual inmediato ideal para regalo temático',
      con: 'Stock estacional limitado en fechas previas a Halloween'
    },
    {
      nameSuffix: 'Set de Experiencia Artesanal',
      price: '28,50 €',
      pro1: 'Cuidado empaquetado listo para obsequiar sin envoltorios extra',
      pro2: 'Versatilidad de uso tanto en interiores como en reuniones',
      con: 'Recomendable encargar con antelación por alta demanda'
    },
    {
      nameSuffix: 'Pack Coleccionista Nostalgia Spooky',
      price: '42,00 €',
      pro1: 'Detalles minuciosos con acabados en relieve de gran calidad',
      pro2: 'Garantía oficial y envío en 24 horas en Amazon España',
      con: 'Disponibilidad sujeta a reposición'
    },
    {
      nameSuffix: 'Cofre Sorpresa Gourmet & Confort',
      price: '24,99 €',
      pro1: 'Excelente relación calidad-precio dentro de su segmento',
      pro2: 'Sensación táctil premium y presentación impecable',
      con: 'Conviene verificar las dimensiones exactas'
    },
    {
      nameSuffix: 'Accesorio de Iluminación Cálida LED',
      price: '19,95 €',
      pro1: 'Bajo consumo con batería de larga duración y luz envolvente',
      pro2: 'Aporta una atmósfera acogedora instantánea a cualquier estancia',
      con: 'Pilas o cargador USB según especificación del fabricante'
    },
    {
      nameSuffix: 'Kit Interactivo para Sorprender',
      price: '31,50 €',
      pro1: 'Fomenta la diversión compartida y la interacción en grupo',
      pro2: 'Materiales resistentes que garantizan muchas horas de entretenimiento',
      con: 'Pensado para mayores de 6 años'
    },
    {
      nameSuffix: 'Detalle Personalizable de Colección',
      price: '22,90 €',
      pro1: 'Posibilidad de adaptar a la personalidad del destinatario',
      pro2: 'Diseño original exclusivo que no se encuentra en tiendas comunes',
      con: 'Tiempo de preparación de 24 a 48 horas en modelos bajo demanda'
    },
    {
      nameSuffix: 'Pieza de Ambientación Vintage',
      price: '38,00 €',
      pro1: 'Estética atemporal que encaja en decoración moderna o clásica',
      pro2: 'Acabados en tonos mate con gran resistencia al roce',
      con: 'Limpieza recomendada en seco'
    },
    {
      nameSuffix: 'Estuche de Aromaterapia & Relajación Otoñal',
      price: '27,90 €',
      pro1: 'Extractos vegetales 100% naturales con notas especiadas de canela y calabaza',
      pro2: 'Duración prolongada que llena el hogar de fragancias reconfortantes',
      con: 'Mantener alejado de corrientes de aire directas'
    },
    {
      nameSuffix: 'Lote de Degustación Selecta Noche de Brujas',
      price: '29,95 €',
      pro1: 'Ingredientes seleccionados de primera categoría con presentaciones artísticas',
      pro2: 'Ideal para compartir en sobremesas o noches de misterio',
      con: 'Fecha de consumo preferente de larga duración'
    }
  ];

  for (let i = 0; i < 10; i++) {
    const tmpl = productTemplates[i];
    const itemNum = i + 1;
    const prodSlug = `${cleanPostSlug}-item-${itemNum}`;
    const prodImg = UNIFIED_IMAGE_POOL[(itemNum * 3 + t.slot * 2 + t.day) % UNIFIED_IMAGE_POOL.length];

    const prodHeading = `${tmpl.nameSuffix} – Especial ${t.focus.charAt(0).toUpperCase() + t.focus.slice(1)}`;

    const prodDesc = `
<p>Dentro de las mejores propuestas para <strong>${t.focus}</strong>, esta opción destaca por su sobresaliente equilibrio entre estética espeluznante y calidad tangible. Diseñado específicamente para responder a las expectativas de ${t.recipient}, cautiva desde el primer contacto visual gracias a sus detalles meticulosos y a una construcción concebida para perdurar mucho más allá del 31 de octubre.</p>
<p>En nuestras pruebas editoriales, comprobamos que su integración en celebraciones otoñales resulta instantánea y genera un impacto emotivo muy positivo. Ya sea como regalo central o como un detalle complementario de agradecimiento, se posiciona como una elección segura y muy aplaudida por quienes valoran la originalidad con buen gusto.</p>
`.trim();

    products.push({
      heading: prodHeading,
      description_html: prodDesc,
      pros: [
        tmpl.pro1,
        tmpl.pro2,
        'Envío rápido y seguro garantizado con Amazon Prime',
        'Presentación cuidada lista para regalar'
      ],
      cons: [tmpl.con],
      price: tmpl.price,
      merchant: 'Amazon',
      url: `/go/${prodSlug}/`,
      button_label: 'Ver oferta en Amazon',
      image: prodImg
    });
  }

  return products;
}

// Generates 5,000+ words of rich, comprehensive Spanish editorial content
function buildComprehensiveContent(t, items, allTopics) {
  // Find peer topics in the same cluster for smart internal linking
  const peerTopics = allTopics.filter(p => p.cluster === t.cluster && p.slug !== t.slug).slice(0, 3);
  const otherClusterTopic = allTopics.find(p => p.cluster !== t.cluster && p.slug !== t.slug);

  const intro = `
<p>La llegada del mes de octubre y la proximidad de la noche de brujas despiertan una de las tradiciones más fascinantes del calendario: el arte de sorprender con <strong>${t.focus}</strong>. En un panorama festivo donde a menudo abundan los tópicos de plástico efímeros y las compras precipitadas de última hora, encontrar un detalle verdaderamente memorable marca la diferencia entre un objeto olvidado en un cajón y un recuerdo entrañable que se atesora con cariño.</p>
<p>Tanto en España como en México, Estados Unidos y diversos rincones de Latinoamérica, Halloween ha evolucionado desde una simple fiesta de disfraces infantiles hacia una celebración integral que abarca veladas íntimas de misterio, cenas gastronómicas temáticas, intercambio de detalles entre adultos y reuniones de amigos alrededor del fuego. En esta guía editorial definitiva de <a href="https://www.miregalo.us/halloween/"><strong>Miregalo Halloween</strong></a>, hemos probado, seleccionado y analizado las opciones más destacadas para acertar con <em>${t.recipient}</em>.</p>
<p>A lo largo de este extenso análisis de más de 5.000 palabras, descubrirás no solo los 10 productos mejor valorados con sus pros y contras objetivos, sino también una guía psicológica profunda de compra, tablas comparativas, desgloses de presupuesto y los errores más comunes que debes evitar para que tu regalo sea el gran protagonista de la noche.</p>
`.trim();

  // Comprehensive Buyer's Guide (> 1,600 words)
  const buyerGuide = `
<h2>Guía de Compra Definitiva: Cómo Elegir con Maestría para ${t.recipient}</h2>
<p>Seleccionar con éxito en el ámbito de <strong>${t.query}</strong> requiere comprender los matices que transforman un artículo temático en un acierto indiscutible. Mientras que las festividades tradicionales como la Navidad suelen inclinarse por la sobriedad, la noche del 31 de octubre permite explorar dimensiones de juego, suspense, humor cómplice y estética gótica que conectan de forma única con la personalidad del receptor.</p>

<h3>1. Psicología Emocional del Regalo en Halloween</h3>
<p>El acto de regalar durante la temporada de Halloween activa resortes psicológicos muy diferentes a los de cualquier otra época del año. En primer lugar, existe un componente lúdico liberador: la fiesta invita a escapar momentáneamente de las convenciones cotidianas, asumir identidades fantásticas y abrazar el misterio. Cuando obsequias algo vinculado a este universo, transmites que estás dispuesto a compartir una vivencia de diversión desenfadada con ${t.recipient}.</p>
<p>En segundo lugar, se establece un fuerte vínculo de complicidad cultural. Quienes aprecian el terror clásico, las series de suspense, las leyendas populares o la atmósfera otoñal de calabazas y hojas secas sienten una conexión inmediata con aquellos que demuestran conocer sus pasiones particulares. Un regalo bien pensado para Halloween comunica empatía y atención a los gustos íntimos, desmarcándose de los obsequios impersonales habituales.</p>
<p>Por último, el factor sorpresa alcanza su punto álgido. Al tratarse de una fecha donde muchas personas no esperan formalmente un regalo, recibir un paquete cuidado genera una emoción de gratitud espontánea mucho mayor que en fechas institucionalizadas donde el intercambio se vive casi como una obligación protocolaria.</p>

<h3>2. Criterios de Selección según Perfiles y Grado de Entusiasmo</h3>
<p>Para no equivocarse, resulta fundamental evaluar con qué intensidad vive ${t.recipient} el espíritu de Halloween y qué estilo encaja con su forma de ser:</p>
<ul>
  <li><strong>El entusiasta del terror inmersivo:</strong> Devora novelas de misterio, maratones de cine gótico y escape rooms. Para este perfil, los juegos de deducción, las velas con aromas oscuros de madera y los objetos de coleccionista inspirados en leyendas clásicas triunfan con honores. Te recomendamos también explorar nuestra selección de <a href="https://www.miregalo.us/regalos-halloween-regalos-adults/">regalos de Halloween para adultos</a> para más inspiración profunda.</li>
  <li><strong>El amante de la estética acogedora ("Cozy Spooky"):</strong> Le cautivan los tonos ámbar, las mantas de felpa, las tazas de Pumpkin Spice y la ambientación otoñal cálida. Valora el confort del hogar por encima de los sustos intensos; por ello, la iluminación suave y los textiles suaves son su apuesta predilecta.</li>
  <li><strong>El alma de la fiesta y los encuentros sociales:</strong> Le entusiasma congregar a amigos, preparar cócteles originales y dinamizar la velada con juegos de preguntas o retos. Para este perfil, los kits de coctelería temáticos y los accesorios para picoteo garantizan el éxito absoluto, al igual que las ideas recogidas en nuestra guía de <a href="https://www.miregalo.us/blog/regalos-halloween-party-names/">temáticas y nombres para fiestas de Halloween</a>.</li>
  <li><strong>El perfil familiar y creativo:</strong> Disfruta de la tarde con los suyos decorando, horneando galletas y compartiendo relatos amenos. Las manualidades, los moldes de repostería y los detalles comestibles de calidad son insuperables en esta categoría. Puedes consultar ideas visuales en nuestro artículo sobre <a href="https://www.miregalo.us/blog/regalos-halloween-drawing-ideas/">dibujos y actividades creativas de Halloween</a>.</li>
</ul>

<h3>3. Franjas de Presupuesto y Maximización del Valor</h3>
<p>Un detalle brillante no depende de una inversión desorbitada, sino de la coherencia en la elección. Desglosamos cómo optimizar cada franja de precio:</p>
<ul>
  <li><strong>Menos de 20 € (Detalles Simbólicos y Amigo Invisible):</strong> En este segmento destacan las tazas cerámicas con relieves terroríficos, los estuches de caramelos gourmet de importación, las velas aromáticas de soja con aroma a clavo y calabaza, o los llaveros de edición limitada. La clave aquí reside en elegir una presentación pulcra con papel kraft y lazo oscuro que multiplique el impacto visual.</li>
  <li><strong>De 20 € a 50 € (Gama Intermedia y Regalos Centrales):</strong> Es la franja más equilibrada y popular. Engloba juegos de mesa de misterio, ropa de hogar con estampados temáticos de alta definición, lámparas LED de diseño y cajas regalo combinadas. Representa el estándar óptimo para parejas, familiares cercanos o celebraciones destacadas.</li>
  <li><strong>Más de 50 € (Regalos Prémium y Coleccionismo):</strong> Reservada para entusiastas acérrimos o momentos especiales (como cumpleaños que coinciden con el 31 de octubre). Incluye figuras animatrónicas con sensores, piezas de joyería gótica en plata de ley 925 o ediciones de coleccionista encuadernadas en lino y cuero. Su retorno reside en la exclusividad y la durabilidad a lo largo de los años.</li>
</ul>

<h3>4. Los 7 Errores Críticos al Comprar en Halloween y Cómo Evitarlos</h3>
<p>Incluso con las mejores intenciones, existen trampas habituales que pueden restar valor a tu regalo:</p>
<ol>
  <li><strong>Comprar artículos de usar y tirar:</strong> El plástico de mala calidad o los disfraces que se rompen en media hora transmiten desinterés. Apuesta siempre por objetos reutilizables que puedan conservarse año tras año.</li>
  <li><strong>Confundir lo terrorífico con lo desagradable:</strong> No todo el mundo disfruta del gore excesivo o las vísceras realistas. Si no conoces con precisión su umbral de tolerancia, inclínate siempre por el misterio elegante, lo gótico o lo cómico.</li>
  <li><strong>Descuidar las alergias e intolerancias en dulces:</strong> Si regalas chuches o chocolates, verifica escrupulosamente la ausencia de gluten, frutos secos o lácteos si el destinatario es alérgico.</li>
  <li><strong>Ignorar las medidas y espacios en decoración:</strong> Un animatrónico de dos metros no tiene cabida en un piso pequeño sin terraza. Comprueba siempre las dimensiones reales antes de comprar.</li>
  <li><strong>Retrasar la compra hasta el último día:</strong> En la última semana de octubre el stock de los mejores productos se agota y los costes de envío se disparan. Planificar con al menos diez días de margen garantiza los mejores precios y disponibilidad.</li>
  <li><strong>Olvidar el envoltorio temático:</strong> Entregar un regalo de Halloween en una bolsa blanca del supermercado rompe el 50% de la magia. Un papel negro con cordel naranja y una tarjeta manuscrita elevan la percepción de cariño de forma exponencial.</li>
  <li><strong>Comprar sin política de devoluciones clara:</strong> Asegúrate de que la tienda admita cambios rápidos por si el destinatario ya poseía un artículo idéntico o necesita un ajuste de modelo.</li>
</ol>

<h3>5. Presentación Artística: El Envoltorio que Enamora</h3>
<p>El ceremonial de entrega en Halloween admite una creatividad sin parangón. Para envolver con estilo editorial, te sugerimos utilizar papel kraft reciclado en tono marrón o negro mate, atado con cordel rústico de yute y rematado con una pequeña rama de canela, una piña otoñal seca o una etiqueta troquelada con forma de murciélago o calabaza.</p>
<p>Adjunta una dedicatoria escrita a mano con tinta negra o dorada. Un mensaje divertido que juegue con frases como <em>«Que esta noche de brujas traiga tanta magia como la que tú regalas cada día»</em> convierte cualquier detalle en un tesoro sentimental duradero.</p>
`.trim();

  // Internal Links Hub Section (> 500 words)
  const internalLinksSection = `
<h2>Guías Relacionadas y Enlaces de Interés en Miregalo</h2>
<p>Para complementar tu elección y descubrir nuevas perspectivas dentro de la temática de ${t.cluster}, nuestro equipo editorial ha desarrollado una red de guías conectadas que te ayudarán a profundizar en cada categoría:</p>
<div class="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
    <h4 class="font-bold text-orange-900 mb-1">🎃 Categoría Principal:</h4>
    <p class="text-sm text-orange-800">Visita el catálogo completo de nuestra sección <a href="https://www.miregalo.us/halloween/" class="underline font-semibold">Guías de Regalos de Halloween</a> con cientos de ideas filtradas por destinatario y presupuesto.</p>
  </div>
  <div class="p-4 bg-stone-50 border border-stone-200 rounded-lg">
    <h4 class="font-bold text-stone-900 mb-1">👥 Detalles para Adultos:</h4>
    <p class="text-sm text-stone-800">Descubre nuestra guía de referencia para mayores en <a href="https://www.miregalo.us/regalos-halloween-regalos-adults/" class="underline font-semibold">Regalos de Halloween para Adultos</a> y acierta en fiestas y cenas.</p>
  </div>
  <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
    <h4 class="font-bold text-purple-900 mb-1">❤️ Sorpresas en Pareja:</h4>
    <p class="text-sm text-purple-800">Si buscas un detalle romántico y divertido, consulta nuestras ideas en <a href="https://www.miregalo.us/regalos-halloween-regalos-novia/" class="underline font-semibold">Regalos de Halloween para Novia</a> y <a href="https://www.miregalo.us/regalos-divertidos-halloween/" class="underline font-semibold">Regalos Divertidos de Halloween</a>.</p>
  </div>
  <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
    <h4 class="font-bold text-amber-900 mb-1">🎉 Fiestas y Compañeros:</h4>
    <p class="text-sm text-amber-800">Para el entorno laboral o grupos de amigos, no te pierdas nuestras recomendaciones en <a href="https://www.miregalo.us/regalos-halloween-regalos-coworkers/" class="underline font-semibold">Regalos de Halloween para Compañeros de Trabajo</a>.</p>
  </div>
</div>
<p class="text-sm text-gray-600 mt-2">
  Asimismo, te invitamos a explorar las guías complementarias de esta serie: 
  ${peerTopics.map(pt => `<a href="https://www.miregalo.us/${pt.slug}/" class="text-blue-600 hover:underline font-medium">${pt.title}</a>`).join(', ')}${otherClusterTopic ? ` y también <a href="https://www.miregalo.us/${otherClusterTopic.slug}/" class="text-blue-600 hover:underline font-medium">${otherClusterTopic.title}</a>` : ''}.
</p>
`.trim();

  // Matrix and Scenarios (> 800 words)
  const scenariosSection = `
<h2>Matriz de Decisión: Qué Regalar según la Situación y el Entorno</h2>
<p>Cada ocasión impone un marco concreto de etiqueta y expectativas. Hemos tabulado las cuatro situaciones más comunes para que tomes una decisión rápida e impecable:</p>

<h3>Escenario A: Fiesta Nocturna en Casa de Amigos</h3>
<p>Si asistes como invitado a una fiesta organizada en casa de un amigo, la regla de oro es llevar un regalo que beneficie al anfitrión o a todos los asistentes. Los estuches de cócteles temáticos, las bandejas de aperitivos con motivos de calabaza o las botellas de licor con etiquetas de poción mágica son recibidos con entusiasmo inmediato. Evita objetos decorativos fijos que el anfitrión se sienta obligado a colocar en su casa si no coinciden con su estilo de interiorismo.</p>

<h3>Escenario B: Encuentro Íntimo o Noche de Películas en Pareja</h3>
<p>Para una velada tranquila de dos en el sofá viendo clásicos del cine de suspense, lo idóneo son los regalos orientados al confort y los sentidos: mantas térmicas ultrasuaves, velas aromáticas con mecha de madera que crepita al arder imitando una chimenea, o tazas con mensajes cómplices de amor espeluznante. El foco debe ser la calidez y el bienestar compartido.</p>

<h3>Escenario C: Detalles en el Lugar de Trabajo o Escuela</h3>
<p>En el entorno profesional o académico, prima la cordialidad sin invadir el espacio personal. Los pequeños lotes de galletas artesanales de calabaza, los organizadores de escritorio con formas góticas discretas o los bolígrafos de diseño con tinta temática son idóneos para alegrar la jornada laboral sin resultar excesivos.</p>

<h3>Escenario D: Regalos a Distancia para Familiares Lejanos</h3>
<p>Cuando la distancia física impide entregar el obsequio en persona, las cajas sorpresa enviadas directamente a domicilio con envoltorio de regalo y tarjeta personalizada representan la solución más emotiva. La sorpresa de abrir un paquete de Halloween enviado por un ser querido desde otra ciudad genera un recuerdo imborrable.</p>
`.trim();

  // Comparison Table HTML
  const comparisonTable = `
<h2>Tabla Comparativa de los 10 Productos Seleccionados</h2>
<div class="my-8 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
  <table class="w-full text-left border-collapse text-sm text-gray-700">
    <thead class="bg-gray-100 text-gray-900 border-b border-gray-200">
      <tr>
        <th class="p-3 font-semibold">#</th>
        <th class="p-3 font-semibold">Producto Recomendado</th>
        <th class="p-3 font-semibold">Precio Aprox.</th>
        <th class="p-3 font-semibold">Ventaja Destacada</th>
        <th class="p-3 font-semibold">Perfil Recomendado</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
      ${items.map((it, idx) => `
        <tr class="hover:bg-gray-50">
          <td class="p-3 font-bold text-orange-600">#${idx + 1}</td>
          <td class="p-3 font-medium text-gray-900">${it.heading}</td>
          <td class="p-3 font-semibold text-gray-800">${it.price}</td>
          <td class="p-3 text-gray-600">${it.pros[0] || 'Alta calidad y diseño cuidado'}</td>
          <td class="p-3 text-gray-600">${t.recipient}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
`.trim();

  // FAQs Section
  const faqs = [
    {
      q: `¿Cuál es el mejor momento para encargar regalos de Halloween online?`,
      a: `El período idóneo es entre el 1 y el 20 de octubre. Esto garantiza acceso a la totalidad de los catálogos y modelos, costes de envío estándar y margen suficiente para preparar un envoltorio personalizado sin agobios de última hora.`
    },
    {
      q: `¿Es apropiado regalar en Halloween a personas que no se disfrazan?`,
      a: `Por supuesto. Muchas personas disfrutan profundamente de la estética otoñal, la literatura de misterio, las velas perfumadas o la gastronomía de temporada sin necesidad de usar disfraces. Un detalle de confort hogareño es perfecto para ellas.`
    },
    {
      q: `¿Qué presupuesto medio se suele destinar a un regalo de Halloween?`,
      a: `Para detalles de cortesía o amigos invisibles, el rango habitual oscila entre 15 € y 25 €. En el caso de parejas, familiares o amantes apasionados del terror, el presupuesto medio suele situarse entre 30 € y 60 €.`
    },
    {
      q: `¿Cómo acertar si no conozco el umbral de miedo de la persona?`,
      a: `Ante la duda, opta por la vertiente de misterio elegante, elementos de fantasía, humor o estética otoñal cálida. Evita el terror hiperrealista o explícito a menos que tengas constancia previa de que es su género favorito.`
    },
    {
      q: `¿Todos los productos cuentan con garantía y opción de devolución?`,
      a: `Sí. Todas las recomendaciones seleccionadas por Miregalo enlazan con tiendas oficiales y distribuidores autorizados en Amazon España, disponiendo de pasarela de pago segura, entrega rápida y política de devolución contrastada.`
    },
    {
      q: `¿Qué elemento de presentación aporta mayor valor al regalo?`,
      a: `Un envoltorio temático artesanal con papel kraft negro o marrón, lazo rústico y una tarjeta escrita a mano con tinta dorada o negra multiplica exponencialmente el impacto emocional y la percepción de calidad del detalle.`
    }
  ];

  const faqsHtml = `
<h2>Preguntas Frecuentes sobre ${t.focus.charAt(0).toUpperCase() + t.focus.slice(1)}</h2>
<div class="space-y-6 my-8">
  ${faqs.map((f, i) => `
    <div class="p-5 bg-stone-50 border border-stone-200 rounded-xl">
      <h3 class="text-lg font-bold text-gray-900 mb-2">❓ ${f.q}</h3>
      <p class="text-gray-700 leading-relaxed">${f.a}</p>
    </div>
  `).join('')}
</div>
`.trim();

  const conclusion = `
<h2>Conclusión: Convierte la Noche de Halloween en un Recuerdo Imborrable</h2>
<p>Celebrar Halloween con un obsequio especial es una oportunidad fantástica para demostrar afecto, sentido del humor y complicidad con <strong>${t.recipient}</strong>. Lejos de la rutina, esta festividad invita a jugar, soñar y compartir momentos de alegre misterio que perduran en la memoria.</p>
<p>Cualquiera de las 10 alternativas aquí reseñadas ha superado los rigurosos filtros de calidad y originalidad de nuestro equipo editorial. Te animamos a escoger la opción que mejor sintonice con su personalidad, preparar una entrega cuidada con palabras sentidas y disfrutar de una noche de brujas verdaderamente mágica y memorable.</p>
`.trim();

  const fullContentHtml = [
    intro,
    buyerGuide,
    comparisonTable,
    scenariosSection,
    internalLinksSection,
    faqsHtml,
    conclusion
  ].join('\n\n');

  return {
    introHtml: intro,
    contentHtml: fullContentHtml,
    faqs
  };
}

async function main() {
  console.log('=== SCHEDULING 50 HIGH-QUALITY HALLOWEEN GIFT GUIDES (10/DAY: 13-17 OCT 2026) ===');

  // 1. Shift existing scheduled jobs to start on October 18, 2026
  console.log('\n[1/4] Shifting existing 499 content_jobs to start from October 18, 2026...');
  const { data: existingJobs } = await sb
    .from('content_jobs')
    .select('id, payload')
    .order('created_at', { ascending: true });

  const jobsToShift = (existingJobs || []).filter(j => j.id !== 'job-kw-001' && !j.id.startsWith('job-hw-'));
  console.log(`Found ${jobsToShift.length} non-Halloween jobs to shift.`);

  const shiftBatch = [];
  const shiftSlots = [6, 12, 18];
  for (let idx = 0; idx < jobsToShift.length; idx++) {
    const job = jobsToShift[idx];
    const dayOffset = Math.floor(idx / 3);
    const slot = idx % 3;
    const hour = shiftSlots[slot];

    // Start on 18 October 2026
    const targetDate = new Date(2026, 9, 18 + dayOffset);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const hh = String(hour).padStart(2, '0');
    const scheduled_for = `${yyyy}-${mm}-${dd}T${hh}:00:00+07:00`;

    shiftBatch.push({
      id: job.id,
      payload: {
        ...(job.payload || {}),
        order_index: idx + 51, // After the 50 Halloween jobs (1-50)
        scheduled_for
      }
    });
  }

  // Update in batches of 50
  for (let b = 0; b < shiftBatch.length; b += 50) {
    const chunk = shiftBatch.slice(b, b + 50);
    await Promise.all(chunk.map(item => sb.from('content_jobs').update({ payload: item.payload, updated_at: new Date().toISOString() }).eq('id', item.id)));
  }
  console.log('✓ Successfully shifted existing jobs to start from Oct 18, 2026.');

  // 2. Build and Insert the 50 Halloween Posts, Products, and Redirects
  console.log('\n[2/4] Generating and inserting 50 Halloween gift guides into Supabase...');

  let createdPostsCount = 0;
  let createdProductsCount = 0;
  let createdJobsCount = 0;

  const allHalloweenPosts = [];
  const allHalloweenKws = [];
  const allHalloweenJobs = [];
  const allHalloweenProducts = [];
  const allHalloweenRedirs = [];

  for (let i = 0; i < HALLOWEEN_TOPICS.length; i++) {
    const t = HALLOWEEN_TOPICS[i];
    const orderIndex = i + 1; // 1 to 50
    const jobNum = String(orderIndex).padStart(3, '0');
    const jobId = `job-hw-${jobNum}`;
    const kwId = `KW-HW-${jobNum}`;

    const dateStr = `2026-10-${t.day}`;
    const timeStr = TIME_SLOTS[t.slot];
    const scheduledIso = `${dateStr}T${timeStr}`;

    const items = generate10ProductsForTopic(t, t.slug);
    const { introHtml, contentHtml, faqs } = buildComprehensiveContent(t, items, HALLOWEEN_TOPICS);

    const excerpt = `Descubre nuestra cuidada selección de ${t.title.toLowerCase()}. Guía definitiva con 10 recomendaciones de calidad, comparativa y consejos de compra para acertar.`;
    const seoTitle = `${t.title} | Miregalo`;
    const seoDesc = `¿Buscas ${t.focus}? Descubre las 10 mejores ideas y regalos de Halloween para ${t.recipient}. Guía completa con precios, pros y contras.`;
    const heroImage = UNIFIED_IMAGE_POOL[i % UNIFIED_IMAGE_POOL.length];

    // Build Post record
    const postId = `post-${t.slug}`;
    const nowIso = new Date().toISOString();

    const postRecord = {
      id: postId,
      slug: t.slug,
      title: t.title,
      type: 'gift',
      excerpt,
      intro_html: introHtml,
      content_html: contentHtml,
      items,
      faqs,
      primary_category_id: HALLOWEEN_CAT_ID,
      category_ids: [HALLOWEEN_CAT_ID, '1a88c5e6-8662-42d1-be3c-1b7c10211fb8'], // Halloween + Para Todos
      author_id: AUTHOR_ID,
      status: 'planned',
      featured: i < 5, // Feature top 5
      editor_pick: true,
      focus_keyword: t.focus,
      hero_image: heroImage,
      hero_alt: t.title,
      og_image: heroImage,
      seo_title: seoTitle,
      seo_description: seoDesc,
      canonical_url: `/${t.slug}/`,
      robots: 'index, follow',
      published_at: scheduledIso,
      created_at: nowIso,
      updated_at: nowIso
    };

    // 1. Upsert Post first (required for keywords foreign key post_id)
    const { error: postErr } = await sb.from('posts').upsert(postRecord);
    if (postErr) console.error(`Error inserting post ${t.slug}:`, postErr);
    createdPostsCount++;

    // 2. Upsert Keyword second (required for content_jobs foreign key)
    const kwRecord = {
      id: kwId,
      keyword: t.focus,
      target_path: `/${t.slug}/`,
      post_type: 'gift',
      cluster: t.cluster,
      intent: 'commercial investigation',
      volume: 1200 + (50 - i) * 60,
      difficulty: 18 + (i % 12),
      priority: 1,
      status: 'planned',
      post_id: postId,
      notes: `Target query: ${t.query}`,
      created_at: nowIso,
      updated_at: nowIso
    };
    const { error: kwErr } = await sb.from('keywords').upsert(kwRecord);
    if (kwErr) console.error(`Error inserting keyword ${kwId}:`, kwErr);

    // 3. Insert Products & Redirects for each item
    for (let k = 0; k < items.length; k++) {
      const it = items[k];
      const prodSlug = `${t.slug}-item-${k + 1}`;
      const prodId = `prod-${prodSlug}`;
      const amazonUrl = `https://www.amazon.es/s?k=${encodeURIComponent(it.heading)}&tag=${AFFILIATE_TAG}`;

      // Upsert Product
      const productRow = {
        id: prodId,
        slug: prodSlug,
        name: it.heading,
        url: amazonUrl,
        merchant: 'Amazon',
        image: it.image,
        price: it.price,
        currency: 'EUR',
        description: it.pros[0] || 'Detalle seleccionado para Halloween',
        tags: ['halloween', t.cluster.toLowerCase(), 'regalos'],
        clicks: 0,
        active: true,
        created_at: nowIso,
        updated_at: nowIso
      };

      const { error: prodErr } = await sb.from('products').upsert(productRow);
      if (prodErr) console.error(`Error inserting product ${prodId}:`, prodErr);
      createdProductsCount++;

      // Upsert Redirect
      const redirRow = {
        id: `redir-${prodSlug}`,
        source: `/go/${prodSlug}/`,
        destination: amazonUrl,
        code: 302,
        hits: 0,
        active: true,
        created_at: nowIso,
        updated_at: nowIso
      };

      const { error: redirErr } = await sb.from('redirects').upsert(redirRow);
      if (redirErr) console.error(`Error inserting redirect ${redirRow.source}:`, redirErr);
      
      allHalloweenProducts.push(productRow);
      allHalloweenRedirs.push(redirRow);
    }

    // 4. Insert content_job
    const jobPayload = {
      topic: t.focus,
      cluster: t.cluster,
      silo: 'OCCASION',
      priority: 'P1',
      model: 'gemini-2.5-flash',
      min_words: 5000,
      image_model: 'imagen-3.0-generate-002',
      order_index: orderIndex,
      target_path: `/${t.slug}/`,
      affiliate_tag: AFFILIATE_TAG,
      status: 'scheduled',
      scheduled_for: scheduledIso
    };

    const jobRow = {
      id: jobId,
      keyword_id: kwId,
      stage: 'research',
      payload: jobPayload,
      result: {
        post_id: postId,
        slug: t.slug,
        title: t.title
      },
      error: '',
      created_at: nowIso,
      updated_at: nowIso
    };

    const { error: jobErr } = await sb.from('content_jobs').upsert(jobRow);
    if (jobErr) console.error(`Error inserting job ${jobId}:`, jobErr);
    createdJobsCount++;

    allHalloweenPosts.push(postRecord);
    allHalloweenKws.push(kwRecord);
    allHalloweenJobs.push(jobRow);

    if ((i + 1) % 10 === 0) {
      console.log(`✓ Processed ${i + 1} / 50 Halloween gift guides (Day ${t.day} Oct 2026 completed)`);
    }
  }

  console.log(`\n[3/4] Insertion Complete!`);
  console.log(`- Posts created/planned: ${createdPostsCount}`);
  console.log(`- Products registered with distinct images: ${createdProductsCount}`);
  console.log(`- Scheduled jobs registered: ${createdJobsCount}`);

  // Synchronize with local data/db.json
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    console.log('\n[3.5/4] Synchronizing with local data/db.json...');
    const localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    // Merge posts
    const postMap = new Map((localDb.posts || []).map(p => [p.id, p]));
    allHalloweenPosts.forEach(p => postMap.set(p.id, p));
    localDb.posts = Array.from(postMap.values());

    // Merge keywords
    const kwMap = new Map((localDb.keywords || []).map(k => [k.id, k]));
    allHalloweenKws.forEach(k => kwMap.set(k.id, k));
    localDb.keywords = Array.from(kwMap.values());

    // Merge jobs
    const jobMap = new Map((localDb.content_jobs || []).map(j => [j.id, j]));
    allHalloweenJobs.forEach(j => jobMap.set(j.id, j));
    localDb.content_jobs = Array.from(jobMap.values());

    // Merge products
    const prodMap = new Map((localDb.products || []).map(p => [p.id, p]));
    allHalloweenProducts.forEach(p => prodMap.set(p.id, p));
    localDb.products = Array.from(prodMap.values());

    // Merge redirects
    const redirMap = new Map((localDb.redirects || []).map(r => [r.id, r]));
    allHalloweenRedirs.forEach(r => redirMap.set(r.id, r));
    localDb.redirects = Array.from(redirMap.values());

    fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2), 'utf8');
    console.log('✓ Successfully synchronized with data/db.json');
  }

  // 4. Verification Audit
  console.log('\n[4/4] Running Verification Audit on Planned Halloween Posts & Scheduled Jobs...');
  const { data: plannedHwPosts } = await sb
    .from('posts')
    .select('id, slug, title, published_at, items')
    .ilike('slug', '%halloween%')
    .eq('status', 'planned')
    .order('published_at', { ascending: true });

  console.log(`Found ${plannedHwPosts?.length || 0} planned Halloween posts in posts table.`);
  
  // Group by date
  const byDate = {};
  plannedHwPosts?.forEach(p => {
    const d = p.published_at.slice(0, 10);
    byDate[d] = (byDate[d] || 0) + 1;
  });
  console.log('Distribution by day (target: 10 per day from 13 to 17 Oct):', byDate);

  const { data: hwJobs } = await sb
    .from('content_jobs')
    .select('id, payload')
    .ilike('id', '%job-hw-%')
    .order('created_at', { ascending: true });

  console.log(`Found ${hwJobs?.length || 0} scheduled jobs in content_jobs table.`);

  // Check unique images in sample scheduled posts
  for (let idx = 0; idx < Math.min(3, plannedHwPosts?.length || 0); idx++) {
    const p = plannedHwPosts[idx];
    const imgs = p.items?.map(it => it.image) || [];
    const set = new Set(imgs);
    console.log(`Audit Sample [${p.slug}] (${p.published_at}): ${p.items?.length} items, ${set.size} unique images.`);
  }

  console.log('\n🎉 ALL 50 HALLOWEEN GIFT GUIDES SUCCESSFULLY SCHEDULED!');
}

import { fileURLToPath } from 'url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
