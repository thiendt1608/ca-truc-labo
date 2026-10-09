/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test';

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
