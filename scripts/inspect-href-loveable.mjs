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
  const { data: posts } = await supabase.from('posts').select('id, slug, content_html');
  
  let hrefLoveableCount = 0;
  let sampleHrefs = [];

  posts.forEach(p => {
    if (!p.content_html) return;
    const aTags = p.content_html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi) || [];
    aTags.forEach(tag => {
      const match = tag.match(/href=["']([^"']+)["']/i);
      if (match && match[1].includes('loveable')) {
        hrefLoveableCount++;
        if (sampleHrefs.length < 10) {
          sampleHrefs.push({ slug: p.slug, href: match[1] });
        }
      }
    });
  });

  console.log('Total <a> hrefs containing loveable in content_html:', hrefLoveableCount);
  console.log('Sample hrefs:');
  sampleHrefs.forEach(s => console.log(`- [${s.slug}] ${s.href}`));
}

run();
