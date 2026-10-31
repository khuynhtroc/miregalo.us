import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data: jobs } = await sb.from('content_jobs').select('*').in('id', ['job-kw-047', 'job-kw-041', 'job-kw-036']);
  console.log(JSON.stringify(jobs, null, 2));
}
inspect().catch(console.error);
