import { describe, expect, it } from 'vitest';
import { getContent, rawContent } from '../content/bundled';
import { loadContent, type Content } from '../content/load';
import { generateHold } from '../minigames/holdTimer';
import { generateSpill } from '../minigames/spillCleanup';
import { createShift } from './engine';
import type { Difficulty, ScheduledArrival } from './types';

const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];
const content = getContent();

/** Nội dung mà mọi mẫu đều có đúng lỗi `defects` (bỏ kịch bản và sự kiện để không nhiễu). */
function forced(dayId: string, defects: Record<string, number>): Content {
  const raw = structuredClone(rawContent);
  const day = raw.days.find((d) => d.id === dayId)!;
  day.scripted = [];
  day.events = [];
  day.defects = defects as never;
  return loadContent(raw);
}

function arrivals(c: Content, dayId: string, seed: string, difficulty: Difficulty): ScheduledArrival[] {
  return createShift({ content: c, dayId, seed, difficulty }).state.scheduled.filter(
    (x): x is ScheduledArrival => x.kind === 'arrival',
  );
}

const given = (name: string) => name.split(' ').pop()!;

describe('núm vặn độ khó trong content (GDD 13.1)', () => {
  const lv = content.difficulty.levels;

  it('tốc độ đồng hồ 0,6 / 1 / 1,2 và Niềm tin tối thiểu 30 / 0 / 0', () => {
    expect(LEVELS.map((d) => lv[d].clockSpeed)).toEqual([0.6, 1, 1.2]);
    expect(LEVELS.map((d) => lv[d].minTrust)).toEqual([30, 0, 0]);
    for (const d of LEVELS) {
      const s = createShift({ content, dayId: 'ch1-d1', seed: 'x', difficulty: d }).state;
      expect(s.minTrust).toBe(lv[d].minTrust);
    }
  });

  it('chỉ mức Dễ có gợi ý; luật nâng cao: Dễ không, Thường một phần, Khó đủ', () => {
    expect(LEVELS.map((d) => lv[d].hints)).toEqual([true, false, false]);
    expect(LEVELS.map((d) => lv[d].advancedWestgard.length)).toEqual([0, 1, 2]);
  });

  it('lỗi tinh vi tăng dần từ Dễ tới Khó trong mọi núm', () => {
    const keys = ['codeOneDigit', 'yearOffByOne', 'nameLookalike'] as const;
    for (const k of keys) {
      expect(lv.easy.subtle[k], k).toBeLessThan(lv.normal.subtle[k]);
      expect(lv.normal.subtle[k], k).toBeLessThan(lv.hard.subtle[k]);
    }
    const mildShare = (d: Difficulty) => {
      const w = lv[d].subtle.hemolysisWeights;
      return w[0] / (w[0] + w[1] + w[2]);
    };
    expect(mildShare('easy')).toBeLessThan(mildShare('normal'));
    expect(mildShare('normal')).toBeLessThan(mildShare('hard'));
  });

  it('mini-game: vùng giữ hẹp dần, bước bẫy tăng dần theo mức', () => {
    const widths = LEVELS.map((d) => {
      const [lo, hi] = generateHold('seed', d).zone;
      return hi - lo;
    });
    expect(widths[0]!).toBeGreaterThan(widths[1]!);
    expect(widths[1]!).toBeGreaterThan(widths[2]!);
    expect(LEVELS.map((d) => generateSpill('seed', d).steps.filter((s) => s.trap).length)).toEqual([0, 1, 2]);
  });
});

describe('lỗi nhãn tinh vi theo mức độ khó', () => {
  const c = forced('ch0-d1', { labelMismatch: 1 });
  const seeds = Array.from({ length: 40 }, (_, i) => `subtle-${i}`);

  /** Tỉ lệ lỗi tinh vi của từng trường nhãn ở mức `d` trên cùng các hạt giống. */
  function shares(d: Difficulty) {
    const n = { code: [0, 0], year: [0, 0], name: [0, 0] };
    for (const seed of seeds) {
      for (const a of arrivals(c, 'ch0-d1', seed, d)) {
        const label = a.sample.label!;
        const p = a.patient!;
        if (label.name !== p.name) {
          n.name[1]!++;
          const pair = c.names.lookalike.some(
            ([x, y]) => [x, y].includes(given(p.name)) && [x, y].includes(given(label.name)),
          );
          if (pair) n.name[0]!++;
        } else if (label.birthYear !== p.birthYear) {
          n.year[1]!++;
          if (Math.abs(label.birthYear - p.birthYear) === 1) n.year[0]!++;
        } else {
          n.code[1]!++;
          const diff = [...label.patientCode].filter((ch, i) => ch !== p.code[i]).length;
          if (diff === 1) n.code[0]!++;
        }
      }
    }
    return {
      code: n.code[0]! / n.code[1]!,
      year: n.year[0]! / n.year[1]!,
      name: n.name[0]! / n.name[1]!,
      counts: [n.code[1]!, n.year[1]!, n.name[1]!],
    };
  }

  it('cùng hạt giống: Dễ < Thường < Khó về tỉ lệ sai 1 chữ số, lệch 1 năm, tên gần giống', () => {
    type Shares = ReturnType<typeof shares>;
    const [easy, normal, hard] = LEVELS.map(shares) as [Shares, Shares, Shares];
    for (const r of [easy, normal, hard]) for (const n of r.counts) expect(n).toBeGreaterThan(40);
    for (const k of ['code', 'year', 'name'] as const) {
      expect(easy[k], `${k} Dễ < Thường`).toBeLessThan(normal[k]);
      expect(normal[k], `${k} Thường < Khó`).toBeLessThan(hard[k]);
    }
    expect(hard.code).toBe(1);
    expect(easy.name).toBe(0);
  });

  it('đổi mức không đổi dãy mẫu: cùng bệnh nhân, phiếu và giờ tới; chỉ khác độ tinh vi của lỗi', () => {
    const base = arrivals(c, 'ch0-d1', 'same', 'normal');
    for (const d of ['easy', 'hard'] as const) {
      const other = arrivals(c, 'ch0-d1', 'same', d);
      expect(
        other.map((a) => [a.at, a.patient!.name, a.patient!.code, a.order!.tests, a.order!.priority]),
      ).toEqual(base.map((a) => [a.at, a.patient!.name, a.patient!.code, a.order!.tests, a.order!.priority]));
      expect(other.map((a) => a.sample.defects)).toEqual(base.map((a) => a.sample.defects));
    }
  });
});

describe('tan huyết nhẹ theo mức độ khó', () => {
  const c = forced('ch1-d2', { hemolysis: 1 });
  const seeds = Array.from({ length: 40 }, (_, i) => `hemo-${i}`);
  const mild = (d: Difficulty) => {
    let n = 0;
    let all = 0;
    for (const seed of seeds)
      for (const a of arrivals(c, 'ch1-d2', seed, d)) {
        const h = a.sample.defects.find((x) => x.kind === 'hemolysis');
        if (!h) continue;
        all++;
        if (h.level === 1) n++;
      }
    return n / all;
  };
  it('tỉ lệ mẫu tan huyết mức 1 (khó thấy) tăng từ Dễ tới Khó', () => {
    const [easy, normal, hard] = LEVELS.map(mild) as [number, number, number];
    expect(easy).toBeLessThan(normal);
    expect(normal).toBeLessThan(hard);
  });
});

describe('gợi ý ống cần dùng ở mức Dễ (GDD 5.1)', () => {
  it('mọi phiếu của ngày 0.2 (nhiều loại lọ) có ống/lọ cần dùng hợp lệ để hiện gợi ý', () => {
    const containers = new Map(content.containers.map((x) => [x.id, x]));
    const kinds = new Set<string>();
    for (let i = 0; i < 10; i++)
      for (const a of arrivals(content, 'ch0-d2', `hint-${i}`, 'easy')) {
        const need = containers.get(a.order!.container);
        expect(need, a.order!.container).toBeDefined();
        expect(need!.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(need!.name.length).toBeGreaterThan(0);
        kinds.add(need!.kind);
      }
    // Ngày 0.2 có ống máu, lọ, que tăm bông: gợi ý phải phân biệt được các dạng này.
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });
});
