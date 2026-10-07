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
});
