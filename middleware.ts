import { NextResponse, type NextRequest } from 'next/server';

/**
 * Permanently removed posts (adult / off-brand content, removed 2026-10-14).
 * Served as 410 Gone so search engines drop them quickly.
 */
const GONE_SLUGS = new Set([
  'regalos-bisexual-dating-apps',
  'regalos-signs-he-wants-you-sexually',
  'regalos-sex-questions-to-ask-before-marriage',
  'regalos-signs-he-doesnt-want-you-sexually',
  'regalos-how-to-get-turned-on',
  'regalos-sex-bucket-list',
]);

export function middleware(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto');
  const host = req.headers.get('host') || '';

  // 1. Enforce HTTPS redirect
  if (proto === 'http') {
    const targetHost = host === 'miregalo.us' ? 'www.miregalo.us' : host;
    return NextResponse.redirect(`https://${targetHost}${req.nextUrl.pathname}${req.nextUrl.search}`, 301);
  }

  // 2. Canonical apex domain -> www redirect
  if (host === 'miregalo.us') {
    return NextResponse.redirect(`https://www.miregalo.us${req.nextUrl.pathname}${req.nextUrl.search}`, 301);
  }

  const parts = req.nextUrl.pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1]?.toLowerCase();
  if (last && GONE_SLUGS.has(last)) {
    return new NextResponse('<!doctype html><html lang="es"><head><meta name="robots" content="noindex"><title>Contenido eliminado</title></head><body><h1>410 – Este contenido ha sido eliminado</h1><p><a href="/">Volver a Miregalo</a></p></body></html>', {
      status: 410,
      headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|admin|go|media|.*\\.(?:png|jpg|jpeg|webp|svg|ico|xml|txt|css|js)).*)'],
};
