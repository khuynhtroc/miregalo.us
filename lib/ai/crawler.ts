import 'server-only';
import { stripHtml } from '@/lib/format';

export interface ScrapedArticle {
  source_url: string;
  slug: string;
  title: string;
  excerpt: string;
  hero_image?: string;
  intro_text: string;
  items: Array<{
    heading: string;
    image?: string;
    description: string;
    pros: string[];
    price?: string;
    merchant?: string;
  }>;
  body_text: string;
  faqs: Array<{ q: string; a: string }>;
}

/**
 * Scrapes an article from https://blog.loveable.us/[slug]/ and extracts its structured data.
 */
export async function scrapeSourceArticle(urlOrSlug: string): Promise<ScrapedArticle | null> {
  const url = urlOrSlug.startsWith('http')
    ? urlOrSlug
    : `https://blog.loveable.us/${urlOrSlug.replace(/^\/+|\/+$/g, '')}/`;

  const slug = url.replace('https://blog.loveable.us/', '').replace(/\/$/, '');

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`Failed to fetch source article: ${url} (${res.status})`);
      return null;
    }

    const html = await res.text();

    // Extract Title
    let title = '';
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch) title = stripHtml(titleMatch[1]);
    if (!title) {
      const metaTitleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      if (metaTitleMatch) title = stripHtml(metaTitleMatch[1]).split('|')[0].trim();
    }

    // Extract Excerpt / Deck
    let excerpt = '';
    const deckMatch = html.match(/class=["'][^"']*article-deck[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
    if (deckMatch) {
      excerpt = stripHtml(deckMatch[1]);
    } else {
      const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
      if (metaDesc) excerpt = metaDesc[1];
    }

    // Extract Hero Image
    let hero_image = '';
    const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    if (ogImgMatch) hero_image = ogImgMatch[1];

    // Extract Numbered Product Items
    const items: ScrapedArticle['items'] = [];
    const itemRegex = /<div[^>]*class=["'][^"']*(?:product-card|product-item-row)[^"']*["'][^>]*id=["']item-(\d+)["'][\s\S]*?(?=<div[^>]*class=["'][^"']*(?:product-card|product-item-row)[^"']*["']|$)/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(html)) !== null) {
      const chunk = itemMatch[0];
      const hMatch = chunk.match(/<h2[^>]*>[\s\S]*?<span[^>]*class=["']item-title["'][^>]*>([\s\S]*?)<\/span>/i) ||
                     chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      const heading = hMatch ? stripHtml(hMatch[1]).replace(/^\d+\.\s*/, '') : `Gift Idea ${items.length + 1}`;

      const imgMatch = chunk.match(/<img[^>]*src=["']([^"']+)["']/i);
      const image = imgMatch ? imgMatch[1] : undefined;

      const descMatch = chunk.match(/<div[^>]*class=["'][^"']*item-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      const descRaw = descMatch ? descMatch[1] : '';

      // Extract pros
      const pros: string[] = [];
      const proMatches = descRaw.matchAll(/✔️\s*([^<]+)/gi);
      for (const pm of proMatches) {
        pros.push(pm[1].trim());
      }

      // Extract price
      let price: string | undefined;
      const priceMatch = descRaw.match(/Price:\s*([^•<\n]+)/i);
      if (priceMatch) price = priceMatch[1].trim();

      // Extract merchant
      let merchant: string | undefined;
      const merchMatch = descRaw.match(/•\s*([^<\n]+)/i);
      if (merchMatch) merchant = merchMatch[1].trim();

      const cleanDesc = stripHtml(descRaw)
        .replace(/✔️[^.]+\.?/g, '')
        .replace(/Price:.*$/i, '')
        .trim();

      items.push({
        heading,
        image,
        description: cleanDesc,
        pros,
        price,
        merchant,
      });
    }

    // Extract FAQs
    const faqs: ScrapedArticle['faqs'] = [];
    const faqRegex = /<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>[\s\S]*?<\/details>/gi;
    let faqMatch: RegExpExecArray | null;
    while ((faqMatch = faqRegex.exec(html)) !== null) {
      faqs.push({
        q: stripHtml(faqMatch[1]),
        a: stripHtml(faqMatch[2]),
      });
    }

    // Extract Intro Text
    let intro_text = '';
    const introMatch = html.match(/<div[^>]*class=["'][^"']*article-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (introMatch) {
      intro_text = stripHtml(introMatch[1]);
    }

    return {
      source_url: url,
      slug,
      title: title || slug.replace(/-/g, ' '),
      excerpt: excerpt || '',
      hero_image: hero_image || undefined,
      intro_text,
      items,
      body_text: stripHtml(html).slice(0, 3000),
      faqs,
    };
  } catch (err) {
    console.error('Error scraping source article:', err);
    return null;
  }
}
