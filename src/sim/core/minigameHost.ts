import { MINIGAMES } from '../minigames';
import { newId, recordMistake, tip, type Ctx } from './context';
import type { MinigameScore } from '../minigames/types';
import type { ActiveMinigame, PlayerAction } from './types';

/** Mở mini-game: lõi sinh hạt giống; giao diện gọi spec.generate(seed) để vẽ đề. */
export function startMinigame(
  ctx: Ctx,
  minigameId: string,
  context: ActiveMinigame['context'],
  /** Đề bài gắn với một mẫu cụ thể (nước tiểu): hạt giống và mẫu. */
  bound?: { seed: string; sampleId: string },
) {
  const taskId = newId(ctx, 'mg');
  const mg: ActiveMinigame = {
    taskId,
    minigameId,
    seed: bound?.seed ?? `${ctx.s.seed}:${taskId}`,
    startedAt: ctx.s.clock,
    context,
    ...(bound ? { sampleId: bound.sampleId } : {}),
  };
  ctx.s.minigame = mg;
  ctx.events.push({ type: 'minigameStarted', minigame: mg });
  if (context === 'spill') tip(ctx, 'spill');
}

/** Chấm mini-game bằng hàm thuần của spec (lõi tự chấm, không tin điểm từ giao diện). */
export function finishMinigame(
  ctx: Ctx,
  taskId: string,
  actions: PlayerAction[],
): { skill: number; ok: boolean; detail: MinigameScore } | null {
  const mg = ctx.s.minigame;
  if (!mg || mg.taskId !== taskId) {
    ctx.events.push({ type: 'invalidCommand', message: 'Mini-game không còn mở.' });
    return null;
  }
  const spec = MINIGAMES[mg.minigameId];
  if (!spec) throw new Error(`Mini-game không tồn tại: ${mg.minigameId}`);
  const input = spec.generate(mg.seed, ctx.s.difficulty);
  const detail = spec.score(input, actions);
  const { skill, ok } = detail;
  ctx.s.skills.push({ source: mg.minigameId, skill });
  ctx.s.minigame = null;
  ctx.events.push({ type: 'minigameFinished', taskId, skill, ok });
  if (!ok && mg.context === 'spill') {
    recordMistake(ctx, {
      kind: 'spillWrong',
      explanationKey: 'rule.spillWrong',
      codex: 'rc-spill',
      trustDelta: -5,
      safetyPenalty: 10,
    });
  }
  return { skill, ok, detail };
}
