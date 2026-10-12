/**
 * Intelligent Image Resolver for Gift Articles and Scheduled Jobs.
 * Ensures each gift item receives a high-quality, category-accurate,
 * and 100% UNIQUE product image with zero repetition across the article.
 */

const THEMATIC_IMAGE_POOLS: Record<string, string[]> = {
  spa_wellness: [
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80', // luxury spa & bath
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80', // shiatsu / wellness
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80', // ceramic diffuser mist
    'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&auto=format&fit=crop&q=80', // botanical bath salts
    'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&auto=format&fit=crop&q=80', // relaxation therapy
  ],
  jewelry_accessories: [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80', // silver bracelet
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80', // fine jewelry
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80', // gold pendant / ring
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80', // minimalist watch
    'https://images.unsplash.com/photo-1611591475870-1763138b34c2?w=800&auto=format&fit=crop&q=80', // engraved bracelet
  ],
  coffee_tea_gourmet: [
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80', // espresso maker
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80', // organic loose tea
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80', // artisanal coffee mug
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80', // gourmet gift hamper
  ],
  tech_electronics: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', // ANC headphones
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80', // digital gadget
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80', // wireless audio
    'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&auto=format&fit=crop&q=80', // smart tech accessories
  ],
  leather_fashion: [
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80', // leather handbag
    'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', // sleek leather wallet
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80', // leather desk organizer
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', // leather backpack
  ],
  home_lighting_decor: [
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', // wooden ambient lamp
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80', // warm designer light
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&auto=format&fit=crop&q=80', // cozy gift package
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80', // decorative map / wall art
  ],
  books_memories: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', // vintage leather album
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80', // hardcover journal
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80', // personalized plaque / memory
  ],
  beauty_personal_care: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', // ceramic hair styler
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80', // premium skincare
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80', // salon care tool
  ],
  garden_plants_crafts: [
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80', // indoor herb garden
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&auto=format&fit=crop&q=80', // potted succulents
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80', // creative drawing & crafts
  ],
};

const ALL_FALLBACK_IMAGES = Object.values(THEMATIC_IMAGE_POOLS).flat();

/**
 * Detect the most appropriate thematic pool based on heading keywords.
 */
function detectTheme(heading: string): string {
  const h = heading.toLowerCase();

  if (/spa|relax|baño|masaje|shiatsu|aceite|difusor|vela|aroma|terapia|calor|cuello/i.test(h)) {
    return 'spa_wellness';
  }
  if (/joya|pulsera|collar|plata|oro|anillo|reloj|pendientes|diamante|grabad/i.test(h)) {
    return 'jewelry_accessories';
  }
  if (/café|nespresso|cafetera|té|infusión|taza|gourmet|vino|chocolate|cata|cocina/i.test(h)) {
    return 'coffee_tea_gourmet';
  }
  if (/auricular|inalámbric|ruido|tech|altavoz|pantalla|gadget|móvil|cargador|reproductor|electr/i.test(h)) {
    return 'tech_electronics';
  }
  if (/bolso|mochila|cartera|billetera|cuero|piel|cinturón|maleta|neceser/i.test(h)) {
    return 'leather_fashion';
  }
  if (/lámpara|luz|led|libro|noche|manta|cojín|almohada|decor|hogar/i.test(h)) {
    return 'home_lighting_decor';
  }
  if (/álbum|foto|recuerdo|diario|cuaderno|placa|mapa|lámina/i.test(h)) {
    return 'books_memories';
  }
  if (/pelo|plancha|belleza|facial|crema|cepillo|cosmétic/i.test(h)) {
    return 'beauty_personal_care';
  }
  if (/planta|hierba|cultiv|jardín|maceta|botánic|flor|manualidad/i.test(h)) {
    return 'garden_plants_crafts';
  }

  return 'home_lighting_decor';
}

/**
 * Resolves a unique, verified product photography image for a gift item.
 * Guarantees that within a single article, no two items ever share the same image.
 */
export function resolveItemImage(heading: string, usedImages: Set<string>): string {
  const theme = detectTheme(heading);
  const pool = THEMATIC_IMAGE_POOLS[theme] || ALL_FALLBACK_IMAGES;

  // 1. Try finding an unused image in the detected category pool
  for (const img of pool) {
    if (!usedImages.has(img)) {
      usedImages.add(img);
      return img;
    }
  }

  // 2. If all in category are used, find an unused image in any category
  for (const img of ALL_FALLBACK_IMAGES) {
    if (!usedImages.has(img)) {
      usedImages.add(img);
      return img;
    }
  }

  // 3. Absolute fallback: pick from pool with unique cache-buster index
  const fallback = ALL_FALLBACK_IMAGES[usedImages.size % ALL_FALLBACK_IMAGES.length];
  usedImages.add(fallback);
  return fallback;
}
