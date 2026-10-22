import { SITE_URL } from '@/lib/urls';

/** Register this exact redirect URI in the Pinterest Developer Portal. */
export const PINTEREST_OAUTH_CALLBACK_URL = `${SITE_URL}/api/auth/pinterest/callback/`;

export const PINTEREST_OAUTH_SCOPES = ['boards:read', 'boards:write', 'pins:read', 'pins:write'];
