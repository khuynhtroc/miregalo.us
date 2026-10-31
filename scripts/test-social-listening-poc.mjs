// Standalone Social Listening POC

async function fetchGoogleTrends() {
  console.log('1. Đang quét dữ liệu thời gian thực từ Google Trends US...');
  const res = await fetch('https://trends.google.com/trending/rss?geo=US', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const xml = await res.text();

  const items = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

  for (const itemXml of itemMatches.slice(0, 10)) {
    const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '';
    const traffic = itemXml.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1]?.trim() || 'N/A';
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
    const newsTitle = itemXml.match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/)?.[1]?.trim() || '';
    const newsUrl = itemXml.match(/<ht:news_item_url>([\s\S]*?)<\/ht:news_item_url>/)?.[1]?.trim() || '';
    const picture = itemXml.match(/<ht:picture>([\s\S]*?)<\/ht:picture>/)?.[1]?.trim() || '';

    items.push({
      topic: title,
      traffic,
      pubDate,
      newsTitle,
      newsUrl,
      picture
    });
  }
  return items;
}

async function fetchTrendHunter() {
  console.log('2. Đang quét tin tức sản phẩm & quà tặng viral từ Trend Hunter...');
  try {
    const res = await fetch('https://www.trendhunter.com/rss', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const xml = await res.text();
    const items = [];
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const itemXml of itemMatches.slice(0, 5)) {
      const title = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
                    itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
      const cleanTitle = title.replace(/\(TrendHunter\.com\)/gi, '').trim();

      items.push({
        topic: cleanTitle,
        link,
        pubDate
      });
    }
    return items;
  } catch (err) {
    console.warn('Lỗi quét TrendHunter:', err.message);
    return [];
  }
}

async function main() {
  const gTrends = await fetchGoogleTrends();
  const tHunter = await fetchTrendHunter();

  console.log(`\n✓ Quét được ${gTrends.length} xu hướng nóng từ Google Trends US`);
  console.log(`✓ Quét được ${tHunter.length} sản phẩm viral từ Trend Hunter`);

  console.log('\n--- TOP 5 GOOGLE TRENDS HIỆN TẠI (US) ---');
  gTrends.slice(0, 5).forEach((t, i) => {
    console.log(`${i + 1}. [${t.traffic}] ${t.topic}`);
    console.log(`   Tin tức: "${t.newsTitle}"`);
    console.log(`   Thời gian: ${t.pubDate}`);
  });

  console.log('\n--- TOP 3 SẢN PHẨM VIRAL MỚI NHẤT (TREND HUNTER) ---');
  tHunter.slice(0, 3).forEach((t, i) => {
    console.log(`${i + 1}. ${t.topic}`);
    console.log(`   Link: ${t.link}`);
  });
}

main().catch(console.error);
