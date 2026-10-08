import { describe, expect, it } from 'vitest';
import { pushToasts, timeScale, type Toast } from './game';

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
