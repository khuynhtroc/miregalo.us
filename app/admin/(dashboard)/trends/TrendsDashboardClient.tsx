'use client';

import React, { useState } from 'react';
import type { TrendingItem } from '@/lib/trends/social-listener';
import type { TrendSettings } from '@/app/api/admin/trends/route';

interface TrendsDashboardClientProps {
  initialTrends: TrendingItem[];
  initialSettings: TrendSettings;
  recentPosts: Array<{
    id: string;
    slug: string;
    title: string;
    published_at: string;
    hero_image?: string;
  }>;
}

export function TrendsDashboardClient({
  initialTrends,
  initialSettings,
  recentPosts: initialRecentPosts,
}: TrendsDashboardClientProps) {
  const [trends, setTrends] = useState<TrendingItem[]>(initialTrends);
  const [settings, setSettings] = useState<TrendSettings>(initialSettings);
  const [recentPosts, setRecentPosts] = useState(initialRecentPosts);
  const [isScanning, setIsScanning] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [lastActionResult, setLastActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
    url?: string;
  } | null>(null);

  // 1. Rescan live feeds
  const handleScanNow = async () => {
    setIsScanning(true);
    setLastActionResult(null);
    try {
      const res = await fetch('/api/admin/trends');
      const data = await res.json();
      if (data.success) {
        setTrends(data.trends || []);
        setSettings(data.settings || settings);
        setLastActionResult({
          type: 'success',
          message: `Đã quét thành công ${data.trends?.length || 0} xu hướng thời gian thực từ Google Trends, Variety và Trend Hunter!`,
        });
      } else {
        throw new Error(data.error || 'Scan failed');
      }
    } catch (err: any) {
      setLastActionResult({ type: 'error', message: `Lỗi khi quét xu hướng: ${err.message}` });
    } finally {
      setIsScanning(false);
    }
  };

  // 2. Generate article for a specific trend
  const handleGenerate = async (trend: TrendingItem) => {
    setGeneratingId(trend.id);
    setLastActionResult(null);
    try {
      const res = await fetch('/api/admin/trends/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trend),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setLastActionResult({
          type: 'success',
          message: `✓ Đã tạo và xuất bản bài viết tin tức thành công (${data.result.wordCount} từ)! Đã tự động gửi URL lên Google Indexing API.`,
          url: data.result.url,
        });
        // Add to recent posts list
        setRecentPosts([
          {
            id: data.result.id,
            slug: data.result.slug,
            title: data.result.title,
            published_at: data.result.publishedAt,
            hero_image: trend.picture,
          },
          ...recentPosts,
        ]);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err: any) {
      setLastActionResult({ type: 'error', message: `Lỗi khi tạo bài viết: ${err.message}` });
    } finally {
      setGeneratingId(null);
    }
  };

  // 3. Save auto-pilot settings
  const handleToggleAutoPilot = async () => {
    const updated = { ...settings, autoPilotEnabled: !settings.autoPilotEnabled };
    setSettings(updated);
    try {
      await fetch('/api/admin/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', color: '#111827' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>📡</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#111827' }}>
              Social Listening & Real-Time Trend Jacking
            </h1>
          </div>
          <p style={{ margin: '6px 0 0', color: '#4b5563', fontSize: '0.95rem' }}>
            Tự động theo dõi các xu hướng bùng nổ trong vòng <strong>4–24h</strong> từ Google Trends US, Báo chí Giải trí (Variety, People) và Gift Releases để viết bài dạng News vào chuyên mục <code>/blog/</code>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleScanNow}
            disabled={isScanning}
            style={{
              padding: '10px 18px',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{isScanning ? '⏳' : '🔄'}</span>
            <span>{isScanning ? 'Đang quét dữ liệu...' : 'Quét xu hướng ngay'}</span>
          </button>

          <button
            onClick={handleToggleAutoPilot}
            style={{
              padding: '10px 18px',
              backgroundColor: settings.autoPilotEnabled ? '#10b981' : '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <span>{settings.autoPilotEnabled ? '⚡' : '⏸️'}</span>
            <span>Auto-Pilot: {settings.autoPilotEnabled ? 'BẬT' : 'TẮT'}</span>
          </button>
        </div>
      </div>

      {/* Action Result Alert */}
      {lastActionResult && (
        <div
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            borderRadius: '12px',
            backgroundColor: lastActionResult.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${lastActionResult.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: lastActionResult.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{lastActionResult.message}</div>
            {lastActionResult.url && (
              <div style={{ marginTop: '4px' }}>
                <a
                  href={lastActionResult.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'underline' }}
                >
                  👉 Xem bài viết trực tiếp trên site: {lastActionResult.url}
                </a>
              </div>
            )}
          </div>
          <button
            onClick={() => setLastActionResult(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Xu hướng vừa phát hiện</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', marginTop: '4px' }}>{trends.length}</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>Từ 4 nguồn thời gian thực</div>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Cửa sổ vàng bắt trend</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>4h – 24h</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>Đón sóng Google Discover</div>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Ngưỡng điểm tự động viết</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>&ge; {settings.minScoreThreshold}/100</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>Dựa trên traffic & khả năng mua sắm</div>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Đích đến bài viết</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>/blog/</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>Auto-push Google Indexing</div>
        </div>
      </div>

      {/* Main Grid: Trend Radar & Published Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: Trend Radar */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', color: '#111827' }}>
            Radar Xu Hướng Thời Gian Thực (US Market)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {trends.map((t) => {
              const isGenerating = generatingId === t.id;
              const isHighPriority = t.score >= 75;

              return (
                <div
                  key={t.id}
                  style={{
                    padding: '20px',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: `1px solid ${isHighPriority ? '#fed7aa' : '#e5e7eb'}`,
                    boxShadow: isHighPriority ? '0 4px 12px rgba(234, 88, 12, 0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: t.source === 'Google Trends US' ? '#dbeafe' : t.source === 'Trend Hunter' ? '#fef3c7' : '#fce7f3',
                          color: t.source === 'Google Trends US' ? '#1e40af' : t.source === 'Trend Hunter' ? '#92400e' : '#9d174d',
                        }}
                      >
                        {t.source}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c', backgroundColor: '#fff7ed', padding: '4px 8px', borderRadius: '6px' }}>
                        🔥 {t.traffic}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Phát hiện: {t.hoursAgo <= 1 ? 'Vừa xong' : `${t.hoursAgo} giờ trước`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: t.score >= 75 ? '#ea580c' : '#4b5563' }}>
                        Điểm: {t.score}/100
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px 0', color: '#111827' }}>
                    {t.topic}
                  </h3>

                  <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.5 }}>
                    <strong>Tin tức:</strong> {t.newsHeadline}
                  </p>

                  <div style={{ padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '16px', fontSize: '0.82rem', color: '#374151' }}>
                    <span style={{ fontWeight: 700, color: '#ea580c' }}>💡 Góc nhìn quà tặng/mua sắm: </span>
                    {t.giftAngle}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Chuyên mục: {t.category}</span>

                    <button
                      onClick={() => handleGenerate(t)}
                      disabled={isGenerating}
                      style={{
                        padding: '9px 16px',
                        backgroundColor: isGenerating ? '#9ca3af' : '#ea580c',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <span>{isGenerating ? '⏳' : '✍️'}</span>
                      <span>{isGenerating ? 'Đang viết bài AI...' : 'Viết & Xuất bản tin tức (1-Click)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Published News Log */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', color: '#111827' }}>
            Tin Tức Đã Xuất Bản ({recentPosts.length})
          </h2>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '16px' }}>
            {recentPosts.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: 0 }}>Chưa có bài viết trending nào trong danh sách.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      paddingBottom: '14px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <a
                      href={`/blog/${post.slug}/`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: '#111827',
                        textDecoration: 'none',
                        lineHeight: 1.4,
                        display: 'block',
                      }}
                    >
                      {post.title}
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: '#6b7280' }}>
                      <span>🗓️ {post.published_at?.slice(0, 10)}</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>• /blog/</span>
                      <span style={{ color: '#6366f1' }}>• Indexing API ✓</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
