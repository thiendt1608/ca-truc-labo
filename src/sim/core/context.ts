import type { Content } from '../content/load';
import type { DayConfig, TipTrigger } from '../content/schema';
import { createRng, type Rng } from './rng';
import type { MistakeEntry, ShiftState, SimEvent } from './types';

/** Ngữ cảnh của một bước mô phỏng: trạng thái nháp (được phép sửa), nội dung, rng và danh sách sự kiện. */
export interface Ctx {
  s: ShiftState;
  content: Content;
  day: DayConfig;
  rng: Rng;
  events: SimEvent[];
}

export function makeCtx(state: ShiftState, content: Content): Ctx {
  const s = structuredClone(state);
  const day = content.dayById.get(s.dayId);
  if (!day) throw new Error(`Không tìm thấy ngày ${s.dayId}`);
  return { s, content, day, rng: createRng(s.rngState), events: [] };
}

export function finishCtx(ctx: Ctx) {
  ctx.s.rngState = ctx.rng.state();
  return { state: ctx.s, events: ctx.events };
}

export function newId(ctx: Ctx, prefix: string): string {
  ctx.s.nextId += 1;
  return `${prefix}${ctx.s.nextId}`;
}

export function unlocked(ctx: Ctx, flag: DayConfig['unlocks'][number]): boolean {
  return ctx.day.unlocks.includes(flag);
}

export function changeTrust(ctx: Ctx, delta: number) {
  if (delta === 0) return;
  const before = ctx.s.trust;
  ctx.s.trust = Math.max(ctx.s.minTrust, Math.min(100, before + delta));
  const applied = ctx.s.trust - before;
  if (applied !== 0) ctx.events.push({ type: 'trustChanged', delta: applied, trust: ctx.s.trust });
  if (ctx.s.trust <= 0 && !ctx.s.ended) {
    ctx.s.ended = { reason: 'trust', at: ctx.s.clock };
    ctx.events.push({ type: 'shiftEnded', reason: 'trust' });
  }
}

export function unlockCodex(ctx: Ctx, cardId: string | undefined) {
  if (!cardId || ctx.s.codexUnlocked.includes(cardId)) return;
  ctx.s.codexUnlocked.push(cardId);
  ctx.events.push({ type: 'codexUnlocked', cardId });
}

export function recordMistake(ctx: Ctx, entry: Omit<MistakeEntry, 't'>) {
  const full: MistakeEntry = { t: ctx.s.clock, ...entry };
  ctx.s.ledger.push(full);
  ctx.events.push({ type: 'mistakeRecorded', entry: full });
  unlockCodex(ctx, entry.codex);
  tip(ctx, 'mistake');
  changeTrust(ctx, entry.trustDelta);
}

export function tip(ctx: Ctx, trigger: TipTrigger) {
  if (ctx.s.tipsShown.includes(trigger)) return;
  if (!ctx.day.tips.some((t) => t.trigger === trigger)) return;
  ctx.s.tipsShown.push(trigger);
  ctx.events.push({ type: 'tip', trigger });
}
