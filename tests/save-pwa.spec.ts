import { expect, test, type Page } from '@playwright/test';

/** Chơi một ngày bằng bảng debug ('Kết thúc ca ngay') để có dữ liệu lưu, dừng ở màn báo cáo. */
async function finishDay(page: Page, day: RegExp) {
  await page.getByRole('button', { name: day }).click();
  await page.getByRole('button', { name: 'Vào ca' }).click();
  await page
    .locator('.tip')
    .click({ timeout: 3000 })
    .catch(() => {});
  await page.getByRole('button', { name: 'Bảng debug' }).click();
  await page.getByRole('button', { name: 'Kết thúc ca ngay' }).click();
  await expect(page.getByRole('heading', { name: 'Báo cáo giao ca' })).toBeVisible();
}

/** Đọc bản lưu thô trong IndexedDB (idb-keyval: DB 'keyval-store', kho 'keyval', khoá 'save:v1'). */
async function storedSave(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ settings?: { reducedMotion?: boolean } } | undefined>((resolve, reject) => {
        const open = indexedDB.open('keyval-store');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const get = open.result.transaction('keyval').objectStore('keyval').get('save:v1');
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
        };
      }),
  );
}

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Cài đặt/ })).toBeVisible();
}

test('xuất mã → xóa tiến trình → nhập mã khôi phục đúng; mã sai báo lỗi', async ({ page }) => {
  await page.goto('/?debug=1');
  await finishDay(page, /Ngày 0\.1/);
  await page.getByRole('button', { name: /Về sảnh/ }).click();
  await expect(page.getByText(/1\/\d+ ngày/)).toBeVisible();

  await openSettings(page);
  await page.getByRole('button', { name: 'Xuất mã lưu' }).click();
  const box = page.getByLabel('Mã lưu', { exact: true });
  await expect(box).toBeVisible();
  const code = await box.inputValue();
  expect(code).toMatch(/^CTL1\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
  // Ô mã phải chọn/sao chép được (Mobile Web UI Rules mục 6).
  expect(await box.evaluate((el) => getComputedStyle(el).userSelect)).toBe('text');

  // Xóa tiến trình: phải qua bước xác nhận thứ hai.
  await page.getByRole('button', { name: 'Xóa tiến trình' }).click();
  await expect(page.getByText('Xóa hết tiến trình?')).toBeVisible();
  await page.getByRole('button', { name: 'Giữ lại' }).click();
  await page.getByRole('button', { name: 'Xóa tiến trình' }).click();
  await page.getByRole('button', { name: 'Xóa hết' }).click();
  await expect(page.getByText('Đã xóa tiến trình.')).toBeVisible();
  await page.getByRole('button', { name: /Về sảnh/ }).click();
  await expect(page.getByText(/0\/\d+ ngày/)).toBeVisible();

  // Mã sai: báo lỗi tiếng Việt, không ghi gì.
  await openSettings(page);
  const input = page.getByLabel('Mã lưu cần nhập');
  await input.fill('xin chào, không phải mã');
  await page.getByRole('button', { name: 'Nhập', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'không phải mã lưu' })).toBeVisible();
  const i = Math.floor(code.length / 2);
  await input.fill(code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1));
  await page.getByRole('button', { name: 'Nhập', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'mã kiểm tra' })).toBeVisible();

  // Mã đúng (có xuống dòng xen vào): xem trước, xác nhận ghi đè rồi khôi phục.
  await input.fill(`${code.slice(0, 30)}\n ${code.slice(30)}\n`);
  await page.getByRole('button', { name: 'Nhập', exact: true }).click();
  await expect(page.getByText('1 ngày,')).toBeVisible();
  await page.getByRole('button', { name: 'Ghi đè' }).click();
  await expect(page.getByText('Đã khôi phục tiến trình.')).toBeVisible();
  await page.getByRole('button', { name: /Về sảnh/ }).click();
  await expect(page.getByText(/1\/\d+ ngày/)).toBeVisible();

  // Lưu thật vào IndexedDB: tải lại vẫn còn.
  await page.reload();
  await expect(page.getByText(/1\/\d+ ngày/)).toBeVisible();
});

test('giảm chuyển động: công tắc thêm class lên root và được lưu', async ({ page }) => {
  await page.goto('/');
  await openSettings(page);
  const toggle = page.getByRole('switch', { name: 'Giảm chuyển động' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveClass(/reduce-motion/);
  await expect.poll(async () => (await storedSave(page))?.settings?.reducedMotion).toBe(true);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/reduce-motion/);
});

test('độ khó đổi được trong Cài đặt', async ({ page }) => {
  await page.goto('/');
  await openSettings(page);
  await page.getByRole('radio', { name: 'Khó' }).click();
  await expect(page.getByRole('radio', { name: 'Khó' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: 'Thường' })).toHaveAttribute('aria-checked', 'false');
});

test('nhắc lưu bền: hiện đúng một lần sau ca ngày 0.3', async ({ page }) => {
  await page.goto('/?debug=1');
  await finishDay(page, /Ngày 0\.3/);
  const card = page.getByRole('region', { name: 'Giữ tiến trình an toàn' });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Xuất mã lưu' }).click();
  await expect(page.getByRole('heading', { name: /Cài đặt/ })).toBeVisible();
  await page.getByRole('button', { name: /Về sảnh/ }).click();

  // Chơi lại ngày 0.3: không nhắc nữa.
  await finishDay(page, /Ngày 0\.3/);
  await expect(page.getByRole('region', { name: 'Giữ tiến trình an toàn' })).toHaveCount(0);
});

test('Cài đặt mở được từ Menu tạm dừng, chỉ có phần an toàn giữa ca', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ngày 0\.1/ }).click();
  await page.getByRole('button', { name: 'Vào ca' }).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: /Cài đặt/ }).click();
  await expect(page.getByRole('heading', { name: /Cài đặt/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Độ khó' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Nhập mã lưu' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Xóa tiến trình' })).toHaveCount(0);
  await page.getByRole('button', { name: /Về ca trực/ }).click();
  await expect(page.getByRole('heading', { name: /Tạm dừng/ })).toBeVisible();
});

test('PWA: manifest hợp lệ, service worker đăng ký, chạy offline sau lần tải đầu', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /CA TRỰC LABO/ })).toBeVisible();

  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await page.request.get(new URL(href!, page.url()).toString());
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest).toMatchObject({
    name: 'Ca Trực Labo',
    short_name: expect.any(String),
    display: 'standalone',
    orientation: 'portrait',
    start_url: './',
    scope: './',
  });
  expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  const sizes = manifest.icons.map((x: { sizes: string; purpose: string }) => `${x.sizes}:${x.purpose}`);
  expect(sizes).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']));
  for (const icon of manifest.icons as { src: string }[]) {
    const r = await page.request.get(new URL(icon.src, new URL(href!, page.url())).toString());
    expect(r.ok(), icon.src).toBe(true);
    expect(r.headers()['content-type']).toContain('image/png');
  }
  await expect(page.locator('meta[name=theme-color]')).toHaveAttribute('content', /#/);
  await expect(page.locator('link[rel=apple-touch-icon]')).toHaveCount(1);
  await expect(page.locator('meta[name=apple-mobile-web-app-capable]')).toHaveAttribute('content', 'yes');

  // Service worker kích hoạt (cache xong asset trước khi active) và kiểm soát trang.
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toContain('localhost:4173');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);

  // Offline: tải lại vẫn vào được Sảnh, font và chữ không vỡ.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /CA TRỰC LABO/ })).toBeVisible();
  await page.getByRole('button', { name: /Ngày 0\.1/ }).click();
  await expect(page.getByRole('button', { name: 'Vào ca' })).toBeVisible();
  await context.setOffline(false);
});
