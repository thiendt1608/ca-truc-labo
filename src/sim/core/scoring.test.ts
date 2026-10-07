import { describe, expect, it } from 'vitest';
import { starsFor, WEIGHTS } from './scoring';

describe('chấm điểm', () => {
  it('trọng số 4 tiêu chí cộng lại bằng 1', () => {
    expect(WEIGHTS.accuracy + WEIGHTS.timeliness + WEIGHTS.safety + WEIGHTS.skill).toBeCloseTo(1);
  });
  it('ngưỡng sao theo GDD', () => {
    expect([95, 90, 89, 75, 60, 59, 40, 39].map(starsFor)).toEqual([5, 5, 4, 4, 3, 2, 2, 1]);
  });
});
