import type {
  ContainerId,
  DayConfig,
  Defect,
  DeptId,
  Priority,
  QcRemedy,
  RejectReason,
  RoomId,
  TipTrigger,
} from '../content/schema';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Patient {
  /** Kết quả lần trước (chỉ có khi ngày bật Δ). */
  previous?: Record<string, number>;
  id: string;
  name: string;
  birthYear: number;
  code: string;
  sex: 'M' | 'F';
  profileId: string;
}

export interface Label {
  name: string;
  birthYear: number;
  patientCode: string;
  collectedAt: number; // giây trong ngày
}

export type SampleStatus =
  | 'tray' // đang chờ kiểm tra
  | 'routed' // Tiếp nhận: đã bỏ vào giỏ khoa
  | 'rejected'
  | 'contacted'
  | 'bench' // Hoá sinh: đã nhận, chờ ly tâm
  | 'centrifuge'
  | 'urine' // lọ nước tiểu đã nhận, chờ nhúng que
  | 'spun' // khay sau ly tâm
  | 'analyzer'
  | 'done'
  | 'broken';

export interface Sample {
  id: string;
  orderId: string;
  container: ContainerId;
  label: Label | null;
  irreplaceable: boolean;
  defects: Defect[];
  /** Thông tin ẩn: không hiển thị cho người chơi (trừ bảng debug). */
  hidden: { truth: Record<string, number>; wrongPatient: boolean };
  /** Hạt giống mini-game que thử (chỉ mẫu nước tiểu): hồ sơ bệnh + số ngẫu nhiên. */
  urineSeed?: string;
  status: SampleStatus;
  arrivedAt: number; // giây game kể từ đầu ca
  decidedAt?: number;
  routedTo?: DeptId;
  opened?: boolean;
  lateCharged?: boolean;
}

export type OrderStatus = 'waiting' | 'running' | 'resulted' | 'released' | 'rejected' | 'cancelled';

export interface AnalyteResult {
  code: string;
  value: number;
  /** Chuỗi hiển thị, ví dụ "5.4" hoặc ">35". */
  display: string;
  flag: '' | 'H' | 'L';
  critical: boolean;
  overRange: boolean;
  /** Kết quả đã pha loãng: giá trị máy đọc × hệ số. */
  dilution?: { ratio: number; reading: number };
  /** Δ: khác nhiều so với lần trước của cùng bệnh nhân. */
  delta?: { previous: number };
}

export interface Order {
  id: string;
  patientId: string;
  ward: string;
  priority: Priority;
  tests: string[];
  dept: DeptId;
  container: ContainerId;
  createdAt: number;
  deadline: number;
  status: OrderStatus;
  sampleId: string;
  results?: AnalyteResult[];
  resultedAt?: number;
  releasedAt?: number;
  hil?: ('H' | 'I' | 'L')[];
  criticalCalled?: boolean;
  lateCharged?: boolean;
  /** Kết quả đo khi QC đang hỏng (lệch thật so với giá trị đúng). */
  qcFault?: boolean;
  /** Đang chạy lại pha loãng cho các chất vượt dải. */
  dilution?: { ratio: number; codes: string[] };
  /** Đã làm lại để kiểm tra Δ. */
  deltaChecked?: boolean;
}

export interface MistakeEntry {
  t: number;
  kind: string;
  explanationKey: string;
  codex?: string;
  trustDelta: number;
  safetyPenalty: number;
  /** Câu giải thích riêng của lần lỗi này (nếu có), hiện thêm trong "Chuyện hôm nay". */
  detail?: string;
  sampleId?: string;
  orderId?: string;
}

export interface ScheduledArrival {
  at: number;
  kind: 'arrival';
  /** Mẫu được sinh sẵn lúc tạo ca (để tất định); `recollectOf` nếu là mẫu lấy lại. */
  sample: Sample;
  order?: Order;
  patient?: Patient;
}
export interface ScheduledCheck {
  at: number;
  kind: 'criticalCheck';
  orderId: string;
}
export type ScheduledItem = ScheduledArrival | ScheduledCheck;

export type SlotContent = string | 'water' | null;

/** QC của máy hoá sinh: lỗi ẩn, các lần chạy control (z-score) và trạng thái chờ người chơi quyết định. */
export interface QcState {
  scenario: string;
  /** Hướng lệch của lỗi (+1 hoặc −1), chọn bằng rng lúc tạo ca. */
  sign: 1 | -1;
  /** Lỗi đang tồn tại (ẩn với người chơi); null khi đã sửa. */
  fault: string | null;
  runs: { z1: number; z2: number }[];
  /** unchecked: chưa chạy control · judging: chờ phán quyết · passed: máy chạy mẫu được · failed: chờ khắc phục. */
  status: 'unchecked' | 'judging' | 'passed' | 'failed';
  /** Máy bận (chạy lại control, thay hoá chất...) tới giây này. */
  blockedUntil: number;
  /** Số phiếu đã trả khi QC hỏng, để giới hạn mức trừ Niềm tin. */
  badReleases: number;
  /** Câu giải thích lần phán quyết/khắc phục sai gần nhất, hiện trong QC sheet tới lần chạy control kế tiếp. */
  note: string | null;
  /** Lần báo Đạt nhầm (để giải thích hậu quả khi trả phiếu). */
  wrongPass: { clock: number; z1: number; z2: number; rules: string[] } | null;
}

export type QcVerdict = 'pass' | 'rerun' | 'fail';

export interface ChemState {
  qc: QcState | null;
  centrifuge: {
    slots: SlotContent[];
    running: boolean;
    endsAt: number;
    /** Lệch cân: máy sẽ dừng sớm. */
    unbalanced: boolean;
    contaminated: boolean;
  };
  analyzer: { queue: string[]; current: { orderId: string; endsAt: number } | null };
}

export interface ActiveMinigame {
  taskId: string;
  minigameId: string;
  seed: string;
  startedAt: number;
  context: 'spill' | 'urine';
  /** Mẫu đang được làm mini-game (nước tiểu). */
  sampleId?: string;
}

export interface SkillEntry {
  source: string;
  skill: number;
}

export interface DecisionStat {
  correct: number;
  total: number;
}

export interface TimelinessEntry {
  id: string;
  onTime: boolean;
  weight: number;
}

export interface ShiftState {
  version: 1;
  seed: string;
  dayId: string;
  room: RoomId;
  difficulty: Difficulty;
  /** Giây game kể từ đầu ca. */
  clock: number;
  duration: number;
  /** Giờ bắt đầu ca trong ngày (giây), để hiển thị đồng hồ. */
  dayStart: number;
  rngState: number;
  trust: number;
  minTrust: number;
  patients: Record<string, Patient>;
  orders: Record<string, Order>;
  samples: Record<string, Sample>;
  chem: ChemState | null;
  scheduled: ScheduledItem[];
  ledger: MistakeEntry[];
  decisions: DecisionStat;
  releases: DecisionStat;
  timeliness: TimelinessEntry[];
  skills: SkillEntry[];
  minigame: ActiveMinigame | null;
  codexUnlocked: string[];
  tipsShown: TipTrigger[];
  nextId: number;
  ended: null | { reason: 'time' | 'trust'; at: number };
}

export type Command =
  | { t: number; type: 'inspectSample'; sampleId: string }
  | { t: number; type: 'acceptSample'; sampleId: string; target?: DeptId }
  | { t: number; type: 'rejectSample'; sampleId: string; reason: RejectReason }
  | { t: number; type: 'contactWard'; sampleId: string }
  | { t: number; type: 'chem/placeTube'; slot: number; content: string | 'water' }
  | { t: number; type: 'chem/clearSlot'; slot: number }
  | { t: number; type: 'startCentrifuge'; centrifugeId: 'c1' }
  | { t: number; type: 'chem/loadAnalyzer'; sampleId: string }
  | { t: number; type: 'chem/highSpeedSpin'; sampleId: string }
  | { t: number; type: 'chem/dilute'; orderId: string; ratio: number }
  | { t: number; type: 'chem/startUrine'; sampleId: string }
  | { t: number; type: 'chem/runQC' }
  | { t: number; type: 'chem/judgeQC'; verdict: QcVerdict }
  | { t: number; type: 'chem/qcAction'; action: QcRemedy }
  | { t: number; type: 'prioritize'; orderId: string }
  | { t: number; type: 'releaseOrder'; orderId: string }
  | { t: number; type: 'rerunOrder'; orderId: string }
  | { t: number; type: 'cancelOrderRecollect'; orderId: string }
  | { t: number; type: 'callCritical'; orderId: string }
  | { t: number; type: 'minigameResult'; taskId: string; actions: PlayerAction[] }
  | { t: number; type: 'debug/forceSpill' }
  | { t: number; type: 'debug/endShift' };

/** Thao tác thô trong mini-game; điểm do hàm thuần `score()` tính. */
export type PlayerAction =
  | { t: number; type: 'tap'; id: string }
  | { t: number; type: 'press' }
  | { t: number; type: 'release' }
  | { t: number; type: 'done' };

export type SimEvent =
  | { type: 'sampleArrived'; sampleId: string; priority: Priority }
  | { type: 'sampleMoved'; sampleId: string; to: SampleStatus }
  | { type: 'centrifugeDone' }
  | { type: 'centrifugeShake' }
  | { type: 'tubeBroken'; sampleId: string }
  | { type: 'resultReady'; orderId: string }
  | { type: 'trustChanged'; delta: number; trust: number }
  | { type: 'mistakeRecorded'; entry: MistakeEntry }
  | { type: 'codexUnlocked'; cardId: string }
  | { type: 'minigameStarted'; minigame: ActiveMinigame }
  | { type: 'minigameFinished'; taskId: string; skill: number; ok: boolean }
  | { type: 'tip'; trigger: TipTrigger }
  | { type: 'shiftEnded'; reason: 'time' | 'trust' }
  | { type: 'invalidCommand'; message: string };

export interface StepResult {
  state: ShiftState;
  events: SimEvent[];
}

export type { DayConfig };
