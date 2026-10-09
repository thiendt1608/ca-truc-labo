import { changeTrust, recordMistake, tip, unlockCodex, type Ctx } from '../core/context';
import { evaluateWestgard } from '../core/qc';
import type { Content } from '../content/load';
import type { Command, Difficulty, QcState, QcVerdict } from '../core/types';

/**
 * QC của máy hoá sinh (04a mục 1, 05-noi-dung-chuyen-mon.md mục 2.5).
 * Mỗi ngày có một lỗi ẩn (hoặc không). Người chơi chạy control → đọc biểu đồ → phán quyết → khắc phục.
 * Máy chỉ chạy mẫu bệnh nhân khi QC được đánh dấu Đạt.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

function normalZ(ctx: Ctx): number {
  const { mean, sd, clamp } = ctx.content.chemQc.normal;
  return round2(Math.max(-clamp, Math.min(clamp, ctx.rng.normal(mean, sd))));
}

/** Khởi tạo QC lúc tạo ca: lỗi ẩn của ngày và lịch sử các lần chạy trước đó. */
export function initQc(ctx: Ctx): QcState | null {
  const cfg = ctx.day.qc;
  if (!cfg) return null;
  const rules = ctx.content.chemQc;
  const sc = rules.scenarios[cfg.scenario]!;
  const sign: 1 | -1 = ctx.rng.chance(0.5) ? 1 : -1;
  const n = rules.historyRuns;
  const runs = Array.from({ length: n }, (_, i) => {
    if (sc.history === 'trend') {
      const base = sign * (0.2 + (1.4 * i) / Math.max(1, n - 1));
      return { z1: round2(base + ctx.rng.normal(0, 0.12)), z2: round2(base + ctx.rng.normal(0, 0.12)) };
    }
    return { z1: normalZ(ctx), z2: normalZ(ctx) };
  });
  return {
    scenario: cfg.scenario,
    sign,
    fault: cfg.scenario,
    runs,
    status: 'unchecked',
    blockedUntil: 0,
    badReleases: 0,
    note: null,
    wrongPass: null,
  };
}

/** Máy chưa được chạy mẫu bệnh nhân (QC chưa đạt, hoặc đang bận khắc phục). */
export function qcBlocksAnalyzer(ctx: Ctx): boolean {
  const qc = ctx.s.chem?.qc;
  return !!qc && (qc.status !== 'passed' || ctx.s.clock < qc.blockedUntil);
}

/** Độ lệch tương đối áp lên kết quả bệnh nhân khi lỗi còn tồn tại. */
export function qcBias(ctx: Ctx): number {
  const qc = ctx.s.chem?.qc;
  if (!qc?.fault) return 0;
  return qc.sign * ctx.content.chemQc.scenarios[qc.fault]!.bias;
}

/** Phán quyết đúng theo luật Westgard với các lần chạy hiện có. */
export function expectedVerdict(qc: QcState, content: Content, difficulty: Difficulty): QcVerdict {
  const w = evaluateWestgard(qc.runs, content.difficulty.levels[difficulty].advancedWestgard);
  if (w.reject) return 'fail';
  return w.violations.length > 0 ? 'rerun' : 'pass';
}

function invalid(ctx: Ctx, message: string): true {
  ctx.events.push({ type: 'invalidCommand', message });
  return true;
}

export function handleQc(ctx: Ctx, cmd: Command): boolean {
  const { s } = ctx;
  const qc = s.chem?.qc;
  if (cmd.type !== 'chem/runQC' && cmd.type !== 'chem/judgeQC' && cmd.type !== 'chem/qcAction') return false;
  if (!qc) return invalid(ctx, 'Ngày này không có QC.');
  const rules = ctx.content.chemQc;

  switch (cmd.type) {
    case 'chem/runQC': {
      // Được chạy lại control bất cứ lúc nào QC không đang chờ phán quyết/khắc phục (kiểm tra giữa ca khi nghi ngờ).
      if (qc.status !== 'unchecked' && qc.status !== 'passed')
        return invalid(ctx, 'Chưa cần chạy control lúc này.');
      if (s.clock < qc.blockedUntil) return invalid(ctx, 'Máy đang bận, chờ một lát rồi chạy control.');
      if (qc.fault) {
        const sc = rules.scenarios[qc.fault]!;
        qc.runs.push({
          z1: round2(qc.sign * sc.run.z1[0] + ctx.rng.normal(0, sc.run.z1[1])),
          z2: round2(qc.sign * sc.run.z2[0] + ctx.rng.normal(0, sc.run.z2[1])),
        });
        if (!sc.persists) qc.fault = null;
      } else {
        qc.runs.push({ z1: normalZ(ctx), z2: normalZ(ctx) });
      }
      qc.status = 'judging';
      qc.note = null;
      tip(ctx, 'qcRun');
      return true;
    }
    case 'chem/judgeQC': {
      if (qc.status !== 'judging') return invalid(ctx, 'Chưa có lần chạy control để phán quyết.');
      const expected = expectedVerdict(qc, ctx.content, s.difficulty);
      const right = cmd.verdict === expected;
      s.decisions.total++;
      if (right) s.decisions.correct++;
      s.skills.push({ source: 'qc', skill: right ? 100 : cmd.verdict === 'pass' ? 0 : 50 });
      if (cmd.verdict === 'pass') {
        // Báo Đạt nhầm không bị phạt ngay: hậu quả lộ ra khi trả kết quả (releaseOrder).
        qc.status = 'passed';
        const w = evaluateWestgard(qc.runs, ctx.content.difficulty.levels[s.difficulty].advancedWestgard);
        const last = qc.runs[qc.runs.length - 1]!;
        qc.wrongPass =
          expected === 'fail' ? { clock: s.clock, z1: last.z1, z2: last.z2, rules: w.violations } : null;
      } else if (cmd.verdict === 'rerun') {
        qc.status = 'unchecked';
        qc.blockedUntil = s.clock + rules.remedies.rerun.seconds;
        if (expected === 'fail') {
          qc.note = 'rule.qcShouldFail';
          recordMistake(ctx, {
            kind: 'qcShouldFail',
            explanationKey: 'rule.qcShouldFail',
            codex: 'ch-westgard',
            trustDelta: 0,
            safetyPenalty: 0,
          });
        }
      } else {
        qc.status = 'failed';
        tip(ctx, 'qcFailed');
        if (expected === 'pass') {
          qc.note = 'rule.qcFalseFail';
          recordMistake(ctx, {
            kind: 'qcFalseFail',
            explanationKey: 'rule.qcFalseFail',
            codex: 'ch-westgard',
            trustDelta: 0,
            safetyPenalty: 0,
          });
        }
      }
      return true;
    }
    case 'chem/qcAction': {
      if (qc.status !== 'failed') return invalid(ctx, 'QC đang không ở trạng thái cần khắc phục.');
      qc.blockedUntil = s.clock + rules.remedies[cmd.action].seconds;
      qc.status = 'unchecked';
      if (!qc.fault) {
        s.skills.push({ source: 'qc', skill: 60 });
        return true;
      }
      const sc = rules.scenarios[qc.fault]!;
      if (sc.remedy === cmd.action) {
        qc.fault = null;
        s.skills.push({ source: 'qc', skill: 100 });
        unlockCodex(ctx, sc.codex);
        changeTrust(ctx, 5);
      } else {
        s.skills.push({ source: 'qc', skill: 40 });
        qc.note = sc.explanationKey;
        recordMistake(ctx, {
          kind: 'qcWrongRemedy',
          explanationKey: sc.explanationKey,
          codex: sc.codex,
          trustDelta: 0,
          safetyPenalty: 0,
        });
      }
      return true;
    }
  }
}

const clockHm = (secs: number) =>
  `${String(Math.floor(secs / 3600) % 24).padStart(2, '0')}:${String(Math.floor((secs % 3600) / 60)).padStart(2, '0')}`;
const fmtZ = (z: number) => `${z > 0 ? '+' : ''}${z.toFixed(1)}SD`;

/** Câu giải thích lần báo Đạt nhầm: lúc nào, điểm nào, vi phạm luật nào. */
export function wrongPassDetail(ctx: Ctx): string | undefined {
  const w = ctx.s.chem?.qc?.wrongPass;
  if (!w) return undefined;
  return ctx.content.i18n['qc.wrongPassDetail']!.replace('{time}', clockHm(ctx.s.dayStart + w.clock))
    .replace('{z1}', fmtZ(w.z1))
    .replace('{z2}', fmtZ(w.z2))
    .replace('{rules}', w.rules.join(', '));
}
