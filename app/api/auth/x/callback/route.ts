import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSocialSettings, saveSocialSettings } from '@/lib/social';
import { SITE_URL } from '@/lib/urls';
import { X_OAUTH_CALLBACK_URL } from '@/lib/social/twitter-oauth-config';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'x_oauth_state';
const VERIFIER_COOKIE = 'x_oauth_verifier';
const X_TOKEN_URL = 'https://api.x.com/2/oauth2/token';

function matchesState(expected: string | undefined, received: string | null): boolean {
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function finish(result: string) {
  const response = NextResponse.redirect(new URL(`/admin/settings/?tab=social&x_connection=${result}`, SITE_URL));
  const clearCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth/x',
    maxAge: 0,
  };
  response.cookies.set(STATE_COOKIE, '', clearCookieOptions);
  response.cookies.set(VERIFIER_COOKIE, '', clearCookieOptions);
  return response;
}

export async function GET(request: NextRequest) {
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const verifier = request.cookies.get(VERIFIER_COOKIE)?.value;
  const receivedState = request.nextUrl.searchParams.get('state');
  if (!matchesState(expectedState, receivedState) || !verifier) return finish('failed');

  if (request.nextUrl.searchParams.has('error')) {
    const error = request.nextUrl.searchParams.get('error');
    return finish(error === 'access_denied' ? 'denied' : 'failed');
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) return finish('failed');

  try {
    const settings = await getSocialSettings();
    const clientId = settings.twitter_oauth2_client_id?.trim();
    const clientSecret = settings.twitter_oauth2_client_secret;
    if (!clientId || !clientSecret) return finish('missing_credentials');

    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: X_OAUTH_CALLBACK_URL,
      code_verifier: verifier,
    });
    const tokenResponse = await fetch(X_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      cache: 'no-store',
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData.access_token || !tokenData.refresh_token) {
      return finish('failed');
    }

    const accountResponse = await fetch('https://api.x.com/2/users/me?user.fields=username', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: 'no-store',
    });
    const accountData = await accountResponse.json().catch(() => ({}));
    if (!accountResponse.ok || !accountData.data?.username) return finish('failed');

    await saveSocialSettings({
      twitter_oauth2_access_token: tokenData.access_token,
      twitter_oauth2_refresh_token: tokenData.refresh_token,
      twitter_oauth2_expires_at: Date.now() + Number(tokenData.expires_in || 7200) * 1000,
      twitter_oauth2_username: accountData.data.username,
    });
    return finish('connected');
  } catch {
    return finish('failed');
  }
}
