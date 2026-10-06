'use client';

import { useState } from 'react';
import type { ContentJob } from '@/lib/types';
import type { JobExecutionLog } from '@/lib/ai/types';

interface JobQueueViewerProps {
  initialJobs: ContentJob[];
}

export function JobQueueViewer({ initialJobs }: JobQueueViewerProps) {
  const [jobs, setJobs] = useState<ContentJob[]>(initialJobs);
  const [selectedJob, setSelectedJob] = useState<ContentJob | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newCluster, setNewCluster] = useState('Mamá');
  const [msg, setMsg] = useState('');

  const fetchJobs = async (status = statusFilter) => {
    try {
      const url = status ? `/api/admin/jobs/?status=${status}` : '/api/admin/jobs/';
      const res = await fetch(url);
      const data = await res.json();
      setJobs(data.rows || []);
    } catch {}
  };

  const handleRunJob = async (jobId: string) => {
    setRunningId(jobId);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMsg(`Job ${jobId} finished with status: ${data.job.status}`);
        setJobs(jobs.map((j) => (j.id === jobId ? data.job : j)));
        if (selectedJob && selectedJob.id === jobId) setSelectedJob(data.job);
      } else {
        setMsg(data.error || 'Job failed');
      }
    } catch {
      setMsg('Error executing job');
    } finally {
      setRunningId(null);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic) return;
    try {
      const res = await fetch('/api/admin/jobs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newTopic,
          cluster: newCluster,
          model: 'mock-v1',
          maxRetries: 3,
        }),
      });
      const created = await res.json();
      if (res.ok) {
        setJobs([created, ...jobs]);
        setIsNewModalOpen(false);
        setNewTopic('');
        setMsg(`Job enqueued: ${created.id}`);
      }
    } catch {
      setMsg('Failed to enqueue job');
    }
  };

  const parseLogs = (job: ContentJob): JobExecutionLog[] => {
    try {
      if (!job.log) return [];
      const parsed = JSON.parse(job.log);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const filteredJobs = statusFilter ? jobs.filter((j) => j.status === statusFilter) : jobs;

  return (
    <div>
      {/* ── Toolbar ────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['', 'queued', 'researching', 'generating', 'completed', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                fetchJobs(st);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                background: statusFilter === st ? '#1e293b' : '#ffffff',
                color: statusFilter === st ? '#ffffff' : '#475569',
                cursor: 'pointer',
              }}
            >
              {st === '' ? 'All Jobs' : st.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}
        >
          + Enqueue ContentJob (Mock Mode)
        </button>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '20px' }}>
          {msg}
        </div>
      )}

      {/* ── Jobs Table ─────────────────────────── */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '32px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Job ID</th>
              <th>Topic / Target</th>
              <th>Status</th>
              <th>Model</th>
              <th>Attempts</th>
              <th>Duration</th>
              <th>Created</th>
              <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  No ContentJobs found. Enqueue a job above to test the queue, retry mechanism, and logging.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#475569' }}>
                    {job.id}
                  </td>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{job.topic}</strong>
                    {job.target_path && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {job.target_path}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          job.status === 'completed'
                            ? '#dcfce7'
                            : job.status === 'failed'
                            ? '#fee2e2'
                            : job.status === 'queued'
                            ? '#f1f5f9'
                            : '#e0f2fe',
                        color:
                          job.status === 'completed'
                            ? '#15803d'
                            : job.status === 'failed'
                            ? '#991b1b'
                            : job.status === 'queued'
                            ? '#475569'
                            : '#0369a1',
                      }}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {job.model}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {job.attempts || 0} / {job.max_attempts || 3}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {job.duration_ms ? `${job.duration_ms}ms` : '-'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }} suppressHydrationWarning>
                    {new Date(job.created_at).toLocaleTimeString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
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
                          color: '#0284c7',
                        }}
                      >
                        {runningId === job.id ? 'Running...' : job.status === 'completed' ? 'Re-run' : 'Run / Retry'}
                      </button>
                      <button
                        onClick={() => setSelectedJob(job)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Logs
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Log Inspector Drawer ───────────────── */}
      {selectedJob && (
        <div className="admin-card" style={{ border: '2px solid #0284c7', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Job Execution Log: {selectedJob.id}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Topic: <strong>{selectedJob.topic}</strong> • Status: <strong>{selectedJob.status}</strong>
              </p>
            </div>
            <button
              onClick={() => setSelectedJob(null)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>

          <div style={{ background: '#0f172a', color: '#e2e8f0', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.82rem', maxHeight: '350px', overflowY: 'auto' }}>
            {parseLogs(selectedJob).length === 0 ? (
              <div style={{ color: '#94a3b8' }}>No logs recorded yet.</div>
            ) : (
              parseLogs(selectedJob).map((log, i) => (
                <div key={i} style={{ marginBottom: '6px', lineHeight: 1.5 }}>
                  <span style={{ color: '#64748b' }} suppressHydrationWarning>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span
                    style={{
                      color:
                        log.level === 'error'
                          ? '#f87171'
                          : log.level === 'warn'
                          ? '#facc15'
                          : '#38bdf8',
                      fontWeight: 600,
                    }}
                  >
                    [{log.stage.toUpperCase()}]
                  </span>{' '}
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Enqueue Modal ──────────────────────── */}
      {isNewModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
              Enqueue ContentJob (Mock Safe Mode)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Runs via Mock Provider using Zod structured schema without incurring API costs.
            </p>

            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Topic / Search Query
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regalos originales para mamá en su cumpleaños"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Target Cluster
                </label>
                <select
                  value={newCluster}
                  onChange={(e) => setNewCluster(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {['Mamá', 'Papá', 'Novia', 'Novio', 'Esposa', 'Esposo', 'Cumpleaños', 'Navidad', 'Aniversario'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Enqueue Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
