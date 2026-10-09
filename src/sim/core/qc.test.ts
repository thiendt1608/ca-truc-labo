import { describe, expect, it } from 'vitest';
import { getContent } from '../content/bundled';
import { evaluateWestgard } from './qc';

const NONE: never[] = [];
const rulesOf = (d: 'easy' | 'normal' | 'hard') => getContent().difficulty.levels[d].advancedWestgard;

describe('Westgard', () => {
  it('1-2s chỉ là cảnh báo', () => {
    const r = evaluateWestgard([{ z1: 2.3, z2: 0.4 }], NONE);
    expect(r.violations).toEqual(['1-2s']);
    expect(r.reject).toBe(false);
  });
  it('1-3s loại', () => {
    expect(evaluateWestgard([{ z1: -3.2, z2: 0 }], NONE).violations).toContain('1-3s');
  });
  it('2-2s trong cùng lần chạy và qua 2 lần chạy', () => {
    expect(evaluateWestgard([{ z1: 2.2, z2: 2.5 }], NONE).violations).toContain('2-2s');
    expect(
      evaluateWestgard(
        [
          { z1: 2.1, z2: 0 },
          { z1: 2.4, z2: 0.3 },
        ],
        NONE,
      ).violations,
    ).toContain('2-2s');
    expect(
      evaluateWestgard(
        [
          { z1: 2.1, z2: 0 },
          { z1: -2.4, z2: 0.3 },
        ],
        NONE,
      ).violations,
    ).not.toContain('2-2s');
  });
  it('R-4s khi hai mức lệch hai phía', () => {
    const r = evaluateWestgard([{ z1: 2.1, z2: -2.2 }], NONE);
    expect(r.violations).toContain('R-4s');
    expect(r.reject).toBe(true);
  });
  it('luật nâng cao theo mức: Dễ không có, Thường chỉ 4-1s, Khó có cả 4-1s và 10x (GDD 13.1)', () => {
    expect(rulesOf('easy')).toEqual([]);
    expect(rulesOf('normal')).toEqual(['4-1s']);
    expect(rulesOf('hard')).toEqual(['4-1s', '10x']);
    const runs = [
      { z1: 1.2, z2: 1.1 },
      { z1: 1.3, z2: 1.5 },
    ];
    expect(evaluateWestgard(runs, rulesOf('easy')).violations).not.toContain('4-1s');
    expect(evaluateWestgard(runs, rulesOf('normal')).violations).toContain('4-1s');
    expect(evaluateWestgard(runs, rulesOf('hard')).violations).toContain('4-1s');
    const ten = Array.from({ length: 5 }, () => ({ z1: 0.4, z2: 0.6 }));
    expect(evaluateWestgard(ten, rulesOf('easy')).violations).not.toContain('10x');
    expect(evaluateWestgard(ten, rulesOf('normal')).violations).not.toContain('10x');
    expect(evaluateWestgard(ten, rulesOf('hard')).violations).toContain('10x');
  });
});
