import type { Content } from '../content/load';
import type { RejectReason } from '../content/schema';
import { changeTrust, newId, recordMistake, tip, unlocked, type Ctx } from '../core/context';
import type { DilutionScore } from '../minigames/dilution';
import { dilutionSeed } from '../minigames/dilution';
import type { UrineScore } from '../minigames/urineStrip';
import { generateUrine } from '../minigames/urineStrip';
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
    const urine = order.tests.includes('UA');
    moveSample(ctx, sample, urine ? 'urine' : container?.spin === false ? 'spun' : 'bench');
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
      order.results = undefined;
      order.deltaChecked = true;
      if (order.tests.includes('UA')) {
        // Nước tiểu làm lại = nhúng que mới (cùng mẫu nên cùng mức thật).
        order.status = 'waiting';
        moveSample(ctx, s.samples[order.sampleId]!, 'urine');
        return true;
      }
      order.status = 'running';
      chem(ctx).analyzer.queue.push(order.id);
      return true;
    }
    case 'chem/startUrine': {
      const sample = s.samples[cmd.sampleId];
      if (!unlocked(ctx, 'urine')) return invalid(ctx, 'Hôm nay chưa dùng que thử nước tiểu.');
      if (!sample || sample.status !== 'urine' || !sample.urineSeed)
        return invalid(ctx, 'Lọ này chưa sẵn sàng để nhúng que.');
      if (s.minigame) return invalid(ctx, 'Đang làm một thao tác khác.');
      startMinigame(ctx, 'urineStrip', 'urine', { seed: sample.urineSeed, sampleId: sample.id });
      return true;
    }
    case 'chem/startDilution': {
      const order = s.orders[cmd.orderId];
      if (!unlocked(ctx, 'dilution')) return invalid(ctx, 'Hôm nay chưa dùng pha loãng.');
      if (!order || order.status !== 'resulted') return invalid(ctx, 'Phiếu chưa có kết quả.');
      if (s.minigame) return invalid(ctx, 'Đang làm một thao tác khác.');
      const sample = s.samples[order.sampleId]!;
      const analytes = ctx.content.chemTests.flatMap((t) => t.analytes);
      // Mini-game xoay quanh chất vượt dải nặng nhất; các chất vượt dải khác dùng cùng tỉ lệ.
      const worst = (order.results ?? [])
        .filter((r) => r.overRange)
        .map((r) => ({
          code: r.code,
          ratio: (sample.hidden.truth[r.code] ?? 0) / analytes.find((a) => a.code === r.code)!.max,
        }))
        .sort((a, b) => b.ratio - a.ratio)[0];
      if (!worst) return invalid(ctx, 'Không có kết quả nào vượt dải đo.');
      startMinigame(ctx, 'dilution', 'dilution', {
        seed: dilutionSeed(worst.code, sample.hidden.truth[worst.code] ?? 0),
        orderId: order.id,
      });
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
  }
  // Chỉ tính là sai nghiêm trọng khi đọc nhầm giữa bình thường và bất thường (lệch một mức cùng loại chỉ trừ điểm Tay nghề).
  const wrongPads =
    order.tests.includes('UA') && sample.urineSeed
      ? (order.results ?? []).filter((r) => {
          const pad = ctx.content.chemUrine.pads.find((p) => p.id === r.code)!;
          const truth = generateUrine(sample.urineSeed!, s.difficulty).truth[r.code] ?? 0;
          return pad.normal.includes(r.value) !== pad.normal.includes(truth);
        })
      : [];
  const wrongUrine = wrongPads.length > 0;
  const overRange = order.results?.some((r) => r.overRange) ?? false;
  const unverifiedDelta = !order.deltaChecked && (order.results?.some((r) => r.delta) ?? false);
  if (!problem && !order.qcFault && !overRange && !unverifiedDelta && !wrongUrine) s.releases.correct++;
  if (!problem && wrongUrine) {
    recordMistake(ctx, {
      kind: 'releaseWrongUrine',
      explanationKey: 'rule.releaseWrongUrine',
      detail: ctx.content.i18n['urine.wrongPads']!.replace(
        '{pads}',
        wrongPads.map((r) => ctx.content.chemUrine.pads.find((p) => p.id === r.code)!.name).join(', '),
      ),
      codex: 'ch-urine',
      trustDelta: -5,
      safetyPenalty: 5,
      orderId,
      sampleId: sample.id,
    });
  }
  if (!problem && overRange) {
    recordMistake(ctx, {
      kind: 'releaseOverRange',
      explanationKey: 'rule.releaseOverRange',
      codex: 'ch-dilution',
      trustDelta: -5,
      safetyPenalty: 5,
      orderId,
      sampleId: sample.id,
    });
  } else if (!problem && unverifiedDelta) {
    recordMistake(ctx, {
      kind: 'releaseUnverifiedDelta',
      explanationKey: 'rule.releaseUnverifiedDelta',
      codex: 'ch-delta',
      trustDelta: -3,
      safetyPenalty: 3,
      orderId,
      sampleId: sample.id,
    });
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
  if (
    onTime &&
    order.priority === 'stat' &&
    !problem &&
    !order.qcFault &&
    !overRange &&
    !unverifiedDelta &&
    !wrongUrine
  )
    changeTrust(ctx, 2);
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
    const diluted = order.dilution;
    const fresh = measure(ctx, order, sample, patient, diluted);
    order.results = diluted
      ? (order.results ?? []).map((r) => fresh.find((f) => f.code === r.code) ?? r)
      : fresh;
    order.dilution = undefined;
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
    const extra = s.orders[orderId]?.dilution?.extraSeconds ?? 0;
    a.current = { orderId, endsAt: s.clock + ctx.content.chemRules.analyzer.secondsPerSample + extra };
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

/** Sau mini-game pha loãng: phiếu quay lại máy với tỉ lệ người chơi chọn (mỗi lần chạy hụt tốn thêm thời gian máy). */
export function onDilutionDone(ctx: Ctx, orderId: string | undefined, score: DilutionScore) {
  const order = orderId ? ctx.s.orders[orderId] : undefined;
  if (!order) return;
  const rules = ctx.content.chemRules.dilution;
  const over = (order.results ?? []).filter((r) => r.overRange).map((r) => r.code);
  const per = ctx.content.chemRules.analyzer.secondsPerSample;
  ctx.s.decisions.total++;
  if (score.firstRatio === score.smallest) ctx.s.decisions.correct++;
  if (score.wasted > 0)
    recordMistake(ctx, {
      kind: 'dilutionTooSmall',
      explanationKey: rules.explanationKey,
      codex: rules.codex,
      trustDelta: 0,
      safetyPenalty: 0,
      orderId: order.id,
    });
  if (score.multiplyWrong > 0)
    recordMistake(ctx, {
      kind: 'dilutionMultiplyWrong',
      explanationKey: 'rule.dilutionMultiplyWrong',
      codex: rules.codex,
      trustDelta: -5,
      safetyPenalty: 5,
      orderId: order.id,
    });
  order.dilution = {
    ratio: score.ratio ?? rules.ratios[rules.ratios.length - 1]!,
    codes: over,
    extraSeconds: score.wasted * per,
  };
  order.status = 'running';
  chem(ctx).analyzer.queue.push(order.id);
}

/** Sau mini-game que thử: mức người chơi đọc thành kết quả của phiếu. */
export function onUrineRead(ctx: Ctx, sampleId: string | undefined, score: UrineScore) {
  const sample = sampleId ? ctx.s.samples[sampleId] : undefined;
  const order = sample ? ctx.s.orders[sample.orderId] : undefined;
  if (!sample || !order) return;
  order.results = ctx.content.chemUrine.pads.map((pad) => {
    const level = score.reported[pad.id] ?? 0;
    return {
      code: pad.id,
      value: level,
      display: pad.levels[level]!,
      flag: pad.normal.includes(level) ? '' : 'H',
      critical: false,
      overRange: false,
    };
  });
  order.status = 'resulted';
  order.resultedAt = ctx.s.clock;
  moveSample(ctx, sample, 'done');
  ctx.events.push({ type: 'resultReady', orderId: order.id });
  tip(ctx, 'resultReady');
}

/** Sau mini-game dọn đổ vỡ: máy ly tâm dùng lại được. */
export function onSpillCleaned(ctx: Ctx) {
  if (ctx.s.chem) ctx.s.chem.centrifuge.contaminated = false;
}
