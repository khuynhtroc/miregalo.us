// scripts/test-1000-articles-acceptance.mjs
const BASE_URL = 'http://localhost:3001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { redirect: 'manual', ...options });
  let text = '';
  try {
    text = await res.text();
  } catch (e) {}
  return { status: res.status, headers: res.headers, text };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('🚀 ACCEPTANCE TEST: 1679 CLONED SPANISH ARTICLES & URL MAP');
  console.log('========================================================\n');

  // 1. Check DB Stats
  console.log('--- 1. Database Population Metrics ---');
  const fs = await import('fs');
  const db = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
  assert(db.posts.length >= 1000, `Database has >= 1000 articles (Total: ${db.posts.length})`);
  assert(db.redirects.length >= 1000, `Database has >= 1000 301 redirects (Total: ${db.redirects.length})`);
  assert(db.internal_links.length >= 2000, `Database has >= 2000 internal links (Total: ${db.internal_links.length})`);

  // 2. Test 301 Redirects from Original English URLs
  console.log('\n--- 2. Testing 301 Permanent Redirects from Original English URLs ---');
  const testRedirects = [
    { from: '/1-month-anniversary-gifts/', to: '/regalos-primer-mes-aniversario/' },
    { from: '/wooden-anniversary-gifts/', to: '/regalos-bodas-de-madera/' },
    { from: '/1-year-dating-anniversary-gifts/', to: '/regalos-1-ano-noviazgo/' },
    { from: '/10-year-anniversary-gifts-wife/', to: '/regalos-bodas-de-aluminio-10-anos-para-esposa/' },
    { from: '/about-us/', to: '/sobre-nosotros/' },
  ];

  for (const { from, to } of testRedirects) {
    const res = await request(from);
    assert(res.status === 301 || res.status === 308, `Legacy ${from} returns permanent redirect (Got ${res.status})`);
    const loc = res.headers.get('location');
    assert(loc === to, `Legacy ${from} redirects to ${to} (Got ${loc})`);
  }

  // 3. Test Spanish Cloned Articles Across Different Niches
  console.log('\n--- 3. Testing Spanish Cloned Articles (HTTP 200, SEO, Breadcrumbs, JSON-LD, Affiliate links) ---');
  const sampleArticles = [
    '/regalos-primer-mes-aniversario/',
    '/regalos-bodas-de-madera/',
    '/regalos-1-ano-noviazgo/',
    '/regalos-bodas-de-aluminio-10-anos-para-esposa/',
    '/regalos-san-valentin-para-el/',
    '/regalos-cumpleanos-para-mama/',
  ];

  for (const slug of sampleArticles) {
    const res = await request(slug);
    assert(res.status === 200, `Article ${slug} returns HTTP 200 (Got ${res.status})`);
    assert(res.text.includes('<h1'), `Article ${slug} has <h1> header`);
    assert(res.text.includes('schema.org') && res.text.includes('BlogPosting'), `Article ${slug} contains JSON-LD BlogPosting`);
    assert(res.text.includes('BreadcrumbList'), `Article ${slug} contains JSON-LD Breadcrumbs`);
    assert(res.text.includes('/regalos/'), `Article ${slug} has contextual navigation to /regalos/ silo`);
    assert(res.text.includes('/go/'), `Article ${slug} has affiliate outbound tracking links (/go/...)`);
    assert(res.text.includes('Preguntas frecuentes') || res.text.includes('FAQ'), `Article ${slug} has Spanish FAQ section`);
  }

  // 4. Test URL Catalog Silo Routes
  console.log('\n--- 4. Testing Spanish URL Map Silo Routes ---');
  const siloRoutes = [
    '/regalos/',
    '/regalos/aniversario/',
    '/regalos/para-mama/',
    '/regalos/para-papa/',
    '/regalos/para-novio/',
    '/regalos/para-novia/',
    '/regalos/cumpleanos/',
    '/regalos/navidad/',
    '/regalos/originales/',
  ];

  for (const route of siloRoutes) {
    const res = await request(route);
    assert(res.status === 200, `Silo ${route} returns HTTP 200`);
    assert(res.text.includes('<h1'), `Silo ${route} contains <h1> title`);
  }

  // 5. Test Sitemap & Robots
  console.log('\n--- 5. Testing Sitemap & Robots ---');
  const sitemapRes = await request('/sitemap.xml');
  assert(sitemapRes.status === 200, `sitemap.xml returns HTTP 200`);
  assert(sitemapRes.text.includes('/regalos-bodas-de-madera/'), `sitemap.xml contains cloned Spanish article URL`);

  const robotsRes = await request('/robots.txt');
  assert(robotsRes.status === 200, `robots.txt returns HTTP 200`);
  assert(robotsRes.text.includes('Sitemap:'), `robots.txt contains Sitemap directive`);

  console.log('\n========================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
