import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const jobId = process.argv[2] || 'job-kw-047';

async function check() {
  const { data: job, error } = await sb.from('content_jobs').select('*').eq('id', jobId).single();
  if (error) {
    console.error('Lỗi:', error.message);
    return;
  }
  console.log(`Job [${job.id}]:`);
  console.log('Stage:', job.stage);
  console.log('Payload status:', job.payload?.status);
  console.log('Topic:', job.payload?.topic);
  console.log('Error:', job.error || 'none');
  console.log('Result:', job.result || 'none');
  console.log('Updated at:', job.updated_at);
}
check().catch(console.error);
