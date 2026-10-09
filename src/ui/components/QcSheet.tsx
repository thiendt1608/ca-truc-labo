import { useRef } from 'react';
import { evaluateWestgard, getContent, type QcRemedy } from '../../sim';
import { t } from '../../i18n';
import { clockText, useGame } from '../../store/game';
import { useScrollSheetToFit } from '../scrollSheet';
import { Sheet } from './Overlay';

const W = 340;
const H = 210;
const PAD = { l: 50, r: 8, t: 10, b: 26 };
const SD_MAX = 3.5;
const VISIBLE_RUNS = 12;

/** Biểu đồ Levey-Jennings: hai mức control, vạch trung bình và ±1/2/3SD. Vẽ bằng SVG. */
function LJChart({ runs }: { runs: { z1: number; z2: number }[] }) {
  const shown = runs.slice(-VISIBLE_RUNS);
  const first = runs.length - shown.length;
  const x = (i: number) => PAD.l + ((W - PAD.l - PAD.r) * (i + 0.5)) / VISIBLE_RUNS;
  const y = (z: number) =>
    PAD.t + ((H - PAD.t - PAD.b) * (SD_MAX - Math.max(-SD_MAX, Math.min(SD_MAX, z)))) / (2 * SD_MAX);
  const lines = [3, 2, 1, 0, -1, -2, -3];
  const series = [
    { key: 'z1' as const, color: 'var(--info)', name: 'Mức 1 (thấp)' },
    { key: 'z2' as const, color: '#9b59b6', name: 'Mức 2 (cao)' },
  ];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="ljchart"
      role="img"
      aria-label="Biểu đồ Levey-Jennings của control"
    >
      {lines.map((z) => (
        <g key={z}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={y(z)}
            y2={y(z)}
            stroke={Math.abs(z) === 3 ? 'var(--bad)' : Math.abs(z) === 2 ? 'var(--warn)' : 'var(--edge)'}
            strokeWidth={z === 0 ? 2 : 1.5}
            strokeDasharray={Math.abs(z) >= 2 ? '5 4' : undefined}
          />
          <text x={PAD.l - 4} y={y(z) + 4} textAnchor="end" className="ljlabel">
            {z === 0 ? 'TB' : `${z > 0 ? '+' : ''}${z}SD`}
          </text>
        </g>
      ))}
      {series.map((s) => (
        <g key={s.key}>
          <polyline
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            points={shown.map((r, i) => `${x(i)},${y(r[s.key])}`).join(' ')}
          />
          {shown.map((r, i) => (
            <circle
              key={first + i}
              cx={x(i)}
              cy={y(r[s.key])}
              r={Math.abs(r[s.key]) > 2 ? 6 : 4.5}
              fill={s.color}
              stroke={Math.abs(r[s.key]) > 2 ? 'var(--bad-strong)' : '#fff'}
              strokeWidth={2.5}
            />
          ))}
        </g>
      ))}
      <text x={W - PAD.r} y={H - 3} textAnchor="end" className="ljlabel">
        ← cũ · mới →
      </text>
    </svg>
  );
}

const fmt = (z: number) => `${z > 0 ? '+' : ''}${z.toFixed(1)}SD`;

/** S7 QC (lớp phủ): chạy control, đọc biểu đồ, phán quyết Đạt / Chạy lại / Không đạt, chọn cách khắc phục. */
export function QcSheet() {
  const shift = useGame((s) => s.shift)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const inlineTips = useGame((s) => s.inlineTips);
  const dismissTip = useGame((s) => s.dismissTip);
  const qc = shift.chem!.qc!;
  const rules = getContent().chemQc;
  const last = qc.runs[qc.runs.length - 1];
  const busy = shift.clock < qc.blockedUntil;
  const level = getContent().difficulty.levels[shift.difficulty];
  const hint = level.hints ? evaluateWestgard(qc.runs, level.advancedWestgard) : null;

  // Sau khi bấm Chạy control / Không đạt, nút phán quyết và nút khắc phục phải nằm trong tầm nhìn cùng biểu đồ.
  const chartRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  useScrollSheetToFit(
    chartRef,
    actionsRef,
    qc.status === 'judging' || qc.status === 'failed' ? `${qc.status}:${qc.runs.length}` : null,
  );

  return (
    <Sheet title="🧪 Kiểm tra chất lượng (QC)" help="qc" onClose={close}>
      <p className="muted">
        {qc.status === 'passed'
          ? '✅ QC đạt: máy hoá sinh được chạy mẫu bệnh nhân.'
          : 'Máy chỉ chạy mẫu bệnh nhân sau khi QC đạt. Control là mẫu biết trước giá trị; vượt vạch đỏ ±3SD (độ lệch chuẩn) là Không đạt.'}
      </p>
      {inlineTips.map((tp) => (
        <button key={tp.id} className="tip-inline" onClick={() => dismissTip(tp.id)}>
          <b>💬 Chị Hạnh</b>
          {tp.text}
          <span className="muted" aria-hidden>
            {' '}
            ✕
          </span>
        </button>
      ))}
      <div ref={chartRef}>
        <LJChart runs={qc.runs} />
      </div>
      {qc.note && <p className="note-inline">💡 {t(qc.note)}</p>}
      {last && (
        <div className="row wrap">
          <span className="pill">🔵 Mức 1: {fmt(last.z1)}</span>
          <span className="pill">🟣 Mức 2: {fmt(last.z2)}</span>
          {hint &&
            hint.violations.map((v) => (
              <span key={v} className="pill stat">
                {v}
              </span>
            ))}
        </div>
      )}

      {qc.status === 'unchecked' &&
        (busy ? (
          <p>⏳ Máy đang bận, xong lúc {clockText(shift, qc.blockedUntil)}.</p>
        ) : (
          <button className="primary" onClick={() => dispatch({ type: 'chem/runQC' })}>
            ▶ Chạy control
          </button>
        ))}

      {qc.status === 'passed' && (
        <button onClick={() => dispatch({ type: 'chem/runQC' })}>🔁 Nghi ngờ? Chạy control lại</button>
      )}

      {qc.status === 'judging' && (
        <div ref={actionsRef} className="stack">
          <b>Em thấy lần chạy này thế nào?</b>
          <button onClick={() => dispatch({ type: 'chem/judgeQC', verdict: 'pass' })}>
            ✅ Đạt: cho máy chạy mẫu
          </button>
          <button onClick={() => dispatch({ type: 'chem/judgeQC', verdict: 'rerun' })}>
            🔁 Cảnh báo: chạy lại control
          </button>
          <button className="danger" onClick={() => dispatch({ type: 'chem/judgeQC', verdict: 'fail' })}>
            ❌ Không đạt: phải khắc phục
          </button>
        </div>
      )}

      {qc.status === 'failed' && (
        <div ref={actionsRef} className="stack">
          <b>Nhìn hình dạng biểu đồ, em chọn cách khắc phục nào?</b>
          <div className="remedies">
            {(Object.keys(rules.remedies) as QcRemedy[]).map((id) => (
              <button key={id} onClick={() => dispatch({ type: 'chem/qcAction', action: id })}>
                {rules.remedies[id].label} · {Math.round(rules.remedies[id].seconds / 60)} phút
              </button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}
