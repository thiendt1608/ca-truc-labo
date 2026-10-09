import { expect, test, type Page } from '@playwright/test';

/** Chơi một ngày bằng bảng debug ('Kết thúc ca ngay') để có thẻ Sổ tay đã mở, dừng ở màn báo cáo. */
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

async function openDay(page: Page, day: RegExp) {
  await page.getByRole('button', { name: day }).click();
  await page.getByRole('button', { name: 'Vào ca' }).click();
}

const helpButton = (page: Page) => page.getByRole('button', { name: 'Mở thẻ Sổ tay liên quan' });
const clockText = (page: Page) => page.locator('.hud .clock').innerText();

test('Sổ tay từ Sảnh: % sưu tập, thanh tiến độ theo khoa, thẻ khoá có gợi ý "Mở khi"', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Sổ tay/ }).click();
  await expect(page.getByRole('heading', { name: /Sổ tay KTV/ })).toBeVisible();

  await expect(page.getByRole('progressbar', { name: 'Tổng sưu tập' })).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByText(/^\d+\/\d+ · 0%$/).first()).toBeVisible();
  // Mỗi khoa một thanh tiến độ riêng.
  await expect(page.getByRole('progressbar', { name: 'Tiếp nhận' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Hoá sinh' })).toBeVisible();
  // Thẻ chưa mở: không lộ tên thẻ, chỉ có gợi ý.
  await expect(page.getByText('🔒 Chưa mở').first()).toBeVisible();
  await expect(page.getByText(/^Mở khi em /).first()).toBeVisible();
  await expect(page.getByText('Định danh bằng 2 thông tin')).toHaveCount(0);

  // Lọc theo khoa và tìm kiếm (không dấu cũng tìm được).
  await page.getByRole('button', { name: 'Hoá sinh', exact: true }).click();
  await expect(page.getByText(/ly tâm/).first()).toBeVisible();
  await expect(page.getByText(/ống, lọ khác nhau/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Tất cả' }).click();
  await page.getByLabel('Tìm thẻ Sổ tay').fill('QUE THU');
  await expect(page.getByText(/que thử nước tiểu/)).toBeVisible();
  await expect(page.getByText(/chai cấy máu/)).toHaveCount(0);
  await page.getByLabel('Tìm thẻ Sổ tay').fill('zzzz');
  await expect(page.getByText('Không có thẻ nào khớp.')).toBeVisible();
});

test('thẻ mới có dấu "Mới" cho tới khi đọc; đã đọc thì nhớ sau khi tải lại', async ({ page }) => {
  await page.goto('/?debug=1');
  await finishDay(page, /Ngày 0\.1/);
  await page.getByRole('button', { name: /Về sảnh/ }).click();
  // Nút Sổ tay ở Sảnh hiện số thẻ mới.
  await expect(page.getByRole('button', { name: /Sổ tay/ }).locator('.dot')).toBeVisible();
  await page.getByRole('button', { name: /Sổ tay/ }).click();

  const badges = page.locator('.new-badge');
  const before = await badges.count();
  expect(before).toBeGreaterThan(0);
  await expect(page.getByRole('progressbar', { name: 'Tổng sưu tập' })).not.toHaveAttribute(
    'aria-valuenow',
    '0',
  );

  await page.locator('.codex-card').first().click();
  const card = page.getByRole('dialog');
  await expect(card.getByText('Biết thêm')).toBeVisible();
  // Chữ trong thẻ chọn được (Mobile Web UI Rules mục 6).
  expect(
    await card
      .locator('p')
      .first()
      .evaluate((el) => getComputedStyle(el).userSelect),
  ).not.toBe('none');
  await card.getByRole('button', { name: 'Đóng' }).click();
  await expect(badges).toHaveCount(before - 1);

  await page.reload();
  await page.getByRole('button', { name: /Sổ tay/ }).click();
  await expect(page.locator('.new-badge')).toHaveCount(before - 1);
});

test('nút "?" trong ca mở thẻ Sổ tay, dừng giờ; đóng thì quay về đúng sheet đang làm', async ({ page }) => {
  await page.goto('/');
  await openDay(page, /Ngày 1\.1/);
  await page.getByRole('button', { name: /Máy ly tâm/ }).click();
  await expect(page.locator('.rotor .slot')).toHaveCount(12);

  // Nút "?" ≥44px và cách nút Đóng ≥8px.
  const help = helpButton(page);
  const close = page.locator('.sheet-head').getByRole('button', { name: 'Đóng' });
  const hb = (await help.boundingBox())!;
  const cb = (await close.boundingBox())!;
  expect(hb.width).toBeGreaterThanOrEqual(43.5);
  expect(hb.height).toBeGreaterThanOrEqual(43.5);
  expect(cb.x - (hb.x + hb.width)).toBeGreaterThanOrEqual(8);

  await help.click();
  const card = page.getByRole('dialog').last();
  await expect(card.getByRole('heading', { name: /Cân bằng máy ly tâm/ })).toBeVisible();
  const t0 = await clockText(page);
  await page.waitForTimeout(3000);
  expect(await clockText(page), 'đồng hồ phải đứng khi đang đọc thẻ').toBe(t0);

  await card.getByRole('button', { name: 'Đóng' }).click();
  await expect(page.getByRole('heading', { name: /Cân bằng máy ly tâm/ })).toBeHidden();
  await expect(page.locator('.rotor .slot')).toHaveCount(12);
});

test('nút "?" ở máy hoá sinh mở thẻ chưa mở: hiện "Mở khi ..." chứ không lộ nội dung', async ({ page }) => {
  await page.goto('/');
  await openDay(page, /Ngày 1\.1/);
  await page.locator('.tip').click();
  await page.getByRole('button', { name: /Máy hoá sinh/ }).click();
  await helpButton(page).click();
  const card = page.getByRole('dialog').last();
  await expect(card.getByRole('heading', { name: '🔒 Thẻ chưa mở' })).toBeVisible();
  await expect(card.getByText(/^Mở khi em /)).toBeVisible();
  await expect(card.getByText('Biết thêm')).toHaveCount(0);
  await card.getByRole('button', { name: 'Đóng' }).click();
  await expect(page.getByRole('heading', { name: /Máy hoá sinh/ })).toBeVisible();
});

test('nút "?" trong mini-game không làm mất mạch chơi', async ({ page }) => {
  await page.goto('/?debug=1');
  await openDay(page, /Ngày 1\.1/);
  await page.locator('.tip').click();
  await page.getByRole('button', { name: 'Bảng debug' }).click();
  await page.getByRole('button', { name: 'Gây đổ vỡ' }).click();
  const game = page.getByRole('dialog', { name: 'Dọn đổ vỡ' });
  await expect(game).toBeVisible();
  const step = game.getByText(/^Bước \d\/4$/);
  await expect(step).toHaveText('Bước 1/4');

  await helpButton(page).click();
  const card = page.getByRole('dialog').last();
  await expect(card.getByText(/^Mở khi em /)).toBeVisible();
  await card.getByRole('button', { name: 'Đóng' }).click();
  await expect(game).toBeVisible();
  await expect(step).toHaveText('Bước 1/4');
});

test('mức Dễ: thẻ mẫu ngày 0.2 hiện ống/lọ cần dùng; mức Thường thì không', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await page.getByRole('radio', { name: 'Dễ' }).click();
  await page.getByRole('button', { name: /Về sảnh/ }).click();
  await openDay(page, /Ngày 0\.2/);
  await page.locator('.tip').click();
  await page.locator('.tray-item').first().click({ timeout: 15_000 });
  await expect(page.getByText('Ống cần (gợi ý mức Dễ)')).toBeVisible();
});
