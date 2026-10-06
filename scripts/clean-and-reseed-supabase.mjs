import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');

for (const f of ['.env.local', '.env']) {
  const p = path.join(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { persistSession: false } });

async function clean() {
  console.log('Cleaning old obsolete rows from Supabase...');
  // Delete old redirects
  console.log('Deleting old redirects...');
  await sb.from('redirects').delete().neq('id', '__keep__');
  
  // Delete old products
  console.log('Deleting old products...');
  await sb.from('products').delete().neq('id', '__keep__');

  // Delete old posts
  console.log('Deleting old posts...');
  await sb.from('posts').delete().neq('id', '__keep__');

  console.log('✅ Cleaned Supabase. Now ready for fresh re-seed.');
}

clean().catch(console.error);
