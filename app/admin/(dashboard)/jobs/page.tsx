import { db } from '@/lib/db';
import { JobQueueViewer } from './JobQueueViewer';

export default async function AdminJobsPage() {
  const { rows } = await db.find('content_jobs', {
    order: [{ field: 'created_at', asc: false }],
  });

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171a35', margin: '0 0 6px' }}>
          AI Content Engine &amp; Job Queue (Phase 7)
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.92rem' }}>
          Provider abstraction, retry mechanism with exponential backoff, Zod schema validation, and telemetry execution logs.
        </p>
      </div>

      <JobQueueViewer initialJobs={rows} />
    </div>
  );
}
