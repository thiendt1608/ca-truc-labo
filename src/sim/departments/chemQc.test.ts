import { describe, expect, it } from 'vitest';
import { runBot } from '../bots/bots';
import { getContent } from '../content/bundled';
import { advance, applyCommand, createShift, hashState, replay } from '../core/engine';
import { computeReport } from '../core/scoring';
import type { Command, ShiftState } from '../core/types';
import { expectedVerdict } from './chemQc';

const content = getContent();
const DAY = 'ch1-d3';

function start(seed: string) {
  return createShift({ content, dayId: DAY, seed, difficulty: 'normal' }).state;
}
type CommandInput = Command extends infer C ? (C extends Command ? Omit<C, 't'> : never) : never;
function run(state: ShiftState, cmd: CommandInput): ShiftState {
  return applyCommand(state, { ...cmd, t: state.clock } as Command, content).state;
}
/** Đưa một ống qua ly tâm tới khi máy hoá sinh có thể nhận. */
function spunSample(state: ShiftState): { state: ShiftState; sampleId: string } {
  let s = advance(state, 60, content).state;
  const first = Object.values(s.samples)[0]!;
  s = run(s, { type: 'acceptSample', sampleId: first.id });
  s = run(s, { type: 'chem/placeTube', slot: 0, content: first.id });
  s = run(s, { type: 'chem/placeTube', slot: 6, content: 'water' });
  s = run(s, { type: 'startCentrifuge', centrifugeId: 'c1' });
  s = advance(s, 600, content).state;
  return { state: s, sampleId: first.id };
}

describe('QC Westgard trong ca (ngày 1.3)', () => {
  it('máy không chạy mẫu bệnh nhân khi QC chưa đạt', () => {
    const { state, sampleId } = spunSample(start('gate'));
    let s = run(state, { type: 'chem/loadAnalyzer', sampleId });
    s = advance(s, 600, content).state;
    expect(s.chem!.analyzer.current).toBeNull();
    expect(s.orders[s.samples[sampleId]!.orderId]!.status).toBe('running');
  });

  it('lỗi hoá chất cho biểu đồ vi phạm 1-3s: phán quyết đúng là Không đạt', () => {
    const s = run(start('chart'), { type: 'chem/runQC' });
    expect(s.chem!.qc!.status).toBe('judging');
    expect(expectedVerdict(s.chem!.qc!, content, 'normal')).toBe('fail');
  });

  it('khắc phục đúng (thay hoá chất) rồi chạy lại control thì được Đạt và +Niềm tin', () => {
    let s = run(start('fix'), { type: 'chem/runQC' });
    s = run(s, { type: 'chem/judgeQC', verdict: 'fail' });
    const trust = s.trust;
    s = run(s, { type: 'chem/qcAction', action: 'newReagent' });
    expect(s.chem!.qc!.fault).toBeNull();
    expect(s.trust).toBe(trust + 5);
    s = advance(s, 1000, content).state;
    s = run(s, { type: 'chem/runQC' });
    expect(expectedVerdict(s.chem!.qc!, content, 'normal')).toBe('pass');
    s = run(s, { type: 'chem/judgeQC', verdict: 'pass' });
    expect(s.chem!.qc!.status).toBe('passed');
  });

  it('khắc phục sai: lỗi vẫn còn, máy bận lâu hơn, ghi lỗi', () => {
    let s = run(start('wrong'), { type: 'chem/runQC' });
    s = run(s, { type: 'chem/judgeQC', verdict: 'fail' });
    s = run(s, { type: 'chem/qcAction', action: 'calibrate' });
    expect(s.chem!.qc!.fault).toBe('reagent');
    expect(s.chem!.qc!.blockedUntil).toBeGreaterThan(s.clock);
    expect(s.ledger.at(-1)?.kind).toBe('qcWrongRemedy');
  });

  it('báo Đạt nhầm: kết quả lệch, trả phiếu bị trừ Niềm tin (hậu quả trễ)', () => {
    let s = run(start('badpass'), { type: 'chem/runQC' });
    s = run(s, { type: 'chem/judgeQC', verdict: 'pass' });
    expect(s.ledger).toHaveLength(0);
    const spun = spunSample(s);
    s = run(spun.state, { type: 'chem/loadAnalyzer', sampleId: spun.sampleId });
    s = advance(s, 400, content).state;
    const order = s.orders[s.samples[spun.sampleId]!.orderId]!;
    expect(order.status).toBe('resulted');
    expect(order.qcFault).toBe(true);
    const trust = s.trust;
    s = run(s, { type: 'releaseOrder', orderId: order.id });
    expect(s.ledger.at(-1)?.kind).toBe('releaseQcFailed');
    expect(s.ledger.at(-1)?.detail).toMatch(/1-3s.*Không đạt|Không đạt/);
    expect(s.trust).toBe(trust - 5);
  });

  it('đã báo Đạt vẫn chạy lại control được; chọn Chạy lại khi biểu đồ phải loại bị ghi lỗi', () => {
    let s = run(start('recheck'), { type: 'chem/runQC' });
    s = run(s, { type: 'chem/judgeQC', verdict: 'rerun' });
    expect(s.ledger.at(-1)?.kind).toBe('qcShouldFail');
    s = advance(s, 300, content).state;
    s = run(s, { type: 'chem/runQC' });
    s = run(s, { type: 'chem/judgeQC', verdict: 'pass' });
    expect(s.chem!.qc!.status).toBe('passed');
    s = run(s, { type: 'chem/runQC' });
    expect(s.chem!.qc!.status).toBe('judging');
  });

  it('khắc phục sai để lại ghi chú trong QC sheet tới lần chạy control kế tiếp', () => {
    let s = run(start('note'), { type: 'chem/runQC' });
    s = run(s, { type: 'chem/judgeQC', verdict: 'fail' });
    s = run(s, { type: 'chem/qcAction', action: 'newControl' });
    expect(s.chem!.qc!.note).toBe('qc.cause.reagent');
    s = advance(s, 600, content).state;
    s = run(s, { type: 'chem/runQC' });
    expect(s.chem!.qc!.note).toBeNull();
  });

  it('tất định: phát lại cùng hạt giống + lệnh cho cùng trạng thái', () => {
    const r = runBot(content, DAY, 'det', 'novice');
    const again = replay({ content, dayId: DAY, seed: 'det', difficulty: 'normal' }, r.commands, true);
    expect(hashState(again)).toBe(hashState(r.state));
  });

  it('bot thành thạo ≥4 sao, bot không làm gì 1 sao (máy bị chặn bởi QC)', () => {
    for (let i = 0; i < 5; i++) {
      expect(computeReport(runBot(content, DAY, `e${i}`, 'expert').state).stars).toBeGreaterThanOrEqual(4);
      expect(computeReport(runBot(content, DAY, `i${i}`, 'idle').state).stars).toBe(1);
    }
  });
});
