import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
test.beforeAll(() => mkdirSync('artifacts', { recursive: true }));

test('Erişilebilirlik: ana sayfa, menü, ayrıntılar ve yönetim', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const check = async () => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  };
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await check();
  await page.locator('.service-card').first().click();
  await check();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Menüyü aç', exact: true }).click();
  await check();
  await page.keyboard.press('Escape');
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: 'Giriş yap', exact: true })).toBeVisible();
  await check();
  await page.getByLabel('Kullanıcı adı', { exact: true }).fill('tester');
  await page.getByLabel('Parola', { exact: true }).fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(page.locator('.admin-app')).toBeVisible();
  await check();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Ana sayfa', exact: true }).click();
  await check();
});

test('Masaüstü: gezinme, hizmetler, uzmanlar, galeri, sorular ve WhatsApp', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Gebze’de psikolojikdanışmanlık merkezi.');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'artifacts/desktop-home.png' });
  for (const id of ['yaklasim', 'alanlar', 'merkez', 'uzmanlar', 'sorular', 'iletisim']) {
    await page.locator('#' + id).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `artifacts/desktop-${id}.png` });
  }
  await page.locator('#alanlar').scrollIntoViewIfNeeded();
  await page.locator('.service-card').first().click();
  await expect(page.locator('.detail-modal')).toBeVisible();
  await expect(page.locator('.detail-modal a')).toHaveAttribute(
    'href',
    /wa\.me\/905541406244\?text=.*Bireysel/,
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('.detail-modal')).not.toBeVisible();
  await page.locator('.team-card').first().click();
  await expect(page.locator('.detail-modal h2')).toHaveText('Nurcan İlkan Ayday');
  await page.getByRole('button', { name: 'Pencereyi kapat' }).click();
  await page.getByRole('button', { name: 'Sonraki fotoğraf', exact: true }).click();
  await expect(page.locator('.gallery-main img')).toHaveAttribute(
    'src',
    '/images/gorusme-odasi.webp',
  );
  await page.locator('.gallery-main').click();
  await expect(page.locator('.photo-detail img')).toHaveAttribute(
    'src',
    '/images/gorusme-odasi.webp',
  );
  await page.getByRole('button', { name: 'Sonraki büyük fotoğraf' }).click();
  await expect(page.locator('.photo-detail img')).toHaveAttribute(
    'src',
    '/images/merkez-karsilama.webp',
  );
  await page.keyboard.press('Escape');
  const question = page.getByRole('button', { name: 'Nasıl randevu alabilirim?', exact: false });
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#faq-randevu')).toBeVisible();
  await page.locator('#topic').selectOption({ label: 'Çift & aile' });
  await page.evaluate(() => {
    window.open = ((url?: string | URL) => {
      (window as unknown as { opened: string }).opened = String(url);
      return null;
    }) as typeof window.open;
  });
  await page.getByRole('button', { name: 'WhatsApp’ta görüşelim' }).click();
  const opened = await page.evaluate(() => (window as unknown as { opened: string }).opened);
  expect(decodeURIComponent(opened)).toContain('Çift & aile');
  expect(opened).toContain('https://wa.me/905541406244');
  const links = await page
    .locator('a[href*="wa.me"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(links.every((l) => l?.startsWith('https://wa.me/905541406244?text='))).toBe(true);
  await expect(page.locator('.contact-info a[href*="google.com"]')).toHaveAttribute(
    'href',
    'https://www.google.com/maps?cid=5928577831289690245',
  );
  await page.getByRole('button', { name: 'Gizlilik', exact: true }).click();
  await expect(page.locator('.detail-modal')).toContainText('Gizlilik hakkında');
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('Mobil: dar ekranlar, menü, odak ve hareket tercihi', async ({ page }) => {
  for (const width of [320, 390, 430, 768, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForTimeout(1300);
    const overflow = await page.evaluate(() => ({
      body: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
    await page.getByRole('button', { name: 'Menüyü aç', exact: true }).click();
    await expect(page.locator('.mobile-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Menüyü aç', exact: true })).toBeFocused();
    if (width === 390) {
      await page.screenshot({ path: 'artifacts/mobile-home.png' });
      await page.getByRole('button', { name: 'Menüyü aç', exact: true }).click();
      await page.locator('.mobile-menu a[href="#alanlar"]').click();
      await expect(page.locator('.mobile-menu')).not.toBeVisible();
      await page.waitForTimeout(900);
      await page.screenshot({ path: 'artifacts/mobile-services.png' });
    }
    for (const id of ['alanlar', 'merkez', 'uzmanlar', 'iletisim']) {
      await page.locator('#' + id).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-calm', 'true');
  await expect(page.locator('.story-word').first()).toHaveCSS('color', 'rgb(42, 38, 35)');
  await page.locator('#iletisim').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/mobile-contact.png' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Sakin görünüm', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-calm', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-calm', 'true');
});

test('Yönetim: güvenli giriş, kalıcı yayın, sürüm geri yükleme, fotoğraf yükleme ve çıkış', async ({
  page,
}) => {
  await page.goto('/admin');
  await page.screenshot({ path: 'artifacts/admin-login.png' });
  await page.getByLabel('Kullanıcı adı', { exact: true }).fill('tester');
  await page.getByLabel('Parola', { exact: true }).fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(page.locator('.admin-app')).toBeVisible();
  const cookie = (await page.context().cookies()).find((c) => c.name === 'can.sid');
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.secure).toBe(true);
  expect(cookie?.sameSite).toBe('Strict');
  await page.screenshot({ path: 'artifacts/admin-dashboard.png' });
  await page.getByRole('button', { name: 'Ana sayfa', exact: true }).click();
  await page.getByLabel('Ana başlık', { exact: true }).fill('Size ayrılan bir alan');
  await page.getByRole('button', { name: 'Değişiklikleri yayınla', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Değişiklikler yayınlandı');
  await page.reload();
  await page.getByRole('button', { name: 'Ana sayfa', exact: true }).click();
  await expect(page.getByLabel('Ana başlık', { exact: true })).toHaveValue('Size ayrılan bir alan');
  const publicPage = await page.context().newPage();
  await publicPage.goto('/');
  await expect(publicPage.locator('h1')).toContainText('Size ayrılan bir alan');
  await publicPage.close();
  await page.getByRole('button', { name: 'İçerik geçmişi', exact: true }).click();
  await page.getByRole('button', { name: 'Geri yükle', exact: true }).first().click();
  await expect(page.getByLabel('Ana başlık', { exact: true })).toHaveValue('Gebze’de psikolojik');
  await page.getByRole('button', { name: 'Değişiklikleri yayınla', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Değişiklikler yayınlandı');
  await page.getByRole('button', { name: 'Fotoğraf galerisi', exact: true }).click();
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles('public/images/merkez-karsilama.webp');
  await expect(page.locator('.admin-image-field>img').first()).toHaveAttribute('src', /^\/media\//);
  await page.getByLabel('Fotoğraf açıklaması').first().fill('Test fotoğrafı');
  await page.getByRole('button', { name: 'Değişiklikleri yayınla', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Değişiklikler yayınlandı');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Yönetim menüsünü aç', exact: true }).click();
  await page.getByRole('button', { name: 'Genel bakış', exact: true }).click();
  await page.screenshot({ path: 'artifacts/admin-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Yönetim menüsünü aç', exact: true }).click();
  await page.getByRole('button', { name: 'Çıkış yap', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Giriş yap', exact: true })).toBeVisible();
  const res = await page.request.get('/api/admin/revisions');
  expect(res.status()).toBe(401);
});
