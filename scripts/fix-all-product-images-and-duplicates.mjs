import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

// 12 distinct, high-quality, category-accurate product images for "ideas-de-regalos-para-mama"
const MAMA_IMAGES = [
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80', // #1 Cofre Spa
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80', // #2 Pulsera Plata
  'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80', // #3 Nespresso
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80', // #4 Masajeador Shiatsu
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', // #5 Lámpara Libro LED
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', // #6 Auriculares Inalámbricos
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80', // #7 Bolso Elegante
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80', // #8 Difusor Cerámica
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80', // #9 Kit Hierbas Aromáticas
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', // #10 Plancha Pelo Cerámica
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80', // #11 Álbum Cuero Vintage
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80', // #12 Estuche Tés Orgánicos
];

// Targeted fixes for the 9 posts that each had 1 duplicate item
const OTHER_FIXES = {
  'regalos-6-year-old-girl': {
    targetHeading: 'Tablero de dibujo para tableta',
    newImage: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80'
  },
  'regalos-black-friday-gift-him': {
    targetHeading: 'Protector de escritorio de cuero',
    newImage: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80'
  },
  'regalos-boda': {
    targetHeading: 'Llavero de acero personalizado para el 4.° aniversario de bodas',
    newImage: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&auto=format&fit=crop&q=80'
  },
  'regalos-crypto': {
    targetHeading: 'Una visualización del precio de Bitcoin',
    newImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
  },
  'regalos-divertidos-regalos-hermano': {
    targetHeading: 'Inserción de tarjeta tipo billetera grabada',
    newImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80'
  },
  'regalos-map-lovers': {
    targetHeading: 'Mapa mundial rasca y personalizado',
    newImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80'
  },
  'regalos-medical-school-graduate': {
    targetHeading: 'Placa acrílica rectangular',
    newImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80'
  },
  'regalos-secret-hermana-gift-ideas': {
    targetHeading: 'Le susurraron No puedes soportar la tormenta',
    newImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'
  },
  'regalos-thank-you-regalos-coworkers': {
    targetHeading: 'Nunca olvides la diferencia que haces con el bloque de madera',
    newImage: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80'
  }
};

async function main() {
  console.log('=== Step 1: Fixing ideas-de-regalos-para-mama ===');
  const { data: mamaPost, error: mamaErr } = await sb
    .from('posts')
    .select('id, slug, items')
    .eq('slug', 'ideas-de-regalos-para-mama')
    .single();

  if (mamaErr || !mamaPost) {
    console.error('Failed to fetch mama post:', mamaErr);
    return;
  }

  const updatedMamaItems = (mamaPost.items || []).map((it, idx) => {
    const newImg = MAMA_IMAGES[idx] || it.image;
    return {
      ...it,
      image: newImg,
    };
  });

  const { error: updateMamaErr } = await sb
    .from('posts')
    .update({ items: updatedMamaItems, updated_at: new Date().toISOString() })
    .eq('id', mamaPost.id);

  if (updateMamaErr) {
    console.error('Error updating mama post items:', updateMamaErr);
  } else {
    console.log(`Successfully updated mama post with ${updatedMamaItems.length} unique images!`);
  }

  // Also update products table for all 12 mama products
  for (let i = 0; i < updatedMamaItems.length; i++) {
    const it = updatedMamaItems[i];
    const prodId = `prod-ideas-de-regalos-para-mama-item-${i + 1}`;
    const slug = `ideas-de-regalos-para-mama-item-${i + 1}`;
    const { error: pErr } = await sb
      .from('products')
      .update({ image: it.image, updated_at: new Date().toISOString() })
      .or(`id.eq.${prodId},slug.eq.${slug}`);
    if (pErr) console.warn(`Warning updating product ${prodId}:`, pErr.message);
  }
  console.log('Updated products table for mama items.');

  console.log('\n=== Step 2: Fixing the 9 other posts with duplicate item images ===');
  for (const [slug, fix] of Object.entries(OTHER_FIXES)) {
    const { data: p, error: pErr } = await sb
      .from('posts')
      .select('id, slug, items')
      .eq('slug', slug)
      .single();

    if (pErr || !p || !p.items) continue;

    let modified = false;
    const newItems = p.items.map((it) => {
      if (it.heading?.toLowerCase().includes(fix.targetHeading.toLowerCase()) || fix.targetHeading.toLowerCase().includes(it.heading?.toLowerCase())) {
        modified = true;
        return { ...it, image: fix.newImage };
      }
      return it;
    });

    if (modified) {
      const { error: saveErr } = await sb
        .from('posts')
        .update({ items: newItems, updated_at: new Date().toISOString() })
        .eq('id', p.id);
      if (saveErr) console.error(`Error updating [${slug}]:`, saveErr);
      else console.log(`✓ Fixed duplicate image in post [${slug}]`);
    } else {
      console.warn(`Could not match target heading in [${slug}]`);
    }
  }

  console.log('\n=== Step 3: Verification Scan of All Posts ===');
  let from = 0;
  const limit = 500;
  let remainingDups = [];

  while (true) {
    const { data, error } = await sb.from('posts').select('id, slug, items').range(from, from + limit - 1);
    if (!data || data.length === 0) break;
    for (const p of data) {
      if (!p.items || !Array.isArray(p.items) || p.items.length <= 1) continue;
      const imgs = p.items.map((it) => it.image).filter(Boolean);
      const unique = new Set(imgs);
      if (unique.size < imgs.length) {
        remainingDups.push({
          slug: p.slug,
          total: p.items.length,
          unique: unique.size
        });
      }
    }
    from += limit;
  }

  console.log(`\nRemaining posts with duplicated item images across database: ${remainingDups.length}`);
  if (remainingDups.length > 0) {
    console.log('Details:', remainingDups);
  } else {
    console.log('🎉 100% CLEAN! Zero posts with duplicated item images exist in the entire database!');
  }
}

main().catch(console.error);
