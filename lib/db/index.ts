import 'server-only';
import type { Driver } from './driver';
import { localDriver } from './local';
import { supabaseDriver } from './supabase';

export function getDriver(): Driver {
  return process.env.DB_DRIVER === 'supabase' ? supabaseDriver : localDriver;
}

export const db = new Proxy({} as Driver, {
  get(_t, prop) {
    return (getDriver() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type { Query, Driver, FindResult } from './driver';
