// Pushes data/seed.json (or data/db.json with --from-local) into Supabase.
// Usage:  node scripts/seed-supabase.mjs [--from-local]
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local and the migration applied.
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');

// tiny .env loader
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
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const file = process.argv.includes('--from-local') ? 'db.json' : 'seed.json';
const data = JSON.parse(readFileSync(path.join(root, 'data', file), 'utf8'));

async function upsert(table, rows, onConflict = 'id') {
  if (!rows?.length) return;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await sb.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`✓ ${table}: ${rows.length}`);
}

// order matters for foreign keys
await upsert('authors', data.authors);
await upsert('categories', data.categories);
await upsert('products', data.products);
await upsert('posts', data.posts);
await upsert('redirects', data.redirects);
await upsert('keywords', data.keywords);
for (const [k, v] of Object.entries(data.settings ?? {})) {
  const { error } = await sb.from('settings').upsert({ key: k, value: v }, { onConflict: 'key' });
  if (error) throw new Error(`settings: ${error.message}`);
}
console.log(`Done – seeded Supabase from data/${file}`);
