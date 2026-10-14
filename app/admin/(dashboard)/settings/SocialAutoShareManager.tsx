'use client';

import { useState, useEffect } from 'react';
import type { SocialSettings } from '@/lib/social/types';

export function SocialAutoShareManager() {
  const [settings, setSettings] = useState<SocialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        if (channel === 'twitter' && data.username) successText += ` (Tài khoản: ${data.username})`;
        if (channel === 'medium' && data.username) successText += ` (Tác giả: @${data.username})`;
        if (channel === 'pinterest' && data.boards_count) {
          successText += ` (Tìm thấy ${data.boards_count} bảng: ${data.sample_boards?.join(', ')})`;
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
              <span>Bật Tự Động Chia Sẻ</span>
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
                Tự động đăng link bài viết kèm ảnh đại diện lên trang Fanpage
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
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#344054' }}>Kích hoạt</span>
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
            <p className="form-hint">Token có quyền <code>pages_manage_posts</code> và <code>pages_read_engagement</code></p>
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
            disabled={testingChannel !== null || !settings.twitter_api_key || !settings.twitter_access_token}
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

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pinterest Access Token</label>
            <input
              className="form-input"
              type="password"
              placeholder="pina_..."
              value={settings.pinterest_access_token}
              onChange={(e) => setSettings({ ...settings, pinterest_access_token: e.target.value })}
              style={{ fontFamily: 'monospace' }}
            />
            <p className="form-hint">Token lấy tại Pinterest Developer Portal (scope: <code>boards:read</code>, <code>pins:write</code>)</p>
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

        <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
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
            disabled={testingChannel !== null || !settings.pinterest_access_token}
            onClick={() => handleTestPost('pinterest')}
            style={{ background: '#e60023' }}
          >
            {testingChannel === 'pinterest_post' ? 'Đang ghim thử...' : '🚀 Ghim thử bài mới nhất lên Pinterest'}
          </button>
        </div>
      </div>

      {/* ── 5. WEBHOOK (MAKE.COM / ZAPIER / N8N) ──────── */}
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
