async function check() {
  const r = await fetch('https://www.miregalo.us/?check=' + Date.now(), { cache: 'no-store' });
  const html = await r.text();
  console.log('HTTP Status:', r.status);
  
  const m = html.match(/"buildId":"([^"]+)"/);
  console.log('Live Build ID:', m ? m[1] : 'not found');
  console.log('Vercel ID:', r.headers.get('x-vercel-id'));

  const scriptSrcs = (html.match(/src="(\/_next\/static\/chunks\/[^"]+)"/g) || []).map(s => s.slice(5, -1));
  console.log('Found chunk scripts:', scriptSrcs.length);
  for (const src of scriptSrcs) {
    const chunkRes = await fetch('https://www.miregalo.us' + src);
    const chunkText = await chunkRes.text();
    if (chunkText.includes('SpeedInsights') || chunkText.includes('speed-insights') || chunkText.includes('analytics') || chunkText.includes('_vercel/speed-insights')) {
      console.log('  -> MATCH: Found Vercel Speed Insights / Analytics in:', src);
    }
  }
}

check().catch(console.error);
