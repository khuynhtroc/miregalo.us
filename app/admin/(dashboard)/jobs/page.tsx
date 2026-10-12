import { db } from '@/lib/db';
import { JobQueueViewer, type NormalizedContentJob } from './JobQueueViewer';

export const dynamic = 'force-dynamic';

export default async function AdminJobsPage() {
  const { rows } = await db.find('content_jobs', {
    order: [{ field: 'created_at', asc: true }],
    limit: 1000,
  });

  // Flatten and normalize jobs so all payload fields (topic, status, scheduled_for, model, cluster, etc.) are top-level
  const normalizedJobs: NormalizedContentJob[] = (rows || []).map((r: any) => {
    const payload = r.payload || {};
    const result = r.result || {};

    const rawStatus = r.status || payload.status || (r.stage === 'done' ? 'published' : r.stage === 'error' ? 'failed' : 'scheduled');
    const status =
      rawStatus === 'completed' || rawStatus === 'published' || r.stage === 'done'
        ? 'published'
        : rawStatus === 'failed' || r.stage === 'error'
        ? 'failed'
        : rawStatus === 'processing' || rawStatus === 'generating' || rawStatus === 'researching'
        ? 'generating'
        : rawStatus === 'queued'
        ? 'queued'
        : 'scheduled';

    return {
      id: r.id,
      keyword_id: r.keyword_id || payload.keyword_id || '',
      topic: r.topic || payload.topic || r.keyword_id || 'Untitled Job',
      target_path: r.target_path || payload.target_path || '',
      cluster: payload.cluster || 'General',
      silo: payload.silo || 'RECIPIENT',
      priority: payload.priority || 'P1',
      status,
      stage: r.stage || (status === 'published' ? 'done' : 'research'),
      scheduled_for: payload.scheduled_for || null,
      model: r.model || payload.model || 'gemini-2.5-flash',
      image_model: payload.image_model || 'imagen-3.0-generate-002',
      min_words: payload.min_words || 5000,
      affiliate_tag: payload.affiliate_tag || 'miregalo26-20',
      attempts: r.attempts || 0,
      max_attempts: r.max_attempts || 3,
      duration_ms: r.duration_ms || 0,
      created_at: r.created_at || new Date().toISOString(),
      updated_at: r.updated_at || r.created_at || new Date().toISOString(),
      result: {
        post_id: result.post_id || r.generated_post_id || null,
        slug: result.slug || (payload.target_path ? payload.target_path.replace(/^\/|\/$/g, '') : null),
        word_count: result.word_count || null,
        item_count: result.item_count || null,
        hero_image: result.hero_image || null,
        published_at: result.published_at || null,
      },
      error: r.error || '',
      log: r.log || null,
    };
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#171a35', margin: 0 }}>
            Hàng đợi 500 Bài viết Lên lịch AI (Scheduled Jobs Queue) ⏰
          </h1>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              background: '#e0e7ff',
              color: '#3730a3',
              padding: '3px 10px',
              borderRadius: '999px',
            }}
          >
            {normalizedJobs.length} Jobs
          </span>
        </div>
        <p style={{ margin: '6px 0 0', color: '#69707d', fontSize: '0.92rem' }}>
          Quản lý toàn bộ 500 bài viết Gift Guide lên lịch tự động: thời gian hẹn đăng, trạng thái xuất bản, cấu hình AI Gemini 2.5 Flash, và nút kích hoạt đăng ngay.
        </p>
      </div>

      <JobQueueViewer initialJobs={normalizedJobs} />
    </div>
  );
}
