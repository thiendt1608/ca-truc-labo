import { describe, expect, it } from 'vitest';
import { perfectSpillActions, runBot } from '../bots/bots';
import { getContent } from '../content/bundled';
import { routableDepts } from '../content/load';
import { advance, applyCommand, createShift, hashState, replay } from '../core/engine';
import { computeReport } from '../core/scoring';
import type { Command, Sample, ShiftState } from '../core/types';
import { expectedReception } from './reception';

const content = getContent();

/**
 * Ca ở Tiếp nhận chạy tới cuối giờ để mọi mẫu đã nằm trong khay. Sổ lỗi và Niềm tin được đặt lại để test
 * chỉ thấy hậu quả của đúng lệnh vừa gửi (việc để khay trống đã bị tính trễ).
 */
function fullTray(dayId: string, seed: string): ShiftState {
  const { state } = createShift({ content, dayId, seed, difficulty: 'normal' });
  const s = advance(state, state.duration - 1, content).state;
  return { ...s, ledger: [], trust: 70, ended: null, decisions: { correct: 0, total: 0 }, timeliness: [] };
}

type CommandInput = Command extends infer C ? (C extends Command ? Omit<C, 't'> : never) : never;
const run = (s: ShiftState, cmd: CommandInput) => applyCommand(s, { t: s.clock, ...cmd } as Command, content);

const orderTypeOf = (s: ShiftState, sample: Sample) => {
  const order = s.orders[sample.orderId]!;
  return content.orderTypes.find(
    (o) => o.dept === order.dept && order.tests.every((t) => o.testsFrom.includes(t)),
  )!;
};

describe('thứ tự ngày và chuyển khoa', () => {
  it('ngày 0.2, 0.3 nằm ngay sau 0.1 (Home và nút "Ngày tiếp" đi theo thứ tự này)', () => {
    expect(content.days.slice(0, 3).map((d) => d.id)).toEqual(['ch0-d1', 'ch0-d2', 'ch0-d3']);
  });

  it('0.1 chỉ chuyển Hoá sinh/Huyết học; 0.2 trở đi chuyển đủ 5 khoa', () => {
    expect(routableDepts(content.dayById.get('ch0-d1')!)).toEqual(['chem', 'heme']);
    for (const id of ['ch0-d2', 'ch0-d3'])
      expect(routableDepts(content.dayById.get(id)!)).toEqual(['chem', 'heme', 'micro', 'immuno', 'patho']);
  });

  it('khoa chuyển tới đúng theo loại phiếu: Hoá sinh, Huyết học, Vi sinh, Miễn dịch, Giải phẫu bệnh', () => {
    const seen = new Set<string>();
    for (const day of ['ch0-d2', 'ch0-d3']) {
      const s = fullTray(day, 'route');
      for (const sample of Object.values(s.samples)) {
        const order = s.orders[sample.orderId]!;
        if (sample.defects.length > 0) continue;
        expect(expectedReception(content, sample, order).decision).toEqual({
          type: 'accept',
          target: order.dept,
        });
        seen.add(order.dept);
      }
    }
    expect([...seen].sort()).toEqual(['chem', 'heme', 'immuno', 'micro', 'patho']);
  });

  it('0.1 không cho chuyển tới khoa chưa mở', () => {
    const s = fullTray('ch0-d1', 'closed');
    const sample = Object.values(s.samples)[0]!;
    const r = run(s, { type: 'acceptSample', sampleId: sample.id, target: 'micro' });
    expect(r.events.some((e) => e.type === 'invalidCommand')).toBe(true);
    expect(r.state.samples[sample.id]!.status).toBe('tray');
  });

  it('chuyển nhầm khoa bị trừ Niềm tin và mở thẻ "Chuyển mẫu đúng khoa"', () => {
    const s = fullTray('ch0-d2', 'wrong');
    const sample = Object.values(s.samples).find((x) => x.defects.length === 0)!;
    const order = s.orders[sample.orderId]!;
    const target = order.dept === 'patho' ? 'chem' : 'patho';
    const r = run(s, { type: 'acceptSample', sampleId: sample.id, target });
    expect(r.state.ledger.at(-1)).toMatchObject({ kind: 'wrongRoute', codex: 'rc-routing' });
    expect(r.state.codexUnlocked).toContain('rc-routing');
  });
});

describe('mẫu để quá giờ theo loại lọ', () => {
  const delayedOf = (s: ShiftState, container: string) =>
    Object.values(s.samples).find(
      (x) => x.container === container && x.defects.some((d) => d.kind === 'delayed'),
    );

  it('0.2 có lọ nước tiểu để quá giờ (kịch bản): từ chối vì thời gian, giải thích riêng theo lọ', () => {
    const s = fullTray('ch0-d2', 'time');
    const cup = delayedOf(s, 'urine')!;
    expect(cup).toBeDefined();
    const exp = expectedReception(content, cup, s.orders[cup.orderId]!);
    expect(exp.decision).toEqual({ type: 'reject', reason: 'time' });
    expect(exp.rule).toMatchObject({ explanationKey: 'rule.time.urine', codex: 'rc-cup-urine' });
    // Người chơi thấy giờ lấy mẫu cũ hơn 2 giờ.
    expect(s.dayStart + cup.arrivedAt - cup.label!.collectedAt).toBeGreaterThan(120 * 60);
  });

  it('ống xám Glucose để quá giờ vẫn nhận (ngoại lệ)', () => {
    const s = fullTray('ch0-d2', 'time');
    const grey = delayedOf(s, 'grey')!;
    expect(grey).toBeDefined();
    expect(expectedReception(content, grey, s.orders[grey.orderId]!).decision.type).toBe('accept');
  });

  it('lọ mô không nhạy với thời gian nên để lâu vẫn nhận', () => {
    const s = fullTray('ch0-d2', 'time');
    const tissue = Object.values(s.samples).find((x) => x.container === 'tissue')!;
    const delayed: Sample = { ...tissue, defects: [{ kind: 'delayed' }] };
    expect(expectedReception(content, delayed, s.orders[tissue.orderId]!).decision.type).toBe('accept');
  });

  it.each([
    ['stool', 'rule.time.stool', 'rc-stool'],
    ['swab', 'rule.time.swab', 'rc-swab'],
    ['bloodculture', 'rule.time.bloodculture', 'rc-bloodculture'],
  ])('%s để quá giờ → từ chối, giải thích %s', (container, key, codex) => {
    const s = fullTray('ch0-d2', 'time');
    const base =
      Object.values(s.samples).find((x) => x.container === container) ?? Object.values(s.samples)[0]!;
    const orderType = content.orderTypes.find((o) => o.container.routine === container)!;
    const order = {
      ...s.orders[base.orderId]!,
      tests: [orderType.testsFrom[0]!],
      dept: orderType.dept,
      container: container as Sample['container'],
    };
    const sample: Sample = {
      ...base,
      container: container as Sample['container'],
      defects: [{ kind: 'delayed' }],
    };
    const exp = expectedReception(content, sample, order);
    expect(exp.decision).toEqual({ type: 'reject', reason: 'time' });
    expect(exp.rule).toMatchObject({ explanationKey: key, codex });
  });
});

describe('mẫu không lấy lại được (Liên hệ)', () => {
  it('0.2: bệnh phẩm không lấy lại được luôn nguyên vẹn vì chưa mở Liên hệ', () => {
    for (let i = 0; i < 4; i++) {
      const s = fullTray('ch0-d2', `intact-${i}`);
      const tissues = Object.values(s.samples).filter((x) => x.container === 'tissue');
      expect(tissues.length).toBeGreaterThan(0);
      for (const t of tissues) {
        expect(t.irreplaceable).toBe(true);
        expect(t.defects).toEqual([]);
      }
    }
  });

  it('0.3: lọ mô có lỗi → quyết định đúng là Liên hệ, không phải từ chối', () => {
    const s = fullTray('ch0-d3', 'contact');
    const bad = Object.values(s.samples).filter((x) => x.irreplaceable && x.defects.length > 0);
    expect(bad.length).toBeGreaterThanOrEqual(3);
    for (const sample of bad)
      expect(expectedReception(content, sample, s.orders[sample.orderId]!).decision).toEqual({
        type: 'contact',
      });
  });

  it('Liên hệ đúng: mẫu được giữ lại, không bị lỗi nào', () => {
    const s = fullTray('ch0-d3', 'contact');
    const sample = Object.values(s.samples).find(
      (x) => x.irreplaceable && x.defects.some((d) => d.kind === 'underfill'),
    )!;
    const r = run(s, { type: 'contactWard', sampleId: sample.id });
    expect(r.state.samples[sample.id]!.status).toBe('contacted');
    expect(r.state.ledger).toHaveLength(0);
    expect(r.state.decisions).toEqual({ correct: 1, total: 1 });
  });

  it('từ chối thẳng mẫu không lấy lại được: -30 Niềm tin và phạt An toàn', () => {
    const s = fullTray('ch0-d3', 'contact');
    const sample = Object.values(s.samples).find(
      (x) => x.irreplaceable && x.defects.some((d) => d.kind === 'underfill'),
    )!;
    const r = run(s, { type: 'rejectSample', sampleId: sample.id, reason: 'volume' });
    expect(r.state.ledger.at(-1)).toMatchObject({
      kind: 'rejectIrreplaceable',
      trustDelta: -30,
      safetyPenalty: 30,
      explanationKey: 'rule.irreplaceable',
      codex: 'rc-irreplaceable',
    });
    expect(r.state.trust).toBe(s.trust - 30);
  });

  it('mở lọ sinh thiết có mẹo riêng', () => {
    const s = fullTray('ch0-d3', 'contact');
    const sample = Object.values(s.samples).find((x) => x.irreplaceable)!;
    const r = run(s, { type: 'inspectSample', sampleId: sample.id });
    expect(r.events).toContainEqual({ type: 'tip', trigger: 'irreplaceable' });
  });
});

describe('lọ rò rỉ và dọn an toàn sinh học', () => {
  const leaking = (s: ShiftState, irreplaceable = false) =>
    Object.values(s.samples).find(
      (x) => x.irreplaceable === irreplaceable && x.defects.some((d) => d.kind === 'leak'),
    )!;

  it('từ chối đúng lý do "Rò rỉ" mở mini-game dọn đổ vỡ gắn với lọ đó', () => {
    const s = fullTray('ch0-d3', 'leak');
    const cup = leaking(s);
    expect(expectedReception(content, cup, s.orders[cup.orderId]!).decision).toEqual({
      type: 'reject',
      reason: 'leak',
    });
    const r = run(s, { type: 'rejectSample', sampleId: cup.id, reason: 'leak' });
    expect(r.state.ledger).toHaveLength(0);
    expect(r.state.minigame).toMatchObject({
      minigameId: 'spillCleanup',
      context: 'spill',
      sampleId: cup.id,
    });
    expect(r.events).toContainEqual({ type: 'tip', trigger: 'spill' });
  });

  it('dọn đúng quy trình: không bị trừ điểm, mini-game đóng', () => {
    const s = fullTray('ch0-d3', 'leak');
    const cup = leaking(s);
    let st = run(s, { type: 'rejectSample', sampleId: cup.id, reason: 'leak' }).state;
    const mg = st.minigame!;
    st = run(st, {
      type: 'minigameResult',
      taskId: mg.taskId,
      actions: perfectSpillActions(mg.seed, st.difficulty),
    }).state;
    expect(st.minigame).toBeNull();
    expect(st.ledger).toHaveLength(0);
    expect(st.skills.at(-1)?.source).toBe('spillCleanup');
  });

  it('dọn sai thứ tự: ghi lỗi An toàn kèm thẻ Dọn đổ vỡ', () => {
    const s = fullTray('ch0-d3', 'leak');
    const cup = leaking(s);
    let st = run(s, { type: 'rejectSample', sampleId: cup.id, reason: 'leak' }).state;
    st = run(st, {
      type: 'minigameResult',
      taskId: st.minigame!.taskId,
      actions: [
        { t: 0, type: 'tap', id: 'bin' },
        { t: 500, type: 'done' },
      ],
    }).state;
    expect(st.ledger.at(-1)).toMatchObject({ kind: 'spillWrong', codex: 'rc-spill' });
  });

  it('nhận lọ rò rỉ là lỗi nhận mẫu hỏng và không có mini-game dọn', () => {
    const s = fullTray('ch0-d3', 'leak');
    const cup = leaking(s);
    const r = run(s, { type: 'acceptSample', sampleId: cup.id, target: s.orders[cup.orderId]!.dept });
    expect(r.state.ledger.at(-1)).toMatchObject({ kind: 'accepted:leak', codex: 'rc-leak' });
    expect(r.state.minigame).toBeNull();
  });

  it('lọ mô rò rỉ: Liên hệ (không vứt) và vẫn phải dọn an toàn', () => {
    const s = fullTray('ch0-d3', 'leak');
    const jar = leaking(s, true);
    expect(jar).toBeDefined();
    expect(orderTypeOf(s, jar).id).toBe('histology');
    const r = run(s, { type: 'contactWard', sampleId: jar.id });
    expect(r.state.ledger).toHaveLength(0);
    expect(r.state.samples[jar.id]!.status).toBe('contacted');
    expect(r.state.minigame?.context).toBe('spill');
  });
});

describe('bot trên ngày 0.2 và 0.3', () => {
  it.each(['ch0-d2', 'ch0-d3'])('%s: tất định', (dayId) => {
    const r = runBot(content, dayId, 'det-2', 'novice');
    const again = replay({ content, dayId, seed: 'det-2', difficulty: 'normal' }, r.commands, true);
    expect(hashState(again)).toBe(hashState(r.state));
  });

  it.each(['ch0-d2', 'ch0-d3'])('%s: bot thành thạo ≥4 sao, bot không làm gì 1 sao', (dayId) => {
    for (let i = 0; i < 5; i++) {
      expect(computeReport(runBot(content, dayId, `e${i}`, 'expert').state).stars).toBeGreaterThanOrEqual(4);
      expect(computeReport(runBot(content, dayId, `i${i}`, 'idle').state).stars).toBe(1);
    }
  });
});
