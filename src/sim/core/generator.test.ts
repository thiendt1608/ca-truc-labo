import { describe, expect, it } from 'vitest';
import { getContent } from '../content/bundled';
import { createShift } from './engine';
import type { ScheduledArrival } from './types';

/** Mọi phiếu được sinh sẵn cho `dayId` qua nhiều hạt giống (kể cả mẫu có ưu tiên do kịch bản ép sẵn). */
function orders(dayId: string, seeds: number) {
  const content = getContent();
  const list = [];
  for (let i = 0; i < seeds; i++) {
    const s = createShift({ content, dayId, seed: `ward-${i}`, difficulty: 'normal' }).state;
    for (const item of s.scheduled)
      if (item.kind === 'arrival' && (item as ScheduledArrival).order)
        list.push((item as ScheduledArrival).order!);
  }
  return list;
}

describe('khoa gửi và mức ưu tiên', () => {
  const stat = orders('ch1-d4', 60).filter((o) => o.priority === 'stat');
  it('mẫu khẩn không bao giờ từ Phòng khám (tỉ lệ cấp cứu 0) và hay nhất từ khoa Cấp cứu', () => {
    expect(stat.length).toBeGreaterThan(20);
    expect(stat.some((o) => o.ward === 'Phòng khám')).toBe(false);
    const count = (w: string) => stat.filter((o) => o.ward === w).length;
    for (const ward of getContent().wards.filter((w) => w.name !== 'Cấp cứu'))
      expect(count('Cấp cứu')).toBeGreaterThan(count(ward.name));
  });
  it('mẫu thường (kể cả do kịch bản ép) hiếm khi từ khoa Cấp cứu', () => {
    const routine = orders('ch1-d4', 60).filter((o) => o.priority === 'routine');
    const cc = routine.filter((o) => o.ward === 'Cấp cứu').length;
    expect(cc / routine.length).toBeLessThan(0.08);
  });
});
