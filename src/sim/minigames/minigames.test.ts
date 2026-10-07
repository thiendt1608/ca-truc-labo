import { describe, expect, it } from 'vitest';
import { perfectSpillActions } from '../bots/bots';
import { scoreHold } from './holdTimer';
import { generateSpill, scoreSpill } from './spillCleanup';

describe('khung giữ đúng thời gian', () => {
  const input = { fillMs: 1000, zone: [0.6, 0.8] as [number, number] };
  it('thả trong vùng xanh → đạt', () => {
    const r = scoreHold(input, [
      { t: 0, type: 'press' },
      { t: 700, type: 'release' },
    ]);
    expect(r).toMatchObject({ ok: true, verdict: 'good', skill: 100 });
  });
  it('thả sớm hoặc muộn → không đạt', () => {
    expect(
      scoreHold(input, [
        { t: 0, type: 'press' },
        { t: 300, type: 'release' },
      ]).verdict,
    ).toBe('early');
    expect(
      scoreHold(input, [
        { t: 0, type: 'press' },
        { t: 950, type: 'release' },
      ]).verdict,
    ).toBe('late');
    expect(scoreHold(input, []).verdict).toBe('none');
  });
});

describe('Dọn đổ vỡ', () => {
  it('đề bài tất định theo hạt giống', () => {
    expect(generateSpill('a', 'hard')).toEqual(generateSpill('a', 'hard'));
    expect(generateSpill('a', 'easy').steps).toHaveLength(4);
    expect(generateSpill('a', 'hard').steps).toHaveLength(6);
  });
  it('làm đúng thứ tự và chờ đủ → 100 điểm, an toàn', () => {
    const input = generateSpill('s', 'normal');
    const r = scoreSpill(input, perfectSpillActions('s', 'normal'));
    expect(r).toMatchObject({ ok: true, completed: true, skill: 100 });
  });
  it('chạm bẫy "lau từ trong ra ngoài" → không an toàn', () => {
    const input = generateSpill('s', 'normal');
    const actions = perfectSpillActions('s', 'normal');
    actions.splice(4, 0, { t: 1500, type: 'tap', id: 'wipeOut' });
    const r = scoreSpill(input, actions);
    expect(r.ok).toBe(false);
    expect(r.trapsTapped).toBe(1);
  });
  it('thả tay quá sớm ở bước chờ → không an toàn', () => {
    const input = generateSpill('s', 'easy');
    const r = scoreSpill(input, [
      { t: 0, type: 'tap', id: 'disinfect' },
      { t: 100, type: 'tap', id: 'wait' },
      { t: 200, type: 'press' },
      { t: 300, type: 'release' },
      { t: 400, type: 'press' },
      { t: 400 + input.hold.fillMs * 0.7, type: 'release' },
      { t: 5000, type: 'tap', id: 'wipe' },
      { t: 5100, type: 'tap', id: 'bin' },
    ]);
    expect(r.completed).toBe(true);
    expect(r.ok).toBe(false);
  });
});
