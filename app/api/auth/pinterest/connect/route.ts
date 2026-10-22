import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSocialSettings } from '@/lib/social';
import { PINTEREST_OAUTH_CALLBACK_URL, PINTEREST_OAUTH_SCOPES } from '@/lib/social/pinterest-oauth-config';
import { SITE_URL } from '@/lib/urls';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'pinterest_oauth_state';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL('/admin/login/', SITE_URL));

  const settings = await getSocialSettings();
  const clientId = settings.pinterest_client_id?.trim();
  const clientSecret = settings.pinterest_client_secret;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/admin/settings/?tab=social&pinterest_connection=missing_credentials', SITE_URL));
  }

  const state = randomBytes(32).toString('base64url');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: PINTEREST_OAUTH_CALLBACK_URL,
    response_type: 'code',
    scope: PINTEREST_OAUTH_SCOPES.join(','),
    state,
  });
  const response = NextResponse.redirect(`https://www.pinterest.com/oauth/?${params.toString()}`);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/pinterest',
    maxAge: 10 * 60,
  });
  return response;
}
