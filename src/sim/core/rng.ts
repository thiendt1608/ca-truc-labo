/**
 * Bộ sinh số ngẫu nhiên có hạt giống (seeded PRNG).
 * Trạng thái là một số nguyên 32-bit nên lưu thẳng vào ShiftState: cùng hạt giống + cùng lệnh → cùng kết quả.
 */

/** Băm chuỗi hạt giống thành số nguyên 32-bit (cyrb53 rút gọn). */
export function hashSeed(seed: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return h1 >>> 0;
}

export interface Rng {
  /** Số thực trong [0, 1). */
  next(): number;
  /** Số nguyên trong [min, max] (gồm cả hai đầu). */
  int(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<K extends string>(weights: Partial<Record<K, number>>): K;
  /** Phân phối chuẩn (Box-Muller). */
  normal(mean: number, sd: number): number;
  shuffle<T>(items: readonly T[]): T[];
  /** Trạng thái hiện tại để lưu lại. */
  state(): number;
}

/** mulberry32: nhanh, đủ tốt cho game, trạng thái 32-bit. */
export function createRng(state: number): Rng {
  let s = state >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() từ danh sách rỗng');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    weighted: (weights) => {
      const entries = Object.entries(weights) as [string, number][];
      const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
      if (total <= 0) throw new Error('weighted() không có trọng số dương');
      let r = next() * total;
      for (const [key, w] of entries) {
        r -= Math.max(0, w);
        if (r < 0) return key as never;
      }
      return entries[entries.length - 1]![0] as never;
    },
    normal: (mean, sd) => {
      const u = Math.max(next(), 1e-12);
      const v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
    state: () => s,
  };
  return rng;
}

export function rngFromSeed(seed: string): Rng {
  return createRng(hashSeed(seed));
}
