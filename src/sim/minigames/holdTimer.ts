import { getContent } from '../content/bundled';
import { rngFromSeed } from '../core/rng';
import type { Difficulty, PlayerAction } from '../core/types';
import { clampSkill, type MinigameScore, type MinigameSpec } from './types';

/** Khung "giữ đúng thời gian": nhấn giữ, thanh đầy dần, thả tay khi thanh nằm trong vùng xanh. */
export interface HoldInput {
  /** Thời gian (ms thực) để thanh đầy 100%. */
  fillMs: number;
  /** Vùng đúng, tính theo tỉ lệ 0..1 của thanh. */
  zone: [number, number];
}

export interface HoldScore extends MinigameScore {
  /** Tỉ lệ thanh lúc thả tay; null nếu chưa nhấn/thả. */
  fraction: number | null;
  verdict: 'none' | 'early' | 'good' | 'late';
}

/** Độ rộng vùng đúng và thời gian đầy thanh theo mức độ khó lấy từ `content/common/difficulty.json`. */
export function generateHold(seed: string, difficulty: Difficulty): HoldInput {
  const rng = rngFromSeed(seed);
  const { zoneWidth: width, fillMs } = getContent().difficulty.levels[difficulty].hold;
  const start = 0.5 + rng.next() * (0.85 - width - 0.5);
  return { fillMs, zone: [round2(start), round2(start + width)] };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Chấm một lần nhấn–thả (dùng riêng hoặc lồng trong khung khác). */
export function scoreHold(input: HoldInput, actions: PlayerAction[]): HoldScore {
  const press = actions.find((a) => a.type === 'press');
  const release = press ? actions.find((a) => a.type === 'release' && a.t >= press.t) : undefined;
  if (!press || !release) return { skill: 0, ok: false, fraction: null, verdict: 'none' };
  const fraction = Math.min(1.2, (release.t - press.t) / input.fillMs);
  const [lo, hi] = input.zone;
  if (fraction < lo)
    return { skill: clampSkill(60 - (lo - fraction) * 200), ok: false, fraction, verdict: 'early' };
  if (fraction > hi)
    return { skill: clampSkill(80 - (fraction - hi) * 200), ok: false, fraction, verdict: 'late' };
  const center = (lo + hi) / 2;
  const offset = Math.abs(fraction - center) / ((hi - lo) / 2);
  return { skill: clampSkill(100 - offset * 15), ok: true, fraction, verdict: 'good' };
}

export const holdTimer: MinigameSpec<HoldInput, HoldScore> = {
  id: 'holdTimer',
  kind: 'timing',
  title: 'Giữ đúng thời gian',
  generate: generateHold,
  score: scoreHold,
};
