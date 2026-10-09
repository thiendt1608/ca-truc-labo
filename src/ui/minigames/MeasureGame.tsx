import { useRef, useState } from 'react';
import type { PlayerAction } from '../../sim';
import {
  isInRange,
  multiplyOptions,
  readingAt,
  smallestRatio,
  type DilutionInput,
} from '../../sim/minigames/dilution';
import { useRevealOnShow } from '../scrollSheet';

/** Thời gian (ms) kể từ thao tác đầu tiên. Chỉ gọi trong xử lý sự kiện. */
function elapsedMs(start: { current: number | null }): number {
  const n = performance.now();
  start.current ??= n;
  return Math.round(n - start.current);
}

/** Thước đo: vạch giới hạn của máy và vị trí số đọc (vượt giới hạn thì kim nằm ngoài vùng xanh). */
function Gauge({ reading, max, over }: { reading: number; max: number; over: boolean }) {
  const pct = Math.min(100, (reading / (max * 1.6)) * 100);
  const limitPct = (max / (max * 1.6)) * 100;
  return (
    <div className="gauge" role="img" aria-label={over ? 'Vượt dải đo' : 'Trong dải đo'}>
      <div className="gauge-ok" style={{ width: `${limitPct}%` }} />
      <div className={`gauge-needle ${over ? 'over' : ''}`} style={{ left: `${pct}%` }} />
      <span className="gauge-limit" style={{ left: `${limitPct}%` }}>
        giới hạn {max}
      </span>
    </div>
  );
}

/**
 * Khung "đo và tra bảng" cho pha loãng: chọn tỉ lệ → máy báo số đọc → nhân hệ số → chọn kết quả đúng.
 * Chỉ ghi thao tác; điểm do lõi chấm.
 */
export function MeasureGame({
  input,
  hint,
  onDone,
}: {
  input: DilutionInput;
  /** Mức Dễ: nhắc bước tiếp theo. */
  hint: boolean;
  onDone: (actions: PlayerAction[]) => void;
}) {
  const t0 = useRef<number | null>(null);
  const [actions, setActions] = useState<PlayerAction[]>([]);
  const [tried, setTried] = useState<number[]>([]);
  const [ratio, setRatio] = useState<number | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  useRevealOnShow(msgRef, message !== null);
  const { analyte } = input;

  const push = (a: PlayerAction) => {
    const next = [...actions, a];
    setActions(next);
    return next;
  };
  const pickRatio = (r: number) => {
    push({ t: elapsedMs(t0), type: 'tap', id: `ratio:${r}` });
    setTried((x) => [...x, r]);
    if (isInRange(input, r)) {
      setRatio(r);
      setMessage(null);
    } else {
      setMessage(`Pha loãng 1:${r} vẫn vượt dải đo, máy phải chạy lại. Chọn tỉ lệ lớn hơn.`);
    }
  };
  const pickAnswer = (value: string) => {
    const next = push({ t: elapsedMs(t0), type: 'tap', id: `answer:${value}` });
    if (value === answerOf(ratio!)) {
      onDone([...next, { t: elapsedMs(t0), type: 'done' }]);
    } else {
      setWrong((w) => [...w, value]);
      setMessage('Chưa đúng: kết quả thật = số máy đọc × hệ số pha loãng.');
    }
  };
  const answerOf = (r: number) => {
    const f = 10 ** analyte.decimals;
    return (Math.round(readingAt(input, r) * r * f) / f).toFixed(analyte.decimals);
  };

  const last = tried[tried.length - 1];
  const reading = last === undefined ? null : readingAt(input, last);
  return (
    <div className="stack">
      <div className="card stack">
        <b>{analyte.name}</b>
        <span>
          Máy báo ban đầu:{' '}
          <b>
            &gt;{analyte.max} {analyte.unit}
          </b>{' '}
          (vượt dải đo)
        </span>
      </div>

      {ratio === null && (
        <>
          <b>1. Chọn tỉ lệ pha loãng</b>
          {hint && <p className="note-inline">👉 Bước tiếp theo: chạm một tỉ lệ để máy chạy lại mẫu.</p>}
          <p className="muted">
            Chọn tỉ lệ nhỏ nhất đưa kết quả vào dải đo. Pha loãng quá nhiều làm sai số nhân lên.
          </p>
          <div className="row wrap">
            {input.ratios.map((r) => (
              <button key={r} className="grow" onClick={() => pickRatio(r)}>
                1:{r}
              </button>
            ))}
          </div>
        </>
      )}

      {reading !== null && (
        <div className="card stack">
          <span>
            Máy chạy lại mẫu pha loãng 1:{last}: đọc được{' '}
            <b>
              {reading > analyte.max ? `>${analyte.max}` : reading.toFixed(analyte.decimals)} {analyte.unit}
            </b>
          </span>
          <Gauge reading={reading} max={analyte.max} over={reading > analyte.max} />
        </div>
      )}

      {ratio !== null && (
        <>
          <b>2. Nhân lại hệ số để ra kết quả thật</b>
          {hint && <p className="note-inline">👉 Bước tiếp theo: lấy số máy đọc nhân với hệ số pha loãng.</p>}
          <p className="muted">
            Số đọc {reading!.toFixed(analyte.decimals)} × hệ số {ratio} = ?
          </p>
          {ratio > smallestRatio(input) && (
            <p className="note-inline">
              💡 Tỉ lệ 1:{smallestRatio(input)} đã đủ đưa kết quả vào dải đo. Pha loãng nhiều hơn mức cần làm
              sai số nhân lên.
            </p>
          )}
          <div className="row wrap">
            {multiplyOptions(input, ratio).map((v) => (
              <button key={v} className="grow" disabled={wrong.includes(v)} onClick={() => pickAnswer(v)}>
                {v} {analyte.unit}
              </button>
            ))}
          </div>
        </>
      )}

      <div ref={msgRef} className={`mg-msg ${message ? 'toast mistake' : ''}`} aria-live="polite">
        {message}
      </div>
    </div>
  );
}
