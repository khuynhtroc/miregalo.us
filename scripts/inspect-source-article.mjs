async function checkArticle() {
  const url = 'https://blog.loveable.us/1-month-anniversary-gifts/';
  const res = await fetch(url);
  const html = await res.text();
  console.log('Status:', res.status);
  console.log('HTML length:', html.length);
  
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
  
  console.log('Title:', titleMatch ? titleMatch[1] : 'None');
  console.log('H1:', h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : 'None');
  console.log('Desc:', descMatch ? descMatch[1] : 'None');

  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  console.log('H2s sample (first 10):', h2s.slice(0, 10));
}
checkArticle();
