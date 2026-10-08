import { describe, expect, it } from 'vitest';
import type { ShiftState } from '../sim';
import { pushToasts, runProgress, timeScale, type Toast } from './game';

const mk = (id: number, text: string): Omit<Toast, 'count'> => ({ id, kind: 'mistake', text });

describe('thông báo', () => {
  it('gộp thông báo trùng thành ×n thay vì xếp chồng', () => {
    let list = pushToasts([], [mk(1, 'Trễ hẹn')]);
    list = pushToasts(list, [mk(2, 'Trễ hẹn'), mk(3, 'Trễ hẹn')]);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 3, count: 3 });
  });

  it('chỉ giữ 2 thông báo mới nhất để không che khay mẫu', () => {
    const list = pushToasts([], [mk(1, 'a'), mk(2, 'b'), mk(3, 'c')]);
    expect(list.map((x) => x.text)).toEqual(['b', 'c']);
  });
});

describe('nhịp đồng hồ', () => {
  it('ca ngắn và ca dài đều dài khoảng 6 phút thực', () => {
    expect(9000 / timeScale(9000)).toBeCloseTo(360);
    expect(14400 / timeScale(14400)).toBeCloseTo(360);
  });
});

describe('tiến độ máy khi mất điện', () => {
  const at = (clock: number, powerOutUntil: number) =>
    ({ clock, effects: { powerOutUntil } }) as unknown as ShiftState;
  it('đóng băng trong lúc mất điện rồi chạy tiếp đúng chỗ cũ', () => {
    // Lượt quay 600 giây bắt đầu lúc 0; mất điện 100→700 nên kết thúc bị đẩy từ 600 lên 1200.
    expect(runProgress(at(100, 0), 600, 600)).toBeCloseTo(100 - (500 / 600) * 100); // trước khi mất điện
    expect(runProgress(at(400, 700), 1200, 600)).toBeCloseTo(100 - (500 / 600) * 100); // vẫn đứng yên
    expect(runProgress(at(700, 700), 1200, 600)).toBeCloseTo(100 - (500 / 600) * 100);
    expect(runProgress(at(1000, 700), 1200, 600)).toBeCloseTo(100 - (200 / 600) * 100); // chạy tiếp
  });
});
