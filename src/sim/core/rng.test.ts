import { describe, expect, it } from 'vitest';
import { createRng, hashSeed, rngFromSeed } from './rng';

describe('rng', () => {
  it('cùng hạt giống → cùng chuỗi số', () => {
    const a = rngFromSeed('daily-2026-10-07');
    const b = rngFromSeed('daily-2026-10-07');
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
  });

  it('khôi phục được từ trạng thái đã lưu', () => {
    const a = rngFromSeed('x');
    a.next();
    a.next();
    const b = createRng(a.state());
    expect(b.next()).toBe(a.next());
  });

  it('int nằm trong khoảng và weighted tôn trọng trọng số 0', () => {
    const r = createRng(hashSeed('y'));
    for (let i = 0; i < 1000; i++) {
      const n = r.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      expect(r.weighted({ a: 1, b: 0 })).toBe('a');
    }
  });
});
