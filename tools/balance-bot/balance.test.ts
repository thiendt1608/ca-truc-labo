import { describe, expect, it } from 'vitest';
import type { BotKind } from '../../src/sim/bots/bots';
import { getContent } from '../../src/sim/content/bundled';
import type { Difficulty } from '../../src/sim/core/types';
import { DIFFICULTIES, measure, parseArgs } from './stats';

describe('pnpm balance: tham số', () => {
  it('mặc định 200 ca, chỉ mức Thường (giữ hành vi cũ)', () => {
    expect(parseArgs([])).toEqual({ runs: 200, difficulties: ['normal'] });
    expect(parseArgs(['20'])).toEqual({ runs: 20, difficulties: ['normal'] });
  });
  it('--difficulty chọn một mức hoặc all, đứng trước hay sau số ca đều được', () => {
    expect(parseArgs(['5', '--difficulty', 'hard'])).toEqual({ runs: 5, difficulties: ['hard'] });
    expect(parseArgs(['--difficulty=easy', '7'])).toEqual({ runs: 7, difficulties: ['easy'] });
    expect(parseArgs(['--difficulty', 'all'])).toEqual({ runs: 200, difficulties: DIFFICULTIES });
  });
  it('tham số sai bị từ chối', () => {
    expect(() => parseArgs(['--difficulty', 'kho'])).toThrow(/easy, normal, hard/);
    expect(() => parseArgs(['--difficulty'])).toThrow();
    expect(() => parseArgs(['abc'])).toThrow(/Tham số/);
    expect(() => parseArgs(['0'])).toThrow();
  });
});

describe('bot trên cả 3 mức độ khó', () => {
  const content = getContent();
  const days = ['ch0-d1', 'ch1-d3', 'ch1-d4'];
  const RUNS = 8;
  const cache = new Map<string, ReturnType<typeof measure>>();
  const get = (day: string, d: Difficulty, kind: BotKind) => {
    const k = `${day}|${d}|${kind}`;
    if (!cache.has(k)) cache.set(k, measure(content, day, kind, d, RUNS));
    return cache.get(k)!;
  };

  it('bot thành thạo ≥ 4 sao và bot không làm gì 1 sao ở cả 3 mức', () => {
    for (const day of days)
      for (const d of DIFFICULTIES) {
        expect(get(day, d, 'expert').avgStars, `${day} ${d}`).toBeGreaterThanOrEqual(4);
        expect(get(day, d, 'idle').stars, `${day} ${d}`).toEqual([RUNS, 0, 0, 0, 0]);
      }
  }, 60_000);

  it('bot mới: điểm Dễ ≥ Thường ≥ Khó (trong nhiễu) và Dễ hơn Khó rõ rệt', () => {
    let gap = 0;
    for (const day of days) {
      const [e, n, h] = DIFFICULTIES.map((d) => get(day, d, 'novice').avgScore) as [number, number, number];
      expect(n, `${day} Thường không hơn Dễ`).toBeLessThanOrEqual(e + 3);
      expect(h, `${day} Khó không hơn Thường`).toBeLessThanOrEqual(n + 3);
      gap += (e - h) / days.length;
    }
    expect(gap).toBeGreaterThan(3);
  }, 60_000);
});
