/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test';
import { fabricateResult, startViaStore } from './debug-store';

/** Kiểm tra bố cục trên nhiều kích thước: không tràn ngang, khung ở giữa, nút đủ lớn, nằm trong khung. */
async function audit(page: Page, where: string) {
  const r = await page.evaluate(() => {
    const app = document.querySelector('.app')!.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const small: string[] = [];
    const outside: string[] = [];
    for (const b of document.querySelectorAll<HTMLElement>('.app button')) {
      const bb = b.getBoundingClientRect();
      if (bb.width === 0 || bb.height === 0) continue;
      const name = (b.textContent ?? '').trim().slice(0, 24);
      if (bb.height < 43.5 || bb.width < 43.5)
        small.push(`${name} ${Math.round(bb.width)}x${Math.round(bb.height)}`);
      if (bb.left < app.left - 1 || bb.right > app.right + 1) outside.push(name);
    }
    return {
      vw,
      vh,
      app: { left: app.left, right: app.right, top: app.top, bottom: app.bottom, width: app.width },
      overflowX: document.documentElement.scrollWidth - vw,
      small,
      outside,
    };
  });
  const msg = `${where} @${r.vw}x${r.vh}`;
  expect(r.overflowX, `${msg} tràn ngang`).toBeLessThanOrEqual(0);
  expect(r.app.right, `${msg} khung ra ngoài`).toBeLessThanOrEqual(r.vw + 1);
  expect(r.app.bottom, `${msg} khung ra ngoài đáy`).toBeLessThanOrEqual(r.vh + 1);
  expect(r.app.width, `${msg} khung quá rộng`).toBeLessThanOrEqual(481);
  expect(Math.abs(r.app.left + r.app.right - r.vw), `${msg} khung lệch giữa`).toBeLessThanOrEqual(2);
  expect(r.small, `${msg} nút nhỏ`).toEqual([]);
  expect(r.outside, `${msg} nút ngoài khung`).toEqual([]);
}

test('sảnh, phòng làm việc, thẻ mẫu và máy ly tâm đều gọn ở mọi kích thước', async ({ page }) => {
  await page.goto('/?debug=1');
  await expect(page.getByRole('heading', { name: /CA TRỰC LABO/ })).toBeVisible();
  await audit(page, 'sảnh');

  await page.getByRole('button', { name: /Ngày 1\.1/ }).click();
  await audit(page, 'briefing');
  await page.getByRole('button', { name: 'Vào ca' }).click();
  await page.locator('.tip').click();
  await expect(page.getByRole('button', { name: /Máy ly tâm/ })).toBeVisible();
  await audit(page, 'phòng');

  await page.getByRole('button', { name: /Máy ly tâm/ }).click();
  await expect(page.locator('.rotor .slot')).toHaveCount(12);
  await audit(page, 'máy ly tâm');
});

test('Cài đặt gọn ở mọi kích thước (cả khi mở mã, xác nhận ghi đè và xóa)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Cài đặt/ })).toBeVisible();
  await audit(page, 'cài đặt');

  await page.getByRole('button', { name: 'Xuất mã lưu' }).click();
  await expect(page.getByLabel('Mã lưu', { exact: true })).toBeVisible();
  await page.getByLabel('Mã lưu cần nhập').fill('CTL1.sai.00000000');
  await page.getByRole('button', { name: 'Nhập', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Xóa tiến trình' }).click();
  await audit(page, 'cài đặt (mã, lỗi, xác nhận xóa)');
});

test('Sổ tay gọn ở mọi kích thước (tiến độ, lọc, tìm kiếm, thẻ mở và nút "?" trong ca)', async ({ page }) => {
  await page.goto('/?debug=1');
  await page.getByRole('button', { name: /Sổ tay/ }).click();
  await expect(page.getByRole('heading', { name: /Sổ tay KTV/ })).toBeVisible();
  await audit(page, 'sổ tay (khoá hết)');

  await page.getByRole('button', { name: 'Hoá sinh', exact: true }).click();
  await page.getByLabel('Tìm thẻ Sổ tay').fill('ly tam');
  await audit(page, 'sổ tay (lọc, tìm)');
  await page.getByLabel('Tìm thẻ Sổ tay').fill('zzzz');
  await audit(page, 'sổ tay (không khớp)');
  await page.getByRole('button', { name: /Về sảnh/ }).click();

  // Có thẻ đã mở: chơi tới hết ca 0.1 bằng bảng debug rồi xem Sổ tay và một thẻ.
  await page.getByRole('button', { name: /Ngày 0\.1/ }).click();
  await page.getByRole('button', { name: 'Vào ca' }).click();
  await page.locator('.tip').click();
  await page.getByRole('button', { name: 'Bảng debug' }).click();
  await page.getByRole('button', { name: 'Kết thúc ca ngay' }).click();
  await expect(page.getByRole('heading', { name: 'Báo cáo giao ca' })).toBeVisible();
  await page.getByRole('button', { name: /Về sảnh/ }).click();
  await page.getByRole('button', { name: /Sổ tay/ }).click();
  await audit(page, 'sổ tay (có thẻ mới)');
  await page.locator('.codex-card').first().click();
  await expect(page.getByText('Biết thêm')).toBeVisible();
  await audit(page, 'thẻ Sổ tay');
  await page.getByRole('dialog').getByRole('button', { name: 'Đóng' }).click();
  await page.getByRole('button', { name: /Về sảnh/ }).click();

  // Nút "?" trong ca: thẻ chồng lên sheet máy ly tâm.
  await page.getByRole('button', { name: /Ngày 1\.1/ }).click();
  await page.getByRole('button', { name: 'Vào ca' }).click();
  await page.locator('.tip').click();
  await page.getByRole('button', { name: /Máy ly tâm/ }).click();
  await audit(page, 'máy ly tâm có nút ?');
  await page.getByRole('button', { name: 'Mở thẻ Sổ tay liên quan' }).click();
  await expect(page.getByRole('dialog').last().getByText('Biết thêm')).toBeVisible();
  await audit(page, 'thẻ từ nút ?');
});

test('Kết quả có thông báo và thẻ nhắc ống vỡ gọn ở mọi kích thước', async ({ page }) => {
  await startViaStore(page, 'ch1-d1');
  await fabricateResult(page, 9);
  await page
    .locator('nav.bottombar')
    .getByRole('button', { name: /Kết quả/ })
    .click();
  await expect(page.getByRole('button', { name: /Duyệt và gửi/ })).toBeVisible();
  await page.evaluate(() => {
    window.__game!.getState().dispatch({ type: 'releaseOrder', orderId: 'khong-co' });
  });
  await expect(page.locator('.sheet-overlay .toast')).toBeVisible();
  await audit(page, 'kết quả + thông báo');
  await page.keyboard.press('Escape');

  // Thẻ nhắc trước mini-game tự bật (dựng bằng cửa debug: lõi mở mini-game, store giữ thẻ nhắc).
  await page.evaluate(() => {
    const g = window.__game!;
    g.getState().dispatch({ type: 'debug/forceSpill' });
    g.setState({
      mgNotice: { taskId: 'x', title: '💥 Rơi vỡ mẫu', text: 'Một ống vừa rơi vỡ gần máy ly tâm!' },
    });
  });
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await audit(page, 'thẻ nhắc ống vỡ');
  await page.getByRole('button', { name: /Dọn ngay/ }).click();
  await expect(page.locator('.mg .steps')).toBeVisible();
  await audit(page, 'mini-game dọn đổ vỡ');
});
