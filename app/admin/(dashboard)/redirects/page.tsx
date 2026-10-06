import { db } from '@/lib/db';
import { RedirectManager } from './RedirectManager';

export default async function AdminRedirectsPage() {
  const redirectsRes = await db.find('redirects', {
    order: [{ field: 'hits', asc: false }],
    limit: 100,
  });

  return <RedirectManager initialRedirects={redirectsRes.rows} />;
}
