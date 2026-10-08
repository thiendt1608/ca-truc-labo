import type { EventId } from '../content/schema';
import { changeTrust, newId, recordMistake, tip, unlockCodex, type Ctx } from './context';
import { makeArrival } from './generator';
import { startMinigame } from './minigameHost';
import type { Command, PhoneCall, ScheduledEvent } from './types';

/**
 * Sự kiện chung E1–E10 và điện thoại (04-GDD mục 5.8 và 7). Dữ liệu ở content/common/events.json.
 * Sự kiện được xếp lịch lúc tạo ca (tất định), phát ra khi tới giờ, và có thể chờ người chơi quyết định.
 */

/** Lúc "vô hạn": máy hỏng cho tới khi người chơi xử lý. */
const UNTIL_RESOLVED = 1e9;

export function scheduleEvents(ctx: Ctx) {
  const { s, day } = ctx;
  for (const e of day.events) {
    const at = e.at ?? ctx.rng.int(600, Math.max(601, s.duration - 900));
    s.scheduled.push({ at, kind: 'event', eventId: e.id } satisfies ScheduledEvent);
  }
  s.scheduled.sort((a, b) => a.at - b.at);
}

export function initEffects() {
  return { slowUntil: 0, slowFactor: 1, powerOutUntil: 0, analyzerDownUntil: 0 };
}

/** Hệ số làm chậm máy hoá sinh do LIS chậm (E6). */
export function analyzerSlowFactor(ctx: Ctx): number {
  return ctx.s.clock < ctx.s.effects.slowUntil ? ctx.s.effects.slowFactor : 1;
}
export function powerIsOut(ctx: Ctx): boolean {
  return ctx.s.clock < ctx.s.effects.powerOutUntil;
}
export function analyzerIsDown(ctx: Ctx): boolean {
  return ctx.s.clock < ctx.s.effects.analyzerDownUntil;
}

function arrivals(
  ctx: Ctx,
  count: number,
  spread: number,
  spec: { priority?: 'stat' | 'routine'; noLabel?: boolean },
) {
  const { s } = ctx;
  for (let i = 0; i < count; i++) {
    const offset = count > 1 ? Math.round((spread * i) / (count - 1)) : 0;
    const at = s.clock + 1 + offset;
    const arrival = makeArrival(ctx, {
      at,
      ...(spec.priority ? { priority: spec.priority } : {}),
      ...(spec.noLabel ? { defects: [{ kind: 'noLabel' as const }] } : {}),
    });
    s.scheduled.push(arrival);
  }
  s.scheduled.sort((a, b) => a.at - b.at);
}

export function fireEvent(ctx: Ctx, id: EventId) {
  const { s } = ctx;
  const def = ctx.content.events.events[id]!;
  const announce = (text = def.text, decision = false) =>
    ctx.events.push({ type: 'eventStarted', eventId: id, title: def.title, text, decision });

  switch (def.kind) {
    case 'statRush':
      arrivals(ctx, def.count!, def.spread!, { priority: 'stat' });
      return announce();
    case 'soloLunch':
      arrivals(ctx, def.count!, def.spread!, { priority: 'routine' });
      return announce();
    case 'unlabeled':
      arrivals(ctx, 1, 0, { noLabel: true });
      return announce();
    case 'spill': {
      const c = s.chem!.centrifuge;
      if (c.running) {
        // Đang quay thì chờ máy dừng rồi mới "rơi vỡ".
        s.scheduled.push({ at: s.clock + 120, kind: 'event', eventId: id });
        s.scheduled.sort((a, b) => a.at - b.at);
        return;
      }
      c.contaminated = true;
      announce();
      startMinigame(ctx, 'spillCleanup', 'spill');
      return;
    }
    case 'slowLis':
      s.effects.slowUntil = s.clock + def.seconds!;
      s.effects.slowFactor = def.factor!;
      return announce();
    case 'power': {
      const dur = def.seconds!;
      s.effects.powerOutUntil = s.clock + dur;
      const c = s.chem!.centrifuge;
      if (c.running) c.endsAt += dur;
      const a = s.chem!.analyzer.current;
      if (a) a.endsAt += dur;
      return announce();
    }
    case 'inspection': {
      const stuck = Object.values(s.samples).some(
        (x) => x.status === 'tray' && s.clock - x.arrivedAt > def.maxWaitSeconds!,
      );
      if (!stuck) changeTrust(ctx, def.reward!);
      return announce(`${def.text} ${stuck ? def.failText : `${def.passText} +${def.reward} Niềm tin`}`);
    }
    case 'machineFault':
      s.effects.analyzerDownUntil = UNTIL_RESOLVED;
      s.pending.push({ id: newId(ctx, 'ev'), eventId: id, startedAt: s.clock, expiresAt: null });
      tip(ctx, 'eventDecision');
      return announce(def.text, true);
    case 'quiz': {
      const quizzes = ctx.content.events.quizzes;
      const quiz = ctx.rng.pick(quizzes);
      s.pending.push({
        id: newId(ctx, 'ev'),
        eventId: id,
        startedAt: s.clock,
        expiresAt: s.clock + def.expireSeconds!,
        quizId: quiz.id,
      });
      tip(ctx, 'eventDecision');
      return announce(quiz.question, true);
    }
    case 'call': {
      const orders = Object.values(s.orders).filter(
        (o) => o.status !== 'rejected' && o.status !== 'cancelled',
      );
      if (orders.length === 0) return;
      const order = ctx.rng.pick(orders);
      const phone = ctx.content.events.phone;
      const call: PhoneCall = {
        id: newId(ctx, 'call'),
        from: ctx.rng.pick(phone.from),
        orderId: order.id,
        text: `Cho em hỏi kết quả xét nghiệm của bệnh nhân ${s.patients[order.patientId]!.name} xong chưa ạ?`,
        ringAt: s.clock,
        expiresAt: s.clock + phone.expireSeconds,
      };
      s.phone.calls.push(call);
      ctx.events.push({ type: 'phoneRing', callId: call.id });
      tip(ctx, 'phoneRing');
      return announce(`${call.from} đang gọi tới.`);
    }
  }
}

export function handleEventCommand(ctx: Ctx, cmd: Command): boolean {
  const { s } = ctx;
  const phone = ctx.content.events.phone;
  const invalid = (message: string) => {
    ctx.events.push({ type: 'invalidCommand', message });
    return true;
  };
  if (cmd.type === 'answerPhone') {
    const call = s.phone.calls.find((c) => c.id === cmd.callId);
    if (!call) return invalid('Cuộc gọi này đã kết thúc.');
    s.phone.calls = s.phone.calls.filter((c) => c.id !== call.id);
    const order = s.orders[call.orderId];
    const expected =
      order && (order.status === 'resulted' || order.status === 'released') ? 'report' : 'wait';
    if (cmd.choice === expected) {
      changeTrust(ctx, phone.correctTrust);
      ctx.events.push({ type: 'notice', tone: 'good', text: 'Bác sĩ cảm ơn em đã báo đúng.' });
    } else {
      recordMistake(ctx, {
        kind: 'phoneWrong',
        explanationKey: 'rule.phoneWrong',
        trustDelta: phone.wrongTrust,
        safetyPenalty: 0,
        orderId: call.orderId,
      });
    }
    return true;
  }
  if (cmd.type === 'resolveEvent') {
    const pending = s.pending.find((p) => p.id === cmd.id);
    if (!pending) return invalid('Sự kiện này đã xử lý xong.');
    const def = ctx.content.events.events[pending.eventId]!;
    s.pending = s.pending.filter((p) => p.id !== pending.id);
    if (def.kind === 'machineFault') {
      const option = def.options!.find((o) => o.id === cmd.choice) ?? def.options![0]!;
      const ok = ctx.rng.chance(option.successRate);
      s.effects.analyzerDownUntil = s.clock + option.seconds + (ok ? 0 : def.failSeconds!);
      ctx.events.push({
        type: 'notice',
        tone: ok ? 'good' : 'bad',
        text: ok
          ? 'Đã xử lý xong, máy sẽ chạy lại sau ít phút.'
          : 'Chưa hết lỗi: máy cần thêm thời gian mới chạy lại.',
      });
    } else {
      const quiz = ctx.content.events.quizzes.find((q) => q.id === pending.quizId)!;
      if (Number(cmd.choice) === quiz.correct) {
        changeTrust(ctx, def.reward!);
        ctx.events.push({ type: 'notice', tone: 'good', text: `Đúng rồi! ${quiz.explain}` });
      } else {
        recordMistake(ctx, {
          kind: 'quizWrong',
          explanationKey: 'rule.quizWrong',
          detail: quiz.explain,
          codex: quiz.codex,
          trustDelta: 0,
          safetyPenalty: 0,
        });
        unlockCodex(ctx, quiz.codex);
      }
    }
    return true;
  }
  return false;
}

/** Mỗi giây: cuộc gọi hết hạn tính là bỏ lỡ; câu hỏi quá hạn tự bỏ qua. */
export function tickEvents(ctx: Ctx) {
  const { s } = ctx;
  const phone = ctx.content.events.phone;
  const expired = s.phone.calls.filter((c) => c.expiresAt <= s.clock);
  if (expired.length > 0) {
    s.phone.calls = s.phone.calls.filter((c) => c.expiresAt > s.clock);
    for (const call of expired) {
      s.phone.missed++;
      ctx.events.push({ type: 'notice', tone: 'bad', text: `Em đã lỡ cuộc gọi từ ${call.from}.` });
      if (s.phone.missed % phone.missedPerPenalty === 0)
        recordMistake(ctx, {
          kind: 'phoneMissed',
          explanationKey: 'rule.phoneMissed',
          trustDelta: phone.missedTrust,
          safetyPenalty: 0,
        });
    }
  }
  s.pending = s.pending.filter((p) => p.expiresAt === null || p.expiresAt > s.clock);
}
