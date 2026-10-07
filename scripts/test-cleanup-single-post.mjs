import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function cleanHtmlImagesAndLoveable(html) {
  if (!html) return html;

  // 1. Remove srcset attributes containing loveable or all srcset from <img>
  // Notice: removing srcset from content images ensures all browsers strictly use src (which is 100% on Cloudflare R2)
  let cleaned = html.replace(/\s+srcset=["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+sizes=["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+tamaños=["'][^"']*["']/gi, '');

  // 2. Replace any leftover storage.googleapis.com/loveable.appspot.com with media.miregalo.us/media
  cleaned = cleaned.replace(/https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');

  // 3. Remove blog-admin.loveable.ai links
  cleaned = cleaned.replace(/https?:\/\/blog-admin\.loveable\.ai[^\s"'<>]+/gi, '#');

  // 4. Clean old blog.loveable.us links: rewrite to /blog/regalos-... or remove domain
  cleaned = cleaned.replace(/https?:\/\/blog\.loveable\.us\/blog\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/');
  cleaned = cleaned.replace(/https?:\/\/blog\.loveable\.us\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/');

  return cleaned;
}

async function test() {
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, slug, content_html')
    .eq('slug', 'regalos-impressive-first-date-locations')
    .single();

  if (error || !post) {
    console.error('Error fetching post:', error);
    return;
  }

  console.log('Original HTML contains loveable:', post.content_html.includes('loveable'));
  const originalMatches = post.content_html.match(/loveable/gi) || [];
  console.log('Original loveable occurrences in this post:', originalMatches.length);

  const cleaned = cleanHtmlImagesAndLoveable(post.content_html);

  console.log('Cleaned HTML contains loveable:', cleaned.includes('loveable'));
  const cleanedMatches = cleaned.match(/loveable/gi) || [];
  console.log('Remaining loveable occurrences:', cleanedMatches.length);

  // Check the specific img tag from the user's screenshot
  const imgMatches = cleaned.match(/<img[^>]+live-concert[^>]+>/gi) || [];
  console.log('\nTarget img tag after cleanup:');
  imgMatches.forEach(tag => console.log(tag));
}

test();
