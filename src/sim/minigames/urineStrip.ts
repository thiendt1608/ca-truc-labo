import { getContent } from '../content/bundled';
import type { UrineRules } from '../content/schema';
import { rngFromSeed } from '../core/rng';
import type { Difficulty, PlayerAction } from '../core/types';
import { clampSkill, type MinigameScore, type MinigameSpec } from './types';

/**
 * Mini-game "Que thử nước tiểu" (04a mục 1) trên khung "so sánh và đọc".
 * Nhúng que → mỗi ô màu lên dần tới thời điểm đọc riêng → người chơi so với bảng màu và chọn mức.
 * Hạt giống có dạng `hồSơ|số`: hồ sơ bệnh quyết định mức thật của từng ô, nên đề bài khớp với mẫu.
 */
export type UrinePad = UrineRules['pads'][number];

export interface UrineInput {
  pads: UrinePad[];
  /** Mức thật của từng ô (chỉ số trong `levels`). */
  truth: Record<string, number>;
  timeLimitMs: number;
  msPerSimSecond: number;
  /** Mức Dễ: hiện nhắc thời điểm đọc của từng ô. */
  hint: boolean;
}

export interface UrineScore extends MinigameScore {
  /** Mức người chơi đã chọn cho từng ô (ô bỏ trống tính là mức 0). */
  reported: Record<string, number>;
  correct: number;
  early: number;
  durationMs: number;
}

/** Hạt giống cho một mẫu nước tiểu: ghép hồ sơ bệnh với một số ngẫu nhiên tất định. */
export function urineSeed(profileId: string, n: number): string {
  return `${profileId}|${n}`;
}

export function generateUrine(seed: string, difficulty: Difficulty): UrineInput {
  const [profile = '', rest = seed] = seed.split('|');
  const rng = rngFromSeed(rest);
  const rules = getContent().chemUrine;
  const truth: Record<string, number> = {};
  for (const pad of rules.pads) {
    const range = rules.profiles[profile]?.[pad.id] ?? rules.healthyRange[pad.id];
    truth[pad.id] = range ? rng.int(range[0], range[1]) : pad.normal[0]!;
  }
  return {
    pads: rules.pads,
    truth,
    timeLimitMs: rules.timeLimitMs,
    msPerSimSecond: rules.msPerSimSecond,
    hint: difficulty === 'easy',
  };
}

/** Đọc trước 80% thời điểm đọc: màu chưa lên đủ nên không tính là đọc đúng cách. */
const EARLY_FRACTION = 0.8;

export function scoreUrine(input: UrineInput, actions: PlayerAction[]): UrineScore {
  const dip = actions.find((a) => a.type === 'tap' && a.id === 'dip');
  const reported: Record<string, number> = {};
  const readAt: Record<string, number> = {};
  for (const a of actions) {
    if (a.type !== 'tap' || a.id === 'dip' || !dip) continue;
    const [padId, level] = a.id.split(':');
    if (padId === undefined || level === undefined) continue;
    reported[padId] = Number(level);
    readAt[padId] = a.t - dip.t;
  }
  let points = 0;
  let correct = 0;
  let early = 0;
  for (const pad of input.pads) {
    if (reported[pad.id] !== truthOf(input, pad.id)) continue;
    correct++;
    if (readAt[pad.id]! < pad.readAtMs * EARLY_FRACTION) {
      early++;
      points += 55;
    } else {
      points += 100;
    }
  }
  const last = actions[actions.length - 1]?.t ?? 0;
  const durationMs = dip ? last - dip.t : 0;
  let skill = points / input.pads.length;
  if (durationMs > input.timeLimitMs) skill -= 10;
  const out: Record<string, number> = {};
  for (const pad of input.pads) out[pad.id] = reported[pad.id] ?? 0;
  return {
    skill: clampSkill(skill),
    ok: correct === input.pads.length,
    reported: out,
    correct,
    early,
    durationMs,
  };
}

function truthOf(input: UrineInput, padId: string): number {
  return input.truth[padId] ?? 0;
}

export const urineStrip: MinigameSpec<UrineInput, UrineScore> = {
  id: 'urineStrip',
  kind: 'compare',
  title: 'Que thử nước tiểu',
  generate: generateUrine,
  score: scoreUrine,
};
