import type { Difficulty, PlayerAction } from '../core/types';

/** 5 khung mini-game (04a mục 7). */
export type MinigameKind = 'sequence' | 'microscope' | 'timing' | 'compare' | 'measure';

export interface MinigameScore {
  /** Điểm Tay nghề 0–100. */
  skill: number;
  /** Làm đúng kỹ thuật (an toàn). Sai → lõi ghi lỗi. */
  ok: boolean;
}

/**
 * Một mini-game = đề bài sinh tất định + hàm chấm điểm thuần.
 * Component React chỉ ghi thao tác (PlayerAction[]) rồi gửi về lõi.
 */
export interface MinigameSpec<I, R extends MinigameScore = MinigameScore> {
  id: string;
  kind: MinigameKind;
  title: string;
  generate(seed: string, difficulty: Difficulty): I;
  score(input: I, actions: PlayerAction[]): R;
}

export function clampSkill(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
