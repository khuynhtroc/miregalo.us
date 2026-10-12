import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: posts } = await sb.from('posts').select('id, slug, title, hero_image').eq('status', 'published');
  const noImgPosts = (posts || []).filter((p) => !p.hero_image || p.hero_image.trim() === '');
  console.log(`Published posts without hero_image: ${noImgPosts.length}`);
  noImgPosts.forEach((p) => console.log(`- [${p.id}] "${p.title}" (slug: ${p.slug})`));

  const { data: cats } = await sb.from('categories').select('id, slug, name, hero_image');
  const noImgCats = (cats || []).filter((c) => !c.hero_image || c.hero_image.trim() === '');
  console.log(`\nCategories without hero_image: ${noImgCats.length}`);
  noImgCats.forEach((c) => console.log(`- [${c.id}] "${c.name}" (slug: ${c.slug})`));
}

main().catch(console.error);
