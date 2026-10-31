import type { ShiftState, SimEvent } from '../sim';

/**
 * Hiệu ứng chỉ để nhìn (không đổi lõi): dấu ✓/✗ khi quyết định, ống bay vào giỏ, số Niềm tin bay lên.
 * Lõi không biết tới; store đọc các SimEvent rồi phát ra đây, lớp `FxLayer` trong UI vẽ.
 */
export type Fx =
  /** Quyết định ở bàn tiếp nhận: `ok` = đúng/sai (chỉ ở tiếp nhận, nơi lỗi bị chấm ngay nên không lộ lỗi ẩn). */
  | { kind: 'decision'; sampleId: string; container: string; to: string; target?: string; ok: boolean }
  | { kind: 'trust'; delta: number };

/** Các hiệu ứng của một bước lõi. Ở phòng khoa, đúng/sai chỉ lộ khi duyệt kết quả nên không vẽ dấu ✓/✗. */
export function fxFromEvents(before: ShiftState | null, after: ShiftState, events: SimEvent[]): Fx[] {
  const out: Fx[] = [];
  let trust = 0;
  for (const e of events) {
    if (e.type === 'trustChanged') trust += e.delta;
    if (e.type !== 'sampleMoved' || after.room !== 'reception') continue;
    if (!['routed', 'rejected', 'contacted'].includes(e.to)) continue;
    const sample = after.samples[e.sampleId];
    if (!sample) continue;
    const wrong = events.some(
      (m) =>
        m.type === 'mistakeRecorded' &&
        m.entry.sampleId === e.sampleId &&
        m.entry.kind !== 'late' &&
        m.entry.kind !== 'lateStat',
    );
    out.push({
      kind: 'decision',
      sampleId: e.sampleId,
      container: sample.container,
      to: e.to,
      target: sample.routedTo,
      ok: !wrong,
    });
  }
  // Chỉ báo khi Niềm tin thật sự đổi (bị chặn ở 0/100 thì không bay số).
  const real = before ? after.trust - before.trust : 0;
  if (trust !== 0 && Math.round(real) !== 0) out.push({ kind: 'trust', delta: Math.round(real) });
  return out;
}

type Listener = (fx: Fx) => void;
const listeners = new Set<Listener>();

export function emitFx(list: Fx[]): void {
  for (const fx of list) for (const l of listeners) l(fx);
}

export function onFx(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
