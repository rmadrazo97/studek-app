/**
 * Generic CRUD Operations for SQLite
 *
 * Provides type-safe CRUD utilities for all database entities.
 */

import { getDatabase, transaction } from './index';
import type { PaginationOptions, SortOptions, PaginatedResponse } from './types';

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Convert a JavaScript value to SQLite-compatible value
 * - Booleans become 0/1
 * - undefined becomes null
 * - Other types pass through
 */
function toSqliteValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

// ============================================
// Generic CRUD Operations
// ============================================

/**
 * Create a new record in the specified table
 *
 * @param table - Table name
 * @param data - Record data (without id, created_at, updated_at)
 * @returns The created record with id and timestamps
 */
export function create<T extends Record<string, unknown>>(
  table: string,
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>
): T {
  console.log(`[CRUD] create - Table: ${table}`);
  console.log('[CRUD] create - Input data:', JSON.stringify(data, null, 2));

  const db = getDatabase();
  const id = generateId();
  const timestamp = now();

  const record = {
    id,
    ...data,
    created_at: timestamp,
    updated_at: timestamp,
  };

  console.log('[CRUD] create - Full record before filtering:', JSON.stringify(record, null, 2));

  // Log each field before filtering
  for (const [key, value] of Object.entries(record)) {
    const valueType = typeof value;
    const isUndefined = value === undefined;
    const isNull = value === null;
    const isValidType = isNull || ['string', 'number', 'boolean', 'bigint'].includes(valueType) || (value instanceof Buffer);
    console.log(`[CRUD] Pre-filter "${key}": value=${JSON.stringify(value)}, type=${valueType}, isUndefined=${isUndefined}, isNull=${isNull}, isValidSQLite=${isValidType}`);
  }

  // Filter out undefined values and convert to entries for SQLite compatibility
  const entries = Object.entries(record).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => key);
  const placeholders = columns.map(() => '?').join(', ');
  // Convert values to SQLite-compatible types (booleans -> 0/1, undefined -> null)
  const values = entries.map(([, value]) => toSqliteValue(value));

  console.log('[CRUD] create - Columns:', columns);
  console.log('[CRUD] create - Values:', JSON.stringify(values));

  // Log each value being bound to SQLite
  values.forEach((value, index) => {
    const valueType = typeof value;
    const isNull = value === null;
    const isValidType = isNull || ['string', 'number', 'boolean', 'bigint'].includes(valueType) || (value instanceof Buffer);
    console.log(`[CRUD] Binding[${index}] "${columns[index]}": value=${JSON.stringify(value)}, type=${valueType}, isNull=${isNull}, isValidSQLite=${isValidType}`);
    if (!isValidType) {
      console.error(`[CRUD] INVALID VALUE DETECTED at index ${index} for column "${columns[index]}": ${JSON.stringify(value)}`);
    }
  });

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  console.log('[CRUD] create - SQL:', sql);

  try {
    db.prepare(sql).run(...values);
    console.log('[CRUD] create - Insert successful');
  } catch (error) {
    console.error('[CRUD] create - SQLite error:', error);
    console.error('[CRUD] create - Failed SQL:', sql);
    console.error('[CRUD] create - Failed values:', JSON.stringify(values));
    throw error;
  }

  // Return record with undefined values converted to null for consistency
  const sanitizedRecord = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, value === undefined ? null : value])
  );
  return sanitizedRecord as T;
}

/**
 * Find a record by ID
 *
 * @param table - Table name
 * @param id - Record ID
 * @returns The record or null if not found
 */
export function findById<T>(table: string, id: string): T | null {
  const db = getDatabase();
  const sql = `SELECT * FROM ${table} WHERE id = ?`;
  const result = db.prepare(sql).get(id);
  return (result as T) || null;
}

/**
 * Find a single record by a specific column
 *
 * @param table - Table name
 * @param column - Column name to search
 * @param value - Value to match
 * @returns The record or null if not found
 */
export function findBy<T>(table: string, column: string, value: unknown): T | null {
  const db = getDatabase();
  const sql = `SELECT * FROM ${table} WHERE ${column} = ?`;
  const result = db.prepare(sql).get(value);
  return (result as T) || null;
}

/**
 * Find all records matching criteria
 *
 * @param table - Table name
 * @param where - Object with column-value pairs for WHERE clause
 * @param options - Pagination and sorting options
 * @returns Array of matching records
 */
export function findAll<T>(
  table: string,
  where: Record<string, unknown> = {},
  options: PaginationOptions & SortOptions = {}
): T[] {
  const db = getDatabase();
  const { limit = 100, offset = 0, orderBy = 'created_at', order = 'DESC' } = options;

  const whereEntries = Object.entries(where);
  const whereClause =
    whereEntries.length > 0
      ? `WHERE ${whereEntries.map(([col]) => `${col} = ?`).join(' AND ')}`
      : '';
  const whereValues = whereEntries.map(([, val]) => val);

  const sql = `
    SELECT * FROM ${table}
    ${whereClause}
    ORDER BY ${orderBy} ${order}
    LIMIT ? OFFSET ?
  `;

  return db.prepare(sql).all(...whereValues, limit, offset) as T[];
}

/**
 * Find all records with pagination info
 *
 * @param table - Table name
 * @param where - Object with column-value pairs for WHERE clause
 * @param options - Pagination and sorting options
 * @returns Paginated response with records and metadata
 */
export function findAllPaginated<T>(
  table: string,
  where: Record<string, unknown> = {},
  options: PaginationOptions & SortOptions = {}
): PaginatedResponse<T> {
  const { limit = 100, offset = 0 } = options;

  const data = findAll<T>(table, where, options);
  const total = count(table, where);

  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + data.length < total,
  };
}

/**
 * Count records matching criteria
 *
 * @param table - Table name
 * @param where - Object with column-value pairs for WHERE clause
 * @returns Count of matching records
 */
export function count(table: string, where: Record<string, unknown> = {}): number {
  const db = getDatabase();

  const whereEntries = Object.entries(where);
  const whereClause =
    whereEntries.length > 0
      ? `WHERE ${whereEntries.map(([col]) => `${col} = ?`).join(' AND ')}`
      : '';
  const whereValues = whereEntries.map(([, val]) => val);

  const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
  const result = db.prepare(sql).get(...whereValues) as { count: number };

  return result.count;
}

/**
 * Update a record by ID
 *
 * @param table - Table name
 * @param id - Record ID
 * @param data - Fields to update
 * @returns The updated record or null if not found
 */
export function update<T>(
  table: string,
  id: string,
  data: Partial<Omit<T, 'id' | 'created_at'>>
): T | null {
  const db = getDatabase();
  const timestamp = now();

  const updateData = { ...data, updated_at: timestamp };
  // Filter out undefined values for SQLite compatibility
  const entries = Object.entries(updateData).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return findById<T>(table, id);
  }

  const setClause = entries.map(([col]) => `${col} = ?`).join(', ');
  // Convert values to SQLite-compatible types (booleans -> 0/1, undefined -> null)
  const values = entries.map(([, val]) => toSqliteValue(val));

  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  const result = db.prepare(sql).run(...values, id);

  if (result.changes === 0) {
    return null;
  }

  return findById<T>(table, id);
}

/**
 * Delete a record by ID
 *
 * @param table - Table name
 * @param id - Record ID
 * @returns True if deleted, false if not found
 */
export function deleteById(table: string, id: string): boolean {
  const db = getDatabase();
  const sql = `DELETE FROM ${table} WHERE id = ?`;
  const result = db.prepare(sql).run(id);
  return result.changes > 0;
}

/**
 * Delete multiple records matching criteria
 *
 * @param table - Table name
 * @param where - Object with column-value pairs for WHERE clause
 * @returns Number of deleted records
 */
export function deleteWhere(table: string, where: Record<string, unknown>): number {
  const db = getDatabase();

  const whereEntries = Object.entries(where);
  if (whereEntries.length === 0) {
    throw new Error('deleteWhere requires at least one condition');
  }

  const whereClause = whereEntries.map(([col]) => `${col} = ?`).join(' AND ');
  const whereValues = whereEntries.map(([, val]) => val);

  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  const result = db.prepare(sql).run(...whereValues);

  return result.changes;
}

/**
 * Check if a record exists
 *
 * @param table - Table name
 * @param id - Record ID
 * @returns True if exists
 */
export function exists(table: string, id: string): boolean {
  const db = getDatabase();
  const sql = `SELECT 1 FROM ${table} WHERE id = ? LIMIT 1`;
  const result = db.prepare(sql).get(id);
  return result !== undefined;
}

/**
 * Upsert (insert or update) a record
 *
 * @param table - Table name
 * @param data - Record data with id
 * @param conflictColumns - Columns to check for conflict (default: ['id'])
 * @returns The upserted record
 */
export function upsert<T extends Record<string, unknown>>(
  table: string,
  data: T & { id: string },
  conflictColumns: string[] = ['id']
): T {
  const db = getDatabase();
  const timestamp = now();

  const record = {
    ...data,
    updated_at: timestamp,
    created_at: data.created_at || timestamp,
  };

  // Filter out undefined values for SQLite compatibility
  const entries = Object.entries(record).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => key);
  const placeholders = columns.map(() => '?').join(', ');
  const values = entries.map(([, value]) => value === undefined ? null : value);

  const updateColumns = columns.filter((col) => !conflictColumns.includes(col) && col !== 'created_at');
  const updateClause = updateColumns.map((col) => `${col} = excluded.${col}`).join(', ');

  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT(${conflictColumns.join(', ')}) DO UPDATE SET ${updateClause}
  `;

  db.prepare(sql).run(...values);
  return findById<T>(table, data.id) as T;
}

/**
 * Bulk insert multiple records
 *
 * @param table - Table name
 * @param records - Array of records to insert
 * @returns Array of created records with ids
 */
export function bulkCreate<T extends Record<string, unknown>>(
  table: string,
  records: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>
): T[] {
  return transaction(() => {
    return records.map((record) => create<T>(table, record));
  });
}

/**
 * Bulk delete by IDs
 *
 * @param table - Table name
 * @param ids - Array of IDs to delete
 * @returns Number of deleted records
 */
export function bulkDelete(table: string, ids: string[]): number {
  if (ids.length === 0) return 0;

  const db = getDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  const sql = `DELETE FROM ${table} WHERE id IN (${placeholders})`;
  const result = db.prepare(sql).run(...ids);

  return result.changes;
}

// ============================================
// Query Builder Helper
// ============================================

export interface QueryBuilder<T> {
  where(column: string, value: unknown): QueryBuilder<T>;
  whereIn(column: string, values: unknown[]): QueryBuilder<T>;
  whereLike(column: string, pattern: string): QueryBuilder<T>;
  orderBy(column: string, direction?: 'ASC' | 'DESC'): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  offset(count: number): QueryBuilder<T>;
  first(): T | null;
  all(): T[];
  count(): number;
}

/**
 * Create a query builder for a table
 *
 * @param table - Table name
 * @returns Query builder instance
 */
export function query<T>(table: string): QueryBuilder<T> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let orderByClause = '';
  let limitValue: number | null = null;
  let offsetValue: number | null = null;

  const builder: QueryBuilder<T> = {
    where(column: string, value: unknown) {
      conditions.push(`${column} = ?`);
      values.push(value);
      return builder;
    },
    whereIn(column: string, vals: unknown[]) {
      if (vals.length > 0) {
        const placeholders = vals.map(() => '?').join(', ');
        conditions.push(`${column} IN (${placeholders})`);
        values.push(...vals);
      }
      return builder;
    },
    whereLike(column: string, pattern: string) {
      conditions.push(`${column} LIKE ?`);
      values.push(pattern);
      return builder;
    },
    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC') {
      orderByClause = `ORDER BY ${column} ${direction}`;
      return builder;
    },
    limit(count: number) {
      limitValue = count;
      return builder;
    },
    offset(count: number) {
      offsetValue = count;
      return builder;
    },
    first(): T | null {
      limitValue = 1;
      const results = builder.all();
      return results[0] || null;
    },
    all(): T[] {
      const db = getDatabase();
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limitClause = limitValue !== null ? `LIMIT ${limitValue}` : '';
      const offsetClause = offsetValue !== null ? `OFFSET ${offsetValue}` : '';

      const sql = `SELECT * FROM ${table} ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`.trim();
      return db.prepare(sql).all(...values) as T[];
    },
    count(): number {
      const db = getDatabase();
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
      const result = db.prepare(sql).get(...values) as { count: number };
      return result.count;
    },
  };

  return builder;
}
