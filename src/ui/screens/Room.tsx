import { getContent } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';
import { AnalyzerSheet, CentrifugeSheet, PostSpinSheet } from '../components/ChemStations';
import { DebugPanel } from '../components/DebugPanel';
import { Hud } from '../components/Hud';
import { Notices } from '../components/Notices';
import { ResultsSheet } from '../components/ResultsSheet';
import { SampleCard } from '../components/SampleCard';
import { Tube } from '../components/Tube';
import { MinigameHost } from '../minigames/MinigameHost';

/** S4 Phòng làm việc: HUD, khay mẫu, lưới trạm, thanh dưới. */
export function Room() {
  const shift = useGame((s) => s.shift);
  const overlay = useGame((s) => s.overlay);
  const paused = useGame((s) => s.paused);
  const { setOverlay, dispatch, setPaused, go } = useGame.getState();
  if (!shift) return null;
  const content = getContent();
  const day = content.dayById.get(shift.dayId)!;
  const tray = Object.values(shift.samples)
    .filter((s) => s.status === 'tray')
    .sort((a, b) => {
      const pa = shift.orders[a.orderId]!.priority === 'stat' ? 0 : 1;
      const pb = shift.orders[b.orderId]!.priority === 'stat' ? 0 : 1;
      return pa - pb || a.arrivedAt - b.arrivedAt;
    });
  const resulted = Object.values(shift.orders).filter((o) => o.status === 'resulted').length;

  const openSample = (id: string) => {
    dispatch({ type: 'inspectSample', sampleId: id });
    setOverlay({ kind: 'sample', sampleId: id });
  };

  return (
    <>
      <Hud />
      <div className="tray" aria-label="Khay mẫu">
        {tray.length === 0 && <span className="tray-empty">Khay trống, chờ mẫu tới...</span>}
        {tray.map((s) => {
          const o = shift.orders[s.orderId]!;
          const waited = Math.floor((shift.clock - s.arrivedAt) / 60);
          return (
            <button
              key={s.id}
              className={`tray-item ${s.lateCharged ? 'late' : ''}`}
              onClick={() => openSample(s.id)}
            >
              {o.priority === 'stat' && <span className="stat">🚑</span>}
              <Tube
                container={s.container}
                size={26}
                underfill={s.defects.some((d) => d.kind === 'underfill')}
              />
              <span className="age">{waited}′</span>
            </button>
          );
        })}
      </div>
      <div className="stations">
        {shift.room === 'reception' ? <ReceptionStations /> : <ChemStations />}
        <div className="card muted" style={{ gridColumn: '1 / -1' }}>
          📅 Ngày {day.chapter}.{day.day} · {t(`room.${day.room}`)} · Chạm vào ống trong khay để kiểm tra.
        </div>
      </div>
      <div className="bottombar">
        {shift.room !== 'reception' && (
          <button onClick={() => setOverlay({ kind: 'results' })}>
            📋 Kết quả{resulted > 0 && <span className="dot">{resulted}</span>}
          </button>
        )}
        <button onClick={() => setPaused(true)}>☰ Menu</button>
      </div>

      {overlay?.kind === 'sample' && <SampleCard sampleId={overlay.sampleId} />}
      {overlay?.kind === 'centrifuge' && <CentrifugeSheet />}
      {overlay?.kind === 'postspin' && <PostSpinSheet />}
      {overlay?.kind === 'analyzer' && <AnalyzerSheet />}
      {overlay?.kind === 'results' && <ResultsSheet />}
      {paused && (
        <div className="overlay" style={{ alignItems: 'center', background: 'var(--bg)' }}>
          <div className="sheet stack" style={{ borderRadius: 16, margin: 16 }}>
            <h2>⏸ Tạm dừng</h2>
            <button className="primary" onClick={() => setPaused(false)}>
              ▶ Tiếp tục
            </button>
            <button onClick={() => useGame.getState().startShift(shift.seed)}>🔁 Chơi lại ca này</button>
            <button
              onClick={() => {
                setPaused(false);
                go('home');
              }}
            >
              ↩ Về sảnh (bỏ ca)
            </button>
          </div>
        </div>
      )}
      <MinigameHost />
      <Notices />
      <DebugPanel />
    </>
  );
}

function ReceptionStations() {
  const shift = useGame((s) => s.shift)!;
  const count = (pred: (s: (typeof shift.samples)[string]) => boolean) =>
    Object.values(shift.samples).filter(pred).length;
  return (
    <>
      {(['chem', 'heme'] as const).map((d) => (
        <div key={d} className="station card">
          <span className="name">🧺 Giỏ {t(`dept.${d}`)}</span>
          <span className="muted">{count((s) => s.status === 'routed' && s.routedTo === d)} ống</span>
        </div>
      ))}
      <div className="station card">
        <span className="name">🚫 Đã từ chối</span>
        <span className="muted">{count((s) => s.status === 'rejected')} ống</span>
      </div>
      <div className="station card">
        <span className="name">✔️ Đã xử lý</span>
        <span className="muted">{shift.decisions.total} quyết định</span>
      </div>
    </>
  );
}

function ChemStations() {
  const shift = useGame((s) => s.shift)!;
  const { setOverlay } = useGame.getState();
  const chem = shift.chem!;
  const samples = Object.values(shift.samples);
  const bench = samples.filter((s) => s.status === 'bench').length;
  const spun = samples.filter((s) => s.status === 'spun').length;
  const c = chem.centrifuge;
  const spin = getContent().chemRules.centrifuge.spinSeconds;
  const per = getContent().chemRules.analyzer.secondsPerSample;
  const a = chem.analyzer;
  return (
    <>
      <button className="station card" onClick={() => setOverlay({ kind: 'centrifuge' })}>
        <span className="name">🌀 Máy ly tâm</span>
        {bench > 0 && <span className="badge">{bench}</span>}
        <span className="muted">
          {c.contaminated
            ? '⚠️ Cần dọn'
            : c.running
              ? c.unbalanced
                ? '⚠️ Đang rung!'
                : 'Đang quay'
              : `${bench} ống chờ`}
        </span>
        {c.running && !c.unbalanced && (
          <div className="progress">
            <div style={{ width: `${100 - ((c.endsAt - shift.clock) / spin) * 100}%` }} />
          </div>
        )}
      </button>
      <button className="station card" onClick={() => setOverlay({ kind: 'postspin' })}>
        <span className="name">🧫 Khay sau ly tâm</span>
        {spun > 0 && <span className="badge">{spun}</span>}
        <span className="muted">{spun} ống chờ nạp máy</span>
      </button>
      <button className="station card" onClick={() => setOverlay({ kind: 'analyzer' })}>
        <span className="name">⚗️ Máy hoá sinh</span>
        <span className="muted">{a.current ? `Đang chạy · chờ ${a.queue.length}` : 'Rảnh'}</span>
        {a.current && (
          <div className="progress">
            <div style={{ width: `${100 - ((a.current.endsAt - shift.clock) / per) * 100}%` }} />
          </div>
        )}
      </button>
      <button className="station card" onClick={() => setOverlay({ kind: 'results' })}>
        <span className="name">📋 Kết quả</span>
        <span className="muted">
          {Object.values(shift.orders).filter((o) => o.status === 'released').length} phiếu đã gửi
        </span>
      </button>
    </>
  );
}
