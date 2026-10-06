import type { Metadata } from 'next';
import './globals.css';
import { getSettings } from '@/lib/repo';
import { orgSchema, websiteSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';

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
      icon: settings.favicon_url || '/favicon.ico',
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
        {settings.head_scripts && (
          <script
            id="site-custom-head-scripts"
            dangerouslySetInnerHTML={{
              __html: settings.head_scripts.replace(/<\/?script[^>]*>/gi, ''),
            }}
          />
        )}
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
