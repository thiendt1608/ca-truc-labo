import { useEffect, useRef, useState } from 'react';
import type { PlayerAction } from '../../sim';
import type { UrineInput, UrinePad } from '../../sim/minigames/urineStrip';

function mix(a: string, b: string, f: number): string {
  const c = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const ch = (i: number) => Math.round(c(a, i) + (c(b, i) - c(a, i)) * f);
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
}

/** Thời gian (ms) kể từ lúc nhúng que. Chỉ gọi trong xử lý sự kiện hoặc timer. */
function sinceDip(dipAt: { current: number | null }): number {
  return Math.round(performance.now() - dipAt.current!);
}

/** Màu ô trên que lúc `elapsedMs`: lên dần từ màu âm tính tới màu thật đúng thời điểm đọc. */
function padColor(pad: UrinePad, truth: number, elapsedMs: number): string {
  const f = Math.max(0, Math.min(1, elapsedMs / pad.readAtMs));
  return mix(pad.colors[0]!, pad.colors[truth]!, f * f * (3 - 2 * f));
}

/**
 * Khung "so sánh và đọc" cho que thử nước tiểu: nhúng que, chờ màu lên, so từng ô với bảng màu.
 * Chỉ ghi thao tác (thời gian tính từ lúc nhúng); điểm do lõi chấm.
 */
export function UrineStripGame({
  input,
  onDone,
}: {
  input: UrineInput;
  onDone: (actions: PlayerAction[]) => void;
}) {
  const dipAt = useRef<number | null>(null);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const actionsRef = useRef<PlayerAction[]>([]);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => {
      const e = sinceDip(dipAt);
      setElapsed(e);
      // Hết thời gian: nộp những ô đã chọn, ô bỏ trống tính là mức 0.
      if (e >= input.timeLimitMs && !doneRef.current) {
        doneRef.current = true;
        onDone([...actionsRef.current, { t: e, type: 'done' }]);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [started, input.timeLimitMs, onDone]);

  const dip = () => {
    dipAt.current = performance.now();
    setStarted(true);
    actionsRef.current = [{ t: 0, type: 'tap', id: 'dip' }];
  };
  const answer = (padId: string, level: number) => {
    const t = sinceDip(dipAt);
    actionsRef.current = [...actionsRef.current, { t, type: 'tap', id: `${padId}:${level}` }];
    setAnswers((a) => ({ ...a, [padId]: level }));
  };
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const t = sinceDip(dipAt);
    onDone([...actionsRef.current, { t, type: 'done' }]);
  };

  if (!started) {
    return (
      <div className="stack">
        <p>
          Nhúng que vào nước tiểu rồi so màu từng ô với bảng màu. Mỗi ô có thời điểm đọc riêng: đọc sớm thì
          màu chưa lên đủ.
        </p>
        <button className="primary" onClick={dip}>
          🧪 Nhúng que
        </button>
      </div>
    );
  }

  const answered = input.pads.every((p) => answers[p.id] !== undefined);
  const simSeconds = Math.round(elapsed / input.msPerSimSecond);
  return (
    <div className="stack">
      <div className="row sticky-bar">
        <b className="grow">
          ⏱ {simSeconds} giây · còn {Math.max(0, Math.ceil((input.timeLimitMs - elapsed) / 1000))} giây thật
        </b>
        <button className="primary small" disabled={!answered} onClick={finish}>
          ✅ Xong
        </button>
      </div>
      <p className="muted">
        Màu ô lên dần. Đợi tới thời điểm đọc của từng ô rồi mới chọn: đọc sớm thì màu chưa đúng.
      </p>
      {input.pads.map((pad) => {
        const ready = elapsed >= pad.readAtMs;
        return (
          <div key={pad.id} className="card stack urine-pad">
            <div className="row">
              <span
                className="swatch"
                style={{ background: padColor(pad, input.truth[pad.id]!, elapsed) }}
                aria-hidden
              />
              <b className="grow">{pad.name}</b>
              <span className="muted">
                đọc ở {pad.readLabel}
                {input.hint ? (ready ? ' · ✅ đến giờ đọc' : ' · ⏳ chưa tới giờ') : ''}
              </span>
            </div>
            <div className="chips">
              {pad.levels.map((label, level) => (
                <button
                  key={label}
                  className={`chip level ${answers[pad.id] === level ? 'selected' : ''}`}
                  onClick={() => answer(pad.id, level)}
                >
                  <span className="swatch sm" style={{ background: pad.colors[level] }} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
