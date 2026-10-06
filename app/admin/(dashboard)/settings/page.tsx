import { getSettings } from '@/lib/repo';
import { SettingsManager } from './SettingsManager';

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const dbDriver = process.env.DB_DRIVER === 'supabase' ? 'Supabase' : 'Local JSON';

  return <SettingsManager initialSettings={settings} dbDriver={dbDriver} />;
}
