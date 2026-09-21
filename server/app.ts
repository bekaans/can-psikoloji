import express, { type RequestHandler, type ErrorRequestHandler } from 'express';
import session from 'express-session';
import { Passport } from 'passport';
import { Strategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDatabase, SqliteSessionStore } from './database';
import { contentSchema } from '../shared/content';

declare global {
  namespace Express {
    interface User {
      username: string;
      role: 'admin';
    }
  }
}
declare module 'express-session' {
  interface SessionData {
    csrf?: string;
    authenticatedAt?: number;
  }
}
export type Config = {
  dataDir: string;
  origin: string;
  secret: string;
  username: string;
  passwordHash: string;
  production: boolean;
  trustProxy: boolean;
};

export function createApp(config: Config) {
  const app = express();
  const db = openDatabase(config.dataDir);
  const mediaDir = resolve(config.dataDir, 'media');
  mkdirSync(mediaDir, { recursive: true, mode: 0o700 });
  const store = new SqliteSessionStore(db);
  const passport = new Passport();
  const origin = new URL(config.origin).origin;
  app.disable('x-powered-by');
  const legacyPages: Record<string, string> = {
    hakkimizda: 'yaklasim',
    hizmetlerimiz: 'alanlar',
    'bireysel-terapiler': 'alanlar',
    'cocuk-ve-ergen-terapileri': 'alanlar',
    'cift-ve-aile-terapileri': 'alanlar',
    'psikolojik-test-ve-degerlendirme': 'alanlar',
    'uzmanlarimiz-2': 'uzmanlar',
    'psikolojik-danisman-psikoterapist-nurcan-ilkan': 'uzmanlar',
    'psikolog-basak-canturk': 'uzmanlar',
    galeri: 'merkez',
    'bize-ulasin': 'iletisim',
  };
  for (const [slug, section] of Object.entries(legacyPages)) {
    app.get([`/index.php/${slug}`, `/${slug}`], (_req, res) => res.redirect(301, `/#${section}`));
  }
  app.use('/admin', (_req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
  if (config.trustProxy) app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", ...(config.production ? [] : ["'unsafe-inline'"])],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'blob:', 'data:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'", ...(config.production ? [] : ['ws://127.0.0.1:*'])],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: config.production ? [] : null,
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' },
      strictTransportSecurity: config.production ? { maxAge: 31536000 } : false,
    }),
  );
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Çok sık istek gönderildi. Bir dakika sonra tekrar deneyin.' },
    }),
  );
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== origin) {
      res.status(403).json({ error: 'İstek kaynağı doğrulanamadı.' });
      return;
    }
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.use(
    '/api',
    session({
      name: 'can.sid',
      secret: config.secret,
      store,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: config.production, sameSite: 'strict', maxAge: 3_600_000 },
    }),
  );
  app.use('/api', passport.initialize(), passport.session());
  passport.serializeUser((user, done) => done(null, user.username));
  passport.deserializeUser((username: string, done) =>
    done(null, username === config.username ? { username, role: 'admin' } : false),
  );
  passport.use(
    new Strategy(async (username, password, done) => {
      try {
        const matches = await bcrypt.compare(password, config.passwordHash);
        const attempts = db
          .prepare('SELECT attempts, locked_until FROM login_attempts WHERE username = ?')
          .get(config.username) as { attempts: number; locked_until: number } | undefined;
        if (attempts && attempts.locked_until > Date.now()) return done(null, false);
        if (username !== config.username || !matches) {
          const count =
            (attempts && attempts.locked_until > Date.now() - 900_000 ? attempts.attempts : 0) + 1;
          db.prepare(
            'INSERT INTO login_attempts (username, attempts, locked_until) VALUES (?, ?, ?) ON CONFLICT(username) DO UPDATE SET attempts=excluded.attempts, locked_until=excluded.locked_until',
          ).run(config.username, count, count >= 5 ? Date.now() + 900_000 : Date.now());
          return done(null, false);
        }
        db.prepare('DELETE FROM login_attempts WHERE username = ?').run(config.username);
        done(null, { username, role: 'admin' });
      } catch (e) {
        done(e);
      }
    }),
  );
  const auth: RequestHandler = (req, res, next) => {
    if (
      !req.isAuthenticated() ||
      req.user?.role !== 'admin' ||
      !req.session.authenticatedAt ||
      Date.now() - req.session.authenticatedAt > 3_600_000
    ) {
      res.status(401).json({ error: 'Devam etmek için giriş yapın.' });
      return;
    }
    next();
  };
  const csrf: RequestHandler = (req, res, next) => {
    const a = Buffer.from(req.get('x-csrf-token') || '');
    const b = Buffer.from(req.session.csrf || '');
    if (!a.length || a.length !== b.length || !timingSafeEqual(a, b)) {
      res.status(403).json({ error: 'Oturum doğrulanamadı. Sayfayı yenileyin.' });
      return;
    }
    next();
  };
  const readContent = () => {
    const row = db.prepare('SELECT body, version, updated_at FROM content WHERE id=1').get() as {
      body: string;
      version: number;
      updated_at: string;
    };
    return { content: JSON.parse(row.body), version: row.version, updatedAt: row.updated_at };
  };
  app.get('/api/content', (_req, res) => res.json(readContent()));
  app.get('/api/session', (req, res) => {
    req.session.csrf ||= randomBytes(32).toString('hex');
    res.json({
      user:
        req.isAuthenticated() &&
        req.session.authenticatedAt &&
        Date.now() - req.session.authenticatedAt <= 3_600_000
          ? req.user
          : null,
      csrf: req.session.csrf,
    });
  });
  app.post(
    '/api/login',
    rateLimit({
      windowMs: 900_000,
      limit: 5,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      message: { error: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.' },
    }),
    csrf,
    (req, res, next) => {
      const parsed = z
        .object({ username: z.string().min(1).max(100), password: z.string().min(1).max(200) })
        .strict()
        .safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Kullanıcı adı ve parola gerekli.' });
        return;
      }
      passport.authenticate('local', (err: unknown, user: Express.User | false) => {
        if (err) return next(err);
        if (!user) {
          res.status(401).json({
            error: 'Giriş yapılamadı. Bilgilerinizi kontrol edin veya daha sonra tekrar deneyin.',
          });
          return;
        }
        req.logIn(user, (error) => {
          if (error) return next(error);
          req.session.csrf = randomBytes(32).toString('hex');
          req.session.authenticatedAt = Date.now();
          req.session.save((e) => {
            if (e) return next(e);
            res.json({ user, csrf: req.session.csrf });
          });
        });
      })(req, res, next);
    },
  );
  app.post('/api/logout', auth, csrf, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((error) => {
        if (error) return next(error);
        res.clearCookie('can.sid', {
          httpOnly: true,
          secure: config.production,
          sameSite: 'strict',
        });
        res.json({ ok: true });
      });
    });
  });
  app.put('/api/admin/content', auth, csrf, (req, res) => {
    const parsed = z
      .object({ content: contentSchema, version: z.number().int().positive() })
      .strict()
      .safeParse(req.body);
    if (!parsed.success) {
      console.warn(
        JSON.stringify({ event: 'validation_failed', route: 'content', actor: req.user?.username }),
      );
      res.status(400).json({
        error: 'İçerik doğrulanamadı. Alanları kontrol edin.',
        fields: parsed.error.issues.map((i) => i.path.join('.')).slice(0, 10),
      });
      return;
    }
    const content = parsed.data.content;
    const images = [
      content.hero.image,
      ...content.gallery.map((i) => i.image),
      ...content.team.map((i) => i.image),
    ];
    if (
      images.some(
        (i) =>
          !existsSync(
            i.startsWith('/media/') ? resolve(mediaDir, i.slice(7)) : resolve('public', i.slice(1)),
          ),
      )
    ) {
      res.status(400).json({ error: 'Seçilen fotoğraf bulunamadı.' });
      return;
    }
    const current = readContent();
    if (current.version !== parsed.data.version) {
      res.status(409).json({
        error: 'İçerik başka bir oturumda değişti. Sayfayı yenileyerek güncel içeriği alın.',
      });
      return;
    }
    const now = new Date().toISOString();
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('INSERT INTO revisions (body, created_at, actor) VALUES (?, ?, ?)').run(
        JSON.stringify(current.content),
        now,
        req.user!.username,
      );
      db.prepare('UPDATE content SET body=?, version=version+1, updated_at=? WHERE id=1').run(
        JSON.stringify(content),
        now,
      );
      db.prepare(
        'DELETE FROM revisions WHERE id NOT IN (SELECT id FROM revisions ORDER BY id DESC LIMIT 30)',
      ).run();
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    res.json(readContent());
  });
  app.get('/api/admin/revisions', auth, (_req, res) =>
    res.json(
      db
        .prepare(
          'SELECT id, created_at AS createdAt, actor FROM revisions ORDER BY id DESC LIMIT 30',
        )
        .all(),
    ),
  );
  app.get('/api/admin/revisions/:id', auth, (req, res) => {
    const id = z.coerce.number().int().positive().safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: 'Geçersiz sürüm.' });
      return;
    }
    const row = db.prepare('SELECT body FROM revisions WHERE id=?').get(id.data) as
      { body: string } | undefined;
    if (!row) {
      res.status(404).json({ error: 'Sürüm bulunamadı.' });
      return;
    }
    res.json({ content: JSON.parse(row.body) });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
    fileFilter: (_req, file, cb) => {
      const ext = /\.(jpe?g|png|webp)$/i.test(file.originalname);
      cb(null, ext && ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
    },
  });
  app.post(
    '/api/admin/media',
    auth,
    csrf,
    rateLimit({
      windowMs: 60_000,
      limit: 5,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: 'Bir dakikada en fazla 5 fotoğraf yükleyebilirsiniz.' },
    }),
    upload.single('image'),
    async (req, res) => {
      if (!req.file) {
        res.status(400).json({ error: 'En fazla 5 MB boyutunda JPEG, PNG veya WebP seçin.' });
        return;
      }
      const processor = sharp(req.file.buffer, { limitInputPixels: 25_000_000, animated: false });
      let metadata;
      try {
        metadata = await processor.metadata();
      } catch {
        res.status(400).json({ error: 'Fotoğraf okunamadı.' });
        return;
      }
      const formats: Record<string, string> = {
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };
      if (
        !metadata.format ||
        formats[metadata.format] !== req.file.mimetype ||
        (metadata.pages || 1) > 1
      ) {
        res.status(400).json({ error: 'Dosya içeriği desteklenen fotoğraf biçimiyle eşleşmiyor.' });
        return;
      }
      const name = randomUUID() + '.webp';
      await processor
        .rotate()
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(resolve(mediaDir, name));
      res.status(201).json({ url: '/media/' + name });
    },
  );
  app.use('/api', (_req, res) => res.status(404).json({ error: 'İşlem bulunamadı.' }));
  app.use(
    '/media',
    rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false }),
    express.static(mediaDir, { maxAge: '1y', immutable: true, index: false, dotfiles: 'deny' }),
  );
  app.use('/media', (_req, res) => res.status(404).end());
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
      res
        .status(400)
        .json({ error: 'Fotoğraf yüklenemedi. En fazla 5 MB boyutunda tek bir dosya seçin.' });
      return;
    }
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ error: 'İstek boyutu çok büyük.' });
      return;
    }
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'İstek okunamadı.' });
      return;
    }
    console.error(
      JSON.stringify({
        event: 'server_error',
        type: err?.name || 'Error',
        time: new Date().toISOString(),
      }),
    );
    res.status(500).json({ error: 'İşlem tamamlanamadı. Lütfen tekrar deneyin.' });
  };
  app.use(errorHandler);
  return {
    app,
    close: () => {
      store.close();
      db.close();
    },
  };
}
