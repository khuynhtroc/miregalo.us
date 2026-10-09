import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [k, ...v] = line.split('=');
      env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFirstJob() {
  const { data, error } = await supabase
    .from('content_jobs')
    .select('*')
    .eq('id', 'job-kw-001')
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return;
  }

  console.log('Job KW-001 fetched successfully:');
  console.log(JSON.stringify(data, null, 2));
}

checkFirstJob();
