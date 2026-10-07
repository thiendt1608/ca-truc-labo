/** Kiểm tra toàn bộ thư mục content/: schema (Zod) + tham chiếu chéo. Dùng: pnpm content:check */
import { rawContent } from '../../src/sim/content/bundled';
import { loadContent } from '../../src/sim/content/load';

try {
  const c = loadContent(rawContent);
  console.log(
    `Nội dung hợp lệ: ${c.days.length} ngày, ${c.tests.length} xét nghiệm, ${c.codex.length} thẻ Sổ tay, ${Object.keys(c.i18n).length} chuỗi.`,
  );
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
