import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: posts } = await supabase.from('posts').select('id, slug, items');
  for (const p of posts) {
    const s = JSON.stringify(p.items);
    if (s && s.includes('loveable')) {
      console.log('Post:', p.slug);
      const m = s.match(/[^"]*loveable[^"]*/g);
      console.log('Matches:', m ? m.slice(0, 5) : 'none');
      break;
    }
  }
}

run();
