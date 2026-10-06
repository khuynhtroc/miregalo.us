import { getSettings } from '@/lib/repo';
import { SettingsManager } from './SettingsManager';

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const dbDriver = process.env.DB_DRIVER === 'local' ? 'Local JSON' : 'Supabase';

  return <SettingsManager initialSettings={settings} dbDriver={dbDriver} />;
}
