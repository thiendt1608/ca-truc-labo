import type { Difficulty } from './types';

/**
 * Luật Westgard (05-noi-dung-chuyen-mon.md mục 2.5). Hàm thuần.
 * Mỗi lần chạy QC có 2 mức control; giá trị đã quy về z = (giá trị − trung bình) / SD.
 */
export interface QCRun {
  z1: number;
  z2: number;
}

export type WestgardRule = '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10x';

export interface WestgardResult {
  /** Luật bị vi phạm ở lần chạy mới nhất. */
  violations: WestgardRule[];
  /** Có luật loại (không chỉ cảnh báo 1-2s). */
  reject: boolean;
}

/** `runs` theo thời gian, phần tử cuối là lần chạy mới nhất. */
export function evaluateWestgard(runs: QCRun[], difficulty: Difficulty): WestgardResult {
  const last = runs[runs.length - 1];
  if (!last) return { violations: [], reject: false };
  const v: WestgardRule[] = [];
  const latest = [last.z1, last.z2];

  if (latest.some((z) => Math.abs(z) > 2)) v.push('1-2s');
  if (latest.some((z) => Math.abs(z) > 3)) v.push('1-3s');

  // 2-2s: hai điểm liên tiếp cùng vượt 2SD cùng phía — trong cùng lần chạy (2 mức) hoặc cùng mức qua 2 lần chạy.
  const prev = runs[runs.length - 2];
  const sameSide2 = (a: number, b: number) => (a > 2 && b > 2) || (a < -2 && b < -2);
  if (sameSide2(last.z1, last.z2) || (prev && (sameSide2(prev.z1, last.z1) || sameSide2(prev.z2, last.z2)))) {
    v.push('2-2s');
  }

  // R-4s: trong một lần chạy, một mức vượt +2SD và mức kia vượt −2SD.
  if ((last.z1 > 2 && last.z2 < -2) || (last.z1 < -2 && last.z2 > 2)) v.push('R-4s');

  if (difficulty === 'hard') {
    const series = runs.flatMap((r) => [r.z1, r.z2]);
    const tail = (n: number) => series.slice(-n);
    const t4 = tail(4);
    if (t4.length === 4 && (t4.every((z) => z > 1) || t4.every((z) => z < -1))) v.push('4-1s');
    const t10 = tail(10);
    if (t10.length === 10 && (t10.every((z) => z > 0) || t10.every((z) => z < 0))) v.push('10x');
  }

  return { violations: v, reject: v.some((r) => r !== '1-2s') };
}
