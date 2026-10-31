import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function xmlAttr(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cdata(str) {
  return `<![CDATA[${(str || '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

async function testRssGen() {
  const { data: posts } = await sb
    .from('posts')
    .select('id, slug, title, excerpt, intro_html, hero_image, published_at, created_at, author_id, primary_category_id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  console.log(`Fetched ${posts.length} posts`);

  let itemsXml = posts.map((p) => {
    const url = `https://www.miregalo.us/${p.slug}/`;
    const pubDate = new Date(p.published_at || p.created_at).toUTCString();
    const heroUrl = p.hero_image || '';
    const safeHero = xmlAttr(heroUrl);
    const cleanPath = heroUrl.split('?')[0].toLowerCase();
    const mime = cleanPath.endsWith('.png') ? 'image/png' : cleanPath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
    
    let mediaTags = '';
    if (safeHero) {
      mediaTags = `\n      <media:content url="${safeHero}" medium="image"/>\n      <enclosure url="${safeHero}" length="0" type="${mime}"/>`;
    }

    const desc = p.excerpt || p.title;

    return `    <item>
      <title>${cdata(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${cdata(desc)}</description>
      <content:encoded>${cdata(p.intro_html || desc)}</content:encoded>${mediaTags}
    </item>`;
  }).join('\n');

  console.log('Sample item mediaTags:', itemsXml.slice(0, 500));
}

testRssGen().catch(console.error);
