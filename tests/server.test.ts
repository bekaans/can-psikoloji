import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { createApp } from '../server/app';
import type { ContentEnvelope } from '../shared/content';

test('İçerik yönetimi, güvenlik sınırları ve kalıcı kayıt', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'can-psikoloji-test-'));
  const password = randomBytes(22).toString('base64url');
  const config = {
    dataDir: dir,
    origin: 'http://127.0.0.1',
    secret: randomBytes(48).toString('hex'),
    username: 'tester',
    passwordHash: await bcrypt.hash(password, 12),
    production: false,
    trustProxy: false,
  };
  const { app, close } = createApp(config);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.once('listening', r));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  let cookie = '';
  let token = '';
  let original: ContentEnvelope;
  let imagePath = '';
  async function call(
    path: string,
    method = 'GET',
    body?: unknown,
    headers: Record<string, string> = {},
  ) {
    const response = await fetch(base + path, {
      method,
      headers: {
        Origin: config.origin,
        Cookie: cookie,
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        'X-CSRF-Token': token,
        ...headers,
      },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    const sets = response.headers.getSetCookie();
    if (sets.length) cookie = sets.map((c) => c.split(';')[0]).join('; ');
    return response;
  }
  try {
    await t.test('Herkese açık içerik, güvenlik başlıkları ve yetkisiz erişim', async () => {
      const r = await call('/api/content');
      assert.equal(r.status, 200);
      original = (await r.json()) as ContentEnvelope;
      assert.equal(original.content.contact.phone, '905541406244');
      const legacy = await fetch(base + '/index.php/bize-ulasin/', { redirect: 'manual' });
      assert.equal(legacy.status, 301);
      assert.equal(legacy.headers.get('location'), '/#iletisim');
      assert.equal(r.headers.get('x-frame-options'), 'DENY');
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
      assert.match(r.headers.get('content-security-policy') || '', /frame-ancestors 'none'/);
      assert.equal(r.headers.get('x-powered-by'), null);
      for (const [path, method] of [
        ['/api/admin/content', 'PUT'],
        ['/api/admin/media', 'POST'],
        ['/api/admin/revisions', 'GET'],
      ])
        assert.equal((await call(path, method, method === 'GET' ? undefined : {})).status, 401);
    });
    await t.test('Origin ve CSRF kontrolü; oturum yenileme', async () => {
      const start = await call('/api/session');
      const s = (await start.json()) as { csrf: string };
      token = s.csrf;
      const oldCookie = cookie;
      assert.equal(
        (
          await call(
            '/api/login',
            'POST',
            { username: 'tester', password },
            { Origin: 'https://evil.example' },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await call(
            '/api/login',
            'POST',
            { username: 'tester', password },
            { 'X-CSRF-Token': 'wrong' },
          )
        ).status,
        403,
      );
      assert.equal(
        (await call('/api/login', 'POST', { username: 'tester', password: 'invalid-password' }))
          .status,
        401,
      );
      const login = await call('/api/login', 'POST', { username: 'tester', password });
      assert.equal(login.status, 200);
      const data = (await login.json()) as { csrf: string };
      assert.notEqual(data.csrf, token);
      token = data.csrf;
      assert.notEqual(cookie, oldCookie);
      assert.match(login.headers.get('set-cookie') || '', /HttpOnly/);
      assert.match(login.headers.get('set-cookie') || '', /SameSite=Strict/);
    });
    await t.test('Sunucuda alan doğrulaması, XSS ve dosya yolu koruması', async () => {
      for (const mutate of [
        (c: ContentEnvelope['content']) => (c.hero.title = '<script>alert(1)</script>'),
        (c: ContentEnvelope['content']) => (c.contact.mapUrl = 'javascript:alert(1)'),
        (c: ContentEnvelope['content']) => (c.contact.mapUrl = 'https://evil.example/maps'),
        (c: ContentEnvelope['content']) => (c.hero.image = '/media/../../.env'),
        (c: ContentEnvelope['content']) => (c.contact.phone = '123'),
        (c: ContentEnvelope['content']) => c.services.push(c.services[0]),
      ]) {
        const content = structuredClone(original.content);
        mutate(content);
        assert.equal(
          (await call('/api/admin/content', 'PUT', { content, version: original.version })).status,
          400,
        );
      }
      const content = structuredClone(original.content);
      content.hero.image = '/media/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp';
      assert.equal(
        (await call('/api/admin/content', 'PUT', { content, version: original.version })).status,
        400,
      );
      assert.equal(
        (
          await call(
            '/api/admin/content',
            'PUT',
            { content: original.content, version: original.version },
            { 'X-CSRF-Token': 'invalid' },
          )
        ).status,
        403,
      );
    });
    await t.test('Fotoğraf MIME, gerçek içerik ve boyut denetimi', async () => {
      const fake = new FormData();
      fake.append(
        'image',
        new Blob(['<svg onload="alert(1)"></svg>'], { type: 'image/png' }),
        'image.png',
      );
      assert.equal((await call('/api/admin/media', 'POST', fake)).status, 400);
      const mismatch = new FormData();
      mismatch.append(
        'image',
        new Blob(
          [
            await sharp({ create: { width: 20, height: 20, channels: 3, background: '#ffffff' } })
              .png()
              .toBuffer(),
          ],
          { type: 'image/jpeg' },
        ),
        'photo.jpg',
      );
      assert.equal((await call('/api/admin/media', 'POST', mismatch)).status, 400);
      const oversized = new FormData();
      oversized.append(
        'image',
        new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' }),
        'big.png',
      );
      assert.equal((await call('/api/admin/media', 'POST', oversized)).status, 400);
      const image = await sharp({
        create: { width: 100, height: 100, channels: 3, background: '#668866' },
      })
        .png()
        .toBuffer();
      const form = new FormData();
      form.append('image', new Blob([image], { type: 'image/png' }), 'photo.png');
      const uploaded = await call('/api/admin/media', 'POST', form);
      assert.equal(uploaded.status, 201);
      imagePath = ((await uploaded.json()) as { url: string }).url;
      assert.match(imagePath, /^\/media\/[a-f0-9-]+\.webp$/);
      const fetched = await fetch(base + imagePath);
      assert.equal(fetched.status, 200);
      assert.match(fetched.headers.get('content-type') || '', /image\/webp/);
    });
    await t.test('Yayın, çakışma koruması, sürüm geçmişi ve kalıcılık', async () => {
      const content = structuredClone(original.content);
      content.hero.title = 'Test başlığı';
      content.hero.image = imagePath;
      const save = await call('/api/admin/content', 'PUT', { content, version: original.version });
      assert.equal(save.status, 200);
      const data = (await save.json()) as ContentEnvelope;
      assert.equal(data.version, original.version + 1);
      assert.equal(data.content.hero.title, 'Test başlığı');
      assert.equal(
        (await call('/api/admin/content', 'PUT', { content, version: original.version })).status,
        409,
      );
      const list = (await (await call('/api/admin/revisions')).json()) as { id: number }[];
      assert.equal(list.length, 1);
      const revision = (await (await call(`/api/admin/revisions/${list[0].id}`)).json()) as {
        content: ContentEnvelope['content'];
      };
      assert.equal(revision.content.hero.title, original.content.hero.title);
      assert.equal((await call('/api/admin/revisions/invalid')).status, 400);
      const parallel = createApp(config);
      const second = parallel.app.listen(0, '127.0.0.1');
      await new Promise<void>((r) => second.once('listening', r));
      try {
        const port = (second.address() as { port: number }).port;
        const result = (await (
          await fetch(`http://127.0.0.1:${port}/api/content`)
        ).json()) as ContentEnvelope;
        assert.equal(result.content.hero.title, 'Test başlığı');
      } finally {
        await new Promise<void>((r) => second.close(() => r()));
        parallel.close();
      }
    });
    await t.test('Çıkış oturumu iptal eder; giriş denemeleri sınırlandırılır', async () => {
      const savedCookie = cookie;
      assert.equal((await call('/api/logout', 'POST', {})).status, 200);
      cookie = savedCookie;
      assert.equal((await call('/api/admin/revisions')).status, 401);
      token = ((await (await call('/api/session')).json()) as { csrf: string }).csrf;
      let last: Response | undefined;
      for (let i = 0; i < 6; i++)
        last = await call('/api/login', 'POST', { username: 'tester', password: 'wrong-password' });
      assert.equal(last!.status, 429);
      assert.ok(Number(last!.headers.get('retry-after')) > 0);
    });
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    close();
    rmSync(dir, { recursive: true, force: true });
  }
});
