import fs from 'fs';

const CAT_PAGES = {
  relaciones: { name: 'Relaciones de Pareja', sourceSlug: 'relationship', maxPages: 7 },
  frases: { name: 'Frases y Dedicatorias', sourceSlug: 'quotes', maxPages: 8 },
  fiestas: { name: 'Fiestas y Tradiciones', sourceSlug: 'holiday', maxPages: 12 },
  familia: { name: 'Familia', sourceSlug: 'family', maxPages: 5 },
  eventos: { name: 'Eventos y Celebraciones', sourceSlug: 'events', maxPages: 6 },
};

async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function main() {
  console.log('Crawling category listing pages to map every blog post to its true category...');
  const blogCategoryMap = {}; // slug -> category slug
  const allDiscoveredBlogUrls = new Set();

  for (const [targetCat, info] of Object.entries(CAT_PAGES)) {
    console.log(`\nCrawling category: ${info.sourceSlug} -> ${targetCat}...`);
    for (let page = 1; page <= info.maxPages; page++) {
      const url = page === 1 
        ? `https://blog.loveable.us/${info.sourceSlug}/` 
        : `https://blog.loveable.us/${info.sourceSlug}/page/${page}/`;
      
      const html = await fetchPage(url);
      if (!html) break;

      const links = [...html.matchAll(/href=["'](\/blog\/[a-z0-9-]+)\/?["']/gi)].map(m => m[1]);
      const uniqueOnPage = [...new Set(links)];
      if (uniqueOnPage.length === 0) break;

      for (const link of uniqueOnPage) {
        const cleanSlug = link.replace(/^\/blog\//, '').replace(/\/$/, '');
        if (!cleanSlug || cleanSlug.startsWith('page')) continue;
        blogCategoryMap[cleanSlug] = targetCat;
        allDiscoveredBlogUrls.add(cleanSlug);
      }
      console.log(` - Page ${page}: found ${uniqueOnPage.length} articles`);
    }
  }

  console.log(`\nTotal unique blog articles discovered via category hubs: ${allDiscoveredBlogUrls.size}`);
  
  // Also crawl /blog/ pages 1 to 32 to see if any blog post wasn't listed in the 5 categories
  console.log('\nCrawling /blog/ pagination to ensure 100% discovery...');
  for (let page = 1; page <= 35; page++) {
    const url = page === 1 ? 'https://blog.loveable.us/blog/' : `https://blog.loveable.us/blog/page/${page}/`;
    const html = await fetchPage(url);
    if (!html) break;
    const links = [...html.matchAll(/href=["'](\/blog\/[a-z0-9-]+)\/?["']/gi)].map(m => m[1]);
    const uniqueOnPage = [...new Set(links)];
    if (uniqueOnPage.length === 0) break;

    for (const link of uniqueOnPage) {
      const cleanSlug = link.replace(/^\/blog\//, '').replace(/\/$/, '');
      if (!cleanSlug || cleanSlug.startsWith('page')) continue;
      if (!blogCategoryMap[cleanSlug]) {
        // Fallback category detection based on slug
        let inferred = 'relaciones';
        if (cleanSlug.includes('quote') || cleanSlug.includes('wishes') || cleanSlug.includes('message') || cleanSlug.includes('poem')) inferred = 'frases';
        else if (cleanSlug.includes('christmas') || cleanSlug.includes('halloween') || cleanSlug.includes('valentine') || cleanSlug.includes('easter') || cleanSlug.includes('thanksgiving') || cleanSlug.includes('new-year')) inferred = 'fiestas';
        else if (cleanSlug.includes('mom') || cleanSlug.includes('dad') || cleanSlug.includes('mother') || cleanSlug.includes('father') || cleanSlug.includes('parent') || cleanSlug.includes('son') || cleanSlug.includes('daughter') || cleanSlug.includes('sister') || cleanSlug.includes('brother') || cleanSlug.includes('grand')) inferred = 'familia';
        else if (cleanSlug.includes('party') || cleanSlug.includes('birthday') || cleanSlug.includes('anniversary') || cleanSlug.includes('wedding') || cleanSlug.includes('shower') || cleanSlug.includes('ceremony') || cleanSlug.includes('graduation')) inferred = 'eventos';
        blogCategoryMap[cleanSlug] = inferred;
      }
      allDiscoveredBlogUrls.add(cleanSlug);
    }
  }

  console.log(`\nFinal unique blog articles count: ${allDiscoveredBlogUrls.size}`);
  const catDistribution = {};
  for (const [slug, cat] of Object.entries(blogCategoryMap)) {
    catDistribution[cat] = (catDistribution[cat] || 0) + 1;
  }
  console.log('Blog category distribution:');
  console.table(catDistribution);

  fs.writeFileSync('data/blog-category-map.json', JSON.stringify(blogCategoryMap, null, 2), 'utf8');
  console.log('Saved mapping to data/blog-category-map.json');
}

main().catch(console.error);
