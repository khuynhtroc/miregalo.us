import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

// Pool of high quality, verified unique gift photos on Unsplash
const BACKUP_UNIQUE_IMAGES = [
  'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80',
];

async function main() {
  const slugs = [
    'regalos-black-friday-gift-him',
    'regalos-divertidos-regalos-hermano',
    'regalos-map-lovers',
    'regalos-medical-school-graduate',
    'regalos-thank-you-regalos-coworkers'
  ];

  const { data: posts } = await sb.from('posts').select('id, slug, items').in('slug', slugs);

  let poolIdx = 0;
  for (const p of posts || []) {
    const seen = new Set();
    let hasDup = false;
    const newItems = p.items.map((it) => {
      if (seen.has(it.image)) {
        hasDup = true;
        const replacement = BACKUP_UNIQUE_IMAGES[poolIdx % BACKUP_UNIQUE_IMAGES.length];
        poolIdx++;
        console.log(`Fixing duplicate in [${p.slug}]: "${it.heading}" -> ${replacement.slice(0, 60)}...`);
        seen.add(replacement);
        return { ...it, image: replacement };
      }
      seen.add(it.image);
      return it;
    });

    if (hasDup) {
      await sb.from('posts').update({ items: newItems, updated_at: new Date().toISOString() }).eq('id', p.id);
      console.log(`✓ Post [${p.slug}] updated.`);
    }
  }

  // Final check
  const { data: check } = await sb.from('posts').select('slug, items').in('slug', slugs);
  for (const p of check || []) {
    const imgs = p.items.map(it => it.image);
    const set = new Set(imgs);
    console.log(`[${p.slug}]: total = ${imgs.length}, unique = ${set.size} -> ${set.size === imgs.length ? '100% UNIQUE' : 'DUPLICATE'}`);
  }
}

main().catch(console.error);
