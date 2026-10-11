import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, slug, title, primary_category_id, hero_image, published_at, type')
    .eq('status', 'published')
    .eq('type', 'gift')
    .order('published_at', { ascending: false })
    .limit(12);

  if (error) {
    console.error(error);
    return;
  }

  const { data: cats } = await sb.from('categories').select('id, name, slug');
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
  console.log('\nLatest 12 gift posts:');
  for (const p of posts) {
    console.log(`- ID: ${p.id} | Slug: ${p.slug}`);
    console.log(`  Cat: [${catMap[p.primary_category_id] || 'NONE'}] (${p.primary_category_id})`);
    console.log(`  Title: ${p.title}`);
    console.log(`  Hero: ${p.hero_image || '(EMPTY)'}`);
    console.log(`  PublishedAt: ${p.published_at}\n`);
  }
}
main();
