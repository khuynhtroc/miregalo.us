/**
 * test-full-site-health.mjs
 * Comprehensive live health check across all routes, categories, new posts, static pages, products, redirects, and media.
 */
const SITE = 'https://www.miregalo.us';

const CRITICAL_ROUTES = [
  '/',
  '/destinatarios/',
  '/ocasiones/',
  '/intereses/',
  '/regalos/',
  '/blog/',
  '/amigo-secreto/',
  '/navidad/',
  '/halloween/',
  '/san-valentin/',
  '/bodas/',
  '/aniversario/',
  '/cumpleanos/',
  '/para-mujeres/',
  '/para-hombres/',
  '/para-parejas/',
  '/para-mama/',
  '/para-papa/',
  '/para-amigos/',
  '/sobre-nosotros/',
  '/contacto/',
  '/faqs/',
  '/politica-de-privacidad/',
  '/terminos-y-condiciones/',
  '/politica-de-cookies/',
  '/divulgacion-de-afiliados/',
  '/blog/regalos-navidad-amazon-usa-2026/',
  '/blog/regalos-navidad-novio/',
  '/blog/regalos-navidad-menos-de-25-dolares/',
  '/blog/pijamas-navidad-familiares-a-juego/',
  '/regalos/para-mama/',
  '/regalos/para-mama/personalizados/',
  '/regalos/para-novio/',
  '/search/?q=navidad',
  '/api/search?q=navidad',
  '/sitemap.xml',
  '/rss.xml',
  '/pinterest-catalog.csv?limit=100',
];

async function check() {
  console.log(`\n🔍 Checking ${CRITICAL_ROUTES.length} critical live routes on ${SITE}...\n`);
  let passed = 0;
  let failed = 0;

  for (const route of CRITICAL_ROUTES) {
    const url = `${SITE}${route}`;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const text = await res.text();
      const hasAppError = text.includes('Application error: a server-side exception');
      const ok = res.status === 200 && !hasAppError && text.length > 100;
      if (ok) {
        passed++;
        console.log(`  ✅ [${res.status}] ${route.padEnd(45)} (${(text.length / 1024).toFixed(1)} KB)`);
      } else {
        failed++;
        console.log(`  ❌ [${res.status}] ${route.padEnd(45)} (${text.length} B) ${hasAppError ? 'SERVER EXCEPTION' : ''}`);
      }
    } catch (e) {
      failed++;
      console.log(`  ❌ [ERR] ${route.padEnd(45)} ${e.message}`);
    }
  }

  console.log(`\n📊 Summary: ${passed}/${CRITICAL_ROUTES.length} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

check();

