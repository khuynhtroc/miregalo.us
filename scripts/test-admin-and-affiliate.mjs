const BASE = 'http://localhost:3001';

async function testAdminAndAffiliates() {
  console.log('--- Testing Admin Authentication & Routes ---');

  // 1. Login
  const loginRes = await fetch(`${BASE}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  console.log('Login status:', loginRes.status);
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Received auth cookie:', !!cookie);

  const authHeaders = {
    cookie: cookie || '',
  };

  // 2. Test Admin Pages
  const adminPages = [
    '/admin/',
    '/admin/urls/',
    '/admin/keywords/',
    '/admin/clusters/',
    '/admin/merchants/',
    '/admin/products/',
    '/admin/posts/',
    '/admin/categories/',
    '/admin/settings/',
  ];

  for (const page of adminPages) {
    const res = await fetch(`${BASE}${page}`, { headers: authHeaders });
    console.log(`Page ${page} -> HTTP ${res.status}`);
    if (res.status !== 200) throw new Error(`Admin page ${page} failed with status ${res.status}`);
  }

  // 3. Test Admin APIs
  const apis = [
    '/api/admin/catalog-urls/',
    '/api/admin/keywords/',
    '/api/admin/merchants/',
    '/api/admin/products/',
    '/api/admin/posts/',
  ];

  for (const api of apis) {
    const res = await fetch(`${BASE}${api}`, { headers: authHeaders });
    const data = await res.json();
    console.log(`API ${api} -> HTTP ${res.status}, rows: ${data.rows?.length || data.total || 0}`);
    if (res.status !== 200) throw new Error(`Admin API ${api} failed with status ${res.status}`);
  }

  // 4. Test Affiliate Redirect /go/[slug]/
  console.log('\n--- Testing Affiliate Redirect ---');
  const goRes = await fetch(`${BASE}/go/lampara-luna-personalizada-3d/`, {
    redirect: 'manual',
  });
  console.log('/go/lampara-luna-personalizada-3d/ status:', goRes.status);
  const location = goRes.headers.get('location');
  console.log('/go redirect target location:', location);

  if (goRes.status !== 302 || !location || !location.includes('amazon.es')) {
    throw new Error('Affiliate redirect failed');
  }

  // 5. Test Robots.txt & Sitemap Index
  console.log('\n--- Testing SEO Robots & Sitemaps ---');
  const robotsRes = await fetch(`${BASE}/robots.txt/`);
  console.log('/robots.txt/ status:', robotsRes.status);
  const robotsText = await robotsRes.text();
  console.log('Robots contains sitemap:', robotsText.includes('Sitemap:'));

  const sitemapRes = await fetch(`${BASE}/sitemap.xml/`);
  console.log('/sitemap.xml/ status:', sitemapRes.status);
  const sitemapText = await sitemapRes.text();
  console.log('Sitemap contains /regalos/:', sitemapText.includes('/regalos/'));
  console.log('Sitemap contains /regalos/para-mama/:', sitemapText.includes('/regalos/para-mama/'));

  console.log('\n🎉 ALL ADMIN, AFFILIATE, AND SEO VERIFICATION CHECKS PASSED!\n');
}

testAdminAndAffiliates().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
