import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: blogCats } = await sb.from('categories').select('*').eq('group', 'blog');
  console.log('Testing query for each blog category:');
  for (const cat of blogCats) {
    const { data: posts } = await sb
      .from('posts')
      .select('id, slug, title, hero_image, category_ids, primary_category_id')
      .eq('status', 'published')
      .eq('type', 'blog')
      .contains('category_ids', [cat.id])
      .order('published_at', { ascending: false })
      .limit(3);

    console.log(`\n[${cat.name}] (${cat.slug}) -> ${posts?.length || 0} posts found`);
    (posts || []).forEach((p, i) => {
      console.log(`  ${i+1}. [${p.id}] ${p.title} (hero: ${p.hero_image ? 'YES' : 'NONE'})`);
    });
  }
}

main().catch(console.error);
