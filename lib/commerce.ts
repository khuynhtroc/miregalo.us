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
