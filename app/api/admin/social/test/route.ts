import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  testFacebookConnection,
  testInstagramConnection,
  testTwitterConnection,
  testMediumConnection,
  testTelegramConnection,
  testBlueskyConnection,
  testThreadsConnection,
  testMastodonConnection,
  testDiscordConnection,
  testSocialWebhook,
  getPinterestToken,
  testPinterestConnection,
  sharePostToAllChannels,
} from '@/lib/social';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { channel, credentials, action, post_id } = body;

    // Action 1: Test Connection
    if (action === 'test_connection') {
      if (channel === 'facebook') {
        const { page_id, access_token } = credentials || {};
        const result = await testFacebookConnection(page_id, access_token);
        return NextResponse.json(result);
      }

      if (channel === 'instagram') {
        const { user_id, access_token, facebook_page_id } = credentials || {};
        const result = await testInstagramConnection(user_id, access_token, facebook_page_id);
        return NextResponse.json(result);
      }

      if (channel === 'twitter') {
        const { api_key, api_secret, access_token, access_secret } = credentials || {};
        const result = await testTwitterConnection({
          apiKey: api_key,
          apiSecret: api_secret,
          accessToken: access_token,
          accessSecret: access_secret,
        });
        return NextResponse.json(result);
      }

      if (channel === 'medium') {
        const { integration_token } = credentials || {};
        const result = await testMediumConnection(integration_token);
        return NextResponse.json(result);
      }

      if (channel === 'pinterest') {
        const accessToken = credentials?.access_token || (await getPinterestToken());
        if (!accessToken) {
          return NextResponse.json({ success: false, error: 'Chưa điền Pinterest Access Token' });
        }
        return NextResponse.json(await testPinterestConnection(accessToken));
      }

      if (channel === 'telegram') {
        const { bot_token, chat_id } = credentials || {};
        return NextResponse.json(await testTelegramConnection(bot_token, chat_id));
      }

      if (channel === 'bluesky') {
        const { identifier, app_password } = credentials || {};
        return NextResponse.json(await testBlueskyConnection(identifier, app_password));
      }

      if (channel === 'threads') {
        const { user_id, access_token } = credentials || {};
        return NextResponse.json(await testThreadsConnection(user_id, access_token));
      }

      if (channel === 'mastodon') {
        const { instance_url, access_token } = credentials || {};
        return NextResponse.json(await testMastodonConnection(instance_url, access_token));
      }

      if (channel === 'discord') {
        const { webhook_url } = credentials || {};
        return NextResponse.json(await testDiscordConnection(webhook_url));
      }

      if (channel === 'webhook') {
        const { webhook_url, webhook_secret } = credentials || {};
        const result = await testSocialWebhook(webhook_url, webhook_secret);
        return NextResponse.json(result);
      }

      return NextResponse.json({ success: false, error: 'Kênh không hợp lệ' }, { status: 400 });
    }

    // Action 2: Test Post Share (send sample or real post)
    if (action === 'test_post') {
      let postToShare: any = null;
      if (post_id) {
        postToShare = await db.findOne('posts', { id: post_id });
      }
      if (!postToShare) {
        const { rows } = await db.find('posts', {
          eq: { status: 'published' },
          limit: 1,
        });
        postToShare = rows[0];
      }

      if (!postToShare) {
        return NextResponse.json({
          success: false,
          error: 'Chưa có bài viết xuất bản nào trên website để đăng thử',
        });
      }

      const report = await sharePostToAllChannels(postToShare, {
        forceChannels: channel ? [channel] : undefined,
        ignoreGlobalToggle: true,
      });

      return NextResponse.json({
        success: report.total_success > 0,
        report,
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không xác định' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
