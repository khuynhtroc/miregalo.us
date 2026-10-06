import AdminSettingsPage from '../settings/page';

export const metadata = {
  title: 'Affiliate Merchants & Networks | Admin Settings',
};

export default async function AdminMerchantsPage() {
  return AdminSettingsPage({ searchParams: Promise.resolve({ tab: 'merchants' }) });
}
