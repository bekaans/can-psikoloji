import 'dotenv/config';
import express from 'express';
import { resolve } from 'node:path';
import { createApp } from './app';

const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 5184);
const origin = process.env.APP_ORIGIN || `http://127.0.0.1:${port}`;
if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 32 ||
  !process.env.ADMIN_USERNAME ||
  !/^\$2[aby]\$1[2-9]\$/.test(process.env.ADMIN_PASSWORD_HASH || '')
) {
  console.error('Önce npm run admin:setup ile güvenli yönetici kurulumunu tamamlayın.');
  process.exit(1);
}
if (production && !origin.startsWith('https://')) {
  console.error('Üretimde APP_ORIGIN HTTPS olmalıdır.');
  process.exit(1);
}
const { app, close } = createApp({
  dataDir: resolve(process.env.DATA_DIR || 'data'),
  origin,
  secret: process.env.SESSION_SECRET,
  username: process.env.ADMIN_USERNAME,
  passwordHash: process.env.ADMIN_PASSWORD_HASH!,
  production,
  trustProxy: process.env.TRUST_PROXY === '1',
});
if (production) {
  app.use(express.static(resolve('dist'), { index: false, maxAge: '1h' }));
  app.get(['/', '/admin'], (_req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(resolve('dist/index.html'));
  });
  app.use((_req, res) => res.status(404).type('text').send('Sayfa bulunamadı.'));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
const server = app.listen(port, process.env.HOST || '127.0.0.1', () =>
  console.log(`Can Psikoloji: ${origin} · Yönetim: ${origin}/admin`),
);
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    server.close(() => {
      close();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 3000).unref();
  });
