'use client';

import { useState, useEffect } from 'react';
import type { SocialSettings } from '@/lib/social/types';

export function SocialAutoShareManager() {
  const [settings, setSettings] = useState<SocialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ channel: string; success: boolean; message: string; details?: any } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/social/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        setMsg({ type: 'error', text: 'Không tải được cấu hình Social Auto-Share' });
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
      const res = await fetch('/api/admin/social/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setMsg({ type: 'success', text: '✅ Đã lưu cấu hình Mạng Xã Hội thành công!' });
      } else {
        setMsg({ type: 'error', text: `❌ Lỗi khi lưu: ${data.error || 'Unknown error'}` });
      }
    } catch {
      setMsg({ type: 'error', text: '❌ Lỗi kết nối khi lưu cấu hình' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (channel: string, credentials: any) => {
    setTestingChannel(`${channel}_conn`);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/social/test', {
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
        if (channel === 'pinterest' && data.boards_count) successText += ` (Tìm thấy ${data.boards_count} bảng: ${data.sample_boards?.join(', ')})`;
        if (channel === 'webhook') successText += ' (Webhook nhận phản hồi 200 OK)';

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
      const res = await fetch('/api/admin/social/test', {
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
          message: `🚀 Đăng thử thành công lên ${channel.toUpperCase()}! ${channelRes?.url ? `Xem: ${channelRes.url}` : ''}`,
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
      <div className="py-12 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div>
        <p className="mt-3 text-sm font-medium">Đang tải cấu hình Mạng Xã Hội...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📢</span>
            <h2 className="text-xl font-bold">Tự Động Chia Sẻ Mạng Xã Hội (Social Auto-Share)</h2>
          </div>
          <p className="mt-1 text-sm text-indigo-200">
            Tự động chia sẻ bài viết mới lên Facebook Fanpage, X (Twitter), Medium, Pinterest hoặc Webhook ngay khi xuất bản.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/15 transition">
            <input
              type="checkbox"
              checked={settings.auto_share_enabled}
              onChange={(e) => setSettings({ ...settings, auto_share_enabled: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-semibold">Bật Tự Động Chia Sẻ</span>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 active:scale-95 disabled:opacity-50 transition"
          >
            {saving ? 'Đang lưu...' : '💾 Lưu Cấu Hình'}
          </button>
        </div>
      </div>

      {/* Global alert messages */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Test feedback */}
      {testResult && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border shadow-sm ${
            testResult.success
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{testResult.message}</span>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs text-slate-400 hover:text-slate-600 underline ml-4"
            >
              Đóng
            </button>
          </div>
          {testResult.details?.url && (
            <div className="mt-2 text-xs">
              <a
                href={testResult.details.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline font-semibold"
              >
                🔗 Bấm vào đây để xem bài viết vừa đăng trên mạng xã hội
              </a>
            </div>
          )}
        </div>
      )}

      {/* 1. Facebook Fanpage */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg">
              f
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Facebook Fanpage</h3>
              <p className="text-xs text-slate-500">Đăng bài viết mới kèm link và ảnh đại diện lên trang Fanpage</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.facebook_enabled}
              onChange={(e) => setSettings({ ...settings, facebook_enabled: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-slate-700">Kích hoạt</span>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Facebook Page ID
            </label>
            <input
              type="text"
              placeholder="VD: 104829104829104"
              value={settings.facebook_page_id}
              onChange={(e) => setSettings({ ...settings, facebook_page_id: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Lấy tại mục Giới thiệu (About) của Fanpage hoặc Business Suite
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Page Access Token (Vĩnh viễn)
            </label>
            <input
              type="password"
              placeholder="EAA..."
              value={settings.facebook_access_token}
              onChange={(e) => setSettings({ ...settings, facebook_access_token: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Token quyền `pages_manage_posts` & `pages_read_engagement` từ Meta for Developers
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Mẫu nội dung đăng (Template)
            </label>
            <textarea
              rows={2}
              value={settings.facebook_template || ''}
              onChange={(e) => setSettings({ ...settings, facebook_template: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Biến khả dụng: <code>&#123;title&#125;</code> (tiêu đề), <code>&#123;excerpt&#125;</code> (tóm tắt), <code>&#123;url&#125;</code> (link bài viết)
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('facebook', {
                page_id: settings.facebook_page_id,
                access_token: settings.facebook_access_token,
              })
            }
            className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition"
          >
            {testingChannel === 'facebook_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối'}
          </button>
          <button
            type="button"
            disabled={testingChannel !== null || !settings.facebook_page_id || !settings.facebook_access_token}
            onClick={() => handleTestPost('facebook')}
            className="rounded-lg bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition"
          >
            {testingChannel === 'facebook_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài mới nhất lên Facebook'}
          </button>
        </div>
      </div>

      {/* 2. X (Twitter) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white font-bold text-lg">
              𝕏
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">X (Twitter)</h3>
              <p className="text-xs text-slate-500">Tự động đăng Tweet kèm link và hashtag khi có bài viết mới</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.twitter_enabled}
              onChange={(e) => setSettings({ ...settings, twitter_enabled: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-sm font-semibold text-slate-700">Kích hoạt</span>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              API Key (Consumer Key)
            </label>
            <input
              type="password"
              value={settings.twitter_api_key}
              onChange={(e) => setSettings({ ...settings, twitter_api_key: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              API Key Secret
            </label>
            <input
              type="password"
              value={settings.twitter_api_secret}
              onChange={(e) => setSettings({ ...settings, twitter_api_secret: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Access Token
            </label>
            <input
              type="password"
              value={settings.twitter_access_token}
              onChange={(e) => setSettings({ ...settings, twitter_access_token: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Access Token Secret
            </label>
            <input
              type="password"
              value={settings.twitter_access_secret}
              onChange={(e) => setSettings({ ...settings, twitter_access_secret: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Mẫu Tweet (Template)
            </label>
            <input
              type="text"
              value={settings.twitter_template || ''}
              onChange={(e) => setSettings({ ...settings, twitter_template: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Biến: <code>&#123;title&#125;</code>, <code>&#123;url&#125;</code> (Tự động cắt gọn nếu quá 280 ký tự)
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('twitter', {
                api_key: settings.twitter_api_key,
                api_secret: settings.twitter_api_secret,
                access_token: settings.twitter_access_token,
                access_secret: settings.twitter_access_secret,
              })
            }
            className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition"
          >
            {testingChannel === 'twitter_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra kết nối X'}
          </button>
          <button
            type="button"
            disabled={testingChannel !== null || !settings.twitter_api_key || !settings.twitter_access_token}
            onClick={() => handleTestPost('twitter')}
            className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {testingChannel === 'twitter_post' ? 'Đang Tweet thử...' : '🚀 Tweet thử bài mới nhất lên X'}
          </button>
        </div>
      </div>

      {/* 3. Medium (Canonical SEO) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Medium (Cross-posting)</h3>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Chuẩn SEO Canonical
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Đăng bài lên Medium với thẻ <code>canonical_url</code> trỏ về web gốc để tăng Authority & Backlink
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.medium_enabled}
              onChange={(e) => setSettings({ ...settings, medium_enabled: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-slate-700">Kích hoạt</span>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Medium Integration Token
            </label>
            <input
              type="password"
              placeholder="281a9..."
              value={settings.medium_integration_token}
              onChange={(e) => setSettings({ ...settings, medium_integration_token: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Lấy tại: Medium.com ➔ Settings ➔ Security and apps ➔ Integration tokens
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Trạng thái xuất bản (Publish Status)
            </label>
            <select
              value={settings.medium_publish_status || 'public'}
              onChange={(e) =>
                setSettings({ ...settings, medium_publish_status: e.target.value as any })
              }
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="public">Công khai (Public) - Khuyến nghị cho SEO</option>
              <option value="draft">Bản nháp (Draft) - Duyệt trước khi phát hành</option>
              <option value="unlisted">Không công khai (Unlisted)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('medium', {
                integration_token: settings.medium_integration_token,
              })
            }
            className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition"
          >
            {testingChannel === 'medium_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra Token Medium'}
          </button>
          <button
            type="button"
            disabled={testingChannel !== null || !settings.medium_integration_token}
            onClick={() => handleTestPost('medium')}
            className="rounded-lg bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition"
          >
            {testingChannel === 'medium_post' ? 'Đang đăng thử...' : '🚀 Đăng thử bài mới nhất lên Medium'}
          </button>
        </div>
      </div>

      {/* 4. Pinterest */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white font-bold text-lg">
              P
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pinterest</h3>
              <p className="text-xs text-slate-500">Tự động ghim ảnh đại diện kèm link affiliate và bài viết lên Board</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.pinterest_enabled}
              onChange={(e) => setSettings({ ...settings, pinterest_enabled: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-semibold text-slate-700">Kích hoạt</span>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Pinterest Access Token
            </label>
            <input
              type="password"
              placeholder="pina_..."
              value={settings.pinterest_access_token}
              onChange={(e) => setSettings({ ...settings, pinterest_access_token: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Lấy tại Pinterest Developer Portal (scope: `boards:read`, `pins:write`)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Tên Bảng (Board Name)
            </label>
            <input
              type="text"
              placeholder="VD: Ideas de Regalos"
              value={settings.pinterest_board_name || ''}
              onChange={(e) => setSettings({ ...settings, pinterest_board_name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Hệ thống sẽ tự tìm bảng này, nếu chưa có sẽ tự động tạo mới
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('pinterest', {
                access_token: settings.pinterest_access_token,
              })
            }
            className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition"
          >
            {testingChannel === 'pinterest_conn' ? 'Đang kiểm tra...' : '🔍 Kiểm tra Pinterest Token'}
          </button>
          <button
            type="button"
            disabled={testingChannel !== null || !settings.pinterest_access_token}
            onClick={() => handleTestPost('pinterest')}
            className="rounded-lg bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
          >
            {testingChannel === 'pinterest_post' ? 'Đang ghim thử...' : '🚀 Ghim thử bài mới nhất lên Pinterest'}
          </button>
        </div>
      </div>

      {/* 5. Webhook (Make.com, Zapier, n8n) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-lg">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Webhook Tự Động (Make / Zapier / n8n)</h3>
                <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                  Mở Rộng Không Giới Hạn
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gửi payload bài viết sang Make.com / Zapier / n8n để phân phối tới Telegram, Threads, Instagram, LinkedIn...
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.webhook_enabled}
              onChange={(e) => setSettings({ ...settings, webhook_enabled: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-semibold text-slate-700">Kích hoạt</span>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://hook.eu1.make.com/..."
              value={settings.webhook_url}
              onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Secret Key (Tùy chọn)
            </label>
            <input
              type="password"
              placeholder="Gửi trong header X-Miregalo-Secret"
              value={settings.webhook_secret || ''}
              onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={testingChannel !== null}
            onClick={() =>
              handleTestConnection('webhook', {
                webhook_url: settings.webhook_url,
                webhook_secret: settings.webhook_secret,
              })
            }
            className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition"
          >
            {testingChannel === 'webhook_conn' ? 'Đang kiểm tra...' : '🔍 Gửi thử Test Ping'}
          </button>
          <button
            type="button"
            disabled={testingChannel !== null || !settings.webhook_url}
            onClick={() => handleTestPost('webhook')}
            className="rounded-lg bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition"
          >
            {testingChannel === 'webhook_post' ? 'Đang gửi...' : '🚀 Bắn thử bài viết đầy đủ sang Webhook'}
          </button>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition"
        >
          {saving ? 'Đang lưu...' : '💾 Lưu Toàn Bộ Cấu Hình Mạng Xã Hội'}
        </button>
      </div>
    </div>
  );
}
