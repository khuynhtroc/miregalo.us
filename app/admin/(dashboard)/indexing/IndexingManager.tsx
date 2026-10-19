'use client';

import React, { useState } from 'react';
import type { GoogleIndexingSettings, IndexingLogItem } from '@/lib/indexing/google';

interface Props {
  initialSettings: GoogleIndexingSettings & { has_private_key?: boolean };
  initialLogs: IndexingLogItem[];
  recentPosts: Array<{ id: string; slug: string; title: string; published_at?: string }>;
  categories: Array<{ id: string; slug: string; name: string }>;
  siteUrl: string;
}

export function IndexingManager({
  initialSettings,
  initialLogs,
  recentPosts,
  categories,
  siteUrl,
}: Props) {
  const [activeTab, setActiveTab] = useState<'settings' | 'manual' | 'history'>('manual');
  const [settings, setSettings] = useState(initialSettings);
  const [logs, setLogs] = useState<IndexingLogItem[]>(initialLogs);

  // Form states for settings
  const [autoSubmit, setAutoSubmit] = useState(settings.auto_submit_on_publish ?? true);
  const [pingSitemap, setPingSitemap] = useState(settings.ping_sitemap ?? true);
  const [clientEmail, setClientEmail] = useState(settings.client_email || '');
  const [privateKey, setPrivateKey] = useState('');
  const [jsonKeyInput, setJsonKeyInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; raw?: any } | null>(null);

  // Form states for manual submission
  const [customUrls, setCustomUrls] = useState('');
  const [actionType, setActionType] = useState<'URL_UPDATED' | 'URL_DELETED'>('URL_UPDATED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    success: boolean;
    message: string;
    results?: Array<{ url: string; success: boolean; message: string }>;
  } | null>(null);

  // Fast preset helper
  const handlePresetRecentPosts = () => {
    const urls = recentPosts.map((p) => `${siteUrl}/${p.slug.replace(/^\/|\/$/g, '')}/`);
    setCustomUrls(urls.join('\n'));
    setSubmitFeedback(null);
  };

  const handlePresetCategories = () => {
    const urls = [
      `${siteUrl}/`,
      ...categories.map((c) => `${siteUrl}/categoria/${c.slug.replace(/^\/|\/$/g, '')}/`),
    ];
    setCustomUrls(urls.join('\n'));
    setSubmitFeedback(null);
  };

  // Save Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/indexing/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          auto_submit_on_publish: autoSubmit,
          ping_sitemap: pingSitemap,
          client_email: clientEmail.trim(),
          private_key: privateKey.trim() || undefined,
          service_account_json: jsonKeyInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lưu cài đặt thất bại');
      }

      setSettings(data.settings);
      setClientEmail(data.settings.client_email || '');
      setPrivateKey('');
      setJsonKeyInput('');
      alert('Đã lưu cấu hình Google Indexing thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/indexing/test/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_email: clientEmail.trim() || undefined,
          private_key: privateKey.trim() || undefined,
          service_account_json: jsonKeyInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Lỗi kiểm tra kết nối API',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Submit URLs
  const handleSubmitUrls = async () => {
    const lines = customUrls
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http://') || l.startsWith('https://'));

    if (lines.length === 0) {
      alert('Vui lòng nhập ít nhất một URL hợp lệ (bắt đầu bằng http:// hoặc https://)');
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await fetch('/api/admin/indexing/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: lines,
          type: actionType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submit URL thất bại');
      }

      setSubmitFeedback({
        success: true,
        message: `Đã xử lý ${data.processed || lines.length} URL lên Google Indexing.`,
        results: data.results,
      });

      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err: any) {
      setSubmitFeedback({
        success: false,
        message: err.message || 'Lỗi khi gửi yêu cầu Indexing',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh Logs
  const handleRefreshLogs = async () => {
    try {
      const res = await fetch('/api/admin/indexing/');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.warn('Failed to refresh logs:', err);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header & Status Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '16px',
          padding: '28px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '2rem' }}>🚀</span>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Google Auto Indexing &amp; Push API
              </h1>
            </div>
            <p style={{ margin: 0, color: '#e0e7ff', fontSize: '0.95rem', maxWidth: '650px', lineHeight: 1.5 }}>
              Tự động gửi URL bài viết mới và cập nhật lên Google ngay lập tức khi xuất bản. Đảm bảo bot Google cào và lập chỉ mục trong vài phút thay vì chờ đợi nhiều ngày.
            </p>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: isTesting ? 'wait' : 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{isTesting ? '⏳' : '⚡'}</span>
            <span>{isTesting ? 'Đang test kết nối...' : 'Kiểm tra kết nối API'}</span>
          </button>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.85rem',
              color: '#ffffff',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: autoSubmit ? '#4ade80' : '#94a3b8',
              }}
            />
            <span>
              Auto Submit:{' '}
              <strong style={{ color: autoSubmit ? '#4ade80' : '#f87171' }}>
                {autoSubmit ? 'Đang BẬT' : 'Đã TẮT'}
              </strong>
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.85rem',
              color: '#ffffff',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: settings.client_email ? '#4ade80' : '#facc15',
              }}
            />
            <span>
              Service Account:{' '}
              <strong style={{ color: settings.client_email ? '#4ade80' : '#facc15' }}>
                {settings.client_email ? settings.client_email.split('@')[0] : 'Chưa cấu hình'}
              </strong>
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.85rem',
              color: '#ffffff',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: pingSitemap ? '#4ade80' : '#94a3b8',
              }}
            />
            <span>
              Sitemap Ping Fallback:{' '}
              <strong style={{ color: pingSitemap ? '#4ade80' : '#94a3b8' }}>
                {pingSitemap ? 'Kích hoạt' : 'Tắt'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Test Connection Alert Modal / Card */}
      {testResult && (
        <div
          style={{
            backgroundColor: testResult.success ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${testResult.success ? '#10b981' : '#f87171'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>{testResult.success ? '✅' : '⚠️'}</span>
          <div style={{ flex: 1 }}>
            <h4
              style={{
                margin: '0 0 4px',
                fontWeight: 700,
                color: testResult.success ? '#065f46' : '#991b1b',
              }}
            >
              {testResult.success ? 'Kiểm tra kết nối thành công!' : 'Lỗi kết nối Google API'}
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '0.92rem',
                color: testResult.success ? '#047857' : '#b91c1c',
                lineHeight: 1.5,
              }}
            >
              {testResult.message}
            </p>
          </div>
          <button
            onClick={() => setTestResult(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: '1.1rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            borderBottom: activeTab === 'manual' ? '2px solid #4f46e5' : '2px solid transparent',
            color: activeTab === 'manual' ? '#4f46e5' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚡</span>
          <span>Submit Thủ Công &amp; Hàng Loạt</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid #4f46e5' : '2px solid transparent',
            color: activeTab === 'settings' ? '#4f46e5' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚙️</span>
          <span>Cấu Hình Service Account</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid #4f46e5' : '2px solid transparent',
            color: activeTab === 'history' ? '#4f46e5' : '#64748b',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📋</span>
          <span>Nhật Ký Gửi Index ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: MANUAL & BULK SUBMISSION */}
      {activeTab === 'manual' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 12px', color: '#1e293b' }}>
                Đẩy URL Lên Google Search Indexing
              </h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.9rem' }}>
                Nhập danh sách URL cần ép bot Google cào lại (mỗi dòng 1 URL). Tối đa 100 URL mỗi lần gửi.
              </p>

              {/* Action type radio */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === 'URL_UPDATED'}
                    onChange={() => setActionType('URL_UPDATED')}
                  />
                  <span>
                    <strong>URL_UPDATED</strong> (Bài mới / Cập nhật nội dung)
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === 'URL_DELETED'}
                    onChange={() => setActionType('URL_DELETED')}
                  />
                  <span>
                    <strong>URL_DELETED</strong> (Xóa URL khỏi Google)
                  </span>
                </label>
              </div>

              {/* Textarea */}
              <textarea
                rows={8}
                value={customUrls}
                onChange={(e) => setCustomUrls(e.target.value)}
                placeholder={`https://www.miregalo.us/\nhttps://www.miregalo.us/ideas-regalos-san-valentin/\nhttps://www.miregalo.us/regalos-cumpleanos-mujer/`}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handlePresetRecentPosts}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Lấy 20 bài mới nhất
                  </button>
                  <button
                    type="button"
                    onClick={handlePresetCategories}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    🗺️ Lấy Trang chủ &amp; Danh mục
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomUrls('')}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#64748b',
                    }}
                  >
                    Xóa ô
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitUrls}
                  disabled={isSubmitting || !customUrls.trim()}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSubmitting || !customUrls.trim() ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || !customUrls.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{isSubmitting ? '⏳' : '🚀'}</span>
                  <span>{isSubmitting ? 'Đang gửi...' : 'Đẩy lên Google Indexing'}</span>
                </button>
              </div>

              {/* Feedback box */}
              {submitFeedback && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: submitFeedback.success ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${submitFeedback.success ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  <h4 style={{ margin: '0 0 8px', color: submitFeedback.success ? '#15803d' : '#b91c1c' }}>
                    {submitFeedback.message}
                  </h4>
                  {submitFeedback.results && (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                      {submitFeedback.results.map((r, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                          }}
                        >
                          <span style={{ fontFamily: 'monospace', color: '#334155' }}>{r.url}</span>
                          <span style={{ fontWeight: 600, color: r.success ? '#16a34a' : '#dc2626' }}>
                            {r.success ? 'Thành công (200)' : 'Lỗi'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Side Info */}
          <div>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <h4 style={{ margin: '0 0 10px', fontSize: '0.98rem', fontWeight: 700, color: '#1e293b' }}>
                💡 Cách thức hoạt động
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '0.87rem', lineHeight: 1.6 }}>
                <li>
                  <strong>Tự động (Automated):</strong> Mỗi khi bạn tạo mới, sửa bài viết hoặc Cron tự động xuất bản bài lên lịch, hệ thống sẽ tự động gọi Google Indexing API mà không cần bấm thủ công.
                </li>
                <li>
                  <strong>Direct OAuth RSA-SHA256:</strong> Kết nối bảo mật chuẩn JWT không qua trung gian bên thứ ba, bảo mật tối đa API key.
                </li>
                <li>
                  <strong>Sitemap Ping:</strong> Song song với Indexing API, website gửi tín hiệu ping tới <code style={{ backgroundColor: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>/sitemap.xml</code> để Google bot làm mới sơ đồ web.
                </li>
              </ul>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                📝 5 Bài Viết Xuất Bản Gần Nhất
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentPosts.slice(0, 5).map((p) => {
                  const fullUrl = `${siteUrl}/${p.slug.replace(/^\/|\/$/g, '')}/`;
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '10px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.title}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>/{p.slug}/</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomUrls(fullUrl);
                            setActiveTab('manual');
                          }}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '4px',
                            color: '#1d4ed8',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Chọn URL này
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS (SERVICE ACCOUNT JSON) */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '850px' }}>
          <form
            onSubmit={handleSaveSettings}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px', color: '#1e293b' }}>
              Cấu Hình Google Cloud Service Account
            </h3>

            {/* Step-by-step guidance */}
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '0.88rem',
                color: '#1e40af',
                lineHeight: 1.6,
              }}
            >
              <h4 style={{ margin: '0 0 6px', fontWeight: 700, color: '#1d4ed8' }}>
                Hướng dẫn kích hoạt Google Indexing API miễn phí (200 URLs/ngày):
              </h4>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>
                  Truy cập{' '}
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: '#1d4ed8', fontWeight: 600 }}>
                    Google Cloud Console
                  </a>{' '}
                  và bật <strong>Web Search Indexing API</strong>.
                </li>
                <li>
                  Vào mục <strong>IAM &amp; Quản trị &gt; Tài khoản dịch vụ (Service Accounts)</strong> &gt; Bấm Tạo tài khoản dịch vụ mới (ví dụ: <code style={{ backgroundColor: '#dbeafe', padding: '1px 4px', borderRadius: '3px' }}>google-indexing-bot</code>).
                </li>
                <li>
                  Tại tab <strong>Khóa (Keys)</strong> của Service Account, chọn <strong>Thêm khóa &gt; Tạo khóa mới dạng JSON</strong> và tải file về.
                </li>
                <li>
                  <strong>Quan trọng nhất:</strong> Mở{' '}
                  <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: '#1d4ed8', fontWeight: 600 }}>
                    Google Search Console
                  </a>{' '}
                  chọn trang web <code style={{ backgroundColor: '#dbeafe', padding: '1px 4px', borderRadius: '3px' }}>{siteUrl}</code> &gt; <strong>Cài đặt &gt; Người dùng và quyền</strong> &gt; Thêm email Service Account làm <strong>Chủ sở hữu (Owner)</strong>.
                </li>
                <li>Dán toàn bộ nội dung file JSON vào ô bên dưới rồi nhấn <strong>Lưu cấu hình</strong>.</li>
              </ol>
            </div>

            {/* Auto Submit Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                  Tự động Submit URL khi Xuất bản hoặc Cập nhật bài viết
                </strong>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  Kích hoạt tự động cho cả bài viết thủ công và các bài chạy từ Cron tự động (AI Auto-Pilot).
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSubmit}
                onChange={(e) => setAutoSubmit(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Sitemap Ping Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                  Gửi tín hiệu Ping Google Sitemap (/sitemap.xml)
                </strong>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  Gửi lệnh ping trực tiếp tới Google Sitemap endpoint sau mỗi lần nạp bài.
                </p>
              </div>
              <input
                type="checkbox"
                checked={pingSitemap}
                onChange={(e) => setPingSitemap(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Fast Paste JSON */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', color: '#1e293b' }}>
                📁 Dán file Service Account JSON (Khuyên dùng):
              </label>
              <textarea
                rows={5}
                value={jsonKeyInput}
                onChange={(e) => setJsonKeyInput(e.target.value)}
                placeholder={`{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",\n  "client_email": "indexing-bot@...iam.gserviceaccount.com"\n}`}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Hệ thống sẽ tự động tách Client Email và RSA Private Key từ nội dung JSON.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>HOẶC NHẬP TỪNG TRƯỜNG THỦ CÔNG</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            {/* Individual fields */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', color: '#1e293b' }}>
                Client Email (Service Account):
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="example@project-id.iam.gserviceaccount.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px', color: '#1e293b' }}>
                Private Key (RSA Private Key PEM):
              </label>
              <textarea
                rows={4}
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder={settings.has_private_key ? '•••••••• [Đã cấu hình Private Key trong hệ thống. Để trống nếu không muốn đổi] ••••••••' : '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Submit & Test buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: '#334155',
                  cursor: isTesting ? 'wait' : 'pointer',
                }}
              >
                {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra xác thực'}
              </button>

              <button
                type="submit"
                disabled={isSavingSettings}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSavingSettings ? 'wait' : 'pointer',
                }}
              >
                {isSavingSettings ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: REALTIME HISTORY LOGS */}
      {activeTab === 'history' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px', color: '#1e293b' }}>
                Lịch Sử Đẩy URL Lên Google Search Indexing
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                Hiển thị tối đa 150 yêu cầu gần nhất qua Google Indexing API và Sitemap Ping.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefreshLogs}
              style={{
                padding: '8px 14px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Làm mới
            </button>
          </div>

          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>📭</span>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>Chưa có yêu cầu Indexing nào được ghi nhận.</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>
                Hãy thử xuất bản một bài viết mới hoặc submit URL ở tab &quot;Submit Thủ Công&quot;.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 10px', width: '180px' }}>Thời gian</th>
                    <th style={{ padding: '12px 10px' }}>URL</th>
                    <th style={{ padding: '12px 10px', width: '120px' }}>Loại</th>
                    <th style={{ padding: '12px 10px', width: '130px' }}>Trạng thái</th>
                    <th style={{ padding: '12px 10px' }}>Chi tiết phản hồi</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const formattedDate = new Date(log.timestamp).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                    });

                    let statusBadge;
                    if (log.status === 'success') {
                      statusBadge = (
                        <span
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          Thành công {log.statusCode ? `(${log.statusCode})` : ''}
                        </span>
                      );
                    } else if (log.status === 'simulated') {
                      statusBadge = (
                        <span
                          style={{
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          Mô phỏng
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          Lỗi {log.statusCode ? `(${log.statusCode})` : ''}
                        </span>
                      );
                    }

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '0.82rem' }}>
                          {formattedDate}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <a
                            href={log.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontFamily: 'monospace',
                              color: '#2563eb',
                              textDecoration: 'none',
                              fontSize: '0.84rem',
                            }}
                          >
                            {log.url}
                          </a>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            style={{
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                            }}
                          >
                            {log.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>{statusBadge}</td>
                        <td style={{ padding: '12px 10px', color: '#475569', fontSize: '0.82rem' }}>
                          {log.message || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
