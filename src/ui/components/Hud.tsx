import { clockText, useGame } from '../../store/game';

export function Hud() {
  const shift = useGame((s) => s.shift);
  const paused = useGame((s) => s.paused);
  const setPaused = useGame((s) => s.setPaused);
  if (!shift) return null;
  const stat = Object.values(shift.samples).filter(
    (x) => x.status === 'tray' && shift.orders[x.orderId]?.priority === 'stat',
  ).length;
  const statResults = Object.values(shift.orders).filter(
    (o) => o.status === 'resulted' && o.priority === 'stat',
  ).length;
  const left = Math.max(0, shift.duration - shift.clock);
  const alerts = [
    stat > 0 ? `🚑 ${stat} mẫu cấp cứu ở khay` : '',
    statResults > 0 ? `🚑 ${statResults} kết quả cấp cứu chờ duyệt` : '',
    shift.chem?.centrifuge.contaminated ? '⚠️ Máy ly tâm cần dọn' : '',
    left < 1800 ? `⏳ Còn ${Math.ceil(left / 60)} phút hết ca` : '',
  ].filter(Boolean);
  return (
    <>
      <div className="hud">
        <span className="clock">{clockText(shift)}</span>
        <div className="trust" aria-label={`Niềm tin ${Math.round(shift.trust)}`}>
          <div className="bar">
            <div className={`fill ${shift.trust < 30 ? 'low' : ''}`} style={{ width: `${shift.trust}%` }} />
          </div>
          <span>Niềm tin {Math.round(shift.trust)}</span>
        </div>
        <button
          className="small"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? 'Tiếp tục' : 'Tạm dừng'}
        >
          {paused ? '▶' : '⏸'}
        </button>
      </div>
      <div className="alertline">{alerts.join(' · ')}</div>
    </>
  );
}
