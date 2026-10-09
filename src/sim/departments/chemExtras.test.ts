import { describe, expect, it } from 'vitest';
import { runBot } from '../bots/bots';
import { getContent } from '../content/bundled';
import type { Content } from '../content/load';
import { advance, applyCommand, createShift } from '../core/engine';
import { computeReport } from '../core/scoring';
import type { Command, PlayerAction, Sample, ShiftState } from '../core/types';
import {
  correctAnswer,
  dilutionSeed,
  generateDilution,
  multiplyOptions,
  readingAt,
  scoreDilution,
  smallestRatio,
} from '../minigames/dilution';
import { generateUrine, scoreUrine } from '../minigames/urineStrip';

/** Nội dung gốc nhưng bỏ sự kiện ngẫu nhiên của ngày, để các test cơ chế không bị sự kiện chen ngang. */
const content: Content = (() => {
  const base = getContent();
  const dayById = new Map([...base.dayById].map(([id, d]) => [id, { ...d, events: [] }]));
  return { ...base, dayById };
})();
type CommandInput = Command extends infer C ? (C extends Command ? Omit<C, 't'> : never) : never;

function start(dayId: string, seed: string): ShiftState {
  return createShift({ content, dayId, seed, difficulty: 'normal' }).state;
}
function run(state: ShiftState, cmd: CommandInput): ShiftState {
  return applyCommand(state, { ...cmd, t: state.clock } as Command, content).state;
}
/** Chạy QC đúng cách cho tới khi máy được phép chạy mẫu (chỉ dùng cho ngày có QC). */
function passQc(state: ShiftState): ShiftState {
  let s = run(state, { type: 'chem/runQC' });
  const qc = () => s.chem!.qc!;
  while (qc().status !== 'passed') {
    if (qc().status === 'judging') {
      const bad = Math.max(...[qc().runs.at(-1)!.z1, qc().runs.at(-1)!.z2].map(Math.abs)) > 2;
      s = run(s, { type: 'chem/judgeQC', verdict: bad ? 'fail' : 'pass' });
    } else if (qc().status === 'failed') {
      s = run(s, { type: 'chem/qcAction', action: content.chemQc.scenarios[qc().fault!]!.remedy });
    } else {
      s = advance(s, 1900, content).state;
      s = run(s, { type: 'chem/runQC' });
    }
  }
  return advance(s, 1900, content).state;
}
/** Nhận một mẫu máu, ly tâm cân bằng, nạp máy, chờ ra kết quả. */
function toResult(state: ShiftState, sample: Sample): ShiftState {
  let s = run(state, { type: 'acceptSample', sampleId: sample.id });
  s = run(s, { type: 'chem/placeTube', slot: 0, content: sample.id });
  s = run(s, { type: 'chem/placeTube', slot: 6, content: 'water' });
  s = run(s, { type: 'startCentrifuge', centrifugeId: 'c1' });
  s = advance(s, 600, content).state;
  s = run(s, { type: 'chem/loadAnalyzer', sampleId: sample.id });
  return advance(s, 400, content).state;
}
function arrived(state: ShiftState, pick: (s: Sample, st: ShiftState) => boolean, secs = 3000) {
  const s = advance(state, secs, content).state;
  const sample = Object.values(s.samples).find((x) => x.status === 'tray' && pick(x, s))!;
  return { s, sample };
}

describe('pha loãng (ngày 1.4)', () => {
  const input = (truth: number) => generateDilution(dilutionSeed('GLU', truth), 'normal');
  const tap = (t: number, id: string): PlayerAction => ({ t, type: 'tap', id });

  it('chọn tỉ lệ nhỏ nhất đủ đưa kết quả vào dải đo, tính số máy đọc và đáp án', () => {
    expect(smallestRatio(input(60))).toBe(2); // 60/2 = 30 ≤ 35
    expect(smallestRatio(input(80))).toBe(5); // 80/2 = 40 > 35
    expect(readingAt(input(62.4), 2)).toBe(31.2);
    expect(correctAnswer(input(62.4), 2)).toBe('62.4');
    expect(multiplyOptions(input(62.4), 2)).toContain('62.4');
    expect(multiplyOptions(input(62.4), 2)).toHaveLength(3);
  });

  it('hạt giống giữ nguyên giá trị thật, nên số mini-game luôn khớp số máy kể cả sát biên làm tròn', () => {
    const edge = 78.49954321;
    expect(generateDilution(dilutionSeed('GLU', edge), 'normal').truth).toBe(edge);
    expect(readingAt(input(edge), 10)).toBe(Math.round((edge / 10) * 10) / 10);
  });

  it('chấm điểm: đúng cả hai bước 100; chọn nhỏ quá mất điểm và ghi lần chạy hụt; nhân sai mất điểm', () => {
    const i = input(80);
    const perfect = scoreDilution(i, [tap(0, 'ratio:5'), tap(1, `answer:${correctAnswer(i, 5)}`)]);
    expect(perfect).toMatchObject({ skill: 100, ok: true, wasted: 0, ratio: 5, firstRatio: 5 });

    const tooSmall = scoreDilution(i, [
      tap(0, 'ratio:2'),
      tap(1, 'ratio:5'),
      tap(2, `answer:${correctAnswer(i, 5)}`),
    ]);
    expect(tooSmall).toMatchObject({ wasted: 1, ratio: 5, ok: false });
    expect(tooSmall.skill).toBeLessThan(perfect.skill);

    const bigger = scoreDilution(i, [tap(0, 'ratio:10'), tap(1, `answer:${correctAnswer(i, 10)}`)]);
    expect(bigger.skill).toBeLessThan(100);
    expect(bigger.skill).toBeGreaterThan(tooSmall.skill);

    const wrongMul = scoreDilution(i, [
      tap(0, 'ratio:5'),
      tap(1, 'answer:1.0'),
      tap(2, `answer:${correctAnswer(i, 5)}`),
    ]);
    expect(wrongMul.multiplyWrong).toBe(1);
    expect(wrongMul.skill).toBeLessThan(100);

    expect(scoreDilution(i, []).skill).toBe(0);
  });

  /** Đưa phiếu hyperglycemia tới kết quả vượt dải và mở mini-game pha loãng. */
  function openDilution(seed: string) {
    const s0 = passQc(start('ch1-d4', seed));
    const { s, sample } = arrived(
      s0,
      (x, st) => st.patients[st.orders[x.orderId]!.patientId]!.profileId === 'hyperglycemia',
    );
    const st = toResult(s, sample);
    const order = st.orders[sample.orderId]!;
    return { st, order, sample, over: order.results!.filter((r) => r.overRange) };
  }

  it('kết quả vượt dải hiện ">", trả luôn khi chưa pha loãng bị trừ', () => {
    const { st, order, over } = openDilution('dil');
    expect(order.status).toBe('resulted');
    expect(over.length).toBeGreaterThan(0);
    expect(over[0]!.display).toMatch(/^>/);
    expect(st.tipsShown).toContain('overRange');
    expect(st.tipsShown).not.toContain('deltaFlag');
    const early = run(st, { type: 'releaseOrder', orderId: order.id });
    expect(early.ledger.some((m) => m.kind === 'releaseOverRange')).toBe(true);
  });

  it('pha loãng đúng: mini-game mở, máy chạy lại ra số thật nhân hệ số, điểm Tay nghề 100', () => {
    const { st, order, over } = openDilution('dil');
    let s = run(st, { type: 'chem/startDilution', orderId: order.id });
    expect(s.minigame?.context).toBe('dilution');
    const i = generateDilution(s.minigame!.seed, 'normal');
    const ratio = smallestRatio(i);
    s = run(s, {
      type: 'minigameResult',
      taskId: s.minigame!.taskId,
      actions: [
        tap(0, `ratio:${ratio}`),
        tap(1, `answer:${correctAnswer(i, ratio)}`),
        { t: 2, type: 'done' },
      ],
    });
    expect(s.skills.at(-1)).toEqual({ source: 'dilution', skill: 100 });
    expect(s.orders[order.id]!.status).toBe('running');
    s = advance(s, 400, content).state;
    const fixed = s.orders[order.id]!.results!.find((r) => r.code === over[0]!.code)!;
    expect(fixed.overRange).toBe(false);
    expect(fixed.dilution?.ratio).toBe(ratio);
    expect(fixed.value).toBeGreaterThan(35);
    // Số máy báo phải khớp đúng số người chơi đã thấy và nhân ở mini-game.
    expect(fixed.value).toBe(Number(correctAnswer(i, ratio)));
    s = run(s, { type: 'releaseOrder', orderId: order.id });
    expect(s.ledger.some((m) => m.kind === 'releaseOverRange')).toBe(false);
  });

  it('nhân sai hệ số bị ghi lỗi và trừ Niềm tin', () => {
    const { st, order } = openDilution('dil');
    let s = run(st, { type: 'chem/startDilution', orderId: order.id });
    const i = generateDilution(s.minigame!.seed, 'normal');
    const ratio = smallestRatio(i);
    const trust = s.trust;
    s = run(s, {
      type: 'minigameResult',
      taskId: s.minigame!.taskId,
      actions: [
        tap(0, `ratio:${ratio}`),
        tap(1, 'answer:1.0'),
        tap(2, `answer:${correctAnswer(i, ratio)}`),
        { t: 3, type: 'done' },
      ],
    });
    expect(s.ledger.at(-1)?.kind).toBe('dilutionMultiplyWrong');
    expect(s.trust).toBe(trust - 5);
  });

  it('pha loãng chưa đủ: ghi lỗi và máy chạy lâu hơn một lượt', () => {
    let tested = false;
    for (let n = 0; n < 12 && !tested; n++) {
      const { st, order } = openDilution(`dil2-${n}`);
      const base = run(st, { type: 'chem/startDilution', orderId: order.id });
      const i = generateDilution(base.minigame!.seed, 'normal');
      const ratio = smallestRatio(i);
      if (ratio === 2) continue;
      const s = run(base, {
        type: 'minigameResult',
        taskId: base.minigame!.taskId,
        actions: [
          tap(0, 'ratio:2'),
          tap(1, `ratio:${ratio}`),
          tap(2, `answer:${correctAnswer(i, ratio)}`),
          { t: 3, type: 'done' },
        ],
      });
      expect(s.ledger.some((m) => m.kind === 'dilutionTooSmall')).toBe(true);
      expect(s.orders[order.id]!.dilution?.extraSeconds).toBe(content.chemRules.analyzer.secondsPerSample);
      tested = true;
    }
    expect(tested).toBe(true);
  });
});

describe('Δ delta check (ngày 1.5)', () => {
  function withDelta() {
    const s0 = passQc(start('ch1-d5', 'delta'));
    const { s, sample } = arrived(
      s0,
      (x, st) =>
        !x.hidden.wrongPatient && !st.orders[x.orderId]!.tests.includes('UA') && x.defects.length === 0,
    );
    const order = s.orders[sample.orderId]!;
    s.patients[order.patientId]!.previous = Object.fromEntries(
      Object.keys(content.profiles.base).map((code) => [code, 0.1]),
    ); // lần trước rất khác
    return { st: toResult(s, sample), sample, order };
  }

  it('kết quả khác nhiều so với lần trước được gắn Δ kèm giá trị lần trước', () => {
    const { st, order } = withDelta();
    const results = st.orders[order.id]!.results!;
    expect(results.some((r) => r.delta?.previous !== undefined)).toBe(true);
    expect(st.tipsShown).toContain('deltaFlag');
  });

  it('trả phiếu có Δ mà chưa làm lại bị trừ; làm lại để kiểm tra rồi trả thì không', () => {
    const { st, order } = withDelta();
    const careless = run(st, { type: 'releaseOrder', orderId: order.id });
    expect(careless.ledger.some((m) => m.kind === 'releaseUnverifiedDelta')).toBe(true);

    let careful = run(st, { type: 'rerunOrder', orderId: order.id });
    careful = advance(careful, 400, content).state;
    expect(careful.orders[order.id]!.deltaChecked).toBe(true);
    careful = run(careful, { type: 'releaseOrder', orderId: order.id });
    expect(careful.ledger.some((m) => m.kind === 'releaseUnverifiedDelta')).toBe(false);
  });
});

describe('que thử nước tiểu', () => {
  it('đề bài tất định và khớp hồ sơ bệnh', () => {
    const a = generateUrine('diabetes|42', 'normal');
    expect(generateUrine('diabetes|42', 'normal')).toEqual(a);
    expect(a.truth.glucose).toBeGreaterThanOrEqual(2);
    const healthy = generateUrine('healthy|42', 'normal');
    expect(healthy.truth.glucose).toBe(0);
  });

  function perfect(seed: string, at: (readAtMs: number) => number) {
    const input = generateUrine(seed, 'normal');
    return input.pads.reduce(
      (acts, pad) => [
        ...acts,
        { t: at(pad.readAtMs), type: 'tap' as const, id: `${pad.id}:${input.truth[pad.id]}` },
      ],
      [{ t: 0, type: 'tap' as const, id: 'dip' }],
    );
  }

  it('đọc đúng và đủ thời điểm → 100; đọc đúng nhưng quá sớm → điểm thấp hơn; đọc sai → mất điểm', () => {
    const input = generateUrine('kidney|7', 'normal');
    expect(
      scoreUrine(
        input,
        perfect('kidney|7', (r) => r + 100),
      ),
    ).toMatchObject({ skill: 100, ok: true });
    const early = scoreUrine(
      input,
      perfect('kidney|7', (r) => Math.round(r * 0.3)),
    );
    expect(early.skill).toBe(55);
    expect(early.ok).toBe(true);
    const none = scoreUrine(input, [{ t: 0, type: 'tap', id: 'dip' }]);
    expect(none.skill).toBeLessThan(100);
  });

  function toUrineResult(seed: string) {
    const s0 = passQc(start('ch1-d5', seed));
    const { s, sample } = arrived(s0, (x, st) => st.orders[x.orderId]!.tests.includes('UA'), 200);
    let st = run(s, { type: 'acceptSample', sampleId: sample.id });
    expect(st.samples[sample.id]!.status).toBe('urine');
    st = run(st, { type: 'chem/startUrine', sampleId: sample.id });
    expect(st.minigame?.context).toBe('urine');
    return { st, sample };
  }

  it('đọc đúng cả que → phiếu có kết quả từ mức người chơi chọn và trả đi không bị lỗi', () => {
    const { st, sample } = toUrineResult('urA');
    const acts = perfect(sample.urineSeed!, (r) => r + 100);
    let after = run(st, { type: 'minigameResult', taskId: st.minigame!.taskId, actions: acts });
    const order = after.orders[sample.orderId]!;
    expect(order.status).toBe('resulted');
    expect(order.results).toHaveLength(10);
    after = run(after, { type: 'releaseOrder', orderId: order.id });
    expect(after.ledger.some((m) => m.kind === 'releaseWrongUrine')).toBe(false);
  });

  it('đọc nhầm bình thường/bất thường rồi trả đi bị trừ', () => {
    const { st, sample } = toUrineResult('urB');
    const truth = generateUrine(sample.urineSeed!, 'normal').truth;
    const wrong = content.chemUrine.pads.map((pad) => {
      const t = truth[pad.id]!;
      const flipped = pad.normal.includes(t) ? pad.levels.length - 1 : pad.normal[0]!;
      return { t: pad.readAtMs + 100, type: 'tap' as const, id: `${pad.id}:${flipped}` };
    });
    let after = run(st, {
      type: 'minigameResult',
      taskId: st.minigame!.taskId,
      actions: [{ t: 0, type: 'tap', id: 'dip' }, ...wrong],
    });
    after = run(after, { type: 'releaseOrder', orderId: sample.orderId });
    expect(after.ledger.some((m) => m.kind === 'releaseWrongUrine')).toBe(true);
  });
});

describe('bot trên ngày 1.4 và 1.5', () => {
  it('bot thành thạo ≥4 sao, bot không làm gì 1 sao', () => {
    for (const day of ['ch1-d4', 'ch1-d5']) {
      for (let i = 0; i < 4; i++) {
        expect(computeReport(runBot(content, day, `e${i}`, 'expert').state).stars).toBeGreaterThanOrEqual(4);
        expect(computeReport(runBot(content, day, `i${i}`, 'idle').state).stars).toBe(1);
      }
    }
  });
});

describe('ngày 1.5 luôn có phiếu Δ (mục tiêu của ngày)', () => {
  it('10 hạt giống cố định, nội dung thật (có sự kiện): bot thành thạo thấy ≥1 phiếu Δ và tip deltaFlag được bắn', () => {
    for (let i = 0; i < 10; i++) {
      const st = runBot(getContent(), 'ch1-d5', `d${i}`, 'expert').state;
      // Làm lại để kiểm tra (deltaChecked) có thể xoá cờ Δ, nên đếm cả phiếu đã kiểm Δ.
      const deltaOrders = Object.values(st.orders).filter(
        (o) => o.deltaChecked || o.results?.some((r) => r.delta),
      );
      expect(deltaOrders.length, `seed d${i}`).toBeGreaterThanOrEqual(1);
      expect(st.tipsShown, `seed d${i}`).toContain('deltaFlag');
    }
  }, 60_000); // 10 ca đầy đủ: ~7s trên runner CI, vượt mặc định 5s
});
