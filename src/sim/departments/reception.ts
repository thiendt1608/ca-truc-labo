import type { Content } from '../content/load';
import type { DeptId, RejectReason } from '../content/schema';
import { changeTrust, recordMistake, tip, type Ctx } from '../core/context';
import type { Order, Sample } from '../core/types';

/**
 * Luật tiếp nhận chung (04-GDD mục 5.2, 05 mục 1.3). Dùng ở bàn Tiếp nhận và ở khay của mọi khoa.
 * Luật đọc từ content/common/reception-rules.json, không viết rải rác.
 */

export type Decision =
  { type: 'accept'; target?: DeptId } | { type: 'reject'; reason: RejectReason } | { type: 'contact' };

export interface Expected {
  decision: Decision;
  /** Luật áp dụng (nếu mẫu có lỗi). */
  rule?: { defect: string; explanationKey: string; codex: string; releaseTrust: number };
}

/** Lỗi định danh/loại ống/thời gian... có làm mẫu phải từ chối không. */
export function expectedReception(content: Content, sample: Sample, order: Order): Expected {
  const rules = content.receptionRules;
  for (const rule of rules.defects) {
    const has = sample.defects.some((d) => d.kind === rule.defect);
    if (!has) continue;
    if (rule.defect === 'delayed' && !isTimeSensitive(content, sample, order)) continue;
    const r = {
      defect: rule.defect,
      explanationKey: rule.explanationKey,
      codex: rule.codex,
      releaseTrust: rule.releaseTrust,
    };
    if (sample.irreplaceable) {
      return {
        decision: { type: 'contact' },
        rule: { ...r, explanationKey: rules.irreplaceable.explanationKey, codex: rules.irreplaceable.codex },
      };
    }
    return { decision: { type: 'reject', reason: rule.reason }, rule: r };
  }
  return { decision: { type: 'accept', target: order.dept } };
}

/** Mẫu để lâu chỉ hỏng nếu phiếu có xét nghiệm nhạy với thời gian (Glucose ngoài ống xám, điện giải). */
export function isTimeSensitive(content: Content, sample: Sample, order: Order): boolean {
  const rules = content.receptionRules;
  return order.tests.some((code) => {
    if (!rules.timeSensitiveTests.includes(code)) return false;
    const exempt = rules.timeExemptContainers[code] ?? [];
    return !exempt.includes(sample.container);
  });
}

export interface Verdict {
  correct: boolean;
  kind: string;
  explanationKey: string;
  codex?: string;
  trustDelta: number;
  safetyPenalty: number;
}

/** Chấm một quyết định nhận/từ chối/liên hệ. `room` quyết định hậu quả tức thì hay để tới lúc trả kết quả. */
export function evaluateDecision(
  content: Content,
  sample: Sample,
  order: Order,
  decision: Decision,
  room: 'reception' | DeptId,
): Verdict {
  const exp = expectedReception(content, sample, order);
  const ok: Verdict = { correct: true, kind: 'ok', explanationKey: '', trustDelta: 0, safetyPenalty: 0 };
  const e = exp.decision;

  if (e.type === 'accept') {
    if (decision.type === 'accept') {
      if (room === 'reception' && decision.target !== e.target) {
        return {
          correct: false,
          kind: 'wrongRoute',
          explanationKey: 'rule.wrongRoute',
          trustDelta: -3,
          safetyPenalty: 0,
        };
      }
      return ok;
    }
    if (decision.type === 'contact') {
      return {
        correct: false,
        kind: 'contactNotNeeded',
        explanationKey: 'rule.contactNotNeeded',
        trustDelta: -3,
        safetyPenalty: 0,
      };
    }
    return {
      correct: false,
      kind: 'rejectGood',
      explanationKey: 'rule.goodSample',
      trustDelta: -3,
      safetyPenalty: 0,
    };
  }

  const rule = exp.rule!;
  if (e.type === 'contact') {
    if (decision.type === 'contact') return ok;
    if (decision.type === 'reject') {
      return {
        correct: false,
        kind: 'rejectIrreplaceable',
        explanationKey: rule.explanationKey,
        codex: rule.codex,
        trustDelta: -30,
        safetyPenalty: 30,
      };
    }
    return acceptedBad(rule, room);
  }

  // e.type === 'reject'
  if (decision.type === 'reject') {
    if (decision.reason === e.reason) return ok;
    return {
      correct: false,
      kind: 'wrongReason',
      explanationKey: 'rule.wrongReason',
      codex: rule.codex,
      trustDelta: 0,
      safetyPenalty: 0,
    };
  }
  if (decision.type === 'contact') {
    return {
      correct: false,
      kind: 'contactNotNeeded',
      explanationKey: 'rule.contactNotNeeded',
      codex: rule.codex,
      trustDelta: -3,
      safetyPenalty: 0,
    };
  }
  return acceptedBad(rule, room);
}

function acceptedBad(rule: NonNullable<Expected['rule']>, room: 'reception' | DeptId): Verdict {
  // Ở bàn Tiếp nhận, mẫu lỗi đi thẳng vào khoa → phạt ngay (một nửa mức "trả kết quả").
  // Ở khoa, hậu quả đến khi trả kết quả (xem chem.ts → releaseOrder).
  const trust = room === 'reception' ? Math.round(rule.releaseTrust / 2) : 0;
  return {
    correct: false,
    kind: `accepted:${rule.defect}`,
    explanationKey: rule.explanationKey,
    codex: rule.codex,
    trustDelta: trust,
    safetyPenalty: -trust,
  };
}

/** Áp dụng quyết định ở khay (dùng cho mọi phòng). Trả về verdict để phòng xử lý tiếp. */
export function applyTrayDecision(ctx: Ctx, sample: Sample, decision: Decision): Verdict | null {
  const { s } = ctx;
  const order = s.orders[sample.orderId];
  if (!order || sample.status !== 'tray') {
    ctx.events.push({ type: 'invalidCommand', message: 'Mẫu không còn ở khay.' });
    return null;
  }
  const verdict = evaluateDecision(
    ctx.content,
    sample,
    order,
    decision,
    s.room === 'reception' ? 'reception' : s.room,
  );
  sample.decidedAt = s.clock;
  s.decisions.total++;
  if (verdict.correct) s.decisions.correct++;
  else
    recordMistake(ctx, {
      kind: verdict.kind,
      explanationKey: verdict.explanationKey,
      codex: verdict.codex,
      trustDelta: verdict.trustDelta,
      safetyPenalty: verdict.safetyPenalty,
      sampleId: sample.id,
      orderId: order.id,
    });

  if (s.room === 'reception') {
    const onTime = s.clock <= sample.arrivedAt + ctx.day.tat.reception;
    s.timeliness.push({ id: sample.id, onTime, weight: order.priority === 'stat' ? 2 : 1 });
    if (verdict.correct && onTime && order.priority === 'stat') changeTrust(ctx, 2);
  }

  if (decision.type === 'accept') {
    sample.routedTo = decision.target ?? order.dept;
    tip(ctx, 'sampleAccepted');
  }
  return verdict;
}
