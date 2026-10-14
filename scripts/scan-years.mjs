import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function scan() {
  console.log('Fetching all posts...');
  const { data: posts, error: pErr } = await sb.from('posts').select('id, slug, title, seo_title, seo_description, excerpt, content_html, items, faqs');
  if (pErr) {
    console.error('Error fetching posts:', pErr);
    return;
  }

  let titleHits = 0;
  let seoTitleHits = 0;
  let seoDescHits = 0;
  let excerptHits = 0;
  let contentTextHits = 0;
  let itemsHits = 0;
  let faqsHits = 0;

  const affectedPosts = [];

  for (const p of posts) {
    let pMatched = false;
    const reasons = [];

    if (p.title && /\b(202[45])\b/.test(p.title)) {
      titleHits++;
      pMatched = true;
      reasons.push(`title: "${p.title}"`);
    }
    if (p.seo_title && /\b(202[45])\b/.test(p.seo_title)) {
      seoTitleHits++;
      pMatched = true;
      reasons.push(`seo_title: "${p.seo_title}"`);
    }
    if (p.seo_description && /\b(202[45])\b/.test(p.seo_description)) {
      seoDescHits++;
      pMatched = true;
      reasons.push(`seo_desc: "${p.seo_description}"`);
    }
    if (p.excerpt && /\b(202[45])\b/.test(p.excerpt)) {
      excerptHits++;
      pMatched = true;
      reasons.push(`excerpt: "${p.excerpt.slice(0, 50)}..."`);
    }

    if (p.content_html) {
      // Remove URLs, src, href to check visible HTML text
      const textOnly = p.content_html
        .replace(/src=["'][^"']*["']/g, '')
        .replace(/href=["'][^"']*["']/g, '');
      if (/\b(202[45])\b/.test(textOnly)) {
        contentTextHits++;
        pMatched = true;
        const matches = textOnly.match(/([^\n<>.]{0,30}\b(202[45])\b[^\n<>.]{0,30})/g) || [];
        reasons.push(`content_html: ${matches.slice(0, 2).join(' | ')}`);
      }
    }

    if (p.items && Array.isArray(p.items)) {
      const itemsStr = JSON.stringify(p.items).replace(/"image":\s*"[^"]*"/g, '');
      if (/\b(202[45])\b/.test(itemsStr)) {
        itemsHits++;
        pMatched = true;
        reasons.push('items');
      }
    }

    if (p.faqs && Array.isArray(p.faqs)) {
      const faqsStr = JSON.stringify(p.faqs);
      if (/\b(202[45])\b/.test(faqsStr)) {
        faqsHits++;
        pMatched = true;
        reasons.push('faqs');
      }
    }

    if (pMatched) {
      affectedPosts.push({ id: p.id, slug: p.slug, reasons });
    }
  }

  console.log('\n--- SCAN RESULTS FOR 2024 / 2025 IN POSTS ---');
  console.log(`Total posts scanned: ${posts.length}`);
  console.log(`Total affected posts: ${affectedPosts.length}`);
  console.log(`Titles: ${titleHits}`);
  console.log(`SEO Titles: ${seoTitleHits}`);
  console.log(`SEO Descriptions: ${seoDescHits}`);
  console.log(`Excerpts: ${excerptHits}`);
  console.log(`Content HTML Text: ${contentTextHits}`);
  console.log(`Items: ${itemsHits}`);
  console.log(`FAQs: ${faqsHits}`);

  console.log('\nSample 10 affected posts:');
  affectedPosts.slice(0, 10).forEach(a => {
    console.log(`- [${a.id}] (${a.slug}):`);
    a.reasons.forEach(r => console.log(`   ${r}`));
  });

  // Now scan content_jobs
  const { data: jobs, error: jErr } = await sb.from('content_jobs').select('id, topic, payload, result');
  if (!jErr && jobs) {
    const affectedJobs = [];
    for (const j of jobs) {
      const topicMatch = j.topic && /\b(202[45])\b/.test(j.topic);
      const payloadTopicMatch = j.payload?.topic && /\b(202[45])\b/.test(j.payload.topic);
      const payloadKeywordMatch = j.payload?.primary_keyword && /\b(202[45])\b/.test(j.payload.primary_keyword);
      if (topicMatch || payloadTopicMatch || payloadKeywordMatch) {
        affectedJobs.push({
          id: j.id,
          topic: j.topic,
          payload_topic: j.payload?.topic,
          keyword: j.payload?.primary_keyword
        });
      }
    }
    console.log(`\n--- CONTENT JOBS SCAN ---`);
    console.log(`Total jobs scanned: ${jobs.length}`);
    console.log(`Total jobs with 2024/2025: ${affectedJobs.length}`);
    if (affectedJobs.length > 0) {
      console.log('Sample affected jobs:', affectedJobs.slice(0, 5));
    }
  }
}

scan();
