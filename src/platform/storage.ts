import { get, set } from 'idb-keyval';
import type { Difficulty } from '../sim';

/** Tiến trình người chơi (07-TDD mục 7). Lưu trong IndexedDB, khoá `save:v1`. */
export interface SaveData {
  version: 1;
  days: Record<string, { stars: number; score: number; plays: number }>;
  codex: string[];
  difficulty: Difficulty;
  budget: number;
}

const KEY = 'save:v1';

export function emptySave(): SaveData {
  return { version: 1, days: {}, codex: [], difficulty: 'normal', budget: 0 };
}

export async function loadSave(): Promise<SaveData> {
  try {
    const data = (await get(KEY)) as SaveData | undefined;
    if (data?.version === 1) return { ...emptySave(), ...data };
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
