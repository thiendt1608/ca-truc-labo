/// <reference lib="dom" />
import { expect, type Page } from '@playwright/test';

/**
 * Cửa debug của e2e: với `?debug=1`, store (`__game`) và nội dung (`__content`) được đặt lên window để dựng tình huống
 * (kết quả chờ duyệt, tua nhanh tới sự kiện) mà không phải chơi cả ca. Chỉ dùng trong test.
 */
type Obj = Record<string, unknown>;
interface Game {
  getState(): {
    openDay(id: string): void;
    startShift(seed: string): void;
    setSpeed(n: number): void;
    dispatch(cmd: Obj): unknown;
    shift: { clock: number; orders: Record<string, Obj> } | null;
    mgNotice: Obj | null;
  };
  setState(patch: Obj): void;
}
interface Content {
  chemTests: { analytes: { code: string }[] }[];
}
declare global {
  interface Window {
    __game?: Game;
    __content?: Content;
  }
}

/** Vào thẳng phòng làm việc của ngày `dayId` (bỏ qua Sảnh/Bảng giao ca) và tự đóng mọi mẹo để giờ không bị giữ. */
export async function startViaStore(page: Page, dayId: string, seed = 'e2e') {
  await page.goto('/?debug=1');
  await page.waitForFunction(() => window.__game !== undefined);
  await page.evaluate(
    ([id, s]) => {
      const g = window.__game!;
      g.getState().openDay(id!);
      g.getState().startShift(s!);
      // Mẹo xếp hàng sẽ giữ đồng hồ: dọn liên tục để test đo được tốc độ giờ.
      window.setInterval(() => g.setState({ tips: [] }), 30);
    },
    [dayId, seed],
  );
  await expect(page.locator('.hud')).toBeVisible();
}

export const gameClock = (page: Page) => page.evaluate(() => window.__game!.getState().shift!.clock);

/** Biến phiếu đầu tiên thành "đã có kết quả" với `count` chất (chờ duyệt trong Kết quả). Cần phòng Hoá sinh có mẫu đã tới. */
export async function fabricateResult(page: Page, count: number) {
  await page.evaluate(() => window.__game!.getState().setSpeed(10));
  await page.waitForFunction(() => Object.keys(window.__game!.getState().shift!.orders).length > 0);
  await page.evaluate((n) => {
    const g = window.__game!;
    g.getState().setSpeed(1);
    const shift = g.getState().shift!;
    const order = Object.values(shift.orders)[0] as { id: string };
    const analytes = window.__content!.chemTests.flatMap((t) => t.analytes).slice(0, n);
    const results = analytes.map((a, i) => ({
      code: a.code,
      value: 9,
      display: '9.9',
      flag: i % 3 === 0 ? 'H' : '',
      critical: i === 1,
      overRange: false,
    }));
    g.setState({
      shift: { ...shift, orders: { ...shift.orders, [order.id]: { ...order, status: 'resulted', results } } },
    });
  }, count);
}
