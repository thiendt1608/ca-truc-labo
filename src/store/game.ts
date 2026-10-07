import { create } from 'zustand';
import {
  advance,
  applyCommand,
  computeReport,
  createShift,
  getContent,
  type Command,
  type Difficulty,
  type ShiftReport,
  type ShiftState,
  type SimEvent,
  type StepResult,
} from '../sim';
import { t } from '../i18n';
import { emptySave, loadSave, writeSave, type SaveData } from '../platform/storage';

/** Phân phối lệnh không có `t`: store tự gắn đồng hồ hiện tại. */
type CommandInput = Command extends infer C ? (C extends Command ? Omit<C, 't'> : never) : never;

export type Screen = 'home' | 'briefing' | 'room' | 'report' | 'codex';
export type Overlay =
  | null
  | { kind: 'sample'; sampleId: string }
  | { kind: 'centrifuge' }
  | { kind: 'postspin' }
  | { kind: 'analyzer' }
  | { kind: 'results' }
  | { kind: 'baskets' };

export interface Toast {
  id: number;
  kind: 'mistake' | 'good' | 'info';
  text: string;
}

/** Tỉ lệ thời gian: 1 giây thực ≈ 80 giây game (07-TDD mục 4.1). */
export const TIME_SCALE = 80;
const DIFFICULTY_SPEED: Record<Difficulty, number> = { easy: 0.6, normal: 1, hard: 1.2 };

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
  toasts: Toast[];
  report: ShiftReport | null;
  debug: { enabled: boolean; showHidden: boolean };
  carry: number;

  init(): Promise<void>;
  go(screen: Screen): void;
  setDifficulty(d: Difficulty): void;
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
}

let toastId = 0;

export const useGame = create<GameStore>((set, getState) => {
  /** Nhận kết quả một bước của lõi: cập nhật state, biến events thành mẹo/thông báo, kết thúc ca. */
  const absorb = (r: StepResult) => {
    const content = getContent();
    const day = content.dayById.get(r.state.dayId);
    const tips: GameStore['tips'] = [];
    const toasts: Toast[] = [];
    for (const e of r.events) {
      if (e.type === 'tip') {
        const tip = day?.tips.find((x) => x.trigger === e.trigger);
        if (tip) tips.push({ id: ++toastId, text: tip.text });
      } else if (e.type === 'mistakeRecorded') {
        const delta = e.entry.trustDelta ? ` (${e.entry.trustDelta} Niềm tin)` : '';
        toasts.push({ id: ++toastId, kind: 'mistake', text: `${t(e.entry.explanationKey)}${delta}` });
      } else if (e.type === 'trustChanged' && e.delta > 0) {
        toasts.push({ id: ++toastId, kind: 'good', text: `+${e.delta} Niềm tin` });
      } else if (e.type === 'tubeBroken') {
        toasts.push({ id: ++toastId, kind: 'mistake', text: 'Một ống bị vỡ trong máy ly tâm!' });
      } else if (e.type === 'invalidCommand') {
        toasts.push({ id: ++toastId, kind: 'info', text: e.message });
      }
    }
    const ended = r.events.find((e) => e.type === 'shiftEnded');
    set((st) => ({
      shift: r.state,
      tips: [...st.tips, ...tips].slice(-3),
      toasts: [...st.toasts, ...toasts].slice(-4),
    }));
    if (ended) finish(r.state);
    return r.events;
  };

  const finish = (state: ShiftState) => {
    const report = computeReport(state);
    const { save, difficulty } = getState();
    const prev = save.days[state.dayId];
    const next: SaveData = {
      ...save,
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
      budget: save.budget + report.budget,
    };
    void writeSave(next);
    set({ report, save: next, screen: 'report', overlay: null, paused: false });
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
    toasts: [],
    report: null,
    debug: { enabled: false, showHidden: false },
    carry: 0,

    async init() {
      const save = await loadSave();
      const enabled = new URLSearchParams(location.search).has('debug');
      set({ save, difficulty: save.difficulty, debug: { enabled, showHidden: false } });
    },
    go(screen) {
      set({ screen, overlay: null });
    },
    setDifficulty(difficulty) {
      set((st) => ({ difficulty, save: { ...st.save, difficulty } }));
      void writeSave({ ...getState().save, difficulty });
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
        toasts: [],
        report: null,
        overlay: null,
        paused: false,
        speed: 1,
        carry: 0,
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
      const { shift, paused, speed, difficulty, carry, screen } = getState();
      if (!shift || shift.ended || paused || screen !== 'room') return;
      const total = carry + (ms / 1000) * TIME_SCALE * DIFFICULTY_SPEED[difficulty] * speed;
      const whole = Math.floor(total);
      set({ carry: total - whole });
      if (whole > 0) absorb(advance(shift, Math.min(whole, 600), getContent()));
    },
    setPaused(paused) {
      set({ paused });
    },
    setSpeed(speed) {
      set({ speed });
    },
    setOverlay(overlay) {
      set({ overlay });
    },
    dismissTip(id) {
      set((st) => ({ tips: st.tips.filter((x) => x.id !== id) }));
    },
    dropToast(id) {
      set((st) => ({ toasts: st.toasts.filter((x) => x.id !== id) }));
    },
    setDebug(patch) {
      set((st) => ({ debug: { ...st.debug, ...patch } }));
    },
  };
});

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
