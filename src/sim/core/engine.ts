import type { Content } from '../content/load';
import { applyTrayDecision, type Decision } from '../departments/reception';
import {
  expectedPostSpin,
  handleChem,
  initChem,
  onSpillCleaned,
  onTrayDecision,
  scheduleRecollect,
  tickChem,
} from '../departments/chem';
import { finishCtx, makeCtx, recordMistake, tip, unlockCodex, type Ctx } from './context';
import { buildSchedule } from './generator';
import { finishMinigame, startMinigame } from './minigameHost';
import { hashSeed } from './rng';
import type { Command, Difficulty, ShiftState, StepResult } from './types';

/**
 * Lõi mô phỏng: (state, command) → state' + events; advance(state, giây) → state' + events.
 * Không đọc giờ thật, không dùng Math.random: cùng hạt giống + cùng chuỗi lệnh → cùng kết quả.
 */

export interface NewShiftOptions {
  content: Content;
  dayId: string;
  seed: string;
  difficulty: Difficulty;
}

export function createShift({ content, dayId, seed, difficulty }: NewShiftOptions): StepResult {
  const day = content.dayById.get(dayId);
  if (!day) throw new Error(`Không tìm thấy ngày ${dayId}`);
  const initial: ShiftState = {
    version: 1,
    seed,
    dayId,
    room: day.room,
    difficulty,
    clock: 0,
    duration: day.end - day.start,
    dayStart: day.start,
    rngState: hashSeed(`${seed}:${dayId}`),
    trust: day.startTrust,
    minTrust: difficulty === 'easy' ? 30 : 0,
    patients: {},
    orders: {},
    samples: {},
    chem: day.room === 'chem' ? initChem(content) : null,
    scheduled: [],
    ledger: [],
    decisions: { correct: 0, total: 0 },
    releases: { correct: 0, total: 0 },
    timeliness: [],
    skills: [],
    minigame: null,
    codexUnlocked: [],
    tipsShown: [],
    nextId: 0,
    ended: null,
  };
  const ctx = makeCtx(initial, content);
  ctx.s.scheduled = buildSchedule(ctx);
  for (const id of day.codexOnStart) unlockCodex(ctx, id);
  tip(ctx, 'start');
  processDue(ctx);
  return finishCtx(ctx);
}

export function applyCommand(state: ShiftState, cmd: Command, content: Content): StepResult {
  const ctx = makeCtx(state, content);
  if (ctx.s.ended) {
    ctx.events.push({ type: 'invalidCommand', message: 'Ca đã kết thúc.' });
    return finishCtx(ctx);
  }
  handle(ctx, cmd);
  return finishCtx(ctx);
}

function handle(ctx: Ctx, cmd: Command) {
  const { s } = ctx;
  switch (cmd.type) {
    case 'inspectSample': {
      const sample = s.samples[cmd.sampleId];
      if (sample) sample.opened = true;
      tip(ctx, 'sampleOpened');
      return;
    }
    case 'acceptSample':
    case 'rejectSample':
    case 'contactWard': {
      const sample = s.samples[cmd.sampleId];
      if (!sample) return void ctx.events.push({ type: 'invalidCommand', message: 'Không có mẫu này.' });
      if (cmd.type === 'rejectSample' && sample.status === 'spun' && s.chem)
        return rejectAfterSpin(ctx, cmd.sampleId, cmd.reason);
      if (cmd.type === 'acceptSample' && s.room === 'reception' && !cmd.target)
        return void ctx.events.push({ type: 'invalidCommand', message: 'Chọn khoa để chuyển mẫu.' });
      const decision: Decision =
        cmd.type === 'acceptSample'
          ? { type: 'accept', target: cmd.target }
          : cmd.type === 'rejectSample'
            ? { type: 'reject', reason: cmd.reason }
            : { type: 'contact' };
      const verdict = applyTrayDecision(ctx, sample, decision);
      if (!verdict) return;
      if (s.room === 'reception') {
        sample.status =
          decision.type === 'accept' ? 'routed' : decision.type === 'reject' ? 'rejected' : 'contacted';
        ctx.events.push({ type: 'sampleMoved', sampleId: sample.id, to: sample.status });
      } else if (s.chem) {
        onTrayDecision(ctx, sample, decision.type);
      }
      return;
    }
    case 'minigameResult': {
      const mg = s.minigame;
      const r = finishMinigame(ctx, cmd.taskId, cmd.actions);
      if (r && mg?.context === 'spill') onSpillCleaned(ctx);
      return;
    }
    case 'debug/forceSpill':
      if (s.chem) s.chem.centrifuge.contaminated = true;
      startMinigame(ctx, 'spillCleanup', 'spill');
      return;
    case 'debug/endShift':
      s.clock = s.duration;
      endShift(ctx, 'time');
      return;
    default:
      if (s.chem && handleChem(ctx, cmd)) return;
      ctx.events.push({ type: 'invalidCommand', message: `Lệnh không dùng được ở phòng này: ${cmd.type}` });
  }
}

function rejectAfterSpin(ctx: Ctx, sampleId: string, reason: string) {
  const { s } = ctx;
  const sample = s.samples[sampleId]!;
  const order = s.orders[sample.orderId]!;
  const exp = expectedPostSpin(ctx.content, sample, order);
  s.decisions.total++;
  if (typeof exp === 'object' && exp.reject === reason) s.decisions.correct++;
  else
    recordMistake(ctx, {
      kind: 'rejectGood',
      explanationKey: 'rule.goodSample',
      trustDelta: -3,
      safetyPenalty: 0,
      sampleId,
      orderId: order.id,
    });
  sample.status = 'rejected';
  ctx.events.push({ type: 'sampleMoved', sampleId, to: 'rejected' });
  scheduleRecollect(ctx, order);
}

/** Tiến đồng hồ `seconds` giây game, từng bước 1 giây (fixed timestep). */
export function advance(state: ShiftState, seconds: number, content: Content): StepResult {
  const ctx = makeCtx(state, content);
  for (let i = 0; i < seconds && !ctx.s.ended; i++) {
    ctx.s.clock += 1;
    processDue(ctx);
    if (ctx.s.chem) tickChem(ctx);
    chargeLateness(ctx);
    if (ctx.s.clock >= ctx.s.duration) endShift(ctx, 'time');
  }
  return finishCtx(ctx);
}

function processDue(ctx: Ctx) {
  const { s } = ctx;
  while (s.scheduled.length > 0 && s.scheduled[0]!.at <= s.clock) {
    const item = s.scheduled.shift()!;
    if (item.kind === 'arrival') {
      if (item.patient) s.patients[item.patient.id] = item.patient;
      if (item.order) s.orders[item.order.id] = item.order;
      const sample = { ...item.sample, arrivedAt: s.clock };
      s.samples[sample.id] = sample;
      const order = s.orders[sample.orderId]!;
      ctx.events.push({ type: 'sampleArrived', sampleId: sample.id, priority: order.priority });
      if (order.priority === 'stat') tip(ctx, 'statArrived');
    } else if (item.kind === 'criticalCheck') {
      const order = s.orders[item.orderId];
      if (order && !order.criticalCalled) {
        recordMistake(ctx, {
          kind: 'criticalNotCalled',
          explanationKey: 'rule.criticalNotCalled',
          trustDelta: -15,
          safetyPenalty: 15,
          orderId: order.id,
        });
      }
    }
  }
}

function chargeLateness(ctx: Ctx) {
  const { s } = ctx;
  if (s.room === 'reception') {
    for (const sample of Object.values(s.samples)) {
      if (sample.status !== 'tray' || sample.lateCharged) continue;
      if (s.clock <= sample.arrivedAt + ctx.day.tat.reception) continue;
      sample.lateCharged = true;
      const stat = s.orders[sample.orderId]?.priority === 'stat';
      recordMistake(ctx, {
        kind: stat ? 'lateStat' : 'late',
        explanationKey: 'rule.late',
        codex: 'rc-stat',
        trustDelta: stat ? -5 : -1,
        safetyPenalty: 0,
        sampleId: sample.id,
      });
    }
    return;
  }
  for (const order of Object.values(s.orders)) {
    if (
      order.lateCharged ||
      order.status === 'released' ||
      order.status === 'cancelled' ||
      order.status === 'rejected'
    )
      continue;
    if (s.clock <= order.deadline) continue;
    order.lateCharged = true;
    const stat = order.priority === 'stat';
    recordMistake(ctx, {
      kind: stat ? 'lateStat' : 'late',
      explanationKey: 'rule.late',
      codex: 'rc-stat',
      trustDelta: stat ? -5 : -1,
      safetyPenalty: 0,
      orderId: order.id,
    });
  }
}

function endShift(ctx: Ctx, reason: 'time' | 'trust') {
  const { s } = ctx;
  if (s.ended) return;
  s.ended = { reason, at: s.clock };
  // Việc chưa xong mà đã trễ hẹn → tính là trễ.
  if (s.room === 'reception') {
    for (const sample of Object.values(s.samples)) {
      if (sample.status === 'tray' && sample.lateCharged) {
        s.timeliness.push({
          id: sample.id,
          onTime: false,
          weight: s.orders[sample.orderId]?.priority === 'stat' ? 2 : 1,
        });
      }
    }
  } else {
    for (const order of Object.values(s.orders)) {
      if (order.status !== 'released' && order.status !== 'cancelled' && order.lateCharged) {
        s.timeliness.push({ id: order.id, onTime: false, weight: order.priority === 'stat' ? 2 : 1 });
      }
    }
  }
  ctx.events.push({ type: 'shiftEnded', reason });
}

/** Phát lại một ca từ hạt giống + chuỗi lệnh (dùng cho test, báo lỗi, Ca thử thách). */
export function replay(opts: NewShiftOptions, commands: Command[], untilEnd = false): ShiftState {
  let { state } = createShift(opts);
  for (const cmd of commands) {
    if (cmd.t > state.clock) state = advance(state, cmd.t - state.clock, opts.content).state;
    state = applyCommand(state, cmd, opts.content).state;
  }
  if (untilEnd && !state.ended) state = advance(state, state.duration - state.clock, opts.content).state;
  return state;
}

/** Băm trạng thái (FNV-1a) để so sánh tất định. */
export function hashState(state: ShiftState): string {
  const json = JSON.stringify(state);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
