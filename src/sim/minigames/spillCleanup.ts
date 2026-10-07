import { rngFromSeed } from '../core/rng';
import type { Difficulty, PlayerAction } from '../core/types';
import { generateHold, scoreHold, type HoldInput } from './holdTimer';
import { clampSkill, type MinigameScore, type MinigameSpec } from './types';

/**
 * Mini-game "Dọn đổ vỡ" (04a mục 0) trên khung "kéo đúng thứ tự".
 * Rắc chất khử khuẩn → chờ (giữ đúng thời gian) → lau từ ngoài vào trong → bỏ thùng rác y tế.
 */
export interface SequenceStep {
  id: string;
  label: string;
  kind: 'tap' | 'hold';
  /** Bước sai kỹ thuật (bẫy). */
  trap?: boolean;
}

export interface SpillInput {
  /** Các thẻ bước theo thứ tự hiển thị (đã xáo). */
  steps: SequenceStep[];
  /** Thứ tự đúng (id). */
  correct: string[];
  hold: HoldInput;
  timeLimitMs: number;
}

export interface SpillScore extends MinigameScore {
  orderErrors: number;
  trapsTapped: number;
  holdVerdict: 'none' | 'early' | 'good' | 'late';
  completed: boolean;
  durationMs: number;
}

const STEPS: SequenceStep[] = [
  { id: 'disinfect', label: 'Rắc chất khử khuẩn lên chỗ đổ', kind: 'tap' },
  { id: 'wait', label: 'Chờ chất khử khuẩn ngấm', kind: 'hold' },
  { id: 'wipe', label: 'Lau từ ngoài vào trong', kind: 'tap' },
  { id: 'bin', label: 'Bỏ vào thùng rác y tế', kind: 'tap' },
];
const TRAPS: SequenceStep[] = [
  { id: 'wipeOut', label: 'Lau từ trong ra ngoài', kind: 'tap', trap: true },
  { id: 'binNormal', label: 'Bỏ vào thùng rác thường', kind: 'tap', trap: true },
];

export function generateSpill(seed: string, difficulty: Difficulty): SpillInput {
  const rng = rngFromSeed(seed);
  const traps = difficulty === 'easy' ? [] : difficulty === 'normal' ? TRAPS.slice(0, 1) : TRAPS;
  return {
    steps: rng.shuffle([...STEPS, ...traps]),
    correct: STEPS.map((s) => s.id),
    hold: generateHold(`${seed}:hold`, difficulty),
    timeLimitMs: 25000,
  };
}

/** Phát lại thao tác theo thứ tự đúng để chấm. Hàm thuần, dùng chung cho UI (phản hồi) và lõi (chấm). */
export function replaySpill(input: SpillInput, actions: PlayerAction[]) {
  let index = 0;
  let orderErrors = 0;
  let trapsTapped = 0;
  const holdActions: PlayerAction[] = [];
  let holdVerdict: SpillScore['holdVerdict'] = 'none';
  for (const a of actions) {
    const expected = input.correct[index];
    if (expected === undefined) break;
    if (a.type === 'tap') {
      const step = input.steps.find((s) => s.id === a.id);
      if (step?.trap) trapsTapped++;
      if (a.id === expected && step?.kind === 'tap') index++;
      else if (a.id !== expected) orderErrors++;
    } else if ((a.type === 'press' || a.type === 'release') && expected === 'wait') {
      holdActions.push(a);
      if (a.type === 'release') {
        const r = scoreHold(input.hold, holdActions);
        holdVerdict = r.verdict;
        // Thả quá sớm: phải giữ lại lần nữa (chất khử khuẩn chưa đủ thời gian).
        if (r.verdict === 'early') {
          holdActions.length = 0;
        } else {
          index++;
        }
      }
    }
  }
  return { index, orderErrors, trapsTapped, holdVerdict, completed: index >= input.correct.length };
}

export function scoreSpill(input: SpillInput, actions: PlayerAction[]): SpillScore {
  const r = replaySpill(input, actions);
  const first = actions[0]?.t ?? 0;
  const last = actions[actions.length - 1]?.t ?? first;
  const durationMs = last - first;
  const releases = actions.filter((a) => a.type === 'release').length;
  const earlyReleases = Math.max(0, releases - 1);
  let skill = 100 - 15 * r.orderErrors - 20 * r.trapsTapped - 15 * earlyReleases;
  if (r.holdVerdict === 'late') skill -= 10;
  if (durationMs > input.timeLimitMs) skill -= 10;
  if (!r.completed) skill = Math.min(skill, 30);
  return {
    skill: clampSkill(skill),
    ok: r.completed && r.trapsTapped === 0 && earlyReleases === 0,
    orderErrors: r.orderErrors,
    trapsTapped: r.trapsTapped,
    holdVerdict: r.holdVerdict,
    completed: r.completed,
    durationMs,
  };
}

export const spillCleanup: MinigameSpec<SpillInput, SpillScore> = {
  id: 'spillCleanup',
  kind: 'sequence',
  title: 'Dọn đổ vỡ',
  generate: generateSpill,
  score: scoreSpill,
};
