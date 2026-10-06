import fs from 'fs';
import path from 'path';

const CATALOG_PATH = path.join(process.cwd(), 'data', 'url-catalog.json');
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING URL MAP ACCEPTANCE TESTS: 92 CATALOG URLS`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  // Concurrency batch size to avoid overwhelming dev server
  const BATCH_SIZE = 5;

  for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
    const batch = catalog.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (item) => {
        const urlId = item['URL ID'];
        const urlPath = item.URL;
        const targetUrl = `${BASE_URL}${urlPath}`;
        const startTime = Date.now();

        try {
          const res = await fetch(targetUrl);
          const duration = Date.now() - startTime;

          if (res.status !== 200) {
            failed++;
            failures.push({ urlId, urlPath, error: `Expected status 200, got ${res.status}` });
            console.error(`❌ [${urlId}] ${urlPath} -> HTTP ${res.status} (${duration}ms)`);
            return;
          }

          const html = await res.text();

          // Assertions
          const hasTitle = /<title>[^<]+<\/title>/i.test(html);
          const hasCanonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html) || /<link[^>]*href=[^>]+rel=["']canonical["']/i.test(html);
          const hasBreadcrumbs = html.includes('Inicio') || html.includes('BreadcrumbList');
          const hasJsonLd = html.includes('application/ld+json');

          if (!hasTitle) {
            failed++;
            failures.push({ urlId, urlPath, error: 'Missing or empty <title>' });
            console.error(`❌ [${urlId}] ${urlPath} -> Missing <title>`);
            return;
          }

          if (!hasCanonical) {
            failed++;
            failures.push({ urlId, urlPath, error: 'Missing canonical link' });
            console.error(`❌ [${urlId}] ${urlPath} -> Missing canonical link`);
            return;
          }

          if (!hasBreadcrumbs && urlPath !== '/') {
            failed++;
            failures.push({ urlId, urlPath, error: 'Missing breadcrumbs' });
            console.error(`❌ [${urlId}] ${urlPath} -> Missing breadcrumbs`);
            return;
          }

          if (!hasJsonLd) {
            failed++;
            failures.push({ urlId, urlPath, error: 'Missing JSON-LD schema' });
            console.error(`❌ [${urlId}] ${urlPath} -> Missing JSON-LD`);
            return;
          }

          passed++;
          console.log(`✅ [${urlId}] ${urlPath} (HTTP 200, Title, Canonical, Breadcrumbs, JSON-LD) [${duration}ms]`);
        } catch (err) {
          failed++;
          failures.push({ urlId, urlPath, error: err.message });
          console.error(`❌ [${urlId}] ${urlPath} -> Network error: ${err.message}`);
        }
      })
    );
  }

  console.log(`\n======================================================`);
  console.log(`📊 TEST RESULTS SUMMARY`);
  console.log(`======================================================`);
  console.log(`Total URLs in Catalog: ${catalog.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log(`\nFailures detail:`);
    console.log(JSON.stringify(failures, null, 2));
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL 92 CATALOG URLS PASSED ACCEPTANCE TESTS!\n`);
    process.exit(0);
  }
}

runTests();
