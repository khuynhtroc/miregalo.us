import 'server-only';
import type { Driver } from './driver';
import { localDriver } from './local';
import { supabaseDriver } from './supabase';

export function getDriver(): Driver {
  if (process.env.DB_DRIVER === 'local') {
    return localDriver;
  }
  return supabaseDriver;
}

export const db = new Proxy({} as Driver, {
  get(_t, prop) {
    return (getDriver() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type { Query, Driver, FindResult } from './driver';
