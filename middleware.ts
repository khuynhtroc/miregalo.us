import { NextResponse, type NextRequest } from 'next/server';

/**
 * Permanently removed posts (adult / off-brand / empty stub content).
 * Served as 410 Gone so search engines and AdSense crawlers drop them immediately.
 */
const GONE_SLUGS = new Set([
  'regalos-bisexual-dating-apps',
  'regalos-signs-he-wants-you-sexually',
  'regalos-sex-questions-to-ask-before-marriage',
  'regalos-signs-he-doesnt-want-you-sexually',
  'regalos-how-to-get-turned-on',
  'regalos-sex-bucket-list',
  'regalos-how-to-please-your-man',
  'regalos-what-is-a-pillow-talk',
  'regalos-san-valentin-underwear-para-hombres',
  'regalos-sexy-cumpleanos-dress-ideas',
  'regalos-sexy-cumpleanos-outfits',
  'regalos-sexy-regalos-esposa',
  'regalos-sexy-san-valentin',
  'regalos-sexy-regalos-esposo',
  'regalos-naughty-san-valentin-day',
  'regalos-naughty-navipapa',
  'regalos-dirty-navipapa-chistes',
  'regalos-dirty-santa',
  'regalos-is-my-novio-cheating',
  'regalos-characteristics-of-cheating-woman',
  'regalos-leave-an-abusive-relationship',
  'regalos-the-effects-of-divorce',
  'regalos-dating-after-divorce',
  'regalos-divorced-papa-success',
  'regalos-divorce',
  'regalos-dating-bad-boys',
  'regalos-iconic-poker-couples-to-inspire',
  'regalos-how-business-travelers-benefit-from-esim-in-asia',
  'regalos-how-to-ace-digital-nomad-as-solo-woman',
  'regalos-impact-of-absent-fathers',
  'regalos-londons-skyline-a-romp-through-the-ages',
  'regalos-hogan-assessment-key-to-smarter-hiring-leadership',
  'regalos-create-perfect-voiceovers-with-text-to-speech',
  'regalos-unlock-versatility-acryliic-sign-holders',
  'regalos-beyond-fossils-keeping-the-spark-wonder-alive',
  'regalos-loveable-new-journey-announcement',
  'regalos-loveable-new-journey-announcement-2',
  'regalos-luna-linh',
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
