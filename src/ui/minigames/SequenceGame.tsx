import { useMemo, useRef, useState } from 'react';
import type { PlayerAction } from '../../sim';
import { replaySpill, type SpillInput } from '../../sim/minigames/spillCleanup';
import { TimingGame } from './TimingGame';

/** Thời gian (ms) kể từ thao tác đầu tiên. Chỉ gọi trong xử lý sự kiện. */
function elapsedMs(start: { current: number | null }): number {
  const n = performance.now();
  start.current ??= n;
  return Math.round(n - start.current);
}

/**
 * Khung "kéo đúng thứ tự": chạm các thẻ bước theo đúng thứ tự; bước "chờ" dùng khung giữ thời gian.
 * Chỉ ghi thao tác; điểm do lõi chấm bằng hàm thuần.
 */
export function SequenceGame({
  input,
  hint,
  onDone,
}: {
  input: SpillInput;
  hint: boolean;
  onDone: (actions: PlayerAction[]) => void;
}) {
  const t0 = useRef<number | null>(null);
  const [actions, setActions] = useState<PlayerAction[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const now = () => elapsedMs(t0);
  const state = useMemo(() => replaySpill(input, actions), [input, actions]);
  const expected = input.correct[state.index];
  const holding = expected === 'wait' && actions.some((a) => a.type === 'tap' && a.id === 'wait');

  const push = (a: PlayerAction) => {
    const next = [...actions, a];
    setActions(next);
    const r = replaySpill(input, next);
    if (r.completed) onDone([...next, { t: a.t + 1, type: 'done' }]);
    return r;
  };

  const tap = (id: string) => {
    if (state.completed) return;
    const step = input.steps.find((s) => s.id === id)!;
    push({ t: now(), type: 'tap', id });
    if (id !== expected) {
      setWrong(id);
      setMessage(step.trap ? 'Sai kỹ thuật! Làm vậy có thể lan chất bẩn.' : 'Chưa đúng thứ tự.');
      setTimeout(() => setWrong(null), 350);
    } else {
      setMessage(null);
    }
  };

  return (
    <div className="stack">
      <div className="row">
        <b className="grow">
          Bước {Math.min(state.index + 1, input.correct.length)}/{input.correct.length}
        </b>
        <span className="dept-chip neutral">⏸ Giờ ca đang dừng</span>
      </div>
      <div className="progress" aria-hidden>
        <div style={{ width: `${(state.index / input.correct.length) * 100}%` }} />
      </div>
      <div className={`mg-msg ${message ? 'toast mistake' : ''}`} aria-live="polite">
        {message}
      </div>
      <div className="steps">
        {input.steps.map((s) => {
          const doneIndex = input.correct.indexOf(s.id);
          const done = doneIndex >= 0 && doneIndex < state.index;
          const isHint = hint && s.id === expected;
          return (
            <button
              key={s.id}
              className={`step ${done ? 'done' : ''} ${wrong === s.id ? 'wrong' : ''}`}
              style={isHint ? { outline: '3px dashed var(--accent)' } : undefined}
              disabled={done}
              onClick={() => tap(s.id)}
            >
              {done ? `✓ ${doneIndex + 1}. ` : ''}
              {s.label}
            </button>
          );
        })}
      </div>
      {holding && (
        <div className="card stack">
          <b>Giữ nút cho chất khử khuẩn ngấm, thả tay khi thanh ở vùng xanh.</b>
          <TimingGame
            input={input.hold}
            label="Giữ để chờ"
            onPress={() => push({ t: now(), type: 'press' })}
            onRelease={() => {
              const r = push({ t: now(), type: 'release' });
              if (r.holdVerdict === 'early')
                setMessage('Chưa đủ thời gian, chất khử khuẩn chưa kịp diệt mầm bệnh. Giữ lại!');
              else if (r.holdVerdict === 'late')
                setMessage(
                  'Giữ hơi quá vùng xanh: vẫn qua bước nhưng bị trừ điểm Tay nghề. Lần sau thả sớm hơn nhé.',
                );
              else setMessage(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
