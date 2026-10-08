import { z } from 'zod';

/** Schema cho dữ liệu trong thư mục content/. Kiểm tra lúc chạy game, lúc test và bằng `pnpm content:check`. */

export const DeptIdSchema = z.enum(['chem', 'heme', 'micro', 'immuno', 'patho']);
export const RoomIdSchema = z.enum(['reception', 'chem', 'heme', 'micro', 'immuno', 'patho']);
export const ContainerIdSchema = z.enum(['purple', 'lightblue', 'green', 'red', 'grey', 'urine']);
export const PrioritySchema = z.enum(['routine', 'stat']);
export const RejectReasonSchema = z.enum(['identity', 'container', 'volume', 'time', 'leak', 'hemolysis']);
export const LabelFieldSchema = z.enum(['name', 'birthYear', 'patientCode']);

export const DefectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('noLabel') }),
  z.object({ kind: z.literal('labelMismatch'), field: LabelFieldSchema }),
  z.object({ kind: z.literal('wrongContainer') }),
  z.object({ kind: z.literal('underfill') }),
  z.object({ kind: z.literal('delayed') }),
  z.object({ kind: z.literal('leak') }),
  z.object({ kind: z.literal('hemolysis'), level: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
  z.object({ kind: z.literal('lipemia') }),
  z.object({ kind: z.literal('icterus') }),
]);
export const DefectKindSchema = z.enum([
  'noLabel',
  'labelMismatch',
  'wrongContainer',
  'underfill',
  'delayed',
  'leak',
  'hemolysis',
  'lipemia',
  'icterus',
]);

export const ContainerSchema = z.object({
  id: ContainerIdSchema,
  name: z.string(),
  letter: z.string().length(1),
  additive: z.string(),
  kind: z.enum(['tube', 'cup']),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  spin: z.boolean(),
});

export const WardSchema = z.object({ id: z.string(), name: z.string(), statRate: z.number().min(0).max(1) });

export const NamesSchema = z.object({
  family: z.array(z.string()).min(1),
  middle: z.object({ M: z.array(z.string()).min(1), F: z.array(z.string()).min(1) }),
  given: z.object({ M: z.array(z.string()).min(1), F: z.array(z.string()).min(1) }),
  lookalike: z.array(z.tuple([z.string(), z.string()])),
});

export const TestCatalogSchema = z.object({
  code: z.string(),
  name: z.string(),
  dept: DeptIdSchema,
  containers: z.array(ContainerIdSchema).min(1),
  /** Làm tay (không qua máy phân tích): không cần khai báo trong chem/tests.json. */
  manual: z.boolean().optional(),
});

export const OrderTypeSchema = z.object({
  id: z.string(),
  dept: DeptIdSchema,
  count: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
  testsFrom: z.array(z.string()).min(1),
  container: z.object({ stat: ContainerIdSchema, routine: ContainerIdSchema }),
});

const MeanSd = z.tuple([z.number(), z.number().min(0)]);
export const ProfilesSchema = z.object({
  base: z.record(z.string(), MeanSd),
  profiles: z.array(
    z.object({ id: z.string(), critical: z.boolean().optional(), values: z.record(z.string(), MeanSd) }),
  ),
});

const Range = z.tuple([z.number(), z.number()]);
export const AnalyteSchema = z.object({
  code: z.string(),
  name: z.string(),
  unit: z.string(),
  decimals: z.number().int().min(0).max(3),
  ref: Range,
  refF: Range.optional(),
  critical: Range.optional(),
  max: z.number().positive(),
});
export const ChemTestSchema = z.object({ code: z.string(), analytes: z.array(AnalyteSchema).min(1) });

const RuleOutcome = z.object({ explanationKey: z.string(), codex: z.string() });
export const ReceptionRulesSchema = z.object({
  source: z.array(z.string()),
  maxTransportMinutes: z.number().positive(),
  timeSensitiveTests: z.array(z.string()),
  timeExemptContainers: z.record(z.string(), z.array(ContainerIdSchema)),
  defects: z.array(
    RuleOutcome.extend({
      defect: DefectKindSchema,
      decision: z.literal('reject'),
      reason: RejectReasonSchema,
      releaseTrust: z.number().max(0),
    }),
  ),
  irreplaceable: RuleOutcome.extend({ decision: z.literal('contact') }),
});

export const ChemRulesSchema = z.object({
  source: z.array(z.string()),
  hemolysisAffects: z.object({
    '1': z.array(z.string()),
    '2': z.array(z.string()),
    '3': z.array(z.string()),
  }),
  hemolysisEffect: z.record(z.string(), z.number()),
  lipemia: RuleOutcome.extend({ decision: z.literal('highSpeedSpin') }),
  icterus: RuleOutcome.extend({ decision: z.literal('load') }),
  hemolysis: RuleOutcome.extend({ decision: z.literal('reject'), reason: RejectReasonSchema }),
  centrifuge: z.object({
    slots: z.number().int().min(2).multipleOf(2),
    spinSeconds: z.number().positive(),
    abortAfterSeconds: z.number().positive(),
    breakChance: z.number().min(0).max(1),
  }),
  analyzer: z.object({ secondsPerSample: z.number().positive() }),
  recollectSeconds: z.number().positive(),
  dilution: z.object({
    ratios: z.array(z.number().int().min(2)).min(1),
    explanationKey: z.string(),
    codex: z.string(),
  }),
  delta: z.object({
    /** Tỉ lệ bệnh nhân thật sự thay đổi so với lần trước (Δ hợp lệ, không phải nhầm người). */
    genuineRate: z.number().min(0).max(1),
    codex: z.string(),
    /** Ngưỡng chênh tương đối so với lần trước, theo mã chất phân tích. */
    rel: z.record(z.string(), z.number().positive()),
  }),
});

export const QcRemedySchema = z.enum(['rerun', 'newControl', 'newReagent', 'calibrate', 'callEngineer']);
const QcPoint = z.tuple([z.number(), z.number().min(0)]);

export const QcRulesSchema = z.object({
  source: z.array(z.string()),
  historyRuns: z.number().int().min(0),
  normal: z.object({ mean: z.number(), sd: z.number().positive(), clamp: z.number().positive() }),
  remedies: z.record(QcRemedySchema, z.object({ label: z.string(), seconds: z.number().positive() })),
  scenarios: z.record(
    z.string(),
    z.object({
      remedy: QcRemedySchema,
      /** Độ lệch tương đối của kết quả bệnh nhân khi lỗi còn tồn tại (nhân với dấu của lỗi). */
      bias: z.number().min(0),
      history: z.enum(['flat', 'trend']),
      /** Lỗi còn lại ở các lần chạy sau (false: chỉ xuất hiện đúng một lần). */
      persists: z.boolean(),
      run: z.object({ z1: QcPoint, z2: QcPoint }),
      explanationKey: z.string(),
      codex: z.string(),
    }),
  ),
});

const UrineLevelRange = z.tuple([z.number().int().min(0), z.number().int().min(0)]);
export const UrineRulesSchema = z.object({
  source: z.array(z.string()),
  /** Thời gian tối đa (ms thực) cho cả mini-game; quá thì trừ điểm Tay nghề. */
  timeLimitMs: z.number().positive(),
  /** Mỗi mili giây thực đại diện cho bao nhiêu mili giây ngoài đời (để hiển thị đồng hồ giây-ngoài-đời). */
  msPerSimSecond: z.number().positive(),
  pads: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      readAtMs: z.number().positive(),
      readLabel: z.string(),
      levels: z.array(z.string()).min(2),
      normal: z.array(z.number().int().min(0)).min(1),
      colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).min(2),
    }),
  ),
  healthyRange: z.record(z.string(), UrineLevelRange),
  profiles: z.record(z.string(), z.record(z.string(), UrineLevelRange)),
});

export const EventIdSchema = z.enum(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10']);

export const EventsSchema = z.object({
  source: z.array(z.string()),
  phone: z.object({
    expireSeconds: z.number().positive(),
    missedPerPenalty: z.number().int().min(1),
    missedTrust: z.number().max(0),
    correctTrust: z.number().min(0),
    wrongTrust: z.number().max(0),
    from: z.array(z.string()).min(1),
    options: z.object({ report: z.string(), wait: z.string(), later: z.string() }),
  }),
  events: z.record(
    EventIdSchema,
    z.object({
      kind: z.enum([
        'statRush',
        'call',
        'machineFault',
        'unlabeled',
        'spill',
        'slowLis',
        'soloLunch',
        'inspection',
        'power',
        'quiz',
      ]),
      title: z.string(),
      text: z.string(),
      count: z.number().int().min(1).optional(),
      spread: z.number().min(0).optional(),
      seconds: z.number().positive().optional(),
      factor: z.number().positive().optional(),
      defect: DefectKindSchema.optional(),
      maxWaitSeconds: z.number().positive().optional(),
      passText: z.string().optional(),
      failText: z.string().optional(),
      reward: z.number().optional(),
      expireSeconds: z.number().positive().optional(),
      failSeconds: z.number().positive().optional(),
      options: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            seconds: z.number().positive(),
            successRate: z.number().min(0).max(1),
          }),
        )
        .optional(),
    }),
  ),
  quizzes: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.tuple([z.string(), z.string()]),
      correct: z.union([z.literal(0), z.literal(1)]),
      explain: z.string(),
      codex: z.string(),
    }),
  ),
});

export const UnlockSchema = z.enum([
  'routeChem',
  'routeHeme',
  'routeAll',
  'contact',
  'centrifuge',
  'analyzer',
  'release',
  'postSpinCheck',
  'qc',
  'critical',
  'delta',
  'dilution',
  'urine',
  'releaseAllUnflagged',
]);

export const TipTriggerSchema = z.enum([
  'start',
  'sampleOpened',
  'sampleAccepted',
  'mistake',
  'statArrived',
  'centrifugeShake',
  'centrifugeDone',
  'resultReady',
  'spill',
  'qcRun',
  'qcFailed',
  'overRange',
  'deltaFlag',
  'phoneRing',
  'eventDecision',
]);

export const DayConfigSchema = z.object({
  id: z.string().regex(/^ch\d-d\d$/),
  chapter: z.number().int().min(0).max(6),
  day: z.number().int().min(1),
  room: RoomIdSchema,
  title: z.string(),
  mentor: z.string(),
  newThings: z.array(z.string()),
  start: z.number().int().min(0),
  end: z.number().int().positive(),
  startTrust: z.number().min(1).max(100),
  unlocks: z.array(UnlockSchema),
  tat: z.object({
    stat: z.number().positive(),
    routine: z.number().positive(),
    reception: z.number().positive(),
  }),
  waves: z.array(
    z.object({ at: z.number().min(0), count: z.number().int().min(1), spread: z.number().min(0) }),
  ),
  orderTypes: z.record(z.string(), z.number().min(0)),
  defects: z.partialRecord(DefectKindSchema, z.number().min(0).max(1)),
  profiles: z.record(z.string(), z.number().min(0)),
  scripted: z.array(
    z.object({
      index: z.number().int().min(0),
      priority: PrioritySchema.optional(),
      orderType: z.string().optional(),
      tests: z.array(z.string()).optional(),
      defects: z.array(DefectSchema).optional(),
      /** Ép hồ sơ bệnh của bệnh nhân (để dạy một tình huống cụ thể). */
      profile: z.string().optional(),
    }),
  ),
  /** Sự kiện của ngày: `at` là giây kể từ đầu ca (không có thì rơi ngẫu nhiên, vẫn tất định theo hạt giống). */
  events: z.array(z.object({ id: EventIdSchema, at: z.number().min(0).optional() })).default([]),
  /** Có thì máy hoá sinh chỉ chạy mẫu bệnh nhân sau khi QC đạt; `scenario` là lỗi ẩn của ngày. */
  qc: z.object({ scenario: z.string() }).optional(),
  tips: z.array(z.object({ trigger: TipTriggerSchema, text: z.string().max(200) })),
  codexOnStart: z.array(z.string()),
});

export const CodexCardSchema = z.object({
  id: z.string(),
  dept: RoomIdSchema,
  title: z.string(),
  body: z.string(),
  more: z.string(),
  source: z.array(z.string()).min(1),
});

export const I18nSchema = z.record(z.string(), z.string());

export const RawContentSchema = z.object({
  containers: z.array(ContainerSchema),
  wards: z.array(WardSchema).min(1),
  names: NamesSchema,
  tests: z.array(TestCatalogSchema),
  orderTypes: z.array(OrderTypeSchema),
  profiles: ProfilesSchema,
  receptionRules: ReceptionRulesSchema,
  chemTests: z.array(ChemTestSchema),
  chemRules: ChemRulesSchema,
  chemQc: QcRulesSchema,
  chemUrine: UrineRulesSchema,
  events: EventsSchema,
  days: z.array(DayConfigSchema),
  codex: z.array(CodexCardSchema),
  i18n: I18nSchema,
});

export type RawContent = z.infer<typeof RawContentSchema>;
export type DeptId = z.infer<typeof DeptIdSchema>;
export type RoomId = z.infer<typeof RoomIdSchema>;
export type ContainerId = z.infer<typeof ContainerIdSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type RejectReason = z.infer<typeof RejectReasonSchema>;
export type Defect = z.infer<typeof DefectSchema>;
export type DefectKind = z.infer<typeof DefectKindSchema>;
export type LabelField = z.infer<typeof LabelFieldSchema>;
export type Container = z.infer<typeof ContainerSchema>;
export type Ward = z.infer<typeof WardSchema>;
export type TestCatalogEntry = z.infer<typeof TestCatalogSchema>;
export type OrderType = z.infer<typeof OrderTypeSchema>;
export type Analyte = z.infer<typeof AnalyteSchema>;
export type ChemTest = z.infer<typeof ChemTestSchema>;
export type ReceptionRules = z.infer<typeof ReceptionRulesSchema>;
export type ChemRules = z.infer<typeof ChemRulesSchema>;
export type EventsRules = z.infer<typeof EventsSchema>;
export type EventId = z.infer<typeof EventIdSchema>;
export type UrineRules = z.infer<typeof UrineRulesSchema>;
export type QcRules = z.infer<typeof QcRulesSchema>;
export type QcRemedy = z.infer<typeof QcRemedySchema>;
export type Unlock = z.infer<typeof UnlockSchema>;
export type TipTrigger = z.infer<typeof TipTriggerSchema>;
export type DayConfig = z.infer<typeof DayConfigSchema>;
export type CodexCard = z.infer<typeof CodexCardSchema>;
