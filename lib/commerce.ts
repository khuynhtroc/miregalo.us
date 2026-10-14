/**
 * US-market commerce helpers (miregalo.us targets US Hispanics).
 * - All Amazon traffic goes to amazon.com with the US Associates tag.
 * - Spain-only merchants (El Corte Inglés, eBay.es, Amazon.es/amzn.eu) are mapped to US equivalents.
 * - Prices are only shown when they are known USD prices; legacy EUR placeholders are hidden.
 */

export const DEFAULT_AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || 'miregalo26-20';
export const PRICE_FALLBACK_LABEL = 'Ver precio en Amazon';

const ASIN_RE = /(?:\/dp\/|\/gp\/product\/|\/exec\/obidos\/ASIN\/|\/o\/ASIN\/|\/gp\/aw\/d\/)([A-Z0-9]{10})/i;

export function extractAsin(url: string): string | null {
  const m = url.match(ASIN_RE);
  return m ? m[1].toUpperCase() : null;
}

export function amazonSearchUrl(keyword: string, tag = DEFAULT_AMAZON_TAG): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(keyword.trim().slice(0, 70))}&tag=${tag}`;
}

/** Normalise a merchant label for display on the US site. */
export function normalizeMerchant(merchant?: string | null): string {
  const m = (merchant || '').trim();
  if (!m) return 'Amazon';
  if (/amazon/i.test(m)) return 'Amazon';
  if (/corte\s*ingl/i.test(m)) return 'Amazon';
  if (/loveable/i.test(m)) return 'Miregalo Selección';
  if (/ebay/i.test(m)) return 'eBay';
  if (/walmart/i.test(m)) return 'Walmart';
  if (/etsy/i.test(m) || /awin/i.test(m)) return 'Etsy';
  return m;
}

/**
 * Display price: only known USD prices are shown. EUR values (legacy Spain data)
 * are never converted blindly; we return null and the UI shows PRICE_FALLBACK_LABEL.
 */
export function displayPrice(price?: string | null, currency?: string | null): string | null {
  const p = (price || '').trim();
  if (!p) return null;
  if (/€|eur|â‚¬|â\u0082¬/i.test(p) || (currency || '').toUpperCase() === 'EUR') return null;
  if (!/\$|usd/i.test(p) && (currency || '').toUpperCase() !== 'USD') return null;
  const n = parseFloat(p.replace(/[^0-9.,]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));
  if (!isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(n);
}

/** Numeric USD price for schema.org, or null when unknown. */
export function usdPriceValue(price?: string | null, currency?: string | null): number | null {
  const d = displayPrice(price, currency);
  if (!d) return null;
  const n = parseFloat(d.replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : null;
}

/**
 * Rewrite any outbound merchant URL to its US equivalent.
 * `fallbackKeyword` is used to build an amazon.com search when the source is Spain-only and non-specific.
 */
export function toUsMerchantUrl(rawUrl: string, fallbackKeyword: string, tag = DEFAULT_AMAZON_TAG): string {
  let url = rawUrl.replace(/&amp;/g, '&').trim();
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    // Awin deep links to El Corte Inglés (Spain only) -> amazon.com search
    if (host.includes('awin1.com')) {
      const ued = u.searchParams.get('ued') || '';
      if (/elcorteingles\./i.test(ued)) return amazonSearchUrl(fallbackKeyword, tag);
      if (/amazon\./i.test(ued)) return toUsMerchantUrl(ued, fallbackKeyword, tag);
      return url;
    }
    if (host.includes('elcorteingles.')) return amazonSearchUrl(fallbackKeyword, tag);

    // Any Amazon marketplace / short link -> amazon.com
    if (/(^|\.)amazon\.|amzn\.(eu|to|com)$|(^|\.)a\.co$/.test(host)) {
      const asin = extractAsin(u.pathname);
      if (asin) return `https://www.amazon.com/dp/${asin}/?tag=${tag}`;
      const k = u.searchParams.get('k') || u.searchParams.get('field-keywords');
      return amazonSearchUrl(k || fallbackKeyword, tag);
    }

    // eBay Spain -> eBay US
    if (host.endsWith('ebay.es')) {
      u.hostname = 'www.ebay.com';
      return u.toString();
    }
    return url;
  } catch {
    return amazonSearchUrl(fallbackKeyword, tag);
  }
}

/** Neutral, merchant-free CTA label used across the public UI. */
export const NEUTRAL_CTA_LABEL = 'Ver producto';

const MERCHANT_RE = '(?:Amazon(?:\\.com|\\.es)?(?: España)?|Etsy(?: España)?|eBay(?:\\.es)?|Walmart|Target|El Corte Ingl[eé]s|AliExpress|la tienda|tienda)';

/**
 * Replace merchant-named CTA text injected in DB HTML (e.g. ">Ver en Amazon<", ">Comprar en Etsy<")
 * with the neutral label. Only touches short text nodes that are entirely a CTA; prose is untouched.
 */
export function neutralizeMerchantHtml(html?: string | null): string {
  if (!html) return '';
  const re = new RegExp(
    `>(\\s*)(?:Ver|Comprar|Consultar|Ver precio|Ver oferta|Ver producto)(?: (?:y comprar|precio))? (?:en|on) ${MERCHANT_RE}(\\s*(?:→|↗|»)?\\s*)<`,
    'gi',
  );
  return tagAmazonLinksInHtml(html.replace(re, `>$1${NEUTRAL_CTA_LABEL}$2<`));
}

/** Force our Associates tag onto a direct Amazon URL (any marketplace -> amazon.com). */
export function tagAmazonUrl(rawUrl: string, tag = DEFAULT_AMAZON_TAG): string {
  const url = rawUrl.replace(/&amp;/g, '&').trim();
  try {
    const u = new URL(url);
    if (!/(^|\.)amazon\.|(^|\.)amzn\.|(^|\.)a\.co$/i.test(u.hostname)) return rawUrl;
    const asin = extractAsin(u.pathname);
    if (asin) return `https://www.amazon.com/dp/${asin}/?tag=${tag}`;
    if (/amzn\.|a\.co$/i.test(u.hostname)) return rawUrl; // short links: cannot rewrite safely
    u.protocol = 'https:';
    u.hostname = 'www.amazon.com';
    u.searchParams.delete('tag');
    u.searchParams.set('tag', tag);
    return u.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Post HTML imported from the old site contains direct Amazon links without our tag
 * (or with third-party tags). Rewrite them to amazon.com + our tag and mark them sponsored.
 */
export function tagAmazonLinksInHtml(html: string, tag = DEFAULT_AMAZON_TAG): string {
  return html.replace(/<a\b([^>]*?)href=(["'])(https?:\/\/(?:[a-z0-9-]+\.)*(?:amazon\.[a-z.]+|amzn\.[a-z]+|a\.co)\/[^"']*)\2([^>]*)>/gi,
    (_m, pre: string, q: string, href: string, post: string) => {
      const newHref = tagAmazonUrl(href, tag).replace(/&/g, '&amp;');
      let attrs = `${pre}href=${q}${newHref}${q}${post}`.replace(/\s+rel=(["'])[^"']*\1/gi, '').replace(/\s+target=(["'])[^"']*\1/gi, '');
      return `<a${attrs} rel="nofollow sponsored noopener" target="_blank">`;
    });
}

/** Boilerplate "pros" bullets auto-added by old seed scripts that make unverifiable review claims. */
const FABRICATED_PRO_RE = /valoraciones? verificadas|rese[ñn]as? verificadas|opiniones? verificadas|compradores satisfechos|miles de (clientes|compradores)|\b(4|5)[.,]?\d? estrellas|m[aá]s vendido/i;

export function filterPros(pros?: string[] | null): string[] {
  return (pros || []).filter((p) => p && !FABRICATED_PRO_RE.test(p));
}
