import fs from 'fs';
import path from 'path';

const SCRAPED_FILE = path.join(process.cwd(), 'data', 'full-scraped-articles.json');
const BLOG_CAT_MAP_FILE = path.join(process.cwd(), 'data', 'blog-category-map.json');
const TRANSLATED_CACHE_FILE = path.join(process.cwd(), 'data', 'translated-articles-cache.json');
const DB_FILE = path.join(process.cwd(), 'data', 'db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'seed.json');

const CONCURRENCY = 8;
const TRANSLATE_TIMEOUT_MS = 10000;

function cleanText(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

// Memory cache for translation
const transMemCache = new Map();

async function translateChunk(text, retries = 3) {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();
  if (transMemCache.has(trimmed)) return transMemCache.get(trimmed);

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
    try {
      const url = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=es&q=' + encodeURIComponent(trimmed);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        }
      });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const result = Array.isArray(data) ? data[0] : data;
      transMemCache.set(trimmed, result);
      return result;
    } catch (err) {
      clearTimeout(id);
      if (attempt === retries) return text;
      await new Promise(r => setTimeout(r, 400 * attempt));
    }
  }
  return text;
}

function getTag(bundle, tag) {
  if (!bundle) return '';
  const re = new RegExp(`\\[\\[${tag}\\]\\]\\s*([\\s\\S]*?)(?=\\[\\[|$)`, 'i');
  const m = bundle.match(re);
  return m ? m[1].trim() : '';
}

// Translate HTML document for Blog Posts chunk by chunk
async function translateBlogHtml(html, maxChunkChars = 1400) {
  if (!html || !html.trim()) return '';

  const blocks = html.split(/(?<=<\/(?:p|h[1-6]|li|figure|blockquote|div)>)/gi).filter(b => b.trim());
  const chunks = [];
  let currentChunk = '';

  for (const block of blocks) {
    if ((currentChunk + block).length > maxChunkChars && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = block;
    } else {
      currentChunk += block;
    }
  }
  if (currentChunk.length > 0) chunks.push(currentChunk);

  const translatedChunks = await Promise.all(chunks.map(c => translateChunk(c)));
  return translatedChunks.join('\n');
}

// Taxonomy mapping for gift guides
function inferGiftCategory(slug, title) {
  const combined = `${slug} ${title}`.toLowerCase();
  if (combined.includes('san-valentin') || combined.includes('valentine')) return 'san-valentin';
  if (combined.includes('navidad') || combined.includes('christmas')) return 'navidad';
  if (combined.includes('cumplean') || combined.includes('birthday')) return 'cumpleanos';
  if (combined.includes('aniversari') || combined.includes('anniversary')) return 'aniversario';
  if (combined.includes('boda') || combined.includes('wedding')) return 'bodas';
  if (combined.includes('graduaci') || combined.includes('graduation')) return 'graduacion';
  if (combined.includes('halloween')) return 'halloween';
  if (combined.includes('nueva-casa') || combined.includes('housewarming')) return 'nueva-casa';
  if (combined.includes('mama') || combined.includes('mother') || combined.includes('mom')) return 'para-mama';
  if (combined.includes('papa') || combined.includes('father') || combined.includes('dad')) return 'para-papa';
  if (combined.includes('novio') || combined.includes('boyfriend') || combined.includes('him') || combined.includes('hombre') || combined.includes('men')) return 'para-hombres';
  if (combined.includes('novia') || combined.includes('girlfriend') || combined.includes('her') || combined.includes('mujer') || combined.includes('women')) return 'para-mujeres';
  if (combined.includes('pareja') || combined.includes('couple')) return 'para-parejas';
  if (combined.includes('nino') || combined.includes('nina') || combined.includes('kid') || combined.includes('teen') || combined.includes('bebe') || combined.includes('baby')) return 'para-ninos-y-adolescentes';
  if (combined.includes('amig') || combined.includes('friend')) return 'para-amigos';
  if (combined.includes('animal') || combined.includes('pet') || combined.includes('dog') || combined.includes('cat')) return 'animales';
  if (combined.includes('deport') || combined.includes('sport') || combined.includes('outdoor')) return 'deportes-y-aire-libre';
  return 'regalos';
}

async function processArticle(rawArticle, blogCatMap, existingRedirectMap) {
  const isBlog = rawArticle.type === 'blog' || rawArticle.originalUrl.includes('/blog/') || rawArticle.originalSlug.startsWith('blog/');
  
  if (isBlog) {
    // 1. Blog Post Translation
    const rawSlugClean = rawArticle.originalSlug.replace(/^blog\//, '').replace(/\/$/, '');
    const categorySlug = blogCatMap[rawSlugClean] || 'relaciones';

    const headerBundle = `[[TITLE]] ${rawArticle.title}\n[[META]] ${rawArticle.metaDescription || rawArticle.title}`;
    const translatedHeaderBundle = await translateChunk(headerBundle);
    const spanishTitle = getTag(translatedHeaderBundle, 'TITLE') || rawArticle.title;
    const spanishMeta = getTag(translatedHeaderBundle, 'META') || rawArticle.metaDescription;

    const existingDest = existingRedirectMap.get(`/blog/${rawSlugClean}/`);
    let spanishSlug = '';
    if (existingDest) {
      spanishSlug = existingDest.replace(/^\//, '').replace(/\/$/, '');
    } else {
      spanishSlug = slugify(spanishTitle);
    }

    const contentHtml = await translateBlogHtml(rawArticle.contentHtml);

    return {
      type: 'blog',
      originalSlug: rawArticle.originalSlug,
      originalUrl: rawArticle.originalUrl,
      spanishSlug,
      categorySlug,
      title: spanishTitle,
      metaDescription: spanishMeta,
      excerpt: spanishMeta || spanishTitle,
      heroImage: rawArticle.heroImage,
      publishedAt: rawArticle.publishedAt || new Date().toISOString(),
      authorName: rawArticle.authorName || 'Equipo Editorial Loveable',
      introHtml: '',
      contentHtml,
      items: [],
    };
  }

  // 2. Gift Guide Translation (Batched for speed)
  const categorySlug = inferGiftCategory(rawArticle.originalSlug, rawArticle.title);
  const existingDest = existingRedirectMap.get(`/${rawArticle.originalSlug}/`);

  const introClean = rawArticle.introHtml ? rawArticle.introHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const conclClean = rawArticle.contentHtml ? rawArticle.contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  
  const headerBundle = `[[TITLE]] ${rawArticle.title}\n[[META]] ${rawArticle.metaDescription}\n[[INTRO]] ${introClean}\n[[CONCL]] ${conclClean}`;
  const translatedHeaderBundle = await translateChunk(headerBundle);

  const spanishTitle = getTag(translatedHeaderBundle, 'TITLE') || rawArticle.title;
  const spanishMeta = getTag(translatedHeaderBundle, 'META') || rawArticle.metaDescription;
  const translatedIntro = getTag(translatedHeaderBundle, 'INTRO');
  const translatedConcl = getTag(translatedHeaderBundle, 'CONCL');

  let spanishSlug = '';
  if (existingDest) {
    spanishSlug = existingDest.replace(/^\//, '').replace(/\/$/, '');
  } else {
    spanishSlug = `regalos-${slugify(spanishTitle)}`;
  }

  // Batch Headings
  const items = Array.isArray(rawArticle.items) ? rawArticle.items : [];
  let allTranslatedHeadings = '';
  if (items.length > 0) {
    const headingsBundle = items.map((it, idx) => `[[H_${idx}]] ${it.heading}`).join('\n');
    allTranslatedHeadings = await translateChunk(headingsBundle);
  }

  // Batch Descriptions in chunks of ~1200 chars
  const descChunks = [];
  let currentDescChunk = '';
  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const descText = (it.description_html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const entry = `[[D_${idx}]] ${descText}\n`;
    if ((currentDescChunk + entry).length > 1200 && currentDescChunk.length > 0) {
      descChunks.push(currentDescChunk);
      currentDescChunk = entry;
    } else {
      currentDescChunk += entry;
    }
  }
  if (currentDescChunk.length > 0) descChunks.push(currentDescChunk);

  const translatedDescBundles = await Promise.all(descChunks.map(c => translateChunk(c)));
  const allTranslatedDescs = translatedDescBundles.join('\n');

  // Batch Pros
  const prosList = [];
  items.forEach((it, idx) => {
    if (Array.isArray(it.pros) && it.pros.length > 0) {
      it.pros.forEach((p, pIdx) => {
        prosList.push(`[[P_${idx}_${pIdx}]] ${p}`);
      });
    }
  });
  let allTranslatedPros = '';
  if (prosList.length > 0) {
    allTranslatedPros = await translateChunk(prosList.join('\n'));
  }

  // Parse items back
  const finalItems = items.map((it, idx) => {
    const h = getTag(allTranslatedHeadings, `H_${idx}`) || it.heading;
    const d = getTag(allTranslatedDescs, `D_${idx}`) || it.description_html;
    const pros = (it.pros || []).map((_, pIdx) => getTag(allTranslatedPros, `P_${idx}_${pIdx}`)).filter(Boolean);
    return {
      heading: h,
      url: it.url,
      image: it.image, // original image from storage.googleapis.com
      description_html: d ? `<p>${d}</p>` : (it.description_html || ''),
      pros: pros.length > 0 ? pros : (it.pros || []),
      price: '29,99 €',
      merchant: 'Amazon España / Tienda Oficial',
      button_label: 'Ver en Tienda',
    };
  });

  return {
    type: 'gift',
    originalSlug: rawArticle.originalSlug,
    originalUrl: rawArticle.originalUrl,
    spanishSlug,
    categorySlug,
    title: spanishTitle,
    metaDescription: spanishMeta,
    excerpt: spanishMeta || spanishTitle,
    heroImage: rawArticle.heroImage,
    publishedAt: rawArticle.publishedAt || new Date().toISOString(),
    authorName: rawArticle.authorName || 'Equipo Editorial Loveable',
    introHtml: translatedIntro ? `<p>${translatedIntro}</p>` : rawArticle.introHtml,
    contentHtml: translatedConcl ? `<h2>Conclusión y Consejos</h2><p>${translatedConcl}</p>` : rawArticle.contentHtml,
    items: finalItems,
  };
}

async function main() {
  console.log('=====================================================');
  console.log('🚀 HIGH-THROUGHPUT BATCH TRANSLATION & CLONING ENGINE');
  console.log('=====================================================\n');

  const scrapedData = JSON.parse(fs.readFileSync(SCRAPED_FILE, 'utf8'));
  const blogCatMap = fs.existsSync(BLOG_CAT_MAP_FILE) ? JSON.parse(fs.readFileSync(BLOG_CAT_MAP_FILE, 'utf8')) : {};
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

  const existingRedirectMap = new Map();
  if (Array.isArray(db.redirects)) {
    for (const r of db.redirects) {
      existingRedirectMap.set(r.source, r.destination);
    }
  }

  let translatedCache = {};
  if (fs.existsSync(TRANSLATED_CACHE_FILE)) {
    try {
      translatedCache = JSON.parse(fs.readFileSync(TRANSLATED_CACHE_FILE, 'utf8'));
      console.log(`Loaded existing translated cache with ${Object.keys(translatedCache).length} articles.`);
    } catch {}
  }

  const allKeys = Object.keys(scrapedData);
  const pendingKeys = allKeys.filter(k => !translatedCache[k]);

  console.log(`Total scraped articles: ${allKeys.length}`);
  console.log(`Already translated: ${Object.keys(translatedCache).length}`);
  console.log(`Pending translation: ${pendingKeys.length}\n`);

  if (pendingKeys.length > 0) {
    let completed = 0;
    const startTime = Date.now();
    const queue = [...pendingKeys];

    async function worker() {
      while (queue.length > 0) {
        const key = queue.shift();
        if (!key) break;

        const raw = scrapedData[key];
        try {
          const processed = await processArticle(raw, blogCatMap, existingRedirectMap);
          translatedCache[key] = processed;
          completed++;
        } catch (err) {
          console.error(`Error processing ${key}:`, err.message);
        }

        const totalDone = Object.keys(translatedCache).length;
        if (completed % 10 === 0 || queue.length === 0) {
          fs.writeFileSync(TRANSLATED_CACHE_FILE, JSON.stringify(translatedCache, null, 2), 'utf8');
          const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (completed / (Date.now() - startTime) * 1000).toFixed(2);
          console.log(`[${totalDone}/${allKeys.length}] Processed (${completed} new, ${rate} art/s, ${elapsedSec}s elapsed)`);
        }
      }
    }

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workers.push(worker());
    }
    await Promise.all(workers);

    fs.writeFileSync(TRANSLATED_CACHE_FILE, JSON.stringify(translatedCache, null, 2), 'utf8');
    console.log(`\n🎉 Translation step finished! Total cached: ${Object.keys(translatedCache).length}`);
  }

  // ─────────────────────────────────────────────────────────────
  // BUILD FINAL PRODUCTION DATABASE
  // ─────────────────────────────────────────────────────────────
  console.log('\n=====================================================');
  console.log('📦 ASSEMBLING FINAL PRODUCTION DATABASE');
  console.log('=====================================================');

  const catBySlug = new Map(db.categories.map(c => [c.slug, c]));

  let defaultAuthor = db.authors?.[0];
  if (!defaultAuthor) {
    defaultAuthor = {
      id: 'auth-loveable-team',
      name: 'Equipo Editorial Loveable',
      slug: 'equipo-loveable',
      bio: 'Especialistas en selección de regalos, detalles románticos e inspiración para ocasiones especiales.',
      avatar_url: '/images/author-avatar.jpg',
    };
    db.authors = [defaultAuthor];
  }

  const finalPosts = [];
  const finalProducts = [];
  const finalRedirects = [...(db.redirects || [])];
  const redirectSources = new Set(finalRedirects.map(r => r.source));

  let blogCount = 0;
  let giftCount = 0;

  for (const [key, item] of Object.entries(translatedCache)) {
    const cat = catBySlug.get(item.categorySlug) || catBySlug.get('regalos') || db.categories[0];
    const postId = `post-${item.spanishSlug}`;

    const postObj = {
      id: postId,
      type: item.type,
      slug: item.spanishSlug,
      title: item.title,
      excerpt: item.excerpt,
      meta_description: item.metaDescription,
      hero_image: item.heroImage,
      hero_alt: item.title,
      author_id: defaultAuthor.id,
      primary_category_id: cat?.id || null,
      status: 'published',
      published_at: item.publishedAt,
      created_at: item.publishedAt,
      updated_at: new Date().toISOString(),
      intro_html: item.introHtml || '',
      content_html: item.contentHtml || '',
      items: item.items || [],
      tags: [item.categorySlug, item.type],
      faqs: [],
    };

    finalPosts.push(postObj);
    if (item.type === 'blog') blogCount++;
    else giftCount++;

    // Add Products to products table
    if (Array.isArray(item.items)) {
      item.items.forEach((prod, pIdx) => {
        const prodSlug = `${item.spanishSlug}-item-${pIdx + 1}`;
        finalProducts.push({
          id: `prod-${prodSlug}`,
          post_id: postId,
          name: prod.heading,
          slug: prodSlug,
          category: item.categorySlug,
          price: prod.price || '29,99 €',
          merchant: prod.merchant || 'Amazon España',
          url: prod.url || `/go/${prodSlug}/`,
          image: prod.image, // original source image
          description: cleanText(prod.description_html) || prod.heading,
          active: true,
          rating: 4.8,
          reviews_count: 85 + (pIdx * 17) % 300,
          created_at: item.publishedAt,
        });
      });
    }

    // Add 301 Redirects
    const origSource = item.type === 'blog' ? `/blog/${item.originalSlug.replace(/^blog\//, '')}/` : `/${item.originalSlug}/`;
    const targetDest = item.type === 'blog' ? `/blog/${item.spanishSlug}/` : `/${item.spanishSlug}/`;

    if (!redirectSources.has(origSource)) {
      finalRedirects.push({
        id: `red-${item.spanishSlug}`,
        source: origSource,
        destination: targetDest,
        code: 301,
        hits: 0,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      redirectSources.add(origSource);
    }
  }

  // Preserve static pages (about-us)
  const existingPages = (db.posts || []).filter(p => p.type === 'page');
  for (const page of existingPages) {
    finalPosts.push(page);
  }

  db.posts = finalPosts;
  db.products = finalProducts;
  db.redirects = finalRedirects;

  console.log(`Total final posts: ${finalPosts.length} (${blogCount} blog, ${giftCount} gift, ${existingPages.length} pages)`);
  console.log(`Total final products: ${finalProducts.length}`);
  console.log(`Total final redirects: ${finalRedirects.length}`);

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Saved database to ${DB_FILE}`);

  fs.writeFileSync(SEED_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Saved seed to ${SEED_FILE}`);
}

main().catch(console.error);
