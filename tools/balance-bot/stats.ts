import type { Content } from '../../src/sim/content/load';
import { runBot, type BotKind } from '../../src/sim/bots/bots';
import { computeReport } from '../../src/sim/core/scoring';
import type { Difficulty } from '../../src/sim/core/types';

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
export const BOT_KINDS: BotKind[] = ['expert', 'novice', 'idle'];

export interface BotStats {
  runs: number;
  /** Số ca theo sao: phần tử 0 là 1★ ... phần tử 4 là 5★. */
  stars: number[];
  avgScore: number;
  avgTrust: number;
  avgStars: number;
  minStars: number;
}

/** Chạy `runs` ca với hạt giống `balance-0..runs-1` rồi tổng hợp sao, điểm và Niềm tin. */
export function measure(
  content: Content,
  dayId: string,
  kind: BotKind,
  difficulty: Difficulty,
  runs: number,
): BotStats {
  const stars = [0, 0, 0, 0, 0];
  let total = 0;
  let trust = 0;
  let starSum = 0;
  let minStars = 5;
  for (let i = 0; i < runs; i++) {
    const { state } = runBot(content, dayId, `balance-${i}`, kind, difficulty);
    const r = computeReport(state);
    stars[r.stars - 1]!++;
    total += r.total;
    trust += r.trust;
    starSum += r.stars;
    minStars = Math.min(minStars, r.stars);
  }
  return {
    runs,
    stars,
    avgScore: total / runs,
    avgTrust: trust / runs,
    avgStars: starSum / runs,
    minStars,
  };
}

export interface BalanceArgs {
  runs: number;
  difficulties: Difficulty[];
}

/** `pnpm balance [số ca mỗi ngày] [--difficulty easy|normal|hard|all]`; mặc định 200 ca, chỉ mức Thường. */
export function parseArgs(argv: string[]): BalanceArgs {
  let runs = 200;
  let difficulties: Difficulty[] = ['normal'];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    let value: string | undefined;
    if (arg === '--difficulty') value = argv[++i];
    else if (arg.startsWith('--difficulty=')) value = arg.slice('--difficulty='.length);
    else if (/^\d+$/.test(arg)) {
      runs = Number(arg);
      continue;
    } else throw new Error(`Tham số không hợp lệ: ${arg}`);
    if (value === 'all') difficulties = [...DIFFICULTIES];
    else if (DIFFICULTIES.includes(value as Difficulty)) difficulties = [value as Difficulty];
    else throw new Error(`--difficulty phải là easy, normal, hard hoặc all (nhận: ${value ?? 'trống'})`);
  }
  if (runs < 1) throw new Error('Số ca phải ≥ 1');
  return { runs, difficulties };
}
