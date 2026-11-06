/**
 * US and Global Commerce helpers with Amazon Geotargeting and OneLink support.
 * - Routes visitors from Spain to amazon.es, Mexico to amazon.com.mx, US to amazon.com, etc.
 * - Resolves direct ASIN product links and fallback search links cleanly.
 * - Preserves native merchants (e.g. El Corte Inglés) for local Spanish visitors.
 * - Prices are displayed in USD when known, or hidden when EUR to avoid confusing US visitors.
 */

export const DEFAULT_AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || 'miregalo26-20';
export const DEFAULT_AMAZON_TAG_ES = process.env.NEXT_PUBLIC_AMAZON_TAG_ES || 'miregalo09-21';
export const PRICE_FALLBACK_LABEL = 'Ver precio en Amazon';

/**
 * Supported Amazon Marketplaces with local domains and currency.
 * Used for Geotargeting and Amazon OneLink routing.
 */
export interface AmazonMarketplace {
  countryCode: string;
  domain: string;
  currency: string;
}

export const AMAZON_MARKETPLACES: Record<string, { domain: string; currency: string }> = {
  ES: { domain: 'www.amazon.es', currency: 'EUR' },
  MX: { domain: 'www.amazon.com.mx', currency: 'MXN' },
  US: { domain: 'www.amazon.com', currency: 'USD' },
  GB: { domain: 'www.amazon.co.uk', currency: 'GBP' },
  UK: { domain: 'www.amazon.co.uk', currency: 'GBP' },
  DE: { domain: 'www.amazon.de', currency: 'EUR' },
  AT: { domain: 'www.amazon.de', currency: 'EUR' },
  FR: { domain: 'www.amazon.fr', currency: 'EUR' },
  IT: { domain: 'www.amazon.it', currency: 'EUR' },
  CA: { domain: 'www.amazon.ca', currency: 'CAD' },
  BR: { domain: 'www.amazon.com.br', currency: 'BRL' },
};

export function resolveMarketplace(countryCode?: string | null): AmazonMarketplace {
  const code = (countryCode || '').trim().toUpperCase();
  if (code && AMAZON_MARKETPLACES[code]) {
    return { countryCode: code, ...AMAZON_MARKETPLACES[code] };
  }
  return { countryCode: 'US', domain: 'www.amazon.com', currency: 'USD' };
}

const ASIN_RE = /(?:\/dp\/|\/gp\/product\/|\/exec\/obidos\/ASIN\/|\/o\/ASIN\/|\/gp\/aw\/d\/)([A-Z0-9]{10})/i;

export function extractAsin(url: string): string | null {
  const m = url.match(ASIN_RE);
  return m ? m[1].toUpperCase() : null;
}

export function amazonSearchUrl(keyword: string, tag = DEFAULT_AMAZON_TAG, domain = 'www.amazon.com'): string {
  const lang = domain === 'www.amazon.com' ? '&language=es_US' : '';
  return `https://${domain}/s?k=${encodeURIComponent(keyword.trim().slice(0, 70))}&tag=${tag}${lang}`;
}

export function amazonProductUrl(asin: string, tag = DEFAULT_AMAZON_TAG, domain = 'www.amazon.com'): string {
  const lang = domain === 'www.amazon.com' ? '&language=es_US' : '';
  return `https://${domain}/dp/${asin}/?tag=${tag}${lang}`;
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
 * Geotargeted outbound merchant URL resolution.
 * Automatically routes Spanish traffic to amazon.es, Mexican traffic to amazon.com.mx,
 * US traffic to amazon.com, and handles local merchant equivalents seamlessly.
 */
export function toTargetMerchantUrl(
  rawUrl: string,
  fallbackKeyword: string,
  options: {
    countryCode?: string | null;
    tag?: string;
    tagsByCountry?: Record<string, string>;
  } = {}
): string {
  const marketplace = resolveMarketplace(options.countryCode);
  const tag =
    (options.tagsByCountry && options.tagsByCountry[marketplace.countryCode]) ||
    options.tag ||
    DEFAULT_AMAZON_TAG;

  let url = rawUrl.replace(/&amp;/g, '&').trim();
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    // Awin deep links
    if (host.includes('awin1.com')) {
      const ued = u.searchParams.get('ued') || '';
      // If El Corte Inglés and visitor is in Spain, keep native El Corte Inglés store
      if (/elcorteingles\./i.test(ued)) {
        if (marketplace.countryCode === 'ES') return url;
        return amazonSearchUrl(fallbackKeyword, tag, marketplace.domain);
      }
      if (/amazon\./i.test(ued)) {
        return toTargetMerchantUrl(ued, fallbackKeyword, options);
      }
      return url;
    }

    if (host.includes('elcorteingles.')) {
      if (marketplace.countryCode === 'ES') return url;
      return amazonSearchUrl(fallbackKeyword, tag, marketplace.domain);
    }

    // Any Amazon marketplace / short link -> route to targeted local marketplace
    if (/(^|\.)amazon\.|amzn\.(eu|to|com)$|(^|\.)a\.co$/.test(host)) {
      const asin = extractAsin(u.pathname);
      if (asin) return amazonProductUrl(asin, tag, marketplace.domain);
      const k = u.searchParams.get('k') || u.searchParams.get('field-keywords');
      return amazonSearchUrl(k || fallbackKeyword, tag, marketplace.domain);
    }

    // eBay Spain -> keep ebay.es in Spain, or www.ebay.com internationally
    if (host.endsWith('ebay.es')) {
      if (marketplace.countryCode === 'ES') return url;
      u.hostname = 'www.ebay.com';
      return u.toString();
    }
    return url;
  } catch {
    return amazonSearchUrl(fallbackKeyword, tag, marketplace.domain);
  }
}

/** Legacy wrapper for backwards compatibility */
export function toUsMerchantUrl(rawUrl: string, fallbackKeyword: string, tag = DEFAULT_AMAZON_TAG): string {
  return toTargetMerchantUrl(rawUrl, fallbackKeyword, { countryCode: 'US', tag });
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
