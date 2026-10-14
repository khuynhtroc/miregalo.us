import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: categories } = await sb.from('categories').select('*').order('group').order('name');
  
  // Count posts per category
  let from = 0;
  let allPosts = [];
  while (true) {
    const { data } = await sb.from('posts').select('id, category_ids, primary_category_id, status').range(from, from + 999);
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const published = allPosts.filter(p => p.status === 'published');
  console.log('Total published posts in Supabase:', published.length);

  const counts = {};
  for (const p of published) {
    const cids = new Set([
      ...(p.category_ids || []),
      ...(p.primary_category_id ? [p.primary_category_id] : [])
    ]);
    for (const cid of cids) {
      counts[cid] = (counts[cid] || 0) + 1;
    }
  }

  console.log('\n--- CATEGORIES WITH 0 POSTS ---');
  const emptyCats = [];
  for (const c of categories) {
    const cnt = counts[c.id] || 0;
    if (cnt === 0) {
      emptyCats.push(c);
      console.log(`[EMPTY: 0] [${c.group}] ${c.name} (/${c.slug}/) - ID: ${c.id}`);
    }
  }

  console.log('\n--- CATEGORIES WITH 1 to 5 POSTS ---');
  for (const c of categories) {
    const cnt = counts[c.id] || 0;
    if (cnt > 0 && cnt <= 5) {
      console.log(`[FEW: ${cnt}] [${c.group}] ${c.name} (/${c.slug}/)`);
    }
  }

  console.log('\n--- SUMMARY ---');
  console.log('Total categories:', categories.length);
  console.log('Empty categories count:', emptyCats.length);

  // Group by category group
  const byGroup = {};
  for (const c of categories) {
    byGroup[c.group] = byGroup[c.group] || [];
    byGroup[c.group].push({ name: c.name, slug: c.slug, count: counts[c.id] || 0 });
  }

  for (const [grp, list] of Object.entries(byGroup)) {
    console.log(`\nGroup: ${grp.toUpperCase()} (${list.length} categories):`);
    for (const item of list) {
      console.log(`  - ${item.name.padEnd(25)} [${item.slug}]: ${item.count} posts`);
    }
  }
}

main().catch(console.error);
