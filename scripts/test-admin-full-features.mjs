// scripts/test-admin-full-features.mjs
import assert from 'assert';

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
  if (adminCookie) {
    headers['Cookie'] = adminCookie;
  }
  const res = await fetch(url, { redirect: 'manual', ...options, headers });
  let text = '';
  let json = null;
  try {
    text = await res.text();
    json = JSON.parse(text);
  } catch (e) {}
  return { status: res.status, headers: res.headers, text, json };
}

let passed = 0;
let failed = 0;

function check(condition, message) {
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
  console.log('🚀 TESTING COMPLETE ADMIN UPGRADE & FULL CAPABILITIES');
  console.log('====================================================\n');

  console.log('1. Authenticating Admin...');
  await loginAdmin();
  check(!!adminCookie, `Admin session cookie acquired: ${adminCookie ? 'Yes' : 'No'}`);

  // ----------------------------------------------------
  // SECTION 1: MEDIA & MULTI-CLOUD STORAGE MANAGEMENT
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Media & Multi-Cloud Storage API ---');
  
  // 2.1 Get media list
  const mediaListRes = await request('/api/admin/media/?limit=20');
  check(mediaListRes.status === 200, `GET /api/admin/media/ returned 200`);
  check(mediaListRes.json && Array.isArray(mediaListRes.json.rows), `Media rows returned as array`);
  check((mediaListRes.json?.rows?.length || 0) >= 6, `Found seeded media files (count: ${mediaListRes.json?.rows?.length})`);
  const firstMedia = mediaListRes.json?.rows?.[0];
  check(firstMedia && firstMedia.url && firstMedia.storage_provider, `Media file has valid URL and storage_provider (${firstMedia?.storage_provider})`);

  // 2.2 Get Storage Settings
  const settingsRes = await request('/api/admin/media/settings/');
  check(settingsRes.status === 200, `GET /api/admin/media/settings/ returned 200`);
  check(settingsRes.json && settingsRes.json.cloudflare && settingsRes.json.supabase, `Settings contain Cloudflare R2 and Supabase configurations`);

  // 2.3 Update Storage Settings
  const updateSettingsRes = await request('/api/admin/media/settings/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'cloudflare_r2',
      cloudflare: {
        account_id: 'cf_test_acc_123',
        bucket_name: 'test-assets-cdn',
        public_domain: 'https://cdn.loveable.us',
      },
    }),
  });
  check(updateSettingsRes.status === 200, `POST /api/admin/media/settings/ returned 200`);
  check(updateSettingsRes.json?.provider === 'cloudflare_r2', `Storage provider updated to cloudflare_r2`);

  // 2.4 Trigger Cloud Sync
  const syncRes = await request('/api/admin/media/sync/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'cloudflare_r2' }),
  });
  check(syncRes.status === 200, `POST /api/admin/media/sync/ returned 200`);
  check(syncRes.json?.success === true && syncRes.json?.syncedCount > 0, `Sync completed successfully (synced: ${syncRes.json?.syncedCount} items)`);

  // 2.5 Add a new media asset
  const addMediaRes = await request('/api/admin/media/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Regalo Test San Valentín',
      originalName: 'san-valentin-regalo-test.jpg',
      externalUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
      altText: 'Caja sorpresa de amor y amistad',
      mimeType: 'image/jpeg',
      sizeBytes: 345000,
    }),
  });
  check(addMediaRes.status === 201, `POST /api/admin/media/ created media (status 201)`);
  const createdMediaId = addMediaRes.json?.id;
  check(!!createdMediaId, `Created media ID: ${createdMediaId}`);

  // 2.6 Patch media asset alt text
  if (createdMediaId) {
    const patchMediaRes = await request(`/api/admin/media/${createdMediaId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt_text: 'Nuevo texto alternativo optimizado para SEO' }),
    });
    check(patchMediaRes.status === 200, `PATCH /api/admin/media/${createdMediaId}/ returned 200`);
    check(patchMediaRes.json?.alt_text === 'Nuevo texto alternativo optimizado para SEO', `Alt text successfully updated`);
  }

  // 2.7 Verify /admin/media/ UI page
  const mediaPageRes = await request('/admin/media/');
  check(mediaPageRes.status === 200, `GET /admin/media/ UI rendered with 200`);
  check(mediaPageRes.text.includes('Media & Cloud Storage') || mediaPageRes.text.includes('Cloudflare R2'), `Media UI contains cloud storage elements`);

  // ----------------------------------------------------
  // SECTION 2: AI SECTION OPTIMIZATION ASSISTANT
  // ----------------------------------------------------
  console.log('\n--- 3. Testing AI Section Optimization Assistant ---');

  // 3.1 Optimize Title
  const aiTitleRes = await request('/api/admin/ai/optimize-section/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'optimize_title',
      title: 'Regalos para Aniversario',
      topic: 'regalos para aniversario de novios romanticos',
      language: 'es',
    }),
  });
  check(aiTitleRes.status === 200, `POST optimize_title returned 200`);
  check(aiTitleRes.json?.action === 'optimize_title', `AI returned optimize_title action`);
  check(Array.isArray(aiTitleRes.json?.variations) && aiTitleRes.json?.variations.length > 0, `Returned title variations (${aiTitleRes.json?.variations?.[0]})`);

  // 3.2 Optimize Intro
  const aiIntroRes = await request('/api/admin/ai/optimize-section/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'optimize_intro',
      title: '36 Mejores Regalos de 1 Año de Noviazgo',
      topic: 'aniversario 1 año',
      language: 'es',
    }),
  });
  check(aiIntroRes.status === 200, `POST optimize_intro returned 200`);
  check(aiIntroRes.json?.introHtml && aiIntroRes.json?.introHtml.length > 50, `Returned engaging Spanish hook intro`);

  // 3.3 Optimize Content advice
  const aiContentRes = await request('/api/admin/ai/optimize-section/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'optimize_content',
      title: '36 Mejores Regalos de 1 Año de Noviazgo',
      content: 'Este es el texto del artículo...',
      language: 'es',
    }),
  });
  check(aiContentRes.status === 200, `POST optimize_content returned 200`);
  check(aiContentRes.json?.contentHtml && aiContentRes.json?.contentHtml.length > 50, `Returned SEO buying guide structure HTML`);

  // 3.4 Generate Recommended Items
  const aiItemsRes = await request('/api/admin/ai/optimize-section/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_items',
      title: '36 Mejores Regalos de 1 Año de Noviazgo',
      topic: 'regalos romanticos parejas',
      count: 4,
    }),
  });
  check(aiItemsRes.status === 200, `POST generate_items returned 200`);
  check(Array.isArray(aiItemsRes.json?.items) && aiItemsRes.json?.items.length >= 4, `Returned generated gift items with prices and reason_why`);
  check(aiItemsRes.json?.items?.[0]?.heading && aiItemsRes.json?.items?.[0]?.price, `First generated item has valid heading and EUR price`);

  // 3.5 Generate FAQs
  const aiFaqsRes = await request('/api/admin/ai/optimize-section/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_faqs',
      title: '36 Mejores Regalos de 1 Año de Noviazgo',
      topic: 'aniversario parejas',
    }),
  });
  check(aiFaqsRes.status === 200, `POST generate_faqs returned 200`);
  check(Array.isArray(aiFaqsRes.json?.faqs) && aiFaqsRes.json?.faqs.length >= 3, `Returned at least 3 SEO FAQ questions and answers`);

  // 3.6 Generate SEO Meta
  const aiMetaRes = await request('/api/admin/ai/optimize-section/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'seo_meta',
      title: 'Regalos Originales de Cumpleaños para Mamá',
      topic: 'cumpleaños madre ideas',
    }),
  });
  check(aiMetaRes.status === 200, `POST seo_meta returned 200`);
  check(aiMetaRes.json?.seoTitle && aiMetaRes.json?.seoDescription, `Returned seoTitle and seoDescription`);
  check(aiMetaRes.json?.seoTitle.length <= 65, `Meta title length is within SEO limits (${aiMetaRes.json?.seoTitle.length} chars)`);

  // ----------------------------------------------------
  // SECTION 3: AFFILIATE PRODUCTS & POST ATTRIBUTION
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Affiliate Products & Post Attribution ---');

  // 4.1 Products List with Containing Posts & Traffic Breakdown
  const productsRes = await request('/api/admin/products/?limit=10');
  check(productsRes.status === 200, `GET /api/admin/products/ returned 200`);
  check(productsRes.json?.total >= 1000, `Total catalog products available (${productsRes.json?.total})`);
  check(productsRes.json?.stats?.merchantCounts, `Merchant counts stats provided`);

  const sampleProd = productsRes.json?.rows?.[0];
  check(sampleProd && sampleProd.id && sampleProd.slug, `Product has valid id and slug (${sampleProd?.slug})`);
  check(Array.isArray(sampleProd?.containing_posts), `Product includes containing_posts array`);
  check(sampleProd?.traffic_sources && (sampleProd?.traffic_sources.google_organic !== undefined || sampleProd?.traffic_sources.organic_google !== undefined), `Product includes traffic_sources attribution breakdown`);
  check(sampleProd?.ctr !== undefined, `Product includes calculated CTR percentage (${sampleProd?.ctr}%)`);

  // 4.2 Filter Products by Merchant
  const amazonFilterRes = await request('/api/admin/products/?merchant=Amazon%20Espa%C3%B1a&limit=5');
  check(amazonFilterRes.status === 200, `GET /api/admin/products/?merchant=Amazon España returned 200`);
  const allAmazon = amazonFilterRes.json?.rows?.every(p => p.merchant.includes('Amazon'));
  check(allAmazon, `Filtered rows are all from Amazon España`);

  // 4.3 Filter Products by Post Attachment
  const withPostsRes = await request('/api/admin/products/?hasPost=yes&limit=5');
  check(withPostsRes.status === 200, `GET /api/admin/products/?hasPost=yes returned 200`);
  check((withPostsRes.json?.rows?.[0]?.containing_posts?.length || 0) > 0, `Filtered product has at least 1 containing post (found: ${withPostsRes.json?.rows?.[0]?.containing_posts?.length})`);
  const containingPostInfo = withPostsRes.json?.rows?.[0]?.containing_posts?.[0];
  console.log(`    ℹ️ Example Attribution: Product "${withPostsRes.json?.rows?.[0]?.name?.slice(0, 30)}..." appears in Post "${containingPostInfo?.title?.slice(0, 30)}..." at URL ${containingPostInfo?.url}`);

  // 4.4 Update Product and Sync Redirect & Items
  const targetProdId = sampleProd.id;
  const updateProdRes = await request(`/api/admin/products/${targetProdId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price: '34,99 €',
      url: 'https://www.amazon.es/dp/B0TEST999?tag=giftblog-21',
    }),
  });
  check(updateProdRes.status === 200, `PATCH /api/admin/products/${targetProdId}/ returned 200`);
  check(updateProdRes.json?.price === '34,99 €', `Product price successfully updated to 34,99 €`);

  // 4.5 Verify /admin/products/ UI Page
  const productsPageRes = await request('/admin/products/');
  check(productsPageRes.status === 200, `GET /admin/products/ UI rendered with 200`);
  check(productsPageRes.text.includes('Affiliate Products') || productsPageRes.text.includes('Containing Articles'), `Products UI displays article attribution and affiliate columns`);

  // ----------------------------------------------------
  // SECTION 4: GOOGLE ANALYTICS (GA4) & GSC METRICS
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Google Analytics & GSC Telemetry ---');

  // 5.1 Analytics Endpoint GET
  const analyticsRes = await request('/api/admin/analytics/');
  check(analyticsRes.status === 200, `GET /api/admin/analytics/ returned 200`);
  check(analyticsRes.json?.total_sessions > 100000, `Total sessions reported (${analyticsRes.json?.total_sessions?.toLocaleString()})`);
  check(Array.isArray(analyticsRes.json?.channels) && analyticsRes.json?.channels.length >= 4, `Analytics includes traffic channels (Organic, Direct, Social, Referral)`);
  check(Array.isArray(analyticsRes.json?.top_landing_pages) && analyticsRes.json?.top_landing_pages.length >= 5, `Analytics includes top landing pages with outbound clicks`);
  check(Array.isArray(analyticsRes.json?.geo_split) && analyticsRes.json?.geo_split.length >= 5, `Analytics includes geographic user split`);

  // 5.2 Analytics Endpoint POST (save config)
  const saveAnalyticsRes = await request('/api/admin/analytics/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ga4_measurement_id: 'G-NEWTEST789',
      gsc_property: 'https://blog.loveable.us',
    }),
  });
  check(saveAnalyticsRes.status === 200, `POST /api/admin/analytics/ returned 200`);
  check(saveAnalyticsRes.json?.ga4_measurement_id === 'G-NEWTEST789', `GA4 Measurement ID saved and persisted`);

  // 5.3 Verify /admin/ Dashboard UI
  const dashboardRes = await request('/admin/');
  check(dashboardRes.status === 200, `GET /admin/ Dashboard rendered with 200`);
  check(dashboardRes.text.includes('Google Analytics 4') || dashboardRes.text.includes('Traffic Acquisition Channels'), `Dashboard renders GA4 traffic acquisition overview`);

  // ----------------------------------------------------
  // SECTION 5: POST EDITOR & AI TOOLS & MEDIA PICKER
  // ----------------------------------------------------
  console.log('\n--- 6. Testing Post Editor UI & AI Controls ---');

  const postEditorRes = await request('/admin/posts/post-anchor-regalos-1-ano-noviazgo/');
  check(postEditorRes.status === 200, `GET /admin/posts/[id]/ rendered with 200`);
  check(postEditorRes.text.includes('AI Section Optimizer') || postEditorRes.text.includes('Optimize Title') || postEditorRes.text.includes('Auto-Optimize'), `Post Editor contains AI Assistant action controls`);
  check(postEditorRes.text.includes('Pick from Media') || postEditorRes.text.includes('Media'), `Post Editor contains Media Library picker integration`);

  // ----------------------------------------------------
  // FINAL SCORECARD
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 FINAL TEST REPORT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
