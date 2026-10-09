import { describe, expect, it } from 'vitest';
import type { MistakeEntry } from './types';
import { groupStories, starsFor, WEIGHTS } from './scoring';

describe('chấm điểm', () => {
  it('trọng số 4 tiêu chí cộng lại bằng 1', () => {
    expect(WEIGHTS.accuracy + WEIGHTS.timeliness + WEIGHTS.safety + WEIGHTS.skill).toBeCloseTo(1);
  });
  it('ngưỡng sao theo GDD', () => {
    expect([95, 90, 89, 75, 60, 59, 40, 39].map(starsFor)).toEqual([5, 5, 4, 4, 3, 2, 2, 1]);
  });
});

const m = (over: Partial<MistakeEntry>): MistakeEntry => ({
  t: 0,
  kind: 'lateReception',
  explanationKey: 'rule.lateReception',
  trustDelta: -1,
  safetyPenalty: 0,
  ...over,
});

describe('gộp "Chuyện hôm nay"', () => {
  it('gộp cùng loại + cùng lý do thành một dòng, cộng điểm', () => {
    const g = groupStories([m({ t: 5, trustDelta: -5 }), m({ t: 9 }), m({ t: 12, safetyPenalty: 2 })]);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ count: 3, trustDelta: -7, safetyPenalty: 2 });
    expect(g[0]!.entries.map((e) => e.t)).toEqual([5, 9, 12]);
  });
  it('khác lý do thì không gộp; xếp nặng trước; chi tiết bỏ trùng; giới hạn dòng', () => {
    const g = groupStories([
      m({ kind: 'a', explanationKey: 'k1', trustDelta: -2, detail: 'x' }),
      m({ kind: 'a', explanationKey: 'k2', trustDelta: -9 }),
      m({ kind: 'a', explanationKey: 'k1', trustDelta: -2, detail: 'x' }),
      m({ kind: 'a', explanationKey: 'k1', trustDelta: -2, detail: 'y' }),
    ]);
    expect(g.map((x) => x.explanationKey)).toEqual(['k2', 'k1']);
    expect(g[1]!.details).toEqual(['x', 'y']);
    const many = Array.from({ length: 8 }, (_, i) => m({ kind: `k${i}`, explanationKey: `e${i}` }));
    expect(groupStories(many)).toHaveLength(5);
  });
  it('không đổi tổng điểm: rỗng ra rỗng', () => {
    expect(groupStories([])).toEqual([]);
  });
});
