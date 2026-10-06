import AdminSettingsPage from '../settings/page';

export const metadata = {
  title: 'Affiliate Networks & Synchronization | Admin Settings',
};

export default async function AffiliateLinksPage() {
  return AdminSettingsPage({ searchParams: Promise.resolve({ tab: 'affiliate' }) });
}
