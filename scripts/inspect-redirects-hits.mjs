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
  const { data: redirects, count } = await sb.from('redirects').select('*', { count: 'exact' }).limit(30);
  console.log(`Total Redirects count: ${count}`);
  console.log('Sample 30 rows:');
  redirects?.forEach((r, i) => {
    console.log(`${i + 1}. [Hits: ${r.hits || 0}] "${r.source}" -> "${r.destination}"`);
  });

  // Check top hits in redirects
  const { data: topHits } = await sb.from('redirects').select('*').order('hits', { ascending: false }).limit(20);
  console.log('\nTop 20 redirects by HITS:');
  topHits?.forEach((r, i) => {
    console.log(`${i + 1}. [Hits: ${r.hits}] "${r.source}" -> "${r.destination}"`);
  });
}

main().catch(console.error);
