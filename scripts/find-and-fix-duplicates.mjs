import { createClient } from '@supabase/supabase-js';

const url = 'https://cewrrewgnziioyujlseg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNld3JyZXdnbnppaW95dWpsc2VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTAwNzY4MCwiZXhwIjoyMTEwNTgzNjgwfQ.DglEXEs0KVe5HZLciCKzBS0lWc6rUA0iVRaUmMI7c_0';
const sb = createClient(url, key);

async function main() {
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, slug, title, items')
    .in('slug', [
      'regalos-crypto',
      'regalos-divertidos-regalos-hermano',
      'regalos-medical-school-graduate',
      'regalos-thank-you-regalos-coworkers',
      'regalos-boda',
      'regalos-secret-hermana-gift-ideas',
      'regalos-6-year-old-girl',
      'regalos-black-friday-gift-him',
      'regalos-map-lovers'
    ]);

  for (const p of posts || []) {
    const seen = new Map();
    const dups = [];
    p.items?.forEach((it, idx) => {
      if (seen.has(it.image)) {
        dups.push({ idx, heading: it.heading, prevIdx: seen.get(it.image), img: it.image });
      } else {
        seen.set(it.image, idx);
      }
    });
    console.log(`\nPost: [${p.slug}] Total items: ${p.items?.length}, Duplicates found: ${dups.length}`);
    dups.forEach(d => {
      console.log(`  Item #${d.idx + 1} "${d.heading}" duplicates item #${d.prevIdx + 1}`);
      console.log(`    URL: ${d.img.slice(0, 80)}...`);
    });
  }
}

main().catch(console.error);
