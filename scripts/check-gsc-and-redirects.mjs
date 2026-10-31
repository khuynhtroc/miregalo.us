import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== CHECK GSC METRICS & DETAILED REDIRECTS ===');

  // GSC Metrics
  const { data: gsc, count: gscCount, error: gscErr } = await sb.from('gsc_metrics').select('*', { count: 'exact' }).limit(10);
  console.log('\nGSC Metrics count:', gscCount, 'Error:', gscErr?.message || 'none');
  if (gsc && gsc.length) {
    console.log('Top GSC records:', gsc);
  }

  // Redirects
  const { data: redirects, count: redCount, error: redErr } = await sb.from('redirects').select('source_path, target_path, status_code', { count: 'exact' }).limit(50);
  console.log('\nTotal redirects:', redCount, 'Error:', redErr?.message || 'none');
  
  if (redirects) {
    console.log('\nCheck 20 redirects target:');
    for (const r of redirects.slice(0, 20)) {
      const cleanSlug = r.target_path.replace(/^\/|\/$/g, '');
      const { data: p } = await sb.from('posts').select('id, slug, status').eq('slug', cleanSlug).maybeSingle();
      const { data: c } = await sb.from('categories').select('id, slug').eq('slug', cleanSlug).maybeSingle();
      const exists = p ? `POST (${p.status})` : c ? 'CATEGORY' : '❌ NOT FOUND (404)';
      console.log(`  ${r.source_path} -> ${r.target_path} [${exists}]`);
    }
  }

  // Check 24 planned posts
  const { data: planned } = await sb.from('posts').select('id, slug, title, status, published_at').eq('status', 'planned');
  console.log(`\nPlanned posts count: ${planned?.length}`);
  planned?.forEach(p => console.log(`  - ${p.published_at} | ${p.slug}`));
}

main().catch(console.error);
