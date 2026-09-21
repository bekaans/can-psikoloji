import express from 'express';
import { createServer } from 'node:https';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { createApp } from '../server/app';

if (!process.env.TEST_ADMIN_PASSWORD) throw Error('Test parolası gerekli.');
const dir = mkdtempSync(join(tmpdir(), 'can-browser-'));
execFileSync(
  'openssl',
  [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-keyout',
    join(dir, 'key.pem'),
    '-out',
    join(dir, 'cert.pem'),
    '-days',
    '1',
    '-subj',
    '/CN=localhost',
  ],
  { stdio: 'ignore' },
);
const { app, close } = createApp({
  dataDir: dir,
  origin: 'https://127.0.0.1:5190',
  secret: randomBytes(48).toString('hex'),
  username: 'tester',
  passwordHash: await bcrypt.hash(process.env.TEST_ADMIN_PASSWORD, 12),
  production: true,
  trustProxy: false,
});
app.use(express.static(resolve('dist'), { index: false }));
app.get(['/', '/admin'], (_req, res) => res.sendFile(resolve('dist/index.html')));
const server = createServer(
  { key: readFileSync(join(dir, 'key.pem')), cert: readFileSync(join(dir, 'cert.pem')) },
  app,
).listen(5190, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      close();
      rmSync(dir, { recursive: true, force: true });
      process.exit();
    }),
  );
