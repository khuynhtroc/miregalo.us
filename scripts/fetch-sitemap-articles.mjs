import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Fetching sitemap-0.xml from blog.loveable.us...');
  const res = await fetch('https://blog.loveable.us/sitemap-0.xml');
  const text = await res.text();
  
  const re = /<loc>(.*?)<\/loc>/g;
  let match;
  const allUrls = [];
  while ((match = re.exec(text)) !== null) {
    allUrls.push(match[1]);
  }

  const articles = [];
  for (const u of allUrls) {
    const slug = u.replace('https://blog.loveable.us/', '').replace(/\/$/, '');
    if (!slug) continue;
    if (slug.includes('page/')) continue;
    if (['about-us', 'terms', 'privacy', 'contact', 'search'].includes(slug)) continue;
    // Also skip root category hubs if they don't contain articles
    articles.push({
      originalUrl: u,
      originalSlug: slug,
    });
  }

  console.log(`Found ${articles.length} article URLs in sitemap!`);
  const outPath = path.join(process.cwd(), 'data', 'source-articles-list.json');
  fs.writeFileSync(outPath, JSON.stringify(articles, null, 2), 'utf8');
  console.log(`Saved to ${outPath}`);
}

main().catch(console.error);
