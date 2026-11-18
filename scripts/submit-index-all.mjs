/**
 * submit-index-all.mjs
 * Submits all URLs from live sitemap.xml to IndexNow API (Bing, Yandex, Seznam, Naver)
 * and pings sitemap endpoints.
 */
const SITE_URL = 'https://www.miregalo.us';
const INDEXNOW_KEY = '8kuafx5b5urjcx5258pt885kxhzhrsgs';

async function run() {
  console.log('🔍 Fetching https://www.miregalo.us/sitemap.xml ...');
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  const xml = await res.text();
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  const urls = matches.map((m) => m[1]);
  console.log(`✅ Found ${urls.length} URLs in sitemap.xml`);

  if (urls.length === 0) {
    console.error('❌ No URLs found in sitemap.xml');
    process.exit(1);
  }

  // Submit to IndexNow in batches of 2000
  for (let i = 0; i < urls.length; i += 2000) {
    const batch = urls.slice(i, i + 2000);
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.miregalo.us',
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: batch,
      }),
    });
    console.log(`🚀 IndexNow batch [${i}..${i + batch.length}]: HTTP ${r.status}`);
  }

  // Also ping Bing IndexNow directly
  const rBing = await fetch('https://www.bing.com/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: 'www.miregalo.us',
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls.slice(0, 2000),
    }),
  });
  console.log(`🚀 Bing IndexNow direct: HTTP ${rBing.status}`);

  // Also warm up key pages so edge cache is hot for Googlebot
  const keyPages = [
    `${SITE_URL}/`,
    `${SITE_URL}/regalos/`,
    `${SITE_URL}/destinatarios/`,
    `${SITE_URL}/ocasiones/`,
    `${SITE_URL}/intereses/`,
    `${SITE_URL}/blog/`,
    `${SITE_URL}/sitemap.xml`,
    `${SITE_URL}/sitemap-index.xml`,
    `${SITE_URL}/rss.xml`,
    ...urls.slice(0, 25),
  ];
  console.log(`🔥 Warming up ${keyPages.length} key URLs on Cloudflare Edge...`);
  let okCount = 0;
  await Promise.all(
    keyPages.map(async (u) => {
      try {
        const resp = await fetch(u);
        if (resp.status === 200) okCount++;
      } catch {}
    })
  );
  console.log(`✅ Edge warmup complete: ${okCount}/${keyPages.length} returned 200 OK`);
}

run().catch(console.error);

