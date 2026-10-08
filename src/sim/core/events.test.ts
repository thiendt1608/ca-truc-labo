import { describe, expect, it } from 'vitest';
import { runBot } from '../bots/bots';
import { getContent } from '../content/bundled';
import type { Content } from '../content/load';
import type { EventId } from '../content/schema';
import { advance, applyCommand, createShift, hashState, replay } from './engine';
import type { Command, ShiftState } from './types';

type CommandInput = Command extends infer C ? (C extends Command ? Omit<C, 't'> : never) : never;

/** Nội dung gốc nhưng ngày `dayId` chỉ có đúng các sự kiện cho trước (để thử từng sự kiện riêng lẻ). */
function only(dayId: string, events: { id: EventId; at: number }[]): Content {
  const base = getContent();
  const day = base.dayById.get(dayId)!;
  return { ...base, dayById: new Map(base.dayById).set(dayId, { ...day, events }) };
}
const start = (c: Content, dayId: string, seed = 'ev') =>
  createShift({ content: c, dayId, seed, difficulty: 'normal' }).state;
const run = (c: Content, s: ShiftState, cmd: CommandInput) =>
  applyCommand(s, { ...cmd, t: s.clock } as Command, c).state;
const go = (c: Content, s: ShiftState, secs: number) => advance(s, secs, c).state;

describe('sự kiện làm thêm mẫu', () => {
  it('E1 cấp cứu dồn mẫu: ba mẫu khẩn tới ngay sau đó', () => {
    const c = only('ch1-d2', [{ id: 'E1', at: 100 }]);
    const s = go(c, start(c, 'ch1-d2'), 400);
    const rush = Object.values(s.orders).filter((o) => o.priority === 'stat' && o.createdAt >= 100);
    expect(rush.length).toBeGreaterThanOrEqual(3);
  });

  it('E4 mẫu không nhãn: có một ống không nhãn tới sau sự kiện', () => {
    const c = only('ch0-d1', [{ id: 'E4', at: 100 }]);
    const s = go(c, start(c, 'ch0-d1'), 300);
    expect(Object.values(s.samples).some((x) => x.label === null && x.arrivedAt >= 100)).toBe(true);
  });

  it('E7 trực trưa một mình: nhiều mẫu thường dồn về', () => {
    const c = only('ch1-d5', [{ id: 'E7', at: 100 }]);
    const base = go(only('ch1-d5', []), start(only('ch1-d5', []), 'ch1-d5'), 800);
    const s = go(c, start(c, 'ch1-d5'), 800);
    expect(Object.keys(s.orders).length).toBeGreaterThanOrEqual(Object.keys(base.orders).length + 3);
  });
});

describe('sự kiện gây hiệu ứng', () => {
  it('E6 LIS chậm: máy hoá sinh chạy chậm trong một lúc', () => {
    const c = only('ch1-d2', [{ id: 'E6', at: 100 }]);
    const s = go(c, start(c, 'ch1-d2'), 200);
    expect(s.effects.slowFactor).toBe(1.5);
    expect(s.effects.slowUntil).toBe(100 + 900);
  });

  it('E9 mất điện: máy ly tâm dừng đúng khoảng mất điện rồi chạy tiếp', () => {
    const c = only('ch1-d1', [{ id: 'E9', at: 100 }]);
    let s = go(c, start(c, 'ch1-d1'), 60);
    const first = Object.values(s.samples)[0]!;
    s = run(c, s, { type: 'acceptSample', sampleId: first.id });
    s = run(c, s, { type: 'chem/placeTube', slot: 0, content: first.id });
    s = run(c, s, { type: 'chem/placeTube', slot: 6, content: 'water' });
    s = run(c, s, { type: 'startCentrifuge', centrifugeId: 'c1' });
    const normalEnd = s.chem!.centrifuge.endsAt;
    s = go(c, s, normalEnd - s.clock + 1);
    expect(s.chem!.centrifuge.running).toBe(true); // lẽ ra đã xong
    s = go(c, s, 600);
    expect(s.samples[first.id]!.status).toBe('spun');
  });

  it('E5 rơi vỡ: máy ly tâm nhiễm bẩn và mở mini-game dọn đổ vỡ', () => {
    const c = only('ch1-d4', [{ id: 'E5', at: 100 }]);
    const s = go(c, start(c, 'ch1-d4'), 120);
    expect(s.minigame?.context).toBe('spill');
    expect(s.chem!.centrifuge.contaminated).toBe(true);
  });

  it('E8 trưởng khoa: khay không tồn quá lâu thì được thưởng Niềm tin', () => {
    const c = only('ch0-d1', [{ id: 'E8', at: 300 }]);
    const trust = start(c, 'ch0-d1').trust;
    const s = go(c, start(c, 'ch0-d1'), 400);
    expect(s.trust).toBe(trust + c.events.events.E8.reward!);
  });

  it('E8 trưởng khoa: có ống nằm khay quá lâu thì không được thưởng', () => {
    const c = only('ch0-d1', [{ id: 'E8', at: 5000 }]);
    const s = go(c, start(c, 'ch0-d1'), 4999);
    const before = s.trust;
    const after = go(c, s, 2);
    expect(after.trust).toBe(before);
  });
});

describe('sự kiện chờ quyết định', () => {
  it('E3 máy lỗi: máy không chạy mẫu cho tới khi xử lý; gọi kỹ sư thì máy nghỉ đúng 20 phút', () => {
    const c = only('ch1-d1', [{ id: 'E3', at: 700 }]);
    let s = go(c, start(c, 'ch1-d1'), 60);
    const first = Object.values(s.samples)[0]!;
    s = run(c, s, { type: 'acceptSample', sampleId: first.id });
    s = run(c, s, { type: 'chem/placeTube', slot: 0, content: first.id });
    s = run(c, s, { type: 'chem/placeTube', slot: 6, content: 'water' });
    s = run(c, s, { type: 'startCentrifuge', centrifugeId: 'c1' });
    s = go(c, s, 700 - s.clock); // ly tâm xong trước 700? chạy tiếp tới lúc sự kiện nổ
    s = go(c, s, 1);
    expect(s.pending).toHaveLength(1);
    s = go(c, s, 700);
    s = run(c, s, { type: 'chem/loadAnalyzer', sampleId: first.id });
    s = go(c, s, 2000);
    expect(s.orders[first.orderId]!.status).toBe('running'); // vẫn chờ vì máy hỏng

    const ev = s.pending[0]!;
    s = run(c, s, { type: 'resolveEvent', id: ev.id, choice: 'engineer' });
    expect(s.pending).toHaveLength(0);
    expect(s.effects.analyzerDownUntil).toBe(s.clock + 1200);
    s = go(c, s, 1200 + c.chemRules.analyzer.secondsPerSample + 5);
    expect(s.orders[first.orderId]!.status).toBe('resulted');
  });

  it('E10 sinh viên hỏi bài: trả lời đúng được thưởng, sai thì ghi chú giải thích', () => {
    const c = only('ch1-d1', [{ id: 'E10', at: 100 }]);
    const s = go(c, start(c, 'ch1-d1'), 110);
    const ev = s.pending[0]!;
    const quiz = c.events.quizzes.find((q) => q.id === ev.quizId)!;
    const good = run(c, s, { type: 'resolveEvent', id: ev.id, choice: String(quiz.correct) });
    expect(good.trust).toBe(s.trust + c.events.events.E10.reward!);
    const bad = run(c, s, { type: 'resolveEvent', id: ev.id, choice: String(1 - quiz.correct) });
    expect(bad.ledger.at(-1)).toMatchObject({ kind: 'quizWrong', detail: quiz.explain });
    expect(bad.trust).toBe(s.trust);
  });

  it('E10 không trả lời thì tự hết hạn, không phạt', () => {
    const c = only('ch1-d1', [{ id: 'E10', at: 100 }]);
    const s = go(c, start(c, 'ch1-d1'), 110);
    const later = go(c, s, c.events.events.E10.expireSeconds! + 5);
    expect(later.pending).toHaveLength(0);
    expect(later.ledger).toHaveLength(0);
  });
});

describe('điện thoại', () => {
  it('trả lời đúng (phiếu chưa xong → cho biết giờ dự kiến) được +Niềm tin; sai bị ghi lỗi', () => {
    const c = only('ch1-d1', [{ id: 'E2', at: 600 }]);
    const s = go(c, start(c, 'ch1-d1'), 610);
    expect(s.phone.calls).toHaveLength(1);
    const call = s.phone.calls[0]!;
    const good = run(c, s, { type: 'answerPhone', callId: call.id, choice: 'wait' });
    expect(good.trust).toBe(s.trust + c.events.phone.correctTrust);
    expect(good.phone.calls).toHaveLength(0);
    const bad = run(c, s, { type: 'answerPhone', callId: call.id, choice: 'report' });
    expect(bad.ledger.at(-1)?.kind).toBe('phoneWrong');
    expect(bad.trust).toBe(s.trust + c.events.phone.wrongTrust);
  });

  it('bỏ lỡ 3 cuộc gọi thì bị trừ Niềm tin', () => {
    const c = only('ch1-d1', [
      { id: 'E2', at: 600 },
      { id: 'E2', at: 700 },
      { id: 'E2', at: 800 },
    ]);
    const s = go(c, start(c, 'ch1-d1'), 1400);
    expect(s.phone.missed).toBe(3);
    expect(s.ledger.some((m) => m.kind === 'phoneMissed')).toBe(true);
  });
});

describe('tất định và bot', () => {
  it('ngày 1.5 với đủ sự kiện: phát lại cho cùng trạng thái', () => {
    const content = getContent();
    const r = runBot(content, 'ch1-d5', 'det-ev', 'novice');
    const again = replay(
      { content, dayId: 'ch1-d5', seed: 'det-ev', difficulty: 'normal' },
      r.commands,
      true,
    );
    expect(hashState(again)).toBe(hashState(r.state));
  });
});
