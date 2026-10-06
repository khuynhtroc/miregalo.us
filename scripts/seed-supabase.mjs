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

async function upsert(table, rows, onConflict = 'id', batchSize = 200) {
  if (!rows?.length) return;
  console.log(`⏳ Seeding ${table} (${rows.length} rows)...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await sb.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table} [${i}..${i + chunk.length}]: ${error.message}`);
    process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }
  console.log(`\n✓ ${table}: ${rows.length} rows synced successfully`);
}

// order matters for foreign keys
await upsert('authors', data.authors, 'id', 100);
await upsert('categories', data.categories, 'id', 100);
await upsert('products', data.products, 'id', 150);
await upsert('posts', data.posts, 'id', 40);
await upsert('redirects', data.redirects, 'id', 400);
await upsert('keywords', data.keywords, 'id', 200);
for (const [k, v] of Object.entries(data.settings ?? {})) {
  const { error } = await sb.from('settings').upsert({ key: k, value: v }, { onConflict: 'key' });
  if (error) throw new Error(`settings: ${error.message}`);
}
console.log(`Done – seeded Supabase from data/${file}`);
