import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const mapped = JSON.parse(fs.readFileSync('scripts/mapped-page-queries.json', 'utf8'));
const top10Slugs = mapped.slice(0, 10).map(m => m.page.db_slug);

async function inspectTop10() {
  const { data: posts } = await sb
    .from('posts')
    .select('id, slug, title, intro_html, content_html, faqs')
    .in('slug', top10Slugs);

  for (const post of posts) {
    console.log(`\n========================================`);
    console.log(`SLUG: ${post.slug}`);
    console.log(`TITLE: ${post.title}`);
    console.log(`Intro length: ${(post.intro_html || '').length}, Content length: ${(post.content_html || '').length}`);
    console.log(`Intro snippet: ${(post.intro_html || '').substring(0, 300)}...`);
    console.log(`First 300 chars of content: ${(post.content_html || '').substring(0, 300)}...`);
    
    // Check headings
    const headings = (post.content_html || '').match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
    console.log(`Headings (${headings.length}):`, headings.slice(0, 8));
  }
}

inspectTop10().catch(console.error);
