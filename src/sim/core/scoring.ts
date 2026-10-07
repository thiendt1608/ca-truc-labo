import type { Content } from '../content/load';
import type { MistakeEntry, ShiftState } from './types';

/** Báo cáo giao ca (04-GDD mục 6.3). Hàm thuần. */
export interface ShiftReport {
  accuracy: number;
  timeliness: number;
  safety: number;
  skill: number;
  total: number;
  stars: 1 | 2 | 3 | 4 | 5;
  budget: number;
  endReason: 'time' | 'trust';
  trust: number;
  /** "Chuyện hôm nay": 3–5 lỗi đáng nhớ nhất. */
  stories: MistakeEntry[];
  counts: { samples: number; decisions: number; releases: number; mistakes: number; statOnTime: string };
}

export const WEIGHTS = { accuracy: 0.3, timeliness: 0.2, safety: 0.35, skill: 0.15 } as const;

export function starsFor(total: number): ShiftReport['stars'] {
  if (total >= 90) return 5;
  if (total >= 75) return 4;
  if (total >= 60) return 3;
  if (total >= 40) return 2;
  return 1;
}

const pct = (n: number, d: number, empty: number) => (d === 0 ? empty : Math.round((100 * n) / d));

export function computeReport(s: ShiftState, _content?: Content): ShiftReport {
  const totalDecisions = s.decisions.total + s.releases.total;
  const accuracy = pct(s.decisions.correct + s.releases.correct, totalDecisions, 0);
  const w = s.timeliness.reduce((n, t) => n + t.weight, 0);
  const onTime = s.timeliness.reduce((n, t) => n + (t.onTime ? t.weight : 0), 0);
  const timeliness = pct(onTime, w, totalDecisions === 0 ? 0 : 100);
  const safety = Math.max(0, 100 - s.ledger.reduce((n, m) => n + m.safetyPenalty, 0));
  const skill =
    s.skills.length === 0 ? 100 : Math.round(s.skills.reduce((n, k) => n + k.skill, 0) / s.skills.length);
  const total = Math.round(
    WEIGHTS.accuracy * accuracy +
      WEIGHTS.timeliness * timeliness +
      WEIGHTS.safety * safety +
      WEIGHTS.skill * skill,
  );
  const endReason = s.ended?.reason ?? 'time';
  let stars = starsFor(total);
  if (endReason === 'trust') stars = 1;
  if (totalDecisions === 0) stars = 1;

  const seen = new Set<string>();
  const stories = [...s.ledger]
    .sort((a, b) => a.trustDelta - b.trustDelta || b.safetyPenalty - a.safetyPenalty || a.t - b.t)
    .filter((m) => {
      if (seen.has(m.kind)) return false;
      seen.add(m.kind);
      return true;
    })
    .slice(0, 5);

  const statOrders = Object.values(s.orders).filter((o) => o.priority === 'stat');
  const statDone = s.timeliness.filter((t) => t.weight === 2);
  return {
    accuracy,
    timeliness,
    safety,
    skill,
    total,
    stars,
    budget: 50 + 30 * stars,
    endReason,
    trust: s.trust,
    stories,
    counts: {
      samples: Object.keys(s.samples).length,
      decisions: s.decisions.total,
      releases: s.releases.total,
      mistakes: s.ledger.length,
      statOnTime: `${statDone.filter((t) => t.onTime).length}/${Math.max(statDone.length, statOrders.length)}`,
    },
  };
}
