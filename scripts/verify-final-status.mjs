import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: categories } = await sb.from('categories').select('*').order('group').order('sort_order');
  
  // Fetch all posts with pagination beyond 1000
  let allPosts = [];
  let from = 0;
  while (true) {
    const { data, count } = await sb.from('posts').select('id, category_ids, status').range(from, from + 999);
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  console.log(`Fetched ${allPosts.length} posts from Supabase.`);

  const counts = {};
  for (const p of allPosts) {
    if (p.status !== 'published') continue;
    for (const cid of p.category_ids || []) {
      counts[cid] = (counts[cid] || 0) + 1;
    }
  }

  const groups = {};
  for (const c of categories) {
    if (c.group === 'hub' || c.group === 'blog') continue;
    groups[c.group] = groups[c.group] || [];
    groups[c.group].push({
      name: c.name,
      slug: c.slug,
      count: counts[c.id] || 0
    });
  }

  console.log('\n================ FINAL LIVE SUPABASE STATUS ================');
  for (const [grp, cats] of Object.entries(groups)) {
    console.log(`\n📌 ${grp.toUpperCase()} (${cats.length} categorías):`);
    for (const c of cats) {
      const statusIcon = c.count === 0 ? '❌ TRỐNG (0)' : (c.count < 5 ? '⚠️ ÍT' : '✅');
      console.log(`  ${statusIcon} ${c.name.padEnd(28)} [${c.slug}]: ${c.count} artículos`);
    }
  }
}

main().catch(console.error);
