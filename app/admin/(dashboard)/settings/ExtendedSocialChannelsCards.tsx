'use client';

import React, { useState } from 'react';
import type { SocialSettings } from '@/lib/social/types';

interface ExtendedSocialChannelsCardsProps {
  settings: any;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  testingChannel: string | null;
  handleTestConnection: (channel: string, credentials: any) => Promise<void>;
  handleTestPost: (channel: string) => Promise<void>;
}

export function ExtendedSocialChannelsCards({
  settings,
  setSettings,
  testingChannel,
  handleTestConnection,
  handleTestPost,
}: ExtendedSocialChannelsCardsProps) {
  const [filter, setFilter] = useState<string>('all');

  const groups = [
    { id: 'all', label: 'Tất cả 17 kênh mở rộng' },
    { id: 'community', label: 'Cộng đồng & Nhóm (Reddit, Slack, Discord, Skool, Whop, MeWe)' },
    { id: 'creator', label: 'Nội dung & Video (YouTube, TikTok, Twitch, Kick, Dribbble)' },
    { id: 'decentralized', label: 'Mạng phi tập trung (Warpcast, Nostr, Lemmy)' },
    { id: 'publishing', label: 'Blog & Doanh nghiệp (Google Business, Hashnode, VK, Listmonk)' },
  ];

  return (
    <div style={{ marginTop: '30px' }}>
      <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀</span> 17 Kênh Mạng Xã Hội & Cộng Đồng Bổ Sung (Ma Trận 30 Kênh)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Tích hợp thêm đầy đủ Reddit, Slack, Google Business, Hashnode, VK, Lemmy, Warpcast, Nostr, Listmonk, TikTok, YouTube, Dribbble, Whop, Twitch, Skool, Kick, MeWe.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setFilter(g.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: filter === g.id ? 600 : 400,
                  border: filter === g.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: filter === g.id ? '#eff6ff' : '#ffffff',
                  color: filter === g.id ? '#1d4ed8' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 1. REDDIT ─────────────────────────────────── */}
      {(filter === 'all' || filter === 'community') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ff4500', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                🤖
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>Reddit (Link Post / Community)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Tự động đăng bài viết dạng Link kèm tiêu đề và hình ảnh lên Subreddit mục tiêu (hoặc qua Webhook)
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.reddit_enabled)}
                onChange={(e) => setSettings({ ...settings, reddit_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subreddit (vd: r/giftideas hoặc giftideas)</label>
              <input
                className="form-input"
                type="text"
                placeholder="r/deals hoặc r/giftideas"
                value={settings.reddit_subreddit || ''}
                onChange={(e) => setSettings({ ...settings, reddit_subreddit: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reddit Webhook URL (Tùy chọn - Dùng nếu kết nối qua Make/Zapier)</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://hook.eu1.make.com/..."
                value={settings.reddit_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, reddit_webhook_url: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Reddit Client ID (Tùy chọn nếu dùng API trực tiếp)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Reddit App Client ID"
                value={settings.reddit_client_id || ''}
                onChange={(e) => setSettings({ ...settings, reddit_client_id: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reddit Client Secret</label>
              <input
                className="form-input"
                type="password"
                placeholder="Reddit App Client Secret"
                value={settings.reddit_client_secret || ''}
                onChange={(e) => setSettings({ ...settings, reddit_client_secret: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Reddit Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="Tên tài khoản Reddit"
                value={settings.reddit_username || ''}
                onChange={(e) => setSettings({ ...settings, reddit_username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reddit Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Mật khẩu tài khoản Reddit"
                value={settings.reddit_password || ''}
                onChange={(e) => setSettings({ ...settings, reddit_password: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testingChannel !== null}
              onClick={() =>
                handleTestConnection('reddit', {
                  client_id: settings.reddit_client_id,
                  client_secret: settings.reddit_client_secret,
                  username: settings.reddit_username,
                  password: settings.reddit_password,
                  subreddit: settings.reddit_subreddit,
                  webhook_url: settings.reddit_webhook_url,
                })
              }
            >
              {testingChannel === 'reddit_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={testingChannel !== null || (!settings.reddit_webhook_url && !settings.reddit_client_id)}
              onClick={() => handleTestPost('reddit')}
              style={{ background: '#ff4500' }}
            >
              {testingChannel === 'reddit_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài lên Reddit'}
            </button>
          </div>
        </div>
      )}

      {/* ── 2. SLACK ──────────────────────────────────── */}
      {(filter === 'all' || filter === 'community') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#4a154b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                ⚡
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>Slack (Channel Notifications)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Gửi thẻ thông báo bài viết kèm hình ảnh, tóm tắt và nút đọc ngay vào kênh Slack qua Incoming Webhook
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.slack_enabled)}
                onChange={(e) => setSettings({ ...settings, slack_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Slack Incoming Webhook URL</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://hooks.slack.com/services/T.../B.../..."
                value={settings.slack_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, slack_webhook_url: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Kênh chỉ định (Tùy chọn)</label>
              <input
                className="form-input"
                type="text"
                placeholder="#announcements"
                value={settings.slack_channel || ''}
                onChange={(e) => setSettings({ ...settings, slack_channel: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testingChannel !== null}
              onClick={() => handleTestConnection('slack', { webhook_url: settings.slack_webhook_url })}
            >
              {testingChannel === 'slack_conn' ? 'Đang kiểm tra...' : '🔍 Gửi thử Test Ping'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={testingChannel !== null || !settings.slack_webhook_url}
              onClick={() => handleTestPost('slack')}
              style={{ background: '#4a154b' }}
            >
              {testingChannel === 'slack_post' ? 'Đang bắn tin...' : '🚀 Bắn thử bài viết sang Slack'}
            </button>
          </div>
        </div>
      )}

      {/* ── 3. GOOGLE MY BUSINESS ─────────────────────── */}
      {(filter === 'all' || filter === 'publishing') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#4285f4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                🏪
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>Google My Business (Business Profile)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Tự động đăng bản tin / Local Post lên hồ sơ Google Doanh Nghiệp kèm nút "Tìm hiểu thêm" trỏ về website
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.google_business_enabled)}
                onChange={(e) => setSettings({ ...settings, google_business_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Google Business Webhook URL (Khuyên dùng qua Make/Zapier)</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://hook.eu1.make.com/..."
                value={settings.google_business_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, google_business_webhook_url: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Google OAuth Access Token (Nếu dùng API trực tiếp)</label>
              <input
                className="form-input"
                type="password"
                placeholder="ya29...."
                value={settings.google_business_access_token || ''}
                onChange={(e) => setSettings({ ...settings, google_business_access_token: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account ID</label>
              <input
                className="form-input"
                type="text"
                placeholder="accounts/102938..."
                value={settings.google_business_account_id || ''}
                onChange={(e) => setSettings({ ...settings, google_business_account_id: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location ID</label>
              <input
                className="form-input"
                type="text"
                placeholder="locations/98765..."
                value={settings.google_business_location_id || ''}
                onChange={(e) => setSettings({ ...settings, google_business_location_id: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testingChannel !== null}
              onClick={() =>
                handleTestConnection('google_business', {
                  account_id: settings.google_business_account_id,
                  location_id: settings.google_business_location_id,
                  access_token: settings.google_business_access_token,
                  webhook_url: settings.google_business_webhook_url,
                })
              }
            >
              {testingChannel === 'google_business_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={testingChannel !== null || (!settings.google_business_webhook_url && !settings.google_business_access_token)}
              onClick={() => handleTestPost('google_business')}
              style={{ background: '#4285f4' }}
            >
              {testingChannel === 'google_business_post' ? 'Đang đăng thử...' : '🚀 Đăng thử lên Google Business'}
            </button>
          </div>
        </div>
      )}

      {/* ── 4. HASHNODE ───────────────────────────────── */}
      {(filter === 'all' || filter === 'publishing') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#2962ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                🔷
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>Hashnode (Developer & Tech Blog)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Tự động đồng bộ bài viết dưới dạng Markdown kèm thẻ Canonical URL bảo vệ SEO 100% lên blog Hashnode
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.hashnode_enabled)}
                onChange={(e) => setSettings({ ...settings, hashnode_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hashnode Personal Access Token</label>
              <input
                className="form-input"
                type="password"
                placeholder="Lấy tại Account Settings > Developer"
                value={settings.hashnode_access_token || ''}
                onChange={(e) => setSettings({ ...settings, hashnode_access_token: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Publication ID (ObjectId)</label>
              <input
                className="form-input"
                type="text"
                placeholder="ID ấn phẩm blog trên Hashnode"
                value={settings.hashnode_publication_id || ''}
                onChange={(e) => setSettings({ ...settings, hashnode_publication_id: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testingChannel !== null}
              onClick={() =>
                handleTestConnection('hashnode', {
                  access_token: settings.hashnode_access_token,
                  publication_id: settings.hashnode_publication_id,
                  webhook_url: settings.hashnode_webhook_url,
                })
              }
            >
              {testingChannel === 'hashnode_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={testingChannel !== null || (!settings.hashnode_access_token && !settings.hashnode_webhook_url)}
              onClick={() => handleTestPost('hashnode')}
              style={{ background: '#2962ff' }}
            >
              {testingChannel === 'hashnode_post' ? 'Đang đăng thử...' : '🚀 Xuất bản thử bài lên Hashnode'}
            </button>
          </div>
        </div>
      )}

      {/* ── 5. VK (VKONTAKTE) ─────────────────────────── */}
      {(filter === 'all' || filter === 'publishing') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#0077ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                🔷
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>VK (VKontakte Wall API)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Tự động đăng bài lên Tường cá nhân hoặc Cộng đồng/Group VKontakte
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.vk_enabled)}
                onChange={(e) => setSettings({ ...settings, vk_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">VK Access Token (Có quyền wall)</label>
              <input
                className="form-input"
                type="password"
                placeholder="vk1.a.xxxx..."
                value={settings.vk_access_token || ''}
                onChange={(e) => setSettings({ ...settings, vk_access_token: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Owner ID (ID người dùng hoặc -Group_ID)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Để trống là tường cá nhân, hoặc -123456 cho Group"
                value={settings.vk_owner_id || ''}
                onChange={(e) => setSettings({ ...settings, vk_owner_id: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testingChannel !== null}
              onClick={() => handleTestConnection('vk', { access_token: settings.vk_access_token, owner_id: settings.vk_owner_id })}
            >
              {testingChannel === 'vk_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={testingChannel !== null || !settings.vk_access_token}
              onClick={() => handleTestPost('vk')}
              style={{ background: '#0077ff' }}
            >
              {testingChannel === 'vk_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài lên VK'}
            </button>
          </div>
        </div>
      )}

      {/* ── 6. LEMMY ──────────────────────────────────── */}
      {(filter === 'all' || filter === 'decentralized') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#00bc8c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                🐭
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>Lemmy (Fediverse Link Aggregator)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Đăng link bài viết vào các cộng đồng Lemmy phi tập trung thuộc mạng ActivityPub
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.lemmy_enabled)}
                onChange={(e) => setSettings({ ...settings, lemmy_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lemmy Instance URL</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://lemmy.world hoặc https://sh.itjust.works"
                value={settings.lemmy_instance_url || ''}
                onChange={(e) => setSettings({ ...settings, lemmy_instance_url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Community ID (Mã số cộng đồng)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Ví dụ: 1234"
                value={settings.lemmy_community_id || ''}
                onChange={(e) => setSettings({ ...settings, lemmy_community_id: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lemmy JWT Auth Token</label>
              <input
                className="form-input"
                type="password"
                placeholder="JWT Token đăng nhập tài khoản Lemmy"
                value={settings.lemmy_jwt_token || ''}
                onChange={(e) => setSettings({ ...settings, lemmy_jwt_token: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testingChannel !== null}
              onClick={() =>
                handleTestConnection('lemmy', {
                  instance_url: settings.lemmy_instance_url,
                  jwt_token: settings.lemmy_jwt_token,
                  community_id: settings.lemmy_community_id,
                })
              }
            >
              {testingChannel === 'lemmy_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={testingChannel !== null || !settings.lemmy_instance_url || !settings.lemmy_jwt_token}
              onClick={() => handleTestPost('lemmy')}
              style={{ background: '#00bc8c' }}
            >
              {testingChannel === 'lemmy_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài lên Lemmy'}
            </button>
          </div>
        </div>
      )}

      {/* ── 7. WARPCAST (FARCASTER) ───────────────────── */}
      {(filter === 'all' || filter === 'decentralized') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#8a63d2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                🟪
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>Warpcast (Farcaster Cast API)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Tự động Cast bài viết và Embed link xem trước lên mạng xã hội phi tập trung Farcaster
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.warpcast_enabled)}
                onChange={(e) => setSettings({ ...settings, warpcast_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Neynar API Key</label>
              <input
                className="form-input"
                type="password"
                placeholder="Neynar Developer API Key"
                value={settings.warpcast_api_key || ''}
                onChange={(e) => setSettings({ ...settings, warpcast_api_key: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Signer UUID</label>
              <input
                className="form-input"
                type="text"
                placeholder="Signer UUID của tài khoản Farcaster"
                value={settings.warpcast_signer_uuid || ''}
                onChange={(e) => setSettings({ ...settings, warpcast_signer_uuid: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testingChannel !== null}
              onClick={() => handleTestConnection('warpcast', { api_key: settings.warpcast_api_key, signer_uuid: settings.warpcast_signer_uuid })}
            >
              {testingChannel === 'warpcast_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={testingChannel !== null || !settings.warpcast_api_key || !settings.warpcast_signer_uuid}
              onClick={() => handleTestPost('warpcast')}
              style={{ background: '#8a63d2' }}
            >
              {testingChannel === 'warpcast_post' ? 'Đang đăng thử...' : '🚀 Cast thử bài lên Warpcast'}
            </button>
          </div>
        </div>
      )}

      {/* ── 8. NOSTR ──────────────────────────────────── */}
      {(filter === 'all' || filter === 'decentralized') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#742dd2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                🦩
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>Nostr (Decentralized Notes)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Ký và xuất bản bài viết dạng Note (Kind 1) lên các relay phi tập trung của giao thức Nostr
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.nostr_enabled)}
                onChange={(e) => setSettings({ ...settings, nostr_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nostr Private Key (nsec hoặc hex)</label>
              <input
                className="form-input"
                type="password"
                placeholder="nsec1... hoặc 64 hex characters"
                value={settings.nostr_private_key || ''}
                onChange={(e) => setSettings({ ...settings, nostr_private_key: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nostr Webhook URL (Tùy chọn - Dùng nếu qua gateway)</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://..."
                value={settings.nostr_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, nostr_webhook_url: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testingChannel !== null}
              onClick={() => handleTestConnection('nostr', { private_key: settings.nostr_private_key, webhook_url: settings.nostr_webhook_url })}
            >
              {testingChannel === 'nostr_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={testingChannel !== null || (!settings.nostr_private_key && !settings.nostr_webhook_url)}
              onClick={() => handleTestPost('nostr')}
              style={{ background: '#742dd2' }}
            >
              {testingChannel === 'nostr_post' ? 'Đang đăng thử...' : '🚀 Xuất bản Note lên Nostr'}
            </button>
          </div>
        </div>
      )}

      {/* ── 9. LISTMONK ───────────────────────────────── */}
      {(filter === 'all' || filter === 'publishing') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                📧
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>Listmonk (Newsletter / Mailing List)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Tự động tạo chiến dịch email bản tin gửi tới danh sách độc giả mỗi khi có bài viết mới
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.listmonk_enabled)}
                onChange={(e) => setSettings({ ...settings, listmonk_enabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Listmonk URL</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://newsletter.miregalo.us"
                value={settings.listmonk_url || ''}
                onChange={(e) => setSettings({ ...settings, listmonk_url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target List ID</label>
              <input
                className="form-input"
                type="text"
                placeholder="1"
                value={settings.listmonk_list_id || ''}
                onChange={(e) => setSettings({ ...settings, listmonk_list_id: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">API Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="listmonk"
                value={settings.listmonk_username || ''}
                onChange={(e) => setSettings({ ...settings, listmonk_username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">API Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Listmonk API Password"
                value={settings.listmonk_password || ''}
                onChange={(e) => setSettings({ ...settings, listmonk_password: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f0f0f4' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testingChannel !== null}
              onClick={() =>
                handleTestConnection('listmonk', {
                  url: settings.listmonk_url,
                  username: settings.listmonk_username,
                  password: settings.listmonk_password,
                  list_id: settings.listmonk_list_id,
                })
              }
            >
              {testingChannel === 'listmonk_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={testingChannel !== null || !settings.listmonk_url}
              onClick={() => handleTestPost('listmonk')}
              style={{ background: '#0284c7' }}
            >
              {testingChannel === 'listmonk_post' ? 'Đang tạo thử...' : '🚀 Tạo chiến dịch thử'}
            </button>
          </div>
        </div>
      )}

      {/* ── 10. TIKTOK & YOUTUBE & DRIBBLE & OTHERS (CREATOR & COMMUNITY) ────────────────── */}
      {(filter === 'all' || filter === 'creator' || filter === 'community') && (
        <div className="admin-card" style={{ marginBottom: '20px' }}>
          <div className="admin-card-header" style={{ borderBottom: '1px solid #f0f0f4', paddingBottom: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                🌐
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#1d2939' }}>Các Kênh Sáng Tạo & Cộng Đồng Khác</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#667085' }}>
                  Hỗ trợ kết nối trực tiếp qua Webhook endpoint (Zapier, Make, n8n, Pabbly hoặc server riêng) để phân phối nội dung tức thì
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {/* TikTok */}
            <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>🎵 TikTok (Posting Webhook)</strong>
                <input
                  type="checkbox"
                  checked={Boolean(settings.tiktok_enabled)}
                  onChange={(e) => setSettings({ ...settings, tiktok_enabled: e.target.checked })}
                />
              </div>
              <input
                className="form-input"
                type="url"
                placeholder="TikTok Webhook URL..."
                value={settings.tiktok_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, tiktok_webhook_url: e.target.value })}
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleTestPost('tiktok')}
              >
                Gửi thử sang TikTok
              </button>
            </div>

            {/* YouTube */}
            <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>▶️ YouTube (Community Webhook)</strong>
                <input
                  type="checkbox"
                  checked={Boolean(settings.youtube_enabled)}
                  onChange={(e) => setSettings({ ...settings, youtube_enabled: e.target.checked })}
                />
              </div>
              <input
                className="form-input"
                type="url"
                placeholder="YouTube Webhook URL..."
                value={settings.youtube_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, youtube_webhook_url: e.target.value })}
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleTestPost('youtube')}
              >
                Gửi thử sang YouTube
              </button>
            </div>

            {/* Dribbble */}
            <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>🏀 Dribbble</strong>
                <input
                  type="checkbox"
                  checked={Boolean(settings.dribbble_enabled)}
                  onChange={(e) => setSettings({ ...settings, dribbble_enabled: e.target.checked })}
                />
              </div>
              <input
                className="form-input"
                type="url"
                placeholder="Dribbble Webhook / API URL..."
                value={settings.dribbble_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, dribbble_webhook_url: e.target.value })}
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleTestPost('dribbble')}
              >
                Gửi thử sang Dribbble
              </button>
            </div>

            {/* Whop */}
            <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>🟧 Whop Community</strong>
                <input
                  type="checkbox"
                  checked={Boolean(settings.whop_enabled)}
                  onChange={(e) => setSettings({ ...settings, whop_enabled: e.target.checked })}
                />
              </div>
              <input
                className="form-input"
                type="url"
                placeholder="Whop Notification Webhook..."
                value={settings.whop_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, whop_webhook_url: e.target.value })}
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleTestPost('whop')}
              >
                Gửi thử sang Whop
              </button>
            </div>

            {/* Twitch */}
            <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>👾 Twitch Announcement</strong>
                <input
                  type="checkbox"
                  checked={Boolean(settings.twitch_enabled)}
                  onChange={(e) => setSettings({ ...settings, twitch_enabled: e.target.checked })}
                />
              </div>
              <input
                className="form-input"
                type="url"
                placeholder="Twitch Webhook URL..."
                value={settings.twitch_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, twitch_webhook_url: e.target.value })}
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleTestPost('twitch')}
              >
                Gửi thử sang Twitch
              </button>
            </div>

            {/* Skool */}
            <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>🎓 Skool Community</strong>
                <input
                  type="checkbox"
                  checked={Boolean(settings.skool_enabled)}
                  onChange={(e) => setSettings({ ...settings, skool_enabled: e.target.checked })}
                />
              </div>
              <input
                className="form-input"
                type="url"
                placeholder="Skool Webhook URL..."
                value={settings.skool_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, skool_webhook_url: e.target.value })}
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleTestPost('skool')}
              >
                Gửi thử sang Skool
              </button>
            </div>

            {/* Kick */}
            <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>🟢 Kick Channel</strong>
                <input
                  type="checkbox"
                  checked={Boolean(settings.kick_enabled)}
                  onChange={(e) => setSettings({ ...settings, kick_enabled: e.target.checked })}
                />
              </div>
              <input
                className="form-input"
                type="url"
                placeholder="Kick Webhook URL..."
                value={settings.kick_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, kick_webhook_url: e.target.value })}
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleTestPost('kick')}
              >
                Gửi thử sang Kick
              </button>
            </div>

            {/* MeWe */}
            <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>👥 MeWe Page</strong>
                <input
                  type="checkbox"
                  checked={Boolean(settings.mewe_enabled)}
                  onChange={(e) => setSettings({ ...settings, mewe_enabled: e.target.checked })}
                />
              </div>
              <input
                className="form-input"
                type="url"
                placeholder="MeWe Webhook URL..."
                value={settings.mewe_webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, mewe_webhook_url: e.target.value })}
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleTestPost('mewe')}
              >
                Gửi thử sang MeWe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
