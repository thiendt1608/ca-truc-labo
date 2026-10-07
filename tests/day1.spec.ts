import { expect, test } from '@playwright/test';

/** Luồng ngày 0.1 từ sảnh tới báo cáo, có dùng bảng debug để kết thúc ca nhanh. */
test('ngày 0.1: vào ca, xử lý một mẫu, kết thúc ca và xem báo cáo', async ({ page }) => {
  await page.goto('/?debug=1');
  await expect(page.getByRole('heading', { name: /CA TRỰC LABO/ })).toBeVisible();
  await page.getByRole('button', { name: /Ngày 0\.1/ }).click();
  await page.getByRole('button', { name: 'Vào ca' }).click();

  // Đóng mẹo mở đầu rồi chờ mẫu đầu tiên.
  await page.locator('.tip').click();
  const firstTube = page.locator('.tray-item').first();
  await expect(firstTube).toBeVisible({ timeout: 10_000 });
  await firstTube.click();
  await expect(page.getByText('Phiếu chỉ định')).toBeVisible();
  await page.getByRole('button', { name: '✅ Nhận' }).click();
  await page.getByRole('button', { name: 'Hoá sinh' }).click();

  await page.getByRole('button', { name: 'Bảng debug' }).click();
  await page.getByRole('button', { name: 'Kết thúc ca ngay' }).click();
  await expect(page.getByRole('heading', { name: 'Báo cáo giao ca' })).toBeVisible();
  await expect(page.getByText('Chuyện hôm nay')).toBeVisible();
});

test('ngày 1.1: máy ly tâm mở được và có rổ 12 ô', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ngày 1\.1/ }).click();
  await page.getByRole('button', { name: 'Vào ca' }).click();
  await page.getByRole('button', { name: /Máy ly tâm/ }).click();
  await expect(page.locator('.rotor .slot')).toHaveCount(12);
});
