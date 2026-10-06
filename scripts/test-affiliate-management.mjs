// scripts/test-affiliate-management.mjs
const BASE_URL = 'http://localhost:3001';

let adminCookie = '';

async function loginAdmin() {
  const res = await fetch(`${BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    redirect: 'manual',
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
  if (adminCookie && path.startsWith('/admin/')) {
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

async function run() {
  console.log('====================================================');
  console.log('🚀 TESTING AFFILIATE MANAGEMENT & MULTI-PLATFORM SYNC');
  console.log('====================================================\n');

  console.log('Authenticating Admin...');
  await loginAdmin();
  assert(!!adminCookie, `Admin cookie acquired: ${adminCookie ? 'Yes' : 'No'}`);

  // 1. Test Admin Page UI
  console.log('\n--- 1. Testing /admin/affiliate-links/ Page UI ---');
  const pageRes = await request('/admin/affiliate-links/');
  assert(pageRes.status === 200, `/admin/affiliate-links/ returns HTTP 200 (Got ${pageRes.status})`);
  assert(pageRes.text.includes('Affiliate Networks'), `Page contains Affiliate Networks header`);
  assert(pageRes.text.includes('Amazon España'), `Page displays Amazon platform`);
  assert(pageRes.text.includes('Awin Network'), `Page displays Awin platform`);
  assert(pageRes.text.includes('eBay Partner Network'), `Page displays eBay platform`);
  assert(pageRes.text.includes('Walmart Creator'), `Page displays Walmart platform`);
  assert(pageRes.text.includes('Global Affiliate Synchronizer'), `Page displays Global Synchronizer`);

  // 2. Test Affiliate Platforms API
  console.log('\n--- 2. Testing Affiliate Platforms API (GET & POST) ---');
  const getRes = await request('/api/admin/affiliate-platforms/');
  assert(getRes.status === 200, `GET /api/admin/affiliate-platforms/ returns 200`);
  const getData = JSON.parse(getRes.text);
  assert(!!getData.settings?.platforms?.amazon, `Settings contain Amazon config`);
  assert(!!getData.settings?.platforms?.awin, `Settings contain Awin config`);
  assert(!!getData.settings?.platforms?.ebay, `Settings contain eBay config`);
  assert(!!getData.settings?.platforms?.walmart, `Settings contain Walmart config`);
  assert(getData.stats?.totalItems >= 35000, `Stats show >= 35,000 managed items (Got ${getData.stats?.totalItems})`);

  // Update a platform tag
  const postRes = await request('/api/admin/affiliate-platforms/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platforms: {
        amazon: { ...getData.settings.platforms.amazon, tagOrId: 'giftblog-es-21' }
      }
    })
  });
  assert(postRes.status === 200, `POST /api/admin/affiliate-platforms/ returns 200`);
  const postData = JSON.parse(postRes.text);
  assert(postData.settings?.platforms?.amazon?.tagOrId === 'giftblog-es-21', `Amazon Tag updated successfully`);

  // 3. Test Bulk Affiliate Synchronization
  console.log('\n--- 3. Testing Bulk Affiliate Synchronizer API ---');
  const syncRes = await request('/api/admin/affiliate-platforms/sync/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategy: 'smart_distribution' })
  });
  assert(syncRes.status === 200, `POST /api/admin/affiliate-platforms/sync/ returns 200`);
  const syncData = JSON.parse(syncRes.text);
  assert(syncData.success === true, `Sync completed successfully`);
  assert(syncData.totalPostsProcessed >= 1600, `Processed >= 1600 posts (Got ${syncData.totalPostsProcessed})`);
  assert(syncData.totalItemsSynced >= 35000, `Synced >= 35,000 items (Got ${syncData.totalItemsSynced})`);
  assert(syncData.platformCounts?.amazon > 10000, `Amazon items assigned: ${syncData.platformCounts?.amazon}`);
  assert(syncData.platformCounts?.awin > 3000, `Awin items assigned: ${syncData.platformCounts?.awin}`);
  assert(syncData.platformCounts?.ebay > 3000, `eBay items assigned: ${syncData.platformCounts?.ebay}`);
  assert(syncData.platformCounts?.walmart > 2000, `Walmart items assigned: ${syncData.platformCounts?.walmart}`);

  // 4. Test Public Article Rendering with Restored Items
  console.log('\n--- 4. Testing Public Article Item Counts & Affiliate Outbound Links ---');
  const sampleArticle = '/regalos-1-ano-noviazgo/';
  const artRes = await request(sampleArticle);
  assert(artRes.status === 200, `Article ${sampleArticle} returns HTTP 200`);
  const matchesCount = (artRes.text.match(/class=["'][^"']*product-card/g) || []).length;
  assert(matchesCount >= 20, `Article renders >= 20 product cards (Got ${matchesCount})`);
  assert(artRes.text.includes('/go/'), `Article includes outbound /go/ affiliate redirects`);
  assert(artRes.text.includes('Amazon España') || artRes.text.includes('Ver en'), `Article includes localized merchant CTA button`);

  // 5. Test /go/ Outbound Redirect Routing
  console.log('\n--- 5. Testing /go/ Outbound Redirect Router ---');
  const goRes = await request('/go/amazon-regalo-destacado/');
  assert(goRes.status === 302 || goRes.status === 301, `/go/ route returns 302/301 redirect (Got ${goRes.status})`);
  const loc = goRes.headers.get('location');
  assert(loc && loc.includes('amazon'), `/go/ destination points to Amazon (Got ${loc})`);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
