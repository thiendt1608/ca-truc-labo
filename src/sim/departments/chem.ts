import type { Content } from '../content/load';
import type { RejectReason } from '../content/schema';
import { changeTrust, newId, recordMistake, tip, unlocked, type Ctx } from '../core/context';
import { makeSample } from '../core/generator';
import { measure } from '../core/results';
import type { ChemState, Command, Order, Sample } from '../core/types';
import { startMinigame } from '../core/minigameHost';
import { handleQc, qcBias, qcBlocksAnalyzer, wrongPassDetail } from './chemQc';
import { expectedReception } from './reception';

/**
 * Module Hoá sinh (04a mục 1): ly tâm + cân bằng → khay sau ly tâm → máy hoá sinh → màn Kết quả.
 */

export function initChem(content: Content): ChemState {
  return {
    centrifuge: {
      slots: Array.from({ length: content.chemRules.centrifuge.slots }, () => null),
      running: false,
      endsAt: 0,
      unbalanced: false,
      contaminated: false,
    },
    analyzer: { queue: [], current: null },
    qc: null,
  };
}

/** Rổ ly tâm cân bằng khi mọi ô có ống thì ô đối diện cũng có ống (ống nước tính là ống). */
export function isBalanced(slots: readonly (string | null)[]): boolean {
  const half = slots.length / 2;
  for (let i = 0; i < half; i++) {
    if ((slots[i] === null) !== (slots[i + half] === null)) return false;
  }
  return true;
}

/** Điểm Tay nghề cho một lần cân bằng: đúng → 100, trừ khi dùng thừa ống nước. */
export function balanceSkill(slots: readonly (string | null)[]): number {
  if (!isBalanced(slots)) return 0;
  const tubes = slots.filter((x) => x !== null && x !== 'water').length;
  const water = slots.filter((x) => x === 'water').length;
  const extra = Math.max(0, water - (tubes % 2));
  return Math.max(70, 100 - 10 * extra);
}

/** Sau ly tâm: quyết định đúng cho mẫu dựa trên tan huyết / đục / vàng. */
export type PostSpinAction = 'load' | 'highSpeedSpin' | { reject: RejectReason };

export function expectedPostSpin(content: Content, sample: Sample, order: Order): PostSpinAction {
  const rules = content.chemRules;
  const hemo = sample.defects.find((d) => d.kind === 'hemolysis');
  if (hemo) {
    const affected = rules.hemolysisAffects[String(hemo.level) as '1' | '2' | '3'];
    const analytes = order.tests.flatMap(
      (code) => content.chemTestByCode.get(code)?.analytes.map((a) => a.code) ?? [],
    );
    if (affected.includes('*') || analytes.some((a) => affected.includes(a)))
      return { reject: rules.hemolysis.reason };
  }
  if (sample.defects.some((d) => d.kind === 'lipemia')) return 'highSpeedSpin';
  return 'load';
}

function chem(ctx: Ctx): ChemState {
  if (!ctx.s.chem) throw new Error('Phòng hiện tại không phải Hoá sinh');
  return ctx.s.chem;
}

function invalid(ctx: Ctx, message: string): true {
  ctx.events.push({ type: 'invalidCommand', message });
  return true;
}

function moveSample(ctx: Ctx, sample: Sample, to: Sample['status']) {
  sample.status = to;
  ctx.events.push({ type: 'sampleMoved', sampleId: sample.id, to });
}

/** Mẫu bị từ chối/huỷ ở khoa → điều dưỡng lấy lại, mẫu mới tới sau một lúc (không lỗi). */
export function scheduleRecollect(ctx: Ctx, order: Order) {
  const patient = ctx.s.patients[order.patientId];
  if (!patient) return;
  const at = ctx.s.clock + ctx.content.chemRules.recollectSeconds;
  if (at >= ctx.s.duration) {
    order.status = 'cancelled';
    return;
  }
  order.status = 'cancelled';
  const next: Order = {
    ...order,
    status: 'waiting',
    sampleId: newId(ctx, 's'),
    results: undefined,
    hil: undefined,
  };
  next.createdAt = at;
  next.deadline = at + (order.priority === 'stat' ? ctx.day.tat.stat : ctx.day.tat.routine);
  next.lateCharged = false;
  const sample = makeSample(ctx, next, patient, [], at);
  ctx.s.scheduled.push({ at, kind: 'arrival', sample, order: next });
  ctx.s.scheduled.sort((a, b) => a.at - b.at);
}

export function onTrayDecision(ctx: Ctx, sample: Sample, decision: 'accept' | 'reject' | 'contact') {
  const order = ctx.s.orders[sample.orderId]!;
  if (decision === 'accept') {
    const container = ctx.content.containers.find((c) => c.id === sample.container);
    moveSample(ctx, sample, container?.spin === false ? 'spun' : 'bench');
  } else if (decision === 'reject') {
    moveSample(ctx, sample, 'rejected');
    scheduleRecollect(ctx, order);
  } else {
    moveSample(ctx, sample, 'contacted');
  }
}

export function handleChem(ctx: Ctx, cmd: Command): boolean {
  const { s } = ctx;
  switch (cmd.type) {
    case 'chem/placeTube': {
      const c = chem(ctx).centrifuge;
      if (c.running || c.contaminated) return invalid(ctx, 'Máy ly tâm đang bận.');
      if (cmd.slot < 0 || cmd.slot >= c.slots.length || c.slots[cmd.slot] !== null)
        return invalid(ctx, 'Ô này đã có ống.');
      if (cmd.content !== 'water') {
        const sample = s.samples[cmd.content];
        if (!sample || sample.status !== 'bench') return invalid(ctx, 'Ống không ở bàn chờ ly tâm.');
        moveSample(ctx, sample, 'centrifuge');
      }
      c.slots[cmd.slot] = cmd.content;
      return true;
    }
    case 'chem/clearSlot': {
      const c = chem(ctx).centrifuge;
      if (c.running) return invalid(ctx, 'Máy ly tâm đang chạy.');
      const content = c.slots[cmd.slot];
      if (content && content !== 'water') {
        const sample = s.samples[content];
        if (sample) moveSample(ctx, sample, 'bench');
      }
      c.slots[cmd.slot] = null;
      return true;
    }
    case 'startCentrifuge': {
      const c = chem(ctx).centrifuge;
      if (c.running || c.contaminated) return invalid(ctx, 'Máy ly tâm đang bận.');
      if (!c.slots.some((x) => x !== null && x !== 'water')) return invalid(ctx, 'Chưa có ống mẫu nào.');
      const balanced = isBalanced(c.slots);
      c.running = true;
      c.unbalanced = !balanced;
      const rules = ctx.content.chemRules.centrifuge;
      c.endsAt = s.clock + (balanced ? rules.spinSeconds : rules.abortAfterSeconds);
      s.skills.push({ source: 'centrifugeBalance', skill: balanceSkill(c.slots) });
      return true;
    }
    case 'chem/loadAnalyzer': {
      const sample = s.samples[cmd.sampleId];
      if (!sample || sample.status !== 'spun') return invalid(ctx, 'Ống chưa sẵn sàng để nạp máy.');
      const order = s.orders[sample.orderId]!;
      if (unlocked(ctx, 'postSpinCheck')) {
        const exp = expectedPostSpin(ctx.content, sample, order);
        s.decisions.total++;
        if (exp === 'load') s.decisions.correct++;
        else {
          const rule =
            exp === 'highSpeedSpin' ? ctx.content.chemRules.lipemia : ctx.content.chemRules.hemolysis;
          recordMistake(ctx, {
            kind: exp === 'highSpeedSpin' ? 'loadedLipemic' : 'loadedHemolyzed',
            explanationKey: rule.explanationKey,
            codex: rule.codex,
            trustDelta: 0,
            safetyPenalty: 0,
            sampleId: sample.id,
            orderId: order.id,
          });
        }
      }
      moveSample(ctx, sample, 'analyzer');
      order.status = 'running';
      chem(ctx).analyzer.queue.push(order.id);
      return true;
    }
    case 'chem/highSpeedSpin': {
      const sample = s.samples[cmd.sampleId];
      if (!sample || sample.status !== 'spun') return invalid(ctx, 'Ống chưa sẵn sàng.');
      const lipemic = sample.defects.some((d) => d.kind === 'lipemia');
      s.decisions.total++;
      if (lipemic) {
        s.decisions.correct++;
        sample.defects = sample.defects.filter((d) => d.kind !== 'lipemia');
      }
      return true;
    }
    case 'prioritize': {
      const q = chem(ctx).analyzer.queue;
      const i = q.indexOf(cmd.orderId);
      if (i > 0) {
        q.splice(i, 1);
        q.unshift(cmd.orderId);
      }
      return true;
    }
    case 'releaseOrder':
      releaseOrder(ctx, cmd.orderId);
      return true;
    case 'rerunOrder': {
      const order = s.orders[cmd.orderId];
      if (!order || order.status !== 'resulted') return invalid(ctx, 'Phiếu chưa có kết quả.');
      order.status = 'running';
      order.results = undefined;
      chem(ctx).analyzer.queue.push(order.id);
      return true;
    }
    case 'cancelOrderRecollect': {
      const order = s.orders[cmd.orderId];
      if (!order || order.status !== 'resulted') return invalid(ctx, 'Phiếu chưa có kết quả.');
      const sample = s.samples[order.sampleId]!;
      const bad = sampleProblem(ctx, sample, order) !== null;
      s.decisions.total++;
      if (bad) s.decisions.correct++;
      else
        recordMistake(ctx, {
          kind: 'cancelGood',
          explanationKey: 'rule.goodSample',
          trustDelta: -3,
          safetyPenalty: 0,
          orderId: order.id,
        });
      scheduleRecollect(ctx, order);
      return true;
    }
    case 'callCritical': {
      const order = s.orders[cmd.orderId];
      if (!order?.results?.some((r) => r.critical))
        return invalid(ctx, 'Phiếu này không có giá trị nguy hiểm.');
      order.criticalCalled = true;
      return true;
    }
    default:
      return handleQc(ctx, cmd);
  }
}

/** Lỗi khiến kết quả của mẫu không đáng tin (null nếu mẫu tốt). */
function sampleProblem(ctx: Ctx, sample: Sample, order: Order) {
  const exp = expectedReception(ctx.content, sample, order);
  if (exp.decision.type !== 'accept' && exp.rule) {
    const wrongPatient = exp.rule.defect === 'noLabel' || exp.rule.defect === 'labelMismatch';
    return {
      kind: wrongPatient ? 'releaseWrongPatient' : 'releaseBadSample',
      explanationKey: wrongPatient ? 'rule.releaseWrongPatient' : 'rule.releaseBadSample',
      codex: wrongPatient ? 'ch-wrong-patient' : exp.rule.codex,
      trust: exp.rule.releaseTrust,
    };
  }
  const post = expectedPostSpin(ctx.content, sample, order);
  if (post !== 'load') {
    const rule = post === 'highSpeedSpin' ? ctx.content.chemRules.lipemia : ctx.content.chemRules.hemolysis;
    return { kind: 'releaseBadSample', explanationKey: rule.explanationKey, codex: rule.codex, trust: -15 };
  }
  return null;
}

function releaseOrder(ctx: Ctx, orderId: string) {
  const { s } = ctx;
  const order = s.orders[orderId];
  if (!order || order.status !== 'resulted') {
    invalid(ctx, 'Phiếu chưa có kết quả.');
    return;
  }
  const sample = s.samples[order.sampleId]!;
  order.status = 'released';
  order.releasedAt = s.clock;
  s.releases.total++;
  const problem = sampleProblem(ctx, sample, order);
  if (problem) {
    recordMistake(ctx, {
      kind: problem.kind,
      explanationKey: problem.explanationKey,
      codex: problem.codex,
      trustDelta: problem.trust,
      safetyPenalty: -problem.trust,
      orderId,
      sampleId: sample.id,
    });
  } else if (!order.qcFault) {
    s.releases.correct++;
  }
  if (order.qcFault) {
    // Hậu quả trễ của việc báo QC đạt nhầm: mỗi phiếu trừ 5 Niềm tin, tối đa 30 (04-GDD mục 6.1).
    const qc = chem(ctx).qc!;
    qc.badReleases++;
    recordMistake(ctx, {
      kind: 'releaseQcFailed',
      explanationKey: 'rule.releaseQcFailed',
      detail: wrongPassDetail(ctx),
      codex: 'ch-qc',
      trustDelta: qc.badReleases <= 6 ? -5 : 0,
      safetyPenalty: 5,
      orderId,
      sampleId: sample.id,
    });
  }
  const onTime = s.clock <= order.deadline;
  s.timeliness.push({ id: order.id, onTime, weight: order.priority === 'stat' ? 2 : 1 });
  if (onTime && order.priority === 'stat' && !problem && !order.qcFault) changeTrust(ctx, 2);
}

/** Một giây game của phòng Hoá sinh. */
export function tickChem(ctx: Ctx) {
  const { s } = ctx;
  const st = chem(ctx);
  const c = st.centrifuge;
  if (c.running && s.clock >= c.endsAt) finishSpin(ctx, st);

  const a = st.analyzer;
  if (a.current && s.clock >= a.current.endsAt) {
    const order = s.orders[a.current.orderId]!;
    const sample = s.samples[order.sampleId]!;
    const patient = s.patients[order.patientId]!;
    order.results = measure(ctx, order, sample, patient);
    if (qcBias(ctx) !== 0) order.qcFault = true;
    order.status = 'resulted';
    order.resultedAt = s.clock;
    if (sample.status !== 'done') moveSample(ctx, sample, 'done');
    a.current = null;
    ctx.events.push({ type: 'resultReady', orderId: order.id });
    tip(ctx, 'resultReady');
    if (unlocked(ctx, 'critical') && order.results.some((r) => r.critical) && !order.criticalCalled) {
      s.scheduled.push({ at: s.clock + 900, kind: 'criticalCheck', orderId: order.id });
      s.scheduled.sort((x, y) => x.at - y.at);
    }
  }
  if (!a.current && a.queue.length > 0 && !qcBlocksAnalyzer(ctx)) {
    const orderId = a.queue.shift()!;
    a.current = { orderId, endsAt: s.clock + ctx.content.chemRules.analyzer.secondsPerSample };
  }
}

function finishSpin(ctx: Ctx, st: ChemState) {
  const { s } = ctx;
  const c = st.centrifuge;
  const sampleIds = c.slots.filter((x): x is string => x !== null && x !== 'water');
  c.running = false;
  c.slots = c.slots.map(() => null);
  if (c.unbalanced) {
    c.unbalanced = false;
    ctx.events.push({ type: 'centrifugeShake' });
    tip(ctx, 'centrifugeShake');
    recordMistake(ctx, {
      kind: 'imbalance',
      explanationKey: 'rule.imbalance',
      codex: 'ch-balance',
      trustDelta: -5,
      safetyPenalty: 5,
    });
    const broken = ctx.rng.chance(ctx.content.chemRules.centrifuge.breakChance)
      ? ctx.rng.pick(sampleIds)
      : null;
    for (const id of sampleIds) {
      const sample = s.samples[id]!;
      if (id === broken) {
        moveSample(ctx, sample, 'broken');
        ctx.events.push({ type: 'tubeBroken', sampleId: id });
        scheduleRecollect(ctx, s.orders[sample.orderId]!);
      } else {
        moveSample(ctx, sample, 'bench');
      }
    }
    if (broken) {
      c.contaminated = true;
      startMinigame(ctx, 'spillCleanup', 'spill');
    }
    return;
  }
  for (const id of sampleIds) moveSample(ctx, s.samples[id]!, 'spun');
  ctx.events.push({ type: 'centrifugeDone' });
  tip(ctx, 'centrifugeDone');
}

/** Sau mini-game dọn đổ vỡ: máy ly tâm dùng lại được. */
export function onSpillCleaned(ctx: Ctx) {
  if (ctx.s.chem) ctx.s.chem.centrifuge.contaminated = false;
}
