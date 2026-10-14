import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectRemaining() {
  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, hero_image, items, content_html');

  console.log('=== REMAINING HERO IMAGES ===');
  posts.filter(p => p.hero_image && p.hero_image.toLowerCase().includes('loveable') && !p.hero_image.includes('media.miregalo.us/media/ai-heroes/regalos-author-loveable-content-team.jpg')).forEach(p => {
    console.log(`[Hero] ${p.slug}: ${p.hero_image}`);
  });

  console.log('\n=== REMAINING CONTENT_HTML ===');
  posts.filter(p => p.content_html && (p.content_html.toLowerCase().includes('loveable.appspot.com') || p.content_html.toLowerCase().includes('loveable.us') || p.content_html.toLowerCase().includes('loveable.ai'))).forEach(p => {
    const matches = p.content_html.match(/https?:\/\/[^\s"'<>]*loveable[^\s"'<>]*/gi) || [];
    console.log(`[Content] ${p.slug}:`, matches);
  });

  console.log('\n=== REMAINING ITEMS (SAMPLE 5) ===');
  const itemPosts = posts.filter(p => p.items && JSON.stringify(p.items).toLowerCase().includes('loveable'));
  console.log(`Total item posts remaining: ${itemPosts.length}`);
  itemPosts.slice(0, 5).forEach(p => {
    const items = p.items || [];
    const matched = items.filter(it => JSON.stringify(it).toLowerCase().includes('loveable'));
    console.log(`[Item] ${p.slug}:`, matched);
  });
}

inspectRemaining().catch(console.error);
