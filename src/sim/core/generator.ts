import type { ContainerId, Defect, DefectKind, LabelField, Priority } from '../content/schema';
import { newId, unlocked, type Ctx } from './context';
import { urineSeed } from '../minigames/urineStrip';
import type { Rng } from './rng';
import type { Label, Order, Patient, Sample, ScheduledArrival } from './types';

/** Sinh bệnh nhân, phiếu, mẫu và lịch mẫu đổ về cho một ca. Mọi ngẫu nhiên đi qua ctx.rng. */

function makeName(rng: Rng, names: Ctx['content']['names'], sex: 'M' | 'F'): string {
  return `${rng.pick(names.family)} ${rng.pick(names.middle[sex])} ${rng.pick(names.given[sex])}`;
}

export function makeTruth(ctx: Ctx, profileId: string): Record<string, number> {
  const { base, profiles } = ctx.content.profiles;
  const profile = profiles.find((p) => p.id === profileId);
  const truth: Record<string, number> = {};
  for (const [code, [mean, sd]] of Object.entries(base)) {
    const [m, d] = profile?.values[code] ?? [mean, sd];
    truth[code] = Math.max(m * 0.15, ctx.rng.normal(m, d));
  }
  return truth;
}

export function makePatient(ctx: Ctx, profileId?: string): Patient {
  const { rng } = ctx;
  const sex = rng.chance(0.5) ? 'M' : 'F';
  const patient: Patient = {
    id: newId(ctx, 'p'),
    name: makeName(rng, ctx.content.names, sex),
    birthYear: rng.int(1945, 2012),
    code: `BN${String(rng.int(100000, 999999))}`,
    sex,
    profileId: profileId ?? rng.weighted(ctx.day.profiles),
  };
  // Δ: kết quả lần trước. Phần lớn cùng hồ sơ bệnh; một ít là bệnh nhân thật sự thay đổi.
  if (unlocked(ctx, 'delta')) {
    const changed = rng.chance(ctx.content.chemRules.delta.genuineRate);
    patient.previous = makeTruth(ctx, changed ? rng.weighted(ctx.day.profiles) : patient.profileId);
  }
  return patient;
}

function alterLabel(ctx: Ctx, label: Label, field: LabelField): Label {
  const { rng } = ctx;
  const out = { ...label };
  if (field === 'birthYear') {
    out.birthYear = label.birthYear + rng.pick([-3, -2, -1, 1, 2, 3]);
  } else if (field === 'patientCode') {
    const digits = label.patientCode.slice(2).split('');
    const i = rng.int(0, digits.length - 1);
    digits[i] = String((Number(digits[i]) + rng.int(1, 8)) % 10);
    out.patientCode = `BN${digits.join('')}`;
  } else {
    const parts = label.name.split(' ');
    const given = parts[parts.length - 1]!;
    const pair = ctx.content.names.lookalike.find(([a, b]) => a === given || b === given);
    const hard = ctx.s.difficulty === 'hard';
    if (hard && pair) {
      parts[parts.length - 1] = pair[0] === given ? pair[1] : pair[0];
    } else {
      const sexPool = [...ctx.content.names.given.M, ...ctx.content.names.given.F].filter((g) => g !== given);
      parts[parts.length - 1] = rng.pick(sexPool);
    }
    out.name = parts.join(' ');
  }
  return out;
}

function pickTests(ctx: Ctx, from: string[], count: [number, number], fixed?: string[]): string[] {
  if (fixed && fixed.length > 0) return [...fixed];
  const n = Math.min(from.length, ctx.rng.int(count[0], count[1]));
  return ctx.rng.shuffle(from).slice(0, n);
}

function wrongContainerFor(ctx: Ctx, tests: string[]): ContainerId {
  const allowed = new Set(tests.flatMap((code) => ctx.content.testByCode.get(code)?.containers ?? []));
  const options = ctx.content.containers.map((c) => c.id).filter((id) => !allowed.has(id));
  return ctx.rng.pick(options);
}

function rollDefects(ctx: Ctx): Defect[] {
  const rates = ctx.day.defects;
  const order: DefectKind[] = [
    'noLabel',
    'labelMismatch',
    'wrongContainer',
    'underfill',
    'delayed',
    'leak',
    'hemolysis',
    'lipemia',
    'icterus',
  ];
  for (const kind of order) {
    const p = rates[kind] ?? 0;
    if (p > 0 && ctx.rng.chance(p)) {
      if (kind === 'labelMismatch')
        return [{ kind, field: ctx.rng.pick(['name', 'birthYear', 'patientCode'] as const) }];
      if (kind === 'hemolysis') return [{ kind, level: ctx.rng.pick([1, 2, 3] as const) }];
      return [{ kind } as Defect];
    }
  }
  return [];
}

export interface SampleSpec {
  at: number;
  priority?: Priority;
  orderType?: string;
  tests?: string[];
  defects?: Defect[];
  profile?: string;
}

/** Sinh một phiếu + một mẫu (+ bệnh nhân mới). */
export function makeArrival(ctx: Ctx, spec: SampleSpec): ScheduledArrival {
  const { rng, content, day } = ctx;
  const ward = rng.pick(content.wards);
  const priority: Priority = spec.priority ?? (rng.chance(ward.statRate) ? 'stat' : 'routine');
  const orderTypeId = spec.orderType ?? rng.weighted(day.orderTypes);
  const orderType = content.orderTypeById.get(orderTypeId);
  if (!orderType) throw new Error(`Loại phiếu không tồn tại: ${orderTypeId}`);
  const tests = pickTests(ctx, orderType.testsFrom, orderType.count, spec.tests);
  const container = orderType.container[priority];
  const patient = makePatient(ctx, spec.profile);
  const defects = spec.defects ?? rollDefects(ctx);

  const orderId = newId(ctx, 'o');
  const sampleId = newId(ctx, 's');
  const tat = priority === 'stat' ? day.tat.stat : day.tat.routine;
  const order: Order = {
    id: orderId,
    patientId: patient.id,
    ward: ward.name,
    priority,
    tests,
    dept: orderType.dept,
    container,
    createdAt: spec.at,
    deadline: spec.at + tat,
    status: 'waiting',
    sampleId,
  };
  return {
    at: spec.at,
    kind: 'arrival',
    patient,
    order,
    sample: makeSample(ctx, order, patient, defects, spec.at),
  };
}

export function makeSample(ctx: Ctx, order: Order, patient: Patient, defects: Defect[], at: number): Sample {
  const { rng } = ctx;
  const collectedAgo = defects.some((d) => d.kind === 'delayed')
    ? rng.int(130, 200) * 60
    : rng.int(10, 50) * 60;
  let label: Label | null = {
    name: patient.name,
    birthYear: patient.birthYear,
    patientCode: patient.code,
    collectedAt: Math.max(0, ctx.s.dayStart + at - collectedAgo),
  };
  const mismatch = defects.find((d) => d.kind === 'labelMismatch');
  if (mismatch) label = alterLabel(ctx, label, mismatch.field);
  if (defects.some((d) => d.kind === 'noLabel')) label = null;
  const wrongPatient = defects.some((d) => d.kind === 'labelMismatch' || d.kind === 'noLabel');
  const profileId = wrongPatient ? rng.weighted(ctx.day.profiles) : patient.profileId;
  return {
    id: order.sampleId,
    orderId: order.id,
    container: defects.some((d) => d.kind === 'wrongContainer')
      ? wrongContainerFor(ctx, order.tests)
      : order.container,
    label,
    irreplaceable: false,
    defects,
    hidden: {
      // Nhãn lệch: ống thật ra là máu của người khác → "sự thật" lấy từ một hồ sơ ngẫu nhiên khác.
      truth: makeTruth(ctx, profileId),
      wrongPatient,
    },
    ...(order.tests.includes('UA') ? { urineSeed: urineSeed(profileId, rng.int(0, 999999)) } : {}),
    status: 'tray',
    arrivedAt: at,
  };
}

/** Lịch mẫu đổ về cả ca, sinh sẵn lúc bắt đầu (tất định theo hạt giống). */
export function buildSchedule(ctx: Ctx): ScheduledArrival[] {
  const out: ScheduledArrival[] = [];
  let index = 0;
  for (const wave of ctx.day.waves) {
    for (let i = 0; i < wave.count; i++) {
      const base = wave.at + (wave.count > 1 ? (wave.spread * i) / (wave.count - 1) : 0);
      const jitter = wave.spread > 0 ? ctx.rng.int(-30, 30) : 0;
      const at = Math.max(0, Math.min(ctx.s.duration - 60, Math.round(base + jitter)));
      const scripted = ctx.day.scripted.find((s) => s.index === index);
      out.push(makeArrival(ctx, { at, ...scripted }));
      index++;
    }
  }
  return out.sort((a, b) => a.at - b.at);
}
