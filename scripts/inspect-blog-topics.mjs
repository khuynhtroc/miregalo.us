import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: blogCats, error } = await sb.from('categories').select('*').eq('group', 'blog');
  if (error) {
    console.error(error);
    return;
  }
  console.log('Blog categories count:', blogCats.length);
  for (const c of blogCats) {
    console.log(`\nCategory: ${c.name} (${c.slug}) [ID: ${c.id}] [Hero: ${c.hero_image || 'NONE'}]`);
    
    // Check both contains on category_ids and eq on primary_category_id
    const { data: posts1 } = await sb
      .from('posts')
      .select('id, slug, title, hero_image, category_ids, primary_category_id, published_at')
      .eq('status', 'published')
      .contains('category_ids', [c.id])
      .limit(6);

    const { data: posts2 } = await sb
      .from('posts')
      .select('id, slug, title, hero_image, category_ids, primary_category_id, published_at')
      .eq('status', 'published')
      .eq('primary_category_id', c.id)
      .limit(6);

    const map = new Map();
    for (const p of [...(posts1 || []), ...(posts2 || [])]) map.set(p.id, p);
    const combined = Array.from(map.values());

    console.log(`  Total published posts found: ${combined.length}`);
    for (const p of combined) {
      console.log(`  - [${p.id}] ${p.title}`);
      console.log(`    Hero: ${p.hero_image || '(EMPTY)'}`);
    }
  }
}

main().catch(console.error);
