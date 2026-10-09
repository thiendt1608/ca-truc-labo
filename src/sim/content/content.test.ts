import { describe, expect, it } from 'vitest';
import { getContent, rawContent } from './bundled';
import { loadContent } from './load';

describe('content', () => {
  it('toàn bộ nội dung qua được schema và kiểm tra chéo', () => {
    const c = getContent();
    expect(c.days.length).toBeGreaterThan(0);
  });
  it('báo lỗi khi ngày trỏ tới loại phiếu không tồn tại', () => {
    const bad = structuredClone(rawContent);
    bad.days[0]!.orderTypes = { khongCo: 1 } as never;
    expect(() => loadContent(bad)).toThrow(/khongCo/);
  });
  it('báo lỗi khi ngày Tiếp nhận có phiếu của khoa chưa mở chuyển', () => {
    const bad = structuredClone(rawContent);
    const d1 = bad.days.find((d) => d.id === 'ch0-d1')!;
    d1.orderTypes = { stool: 1 } as never;
    expect(() => loadContent(bad)).toThrow(/chưa mở chuyển tới khoa/);
  });
  it('báo lỗi khi mẫu không lấy lại được có lỗi theo kịch bản mà ngày chưa mở Liên hệ', () => {
    const bad = structuredClone(rawContent);
    const d2 = bad.days.find((d) => d.id === 'ch0-d2')!;
    d2.scripted = [{ index: 0, orderType: 'histology', defects: [{ kind: 'underfill' }] }] as never;
    expect(() => loadContent(bad)).toThrow(/contact/);
  });
  it('báo lỗi khi lời giải thích để quá giờ theo lọ thiếu chuỗi hoặc thẻ Sổ tay', () => {
    const bad = structuredClone(rawContent);
    bad.receptionRules.delayedByContainer.stool = { explanationKey: 'khong.co', codex: 'khong-co' };
    expect(() => loadContent(bad)).toThrow(/khong\.co/);
  });

  it('mọi thẻ Sổ tay có gợi ý "mở khi ..." bằng tiếng Việt, không lộ tên thẻ', () => {
    for (const card of getContent().codex) {
      expect(card.unlockHint, card.id).toBeTruthy();
      expect(card.unlockHint!, card.id).toMatch(/^Mở khi /);
      expect(card.unlockHint!.length, card.id).toBeLessThanOrEqual(120);
      expect(card.unlockHint!.toLowerCase(), card.id).not.toContain(card.title.toLowerCase());
    }
  });
  it('mọi thẻ Sổ tay đều có đường mở được (đầu ca, lỗi, quy tắc hoặc câu đố)', () => {
    const c = getContent();
    const reachable = new Set<string>([
      ...c.days.flatMap((d) => d.codexOnStart),
      ...c.receptionRules.defects.map((d) => d.codex),
      ...Object.values(c.receptionRules.delayedByContainer).map((o) => o.codex),
      c.receptionRules.irreplaceable.codex,
      c.chemRules.hemolysis.codex,
      c.chemRules.lipemia.codex,
      c.chemRules.icterus.codex,
      c.chemRules.dilution.codex,
      c.chemRules.delta.codex,
      ...Object.values(c.chemQc.scenarios).map((s) => s.codex),
      ...c.events.quizzes.map((q) => q.codex),
      // Mở trong engine/chem.ts khi trả kết quả của ống nhãn lệch.
      'ch-wrong-patient',
    ]);
    expect(c.codex.filter((card) => !reachable.has(card.id)).map((card) => card.id)).toEqual([]);
  });
  it('mỗi nút "?" trỏ tới thẻ có thật; thẻ chưa mở vẫn có gợi ý để hiện', () => {
    const c = getContent();
    for (const [context, id] of Object.entries(c.codexHelp)) {
      expect(c.codexById.get(id)?.unlockHint, context).toBeTruthy();
    }
    for (const context of ['sample', 'centrifuge', 'postspin', 'analyzer', 'results', 'qc', 'urine']) {
      expect(c.codexHelp, context).toHaveProperty(context);
    }
  });
  it('báo lỗi khi bản đồ nút "?" trỏ tới thẻ không tồn tại', () => {
    const bad = structuredClone(rawContent);
    bad.codexHelp.qc = 'khong-co-the';
    expect(() => loadContent(bad)).toThrow(/khong-co-the/);
  });
  it('báo lỗi khi thiếu mức độ khó trong difficulty.json', () => {
    const bad = structuredClone(rawContent) as { difficulty: { levels: Record<string, unknown> } };
    delete bad.difficulty.levels.hard;
    expect(() => loadContent(bad)).toThrow();
  });
});
