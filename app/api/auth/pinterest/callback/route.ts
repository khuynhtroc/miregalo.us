import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSocialSettings, saveSocialSettings } from '@/lib/social';
import { PINTEREST_OAUTH_CALLBACK_URL, PINTEREST_OAUTH_SCOPES } from '@/lib/social/pinterest-oauth-config';
import { SITE_URL } from '@/lib/urls';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'pinterest_oauth_state';
const PINTEREST_TOKEN_URL = 'https://api.pinterest.com/v5/oauth/token';

function matchesState(expected: string | undefined, received: string | null): boolean {
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function finish(result: string) {
  const response = NextResponse.redirect(new URL(`/admin/settings/?tab=social&pinterest_connection=${result}`, SITE_URL));
  response.cookies.set(STATE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/pinterest',
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const receivedState = request.nextUrl.searchParams.get('state');
  if (!matchesState(expectedState, receivedState)) return finish('failed');

  if (request.nextUrl.searchParams.has('error')) {
    return finish(request.nextUrl.searchParams.get('error') === 'access_denied' ? 'denied' : 'failed');
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) return finish('failed');

  try {
    const settings = await getSocialSettings();
    const clientId = settings.pinterest_client_id?.trim();
    const clientSecret = settings.pinterest_client_secret;
    if (!clientId || !clientSecret) return finish('missing_credentials');

    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: PINTEREST_OAUTH_CALLBACK_URL,
      continuous_refresh: 'true',
    });
    const tokenResponse = await fetch(PINTEREST_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      cache: 'no-store',
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData.access_token) return finish('failed');

    const grantedScopes = String(tokenData.scope || '').split(/[\s,]+/).filter(Boolean);
    if (grantedScopes.length && PINTEREST_OAUTH_SCOPES.some((scope) => !grantedScopes.includes(scope))) {
      return finish('missing_scopes');
    }

    await saveSocialSettings({
      pinterest_access_token: tokenData.access_token,
      pinterest_refresh_token: tokenData.refresh_token || settings.pinterest_refresh_token || '',
      pinterest_token_expires_at: Date.now() + Number(tokenData.expires_in || 2_592_000) * 1000,
    });
    return finish('connected');
  } catch {
    return finish('failed');
  }
}
