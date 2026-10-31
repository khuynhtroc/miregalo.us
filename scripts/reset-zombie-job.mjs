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
  const jobId = process.argv[2] || 'job-kw-047';
  const { data: job } = await sb.from('content_jobs').select('*').eq('id', jobId).single();
  if (job) {
    const payload = job.payload || {};
    payload.status = 'scheduled';
    const { error } = await sb.from('content_jobs').update({
      stage: 'research',
      payload,
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
    console.log(`Reset ${jobId} result:`, error ? error.message : 'SUCCESS');
  }
}

main().catch(console.error);
