import { DatabaseSync } from 'node:sqlite';
import session from 'express-session';
import { mkdirSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { defaultContent } from '../shared/content';

export function openDatabase(dir: string) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const path = resolve(dir, 'can-psikoloji.sqlite');
  const db = new DatabaseSync(path);
  chmodSync(path, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS revisions (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL, created_at TEXT NOT NULL, actor TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (username TEXT PRIMARY KEY, attempts INTEGER NOT NULL, locked_until INTEGER NOT NULL);
  `);
  db.prepare(
    'INSERT OR IGNORE INTO content (id, body, version, updated_at) VALUES (1, ?, 1, ?)',
  ).run(JSON.stringify(defaultContent), new Date().toISOString());
  return db;
}

export class SqliteSessionStore extends session.Store {
  timer: ReturnType<typeof setInterval>;
  constructor(private db: DatabaseSync) {
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
