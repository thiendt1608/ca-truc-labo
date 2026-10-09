import { create } from 'zustand';
import {
  advance,
  applyCommand,
  computeReport,
  createShift,
  getContent,
  type Command,
  type Difficulty,
  type HelpContext,
  type ShiftReport,
  type ShiftState,
  type SimEvent,
  type StepResult,
} from '../sim';
import { t } from '../i18n';
import { emptySave, type SaveData, type Settings } from '../platform/save';
import { loadSave, writeSave } from '../platform/storage';

/** Phân phối lệnh không có `t`: store tự gắn đồng hồ hiện tại. */
type CommandInput = Command extends infer C ? (C extends Command ? Omit<C, 't'> : never) : never;

export type Screen = 'home' | 'briefing' | 'room' | 'report' | 'codex' | 'settings';
export type Overlay =
  | null
  | { kind: 'sample'; sampleId: string }
  | { kind: 'centrifuge' }
  | { kind: 'postspin' }
  | { kind: 'analyzer' }
  | { kind: 'results' }
  | { kind: 'qc' }
  | { kind: 'urine' }
  | { kind: 'phone' }
  | { kind: 'event' }
  | { kind: 'codex' }
  | { kind: 'baskets' };

export interface Toast {
  id: number;
  kind: 'mistake' | 'good' | 'info';
  text: string;
  /** Số lần thông báo giống hệt bị gộp lại. */
  count: number;
}

/** Một ca ngày chạy khoảng 6 phút thực ở mức Thường, dù ca dài hay ngắn (04-GDD mục 4). */
export const TARGET_REAL_SECONDS = 360;
/** Số giây game trôi qua mỗi giây thực của một ca. */
export function timeScale(durationSeconds: number): number {
  return durationSeconds / TARGET_REAL_SECONDS;
}
/** Tấm làm việc: giờ vẫn chạy nhưng chậm (hệ số `workSheetClockFactor` trong difficulty.json). */
const WORK_SHEETS: readonly string[] = ['sample', 'centrifuge', 'postspin', 'analyzer', 'results', 'urine'];

/** Phần của store quyết định nhịp đồng hồ. */
export interface ClockGate {
  overlay: Overlay;
  /** Có mini-game đang mở trong lõi (kể cả khi còn chờ người chơi bấm "Dọn ngay"). */
  minigame: boolean;
  /** Có thẻ Sổ tay mở bằng nút "?". */
  help: boolean;
  /** Số mẹo đang xếp hàng (chỉ giữ giờ khi không có lớp phủ). */
  tips: number;
}
/**
 * Hệ số nhân tốc độ đồng hồ: 0 = dừng hẳn (mẹo, mini-game toàn màn, QC/điện thoại/sự kiện/Sổ tay, thẻ "?"),
 * `workFactor` = đang mở tấm làm việc, 1 = bình thường (04-GDD mục 4; chủ dự án chọn sau playtest).
 */
export function clockFactor(g: ClockGate, workFactor: number): number {
  if (g.help || g.minigame) return 0;
  if (g.overlay !== null) {
    if (DECISION_SCREENS.includes(g.overlay.kind)) return 0;
    return WORK_SHEETS.includes(g.overlay.kind) ? workFactor : 1;
  }
  return g.tips > 0 ? 0 : 1;
}
/** Ngày sau đó hiện thẻ nhắc lưu bền một lần (07-TDD mục 7). */
const INSTALL_HINT_DAY = 'ch0-d3';
const MAX_TOASTS = 2;
/** Màn quyết định lớn: dừng giờ khi đang mở (04-GDD mục 4). */
const DECISION_SCREENS: readonly string[] = ['qc', 'phone', 'event', 'codex'];
/** Mẹo chỉ có nghĩa khi đang mở QC sheet, nên không xếp hàng chung với mẹo của phòng. */
const INLINE_TIPS: readonly string[] = ['qcRun', 'qcFailed', 'eventDecision'];

/** Nội dung thẻ nhắc trước mini-game tự bật. */
export interface MinigameNotice {
  title: string;
  text: string;
}
/** Ống vỡ khi ly tâm lệch (không có sự kiện đi kèm). */
const AUTO_SPILL_NOTICE: MinigameNotice = {
  title: '💥 Ống vỡ trong máy ly tâm',
  text: 'Một ống vừa vỡ trong máy ly tâm! Phải dọn đúng quy trình an toàn.',
};

/** Thêm thông báo; thông báo trùng nội dung được gộp thành "×n" thay vì xếp chồng. */
export function pushToasts(current: Toast[], incoming: Omit<Toast, 'count'>[]): Toast[] {
  let list = current;
  for (const n of incoming) {
    const dup = list.find((x) => x.text === n.text && x.kind === n.kind);
    list = dup
      ? [...list.filter((x) => x !== dup), { ...n, count: dup.count + 1 }]
      : [...list, { ...n, count: 1 }];
  }
  return list.slice(-MAX_TOASTS);
}

interface GameStore {
  screen: Screen;
  save: SaveData;
  difficulty: Difficulty;
  dayId: string;
  seed: string | null;
  shift: ShiftState | null;
  log: Command[];
  paused: boolean;
  speed: number;
  overlay: Overlay;
  tips: { id: number; text: string }[];
  /** Mẹo gắn với một lớp phủ (QC), chỉ hiện trong lớp phủ đó và mất khi đóng nó. */
  inlineTips: { id: number; text: string }[];
  toasts: Toast[];
  /** Màn đã mở Cài đặt (để nút Quay lại trở về đúng chỗ). */
  settingsFrom: 'home' | 'room';
  /** Thẻ nhắc "Thêm vào màn hình chính / xuất mã lưu" ở báo cáo (hiện đúng một lần, sau ngày 0.3). */
  installHint: boolean;
  report: ShiftReport | null;
  debug: { enabled: boolean; showHidden: boolean };
  carry: number;
  /** Thẻ Sổ tay đang mở bằng nút "?" (chồng lên màn/lớp phủ hiện tại, dừng giờ trong lúc đọc). */
  help: string | null;
  /** Thẻ nhắc trước mini-game tự bật (ống vỡ, sự kiện rơi vỡ); null khi không có hoặc người chơi đã xác nhận. */
  mgNotice: (MinigameNotice & { taskId: string }) | null;
  /** Thẻ đã đọc trong ca này nhưng chưa nằm trong bản lưu (lưu vào `codexSeen` khi hết ca). */
  seenInShift: string[];

  init(): Promise<void>;
  go(screen: Screen): void;
  setDifficulty(d: Difficulty): void;
  setSetting(patch: Partial<Settings>): void;
  openSettings(from: 'home' | 'room'): void;
  importSave(save: SaveData): void;
  resetSave(): void;
  openDay(dayId: string): void;
  startShift(seed?: string): void;
  dispatch(cmd: CommandInput): SimEvent[];
  tickReal(ms: number): void;
  setPaused(p: boolean): void;
  setSpeed(s: number): void;
  setOverlay(o: Overlay): void;
  dismissTip(id: number): void;
  dropToast(id: number): void;
  setDebug(patch: Partial<GameStore['debug']>): void;
  /** Nút "?": mở thẻ Sổ tay liên quan nhất tới `context` (map trong content/codex/help.json). */
  openHelp(context: HelpContext): void;
  closeHelp(): void;
  /** Người chơi bấm "Dọn ngay" trên thẻ nhắc: mini-game (đã mở trong lõi) hiện ra. */
  ackMinigame(): void;
  /** Đánh dấu thẻ đã đọc (bỏ dấu "Mới"). */
  markCodexSeen(id: string): void;
}

let toastId = 0;

export const useGame = create<GameStore>((set, getState) => {
  /** Nhận kết quả một bước của lõi: cập nhật state, biến events thành mẹo/thông báo, kết thúc ca. */
  const absorb = (r: StepResult, auto = false) => {
    const content = getContent();
    const day = content.dayById.get(r.state.dayId);
    const tips: GameStore['tips'] = [];
    const inlineTips: GameStore['tips'] = [];
    let openOverlay: Overlay | null = null;
    const toasts: Omit<Toast, 'count'>[] = [];
    // Mini-game tự bật do thời gian trôi (ống vỡ, sự kiện rơi vỡ): xin người chơi xác nhận rồi mới vào,
    // thay vì chiếm màn hình đột ngột. Mini-game do chính lệnh của người chơi (từ chối lọ rò, pha loãng...) vào luôn.
    const started = auto ? r.events.find((e) => e.type === 'minigameStarted') : undefined;
    let notice: MinigameNotice | null = null;
    if (started?.type === 'minigameStarted') {
      const ev = r.events.find(
        (e) => e.type === 'eventStarted' && content.events.events[e.eventId]?.kind === 'spill',
      );
      notice = ev?.type === 'eventStarted' ? { title: ev.title, text: ev.text } : AUTO_SPILL_NOTICE;
    }
    for (const e of r.events) {
      if (e.type === 'tip') {
        const tip = day?.tips.find((x) => x.trigger === e.trigger);
        if (tip)
          (INLINE_TIPS.includes(e.trigger) ? inlineTips : tips).push({ id: ++toastId, text: tip.text });
      } else if (e.type === 'mistakeRecorded') {
        const delta = e.entry.trustDelta ? ` (${e.entry.trustDelta} Niềm tin)` : '';
        const detail = e.entry.detail ? ` ${e.entry.detail}` : '';
        toasts.push({
          id: ++toastId,
          kind: 'mistake',
          text: `${t(e.entry.explanationKey)}${detail}${delta}`,
        });
      } else if (e.type === 'trustChanged' && e.delta > 0) {
        toasts.push({ id: ++toastId, kind: 'good', text: `+${e.delta} Niềm tin` });
      } else if (e.type === 'tubeBroken') {
        if (!notice) toasts.push({ id: ++toastId, kind: 'mistake', text: 'Một ống bị vỡ trong máy ly tâm!' });
      } else if (e.type === 'eventStarted') {
        if (!notice || content.events.events[e.eventId]?.kind !== 'spill')
          toasts.push({ id: ++toastId, kind: 'info', text: `${e.title}: ${e.text}` });
        if (e.decision) openOverlay = { kind: 'event' };
      } else if (e.type === 'notice') {
        toasts.push({ id: ++toastId, kind: e.tone === 'bad' ? 'mistake' : e.tone, text: e.text });
      } else if (e.type === 'invalidCommand') {
        toasts.push({ id: ++toastId, kind: 'info', text: e.message });
      }
    }
    const ended = r.events.find((e) => e.type === 'shiftEnded');
    set((st) => ({
      shift: r.state,
      tips: [...st.tips, ...tips].slice(-3),
      inlineTips: inlineTips.length > 0 ? inlineTips.slice(-1) : st.inlineTips,
      toasts: pushToasts(st.toasts, toasts),
      ...(openOverlay ? { overlay: openOverlay } : {}),
      ...(notice && started?.type === 'minigameStarted'
        ? { mgNotice: { ...notice, taskId: started.minigame.taskId } }
        : {}),
    }));
    if (ended) finish(r.state);
    return r.events;
  };

  const finish = (state: ShiftState) => {
    const report = computeReport(state);
    const { save, difficulty } = getState();
    const prev = save.days[state.dayId];
    const showHint = state.dayId === INSTALL_HINT_DAY && !save.installHintShown;
    const next: SaveData = {
      ...save,
      installHintShown: save.installHintShown || showHint,
      difficulty,
      days: {
        ...save.days,
        [state.dayId]: {
          stars: Math.max(prev?.stars ?? 0, report.stars),
          score: Math.max(prev?.score ?? 0, report.total),
          plays: (prev?.plays ?? 0) + 1,
        },
      },
      codex: [...new Set([...save.codex, ...state.codexUnlocked])],
      codexSeen: [
        ...new Set([
          ...save.codexSeen,
          ...state.codexUnlocked.filter((id) => getState().seenInShift.includes(id)),
        ]),
      ],
      budget: save.budget + report.budget,
    };
    void writeSave(next);
    set({
      report,
      save: next,
      screen: 'report',
      overlay: null,
      help: null,
      mgNotice: null,
      paused: false,
      installHint: showHint,
    });
  };

  return {
    screen: 'home',
    save: emptySave(),
    difficulty: 'normal',
    dayId: 'ch0-d1',
    seed: null,
    shift: null,
    log: [],
    paused: false,
    speed: 1,
    overlay: null,
    tips: [],
    inlineTips: [],
    toasts: [],
    settingsFrom: 'home',
    installHint: false,
    report: null,
    debug: { enabled: false, showHidden: false },
    carry: 0,
    help: null,
    mgNotice: null,
    seenInShift: [],

    async init() {
      const save = await loadSave();
      const enabled = new URLSearchParams(location.search).has('debug');
      // Chỉ khi ?debug=1: e2e dùng cửa này để dựng tình huống (kết quả chờ duyệt, QC hỏng) mà không phải chơi cả ca.
      if (enabled) Object.assign(window, { __game: useGame, __content: getContent() });
      set({ save, difficulty: save.difficulty, debug: { enabled, showHidden: false } });
    },
    go(screen) {
      set({ screen, overlay: null, help: null, mgNotice: null });
    },
    setDifficulty(difficulty) {
      set((st) => ({ difficulty, save: { ...st.save, difficulty } }));
      void writeSave({ ...getState().save, difficulty });
    },
    setSetting(patch) {
      const save = { ...getState().save, settings: { ...getState().save.settings, ...patch } };
      set({ save });
      void writeSave(save);
    },
    openSettings(settingsFrom) {
      set({ settingsFrom, screen: 'settings', overlay: null });
    },
    importSave(save) {
      set({ save, difficulty: save.difficulty });
      void writeSave(save);
    },
    resetSave() {
      // Xóa tiến trình (ngày, Sổ tay, ngân sách); giữ độ khó và cài đặt vì đó là tuỳ chọn, không phải tiến trình.
      const { save } = getState();
      const next: SaveData = {
        ...emptySave(),
        difficulty: save.difficulty,
        settings: save.settings,
        installHintShown: save.installHintShown,
      };
      set({ save: next });
      void writeSave(next);
    },
    openDay(dayId) {
      set({ dayId, screen: 'briefing' });
    },
    startShift(seed) {
      const { dayId, difficulty } = getState();
      const s = seed ?? getState().seed ?? `${dayId}-${Date.now().toString(36)}`;
      set({
        log: [],
        tips: [],
        inlineTips: [],
        toasts: [],
        report: null,
        overlay: null,
        help: null,
        mgNotice: null,
        seenInShift: [],
        paused: false,
        speed: 1,
        carry: 0,
        installHint: false,
        seed: null,
      });
      absorb(createShift({ content: getContent(), dayId, seed: s, difficulty }));
      set({ screen: 'room' });
    },
    dispatch(input) {
      const { shift } = getState();
      if (!shift || shift.ended) return [];
      const cmd = { ...input, t: shift.clock } as Command;
      set((st) => ({ log: [...st.log, cmd] }));
      return absorb(applyCommand(shift, cmd, getContent()));
    },
    tickReal(ms) {
      const { shift, paused, speed, difficulty, carry, screen, overlay, tips, help, mgNotice } = getState();
      if (!shift || shift.ended || paused || screen !== 'room') return;
      const content = getContent();
      const factor = clockFactor(
        {
          overlay,
          minigame: shift.minigame !== null || mgNotice !== null,
          help: help !== null,
          tips: tips.length,
        },
        content.difficulty.workSheetClockFactor,
      );
      if (factor === 0) return;
      const total =
        carry +
        (ms / 1000) *
          timeScale(shift.duration) *
          content.difficulty.levels[difficulty].clockSpeed *
          speed *
          factor;
      const whole = Math.floor(total);
      set({ carry: total - whole });
      if (whole > 0) absorb(advance(shift, Math.min(whole, 600), content), true);
    },
    ackMinigame() {
      set({ mgNotice: null });
    },
    setPaused(paused) {
      set({ paused });
    },
    setSpeed(speed) {
      set({ speed });
    },
    setOverlay(overlay) {
      set(overlay?.kind === 'qc' || overlay?.kind === 'event' ? { overlay } : { overlay, inlineTips: [] });
    },
    dismissTip(id) {
      set((st) => ({
        tips: st.tips.filter((x) => x.id !== id),
        inlineTips: st.inlineTips.filter((x) => x.id !== id),
      }));
    },
    dropToast(id) {
      set((st) => ({ toasts: st.toasts.filter((x) => x.id !== id) }));
    },
    setDebug(patch) {
      set((st) => ({ debug: { ...st.debug, ...patch } }));
    },
    openHelp(context) {
      const card = getContent().codexHelp[context];
      if (card) set({ help: card });
    },
    closeHelp() {
      set({ help: null });
    },
    markCodexSeen(id) {
      const { save, seenInShift } = getState();
      if (!seenInShift.includes(id)) set({ seenInShift: [...seenInShift, id] });
      if (save.codex.includes(id) && !save.codexSeen.includes(id)) {
        const next = { ...save, codexSeen: [...save.codexSeen, id] };
        set({ save: next });
        void writeSave(next);
      }
    },
  };
});

/** Mức độ khó của ca đang chơi có gợi ý (ống cần dùng, bước tiếp theo, ô chưa cân bằng...) không. */
export function useHints(): boolean {
  return useGame((s) => getContent().difficulty.levels[s.shift?.difficulty ?? s.difficulty].hints);
}

/** Hệ số đồng hồ hiện tại (0 = dừng, <1 = giờ chậm vì đang mở tấm làm việc, 1 = bình thường). */
export function useClockFactor(): number {
  return useGame((s) =>
    clockFactor(
      {
        overlay: s.overlay,
        minigame: s.shift?.minigame != null || s.mgNotice !== null,
        help: s.help !== null,
        tips: s.tips.length,
      },
      getContent().difficulty.workSheetClockFactor,
    ),
  );
}

/** Thẻ đã mở: nằm trong bản lưu hoặc vừa mở trong ca đang chơi. */
export function isCardUnlocked(st: Pick<GameStore, 'save' | 'shift'>, id: string): boolean {
  return st.save.codex.includes(id) || (st.shift?.codexUnlocked.includes(id) ?? false);
}

/** Giờ hiển thị HH:MM từ đồng hồ ca. */
export function clockText(state: ShiftState, at = state.clock): string {
  const secs = state.dayStart + at;
  const h = Math.floor(secs / 3600) % 24;
  const m = Math.floor((secs % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function secondsOfDayText(secs: number): string {
  const h = Math.floor(secs / 3600) % 24;
  const m = Math.floor((secs % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Tiến độ (0–100) của một lượt chạy máy, đóng băng trong lúc mất điện (kết thúc đã bị đẩy lùi đúng khoảng mất điện). */
export function runProgress(state: ShiftState, endsAt: number, total: number): number {
  const outage = Math.max(0, state.effects.powerOutUntil - state.clock);
  return Math.max(0, Math.min(100, 100 - ((endsAt - state.clock - outage) / total) * 100));
}
