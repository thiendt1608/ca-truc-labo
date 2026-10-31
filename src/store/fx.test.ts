import { describe, expect, it } from 'vitest';
import { advance, applyCommand, createShift, getContent, type ShiftState } from '../sim';
import { fxFromEvents } from './fx';

const content = getContent();

/** Ca tiếp nhận ngày 0.1, tua tới khi có một ống không lỗi nằm trong khay. */
function withCleanSample(dayId = 'ch0-d1'): { state: ShiftState; id: string } {
  let state = createShift({ content, dayId, seed: 'fx', difficulty: 'normal' }).state;
  for (let i = 0; i < 400; i++) {
    const clean = Object.values(state.samples).find((s) => s.status === 'tray' && s.defects.length === 0);
    if (clean) return { state, id: clean.id };
    state = advance(state, 30, content).state;
  }
  throw new Error('không có ống sạch');
}

describe('hiệu ứng quyết định (FxLayer)', () => {
  it('nhận đúng khoa: dấu ✓ và ống bay vào giỏ khoa đó', () => {
    const { state, id } = withCleanSample();
    const dept = state.orders[state.samples[id]!.orderId]!.dept;
    const r = applyCommand(
      state,
      { t: state.clock, type: 'acceptSample', sampleId: id, target: dept },
      content,
    );
    const fx = fxFromEvents(state, r.state, r.events);
    expect(fx).toContainEqual(
      expect.objectContaining({ kind: 'decision', ok: true, to: 'routed', target: dept }),
    );
  });

  it('từ chối một ống không lỗi: dấu ✗, ống vào thùng từ chối, Niềm tin tụt thì có số âm', () => {
    const { state, id } = withCleanSample();
    const r = applyCommand(
      state,
      { t: state.clock, type: 'rejectSample', sampleId: id, reason: 'identity' },
      content,
    );
    const fx = fxFromEvents(state, r.state, r.events);
    expect(fx).toContainEqual(expect.objectContaining({ kind: 'decision', ok: false, to: 'rejected' }));
    expect(r.state.trust).toBeLessThan(state.trust);
    expect(fx.find((f) => f.kind === 'trust')).toEqual({
      kind: 'trust',
      delta: Math.round(r.state.trust - state.trust),
    });
  });

  it('phòng khoa không vẽ dấu đúng/sai (lỗi ẩn chỉ lộ khi duyệt kết quả)', () => {
    const state = createShift({ content, dayId: 'ch1-d1', seed: 'fx', difficulty: 'normal' }).state;
    expect(state.room).not.toBe('reception');
    const fake = [{ type: 'sampleMoved', sampleId: 'x', to: 'bench' }] as const;
    expect(fxFromEvents(state, state, [...fake])).toEqual([]);
  });
});
