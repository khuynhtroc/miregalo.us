import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

console.log('Keys in .env.local:', Object.keys(env));
console.log('GSC_CLIENT_EMAIL:', env.GSC_CLIENT_EMAIL ? 'present' : 'missing');
console.log('GSC_PRIVATE_KEY:', env.GSC_PRIVATE_KEY ? 'present' : 'missing');

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function checkSettings() {
  const { data: logs, error } = await sb.from('indexing_logs').select('*').limit(1);
  console.log('indexing_logs table exists:', !error, error ? error.message : logs);
}
checkSettings().catch(console.error);
