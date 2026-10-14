async function verifySampleLiveUrls() {
  const testUrls = [
    'https://www.miregalo.us/blog/regalos-halloween-party-names/',
    'https://www.miregalo.us/blog/regalos-divertidos-halloween-costumes/',
    'https://www.miregalo.us/regalos-1-ano-noviazgo/',
    'https://www.miregalo.us/regalos-san-valentin-para-esposo/',
    'https://www.miregalo.us/regalos-5-anos-aniversario-madera/',
  ];

  console.log('=== VERIFYING LIVE URLS ON PRODUCTION ===');
  for (const url of testUrls) {
    try {
      const res = await fetch(url);
      const html = await res.text();
      const hasLoveable = html.includes('loveable.appspot.com');
      const heroMatch = html.match(/class="article-hero"[^>]*src="([^"]+)"/) || html.match(/src="(https:\/\/media\.miregalo\.us[^"]+)"/);
      console.log(`[Status ${res.status}] ${url}`);
      console.log(`   Has loveable.appspot.com: ${hasLoveable}`);
      console.log(`   Hero/Media src: ${heroMatch ? heroMatch[1].slice(0, 85) + '...' : 'none'}`);
    } catch (e) {
      console.log(`[FAIL] ${url}: ${e.message}`);
    }
  }
}

verifySampleLiveUrls().catch(console.error);
