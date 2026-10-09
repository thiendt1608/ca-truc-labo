import { describe, expect, it } from 'vitest';
import { getContent, type ShiftState } from '../sim';
import {
  clockFactor,
  pushToasts,
  runProgress,
  timeScale,
  useGame,
  type ClockGate,
  type Overlay,
  type Toast,
} from './game';

const mk = (id: number, text: string): Omit<Toast, 'count'> => ({ id, kind: 'mistake', text });

describe('thông báo', () => {
  it('gộp thông báo trùng thành ×n thay vì xếp chồng', () => {
    let list = pushToasts([], [mk(1, 'Trễ hẹn')]);
    list = pushToasts(list, [mk(2, 'Trễ hẹn'), mk(3, 'Trễ hẹn')]);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 3, count: 3 });
  });

  it('chỉ giữ 2 thông báo mới nhất để không che khay mẫu', () => {
    const list = pushToasts([], [mk(1, 'a'), mk(2, 'b'), mk(3, 'c')]);
    expect(list.map((x) => x.text)).toEqual(['b', 'c']);
  });
});

describe('nhịp đồng hồ', () => {
  it('ca ngắn và ca dài đều dài khoảng 6 phút thực', () => {
    expect(9000 / timeScale(9000)).toBeCloseTo(360);
    expect(14400 / timeScale(14400)).toBeCloseTo(360);
  });
});

describe('tiến độ máy khi mất điện', () => {
  const at = (clock: number, powerOutUntil: number) =>
    ({ clock, effects: { powerOutUntil } }) as unknown as ShiftState;
  it('đóng băng trong lúc mất điện rồi chạy tiếp đúng chỗ cũ', () => {
    // Lượt quay 600 giây bắt đầu lúc 0; mất điện 100→700 nên kết thúc bị đẩy từ 600 lên 1200.
    expect(runProgress(at(100, 0), 600, 600)).toBeCloseTo(100 - (500 / 600) * 100); // trước khi mất điện
    expect(runProgress(at(400, 700), 1200, 600)).toBeCloseTo(100 - (500 / 600) * 100); // vẫn đứng yên
    expect(runProgress(at(700, 700), 1200, 600)).toBeCloseTo(100 - (500 / 600) * 100);
    expect(runProgress(at(1000, 700), 1200, 600)).toBeCloseTo(100 - (200 / 600) * 100); // chạy tiếp
  });
});

describe('giờ chậm khi mở tấm làm việc', () => {
  const W = 0.25;
  const gate = (overlay: ClockGate['overlay'], extra: Partial<ClockGate> = {}): ClockGate => ({
    overlay,
    minigame: false,
    help: false,
    tips: 0,
    ...extra,
  });

  it('hệ số nằm trong difficulty.json (không hard-code rải rác)', () => {
    expect(getContent().difficulty.workSheetClockFactor).toBe(W);
  });

  it('tấm làm việc chạy chậm ×0,25; không lớp phủ chạy bình thường', () => {
    expect(clockFactor(gate(null), W)).toBe(1);
    for (const kind of ['sample', 'centrifuge', 'postspin', 'analyzer', 'results', 'urine'] as const)
      expect(clockFactor(gate(kind === 'sample' ? { kind, sampleId: 's1' } : { kind }), W)).toBe(W);
  });

  it('màn quyết định, mini-game, thẻ "?" và mẹo vẫn dừng hẳn', () => {
    for (const kind of ['qc', 'phone', 'event', 'codex'] as const)
      expect(clockFactor(gate({ kind }), W)).toBe(0);
    expect(clockFactor(gate({ kind: 'results' }, { minigame: true }), W)).toBe(0);
    expect(clockFactor(gate({ kind: 'results' }, { help: true }), W)).toBe(0);
    expect(clockFactor(gate(null, { tips: 1 }), W)).toBe(0);
    // Mẹo xếp hàng chờ tới khi đóng lớp phủ nên không dừng giờ khi tấm đang mở.
    expect(clockFactor(gate({ kind: 'results' }, { tips: 1 }), W)).toBe(W);
  });

  it('tickReal: mở tấm Kết quả thì giờ trôi bằng 1/4, mở QC thì đứng yên', () => {
    const st = () => useGame.getState();
    const elapsed = (overlay: Overlay) => {
      st().openDay('ch1-d1');
      st().startShift('slow');
      useGame.setState({ overlay, tips: [], paused: false });
      const before = st().shift!.clock;
      st().tickReal(10000);
      return st().shift!.clock - before;
    };
    const free = elapsed(null);
    const slow = elapsed({ kind: 'results' });
    expect(free).toBeGreaterThan(100);
    expect(slow).toBeGreaterThanOrEqual(Math.floor(free * W) - 1);
    expect(slow).toBeLessThanOrEqual(Math.ceil(free * W) + 1);
    expect(elapsed({ kind: 'qc' })).toBe(0);
  });
});

describe('thẻ nhắc trước mini-game tự bật', () => {
  const st = () => useGame.getState();
  /** Chạy giờ tới khi lõi tự mở mini-game (sự kiện E5 ở ch1-d4); bỏ mẹo để không dừng giờ. */
  const runUntilSpill = () => {
    st().openDay('ch1-d4');
    st().startShift('spill-notice');
    for (let i = 0; i < 600 && !st().shift!.minigame; i++) {
      useGame.setState({ tips: [], overlay: null });
      st().tickReal(1000);
      if (st().shift!.pending.length > 0 || st().shift!.ended) break;
    }
  };

  it('ống vỡ do sự kiện: mini-game mở trong lõi nhưng chờ người chơi bấm, giờ đứng yên', () => {
    runUntilSpill();
    const mg = st().shift!.minigame;
    expect(mg?.context).toBe('spill');
    expect(st().mgNotice).toMatchObject({ taskId: mg!.taskId, title: expect.stringContaining('Rơi vỡ') });
    const clock = st().shift!.clock;
    st().tickReal(5000);
    expect(st().shift!.clock).toBe(clock);
    st().ackMinigame();
    expect(st().mgNotice).toBeNull();
    expect(st().shift!.minigame?.taskId).toBe(mg!.taskId);
  });

  it('mini-game do lệnh của người chơi (debug/forceSpill) vào thẳng, không có thẻ nhắc', () => {
    st().openDay('ch1-d1');
    st().startShift('manual-spill');
    st().dispatch({ type: 'debug/forceSpill' });
    expect(st().shift!.minigame?.context).toBe('spill');
    expect(st().mgNotice).toBeNull();
  });

  it('bắt đầu ca mới xoá thẻ nhắc cũ', () => {
    runUntilSpill();
    expect(st().mgNotice).not.toBeNull();
    st().startShift('another');
    expect(st().mgNotice).toBeNull();
  });
});
