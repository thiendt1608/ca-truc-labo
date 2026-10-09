import { expect, test, type Page } from '@playwright/test';
import { fabricateResult, gameClock, startViaStore } from './debug-store';

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

test('mở tấm làm việc thì giờ chạy chậm ×0,25 và có chip báo; Sổ tay dừng hẳn', async ({ page }) => {
  await startViaStore(page, 'ch1-d1');
  await page.evaluate(() => window.__game!.getState().setSpeed(10));
  const elapsed = async (ms: number) => {
    const before = await gameClock(page);
    await page.waitForTimeout(ms);
    return (await gameClock(page)) - before;
  };
  const free = await elapsed(1500);
  expect(free).toBeGreaterThan(100);

  await page.getByRole('button', { name: /Máy ly tâm/ }).click();
  await expect(page.locator('.slow-chip')).toHaveText(/Giờ chậm ×0,25/);
  const slow = await elapsed(1500);
  expect(slow / free).toBeGreaterThan(0.12);
  expect(slow / free).toBeLessThan(0.45);
  await page.keyboard.press('Escape');
  await expect(page.locator('.sheet')).toHaveCount(0);

  await page.getByRole('button', { name: /Sổ tay/ }).click();
  await expect(page.locator('.slow-chip')).toHaveCount(0);
  expect(await elapsed(800)).toBe(0);
});

test('ống vỡ tự bật: có thẻ nhắc, giờ dừng, mini-game chỉ vào khi bấm "Dọn ngay"', async ({ page }) => {
  await startViaStore(page, 'ch1-d4');
  await page.evaluate(() => window.__game!.getState().setSpeed(10));
  const notice = page.getByRole('alertdialog');
  await expect(notice).toBeVisible({ timeout: 40_000 });
  await expect(notice).toContainText('Rơi vỡ');
  await expect(page.locator('.mg')).toHaveCount(0);
  const button = notice.getByRole('button', { name: /Dọn ngay/ });
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48);

  const before = await gameClock(page);
  await page.waitForTimeout(800);
  expect(await gameClock(page)).toBe(before);
  await expect(notice).toBeVisible();

  await button.click();
  await expect(notice).toHaveCount(0);
  await expect(page.locator('.mg .steps')).toBeVisible();
});

test('QC: sau khi bấm Không đạt, biểu đồ và mọi nút khắc phục nằm trong tầm nhìn', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startViaStore(page, 'ch1-d3');
  await page
    .getByRole('button', { name: /QC|Kiểm tra chất lượng/ })
    .first()
    .click();
  await page.getByRole('button', { name: /Chạy control/ }).click();
  await page.getByRole('button', { name: /Không đạt/ }).click();
  await expect(page.locator('.remedies button')).toHaveCount(5);

  const vh = page.viewportSize()!.height;
  await expect
    .poll(async () => {
      const chart = (await page.locator('.ljchart').boundingBox())!;
      const boxes = await page.locator('.remedies button').evaluateAll((bs) =>
        bs.map((b) => {
          const r = b.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        }),
      );
      const remediesVisible = boxes.every((b) => b.top >= 0 && b.bottom <= vh);
      const chartVisible = chart.y >= 0 && chart.y + chart.height <= vh;
      return remediesVisible && chartVisible;
    })
    .toBe(true);
});

test('thông báo khi mở Kết quả nằm ngoài tấm: không đè nút Duyệt và gửi, tiêu đề, HUD', async ({ page }) => {
  await startViaStore(page, 'ch1-d1');
  await fabricateResult(page, 9);
  await page
    .locator('nav.bottombar')
    .getByRole('button', { name: /Kết quả/ })
    .click();
  await expect(page.getByRole('button', { name: /Duyệt và gửi/ })).toBeVisible();
  await page.evaluate(() => {
    const g = window.__game!.getState();
    g.dispatch({ type: 'releaseOrder', orderId: 'khong-co' });
  });
  await expect(page.locator('.sheet-overlay .toast')).toHaveCount(1);

  const rects = await page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    return {
      toast: box(document.querySelector('.toast')!),
      sheet: box(document.querySelector('.sheet')!),
      hud: box(document.querySelector('.hud')!),
      head: box(document.querySelector('.sheet-head')!),
      primary: box(document.querySelector('.sheet button.primary')!),
    };
  });
  expect(rects.toast.top).toBeGreaterThanOrEqual(rects.hud.bottom - 1);
  expect(rects.toast.bottom).toBeLessThanOrEqual(rects.sheet.top + 1);
  expect(rects.toast.bottom).toBeLessThanOrEqual(rects.head.top + 1);
  expect(rects.toast.bottom <= rects.primary.top || rects.toast.top >= rects.primary.bottom).toBe(true);
  // Nút chính của thẻ dài luôn trong tầm nhìn của tấm (dính đáy), không phải cuộn mới thấy.
  expect(rects.primary.bottom).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(rects.primary.top).toBeGreaterThanOrEqual(rects.sheet.top);
});

test('Bảng giao ca: nội dung canh giữa khi màn cao, không cắt đầu khi màn thấp', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ngày 1\.1/ }).click();
  await expect(page.getByText('📋 Tóm tắt ca')).toBeVisible();
  const r = await page.evaluate(() => {
    const s = document.querySelector('.screen')!.getBoundingClientRect();
    const b = document.querySelector('.brief')!.getBoundingClientRect();
    return { top: b.top - s.top, bottom: s.bottom - b.bottom, free: s.height - b.height };
  });
  expect(r.top).toBeGreaterThanOrEqual(0);
  if (r.free > 80) expect(Math.abs(r.top - r.bottom)).toBeLessThanOrEqual(2);
  await expect(page.getByText(/mẫu dự kiến/)).toBeVisible();
  await expect(page.getByText(/Mức Thường/)).toBeVisible();
});

test('mini-game: phản hồi nằm dưới danh sách bước, các bước không dịch chỗ khi hiện lỗi (320px)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await startViaStore(page, 'ch1-d1');
  await page.evaluate(() => window.__game!.getState().dispatch({ type: 'debug/forceSpill' }));
  await expect(page.locator('.mg .steps')).toBeVisible();

  const layout = () =>
    page.evaluate(() => {
      const body = document.querySelector('.mg-body')!;
      const steps = document.querySelector('.mg .steps')!.getBoundingClientRect();
      const bar = document.querySelector('.mg .progress')!.getBoundingClientRect();
      return { stepsTop: steps.top + body.scrollTop, gap: steps.top - bar.bottom };
    });
  const before = await layout();
  // Không còn khoảng trống lớn giữa thanh tiến độ và danh sách bước.
  expect(before.gap).toBeLessThan(30);

  const steps = page.locator('.mg .step');
  for (let i = 0; i < (await steps.count()) && (await page.locator('.mg-msg.toast').count()) === 0; i++)
    await steps.nth(i).click();
  await expect(page.locator('.mg-msg.toast')).toBeVisible();
  const after = await layout();
  expect(Math.abs(after.stepsTop - before.stepsTop)).toBeLessThanOrEqual(1);
});

test('thẻ mẫu nêu mức ưu tiên cho mọi phiếu; báo cáo không còn dòng Ngân sách', async ({ page }) => {
  await page.goto('/?debug=1');
  await enterDay(page, /Ngày 0\.1/);
  const tube = page.locator('.tray-item').first();
  await expect(tube).toBeVisible({ timeout: 10_000 });
  await tube.click();
  await expect(page.locator('.compare .col').first().getByText('Mức ưu tiên')).toBeVisible();
  await expect(page.locator('.compare .col').first()).toContainText(/Thường|Cấp cứu/);
  await page.getByRole('button', { name: 'Đóng' }).click();

  await page.getByRole('button', { name: 'Bảng debug' }).click();
  await page.getByRole('button', { name: 'Kết thúc ca ngay' }).click();
  await expect(page.getByRole('heading', { name: 'Báo cáo giao ca' })).toBeVisible();
  await expect(page.getByText(/Ngân sách/)).toHaveCount(0);
});
