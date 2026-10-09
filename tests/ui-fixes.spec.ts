import { expect, test, type Page } from '@playwright/test';

async function enterDay(page: Page, day: RegExp) {
  await page.getByRole('button', { name: day }).click();
  await page.getByRole('button', { name: 'Vào ca' }).click();
  await page
    .locator('.tip')
    .click({ timeout: 3000 })
    .catch(() => {});
}

test('Escape đóng sheet Sổ tay và thẻ chồng trên cùng trước, không thoát mini-game', async ({ page }) => {
  await page.goto('/?debug=1');
  await enterDay(page, /Ngày 1\.1/);

  await page.getByRole('button', { name: /Sổ tay/ }).click();
  await expect(page.getByRole('heading', { name: /📖 Sổ tay/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: /📖 Sổ tay/ })).toHaveCount(0);

  // Sheet + thẻ "?" chồng lên: Escape đóng thẻ trước, sheet sau.
  await page.getByRole('button', { name: /Máy ly tâm/ }).click();
  await page.getByRole('button', { name: 'Mở thẻ Sổ tay liên quan' }).click();
  await expect(page.locator('.overlay.top')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.overlay.top')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Máy ly tâm/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: /Máy ly tâm/ })).toHaveCount(0);

  // Mini-game: Escape không thoát.
  await page.getByRole('button', { name: 'Bảng debug' }).click();
  await page.getByRole('button', { name: 'Gây đổ vỡ' }).click();
  await expect(page.locator('.mg .steps')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.mg .steps')).toBeVisible();
});

test('mã lưu đang hiện tự cập nhật khi đổi độ khó', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByRole('button', { name: 'Xuất mã lưu' }).click();
  const box = page.getByLabel('Mã lưu', { exact: true });
  const before = await box.inputValue();
  await page.getByRole('radio', { name: 'Khó' }).click();
  await expect(box).not.toHaveValue(before);
  await page.getByRole('radio', { name: 'Thường' }).click();
  await expect(box).toHaveValue(before);
});

test('nút cuối báo cáo cùng chiều cao; nút Sổ tay ở Sảnh một dòng, không nhỏ hơn 44px', async ({ page }) => {
  await page.goto('/?debug=1');
  await enterDay(page, /Ngày 0\.1/);
  await page.getByRole('button', { name: 'Bảng debug' }).click();
  await page.getByRole('button', { name: 'Kết thúc ca ngay' }).click();
  await expect(page.getByRole('heading', { name: 'Báo cáo giao ca' })).toBeVisible();
  const heights = await page
    .locator('.report-actions button')
    .evaluateAll((bs) => bs.map((b) => Math.round(b.getBoundingClientRect().height)));
  expect(heights).toHaveLength(2);
  expect(heights[0]).toBe(heights[1]);
  expect(heights[0]).toBeLessThan(52);

  await page.getByRole('button', { name: /Về sảnh/ }).click();
  const codex = page.locator('.codex-btn');
  const box = (await codex.boundingBox())!;
  const primary = (await page.locator('.bottombar button.primary').boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(Math.abs(box.height - primary.height)).toBeLessThanOrEqual(1);
});
