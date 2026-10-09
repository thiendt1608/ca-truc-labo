import { compressToUint8Array, decompressFromUint8Array } from 'lz-string';
import { getContent, type Difficulty } from '../sim';

/** Phiên bản hiện tại của dữ liệu lưu. Khoá IndexedDB vẫn là `save:v1`; `version` nằm trong nội dung. */
export const SAVE_VERSION = 3;

export interface Settings {
  reducedMotion: boolean;
}

/** Tiến trình người chơi (07-TDD mục 7). */
export interface SaveData {
  version: typeof SAVE_VERSION;
  days: Record<string, { stars: number; score: number; plays: number }>;
  codex: string[];
  /** Thẻ Sổ tay đã mở và đã đọc (phần còn lại của `codex` hiện dấu "Mới"). Luôn là tập con của `codex`. */
  codexSeen: string[];
  difficulty: Difficulty;
  budget: number;
  settings: Settings;
  /** Đã hiện thẻ nhắc "Thêm vào màn hình chính / xuất mã lưu" (sau ngày 0.3). */
  installHintShown: boolean;
}

export function emptySave(): SaveData {
  return {
    version: SAVE_VERSION,
    days: {},
    codex: [],
    codexSeen: [],
    difficulty: 'normal',
    budget: 0,
    settings: { reducedMotion: false },
    installHintShown: false,
  };
}

export type SaveResult = { ok: true; save: SaveData } | { ok: false; error: string };

const DIFFICULTIES: readonly string[] = ['easy', 'normal', 'hard'];
const MAX_BUDGET = 1_000_000;
const MAX_PLAYS = 100_000;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/**
 * Nâng dữ liệu cũ lên bản mới nhất (vN → vN+1), rồi kiểm tra nội dung.
 * - v1 → v2: thêm `settings` và `installHintShown`.
 * - v2 → v3: thêm `codexSeen` (mọi thẻ đã mở coi như đã đọc, không hiện "Mới" hàng loạt).
 * - Bản mới hơn bản hiện tại bị từ chối (không đoán cấu trúc lạ).
 * - Ngày/thẻ không còn trong nội dung bị bỏ; số liệu sai kiểu hoặc vô lý thì từ chối cả bản lưu.
 */
export function migrate(data: unknown): SaveResult {
  if (!isRecord(data)) return { ok: false, error: 'Dữ liệu lưu không đúng định dạng.' };
  const version = data.version;
  if (!isInt(version, 1, Number.MAX_SAFE_INTEGER)) {
    return { ok: false, error: 'Dữ liệu lưu thiếu số phiên bản.' };
  }
  if (version > SAVE_VERSION) {
    return { ok: false, error: 'Mã này tạo từ phiên bản game mới hơn. Hãy tải lại game để cập nhật.' };
  }
  let cur: Record<string, unknown> = data;
  if (cur.version === 1) {
    cur = { ...cur, version: 2, settings: { reducedMotion: false }, installHintShown: false };
  }
  if (cur.version === 2) {
    cur = { ...cur, version: 3, codexSeen: Array.isArray(cur.codex) ? cur.codex : [] };
  }
  return validate(cur);
}

function validate(d: Record<string, unknown>): SaveResult {
  const content = getContent();
  if (!isRecord(d.days)) return { ok: false, error: 'Danh sách ngày đã chơi bị hỏng.' };
  const days: SaveData['days'] = {};
  for (const [id, r] of Object.entries(d.days)) {
    if (!content.dayById.has(id)) continue; // ngày không còn trong nội dung → bỏ
    if (!isRecord(r) || !isInt(r.stars, 0, 5) || !isInt(r.score, 0, 100) || !isInt(r.plays, 0, MAX_PLAYS)) {
      return { ok: false, error: `Kết quả ngày ${id} không hợp lệ.` };
    }
    days[id] = { stars: r.stars, score: r.score, plays: r.plays };
  }
  if (!Array.isArray(d.codex) || d.codex.some((c) => typeof c !== 'string')) {
    return { ok: false, error: 'Danh sách thẻ Sổ tay bị hỏng.' };
  }
  const codex = [...new Set(d.codex as string[])].filter((id) => content.codexById.has(id));
  if (!Array.isArray(d.codexSeen) || d.codexSeen.some((c) => typeof c !== 'string')) {
    return { ok: false, error: 'Danh sách thẻ Sổ tay đã đọc bị hỏng.' };
  }
  const opened = new Set(codex);
  const codexSeen = [...new Set(d.codexSeen as string[])].filter((id) => opened.has(id));
  if (typeof d.difficulty !== 'string' || !DIFFICULTIES.includes(d.difficulty)) {
    return { ok: false, error: 'Độ khó trong dữ liệu không hợp lệ.' };
  }
  if (typeof d.budget !== 'number' || !Number.isFinite(d.budget) || d.budget < 0 || d.budget > MAX_BUDGET) {
    return { ok: false, error: 'Ngân sách trong dữ liệu không hợp lệ.' };
  }
  if (!isRecord(d.settings) || typeof d.settings.reducedMotion !== 'boolean') {
    return { ok: false, error: 'Cài đặt trong dữ liệu không hợp lệ.' };
  }
  if (typeof d.installHintShown !== 'boolean') return { ok: false, error: 'Dữ liệu lưu bị hỏng.' };
  return {
    ok: true,
    save: {
      version: SAVE_VERSION,
      days,
      codex,
      codexSeen,
      difficulty: d.difficulty as Difficulty,
      budget: d.budget,
      settings: { reducedMotion: d.settings.reducedMotion },
      installHintShown: d.installHintShown,
    },
  };
}

// ---------------------------------------------------------------- Mã lưu

/** Tiền tố = phiên bản định dạng của mã (không phải phiên bản SaveData). */
const CODE_PREFIX = 'CTL1';
const MAX_CODE_LENGTH = 64 * 1024;

let crcTable: Uint32Array | null = null;
function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  try {
    const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Mã lưu: `CTL1.<JSON nén, base64url>.<crc32 hex 8 ký tự>`. */
export function exportCode(save: SaveData): string {
  const bytes = compressToUint8Array(JSON.stringify(save));
  return `${CODE_PREFIX}.${toBase64Url(bytes)}.${crc32(bytes).toString(16).padStart(8, '0')}`;
}

/** Đọc mã lưu người chơi dán vào. Không bao giờ ném lỗi: mã rác/hỏng/mới hơn trả về `{ ok: false, error }`. */
export function importCode(text: string): SaveResult {
  // Bỏ mọi khoảng trắng/xuống dòng (kể cả ký tự rộng 0) vì mã hay bị ngắt dòng khi sao chép.
  const code = text.replace(/[\s\u200b-\u200d\ufeff]+/g, '');
  if (code === '') return { ok: false, error: 'Chưa có mã nào. Hãy dán mã lưu vào ô.' };
  if (code.length > MAX_CODE_LENGTH) return { ok: false, error: 'Mã quá dài, không phải mã lưu của game.' };
  const parts = code.split('.');
  const head = parts[0] ?? '';
  if (!/^CTL\d+$/.test(head) || parts.length !== 3) {
    return { ok: false, error: 'Đây không phải mã lưu của CA TRỰC LABO (mã bắt đầu bằng CTL1.).' };
  }
  if (head !== CODE_PREFIX) {
    return { ok: false, error: 'Mã này tạo từ phiên bản game mới hơn. Hãy tải lại game để cập nhật.' };
  }
  const bytes = fromBase64Url(parts[1] ?? '');
  if (!bytes || !/^[0-9a-f]{8}$/i.test(parts[2] ?? '') || crc32(bytes) !== parseInt(parts[2]!, 16)) {
    return {
      ok: false,
      error: 'Mã bị sai hoặc thiếu ký tự (không khớp mã kiểm tra). Hãy sao chép lại đủ mã.',
    };
  }
  let json: string | null;
  try {
    json = decompressFromUint8Array(bytes);
  } catch {
    json = null;
  }
  if (!json) return { ok: false, error: 'Không giải nén được mã. Hãy sao chép lại đủ mã.' };
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Nội dung mã bị hỏng.' };
  }
  return migrate(data);
}
