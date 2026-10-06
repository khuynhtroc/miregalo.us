import type { Metadata } from 'next';
import './globals.css';
import { getSettings } from '@/lib/repo';
import { orgSchema, websiteSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
    title: {
      default: settings.site_name,
      template: `%s ${settings.title_separator || '|'} ${settings.site_name}`,
    },
    description: settings.site_description,
    icons: {
      icon: [
        { url: settings.favicon_url || '/favicon.png' },
        { url: '/favicon.ico' },
      ],
      apple: '/apple-touch-icon.png',
    },
    verification: {
      google: settings.gsc_verification || undefined,
      other: settings.bing_verification ? { 'msvalidate.01': settings.bing_verification } : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <html lang={settings.locale || 'es'}>
      <head>
        <link rel="icon" type="image/png" href={settings.favicon_url || '/favicon.png'} />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <JsonLd data={[websiteSchema(settings), orgSchema(settings)]} />
        {settings.ga4_id && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga4_id}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${settings.ga4_id}');
                `,
              }}
            />
          </>
        )}
        {settings.head_scripts && (() => {
          const raw = settings.head_scripts.trim();
          if (!raw) return null;

          const metaTags = raw.match(/<meta\s+[^>]+>/gi) || [];
          const cleanJs = raw
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<meta\s+[^>]+>/gi, '')
            .replace(/<\/?script[^>]*>/gi, '')
            .trim();

          return (
            <>
              {metaTags.map((tag, idx) => {
                const name = tag.match(/name=["']([^"']+)["']/i)?.[1];
                const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
                const property = tag.match(/property=["']([^"']+)["']/i)?.[1];
                if (name && content) return <meta key={`m-${idx}`} name={name} content={content} />;
                if (property && content) return <meta key={`m-${idx}`} property={property} content={content} />;
                return null;
              })}
              {cleanJs ? (
                <script
                  id="site-custom-head-scripts"
                  dangerouslySetInnerHTML={{ __html: cleanJs }}
                />
              ) : null}
            </>
          );
        })()}
      </head>
      <body>
        {children}
        {settings.body_scripts && (
          <div dangerouslySetInnerHTML={{ __html: settings.body_scripts }} />
        )}
      </body>
    </html>
  );
}
