import type { TableName, TableRowMap } from '@/lib/types';

/** Minimal query language supported by every driver (local JSON + Supabase). */
export interface Query {
  eq?: Record<string, string | number | boolean | null>;
  /** array column contains this value, e.g. { field: 'category_ids', value: id } */
  contains?: { field: string; value: string };
  /** array column overlaps any of the values */
  overlaps?: { field: string; values: string[] };
  /** column value is one of values */
  in?: { field: string; values: (string | number)[] };
  /** case-insensitive substring search across fields */
  search?: { fields: string[]; term: string };
  order?: { field: string; asc?: boolean }[];
  limit?: number;
  offset?: number;
  /** optional projection (Supabase select string). Local driver ignores it. */
  select?: string;
}

export interface FindResult<T> {
  rows: T[];
  total: number;
}

export interface Driver {
  name: 'local' | 'supabase';
  find<K extends TableName>(table: K, q?: Query): Promise<FindResult<TableRowMap[K]>>;
  findOne<K extends TableName>(table: K, eq: Record<string, string | number | boolean>): Promise<TableRowMap[K] | null>;
  insert<K extends TableName>(table: K, row: Partial<TableRowMap[K]>): Promise<TableRowMap[K]>;
  update<K extends TableName>(table: K, id: string, patch: Partial<TableRowMap[K]>): Promise<TableRowMap[K]>;
  remove(table: TableName, id: string): Promise<void>;
  /** atomic-ish counter increment (clicks, hits) */
  increment(table: TableName, id: string, field: string): Promise<void>;
  getSetting<T = unknown>(key: string): Promise<T | null>;
  setSetting<T = unknown>(key: string, value: T): Promise<void>;
  upsertBatch?<K extends TableName>(table: K, rows: Partial<TableRowMap[K]>[], keyFields?: string[]): Promise<void>;
}
