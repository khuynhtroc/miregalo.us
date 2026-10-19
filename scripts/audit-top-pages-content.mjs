import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const data = JSON.parse(fs.readFileSync('scripts/gsc-summary.json', 'utf8'));
const topPages = data.pagesWithClicks;

async function checkTopPages() {
  console.log(`Checking ${topPages.length} pages in Supabase...`);

  const results = [];

  for (const page of topPages) {
    const rawUrl = page.url;
    // Extract slug
    let slug = rawUrl
      .replace('https://www.miregalo.us', '')
      .replace('http://www.miregalo.us', '')
      .replace(/^\/|\/$/g, '');
    
    // If starts with blog/
    const isBlog = slug.startsWith('blog/');
    const cleanSlug = slug.replace(/^blog\//, '');

    // Search in DB
    let { data: posts, error } = await sb
      .from('posts')
      .select('id, slug, title, status, intro_html, content_html, items, faqs, seo_title, seo_description, focus_keyword')
      .or(`slug.eq.${slug},slug.eq.${cleanSlug},slug.eq.regalos-${cleanSlug}`)
      .limit(1);

    if (!posts || posts.length === 0) {
      // Try search by partial slug
      const partial = cleanSlug.replace(/^regalos-/, '');
      const { data: posts2 } = await sb
        .from('posts')
        .select('id, slug, title, status, intro_html, content_html, items, faqs, seo_title, seo_description, focus_keyword')
        .ilike('slug', `%${partial}%`)
        .limit(1);
      posts = posts2;
    }

    const post = posts?.[0];
    if (post) {
      const fullText = `${post.title} ${post.intro_html || ''} ${post.content_html || ''} ${JSON.stringify(post.faqs || '')} ${JSON.stringify(post.items || '')}`;
      
      // Check for ES-EU markers
      const euMarkers = [];
      if (/\b(vosotros|vosotras|vuestro|vuestra|vuestros|vuestras|os)\b/i.test(fullText)) euMarkers.push('vosotros/vuestro');
      if (/\b(ordenador|ordenadores)\b/i.test(fullText)) euMarkers.push('ordenador');
      if (/\b(móvil|móviles)\b/i.test(fullText)) euMarkers.push('móvil');
      if (/\b(coche|coches)\b/i.test(fullText)) euMarkers.push('coche');
      if (/\b(gafas)\b/i.test(fullText)) euMarkers.push('gafas');
      if (/\b(zumo|zumos)\b/i.test(fullText)) euMarkers.push('zumo');
      if (/\b(patatas)\b/i.test(fullText)) euMarkers.push('patatas');
      if (/\b(chapa|chapas|pegatina|pegatinas)\b/i.test(fullText)) euMarkers.push('chapas/pegatinas');
      if (/\b(guay|chulo|molar|mola)\b/i.test(fullText)) euMarkers.push('guay/chulo');
      if (/€|euros?\b/i.test(fullText)) euMarkers.push('euros/€');

      // Check corrupted words
      const corruptMarkers = [];
      if (/navipapa/i.test(fullText)) corruptMarkers.push('navipapa');
      if (/perhijoaliz/i.test(fullText)) corruptMarkers.push('perhijoalizados');
      if (/hijoic/i.test(fullText)) corruptMarkers.push('hijoic');
      if (/hijogs/i.test(fullText)) corruptMarkers.push('hijogs');
      if (/abuelorent/i.test(fullText)) corruptMarkers.push('abuelorent');
      if (/davidhijo/i.test(fullText)) corruptMarkers.push('davidhijo');

      // Check internal links in content
      const internalLinks = (post.content_html || '').match(/href=["'](\/|https?:\/\/www\.miregalo\.us\/[^"']+)["']/g) || [];

      results.push({
        url: rawUrl,
        clicks: page.clicks,
        impressions: page.impressions,
        post_id: post.id,
        db_slug: post.slug,
        title: post.title,
        content_length: (post.content_html || '').length,
        items_count: post.items?.length || 0,
        internal_links_count: internalLinks.length,
        internal_links: internalLinks,
        eu_markers: euMarkers,
        corrupt_markers: corruptMarkers,
      });
    } else {
      results.push({
        url: rawUrl,
        clicks: page.clicks,
        impressions: page.impressions,
        not_found_in_db: true,
      });
    }
  }

  fs.writeFileSync('scripts/top-pages-audit.json', JSON.stringify(results, null, 2));
  console.log(`Audit finished for ${results.length} pages. Saved to scripts/top-pages-audit.json`);
  
  const found = results.filter(r => !r.not_found_in_db);
  console.log(`Found in DB: ${found.length} / ${results.length}`);
  const withEu = found.filter(r => r.eu_markers?.length > 0);
  console.log(`Pages with ES-EU markers: ${withEu.length}`);
  const withCorrupt = found.filter(r => r.corrupt_markers?.length > 0);
  console.log(`Pages with corrupted words: ${withCorrupt.length}`);
  const lowInternalLinks = found.filter(r => r.internal_links_count < 3);
  console.log(`Pages with < 3 internal links: ${lowInternalLinks.length}`);
}

checkTopPages().catch(console.error);
