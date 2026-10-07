import { getContent } from '../sim';

/** Tra chuỗi tiếng Việt theo khoá (content/i18n/vi.json). Thiếu khoá thì trả về chính khoá để dễ phát hiện. */
export function t(key: string): string {
  return getContent().i18n[key] ?? key;
}
