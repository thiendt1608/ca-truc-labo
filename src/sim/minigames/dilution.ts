import { getContent } from '../content/bundled';
import type { Analyte } from '../content/schema';
import type { Difficulty, PlayerAction } from '../core/types';
import { clampSkill, type MinigameScore, type MinigameSpec } from './types';

/**
 * Mini-game "Pha loãng" (04a mục 1) trên khung "đo và tra bảng" (MeasureGame).
 * Bước 1: chọn tỉ lệ pha loãng; máy "chạy lại" và báo số đọc (vẫn vượt dải thì phải chọn lại).
 * Bước 2: nhân số đọc với hệ số pha loãng, chọn kết quả đúng.
 * Hạt giống có dạng `mãChất|giáTrịThật`, nên đề bài khớp với mẫu thật trong ca.
 */
export interface DilutionInput {
  analyte: Pick<Analyte, 'code' | 'name' | 'unit' | 'decimals' | 'max'>;
  /** Giá trị thật của mẫu (người chơi không thấy, chỉ thấy số đọc sau pha loãng). */
  truth: number;
  ratios: number[];
}

export interface DilutionScore extends MinigameScore {
  /** Tỉ lệ cuối cùng đưa kết quả vào dải đo (null nếu chưa chọn được). */
  ratio: number | null;
  firstRatio: number | null;
  smallest: number;
  /** Số lần chạy lại vì pha loãng chưa đủ. */
  wasted: number;
  multiplyWrong: number;
}

export function dilutionSeed(code: string, truth: number): string {
  return `${code}|${truth}`;
}

export function generateDilution(seed: string, _difficulty: Difficulty): DilutionInput {
  const [code = '', truth = '0'] = seed.split('|');
  const analyte = getContent()
    .chemTests.flatMap((t) => t.analytes)
    .find((a) => a.code === code);
  if (!analyte) throw new Error(`Chất phân tích không tồn tại: ${code}`);
  return {
    analyte: {
      code: analyte.code,
      name: analyte.name,
      unit: analyte.unit,
      decimals: analyte.decimals,
      max: analyte.max,
    },
    truth: Number(truth),
    ratios: getContent().chemRules.dilution.ratios,
  };
}

const factor = (input: DilutionInput) => 10 ** input.analyte.decimals;

/** Số máy đọc được khi mẫu đã pha loãng `ratio` lần. */
export function readingAt(input: DilutionInput, ratio: number): number {
  return Math.round((input.truth / ratio) * factor(input)) / factor(input);
}

export function isInRange(input: DilutionInput, ratio: number): boolean {
  return readingAt(input, ratio) <= input.analyte.max;
}

/** Tỉ lệ nhỏ nhất đưa kết quả vào dải đo. */
export function smallestRatio(input: DilutionInput): number {
  return input.ratios.find((r) => isInRange(input, r)) ?? input.ratios[input.ratios.length - 1]!;
}

const fmt = (input: DilutionInput, n: number) => n.toFixed(input.analyte.decimals);

/** Kết quả đúng sau khi nhân lại hệ số pha loãng. */
export function correctAnswer(input: DilutionInput, ratio: number): string {
  return fmt(input, Math.round(readingAt(input, ratio) * ratio * factor(input)) / factor(input));
}

/** Các đáp án để chọn: đúng, quên nhân (giữ số đọc), nhầm dấu phẩy (gấp 10 lần). Xếp tăng dần theo giá trị. */
export function multiplyOptions(input: DilutionInput, ratio: number): string[] {
  const reading = readingAt(input, ratio);
  const correct = Number(correctAnswer(input, ratio));
  const values = new Set([
    correctAnswer(input, ratio),
    fmt(input, reading),
    fmt(input, Math.round(correct * 10 * factor(input)) / factor(input)),
  ]);
  return [...values].sort((a, b) => Number(a) - Number(b));
}

export function scoreDilution(input: DilutionInput, actions: PlayerAction[]): DilutionScore {
  const smallest = smallestRatio(input);
  let ratio: number | null = null;
  let firstRatio: number | null = null;
  let wasted = 0;
  let multiplyWrong = 0;
  let answered = false;
  for (const a of actions) {
    if (a.type !== 'tap') continue;
    const [kind, value] = a.id.split(':');
    if (kind === 'ratio' && ratio === null) {
      const r = Number(value);
      firstRatio ??= r;
      if (isInRange(input, r)) ratio = r;
      else wasted++;
    } else if (kind === 'answer' && ratio !== null && !answered) {
      if (value === correctAnswer(input, ratio)) answered = true;
      else multiplyWrong++;
    }
  }
  const ratioPart = firstRatio === null ? 0 : firstRatio === smallest ? 100 : firstRatio > smallest ? 70 : 40;
  const multiplyPart = !answered ? 0 : multiplyWrong === 0 ? 100 : 50;
  const skill = 0.7 * ratioPart + 0.3 * multiplyPart - 10 * Math.max(0, wasted - 1);
  return {
    skill: clampSkill(skill),
    ok: ratio !== null && answered && wasted === 0,
    ratio,
    firstRatio,
    smallest,
    wasted,
    multiplyWrong,
  };
}

export const dilution: MinigameSpec<DilutionInput, DilutionScore> = {
  id: 'dilution',
  kind: 'measure',
  title: 'Pha loãng',
  generate: generateDilution,
  score: scoreDilution,
};
