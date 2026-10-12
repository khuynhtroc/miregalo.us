import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

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
  console.log('1. Updating products table for mama items...');
  for (let i = 0; i < MAMA_IMAGES.length; i++) {
    const slug = `ideas-de-regalos-para-mama-item-${i + 1}`;
    const img = MAMA_IMAGES[i];
    await sb.from('products').update({ image: img, updated_at: new Date().toISOString() }).eq('slug', slug);
  }
  console.log('Done updating products table.');

  console.log('\n2. Updating other 9 posts in posts table...');
  for (const [slug, fix] of Object.entries(OTHER_FIXES)) {
    const { data: p } = await sb.from('posts').select('id, slug, items').eq('slug', slug).single();
    if (!p || !p.items) continue;

    let changed = false;
    const items = p.items.map(it => {
      if (it.heading && (it.heading.toLowerCase().includes(fix.targetHeading.toLowerCase()) || fix.targetHeading.toLowerCase().includes(it.heading.toLowerCase()))) {
        changed = true;
        return { ...it, image: fix.newImage };
      }
      return it;
    });

    if (changed) {
      await sb.from('posts').update({ items, updated_at: new Date().toISOString() }).eq('id', p.id);
      console.log(`✓ Updated [${slug}]`);
    } else {
      console.log(`No match for [${slug}]`);
    }
  }

  console.log('\n3. Verifying all 10 posts:');
  const allSlugs = ['ideas-de-regalos-para-mama', ...Object.keys(OTHER_FIXES)];
  const { data: checkedPosts } = await sb.from('posts').select('slug, items').in('slug', allSlugs);

  for (const p of checkedPosts || []) {
    const imgs = p.items?.map(it => it.image).filter(Boolean) || [];
    const unique = new Set(imgs);
    const hasDups = unique.size < imgs.length;
    console.log(`[${p.slug}]: total items = ${imgs.length}, unique images = ${unique.size} -> ${hasDups ? 'DUPLICATES!' : 'PERFECT (ALL UNIQUE)'}`);
  }
}

main().catch(console.error);
