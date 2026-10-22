import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSocialSettings } from '@/lib/social';
import { X_OAUTH_CALLBACK_URL } from '@/lib/social/twitter-oauth-config';
import { SITE_URL } from '@/lib/urls';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'x_oauth_state';
const VERIFIER_COOKIE = 'x_oauth_verifier';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login/', SITE_URL));
  }

  const settings = await getSocialSettings();
  const clientId = settings.twitter_oauth2_client_id?.trim();
  const clientSecret = settings.twitter_oauth2_client_secret;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/admin/settings/?tab=social&x_connection=missing_credentials', SITE_URL));
  }

  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(64).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: X_OAUTH_CALLBACK_URL,
    scope: 'tweet.read tweet.write users.read offline.access',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  const response = NextResponse.redirect(`https://x.com/i/oauth2/authorize?${params.toString()}`);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth/x',
    maxAge: 10 * 60,
  };
  response.cookies.set(STATE_COOKIE, state, cookieOptions);
  response.cookies.set(VERIFIER_COOKIE, verifier, cookieOptions);
  return response;
}
