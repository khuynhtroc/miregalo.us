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

  const patterns = {
    storageGoogleapis: 0,
    blogAdminLoveableAi: 0,
    blogLoveableUs: 0,
    loveableUs: 0,
    loveableAi: 0,
    otherLoveable: []
  };

  posts.forEach(p => {
    if (!p.content_html) return;
    const matches = p.content_html.match(/https?:\/\/[^\s"'<>\\]*loveable[^\s"'<>\\]*/gi) || [];
    matches.forEach(url => {
      if (url.includes('storage.googleapis.com/loveable.appspot.com')) {
        patterns.storageGoogleapis++;
      } else if (url.includes('blog-admin.loveable.ai')) {
        patterns.blogAdminLoveableAi++;
      } else if (url.includes('blog.loveable.us')) {
        patterns.blogLoveableUs++;
      } else if (url.includes('loveable.us')) {
        patterns.loveableUs++;
      } else if (url.includes('loveable.ai')) {
        patterns.loveableAi++;
      } else {
        patterns.otherLoveable.push(url);
      }
    });
  });

  console.log('=== Breakdown of Loveable URLs in content_html ===');
  console.log('1. storage.googleapis.com/loveable.appspot.com (mostly srcset):', patterns.storageGoogleapis);
  console.log('2. blog-admin.loveable.ai:', patterns.blogAdminLoveableAi);
  console.log('3. blog.loveable.us (internal blog links):', patterns.blogLoveableUs);
  console.log('4. loveable.us (product/affiliate links):', patterns.loveableUs);
  console.log('5. loveable.ai:', patterns.loveableAi);
  console.log('6. Other loveable:', patterns.otherLoveable.length);
}

run();
