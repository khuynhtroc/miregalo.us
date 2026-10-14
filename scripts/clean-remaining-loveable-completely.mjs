import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function cleanHtmlDeep(html) {
  if (!html || typeof html !== 'string') return html;
  let s = html;

  // Remove srcset, sizes
  s = s.replace(/\s+srcset=["'][^"']*["']/gi, '');
  s = s.replace(/\s+sizes=["'][^"']*["']/gi, '');
  s = s.replace(/\s+tamaños=["'][^"']*["']/gi, '');

  // Replace storage URLs
  s = s.replace(/https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');
  s = s.replace(/https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');
  s = s.replace(/https?:\/\/cdn\.loveable\.us\//gi, 'https://media.miregalo.us/media/');

  // Replace social links
  s = s.replace(/https?:\/\/(www\.)?facebook\.com\/loveable[^\s"'<>]*/gi, 'https://www.facebook.com/miregalo.us');
  s = s.replace(/https?:\/\/(www\.)?pinterest\.com\/loveable[^\s"'<>]*/gi, 'https://www.pinterest.com/miregalous');
  s = s.replace(/https?:\/\/(www\.)?linkedin\.com\/company\/loveable[^\s"'<>]*/gi, '#');

  // Replace loveable web links
  s = s.replace(/https?:\/\/blog\.loveable\.us\/blog\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/');
  s = s.replace(/https?:\/\/blog\.loveable\.us\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/');
  s = s.replace(/https?:\/\/blog\.loveable\.us\/?/gi, '/blog/');
  s = s.replace(/https?:\/\/[a-zA-Z0-9._-]+\.loveable\.(us|ai)[^\s"'<>]*/gi, '#');
  s = s.replace(/https?:\/\/loveable\.(us|ai)[^\s"'<>]*/gi, '#');

  return s;
}

function cleanItemsDeep(items) {
  if (!Array.isArray(items)) return items;
  return items.map((it) => {
    let item = { ...it };
    if (item.image) {
      item.image = item.image
        .replace(/^https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
        .replace(/^https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
        .replace(/^https?:\/\/cdn\.loveable\.us\//gi, 'https://media.miregalo.us/media/');
    }
    if (item.merchant && item.merchant.toLowerCase().includes('loveable')) {
      item.merchant = 'Miregalo Store';
    }
    if (item.url && item.url.includes('loveable')) {
      item.url = '#';
    }
    if (item.description_html) {
      item.description_html = cleanHtmlDeep(item.description_html)
        .replace(/\bLoveable\.ai\b/gi, 'Miregalo')
        .replace(/\bLoveable\b/gi, 'Miregalo');
    }
    return item;
  });
}

async function run() {
  console.log('=== POLISHING REMAINING LOVEABLE TEXT & HERO URLS ===');

  // Load from Supabase
  let allPosts = [];
  let from = 0;
  const pageSize = 500;
  while (true) {
    const { data } = await supabase
      .from('posts')
      .select('id, slug, hero_image, items, content_html')
      .range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    from += pageSize;
    if (data.length < pageSize) break;
  }

  const updatesList = [];
  for (const p of allPosts) {
    let modified = false;
    const updates = {};

    // Specific hero replacements for broken old admin URLs
    if (p.hero_image && p.hero_image.includes('blog-admin.loveable.ai')) {
      if (p.slug.includes('author') || p.slug.includes('loveable-content-team')) {
        updates.hero_image = 'https://media.miregalo.us/media/images/miregalo-logo.png';
      } else if (p.slug.includes('amigos') || p.slug.includes('amigo')) {
        updates.hero_image = 'https://media.miregalo.us/media/heroes/hero_blog_relaciones.jpg';
      } else if (p.slug.includes('father') || p.slug.includes('papa')) {
        updates.hero_image = 'https://media.miregalo.us/media/heroes/hero_blog_familia.jpg';
      } else {
        updates.hero_image = 'https://media.miregalo.us/media/heroes/hero_blog_fiestas.jpg';
      }
      modified = true;
    }

    // content_html
    if (p.content_html) {
      const cleaned = cleanHtmlDeep(p.content_html);
      if (cleaned !== p.content_html) {
        updates.content_html = cleaned;
        modified = true;
      }
    }

    // items description
    if (Array.isArray(p.items) && JSON.stringify(p.items).toLowerCase().includes('loveable')) {
      const cleaned = cleanItemsDeep(p.items);
      if (JSON.stringify(cleaned) !== JSON.stringify(p.items)) {
        updates.items = cleaned;
        modified = true;
      }
    }

    if (modified) {
      updatesList.push({ id: p.id, slug: p.slug, updates });
    }
  }

  console.log(`Updating ${updatesList.length} posts with final polish...`);
  for (const item of updatesList) {
    await supabase.from('posts').update(item.updates).eq('id', item.id);
  }

  // Also update data/db.json
  const dbData = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
  for (const p of dbData.posts || []) {
    if (p.hero_image && p.hero_image.includes('blog-admin.loveable.ai')) {
      if (p.slug.includes('author') || p.slug.includes('loveable-content-team')) {
        p.hero_image = 'https://media.miregalo.us/media/images/miregalo-logo.png';
      } else if (p.slug.includes('amigos') || p.slug.includes('amigo')) {
        p.hero_image = 'https://media.miregalo.us/media/heroes/hero_blog_relaciones.jpg';
      } else if (p.slug.includes('father') || p.slug.includes('papa')) {
        p.hero_image = 'https://media.miregalo.us/media/heroes/hero_blog_familia.jpg';
      } else {
        p.hero_image = 'https://media.miregalo.us/media/heroes/hero_blog_fiestas.jpg';
      }
    }
    if (p.content_html) {
      p.content_html = cleanHtmlDeep(p.content_html);
    }
    if (Array.isArray(p.items)) {
      p.items = cleanItemsDeep(p.items);
    }
  }
  fs.writeFileSync('data/db.json', JSON.stringify(dbData, null, 2), 'utf8');

  console.log('✅ Final polish complete on Supabase and data/db.json!');
}

run().catch(console.error);
