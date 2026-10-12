'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export interface NormalizedContentJob {
  id: string;
  keyword_id?: string;
  topic: string;
  target_path: string;
  cluster: string;
  silo: string;
  priority: string;
  status: 'scheduled' | 'published' | 'queued' | 'generating' | 'failed';
  stage: string;
  scheduled_for: string | null;
  model: string;
  image_model: string;
  min_words: number;
  affiliate_tag: string;
  attempts: number;
  max_attempts: number;
  duration_ms: number;
  created_at: string;
  updated_at: string;
  result?: {
    post_id?: string | null;
    slug?: string | null;
    word_count?: number | null;
    item_count?: number | null;
    hero_image?: string | null;
    published_at?: string | null;
  };
  error?: string;
  log?: string | null;
}

interface JobQueueViewerProps {
  initialJobs: NormalizedContentJob[];
}

export function JobQueueViewer({ initialJobs }: JobQueueViewerProps) {
  const [jobs, setJobs] = useState<NormalizedContentJob[]>(initialJobs);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clusterFilter, setClusterFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'scheduled_asc' | 'scheduled_desc' | 'id_asc' | 'topic_asc'>('scheduled_asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal detail
  const [selectedJob, setSelectedJob] = useState<NormalizedContentJob | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clusters list
  const clusters = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      if (j.cluster) set.add(j.cluster);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [jobs]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      total: jobs.length,
      scheduled: 0,
      published: 0,
      generating: 0,
      queued: 0,
      failed: 0,
    };
    for (const j of jobs) {
      if (counts[j.status] !== undefined) {
        counts[j.status]++;
      }
    }
    return counts;
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return jobs
      .filter((j) => {
        if (statusFilter && j.status !== statusFilter) return false;
        if (clusterFilter && j.cluster !== clusterFilter) return false;
        if (q) {
          const matchTopic = j.topic.toLowerCase().includes(q);
          const matchId = j.id.toLowerCase().includes(q);
          const matchKw = (j.keyword_id || '').toLowerCase().includes(q);
          const matchPath = (j.target_path || '').toLowerCase().includes(q);
          if (!matchTopic && !matchId && !matchKw && !matchPath) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'scheduled_asc') {
          const da = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0;
          const db = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0;
          return da - db;
        }
        if (sortBy === 'scheduled_desc') {
          const da = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0;
          const db = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0;
          return db - da;
        }
        if (sortBy === 'id_asc') {
          return a.id.localeCompare(b.id);
        }
        if (sortBy === 'topic_asc') {
          return a.topic.localeCompare(b.topic, 'es');
        }
        return 0;
      });
  }, [jobs, statusFilter, clusterFilter, searchQuery, sortBy]);

  // Paginated slice
  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  // Run/trigger job immediately
  const handleRunJob = async (jobId: string) => {
    setRunningId(jobId);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMsg({
          type: 'success',
          text: `✅ Bài viết "${data.job?.topic || jobId}" đã được AI tạo thành công và xuất bản lên web!`,
        });
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  status: 'published',
                  stage: 'done',
                  result: {
                    post_id: data.generatedPost?.id,
                    slug: data.generatedPost?.slug,
                    word_count: data.wordCount,
                    item_count: data.generatedPost?.items?.length || 18,
                    hero_image: data.generatedPost?.hero_image,
                    published_at: new Date().toISOString(),
                  },
                }
              : j
          )
        );
      } else {
        setMsg({
          type: 'error',
          text: `❌ Lỗi khi chạy job: ${data.error || 'Unknown error'}`,
        });
      }
    } catch {
      setMsg({ type: 'error', text: '❌ Lỗi kết nối khi kích hoạt job' });
    } finally {
      setRunningId(null);
    }
  };

  const formatDateStr = (dateString?: string | null) => {
    if (!dateString) return 'Chưa hẹn lịch';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: '#dcfce7',
              color: '#15803d',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🟢 Đã xuất bản
          </span>
        );
      case 'scheduled':
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: '#f3e8ff',
              color: '#7e22ce',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🟣 Đã lên lịch
          </span>
        );
      case 'generating':
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: '#fef3c7',
              color: '#b45309',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🟡 Đang tạo bài
          </span>
        );
      case 'failed':
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: '#fee2e2',
              color: '#b91c1c',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🔴 Thất bại
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: '#f1f5f9',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ⚪ Chờ hàng đợi
          </span>
        );
    }
  };

  return (
    <div>
      {/* ── KPI Stat Cards ────────────────────────────── */}
      <div className="stat-grid" style={{ marginBottom: '22px' }}>
        <div className="stat-card">
          <span className="stat-label">Tổng số bài lên lịch</span>
          <span className="stat-val" style={{ color: '#1e293b' }}>{statusCounts.total} bài</span>
          <span className="stat-desc">Toàn bộ kế hoạch nội dung AI</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đang lên lịch (Scheduled)</span>
          <span className="stat-val" style={{ color: '#7e22ce' }}>{statusCounts.scheduled} bài</span>
          <span className="stat-desc">Hẹn giờ tự động theo Cron Vercel</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đã xuất bản (Live)</span>
          <span className="stat-val" style={{ color: '#15803d' }}>{statusCounts.published} bài</span>
          <span className="stat-desc">Đã tạo bài viết &amp; online trên web</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Định dạng bài viết</span>
          <span className="stat-val" style={{ color: '#2563eb', fontSize: '1.25rem', marginTop: '6px' }}>
            Gift Guide (5.000 từ)
          </span>
          <span className="stat-desc">Gemini 2.5 Flash + Imagen 3.0</span>
        </div>
      </div>

      {/* Message notification if any */}
      {msg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '18px',
            fontSize: '0.88rem',
            fontWeight: 500,
            background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: msg.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {msg.text}
        </div>
      )}

      {/* ── Multi-Filter Toolbar ────────────────────────────── */}
      <div
        className="admin-card"
        style={{
          padding: '18px',
          marginBottom: '20px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Row 1: Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('');
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === '' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
              background: statusFilter === '' ? '#4f46e5' : '#ffffff',
              color: statusFilter === '' ? '#ffffff' : '#334155',
            }}
          >
            Tất cả ({statusCounts.total})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('scheduled');
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'scheduled' ? '1px solid #7e22ce' : '1px solid #cbd5e1',
              background: statusFilter === 'scheduled' ? '#7e22ce' : '#ffffff',
              color: statusFilter === 'scheduled' ? '#ffffff' : '#334155',
            }}
          >
            🟣 Đã lên lịch ({statusCounts.scheduled})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('published');
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'published' ? '1px solid #15803d' : '1px solid #cbd5e1',
              background: statusFilter === 'published' ? '#15803d' : '#ffffff',
              color: statusFilter === 'published' ? '#ffffff' : '#334155',
            }}
          >
            🟢 Đã xuất bản ({statusCounts.published})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('generating');
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'generating' ? '1px solid #b45309' : '1px solid #cbd5e1',
              background: statusFilter === 'generating' ? '#b45309' : '#ffffff',
              color: statusFilter === 'generating' ? '#ffffff' : '#334155',
            }}
          >
            🟡 Đang tạo bài ({statusCounts.generating})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('queued');
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'queued' ? '1px solid #475569' : '1px solid #cbd5e1',
              background: statusFilter === 'queued' ? '#475569' : '#ffffff',
              color: statusFilter === 'queued' ? '#ffffff' : '#334155',
            }}
          >
            ⚪ Chờ hàng đợi ({statusCounts.queued})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('failed');
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: statusFilter === 'failed' ? '1px solid #b91c1c' : '1px solid #cbd5e1',
              background: statusFilter === 'failed' ? '#b91c1c' : '#ffffff',
              color: statusFilter === 'failed' ? '#ffffff' : '#334155',
            }}
          >
            🔴 Thất bại ({statusCounts.failed})
          </button>
        </div>

        {/* Row 2: Search, Cluster Filter, Sort */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              🔍 Tìm theo từ khóa / mã Job
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input"
              placeholder="Ví dụ: regalos para mamá, job-kw-001..."
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              🗂️ Cụm chủ đề ({clusters.length} cụm)
            </label>
            <select
              value={clusterFilter}
              onChange={(e) => {
                setClusterFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="form-select"
              style={{ width: '100%' }}
            >
              <option value="">Tất cả cụm chủ đề</option>
              {clusters.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              ⚡ Sắp xếp theo
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-select"
              style={{ width: '100%' }}
            >
              <option value="scheduled_asc">Lịch hẹn đăng (Sớm nhất → Muộn nhất)</option>
              <option value="scheduled_desc">Lịch hẹn đăng (Muộn nhất → Sớm nhất)</option>
              <option value="id_asc">Mã Job ID (Tăng dần)</option>
              <option value="topic_asc">Từ khóa chủ đề (A → Z)</option>
            </select>
          </div>

          {(searchQuery || clusterFilter || statusFilter) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setClusterFilter('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
                className="btn-secondary"
                style={{ width: '100%', height: '38px', justifyContent: 'center' }}
              >
                ✕ Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#64748b' }}>
          Đang hiển thị <strong>{filteredJobs.length}</strong> / {jobs.length} bài viết trong kế hoạch nội dung.
        </div>
      </div>

      {/* ── Table of 500 Scheduled Content Jobs ─────────────────────────── */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ minWidth: '120px' }}>Mã Job</th>
                <th style={{ minWidth: '280px' }}>Chủ đề Gift Guide &amp; URL mục tiêu</th>
                <th style={{ minWidth: '140px' }}>Cụm &amp; Silo</th>
                <th style={{ minWidth: '130px' }}>Trạng thái</th>
                <th style={{ minWidth: '170px' }}>Lịch hẹn đăng</th>
                <th style={{ minWidth: '160px' }}>Định dạng &amp; Cấu hình</th>
                <th style={{ minWidth: '160px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    Không tìm thấy bài viết nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => {
                  const isPublished = job.status === 'published';
                  const liveSlug = job.result?.slug || (job.target_path ? job.target_path.replace(/^\/|\/$/g, '') : null);

                  return (
                    <tr key={job.id}>
                      {/* Job ID & Keyword */}
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>
                          {job.id}
                        </span>
                        {job.keyword_id && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            {job.keyword_id} • {job.priority}
                          </div>
                        )}
                      </td>

                      {/* Topic & Target Path */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>
                          {job.topic}
                        </div>
                        {job.target_path && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                            {job.target_path}
                          </div>
                        )}
                        {isPublished && job.result?.word_count && (
                          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '2px', fontWeight: 600 }}>
                            ✅ Đã tạo: {job.result.word_count.toLocaleString()} từ • {job.result.item_count || 18} sản phẩm
                          </div>
                        )}
                      </td>

                      {/* Cluster & Silo */}
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                          }}
                        >
                          {job.cluster}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                          Silo: {job.silo}
                        </div>
                      </td>

                      {/* Status */}
                      <td>{getStatusBadge(job.status)}</td>

                      {/* Scheduled Date */}
                      <td>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>
                          ⏰ {formatDateStr(job.scheduled_for)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {isPublished ? 'Đã hoàn tất đăng' : 'Tự động chạy qua Cron'}
                        </div>
                      </td>

                      {/* Format & AI Specs */}
                      <td style={{ fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>🎁 Gift Guide ({job.min_words.toLocaleString()} từ)</div>
                        <div style={{ color: '#64748b' }}>🧠 {job.model}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>🏷️ {job.affiliate_tag}</div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {isPublished && liveSlug ? (
                            <a
                              href={`https://www.miregalo.us/${liveSlug}/`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #bbf7d0',
                                background: '#f0fdf4',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#15803d',
                                textDecoration: 'none',
                              }}
                            >
                              Web ↗
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRunJob(job.id)}
                              disabled={runningId === job.id}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: '#4f46e5',
                              }}
                              title="Tạo bài viết và xuất bản ngay lập tức bằng AI"
                            >
                              {runningId === job.id ? 'Đang tạo...' : '⚡ Đăng ngay'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedJob(job)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              color: '#475569',
                            }}
                            title="Xem chi tiết cấu hình và kết quả"
                          >
                            👁️ Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ─────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
          Hiển thị {(currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, filteredJobs.length)} trên tổng số {filteredJobs.length} bài
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            « Đầu
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            ← Trước
          </button>

          <span style={{ fontSize: '0.88rem', fontWeight: 600, padding: '0 8px', color: '#334155' }}>
            Trang {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage >= totalPages ? 0.5 : 1 }}
          >
            Sau →
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage >= totalPages ? 0.5 : 1 }}
          >
            Cuối »
          </button>
        </div>
      </div>

      {/* ── Detail Drawer Modal ─────────────────────────── */}
      {selectedJob && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#4f46e5',
                    background: '#eef2ff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Content Job Details ({selectedJob.id})
                </span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '6px 0 0', color: '#1e293b' }}>
                  {selectedJob.topic}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.4rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px', fontSize: '0.86rem' }}>
              <div>
                <strong style={{ color: '#64748b' }}>Trạng thái:</strong>
                <div>{getStatusBadge(selectedJob.status)}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Lịch hẹn đăng:</strong>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>⏰ {formatDateStr(selectedJob.scheduled_for)}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Đường dẫn mục tiêu:</strong>
                <div style={{ fontFamily: 'monospace', color: '#1e293b' }}>{selectedJob.target_path || 'Chưa đặt'}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Cụm &amp; Silo:</strong>
                <div>{selectedJob.cluster} ({selectedJob.silo})</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Model AI tạo nội dung:</strong>
                <div>🧠 {selectedJob.model}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Model tạo hình ảnh:</strong>
                <div>🖼️ {selectedJob.image_model}</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Độ dài tối thiểu:</strong>
                <div>📝 {selectedJob.min_words.toLocaleString()} từ (Gift Guide chuẩn SEO)</div>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>Mã Affiliate Amazon:</strong>
                <div>🏷️ {selectedJob.affiliate_tag}</div>
              </div>
            </div>

            {selectedJob.result?.post_id && (
              <div style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '18px', fontSize: '0.86rem' }}>
                <strong style={{ display: 'block', color: '#166534', marginBottom: '6px' }}>
                  🎉 Bài viết đã tạo thành công:
                </strong>
                <div>- ID bài viết: <code>{selectedJob.result.post_id}</code></div>
                {selectedJob.result.word_count && <div>- Số lượng từ: <strong>{selectedJob.result.word_count.toLocaleString()} từ</strong></div>}
                {selectedJob.result.item_count && <div>- Sản phẩm tuyển chọn: <strong>{selectedJob.result.item_count} món</strong></div>}
                {selectedJob.result.published_at && <div>- Thời điểm xuất bản: {formatDateStr(selectedJob.result.published_at)}</div>}
              </div>
            )}

            {selectedJob.error && (
              <div style={{ padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '18px', fontSize: '0.86rem', color: '#991b1b' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Chi tiết lỗi:</strong>
                {selectedJob.error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="btn-secondary"
                style={{ fontSize: '0.84rem' }}
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  handleRunJob(selectedJob.id);
                  setSelectedJob(null);
                }}
                disabled={runningId === selectedJob.id}
                className="btn-primary"
                style={{ fontSize: '0.84rem' }}
              >
                ⚡ Kích hoạt tạo bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
