import fs from 'fs';
import path from 'path';

const SOURCE_LIST_FILE = path.join(process.cwd(), 'data', 'source-articles-list.json');
const CACHE_FILE = path.join(process.cwd(), 'data', 'scraped-cache.json');

const CONCURRENCY = 25;
const TIMEOUT_MS = 10000;

function cleanText(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
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
    throw err;
  }
}

function parseArticleHtml(html, originalUrl, slug) {
  // 1. Title & Meta
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  let title = titleMatch ? cleanText(titleMatch[1].replace(/\|.*$/i, '')) : '';
  
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!title && h1Match) {
    title = cleanText(h1Match[1]);
  }

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
  const metaDesc = descMatch ? cleanText(descMatch[1]) : '';

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i);
  const ogImage = ogImageMatch ? ogImageMatch[1].trim() : '';

  // 2. Published Date & Author from JSON-LD or Meta
  let publishedAt = '';
  let authorName = 'Loveable Content Team';
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.datePublished) publishedAt = data.datePublished;
      if (data.author?.name) authorName = data.author.name;
    } catch {}
  }

  // 3. Extract Products / Items
  const items = [];
  const rowMatches = [...html.matchAll(/class=["'][^"']*product-item-row[^"']*[\s\S]*?(?=(?:class=["'][^"']*product-item-row)|(?:<footer)|(?:id=["']footer)|$)/gi)];

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

    // Description text
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
    originalUrl,
    originalSlug: slug,
    title,
    metaDescription: metaDesc,
    heroImage: ogImage,
    publishedAt,
    authorName,
    items,
  };
}

async function scrapeAll() {
  console.log('=====================================================');
  console.log('🚀 STARTING COMPREHENSIVE SOURCE ARTICLE SCRAPER');
  console.log('=====================================================\n');

  const sourceArticles = JSON.parse(fs.readFileSync(SOURCE_LIST_FILE, 'utf8'));
  console.log(`Loaded ${sourceArticles.length} articles to scrape.`);

  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`Loaded existing cache with ${Object.keys(cache).length} articles.`);
    } catch {}
  }

  const pending = sourceArticles.filter(a => !cache[a.originalSlug]);
  console.log(`Remaining articles to fetch: ${pending.length}\n`);

  if (pending.length === 0) {
    console.log('✅ All articles already cached in scraped-cache.json!');
    return;
  }

  let completedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  async function worker(queue) {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      try {
        const html = await fetchWithTimeout(item.originalUrl);
        const parsed = parseArticleHtml(html, item.originalUrl, item.originalSlug);
        cache[item.originalSlug] = parsed;
        completedCount++;
      } catch (err) {
        errorCount++;
        // On error, create a minimal fallback entry so it doesn't halt the process
        cache[item.originalSlug] = {
          originalUrl: item.originalUrl,
          originalSlug: item.originalSlug,
          title: item.originalSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          metaDescription: `Best gift ideas for ${item.originalSlug.replace(/-/g, ' ')}.`,
          heroImage: '',
          publishedAt: new Date().toISOString(),
          authorName: 'Loveable Content Team',
          items: [],
        };
      }

      const totalDone = Object.keys(cache).length;
      if (totalDone % 25 === 0 || queue.length === 0) {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (completedCount / (Date.now() - startTime) * 1000).toFixed(1);
        console.log(`[${totalDone}/${sourceArticles.length}] Cached (${completedCount} fetched, ${errorCount} errors) - ${elapsedSec}s elapsed (${rate} req/s)`);
      }
    }
  }

  const queue = [...pending];
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(queue));
  }

  await Promise.all(workers);

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`\n🎉 SCRAPING COMPLETE! Total cached articles: ${Object.keys(cache).length}`);
}

scrapeAll().catch(console.error);
