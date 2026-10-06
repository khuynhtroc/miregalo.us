// scripts/test-phase7-phase8-spanish.mjs
const BASE_URL = 'http://localhost:3001';

let adminCookie = '';

async function loginAdmin() {
  const res = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    redirect: 'manual'
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    adminCookie = setCookie.split(';')[0];
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...(options.headers || {}) };
  if (adminCookie && path.startsWith('/api/admin/')) {
    headers['Cookie'] = adminCookie;
  }
  const res = await fetch(url, { redirect: 'manual', ...options, headers });
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
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 7 & 8 + SPANISH URL ACCEPTANCE SUITE');
  console.log('====================================================\n');

  console.log('Authenticating Admin...');
  await loginAdmin();
  assert(!!adminCookie, `Admin authenticated, cookie acquired: ${adminCookie ? 'Yes' : 'No'}`);

  // 1. TEST PHASE 7: AI Infrastructure & ContentJob
  console.log('\n--- 1. Testing Phase 7: AI Infrastructure (Mock Provider, Queue, Zod, Logs) ---');
  try {
    const enqueueRes = await request('/api/admin/jobs/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Regalos para profesores de fin de curso',
        keyword: 'regalos para profesores fin de curso',
        slug: 'regalos-profesores-fin-de-curso',
        targetLanguage: 'es',
        tone: 'warm and appreciative',
        hub: 'ocasiones',
        recipientCategory: 'profesores',
        dryRun: true // Strictly mock/dryRun - NO real tokens
      })
    });

    assert(enqueueRes.status === 201, `Enqueue ContentJob status 201 (Got ${enqueueRes.status})`);
    const jobData = JSON.parse(enqueueRes.text);
    assert(jobData.job && jobData.job.id, `Job created with ID: ${jobData.job?.id}`);
    assert(jobData.job?.status === 'completed', `Job automatically completed by engine (status: ${jobData.job?.status})`);
    assert(!!jobData.generatedPost?.title, `Article generated in Spanish: "${jobData.generatedPost?.title}"`);
    assert(jobData.generatedPost?.items?.length >= 3, `Includes >=3 affiliate product matches (${jobData.generatedPost?.items?.length})`);
    assert(jobData.generatedPost?.faqs?.length >= 3, `Includes >=3 Spanish FAQs (${jobData.generatedPost?.faqs?.length})`);
    assert(jobData.logs?.length >= 3, `Captured execution trace logs (${jobData.logs?.length} logs)`);

    // Verify job detail lookup
    const jobDetailRes = await request(`/api/admin/jobs/${jobData.job.id}/`);
    assert(jobDetailRes.status === 200, `Job detail lookup status 200`);
    const detailData = JSON.parse(jobDetailRes.text);
    assert(detailData.id === jobData.job.id, `Job details correctly retrieved matching ID`);

  } catch (err) {
    console.error('Phase 7 Error:', err);
    failed++;
  }

  // 2. TEST PHASE 8: GSC Infrastructure
  console.log('\n--- 2. Testing Phase 8: GSC Infrastructure (OAuth, Sync, Opportunities) ---');
  try {
    // Test initial GSC status
    const gscGetRes = await request('/api/admin/gsc/');
    assert(gscGetRes.status === 200, `GSC GET status 200 (Got ${gscGetRes.status})`);
    const gscData = JSON.parse(gscGetRes.text);
    assert(gscData.summary && Array.isArray(gscData.metrics), `GSC stats and summary returned`);

    // Test GSC Sync trigger
    const syncRes = await request('/api/admin/gsc/sync/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowLimit: 100 })
    });
    assert(syncRes.status === 200, `GSC Sync status 200 (Got ${syncRes.status})`);
    const syncData = JSON.parse(syncRes.text);
    assert(syncData.success === true, `GSC Sync completed successfully (Imported ${syncData.importedRows} rows, ${syncData.opportunitiesDetected} opps)`);

    // Refetch GSC opportunities
    const gscRefetch = await request('/api/admin/gsc/');
    const refreshedData = JSON.parse(gscRefetch.text);
    const striking = refreshedData.opportunities?.filter(o => o.type === 'striking_distance') || [];
    const lowCtr = refreshedData.opportunities?.filter(o => o.type === 'low_ctr') || [];
    assert(striking.length > 0, `Striking distance opportunities identified: ${striking.length}`);
    assert(lowCtr.length > 0, `Low CTR anomalies identified: ${lowCtr.length}`);

  } catch (err) {
    console.error('Phase 8 Error:', err);
    failed++;
  }

  // 3. TEST SPANISH TAXONOMY HUBS
  console.log('\n--- 3. Testing Spanish Taxonomy Hubs (HTTP 200) ---');
  const hubs = ['/regalos/', '/destinatarios/', '/ocasiones/', '/intereses/', '/blog/'];
  for (const hub of hubs) {
    const res = await request(hub);
    assert(res.status === 200, `Hub ${hub} returns HTTP 200 (Got ${res.status})`);
    assert(res.text.includes('<h1'), `Hub ${hub} contains <h1> header`);
  }

  // 4. TEST SPANISH CLONED GIFT GUIDES
  console.log('\n--- 4. Testing Spanish Cloned Gift Guides (HTTP 200, SEO, JSON-LD, Internal Links) ---');
  const sampleArticles = [
    '/regalos-primer-mes-aniversario/',
    '/regalos-san-valentin-para-el/',
    '/regalos-cumpleanos-para-mama/',
    '/regalos-2-anos-aniversario/',
    '/regalos-graduacion-academicos/',
    '/regalos-navidad-familia/',
    '/regalos-amantes-naturaleza-deporte/',
    '/regalos-san-valentin-para-ella/',
    '/regalos-dia-del-padre-espana/',
    '/regalos-boda-novios/'
  ];

  for (const slug of sampleArticles) {
    const res = await request(slug);
    assert(res.status === 200, `Article ${slug} returns HTTP 200 (Got ${res.status})`);
    assert(res.text.includes('schema.org') && (res.text.includes('BlogPosting') || res.text.includes('Article')), `Article ${slug} contains JSON-LD BlogPosting/Article Schema`);
    assert(res.text.includes('BreadcrumbList'), `Article ${slug} contains JSON-LD BreadcrumbList`);
    assert(res.text.includes('/regalos/') || res.text.includes('/ocasiones/'), `Article ${slug} contains breadcrumb navigation`);
    assert(res.text.includes('/go/'), `Article ${slug} includes affiliate outbound redirect links (/go/...)`);
    assert(res.text.includes('Preguntas frecuentes') || res.text.includes('FAQ'), `Article ${slug} contains FAQ section`);
  }

  // 5. TEST 301/308 PERMANENT REDIRECTS FROM ORIGINAL ENGLISH URLS
  console.log('\n--- 5. Testing Permanent Redirects from Original English URLs ---');
  const legacyUrls = [
    { from: '/1-month-anniversary-gifts/', to: '/regalos-primer-mes-aniversario/' },
    { from: '/valentines-day-gifts-for-him/', to: '/regalos-san-valentin-para-el/' },
    { from: '/birthday-gifts-for-mom/', to: '/regalos-cumpleanos-para-mama/' },
    { from: '/about-us/', to: '/sobre-nosotros/' }
  ];

  for (const { from, to } of legacyUrls) {
    const res = await request(from);
    assert(res.status === 301 || res.status === 308, `Legacy ${from} returns permanent redirect 301/308 (Got ${res.status})`);
    const location = res.headers.get('location');
    assert(location === to, `Legacy ${from} redirects correctly to ${to} (Got ${location})`);
  }

  // 6. TEST SITEMAP & ROBOTS
  console.log('\n--- 6. Testing Sitemap & Robots ---');
  const sitemapRes = await request('/sitemap.xml');
  assert(sitemapRes.status === 200, `sitemap.xml returns HTTP 200`);
  assert(sitemapRes.text.includes('/regalos-primer-mes-aniversario/'), `sitemap.xml contains new Spanish article URL`);
  assert(sitemapRes.text.includes('/regalos/'), `sitemap.xml contains Spanish taxonomy hub`);

  const robotsRes = await request('/robots.txt');
  assert(robotsRes.status === 200, `robots.txt returns HTTP 200`);
  assert(robotsRes.text.includes('Sitemap:'), `robots.txt specifies Sitemap URL`);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
