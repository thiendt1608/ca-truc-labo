import { describe, expect, it } from 'vitest';
import { runBot } from '../bots/bots';
import { getContent } from '../content/bundled';
import { advance, applyCommand, createShift, hashState, replay } from './engine';
import { computeReport } from './scoring';

const content = getContent();

describe('tất định', () => {
  it.each(['ch0-d1', 'ch1-d1'])('%s: cùng hạt giống + cùng lệnh → cùng trạng thái cuối', (dayId) => {
    const run = runBot(content, dayId, 'det-1', 'novice');
    const again = replay({ content, dayId, seed: 'det-1', difficulty: 'normal' }, run.commands, true);
    expect(hashState(again)).toBe(hashState(run.state));
  });
  it('hạt giống khác → ca khác', () => {
    const a = createShift({ content, dayId: 'ch1-d1', seed: 'a', difficulty: 'normal' }).state;
    const b = createShift({ content, dayId: 'ch1-d1', seed: 'b', difficulty: 'normal' }).state;
    expect(hashState(a)).not.toBe(hashState(b));
  });
});

describe('kịch bản ngày 0.1 (Tiếp nhận)', () => {
  it('mẫu đầu tiên là mẫu dễ theo kịch bản, có mẹo của người hướng dẫn', () => {
    const r = createShift({ content, dayId: 'ch0-d1', seed: 'k', difficulty: 'normal' });
    expect(r.events).toContainEqual({ type: 'tip', trigger: 'start' });
    const later = advance(r.state, 60, content).state;
    const first = Object.values(later.samples)[0]!;
    expect(first.defects).toEqual([]);
  });
  it('nhận mẫu nhãn lệch bị ghi lỗi và mở thẻ Sổ tay', () => {
    let { state } = createShift({ content, dayId: 'ch0-d1', seed: 'k', difficulty: 'normal' });
    state = advance(state, 3000, content).state;
    const bad = Object.values(state.samples).find((s) => s.defects.some((d) => d.kind === 'labelMismatch'))!;
    expect(bad).toBeDefined();
    const r = applyCommand(
      state,
      { t: state.clock, type: 'acceptSample', sampleId: bad.id, target: 'chem' },
      content,
    );
    expect(r.state.ledger.at(-1)?.kind).toBe('accepted:labelMismatch');
    expect(r.state.codexUnlocked).toContain('rc-identity');
  });
  it('bot thành thạo ≥4 sao, bot không làm gì 1 sao', () => {
    for (let i = 0; i < 5; i++) {
      expect(computeReport(runBot(content, 'ch0-d1', `e${i}`, 'expert').state).stars).toBeGreaterThanOrEqual(
        4,
      );
      expect(computeReport(runBot(content, 'ch0-d1', `i${i}`, 'idle').state).stars).toBe(1);
    }
  });
});

describe('kịch bản ngày 1.1 (Hoá sinh)', () => {
  it('ly tâm lệch cân → máy rung, ghi lỗi, ống quay về bàn hoặc vỡ', () => {
    let { state } = createShift({ content, dayId: 'ch1-d1', seed: 'lech', difficulty: 'normal' });
    state = advance(state, 60, content).state;
    const first = Object.values(state.samples)[0]!;
    state = applyCommand(state, { t: state.clock, type: 'acceptSample', sampleId: first.id }, content).state;
    state = applyCommand(
      state,
      { t: state.clock, type: 'chem/placeTube', slot: 0, content: first.id },
      content,
    ).state;
    state = applyCommand(
      state,
      { t: state.clock, type: 'startCentrifuge', centrifugeId: 'c1' },
      content,
    ).state;
    const r = advance(state, 61, content);
    expect(r.events.map((e) => e.type)).toContain('centrifugeShake');
    expect(r.state.ledger.some((m) => m.kind === 'imbalance')).toBe(true);
    expect(['bench', 'broken']).toContain(r.state.samples[first.id]!.status);
  });
  it('luồng đầy đủ: nhận → ly tâm → nạp máy → có kết quả → gửi', () => {
    let { state } = createShift({ content, dayId: 'ch1-d1', seed: 'flow', difficulty: 'normal' });
    state = advance(state, 60, content).state;
    const first = Object.values(state.samples)[0]!;
    const cmd = (c: Parameters<typeof applyCommand>[1]) => (state = applyCommand(state, c, content).state);
    cmd({ t: state.clock, type: 'acceptSample', sampleId: first.id });
    cmd({ t: state.clock, type: 'chem/placeTube', slot: 0, content: first.id });
    cmd({ t: state.clock, type: 'chem/placeTube', slot: 6, content: 'water' });
    cmd({ t: state.clock, type: 'startCentrifuge', centrifugeId: 'c1' });
    state = advance(state, 600, content).state;
    expect(state.samples[first.id]!.status).toBe('spun');
    cmd({ t: state.clock, type: 'chem/loadAnalyzer', sampleId: first.id });
    state = advance(state, 200, content).state;
    const order = state.orders[first.orderId]!;
    expect(order.status).toBe('resulted');
    expect(order.results!.map((r) => r.code)).toEqual(['GLU', 'URE', 'CRE']);
    cmd({ t: state.clock, type: 'releaseOrder', orderId: order.id });
    expect(state.releases).toEqual({ correct: 1, total: 1 });
  });
  it('bot thành thạo ≥4 sao', () => {
    for (let i = 0; i < 5; i++) {
      expect(computeReport(runBot(content, 'ch1-d1', `e${i}`, 'expert').state).stars).toBeGreaterThanOrEqual(
        4,
      );
    }
  });
});
