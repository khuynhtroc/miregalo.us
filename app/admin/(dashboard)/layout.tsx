import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { AdminNav } from './AdminNav';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login/');
  }

  const dbDriver = process.env.DB_DRIVER === 'supabase' ? 'Supabase' : 'Local JSON';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div>
            <strong>Loveable Blog</strong>
          </div>
          <span>Admin</span>
        </div>

        <AdminNav />

        <div className="admin-footer-nav">
          <Link href="/" target="_blank" style={{ color: '#a3a7ba', fontSize: '0.84rem' }}>
            🌐 View Public Site ↗
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '999px',
                fontWeight: 600,
                background: dbDriver === 'Supabase' ? '#eef1ff' : '#e6f7ed',
                color: dbDriver === 'Supabase' ? '#3349b5' : '#027a48',
                border: `1px solid ${dbDriver === 'Supabase' ? '#c7d2fe' : '#a6f4c5'}`,
              }}
            >
              DB: {dbDriver}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#69707d' }}>Port: 3001</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.86rem', color: '#344054', fontWeight: 500 }}>
              👤 {session.u}
            </span>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
