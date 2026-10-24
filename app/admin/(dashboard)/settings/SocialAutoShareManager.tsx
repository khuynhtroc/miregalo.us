'use client';

import { useState, useEffect } from 'react';
import type { SocialSettings } from '@/lib/social/types';
import { X_OAUTH_CALLBACK_URL } from '@/lib/social/twitter-oauth-config';
import { PINTEREST_OAUTH_CALLBACK_URL } from '@/lib/social/pinterest-oauth-config';

type SocialSettingsWithConnections = Omit<SocialSettings, 'pinterest_access_token'> & {
  pinterest_access_token?: string;
  twitter_oauth2_connected?: boolean;
  twitter_oauth2_client_secret_configured?: boolean;
  pinterest_oauth_connected?: boolean;
  pinterest_client_secret_configured?: boolean;
  pinterest_token_configured?: boolean;
};

function suggestedBackfillStart() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 16);
}

export function SocialAutoShareManager() {
  const [settings, setSettings] = useState<SocialSettingsWithConnections | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingX, setConnectingX] = useState(false);
  const [connectingPinterest, setConnectingPinterest] = useState(false);
  const [backfillStartAt, setBackfillStartAt] = useState(suggestedBackfillStart);
  const [backfillInterval, setBackfillInterval] = useState(240);
  const [backfillBusy, setBackfillBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    channel: string;
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const connectionResult = url.searchParams.get('x_connection');
    const pinterestConnectionResult = url.searchParams.get('pinterest_connection');

    if (connectionResult) {
      if (connectionResult === 'connected') {
        setMsg({ type: 'success', text: '✅ Đã kết nối X thành công. Bạn có thể bật tự động chia sẻ và lưu cấu hình.' });
      } else if (connectionResult === 'denied') {
        setMsg({ type: 'error', text: 'Bạn đã hủy quyền kết nối với X.' });
      } else if (connectionResult === 'missing_credentials') {
        setMsg({ type: 'error', text: 'Hãy nhập Client ID và Client Secret của X, lưu cấu hình rồi kết nối lại.' });
      } else {
        setMsg({ type: 'error', text: 'Kết nối X chưa hoàn tất. Hãy thử lại và kiểm tra Callback URI trong X Developer Console.' });
      }
      url.searchParams.delete('x_connection');
    }

    if (pinterestConnectionResult) {
      if (pinterestConnectionResult === 'connected') {
        setMsg({ type: 'success', text: '✅ Pinterest đã kết nối với đủ quyền tạo boards và Pins. Token sẽ tự được làm mới.' });
      } else if (pinterestConnectionResult === 'denied') {
        setMsg({ type: 'error', text: 'Bạn đã hủy kết nối Pinterest.' });
      } else if (pinterestConnectionResult === 'missing_credentials') {
        setMsg({ type: 'error', text: 'Nhập Pinterest App ID và Client Secret, lưu cấu hình rồi kết nối lại.' });
      } else if (pinterestConnectionResult === 'missing_scopes') {
        setMsg({ type: 'error', text: 'Pinterest chưa cấp đủ quyền boards:read, boards:write, pins:read và pins:write cho ứng dụng.' });
      } else {
        setMsg({ type: 'error', text: 'Kết nối Pinterest chưa hoàn tất. Kiểm tra Callback URI trong Pinterest Developer Portal rồi thử lại.' });
      }
      url.searchParams.delete('pinterest_connection');
    }

    if (connectionResult || pinterestConnectionResult) {
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/social/settings/');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        setMsg({ type: 'error', text: 'Không thể tải cấu hình Social Auto-Share' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Lỗi kết nối khi tải cấu hình' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMsg(null);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/social/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setMsg({ type: 'success', text: '✅ Đã lưu cấu hình Mạng Xã Hội thành công!' });
        setTimeout(() => setMsg(null), 4000);
      } else {
        setMsg({ type: 'error', text: `❌ Lỗi khi lưu: ${data.error || 'Unknown error'}` });
      }
    } catch {
      setMsg({ type: 'error', text: '❌ Lỗi kết nối máy chủ khi lưu cấu hình' });
    } finally {
      setSaving(false);
    }
  };

  const handleBackfillAction = async (action: 'start' | 'post_now' | 'pause' | 'resume' | 'reset') => {
    if (!settings) return;
    if (action === 'reset' && !window.confirm('Xóa hàng đợi hiện tại? Các bài đã đăng sẽ không bị xóa khỏi Facebook.')) return;

    setBackfillBusy(true);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === 'start') {
        payload.start_at = backfillStartAt ? new Date(backfillStartAt).toISOString() : new Date().toISOString();
        payload.interval_minutes = backfillInterval;
      }
      const res = await fetch('/api/admin/social/backfill/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.state) {
          setSettings((current) => (current ? { ...current, facebook_backfill: data.state } : current));
        }
        setMsg({ type: 'error', text: data.error || 'Không thể cập nhật hàng đợi Facebook.' });
        return;
      }

      setSettings((current) => (current ? { ...current, facebook_backfill: data.state } : current));
      const successMessage =
        action === 'start'
          ? data.posted_first
            ? `✅ Đã tạo hàng đợi ${data.total_posts} bài (cũ nhất ➔ mới nhất) và đăng ngay bài đầu tiên: “${data.first_post_title}”!`
            : `✅ Đã tạo hàng đợi ${data.total_posts} bài, sắp từ cũ đến mới. Bài đầu tiên sẽ được đăng theo giờ đã chọn.`
          : action === 'post_now'
            ? `🚀 Đã đăng thành công bài tiếp theo lên Fanpage: “${data.post_title}”!`
            : action === 'pause'
              ? '⏸ Đã tạm dừng hàng đợi Facebook.'
              : action === 'resume'
                ? '▶ Đã tiếp tục hàng đợi Facebook.'
                : '🗑 Đã xóa hàng đợi. Bài đã đăng vẫn còn trên Fanpage.';
      setMsg({ type: 'success', text: successMessage });
    } catch (error: any) {
      setMsg({ type: 'error', text: error?.message || 'Lỗi kết nối khi cập nhật hàng đợi Facebook.' });
    } finally {
      setBackfillBusy(false);
    }
  };

  const handleConnectX = async () => {
    if (!settings) return;
    if (!settings.twitter_oauth2_client_id?.trim() || (!settings.twitter_oauth2_client_secret?.trim() && !settings.twitter_oauth2_client_secret_configured)) {
      setMsg({ type: 'error', text: 'Nhập Client ID và Client Secret trong X Developer Console trước khi kết nối.' });
      return;
    }

    setConnectingX(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/social/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg({ type: 'error', text: `Không thể lưu thông tin X: ${data.error || 'lỗi máy chủ'}` });
        setConnectingX(false);
        return;
      }
      window.location.assign('/api/auth/x/connect/');
    } catch {
      setMsg({ type: 'error', text: 'Lỗi kết nối máy chủ khi lưu thông tin X.' });
      setConnectingX(false);
    }
  };

  const copyXCallbackUrl = async () => {
    try {
      await navigator.clipboard.writeText(X_OAUTH_CALLBACK_URL);
      setMsg({ type: 'success', text: 'Đã sao chép Callback URI của X.' });
    } catch {
      setMsg({ type: 'error', text: 'Không thể sao chép tự động. Hãy chọn và sao chép URL hiển thị bên dưới.' });
    }
  };

  const handleConnectPinterest = async () => {
    if (!settings) return;
    if (!settings.pinterest_client_id?.trim() || (!settings.pinterest_client_secret?.trim() && !settings.pinterest_client_secret_configured)) {
      setMsg({ type: 'error', text: 'Nhập Pinterest App ID và Client Secret trước khi kết nối.' });
      return;
    }

    setConnectingPinterest(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/social/settings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg({ type: 'error', text: `Không thể lưu thông tin Pinterest: ${data.error || 'lỗi máy chủ'}` });
        setConnectingPinterest(false);
        return;
      }
      window.location.assign('/api/auth/pinterest/connect/');
    } catch {
      setMsg({ type: 'error', text: 'Lỗi kết nối máy chủ khi lưu thông tin Pinterest.' });
      setConnectingPinterest(false);
    }
  };

  const copyPinterestCallbackUrl = async () => {
    try {
      await navigator.clipboard.writeText(PINTEREST_OAUTH_CALLBACK_URL);
      setMsg({ type: 'success', text: 'Đã sao chép Callback URI của Pinterest.' });
    } catch {
      setMsg({ type: 'error', text: 'Không thể sao chép tự động. Hãy chọn và sao chép URL hiển thị bên dưới.' });
    }
  };

  const handleTestConnection = async (channel: string, credentials: any) => {
    setTestingChannel(`${channel}_conn`);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/social/test/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          channel,
          credentials,
        }),
      });
      const data = await res.json();
      if (data.success) {
        let successText = 'Kết nối thành công!';
        if (channel === 'facebook' && data.page_name) successText += ` (Page: "${data.page_name}")`;
        if (channel === 'instagram') {
          successText += ` (Instagram: @${data.username || data.name || 'ok'} · ID: ${data.igUserId || ''})`;
          if (data.igUserId && settings) {
            setSettings({ ...settings, instagram_user_id: data.igUserId });
          }
        }
        if (channel === 'twitter' && data.username) successText += ` (Tài khoản: ${data.username})`;
        if (channel === 'medium' && data.username) successText += ` (Tác giả: @${data.username})`;
        if (channel === 'pinterest') {
          if (data.username) successText += ` (Tài khoản: @${data.username})`;
          if (typeof data.boards_count === 'number') {
            successText += ` · ${data.boards_count} bảng${data.sample_boards?.length ? `: ${data.sample_boards.join(', ')}` : ''}`;
          }
        }
        if (channel === 'telegram') {
          successText += ` (Bot: @${data.bot_username || 'ok'} ➔ Channel: "${data.chat_title || ''}")`;
        }
        if (channel === 'bluesky' && data.handle) {
          successText += ` (Bluesky: @${data.handle})`;
        }
        if (channel === 'threads' && data.username) {
          successText += ` (Threads: @${data.username} · ID: ${data.user_id})`;
        }
        if (channel === 'mastodon' && data.username) {
          successText += ` (Mastodon: ${data.username}@${data.instance || 'mastodon.social'})`;
        }
        if (channel === 'discord' && data.channel_name) {
          successText += ` (Discord: ${data.channel_name})`;
        }
        if (channel === 'webhook') successText += ' (Webhook phản hồi 200 OK)';

        setTestResult({
          channel,
          success: true,
          message: `✅ ${successText}`,
        });
      } else {
        setTestResult({
          channel,
          success: false,
          message: `❌ Thất bại: ${data.error || 'Không thể kết nối'}`,
        });
      }
    } catch {
      setTestResult({
        channel,
        success: false,
        message: '❌ Lỗi kết nối tới máy chủ khi thử nghiệm',
      });
    } finally {
      setTestingChannel(null);
    }
  };

  const handleTestPost = async (channel: string) => {
    setTestingChannel(`${channel}_post`);
    setTestResult(null);
    try {
      // Auto-save settings first so the backend always has the latest tokens
      if (settings) {
        await fetch('/api/admin/social/settings/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
      }

      const res = await fetch('/api/admin/social/test/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_post',
          channel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const channelRes = data.report?.results?.[channel];
        setTestResult({
          channel,
          success: true,
          message: `🚀 Đăng thử thành công lên ${channel.toUpperCase()}!`,
          details: channelRes,
        });
      } else {
        const channelRes = data.report?.results?.[channel];
        setTestResult({
          channel,
          success: false,
          message: `❌ Đăng thử thất bại: ${channelRes?.error || data.error || 'Có lỗi xảy ra'}`,
          details: channelRes,
        });
      }
    } catch {
      setTestResult({
        channel,
        success: false,
        message: '❌ Lỗi kết nối khi gửi yêu cầu đăng thử',
      });
    } finally {
      setTestingChannel(null);
    }
  };

  const handleBatchSyncPinterest = async () => {
    setTestingChannel('pinterest_sync');
    setTestResult(null);
    try {
      if (settings) {
        await fetch('/api/admin/social/settings/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
      }

      const res = await fetch('/api/admin/social/pinterest/sync/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          channel: 'pinterest',
          success: true,
          message: `✅ ${data.message} (Đã ghim: ${data.total_pinned}/${data.total_published} · Còn lại: ${data.remaining})`,
        });
      } else {
        setTestResult({
          channel: 'pinterest',
          success: false,
          message: `❌ Đồng bộ thất bại: ${data.message || data.error || 'Có lỗi xảy ra'}`,
        });
      }
    } catch {
      setTestResult({
        channel: 'pinterest',
        success: false,
        message: '❌ Lỗi kết nối khi đồng bộ bài viết lên Pinterest',
      });
    } finally {
      setTestingChannel(null);
    }
  };

  if (loading || !settings) {
    return (
      <div className="admin-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#69707d' }}>
        <p style={{ margin: 0, fontSize: '0.94rem' }}>⏳ Đang tải cấu hình Mạng Xã Hội...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── TOP BANNER & MASTER SWITCH ────────────────── */}
      <div
        className="admin-card"
        style={{
          background: 'linear-gradient(135deg, #171a35 0%, #25368f 100%)',
          color: '#ffffff',
          border: 'none',
          padding: '24px 28px',
          marginBottom: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.6rem' }}>📢</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Tự Động Chia Sẻ Mạng Xã Hội (Social Auto-Share)
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#c7d2fe', maxWidth: '680px', lineHeight: 1.5 }}>
              Tự động phân phối bài viết mới sang Facebook Fanpage, X (Twitter), Medium, Pinterest hoặc Webhook ngay khi xuất bản (chạy nền không gây nghẽn web).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <input
                type="checkbox"
                checked={settings.auto_share_enabled}
                onChange={(e) => setSettings({ ...settings, auto_share_enabled: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Tự động chia sẻ bài mới</span>
            </label>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
              style={{
                background: '#fd546c',
                padding: '10px 20px',
                fontSize: '0.92rem',
                boxShadow: '0 4px 14px rgba(253, 84, 108, 0.4)',
              }}
            >
              {saving ? 'Đang lưu...' : '💾 Lưu Cấu Hình'}
            </button>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION MESSAGES ─────────────────────── */}
      {msg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            background: msg.type === 'success' ? '#e6f7ed' : '#fee4e2',
            color: msg.type === 'success' ? '#027a48' : '#b42318',
            border: `1px solid ${msg.type === 'success' ? '#a6f4c5' : '#fecdca'}`,
          }}
        >
          {msg.text}
        </div>
      )}

      {/* ── TEST FEEDBACK ────────────────────────────── */}
      {testResult && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 500,
            background: testResult.success ? '#eef4ff' : '#fff1f3',
            color: testResult.success ? '#1e40af' : '#991b1b',
            border: `1px solid ${testResult.success ? '#bfdbfe' : '#fecdd3'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{testResult.message}</span>
            <button
              type="button"
              onClick={() => setTestResult(null)}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
            >
              Đóng
            </button>
          </div>
          {testResult.details?.url && (
            <div style={{ fontSize: '0.82rem' }}>
              <a
                href={testResult.details.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
              >
                🔗 Bấm vào đây để xem trực tiếp bài viết vừa đăng trên mạng xã hội ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── 1. FACEBOOK FANPAGE ──────────────────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#1877f2',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              f
            </div>
            <div>
              <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                Facebook Fanpage
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động chia sẻ bài mới lên Fanpage khi bài được xuất bản
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.facebook_enabled}
              onChange={(e) => setSettings({ ...settings, facebook_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Chia sẻ bài mới</span>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Facebook Page ID</label>
            <input
              className="form-input"
              type="text"
              placeholder="VD: 104829104829104"
              value={settings.facebook_page_id}
              onChange={(e) => setSettings({ ...settings, facebook_page_id: e.target.value })}
            />
            <p className="form-hint">Lấy tại mục Giới thiệu (About) của Fanpage hoặc Meta Business Suite</p>
          </div>

          <div className="form-group">
            <label className="form-label">Page Access Token (Vĩnh viễn)</label>
            <input
              className="form-input"
              type="password"
              placeholder="EAA..."
              value={settings.facebook_access_token}
              onChange={(e) => setSettings({ ...settings, facebook_access_token: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">
              Token có quyền <code>pages_manage_posts</code> và <code>pages_read_engagement</code>. Nếu lấy từ Graph API Explorer, hãy điền thêm App Secret bên dưới rồi bấm Lưu Cấu Hình để hệ thống <strong>tự động đổi sang Token Vĩnh Viễn (Không bao giờ hết hạn)</strong>.
            </p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Facebook App ID (Tùy chọn - Dùng để đổi Token Vĩnh Viễn)</label>
            <input
              className="form-input"
              type="text"
              placeholder="1132334105813486"
              value={settings.facebook_app_id || '1132334105813486'}
              onChange={(e) => setSettings({ ...settings, facebook_app_id: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Facebook App Secret (Tùy chọn - Tự động gia hạn Token Vĩnh Viễn)</label>
            <input
              className="form-input"
              type="password"
              placeholder="Nhập App Secret từ Meta App Settings > Basic..."
              value={settings.facebook_app_secret || ''}
              onChange={(e) => setSettings({ ...settings, facebook_app_secret: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mẫu nội dung bài đăng (Template)</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: '80px', fontFamily: 'monospace', fontSize: '0.85rem' }}
            value={settings.facebook_template || ''}
            onChange={(e) => setSettings({ ...settings, facebook_template: e.target.value })}
          />
          <p className="form-hint">
            Biến hỗ trợ: <code>&#123;title&#125;</code> (tiêu đề), <code>&#123;excerpt&#125;</code> (tóm tắt), <code>&#123;url&#125;</code> (link bài viết)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('facebook', {
                page_id: settings.facebook_page_id,
                access_token: settings.facebook_access_token,
              })
            }
          >
            {testingChannel === 'facebook_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !settings.facebook_page_id || !settings.facebook_access_token}
            onClick={() => handleTestPost('facebook')}
            style={{ background: '#1877f2' }}
          >
            {testingChannel === 'facebook_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài mới nhất lên Facebook'}
          </button>
        </div>
      </div>

      {/* ── FACEBOOK HISTORICAL POST BACKFILL ────────── */}
      <div className="admin-card" style={{ border: '1px solid #d6e4ff', background: '#f8fbff' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h3 className="admin-card-title" style={{ fontSize: '1.05rem', marginBottom: '6px' }}>
              📚 Đăng lại bài cũ lên Facebook theo lịch
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#53627c', lineHeight: 1.55 }}>
              Tạo hàng đợi riêng từ các bài hướng dẫn quà tặng và bài blog đã xuất bản, đăng bài cũ nhất trước rồi lần lượt đến bài mới hơn. Lịch này hoạt động độc lập với công tắc chia sẻ bài mới.
            </p>
          </div>
          <span style={{ padding: '5px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: '#e7f0ff', color: '#175cd3' }}>
            Chỉ đăng lên Facebook
          </span>
        </div>

        <div className="form-row" style={{ marginTop: '18px' }}>
          <div className="form-group">
            <label className="form-label">Thời điểm đăng bài đầu tiên (giờ trên máy bạn)</label>
            <input
              className="form-input"
              type="datetime-local"
              value={backfillStartAt}
              onChange={(e) => setBackfillStartAt(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Khoảng cách giữa các bài</label>
            <select
              className="form-input"
              value={backfillInterval}
              onChange={(e) => setBackfillInterval(Number(e.target.value))}
            >
              <option value={30}>Mỗi 30 phút</option>
              <option value={60}>Mỗi 1 giờ</option>
              <option value={120}>Mỗi 2 giờ</option>
              <option value={180}>Mỗi 3 giờ</option>
              <option value={240}>Mỗi 4 giờ (Khuyên dùng)</option>
              <option value={360}>Mỗi 6 giờ</option>
              <option value={480}>Mỗi 8 giờ</option>
              <option value={720}>Mỗi 12 giờ</option>
              <option value={1440}>Mỗi 24 giờ</option>
            </select>
          </div>
        </div>

        {(() => {
          const queue = settings.facebook_backfill;
          const total = queue.post_ids?.length || 0;
          const remaining = Math.max(0, total - queue.cursor);
          const statusLabel = {
            idle: 'Chưa tạo hàng đợi',
            scheduled: 'Đang chạy theo lịch',
            paused: 'Đã tạm dừng',
            error: 'Đang dừng do lỗi',
            completed: 'Đã đăng xong hàng đợi',
          }[queue.status];
          const statusColor = queue.status === 'error' ? '#b42318' : queue.status === 'scheduled' ? '#027a48' : '#344054';

          return (
            <div style={{ marginTop: '6px', padding: '14px 16px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e4e7ec' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <strong style={{ color: statusColor }}>{statusLabel}</strong>
                {total > 0 && <span style={{ color: '#475467', fontSize: '0.84rem' }}>Đã xử lý {queue.cursor}/{total} · Còn {remaining} · Bỏ qua {queue.skipped_count}</span>}
              </div>
              {queue.next_post_at && queue.status === 'scheduled' && (
                <p style={{ margin: '8px 0 0', fontSize: '0.83rem', color: '#475467' }}>
                  Bài tiếp theo dự kiến: {new Date(queue.next_post_at).toLocaleString()}
                </p>
              )}
              {queue.last_post_title && queue.last_posted_at && (
                <p style={{ margin: '6px 0 0', fontSize: '0.83rem', color: '#475467' }}>
                  Bài gần nhất: “{queue.last_post_title}” · {new Date(queue.last_posted_at).toLocaleString()}
                </p>
              )}
              {queue.last_error && <p style={{ margin: '8px 0 0', fontSize: '0.84rem', color: '#b42318' }}>Lỗi: {queue.last_error}</p>}
            </div>
          );
        })()}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
          {(settings.facebook_backfill.status === 'idle' || settings.facebook_backfill.status === 'completed') && (
            <button
              type="button"
              className="btn-primary"
              disabled={backfillBusy || !settings.facebook_page_id || !settings.facebook_access_token}
              onClick={() => handleBackfillAction('start')}
              style={{ background: '#1877f2' }}
            >
              {backfillBusy ? 'Đang tạo hàng đợi...' : '▶ Tạo hàng đợi và bắt đầu theo lịch'}
            </button>
          )}
          {settings.facebook_backfill.status !== 'completed' && (
            <button
              type="button"
              className="btn-primary"
              disabled={backfillBusy || !settings.facebook_page_id || !settings.facebook_access_token}
              onClick={() => handleBackfillAction('post_now')}
              style={{ background: '#027a48' }}
            >
              {backfillBusy ? 'Đang đăng...' : '⚡ Đăng ngay 1 bài tiếp theo (Cũ ➔ Mới)'}
            </button>
          )}
          {settings.facebook_backfill.status === 'scheduled' && (
            <button type="button" className="btn-secondary" disabled={backfillBusy} onClick={() => handleBackfillAction('pause')}>
              ⏸ Tạm dừng
            </button>
          )}
          {(settings.facebook_backfill.status === 'paused' || settings.facebook_backfill.status === 'error') && (
            <button type="button" className="btn-primary" disabled={backfillBusy} onClick={() => handleBackfillAction('resume')} style={{ background: '#1877f2' }}>
              {settings.facebook_backfill.status === 'error' ? '↻ Thử lại bài đang lỗi' : '▶ Tiếp tục hàng đợi'}
            </button>
          )}
          {settings.facebook_backfill.status !== 'idle' && (
            <button type="button" className="btn-secondary" disabled={backfillBusy} onClick={() => handleBackfillAction('reset')}>
              Xóa hàng đợi
            </button>
          )}
        </div>
        <p className="form-hint" style={{ marginTop: '12px' }}>
          Hệ thống tự động xếp toàn bộ bài viết đã xuất bản theo thứ tự từ cũ nhất đến mới nhất và đăng lên Fanpage (cùng toàn bộ các mạng xã hội đã bật bên dưới) theo chu kỳ đã chọn (mặc định 4 tiếng/bài). Lịch này hoạt động độc lập với công tắc “Tự động chia sẻ bài mới”.
        </p>
      </div>

      {/* ── 1B. INSTAGRAM BUSINESS / CREATOR ─────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              📸
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                  Instagram (Business / Creator Feed)
                </h3>
                <span className="badge" style={{ background: '#fdf2f8', color: '#be185d' }}>
                  Dùng Chung Meta App Với Fanpage · Tự Chuyển Ảnh Chuẩn JPEG
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động đăng ảnh bìa bài viết (tự chuẩn hóa tỷ lệ &amp; định dạng JPEG) kèm Caption và Hashtag lên Instagram Feed
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(settings.instagram_enabled)}
              onChange={(e) => setSettings({ ...settings, instagram_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Instagram Business User ID (Tự động tìm nếu để trống)</label>
            <input
              className="form-input"
              type="text"
              placeholder="VD: 178414... (Hoặc để trống, hệ thống tự lấy từ Fanpage)"
              value={settings.instagram_user_id || ''}
              onChange={(e) => setSettings({ ...settings, instagram_user_id: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">
              Nếu Instagram của bạn đã liên kết với Fanpage Facebook ở trên, bạn có thể <strong>để trống ô này</strong> và bấm Kiểm tra kết nối — hệ thống sẽ tự điền ID!
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Instagram / Meta Access Token</label>
            <input
              className="form-input"
              type="password"
              placeholder="EAA... hoặc IGAA... (Để trống nếu dùng chung Token với Fanpage)"
              value={settings.instagram_access_token || ''}
              onChange={(e) => setSettings({ ...settings, instagram_access_token: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">
              Hỗ trợ cả <strong>Meta Graph Token (<code>EAA...</code>)</strong> có quyền <code>instagram_basic, instagram_content_publish</code> HOẶC <strong>Instagram Token (<code>IG...</code>)</strong> tạo trong mục <em>Instagram &gt; API setup with Instagram login</em>.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mẫu Caption Instagram (Template)</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={settings.instagram_template || ''}
            onChange={(e) => setSettings({ ...settings, instagram_template: e.target.value })}
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
          <p className="form-hint">
            Biến: <code>&#123;title&#125;</code>, <code>&#123;excerpt&#125;</code>, <code>&#123;url&#125;</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('instagram', {
                user_id: settings.instagram_user_id,
                access_token: settings.instagram_access_token || settings.facebook_access_token,
                facebook_page_id: settings.facebook_page_id,
              })
            }
          >
            {testingChannel === 'instagram_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối & Tự lấy ID Instagram'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !(settings.instagram_access_token || settings.facebook_access_token)}
            onClick={() => handleTestPost('instagram')}
            style={{ background: '#dc2743' }}
          >
            {testingChannel === 'instagram_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài mới nhất lên Instagram'}
          </button>
        </div>
      </div>

      {/* ── 2. X (TWITTER) ───────────────────────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#000000',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              𝕏
            </div>
            <div>
              <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                X (Twitter)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động Tweet bài viết mới kèm link rút gọn và hashtag chủ đề
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.twitter_enabled}
              onChange={(e) => setSettings({ ...settings, twitter_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div style={{ border: '1px solid #e4e7ec', borderRadius: '10px', padding: '16px', marginBottom: '18px', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div>
              <strong style={{ color: '#101828' }}>OAuth 2.0 (Web App)</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#69707d' }}>
                Dán Callback URI này vào X Developer Console, sau đó nhập Client ID và Client Secret.
              </p>
            </div>
            <span style={{ padding: '5px 9px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, background: settings.twitter_oauth2_connected ? '#e6f7ed' : '#fff7e6', color: settings.twitter_oauth2_connected ? '#027a48' : '#9a6700' }}>
              {settings.twitter_oauth2_connected
                ? `Đã kết nối${settings.twitter_oauth2_username ? ` · @${settings.twitter_oauth2_username}` : ''}`
                : 'Chưa kết nối'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Callback URI / Redirect URL</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input className="form-input" type="url" value={X_OAUTH_CALLBACK_URL} readOnly style={{ flex: '1 1 320px', fontFamily: 'monospace' }} />
              <button type="button" className="btn-secondary" onClick={copyXCallbackUrl}>Sao chép URL</button>
            </div>
            <p className="form-hint">Trong X Developer Console, thêm chính xác URL trên vào Callback URI / Redirect URL của OAuth 2.0.</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">X OAuth 2.0 Client ID</label>
              <input
                className="form-input"
                type="text"
                autoComplete="off"
                value={settings.twitter_oauth2_client_id || ''}
                onChange={(e) => setSettings({ ...settings, twitter_oauth2_client_id: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">X OAuth 2.0 Client Secret</label>
              <input
                className="form-input"
                type="password"
                autoComplete="new-password"
                value={settings.twitter_oauth2_client_secret || ''}
                placeholder={settings.twitter_oauth2_client_secret_configured ? 'Đã lưu; để trống nếu không đổi' : 'Nhập Client Secret'}
                onChange={(e) => setSettings({ ...settings, twitter_oauth2_client_secret: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <button type="button" className="btn-primary" disabled={connectingX || saving} onClick={handleConnectX} style={{ background: '#000000' }}>
            {connectingX ? 'Đang chuyển tới X...' : settings.twitter_oauth2_connected ? 'Kết nối lại tài khoản X' : 'Kết nối tài khoản X'}
          </button>
        </div>

        <details style={{ marginBottom: '16px' }}>
          <summary style={{ cursor: 'pointer', color: '#475467', fontSize: '0.88rem', fontWeight: 600 }}>
            Cấu hình OAuth 1.0a cũ (chỉ mở nếu bạn đang dùng cách này)
          </summary>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">API Key (Consumer Key)</label>
            <input
              className="form-input"
              type="password"
              value={settings.twitter_api_key}
              onChange={(e) => setSettings({ ...settings, twitter_api_key: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">API Key Secret</label>
            <input
              className="form-input"
              type="password"
              value={settings.twitter_api_secret}
              onChange={(e) => setSettings({ ...settings, twitter_api_secret: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Access Token</label>
            <input
              className="form-input"
              type="password"
              value={settings.twitter_access_token}
              onChange={(e) => setSettings({ ...settings, twitter_access_token: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Access Token Secret</label>
            <input
              className="form-input"
              type="password"
              value={settings.twitter_access_secret}
              onChange={(e) => setSettings({ ...settings, twitter_access_secret: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>

        </details>

        <div className="form-group">
          <label className="form-label">Mẫu Tweet (Template)</label>
          <input
            className="form-input"
            type="text"
            value={settings.twitter_template || ''}
            onChange={(e) => setSettings({ ...settings, twitter_template: e.target.value })}
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
          <p className="form-hint">
            Biến: <code>&#123;title&#125;</code>, <code>&#123;url&#125;</code> (Hệ thống tự động cắt gọn nếu nội dung vượt quá 280 ký tự)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('twitter', {
                api_key: settings.twitter_api_key,
                api_secret: settings.twitter_api_secret,
                access_token: settings.twitter_access_token,
                access_secret: settings.twitter_access_secret,
              })
            }
          >
            {testingChannel === 'twitter_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối X'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !(settings.twitter_oauth2_connected || (settings.twitter_api_key && settings.twitter_access_token))}
            onClick={() => handleTestPost('twitter')}
            style={{ background: '#000000' }}
          >
            {testingChannel === 'twitter_post' ? 'Đang Tweet thử...' : '🚀 Tweet thử bài mới nhất lên X'}
          </button>
        </div>
      </div>

      {/* ── 3. MEDIUM (CANONICAL SEO) ────────────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#02995b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              M
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                  Medium (Cross-posting)
                </h3>
                <span className="badge" style={{ background: '#e6f7ed', color: '#027a48' }}>
                  SEO Canonical
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động cross-post bài viết lên Medium kèm thẻ <code>canonicalUrl</code> trỏ về web gốc
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.medium_enabled}
              onChange={(e) => setSettings({ ...settings, medium_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Medium Integration Token</label>
            <input
              className="form-input"
              type="password"
              placeholder="281a9..."
              value={settings.medium_integration_token}
              onChange={(e) => setSettings({ ...settings, medium_integration_token: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">
              Lấy tại: <em>Medium.com ➔ Settings ➔ Security and apps ➔ Integration tokens</em>
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Trạng thái xuất bản (Publish Status)</label>
            <select
              className="form-select"
              value={settings.medium_publish_status || 'public'}
              onChange={(e) => setSettings({ ...settings, medium_publish_status: e.target.value as any })}
            >
              <option value="public">Công khai (Public) - Khuyến nghị cho SEO</option>
              <option value="draft">Bản nháp (Draft) - Duyệt trước khi phát hành</option>
              <option value="unlisted">Không công khai (Unlisted)</option>
            </select>
            <p className="form-hint">Trạng thái bài viết khi được xuất bản trên Medium</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('medium', {
                integration_token: settings.medium_integration_token,
              })
            }
          >
            {testingChannel === 'medium_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra Token Medium'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !settings.medium_integration_token}
            onClick={() => handleTestPost('medium')}
            style={{ background: '#02995b' }}
          >
            {testingChannel === 'medium_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài mới nhất lên Medium'}
          </button>
        </div>
      </div>

      {/* ── 4. PINTEREST ─────────────────────────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#e60023',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              P
            </div>
            <div>
              <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                Pinterest
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động ghim ảnh bìa Hero Image kèm tiêu đề và link bài viết lên Board
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.pinterest_enabled}
              onChange={(e) => setSettings({ ...settings, pinterest_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <strong style={{ color: settings.pinterest_oauth_connected ? '#027a48' : '#9a6700' }}>
            {settings.pinterest_oauth_connected ? 'Đã có Pinterest Access Token' : 'Pinterest chưa kết nối'}
          </strong>
          {settings.pinterest_token_configured && !settings.pinterest_oauth_connected && (
            <span style={{ color: '#69707d', fontSize: '0.82rem' }}>(đang dùng token nhập thủ công)</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pinterest App ID</label>
            <input
              className="form-input"
              type="text"
              value={settings.pinterest_client_id || ''}
              onChange={(e) => setSettings({ ...settings, pinterest_client_id: e.target.value })}
            />
            <p className="form-hint">Lấy trong Pinterest Developer Portal → My apps.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Pinterest Client Secret</label>
            <input
              className="form-input"
              type="password"
              value={settings.pinterest_client_secret || ''}
              placeholder={settings.pinterest_client_secret_configured ? 'Đã lưu; để trống nếu không đổi' : 'Nhập Client Secret'}
              onChange={(e) => setSettings({ ...settings, pinterest_client_secret: e.target.value })}
            />
            <p className="form-hint">Client Secret được lưu phía máy chủ và không hiển thị lại.</p>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '18px' }}>
          <label className="form-label">Pinterest OAuth Callback URI</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input className="form-input" type="url" value={PINTEREST_OAUTH_CALLBACK_URL} readOnly style={{ flex: '1 1 320px', fontFamily: 'monospace' }} />
            <button type="button" className="btn-secondary" onClick={copyPinterestCallbackUrl}>Sao chép Callback URI</button>
          </div>
          <p className="form-hint">Thêm chính xác URL này vào Redirect URIs của ứng dụng Pinterest trước khi kết nối.</p>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pinterest Access Token (nhập thủ công nếu không dùng OAuth)</label>
            <input
              className="form-input"
              type="password"
              placeholder={settings.pinterest_token_configured ? 'Đã lưu; để trống để giữ token hiện tại' : 'pina_...'}
              value={settings.pinterest_access_token || ''}
              onChange={(e) => setSettings({ ...settings, pinterest_access_token: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Khuyến nghị kết nối OAuth bên dưới để cấp đủ quyền boards:read, boards:write, pins:read và pins:write.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Tên Bảng (Board Name)</label>
            <input
              className="form-input"
              type="text"
              placeholder="VD: Ideas de Regalos"
              value={settings.pinterest_board_name || ''}
              onChange={(e) => setSettings({ ...settings, pinterest_board_name: e.target.value })}
            />
            <p className="form-hint">Hệ thống sẽ tự tìm bảng này, nếu chưa có sẽ tự động tạo mới</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={connectingPinterest || testingChannel !== null}
            onClick={handleConnectPinterest}
          >
            {connectingPinterest ? 'Đang chuyển tới Pinterest...' : settings.pinterest_oauth_connected ? 'Kết nối lại Pinterest' : 'Kết nối Pinterest và cấp quyền'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('pinterest', {
                access_token: settings.pinterest_access_token,
              })
            }
          >
            {testingChannel === 'pinterest_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra Pinterest Token'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !(settings.pinterest_access_token || settings.pinterest_token_configured)}
            onClick={() => handleTestPost('pinterest')}
            style={{ background: '#e60023' }}
          >
            {testingChannel === 'pinterest_post' ? 'Đang ghim thử...' : '🚀 Ghim thử bài mới nhất lên Pinterest'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null || !settings.pinterest_access_token}
            onClick={handleBatchSyncPinterest}
            style={{ borderColor: '#e60023', color: '#e60023', fontWeight: 600 }}
          >
            {testingChannel === 'pinterest_sync' ? 'Đang đồng bộ...' : '🔄 Đồng bộ 5 bài tiếp theo chưa ghim'}
          </button>
        </div>
      </div>

      {/* ── 5. TELEGRAM CHANNEL (BOT API) ────────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#24A1DE',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              ✈️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                  Telegram Channel (Bot API)
                </h3>
                <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  Token Vĩnh Viễn · Lấy trong 30 giây
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động đăng bài kèm ảnh lớn và link sang Telegram Channel (cả bài mới & lịch bài cũ 4 tiếng/bài)
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(settings.telegram_enabled)}
              onChange={(e) => setSettings({ ...settings, telegram_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Telegram Bot Token (Từ @BotFather)</label>
            <input
              className="form-input"
              type="password"
              placeholder="VD: 7482910482:AAH..."
              value={settings.telegram_bot_token || ''}
              onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Nhắn <code>/newbot</code> cho <code>@BotFather</code> trên Telegram để nhận Token vĩnh viễn</p>
          </div>

          <div className="form-group">
            <label className="form-label">Channel Username hoặc Chat ID</label>
            <input
              className="form-input"
              type="text"
              placeholder="VD: @miregalo_us hoặc -1001234567890"
              value={settings.telegram_chat_id || ''}
              onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Thêm Bot vừa tạo làm Admin (Quản trị viên) của Channel với quyền Post Messages</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('telegram', {
                bot_token: settings.telegram_bot_token,
                chat_id: settings.telegram_chat_id,
              })
            }
          >
            {testingChannel === 'telegram_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !settings.telegram_bot_token || !settings.telegram_chat_id}
            onClick={() => handleTestPost('telegram')}
            style={{ background: '#24A1DE' }}
          >
            {testingChannel === 'telegram_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài lên Telegram Channel'}
          </button>
        </div>
      </div>

      {/* ── 6. BLUESKY (AT PROTOCOL) ─────────────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#0285FF',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              🦋
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                  Bluesky (bsky.app)
                </h3>
                <span className="badge" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  Không Cần Duyệt App · Traffic Mỹ Cao
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động đăng bài kèm thẻ Link Card + ảnh Thumbnail lên Bluesky (chỉ cần Handle & App Password)
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(settings.bluesky_enabled)}
              onChange={(e) => setSettings({ ...settings, bluesky_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Bluesky Handle (hoặc Email)</label>
            <input
              className="form-input"
              type="text"
              placeholder="VD: miregalo.bsky.social"
              value={settings.bluesky_identifier || ''}
              onChange={(e) => setSettings({ ...settings, bluesky_identifier: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Tạo tài khoản tại <a href="https://bsky.app" target="_blank" rel="noreferrer">bsky.app</a></p>
          </div>

          <div className="form-group">
            <label className="form-label">App Password (Mật khẩu ứng dụng)</label>
            <input
              className="form-input"
              type="password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={settings.bluesky_app_password || ''}
              onChange={(e) => setSettings({ ...settings, bluesky_app_password: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Vào <code>Settings &gt; Privacy and security &gt; App Passwords</code> trên Bluesky để tạo mã</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('bluesky', {
                identifier: settings.bluesky_identifier,
                app_password: settings.bluesky_app_password,
              })
            }
          >
            {testingChannel === 'bluesky_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !settings.bluesky_identifier || !settings.bluesky_app_password}
            onClick={() => handleTestPost('bluesky')}
            style={{ background: '#0285FF' }}
          >
            {testingChannel === 'bluesky_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài lên Bluesky'}
          </button>
        </div>
      </div>

      {/* ── 7. MASTODON (OPEN SOCIAL API) ────────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#6364FF',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              🐘
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                  Mastodon (mastodon.social)
                </h3>
                <span className="badge" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                  Token Vĩnh Viễn · Không Cần Duyệt
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động đăng bài công khai kèm khung ảnh OpenGraph lớn và hashtag lên Mastodon
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(settings.mastodon_enabled)}
              onChange={(e) => setSettings({ ...settings, mastodon_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mastodon Server URL</label>
            <input
              className="form-input"
              type="url"
              placeholder="https://mastodon.social"
              value={settings.mastodon_instance_url || 'https://mastodon.social'}
              onChange={(e) => setSettings({ ...settings, mastodon_instance_url: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Mặc định: <code>https://mastodon.social</code></p>
          </div>

          <div className="form-group">
            <label className="form-label">Access Token (Your access token)</label>
            <input
              className="form-input"
              type="password"
              placeholder="Dán Your access token từ mục Development..."
              value={settings.mastodon_access_token || ''}
              onChange={(e) => setSettings({ ...settings, mastodon_access_token: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Vào <code>Preferences &gt; Development &gt; New application</code> để copy <code>Your access token</code> ngay lập tức</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('mastodon', {
                instance_url: settings.mastodon_instance_url || 'https://mastodon.social',
                access_token: settings.mastodon_access_token,
              })
            }
          >
            {testingChannel === 'mastodon_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !settings.mastodon_access_token}
            onClick={() => handleTestPost('mastodon')}
            style={{ background: '#6364FF' }}
          >
            {testingChannel === 'mastodon_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài lên Mastodon'}
          </button>
        </div>
      </div>

      {/* ── 8. THREADS BY META (GRAPH API) ───────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#101010',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              @
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                  Threads by Meta
                </h3>
                <span className="badge" style={{ background: '#f3f4f6', color: '#111827' }}>
                  Chung Meta Developer
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động đăng bài kèm thẻ Link Preview sang tài khoản Threads thông qua Meta Threads API
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(settings.threads_enabled)}
              onChange={(e) => setSettings({ ...settings, threads_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Threads User ID (Để trống sẽ tự động lấy từ Token)</label>
            <input
              className="form-input"
              type="text"
              placeholder="Tự động nhận diện qua /me"
              value={settings.threads_user_id || ''}
              onChange={(e) => setSettings({ ...settings, threads_user_id: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Threads Access Token</label>
            <input
              className="form-input"
              type="password"
              placeholder="THQ..."
              value={settings.threads_access_token || ''}
              onChange={(e) => setSettings({ ...settings, threads_access_token: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Cấp quyền <code>threads_basic</code> và <code>threads_content_publish</code> trong Meta App</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('threads', {
                user_id: settings.threads_user_id,
                access_token: settings.threads_access_token,
              })
            }
          >
            {testingChannel === 'threads_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !settings.threads_access_token}
            onClick={() => handleTestPost('threads')}
            style={{ background: '#101010' }}
          >
            {testingChannel === 'threads_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài lên Threads'}
          </button>
        </div>
      </div>

      {/* ── 9. DISCORD CHANNEL WEBHOOK ───────────────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#5865F2',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              🎮
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                  Discord Server Channel
                </h3>
                <span className="badge" style={{ background: '#eef2ff', color: '#4338ca' }}>
                  Chỉ Cần 1 Link Webhook · Vĩnh Viễn
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Tự động đăng thẻ Rich Embed kèm ảnh lớn sang kênh Discord
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(settings.discord_enabled)}
              onChange={(e) => setSettings({ ...settings, discord_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">Discord Webhook URL</label>
          <input
            className="form-input"
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            value={settings.discord_webhook_url || ''}
            onChange={(e) => setSettings({ ...settings, discord_webhook_url: e.target.value })}
            style={{ fontFamily: 'monospace' }}
          />
          <p className="form-hint">Vào <code>Edit Channel &gt; Integrations &gt; Webhooks &gt; New Webhook &gt; Copy Webhook URL</code></p>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('discord', {
                webhook_url: settings.discord_webhook_url,
              })
            }
          >
            {testingChannel === 'discord_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !settings.discord_webhook_url}
            onClick={() => handleTestPost('discord')}
            style={{ background: '#5865F2' }}
          >
            {testingChannel === 'discord_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài lên Discord'}
          </button>
        </div>
      </div>

      {/* ── 10. WEBHOOK (MAKE.COM / ZAPIER / N8N) ──────── */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#6366f1',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="admin-card-title" style={{ fontSize: '1.05rem' }}>
                  Webhook Tự Động (Make / Zapier / n8n)
                </h3>
                <span className="badge" style={{ background: '#eff4ff', color: '#2e62e9' }}>
                  Không Giới Hạn
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#69707d' }}>
                Gửi payload bài viết sang Webhook để phân phối tới Telegram, Threads, Instagram, LinkedIn...
              </p>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.webhook_enabled}
              onChange={(e) => setSettings({ ...settings, webhook_enabled: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Webhook URL</label>
            <input
              className="form-input"
              type="url"
              placeholder="https://hook.eu1.make.com/..."
              value={settings.webhook_url}
              onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Nhận POST JSON mỗi khi bài viết được xuất bản</p>
          </div>

          <div className="form-group">
            <label className="form-label">Secret Key (Tùy chọn)</label>
            <input
              className="form-input"
              type="password"
              placeholder="Gửi trong header X-Miregalo-Secret"
              value={settings.webhook_secret || ''}
              onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Dùng để xác thực phía Webhook server</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
          <button
            type="button"
            className="btn-secondary"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('webhook', {
                webhook_url: settings.webhook_url,
                webhook_secret: settings.webhook_secret,
              })
            }
          >
            {testingChannel === 'webhook_conn' ? 'Đang kiểm tra...' : '🔍 Gửi thử Test Ping'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={testingChannel !== null || !settings.webhook_url}
            onClick={() => handleTestPost('webhook')}
            style={{ background: '#6366f1' }}
          >
            {testingChannel === 'webhook_post' ? 'Đang gửi...' : '🚀 Bắn thử bài viết đầy đủ sang Webhook'}
          </button>
        </div>
      </div>

      {/* ── BOTTOM SAVE BUTTON ───────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{
            background: '#fd546c',
            padding: '12px 28px',
            fontSize: '0.94rem',
            boxShadow: '0 4px 14px rgba(253, 84, 108, 0.4)',
          }}
        >
          {saving ? 'Đang lưu...' : '💾 Lưu Toàn Bộ Cấu Hình Mạng Xã Hội'}
        </button>
      </div>
    </div>
  );
}
