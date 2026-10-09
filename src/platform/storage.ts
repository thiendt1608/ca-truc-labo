import { get, set } from 'idb-keyval';
import { emptySave, migrate, type SaveData } from './save';

/** Khoá IndexedDB giữ nguyên `save:v1` cho mọi phiên bản dữ liệu; số phiên bản nằm trong nội dung (`SaveData.version`). */
const KEY = 'save:v1';

/** Đọc tiến trình; save cũ (v1) được nâng cấp qua `migrate`. Dữ liệu hỏng hoặc không đọc được → bản lưu rỗng. */
export async function loadSave(): Promise<SaveData> {
  try {
    const raw = await get(KEY);
    if (raw !== undefined) {
      const r = migrate(raw);
      if (r.ok) return r.save;
    }
  } catch {
    // Trình duyệt chặn IndexedDB (chế độ riêng tư...) → chơi không lưu.
  }
  return emptySave();
}

export async function writeSave(data: SaveData): Promise<void> {
  try {
    await set(KEY, data);
    await navigator.storage?.persist?.();
  } catch {
    // Bỏ qua: game vẫn chơi được, chỉ không lưu.
  }
}
