import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSocialSettings, saveSocialSettings } from '@/lib/social';

export const dynamic = 'force-dynamic';

function clientSettings(settings: Awaited<ReturnType<typeof getSocialSettings>>) {
  const {
    twitter_oauth2_client_secret: _clientSecret,
    twitter_oauth2_access_token: _accessToken,
    twitter_oauth2_refresh_token: _refreshToken,
    twitter_oauth2_expires_at: _expiresAt,
    pinterest_client_secret: _pinterestClientSecret,
    pinterest_access_token: _pinterestAccessToken,
    pinterest_refresh_token: _pinterestRefreshToken,
    pinterest_token_expires_at: _pinterestTokenExpiresAt,
    ...visibleSettings
  } = settings;
  return {
    ...visibleSettings,
    twitter_oauth2_connected: Boolean(settings.twitter_oauth2_access_token || settings.twitter_oauth2_refresh_token),
    twitter_oauth2_client_secret_configured: Boolean(settings.twitter_oauth2_client_secret),
    pinterest_oauth_connected: Boolean(
      settings.pinterest_access_token &&
      (settings.pinterest_refresh_token || (settings.pinterest_client_id && settings.pinterest_token_expires_at))
    ),
    pinterest_client_secret_configured: Boolean(settings.pinterest_client_secret),
    pinterest_token_configured: Boolean(settings.pinterest_access_token || process.env.PINTEREST_ACCESS_TOKEN),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await getSocialSettings();
  return NextResponse.json(clientSettings(settings));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const editableSettings = { ...body };
    // Backfill progress is updated by the admin queue and cron worker. Ignore
    // stale client copies when saving the rest of the social configuration.
    delete editableSettings.facebook_backfill;
    delete editableSettings.twitter_oauth2_access_token;
    delete editableSettings.twitter_oauth2_refresh_token;
    delete editableSettings.twitter_oauth2_expires_at;
    delete editableSettings.twitter_oauth2_username;
    delete editableSettings.twitter_oauth2_connected;
    delete editableSettings.twitter_oauth2_client_secret_configured;
    delete editableSettings.pinterest_refresh_token;
    delete editableSettings.pinterest_token_expires_at;
    delete editableSettings.pinterest_oauth_connected;
    delete editableSettings.pinterest_client_secret_configured;
    delete editableSettings.pinterest_token_configured;
    if (typeof editableSettings.twitter_oauth2_client_secret !== 'string' || !editableSettings.twitter_oauth2_client_secret.trim()) {
      delete editableSettings.twitter_oauth2_client_secret;
    }
    if (typeof editableSettings.pinterest_client_secret !== 'string' || !editableSettings.pinterest_client_secret.trim()) {
      delete editableSettings.pinterest_client_secret;
    }
    if (typeof editableSettings.pinterest_access_token !== 'string' || !editableSettings.pinterest_access_token.trim()) {
      delete editableSettings.pinterest_access_token;
    }
    const updated = await saveSocialSettings(editableSettings);
    return NextResponse.json({ success: true, settings: clientSettings(updated) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save social settings' }, { status: 500 });
  }
}
