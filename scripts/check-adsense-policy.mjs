import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: p } = await sb.from('posts').select('slug, content_html').eq('slug', 'politica-de-privacidad').single();
  const hasAdSense = p?.content_html?.includes('AdSense') || false;
  const hasAboutAds = p?.content_html?.includes('aboutads') || false;
  console.log('Politica de privacidad includes AdSense:', hasAdSense);
  console.log('Politica de privacidad includes aboutads.info:', hasAboutAds);

  const { data: c } = await sb.from('posts').select('slug, content_html').eq('slug', 'politica-de-cookies').single();
  const cHasAdSense = c?.content_html?.includes('AdSense') || false;
  console.log('Politica de cookies includes AdSense:', cHasAdSense);
}

check().catch(console.error);
