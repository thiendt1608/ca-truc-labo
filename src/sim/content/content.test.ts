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
});
