import type { Content } from '../content/load';
import { applyCommand, advance, createShift } from '../core/engine';
import { createRng, hashSeed, type Rng } from '../core/rng';
import type { Command, Difficulty, PlayerAction, ShiftState } from '../core/types';
import { expectedPostSpin, isBalanced } from '../departments/chem';
import { expectedVerdict } from '../departments/chemQc';
import type { QcRemedy } from '../content/schema';
import { expectedReception } from '../departments/reception';
import { spillCleanup } from '../minigames';

/**
 * Bot chơi headless để kiểm thử và cân bằng (07-TDD mục 6).
 * - expert: biết hết luật, làm nhanh.
 * - novice: chậm, hay sót lỗi khó thấy, đôi khi quên cân bằng máy ly tâm.
 * - idle: không làm gì.
 */
export type BotKind = 'expert' | 'novice' | 'idle';

interface BotProfile {
  /** Bot "nhìn" lại màn hình mỗi bấy nhiêu giây game. */
  thinkEvery: number;
  /** Xác suất phát hiện lỗi nhãn. */
  spotLabel: number;
  spotOther: number;
  balanceRate: number;
  /** Số việc tối đa mỗi lần nhìn (người thật không làm được mọi thứ cùng lúc). */
  actionsPerLook: number;
}

const PROFILES: Record<Exclude<BotKind, 'idle'>, BotProfile> = {
  expert: { thinkEvery: 20, spotLabel: 1, spotOther: 1, balanceRate: 1, actionsPerLook: 6 },
  novice: { thinkEvery: 60, spotLabel: 0.55, spotOther: 0.6, balanceRate: 0.75, actionsPerLook: 2 },
};

export function perfectSpillActions(seed: string, difficulty: Difficulty): PlayerAction[] {
  const input = spillCleanup.generate(seed, difficulty);
  const [lo, hi] = input.hold.zone;
  const holdMs = Math.round(input.hold.fillMs * ((lo + hi) / 2));
  return [
    { t: 0, type: 'tap', id: 'disinfect' },
    { t: 800, type: 'tap', id: 'wait' },
    { t: 1000, type: 'press' },
    { t: 1000 + holdMs, type: 'release' },
    { t: 1600 + holdMs, type: 'tap', id: 'wipe' },
    { t: 2400 + holdMs, type: 'tap', id: 'bin' },
  ];
}

/** Lệnh bot muốn gửi ở thời điểm hiện tại. */
export function botCommands(state: ShiftState, content: Content, p: BotProfile, rng: Rng): Command[] {
  const t = state.clock;
  const cmds: Command[] = [];
  if (state.minigame) {
    const actions = perfectSpillActions(state.minigame.seed, state.difficulty);
    if (p.spotOther < 1 && rng.chance(0.3))
      actions.splice(
        1,
        3,
        { t: 900, type: 'tap', id: 'wait' },
        { t: 1000, type: 'press' },
        { t: 1300, type: 'release' },
        { t: 1400, type: 'tap', id: 'wait' },
        { t: 1500, type: 'press' },
        { t: 1500 + 2500, type: 'release' },
      );
    return [{ t, type: 'minigameResult', taskId: state.minigame.taskId, actions }];
  }
  let budget = p.actionsPerLook;
  const samples = Object.values(state.samples);
  const byPriority = (ids: string[]) =>
    [...ids].sort((a, b) => {
      const pa = state.orders[state.samples[a]!.orderId]!.priority === 'stat' ? 0 : 1;
      const pb = state.orders[state.samples[b]!.orderId]!.priority === 'stat' ? 0 : 1;
      return pa - pb;
    });

  // 1) Khay: nhận / từ chối.
  for (const id of byPriority(samples.filter((s) => s.status === 'tray').map((s) => s.id))) {
    if (budget-- <= 0) break;
    const sample = state.samples[id]!;
    const order = state.orders[sample.orderId]!;
    const exp = expectedReception(content, sample, order);
    let decision = exp.decision;
    if (exp.rule) {
      const isLabel = exp.rule.defect === 'labelMismatch' || exp.rule.defect === 'noLabel';
      const spotted = exp.rule.defect === 'noLabel' || rng.chance(isLabel ? p.spotLabel : p.spotOther);
      if (!spotted) decision = { type: 'accept', target: order.dept };
    }
    if (decision.type === 'accept')
      cmds.push({ t, type: 'acceptSample', sampleId: id, target: decision.target });
    else if (decision.type === 'reject')
      cmds.push({ t, type: 'rejectSample', sampleId: id, reason: decision.reason });
    else cmds.push({ t, type: 'contactWard', sampleId: id });
  }
  if (!state.chem) return cmds;

  // 1b) QC: chạy control → phán quyết theo Westgard → khắc phục đúng hình dạng biểu đồ.
  const qc = state.chem.qc;
  if (qc && budget > 0) {
    if (qc.status === 'unchecked' && t >= qc.blockedUntil) {
      budget--;
      cmds.push({ t, type: 'chem/runQC' });
    } else if (qc.status === 'judging') {
      budget--;
      const exp = expectedVerdict(qc, state.difficulty);
      cmds.push({ t, type: 'chem/judgeQC', verdict: rng.chance(p.spotOther) ? exp : 'pass' });
    } else if (qc.status === 'failed') {
      budget--;
      const remedies = Object.keys(content.chemQc.remedies) as QcRemedy[];
      const right = qc.fault ? content.chemQc.scenarios[qc.fault]!.remedy : 'rerun';
      cmds.push({ t, type: 'chem/qcAction', action: rng.chance(p.spotOther) ? right : rng.pick(remedies) });
    }
  }

  // 2) Máy ly tâm.
  const c = state.chem.centrifuge;
  const bench = samples.filter((s) => s.status === 'bench').map((s) => s.id);
  if (!c.running && !c.contaminated && bench.length > 0 && budget-- > 0) {
    const slots: (string | null)[] = c.slots.map(() => null);
    const half = slots.length / 2;
    const tubes = byPriority(bench).slice(0, slots.length);
    tubes.forEach((id, i) => {
      const pair = Math.floor(i / 2);
      slots[i % 2 === 0 ? pair : pair + half] = id;
    });
    const balance = rng.chance(p.balanceRate);
    if (balance && !isBalanced(slots)) {
      const pair = Math.floor((tubes.length - 1) / 2);
      slots[pair + half] = 'water';
    }
    slots.forEach((content, slot) => {
      if (content) cmds.push({ t, type: 'chem/placeTube', slot, content });
    });
    cmds.push({ t, type: 'startCentrifuge', centrifugeId: 'c1' });
  }

  // 3) Khay sau ly tâm.
  for (const sample of samples.filter((s) => s.status === 'spun')) {
    if (budget-- <= 0) break;
    const exp = expectedPostSpin(content, sample, state.orders[sample.orderId]!);
    const spotted = rng.chance(p.spotOther);
    if (exp === 'load' || !spotted) cmds.push({ t, type: 'chem/loadAnalyzer', sampleId: sample.id });
    else if (exp === 'highSpeedSpin') {
      cmds.push({ t, type: 'chem/highSpeedSpin', sampleId: sample.id });
      cmds.push({ t, type: 'chem/loadAnalyzer', sampleId: sample.id });
    } else cmds.push({ t, type: 'rejectSample', sampleId: sample.id, reason: exp.reject });
  }

  // 4) Ưu tiên cấp cứu trong hàng chờ máy.
  for (const orderId of state.chem.analyzer.queue.slice(1)) {
    if (state.orders[orderId]?.priority === 'stat' && state.chem.analyzer.queue[0] !== orderId) {
      cmds.push({ t, type: 'prioritize', orderId });
      break;
    }
  }

  // 5) Kết quả.
  for (const order of Object.values(state.orders).filter((o) => o.status === 'resulted')) {
    if (budget-- <= 0) break;
    if (order.results?.some((r) => r.critical) && !order.criticalCalled)
      cmds.push({ t, type: 'callCritical', orderId: order.id });
    cmds.push({ t, type: 'releaseOrder', orderId: order.id });
  }
  return cmds;
}

export interface BotRun {
  state: ShiftState;
  commands: Command[];
}

export function runBot(
  content: Content,
  dayId: string,
  seed: string,
  kind: BotKind,
  difficulty: Difficulty = 'normal',
): BotRun {
  let { state } = createShift({ content, dayId, seed, difficulty });
  const commands: Command[] = [];
  if (kind === 'idle') {
    state = advance(state, state.duration, content).state;
    return { state, commands };
  }
  const p = PROFILES[kind];
  const rng = createRng(hashSeed(`bot:${kind}:${seed}`));
  while (!state.ended) {
    for (const cmd of botCommands(state, content, p, rng)) {
      commands.push(cmd);
      state = applyCommand(state, cmd, content).state;
    }
    // Mini-game mở giữa chừng (ống vỡ) → xử lý ngay ở lượt sau.
    if (state.minigame) continue;
    state = advance(state, p.thinkEvery, content).state;
  }
  return { state, commands };
}
