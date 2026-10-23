import 'server-only';

export interface TrendingItem {
  id: string;
  topic: string;
  source: 'Google Trends US' | 'Variety' | 'Trend Hunter' | 'People' | 'Rolling Stone';
  traffic: string;
  newsHeadline: string;
  newsUrl: string;
  picture: string;
  pubDate: string;
  hoursAgo: number;
  score: number;
  giftAngle: string;
  category: string;
}

/**
 * Parses XML text safely without external dependencies
 */
function extractTagContent(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const standardRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(standardRegex);
  return match ? match[1].trim() : '';
}

/**
 * Calculates hours difference from a date string to now
 */
function getHoursAgo(dateStr: string): number {
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  } catch {
    return 12;
  }
}

/**
 * Evaluates the Gift Angle & Virality Score (0 - 100)
 */
function evaluateTrendGiftScore(topic: string, headline: string, traffic: string, hoursAgo: number): { score: number; giftAngle: string; category: string } {
  let score = 50;
  const text = `${topic} ${headline}`.toLowerCase();

  // Traffic velocity bonus
  if (traffic.includes('100K+') || traffic.includes('200K+')) score += 25;
  else if (traffic.includes('50K+')) score += 20;
  else if (traffic.includes('20K+')) score += 15;
  else if (traffic.includes('10K+')) score += 10;
  else if (traffic.includes('5000+')) score += 5;

  // Freshness bonus (Gold window: 2 to 18 hours)
  if (hoursAgo >= 1 && hoursAgo <= 12) score += 15;
  else if (hoursAgo <= 24) score += 10;
  else score -= 15;

  // Commercial / Gift affinity keywords
  const giftKeywords = [
    'shoes', 'sneakers', 'release', 'drop', 'collection', 'edition', 'collab',
    'toy', 'game', 'album', 'movie', 'costume', 'halloween', 'christmas', 'holiday',
    'merch', 'jacket', 'outfit', 'style', 'dress', 'fashion', 'gift', 'gadget',
    'watch', 'perfume', 'makeup', 'beauty', 'viral', 'trend', 'flavor', 'limited'
  ];

  let matches = 0;
  for (const kw of giftKeywords) {
    if (text.includes(kw)) matches++;
  }
  score += Math.min(25, matches * 7);

  // Exclude negative / non-commercial hard news (accidents, crimes, heavy politics)
  const excludeKeywords = ['crash', 'killed', 'murder', 'shooting', 'arrested', 'lawsuit', 'funeral', 'court', 'trial'];
  for (const neg of excludeKeywords) {
    if (text.includes(neg)) score -= 40;
  }

  score = Math.max(10, Math.min(99, score));

  // Determine angle and category
  let category = 'Pop Culture & Lifestyle';
  let giftAngle = `Cómo sumarse a la tendencia de ${topic} y los mejores productos temáticos para regalar a fanáticos.`;

  if (text.includes('shoe') || text.includes('sneaker') || text.includes('fashion') || text.includes('outfit')) {
    category = 'Moda & Sneakers Viral';
    giftAngle = `Lanzamiento exclusivo y cómo conseguir el look o las alternativas de moda más buscadas de ${topic}.`;
  } else if (text.includes('movie') || text.includes('trailer') || text.includes('series') || text.includes('actor') || text.includes('film')) {
    category = 'Cine & Entretenimiento';
    giftAngle = `El fenómeno de ${topic} en pantalla y el merchandising oficial / regalos de colección imprescindibles.`;
  } else if (text.includes('halloween') || text.includes('costume') || text.includes('spooky') || text.includes('disfraz')) {
    category = 'Halloween & Festividades';
    giftAngle = `Ideas de disfraces y detalles de última hora inspirados en el viral de ${topic} para celebrar este octubre.`;
  } else if (text.includes('gadget') || text.includes('tech') || text.includes('game') || text.includes('app')) {
    category = 'Tecnología & Ocio';
    giftAngle = `La novedad tecnológica o juego de ${topic} que todos quieren tener y dónde comprarlo hoy.`;
  }

  return { score, giftAngle, category };
}

/**
 * 1. Fetch Realtime & Daily Trends from Google Trends US RSS
 */
export async function fetchGoogleTrendsUS(): Promise<TrendingItem[]> {
  try {
    const res = await fetch('https://trends.google.com/trending/rss?geo=US', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Google Trends HTTP ${res.status}`);
    const xml = await res.text();

    const items: TrendingItem[] = [];
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    for (let i = 0; i < itemMatches.length; i++) {
      const itemXml = itemMatches[i];
      const topic = extractTagContent(itemXml, 'title');
      const traffic = extractTagContent(itemXml, 'ht:approx_traffic') || '10K+';
      const pubDate = extractTagContent(itemXml, 'pubDate') || new Date().toISOString();
      const newsHeadline = extractTagContent(itemXml, 'ht:news_item_title') || topic;
      const newsUrl = extractTagContent(itemXml, 'ht:news_item_url');
      const picture = extractTagContent(itemXml, 'ht:picture') || extractTagContent(itemXml, 'ht:news_item_picture');
      const hoursAgo = getHoursAgo(pubDate);

      const { score, giftAngle, category } = evaluateTrendGiftScore(topic, newsHeadline, traffic, hoursAgo);

      items.push({
        id: `gt-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
        topic,
        source: 'Google Trends US',
        traffic,
        newsHeadline,
        newsUrl,
        picture: picture || 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&auto=format&fit=crop&q=80',
        pubDate,
        hoursAgo,
        score,
        giftAngle,
        category,
      });
    }

    return items;
  } catch (err: any) {
    console.warn('[Social Listener] Google Trends RSS fetch error:', err.message);
    return [];
  }
}

/**
 * 2. Fetch Top US Entertainment & Culture Feeds (Variety, People)
 */
export async function fetchEntertainmentTrends(): Promise<TrendingItem[]> {
  const feeds = [
    { name: 'Variety' as const, url: 'https://variety.com/feed/' },
    { name: 'People' as const, url: 'https://people.com/feed/' },
  ];

  const items: TrendingItem[] = [];

  for (const f of feeds) {
    try {
      const res = await fetch(f.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

      for (const itemXml of itemMatches.slice(0, 8)) {
        const title = extractTagContent(itemXml, 'title');
        const link = extractTagContent(itemXml, 'link');
        const pubDate = extractTagContent(itemXml, 'pubDate');
        const hoursAgo = getHoursAgo(pubDate);

        // Find media thumbnail
        const mediaMatch = itemXml.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
        const picture = mediaMatch ? mediaMatch[1] : '';

        const { score, giftAngle, category } = evaluateTrendGiftScore(title, title, '20K+', hoursAgo);

        items.push({
          id: `ent-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40)}`,
          topic: title,
          source: f.name,
          traffic: 'Viral Pop Culture',
          newsHeadline: title,
          newsUrl: link,
          picture: picture || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80',
          pubDate,
          hoursAgo,
          score,
          giftAngle,
          category,
        });
      }
    } catch (err: any) {
      console.warn(`[Social Listener] Error fetching ${f.name}:`, err.message);
    }
  }

  return items;
}

/**
 * 3. Fetch Gift News Releases & Viral Product Drops (Trend Hunter)
 */
export async function fetchGiftDropTrends(): Promise<TrendingItem[]> {
  try {
    const res = await fetch('https://www.trendhunter.com/rss', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    const items: TrendingItem[] = [];

    for (const itemXml of itemMatches.slice(0, 10)) {
      const rawTitle = extractTagContent(itemXml, 'title');
      const title = rawTitle.replace(/\(TrendHunter\.com\)/gi, '').trim();
      const link = extractTagContent(itemXml, 'link');
      const pubDate = extractTagContent(itemXml, 'pubDate');
      const hoursAgo = getHoursAgo(pubDate);

      const enclosureMatch = itemXml.match(/<enclosure\s+url=["']([^"']+)["']/i);
      const picture = enclosureMatch ? enclosureMatch[1] : '';

      const { score, giftAngle, category } = evaluateTrendGiftScore(title, title, 'Product Drop', hoursAgo);

      items.push({
        id: `th-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40)}`,
        topic: title,
        source: 'Trend Hunter',
        traffic: 'Product Release',
        newsHeadline: title,
        newsUrl: link,
        picture: picture || 'https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=800&auto=format&fit=crop&q=80',
        pubDate,
        hoursAgo,
        score: Math.min(99, score + 10), // Boost product drops
        giftAngle,
        category: 'Lanzamientos & Novedades',
      });
    }

    return items;
  } catch (err: any) {
    console.warn('[Social Listener] Error fetching Trend Hunter:', err.message);
    return [];
  }
}

/**
 * Combined Aggregator: Fetches, deduplicates, and ranks all trends across US channels
 */
export async function scanAllLiveTrends(): Promise<TrendingItem[]> {
  const [googleTrends, entTrends, dropTrends] = await Promise.all([
    fetchGoogleTrendsUS(),
    fetchEntertainmentTrends(),
    fetchGiftDropTrends(),
  ]);

  const all = [...googleTrends, ...entTrends, ...dropTrends];

  // Deduplicate by normalized topic name
  const seen = new Set<string>();
  const uniqueTrends: TrendingItem[] = [];

  for (const item of all) {
    const key = item.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTrends.push(item);
  }

  // Sort descending by Virality / Gift Score
  uniqueTrends.sort((a, b) => b.score - a.score);

  return uniqueTrends;
}
