'use client';

import { useState } from 'react';
import type { MediaFile, CloudStorageSettings } from '@/lib/types';

interface MediaManagerProps {
  initialFiles: MediaFile[];
  initialSettings: CloudStorageSettings;
  stats: {
    totalFiles: number;
    totalSizeBytes: number;
    cloudSyncedCount: number;
    localOnlyCount: number;
  };
}

export function MediaManager({
  initialFiles,
  initialSettings,
  stats: initialStats,
}: MediaManagerProps) {
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [settings, setSettings] = useState<CloudStorageSettings>(initialSettings);
  const [stats, setStats] = useState(initialStats);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'document'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'local' | 'cloudflare_r2' | 'supabase'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals & Drawers
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  // Status & Loaders
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<CloudStorageSettings>(initialSettings);
  const [testingR2, setTestingR2] = useState(false);
  const [r2TestResult, setR2TestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestR2 = async () => {
    setTestingR2(true);
    setR2TestResult(null);
    try {
      const res = await fetch('/api/admin/media/r2/test/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: settingsForm.cloudflare?.account_id,
          accessKeyId: settingsForm.cloudflare?.access_key_id,
          secretAccessKey: settingsForm.cloudflare?.secret_access_key,
          bucketName: settingsForm.cloudflare?.bucket_name,
          publicDomain: settingsForm.cloudflare?.public_domain,
        }),
      });
      const data = await res.json();
      setR2TestResult(data);
    } catch (e: any) {
      setR2TestResult({ success: false, message: e.message || 'Connection test failed' });
    } finally {
      setTestingR2(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSync = async (provider: 'cloudflare_r2' | 'supabase') => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/media/sync/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Successfully synchronized ${data.syncedCount} files with ${provider === 'cloudflare_r2' ? 'Cloudflare R2' : 'Supabase Storage'}!`,
        });
        // Refresh file list
        const refRes = await fetch('/api/admin/media/');
        const refData = await refRes.json();
        setFiles(refData.files || []);
        setStats(refData.stats);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Sync failed' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Network error syncing files' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/media/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      const updated = await res.json();
      if (res.ok) {
        setSettings(updated);
        setShowSettingsModal(false);
        setFeedback({ type: 'success', message: 'Cloud storage settings updated successfully!' });
      } else {
        setFeedback({ type: 'error', message: updated.error || 'Failed to update settings' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error saving settings' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName) return;
    setUploading(true);
    setFeedback(null);

    try {
      let base64: string | undefined;
      let sizeBytes = 150000;
      let mimeType = 'image/jpeg';
      let originalName = uploadName + '.jpg';

      if (selectedLocalFile) {
        originalName = selectedLocalFile.name;
        sizeBytes = selectedLocalFile.size;
        mimeType = selectedLocalFile.type;
        const reader = new FileReader();
        base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedLocalFile);
        });
      }

      const res = await fetch('/api/admin/media/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadName,
          originalName,
          mimeType,
          sizeBytes,
          externalUrl: uploadUrl || undefined,
          altText: uploadAlt || uploadName,
          base64,
        }),
      });

      const newMedia = await res.json();
      if (res.ok) {
        setFiles([newMedia, ...files]);
        setStats((prev) => ({
          ...prev,
          totalFiles: prev.totalFiles + 1,
          totalSizeBytes: prev.totalSizeBytes + sizeBytes,
          cloudSyncedCount: newMedia.synced_to_cloud ? prev.cloudSyncedCount + 1 : prev.cloudSyncedCount,
        }));
        setShowUploadModal(false);
        setUploadName('');
        setUploadAlt('');
        setUploadUrl('');
        setSelectedLocalFile(null);
        setFeedback({ type: 'success', message: `File "${newMedia.name}" uploaded successfully!` });
      } else {
        setFeedback({ type: 'error', message: newMedia.error || 'Failed to upload' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Upload error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;
    try {
      const res = await fetch(`/api/admin/media/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(files.filter((f) => f.id !== id));
        if (selectedFile?.id === id) setSelectedFile(null);
        setFeedback({ type: 'success', message: 'File deleted from media library.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete file' });
    }
  };

  // Filtered files
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.original_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.alt_text && f.alt_text.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || f.mime_type.startsWith(typeFilter);
    const matchesProvider = providerFilter === 'all' || f.storage_provider === providerFilter;

    return matchesSearch && matchesType && matchesProvider;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px', color: '#171a35' }}>
            Media &amp; Cloud Storage Manager
          </h1>
          <p style={{ margin: 0, color: '#69707d', fontSize: '0.92rem' }}>
            Manage images, assets, and synchronize with <strong>Cloudflare R2</strong> or <strong>Supabase Storage</strong> buckets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowSettingsModal(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚙️</span> Storage Settings
          </button>
          <button
            onClick={() => handleSync('cloudflare_r2')}
            disabled={syncing}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', borderColor: '#fdba74', color: '#c2410c' }}
          >
            <span>☁️</span> {syncing ? 'Syncing...' : 'Sync Cloudflare R2'}
          </button>
          <button
            onClick={() => handleSync('supabase')}
            disabled={syncing}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', borderColor: '#6ee7b7', color: '#047857' }}
          >
            <span>⚡</span> {syncing ? 'Syncing...' : 'Sync Supabase'}
          </button>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📤</span> Upload Media
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>
            ✕
          </button>
        </div>
      )}

      {/* Storage Health & Metrics Banner */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Files</span>
          <span className="stat-val">{stats.totalFiles}</span>
          <span className="stat-desc">Images &amp; Brand Assets</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Storage Used</span>
          <span className="stat-val">{formatBytes(stats.totalSizeBytes)}</span>
          <span className="stat-desc">Optimized WebP / JPEG</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cloud Synced</span>
          <span className="stat-val" style={{ color: '#059669' }}>
            {stats.cloudSyncedCount} / {stats.totalFiles}
          </span>
          <span className="stat-desc">Hosted on R2 / Supabase CDN</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Provider</span>
          <span className="stat-val" style={{ fontSize: '1.25rem', color: '#6366f1' }}>
            {settings.provider === 'cloudflare_r2' ? 'Cloudflare R2' : settings.provider === 'supabase' ? 'Supabase Storage' : 'Local Disk'}
          </span>
          <span className="stat-desc">Auto-sync: {settings.auto_sync ? 'Active' : 'Manual'}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '320px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media by name, alt text or filename..."
              className="form-input"
              style={{ maxWidth: '380px' }}
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="form-select"
              style={{ maxWidth: '160px' }}
            >
              <option value="all">All File Types</option>
              <option value="image">Images (JPEG/PNG/WebP)</option>
              <option value="document">Documents</option>
            </select>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value as any)}
              className="form-select"
              style={{ maxWidth: '190px' }}
            >
              <option value="all">All Storage Tiers</option>
              <option value="cloudflare_r2">Cloudflare R2 CDN</option>
              <option value="supabase">Supabase Storage</option>
              <option value="local">Local Storage</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: viewMode === 'grid' ? '#171a35' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#475569',
                cursor: 'pointer',
              }}
            >
              🔲 Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: viewMode === 'list' ? '#171a35' : '#ffffff',
                color: viewMode === 'list' ? '#ffffff' : '#475569',
                cursor: 'pointer',
              }}
            >
              📑 List
            </button>
          </div>
        </div>
      </div>

      {/* Files Gallery */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
          {filteredFiles.map((f) => (
            <div
              key={f.id}
              className="admin-card"
              style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                position: 'relative',
              }}
            >
              {/* Image Preview */}
              <div
                style={{
                  height: '160px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedFile(f)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={f.alt_text || f.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80';
                  }}
                />
              </div>

              {/* Provider Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    background:
                      f.storage_provider === 'cloudflare_r2'
                        ? '#fff7ed'
                        : f.storage_provider === 'supabase'
                        ? '#ecfdf5'
                        : '#f1f5f9',
                    color:
                      f.storage_provider === 'cloudflare_r2'
                        ? '#c2410c'
                        : f.storage_provider === 'supabase'
                        ? '#047857'
                        : '#475569',
                  }}
                >
                  {f.storage_provider === 'cloudflare_r2'
                    ? 'Cloudflare R2'
                    : f.storage_provider === 'supabase'
                    ? 'Supabase'
                    : 'Local'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatBytes(f.size_bytes)}</span>
              </div>

              {/* Title & Metadata */}
              <h4
                style={{
                  margin: '0 0 4px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={f.name}
              >
                {f.name}
              </h4>
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {f.original_name}
              </p>

              {/* Action Buttons */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleCopyLink(f.url, f.id)}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    background: copiedId === f.id ? '#ecfdf5' : undefined,
                    borderColor: copiedId === f.id ? '#10b981' : undefined,
                    color: copiedId === f.id ? '#047857' : undefined,
                  }}
                >
                  {copiedId === f.id ? '✓ Copied!' : '📋 Copy URL'}
                </button>
                <button
                  onClick={() => setSelectedFile(f)}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  🔍 View
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  style={{
                    background: 'none',
                    border: '1px solid #fee2e2',
                    color: '#ef4444',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                  title="Delete File"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Preview</th>
                <th>File Name &amp; Key</th>
                <th>Provider</th>
                <th>MIME Type</th>
                <th>Size</th>
                <th>Linked To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((f) => (
                <tr key={f.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.url}
                      alt={f.name}
                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{f.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.original_name}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        background:
                          f.storage_provider === 'cloudflare_r2'
                            ? '#fff7ed'
                            : f.storage_provider === 'supabase'
                            ? '#ecfdf5'
                            : '#f1f5f9',
                        color:
                          f.storage_provider === 'cloudflare_r2'
                            ? '#c2410c'
                            : f.storage_provider === 'supabase'
                            ? '#047857'
                            : '#475569',
                      }}
                    >
                      {f.storage_provider === 'cloudflare_r2'
                        ? 'Cloudflare R2'
                        : f.storage_provider === 'supabase'
                        ? 'Supabase'
                        : 'Local'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#475569' }}>{f.mime_type}</td>
                  <td style={{ fontSize: '0.82rem', color: '#475569' }}>{formatBytes(f.size_bytes)}</td>
                  <td>
                    {f.used_in && f.used_in.length > 0 ? (
                      <span style={{ fontSize: '0.78rem', color: '#0284c7', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px' }}>
                        {f.used_in.length} asset(s)
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleCopyLink(f.url, f.id)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        {copiedId === f.id ? '✓' : 'Copy'}
                      </button>
                      <button
                        onClick={() => setSelectedFile(f)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px 6px',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* File Detail Modal */}
      {selectedFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="admin-card"
            style={{ width: '600px', maxWidth: '90vw', padding: '24px', background: '#ffffff', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Media Asset Details</h3>
              <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '18px', marginBottom: '18px' }}>
              <div style={{ width: '200px', height: '160px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedFile.url} alt={selectedFile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#64748b' }}>Name:</strong>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{selectedFile.name}</div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#64748b' }}>File Size:</strong>
                  <div>{formatBytes(selectedFile.size_bytes)}</div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#64748b' }}>Storage Provider:</strong>
                  <div>
                    {selectedFile.storage_provider === 'cloudflare_r2' ? 'Cloudflare R2' : selectedFile.storage_provider === 'supabase' ? 'Supabase' : 'Local Disk'}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#64748b' }}>Alt Text:</strong>
                  <div>{selectedFile.alt_text || '—'}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Public CDN URL
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" readOnly value={selectedFile.url} className="form-input" style={{ flex: 1, fontSize: '0.8rem' }} />
                <button onClick={() => handleCopyLink(selectedFile.url, selectedFile.id)} className="btn-secondary">
                  {copiedId === selectedFile.id ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {selectedFile.used_in && selectedFile.used_in.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>
                  Referenced In Content:
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedFile.used_in.map((ref, idx) => (
                    <a
                      key={idx}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.82rem', color: '#0284c7', textDecoration: 'none' }}
                    >
                      🔗 {ref.title} ({ref.type})
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => handleDelete(selectedFile.id)} className="btn-secondary" style={{ color: '#dc2626' }}>
                Delete Asset
              </button>
              <button onClick={() => setSelectedFile(null)} className="btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Media Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="admin-card"
            style={{ width: '520px', maxWidth: '90vw', padding: '24px', background: '#ffffff', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Upload Media Asset</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Asset Title / Name *</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Lámpara Luna Aniversario"
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Alt Text (SEO Description)</label>
                <input
                  type="text"
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  placeholder="e.g. Lámpara de luna 3D para regalo de novios"
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Local File Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedLocalFile(file);
                    if (file && !uploadName) {
                      setUploadName(file.name.replace(/\.[^/.]+$/, '').replace(/-/g, ' '));
                    }
                  }}
                  className="form-input"
                  style={{ padding: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label className="form-label">Or External Image URL (Unsplash / CDN)</label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? 'Uploading...' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloud Storage Settings Modal */}
      {showSettingsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="admin-card"
            style={{ width: '640px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#ffffff', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Cloud Storage Configuration</h3>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings}>
              {/* Active Provider Selector */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Active Storage Engine</label>
                <select
                  value={settingsForm.provider}
                  onChange={(e) => setSettingsForm({ ...settingsForm, provider: e.target.value as any })}
                  className="form-select"
                >
                  <option value="cloudflare_r2">Cloudflare R2 (Global CDN &amp; Zero Egress Fees)</option>
                  <option value="supabase">Supabase Storage (Postgres-Integrated S3)</option>
                  <option value="local">Local Filesystem Storage (public/uploads)</option>
                </select>
              </div>

              {/* Cloudflare R2 Credentials */}
              <div style={{ padding: '16px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>☁️</span> Cloudflare R2 Configuration
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>R2 Account ID</label>
                    <input
                      type="text"
                      value={settingsForm.cloudflare?.account_id || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          cloudflare: { ...settingsForm.cloudflare!, account_id: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>R2 Bucket Name</label>
                    <input
                      type="text"
                      value={settingsForm.cloudflare?.bucket_name || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          cloudflare: { ...settingsForm.cloudflare!, bucket_name: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Access Key ID</label>
                    <input
                      type="text"
                      value={settingsForm.cloudflare?.access_key_id || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          cloudflare: { ...settingsForm.cloudflare!, access_key_id: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Secret Access Key</label>
                    <input
                      type="password"
                      value={settingsForm.cloudflare?.secret_access_key || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          cloudflare: { ...settingsForm.cloudflare!, secret_access_key: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Public Custom Domain / CDN URL</label>
                  <input
                    type="url"
                    value={settingsForm.cloudflare?.public_domain || ''}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        cloudflare: { ...settingsForm.cloudflare!, public_domain: e.target.value },
                      })
                    }
                    placeholder="https://cdn.miregalo.us"
                    className="form-input"
                  />
                </div>

                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleTestR2}
                    disabled={testingR2}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '6px 14px', background: '#ffedd5', borderColor: '#fed7aa', color: '#9a3412' }}
                  >
                    {testingR2 ? 'Testing Connection...' : '⚡ Test R2 Connection'}
                  </button>
                  {r2TestResult && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: r2TestResult.success ? '#15803d' : '#b91c1c' }}>
                      {r2TestResult.success ? '✅ ' : '❌ '}
                      {r2TestResult.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Supabase Storage Credentials */}
              <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡</span> Supabase Storage Configuration
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Project URL</label>
                    <input
                      type="url"
                      value={settingsForm.supabase?.project_url || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          supabase: { ...settingsForm.supabase!, project_url: e.target.value },
                        })
                      }
                      placeholder="https://xyz.supabase.co"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>Storage Bucket</label>
                    <input
                      type="text"
                      value={settingsForm.supabase?.bucket_name || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          supabase: { ...settingsForm.supabase!, bucket_name: e.target.value },
                        })
                      }
                      placeholder="giftblog-media"
                      className="form-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Service Role Key</label>
                  <input
                    type="password"
                    value={settingsForm.supabase?.service_role_key || ''}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        supabase: { ...settingsForm.supabase!, service_role_key: e.target.value },
                      })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              {/* Options */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={settingsForm.auto_sync}
                    onChange={(e) => setSettingsForm({ ...settingsForm, auto_sync: e.target.checked })}
                  />
                  <span>Automatically synchronize newly uploaded assets to cloud storage</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={savingSettings} className="btn-primary">
                  {savingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
