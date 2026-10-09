import { describe, expect, it } from 'vitest';
import { getContent } from '../sim';
import { emptySave, exportCode, importCode, migrate, SAVE_VERSION, type SaveData } from './save';

function sample(): SaveData {
  const content = getContent();
  return {
    ...emptySave(),
    days: {
      'ch0-d1': { stars: 5, score: 93, plays: 3 },
      'ch0-d2': { stars: 2, score: 41, plays: 1 },
    },
    codex: content.codex.slice(0, 4).map((c) => c.id),
    difficulty: 'hard',
    budget: 410,
    settings: { reducedMotion: true },
    installHintShown: true,
  };
}

describe('mã lưu', () => {
  it('xuất rồi nhập lại ra đúng bản lưu', () => {
    const save = sample();
    const code = exportCode(save);
    expect(code).toMatch(/^CTL1\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
    const r = importCode(code);
    expect(r).toEqual({ ok: true, save });
  });

  it('bản lưu rỗng xuất/nhập được', () => {
    const r = importCode(exportCode(emptySave()));
    expect(r).toEqual({ ok: true, save: emptySave() });
  });

  it('chịu được khoảng trắng và xuống dòng xen vào mã', () => {
    const code = exportCode(sample());
    const wrapped = `  \n${code.replace(/(.{20})/g, '$1\n ')}\t\n`;
    expect(importCode(wrapped).ok).toBe(true);
  });

  it('mã bị sửa 1 ký tự thì bị từ chối', () => {
    const code = exportCode(sample());
    const mid = Math.floor(code.length / 2);
    const swapped = code[mid] === 'A' ? 'B' : 'A';
    const r = importCode(code.slice(0, mid) + swapped + code.slice(mid + 1));
    expect(r.ok).toBe(false);
    // Sửa ngay checksum cũng bị bắt.
    const tail = code.endsWith('0') ? '1' : '0';
    expect(importCode(code.slice(0, -1) + tail).ok).toBe(false);
  });

  it('mã bị cắt cụt thì bị từ chối', () => {
    const code = exportCode(sample());
    expect(importCode(code.slice(0, code.length - 12)).ok).toBe(false);
    expect(importCode(code.slice(0, 20)).ok).toBe(false);
  });

  it('mã rác không làm crash và báo lỗi tiếng Việt', () => {
    for (const junk of [
      '',
      '   \n',
      'abc',
      'CTL1',
      'CTL1..',
      'CTL1.@@@.00000000',
      '{"version":2}',
      '🙂🙂',
      'a.b.c',
    ]) {
      const r = importCode(junk);
      expect(r.ok, junk).toBe(false);
      if (!r.ok) expect(r.error.length).toBeGreaterThan(5);
    }
    expect(importCode('x'.repeat(100_000)).ok).toBe(false);
  });

  it('mã từ phiên bản định dạng mới hơn bị từ chối', () => {
    const code = exportCode(sample()).replace(/^CTL1/, 'CTL2');
    const r = importCode(code);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/mới hơn/);
  });

  it('dữ liệu lưu mới hơn bị từ chối, không crash', () => {
    const r = migrate({ ...sample(), version: SAVE_VERSION + 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/mới hơn/);
  });
});

describe('kiểm tra nội dung bản lưu', () => {
  const bad = (patch: Record<string, unknown>) => migrate({ ...sample(), ...patch });

  it('bỏ ngày và thẻ không còn trong nội dung', () => {
    const r = bad({
      days: { 'ch0-d1': { stars: 3, score: 70, plays: 1 }, 'ngay-ma': { stars: 3, score: 70, plays: 1 } },
      codex: [...sample().codex, 'the-ma'],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.keys(r.save.days)).toEqual(['ch0-d1']);
      expect(r.save.codex).toEqual(sample().codex);
    }
  });

  it('từ chối sao, điểm, lượt chơi vô lý', () => {
    const day = (o: object) => ({ 'ch0-d1': { stars: 3, score: 70, plays: 1, ...o } });
    expect(bad({ days: day({ stars: 6 }) }).ok).toBe(false);
    expect(bad({ days: day({ stars: -1 }) }).ok).toBe(false);
    expect(bad({ days: day({ stars: 2.5 }) }).ok).toBe(false);
    expect(bad({ days: day({ score: 101 }) }).ok).toBe(false);
    expect(bad({ days: day({ score: Number.NaN }) }).ok).toBe(false);
    expect(bad({ days: day({ plays: '3' }) }).ok).toBe(false);
    expect(bad({ days: [] }).ok).toBe(false);
  });

  it('từ chối độ khó, ngân sách, cài đặt sai', () => {
    expect(bad({ difficulty: 'ac-mong' }).ok).toBe(false);
    expect(bad({ budget: -5 }).ok).toBe(false);
    expect(bad({ budget: 1e12 }).ok).toBe(false);
    expect(bad({ budget: null }).ok).toBe(false);
    expect(bad({ codex: 'x' }).ok).toBe(false);
    expect(bad({ settings: { reducedMotion: 'yes' } }).ok).toBe(false);
    expect(bad({ installHintShown: 1 }).ok).toBe(false);
    expect(migrate(null).ok).toBe(false);
    expect(migrate([]).ok).toBe(false);
    expect(migrate({}).ok).toBe(false);
  });
});

describe('migrate', () => {
  it('v1 → v2 giữ tiến trình, thêm cài đặt mặc định', () => {
    const v1 = {
      version: 1,
      days: { 'ch0-d1': { stars: 4, score: 80, plays: 2 } },
      codex: [getContent().codex[0]!.id],
      difficulty: 'easy',
      budget: 140,
    };
    const r = migrate(v1);
    expect(r).toEqual({
      ok: true,
      save: {
        version: 2,
        days: v1.days,
        codex: v1.codex,
        difficulty: 'easy',
        budget: 140,
        settings: { reducedMotion: false },
        installHintShown: false,
      },
    });
  });

  it('v1 rỗng cũng nâng cấp được; v2 hợp lệ giữ nguyên', () => {
    const v1 = { version: 1, days: {}, codex: [], difficulty: 'normal', budget: 0 };
    expect(migrate(v1)).toEqual({ ok: true, save: emptySave() });
    expect(migrate(sample())).toEqual({ ok: true, save: sample() });
  });

  it('mã xuất từ dữ liệu v1 cũ vẫn nhập được (nâng cấp khi nhập)', () => {
    const v1 = { version: 1, days: {}, codex: [], difficulty: 'hard', budget: 10 };
    // Dựng mã thủ công bằng cách xuất một save v2 rồi thay nội dung: dùng lại exportCode qua ép kiểu.
    const code = exportCode(v1 as unknown as SaveData);
    const r = importCode(code);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.save).toEqual({ ...emptySave(), difficulty: 'hard', budget: 10 });
  });
});
