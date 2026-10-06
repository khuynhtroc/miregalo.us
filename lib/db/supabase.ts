import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Driver } from './driver';

/**
 * Supabase driver. Uses the service-role key on the server only
 * (public pages read published rows; RLS policies in supabase/migrations also allow anon reads).
 */

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('DB_DRIVER=supabase but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function fail(error: { message: string } | null, ctx: string) {
  if (error) throw new Error(`[supabase] ${ctx}: ${error.message}`);
}

export const supabaseDriver: Driver = {
  name: 'supabase',
  async find(table, q = {}) {
    let query = sb().from(table).select(q.select ?? '*', { count: 'exact' });
    if (q.eq) for (const [k, v] of Object.entries(q.eq)) query = v === null ? query.is(k, null) : query.eq(k, v);
    if (q.contains) query = query.contains(q.contains.field, [q.contains.value]);
    if (q.overlaps) query = query.overlaps(q.overlaps.field, q.overlaps.values);
    if (q.in) query = query.in(q.in.field, q.in.values);
    if (q.search && q.search.term.trim()) {
      const term = q.search.term.trim().replace(/[%,()]/g, ' ');
      query = query.or(q.search.fields.map((f) => `${f}.ilike.%${term}%`).join(','));
    }
    for (const o of q.order ?? []) query = query.order(o.field, { ascending: o.asc !== false, nullsFirst: false });
    if (q.limit !== undefined) {
      const from = q.offset ?? 0;
      query = query.range(from, from + q.limit - 1);
    }
    const { data, error, count } = await query;
    fail(error, `find ${table}`);
    return { rows: (data ?? []) as never, total: count ?? 0 };
  },
  async findOne(table, eq) {
    let query = sb().from(table).select('*');
    for (const [k, v] of Object.entries(eq)) query = query.eq(k, v);
    const { data, error } = await query.limit(1).maybeSingle();
    fail(error, `findOne ${table}`);
    return (data ?? null) as never;
  },
  async insert(table, row) {
    const { data, error } = await sb().from(table).insert(row as never).select('*').single();
    fail(error, `insert ${table}`);
    return data as never;
  },
  async update(table, id, patch) {
    const { data, error } = await sb()
      .from(table)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    fail(error, `update ${table}`);
    return data as never;
  },
  async remove(table, id) {
    const { error } = await sb().from(table).delete().eq('id', id);
    fail(error, `remove ${table}`);
  },
  async increment(table, id, field) {
    const { error } = await sb().rpc('increment_counter', { p_table: table, p_id: id, p_field: field });
    fail(error, `increment ${table}.${field}`);
  },
  async getSetting(key) {
    const { data, error } = await sb().from('settings').select('value').eq('key', key).maybeSingle();
    fail(error, `getSetting ${key}`);
    return (data?.value ?? null) as never;
  },
  async setSetting(key, value) {
    const { error } = await sb()
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    fail(error, `setSetting ${key}`);
  },
  async upsertBatch(table, rows, keyFields = ['id']) {
    if (!rows.length) return;
    const { error } = await sb()
      .from(table)
      .upsert(rows as never, { onConflict: keyFields.join(',') });
    fail(error, `upsertBatch ${table}`);
  },
};
