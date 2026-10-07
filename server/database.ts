import { createRequire } from 'node:module';
import type { Database as WasmDatabase } from 'node-sqlite3-wasm';
import session from 'express-session';
import { mkdirSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { defaultContent } from '../shared/content';

const { Database } = createRequire(import.meta.url)(
  'node-sqlite3-wasm',
) as typeof import('node-sqlite3-wasm');
type Param = string | number | bigint | null | Uint8Array;
// better-sqlite3 benzeri küçük arayüz. SQLite WebAssembly olarak çalışır: derleme veya
// sistem kütüphanesi gerektirmez (paylaşımlı hostlarda eski glibc sorunu yaşanmaz).
export type Db = {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: Param[]): void;
    get(...params: Param[]): unknown;
    all(...params: Param[]): unknown[];
  };
  close(): void;
};
function wrap(raw: WasmDatabase): Db {
  return {
    exec: (sql) => raw.exec(sql),
    prepare: (sql) => ({
      run: (...params) => void raw.run(sql, params),
      get: (...params) => raw.get(sql, params) ?? undefined,
      all: (...params) => raw.all(sql, params),
    }),
    close: () => raw.close(),
  };
}

export function openDatabase(dir: string): Db {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const path = resolve(dir, 'can-psikoloji.sqlite');
  const db = wrap(new Database(path));
  db.exec(`PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS revisions (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL, created_at TEXT NOT NULL, actor TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admin_auth (id INTEGER PRIMARY KEY CHECK(id=1), hash TEXT NOT NULL, must_change INTEGER NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (username TEXT PRIMARY KEY, attempts INTEGER NOT NULL, locked_until INTEGER NOT NULL);
  `);
  db.prepare(
    'INSERT OR IGNORE INTO content (id, body, version, updated_at) VALUES (1, ?, 1, ?)',
  ).run(JSON.stringify(defaultContent), new Date().toISOString());
  chmodSync(path, 0o600);
  return db;
}

export class SqliteSessionStore extends session.Store {
  timer: ReturnType<typeof setInterval>;
  constructor(private db: Db) {
    super();
    this.timer = setInterval(() => {
      this.db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
    }, 60_000);
    this.timer.unref();
  }
  get(sid: string, cb: (err: unknown, data?: session.SessionData | null) => void) {
    try {
      const row = this.db
        .prepare('SELECT data FROM sessions WHERE sid = ? AND expires > ?')
        .get(sid, Date.now()) as { data: string } | undefined;
      cb(null, row ? JSON.parse(row.data) : null);
    } catch (e) {
      cb(e);
    }
  }
  set(sid: string, data: session.SessionData, cb?: (err?: unknown) => void) {
    try {
      const expires = data.cookie.expires
        ? new Date(data.cookie.expires).getTime()
        : Date.now() + 3_600_000;
      this.db
        .prepare(
          'INSERT INTO sessions (sid, data, expires) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET data=excluded.data, expires=excluded.expires',
        )
        .run(sid, JSON.stringify(data), expires);
      cb?.();
    } catch (e) {
      cb?.(e);
    }
  }
  destroy(sid: string, cb?: (err?: unknown) => void) {
    try {
      this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      cb?.();
    } catch (e) {
      cb?.(e);
    }
  }
  touch(sid: string, data: session.SessionData, cb?: (err?: unknown) => void) {
    this.set(sid, data, cb);
  }
  close() {
    clearInterval(this.timer);
  }
}
