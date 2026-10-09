import { describe, expect, it } from 'vitest';
import { getContent } from '../content/bundled';
import type { Order, Sample } from '../core/types';
import { evaluateDecision, expectedReception, overAgeHint } from './reception';

const content = getContent();

function fixture(over: Partial<Sample> = {}, orderOver: Partial<Order> = {}) {
  const order: Order = {
    id: 'o1',
    patientId: 'p1',
    ward: 'Nội',
    priority: 'routine',
    tests: ['GLU', 'URE'],
    dept: 'chem',
    container: 'red',
    createdAt: 0,
    deadline: 7200,
    status: 'waiting',
    sampleId: 's1',
    ...orderOver,
  };
  const sample: Sample = {
    id: 's1',
    orderId: 'o1',
    container: 'red',
    label: { name: 'Nguyễn Văn An', birthYear: 1980, patientCode: 'BN123456', collectedAt: 0 },
    irreplaceable: false,
    defects: [],
    hidden: { truth: {}, wrongPatient: false },
    status: 'tray',
    arrivedAt: 0,
    ...over,
  };
  return { sample, order };
}

describe('tiếp nhận', () => {
  it('mẫu tốt → nhận và chuyển đúng khoa', () => {
    const { sample, order } = fixture();
    expect(expectedReception(content, sample, order).decision).toEqual({ type: 'accept', target: 'chem' });
    expect(
      evaluateDecision(content, sample, order, { type: 'accept', target: 'chem' }, 'reception').correct,
    ).toBe(true);
    const wrong = evaluateDecision(content, sample, order, { type: 'accept', target: 'heme' }, 'reception');
    expect(wrong.kind).toBe('wrongRoute');
  });

  it('nhãn lệch → từ chối vì định danh; nhận nhầm ở bàn Tiếp nhận bị trừ Niềm tin ngay', () => {
    const { sample, order } = fixture({ defects: [{ kind: 'labelMismatch', field: 'birthYear' }] });
    expect(expectedReception(content, sample, order).decision).toEqual({
      type: 'reject',
      reason: 'identity',
    });
    const v = evaluateDecision(content, sample, order, { type: 'accept', target: 'chem' }, 'reception');
    expect(v.correct).toBe(false);
    expect(v.trustDelta).toBeLessThan(0);
    // Ở khoa: hậu quả để tới lúc trả kết quả.
    expect(evaluateDecision(content, sample, order, { type: 'accept' }, 'chem').trustDelta).toBe(0);
  });

  it('từ chối mẫu tốt bị trừ 3; từ chối đúng nhưng sai lý do không trừ Niềm tin', () => {
    const good = fixture();
    expect(
      evaluateDecision(content, good.sample, good.order, { type: 'reject', reason: 'identity' }, 'chem')
        .trustDelta,
    ).toBe(-3);
    const bad = fixture({ label: null, defects: [{ kind: 'noLabel' }] });
    const v = evaluateDecision(content, bad.sample, bad.order, { type: 'reject', reason: 'volume' }, 'chem');
    expect(v).toMatchObject({ correct: false, kind: 'wrongReason', trustDelta: 0 });
  });

  it('để quá giờ chỉ từ chối khi có Glucose ngoài ống xám hoặc điện giải', () => {
    const delayed = [{ kind: 'delayed' as const }];
    const a = fixture({ defects: delayed });
    expect(expectedReception(content, a.sample, a.order).decision.type).toBe('reject');
    const grey = fixture({ defects: delayed, container: 'grey' }, { tests: ['GLU'], container: 'grey' });
    expect(expectedReception(content, grey.sample, grey.order).decision.type).toBe('accept');
    const lipid = fixture({ defects: delayed }, { tests: ['CHOL'] });
    expect(expectedReception(content, lipid.sample, lipid.order).decision.type).toBe('accept');
  });

  it('mẫu không lấy lại được: Liên hệ; từ chối là lỗi nghiêm trọng', () => {
    const { sample, order } = fixture({ irreplaceable: true, defects: [{ kind: 'underfill' }] });
    expect(expectedReception(content, sample, order).decision).toEqual({ type: 'contact' });
    const v = evaluateDecision(content, sample, order, { type: 'reject', reason: 'volume' }, 'reception');
    expect(v).toMatchObject({ kind: 'rejectIrreplaceable', trustDelta: -30 });
  });
});

describe('huy hiệu để quá giờ (mức Dễ)', () => {
  const max = content.receptionRules.maxTransportMinutes * 60;
  it('hiện khi tuổi mẫu trên nhãn vượt ngưỡng và có xét nghiệm nhạy thời gian', () => {
    const { sample, order } = fixture({}, { tests: ['GLU'] });
    expect(overAgeHint(content, sample, order, max + 60)).toBe(true);
    expect(overAgeHint(content, sample, order, max - 60)).toBe(false);
  });
  it('không hiện khi xét nghiệm không nhạy thời gian hoặc ống xám (miễn trừ)', () => {
    const slow = fixture({}, { tests: ['URE'] });
    expect(overAgeHint(content, slow.sample, slow.order, max + 600)).toBe(false);
    const grey = fixture({ container: 'grey' }, { tests: ['GLU'] });
    expect(overAgeHint(content, grey.sample, grey.order, max + 600)).toBe(false);
  });
  it('chỉ dựa vào dữ liệu thấy được: không nhãn thì không hiện, lỗi ẩn không ảnh hưởng', () => {
    const noLabel = fixture({ label: null }, { tests: ['GLU'] });
    expect(overAgeHint(content, noLabel.sample, noLabel.order, max + 600)).toBe(false);
    const hiddenOnly = fixture({ defects: [{ kind: 'delayed' }] }, { tests: ['GLU'] });
    expect(overAgeHint(content, hiddenOnly.sample, hiddenOnly.order, 60)).toBe(false);
  });
});
