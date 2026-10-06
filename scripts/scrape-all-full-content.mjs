import fs from 'fs';
import path from 'path';

const SOURCE_LIST_FILE = path.join(process.cwd(), 'data', 'source-articles-list.json');
const OUTPUT_FILE = path.join(process.cwd(), 'data', 'full-scraped-articles.json');

const CONCURRENCY = 20;
const TIMEOUT_MS = 12000;

function cleanText(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      clearTimeout(id);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }
}

export function parseArticleFull(html, originalUrl, slug) {
  const isBlog = originalUrl.includes('/blog/') || slug.startsWith('blog/');

  // 1. Title & Meta
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  let title = titleMatch ? cleanText(titleMatch[1].replace(/\|.*$/i, '')) : '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!title && h1Match) title = cleanText(h1Match[1]);

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
  let metaDesc = descMatch ? cleanText(descMatch[1]) : '';

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i);
  let heroImage = ogImageMatch ? ogImageMatch[1].trim() : '';

  // 2. Published Date & Author
  let publishedAt = '';
  let authorName = 'Loveable Content Team';
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.datePublished) publishedAt = data.datePublished;
      if (data.author?.name) authorName = data.author.name;
      if (!heroImage && data.image) {
        heroImage = Array.isArray(data.image) ? data.image[0] : data.image;
      }
      if (!metaDesc && data.description) metaDesc = cleanText(data.description);
    } catch {}
  }

  // 3. Extract Main Article Body
  // In blog.loveable.us, the content is inside <div class="article-content prose">...</div>
  // followed by <aside class="article-store-cta"> or </article>
  const articleContentMatch = html.match(/<div class="article-content prose">([\s\S]*?)(?:<aside class="article-store-cta"|<\/article>)/i);
  const rawBodyHtml = articleContentMatch ? articleContentMatch[1].trim() : '';

  if (isBlog) {
    // For blog posts, preserve all in-content images, headings, lists, quotes
    let cleanBodyHtml = rawBodyHtml
      .replace(/<div class="table-of-content">[\s\S]*?<\/div>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .trim();

    return {
      type: 'blog',
      originalUrl,
      originalSlug: slug,
      title,
      metaDescription: metaDesc,
      heroImage,
      publishedAt,
      authorName,
      contentHtml: cleanBodyHtml,
      items: [],
    };
  }

  // 4. For Gift Guide posts:
  // Split into introHtml, items (product cards), and conclusion / buyer guide (contentHtml)
  const firstRowIdx = rawBodyHtml.indexOf('product-item-row');
  let introHtml = '';
  let conclusionHtml = '';

  if (firstRowIdx !== -1) {
    introHtml = rawBodyHtml.slice(0, firstRowIdx)
      .replace(/<div class="table-of-content">[\s\S]*?<\/div>/gi, '')
      .replace(/<h2[^>]*id=["']lov-toc-block["'][^>]*>[\s\S]*?<\/h2>/gi, '')
      .trim();
    
    const lastRowIdx = rawBodyHtml.lastIndexOf('product-item-row');
    const afterLastRow = rawBodyHtml.slice(lastRowIdx);
    const endRowMatch = afterLastRow.match(/<\/div>\s*<\/div>\s*<\/div>/i);
    if (endRowMatch) {
      const splitPoint = lastRowIdx + endRowMatch.index + endRowMatch[0].length;
      conclusionHtml = rawBodyHtml.slice(splitPoint)
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .trim();
    }
  } else {
    introHtml = rawBodyHtml;
  }

  // Extract products from product rows
  const items = [];
  const rowMatches = [...rawBodyHtml.matchAll(/class=["'][^"']*product-item-row[^"']*[\s\S]*?(?=(?:class=["'][^"']*product-item-row)|(?:<div class="container py4">)|(?:<footer)|$)/gi)];

  for (const rm of rowMatches) {
    const block = rm[0];
    
    // Heading
    const headMatch = block.match(/<h2[^>]*class=["'][^"']*item-heading[^"']*[^>]*>([\s\S]*?)<\/h2>/i);
    const itemTitleMatch = block.match(/<span[^>]*class=["'][^"']*item-title[^"']*[^>]*>([\s\S]*?)<\/span>/i);
    const rawHeading = itemTitleMatch ? itemTitleMatch[1] : (headMatch ? headMatch[1] : '');
    const heading = cleanText(rawHeading).replace(/^\d+\s*/, '');
    if (!heading) continue;

    // Link
    const linkMatch = block.match(/<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*rel=["']nofollow/i) || block.match(/<a[^>]*href=["'](https?:\/\/[^"']+)["']/i);
    const itemUrl = linkMatch ? linkMatch[1] : '';

    // Image
    const imgMatch = block.match(/<img[^>]*src=["'](https?:\/\/[^"']+)["']/i);
    const itemImg = imgMatch ? imgMatch[1] : '';

    // Description text & Pros
    const descBlockMatch = block.match(/<div[^>]*class=["'][^"']*item-content[^"']*[^>]*>([\s\S]*?)<\/div>/i);
    let descHtml = '';
    let pros = [];
    if (descBlockMatch) {
      const pContent = descBlockMatch[1];
      const paragraphs = [...pContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(p => cleanText(p[1]))
        .filter(t => t && !t.toLowerCase().includes('pros') && !t.startsWith('✔️'));
      descHtml = paragraphs.map(p => `<p>${p}</p>`).join('\n');

      const prosMatches = [...pContent.matchAll(/✔️\s*([^<]+)/g)];
      pros = prosMatches.map(m => m[1].trim()).filter(Boolean);
    }

    items.push({
      heading,
      url: itemUrl,
      image: itemImg,
      description_html: descHtml,
      pros,
    });
  }

  return {
    type: 'gift',
    originalUrl,
    originalSlug: slug,
    title,
    metaDescription: metaDesc,
    heroImage,
    publishedAt,
    authorName,
    introHtml,
    contentHtml: conclusionHtml,
    items,
  };
}

async function main() {
  console.log('=====================================================');
  console.log('🚀 FULL CONTENT SCRAPER FOR ALL 1678 ARTICLES');
  console.log('=====================================================\n');

  const sourceArticles = JSON.parse(fs.readFileSync(SOURCE_LIST_FILE, 'utf8'))
    .filter(a => a.originalSlug !== 'blog' && a.originalUrl !== 'https://blog.loveable.us/blog/');

  console.log(`Total target articles: ${sourceArticles.length}`);

  let cache = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      console.log(`Loaded existing full cache with ${Object.keys(cache).length} articles.`);
    } catch {}
  }

  const pending = sourceArticles.filter(a => {
    const existing = cache[a.originalSlug];
    if (!existing) return true;
    // If it's a blog post and has no contentHtml, re-fetch
    if ((a.originalUrl.includes('/blog/') || a.originalSlug.startsWith('blog/')) && !existing.contentHtml) return true;
    return false;
  });

  console.log(`Articles to scrape: ${pending.length} (already cached: ${sourceArticles.length - pending.length})\n`);

  if (pending.length === 0) {
    console.log('✅ All articles already fully cached!');
    return;
  }

  let completed = 0;
  let errors = 0;
  const startTime = Date.now();

  async function worker(queue) {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      try {
        const html = await fetchWithRetry(item.originalUrl);
        const parsed = parseArticleFull(html, item.originalUrl, item.originalSlug);
        cache[item.originalSlug] = parsed;
        completed++;
      } catch (err) {
        errors++;
        console.error(`Error fetching ${item.originalUrl}:`, err.message);
      }

      const total = Object.keys(cache).length;
      if (completed % 25 === 0 || queue.length === 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cache, null, 2), 'utf8');
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (completed / (Date.now() - startTime) * 1000).toFixed(1);
        console.log(`[${total}/${sourceArticles.length}] Scraped (${completed} fetched, ${errors} errors) - ${elapsedSec}s elapsed (${rate} req/s)`);
      }
    }
  }

  const queue = [...pending];
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(queue));
  }

  await Promise.all(workers);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`\n🎉 FULL SCRAPING COMPLETE! Total cached articles: ${Object.keys(cache).length}`);
}

main().catch(console.error);
