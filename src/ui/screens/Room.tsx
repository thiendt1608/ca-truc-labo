import { getContent } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';
import { AnalyzerSheet, CentrifugeSheet, PostSpinSheet } from '../components/ChemStations';
import { DebugPanel } from '../components/DebugPanel';
import { Hud } from '../components/Hud';
import { Notices } from '../components/Notices';
import { QcSheet } from '../components/QcSheet';
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
      <RoomBanner day={day} />
      <div className="tray" aria-label="Khay mẫu">
        {tray.length === 0 && <span className="tray-empty">Khay trống, chờ mẫu tới...</span>}
        {tray.map((s) => {
          const o = shift.orders[s.orderId]!;
          const who = shift.patients[o.patientId]?.name.split(' ').slice(-2).join(' ') ?? s.id;
          const waited = Math.floor((shift.clock - s.arrivedAt) / 60);
          return (
            <button
              key={s.id}
              className={`tray-item ${s.lateCharged ? 'late' : ''}`}
              onClick={() => openSample(s.id)}
            >
              {o.priority === 'stat' && <span className="stat">🚑 KHẨN</span>}
              <Tube
                container={s.container}
                size={30}
                underfill={s.defects.some((d) => d.kind === 'underfill')}
              />
              <span className="who">{who}</span>
              <span className="age">
                {s.id.toUpperCase()} · {waited}′
              </span>
            </button>
          );
        })}
      </div>
      <div className="stations">{shift.room === 'reception' ? <ReceptionStations /> : <ChemStations />}</div>
      <nav className="bottombar navbar" aria-label="Thanh lệnh">
        {shift.room !== 'reception' && (
          <button onClick={() => setOverlay({ kind: 'results' })}>
            <span aria-hidden>📋</span>
            <span>Kết quả</span>
            {resulted > 0 && <span className="dot">{resulted}</span>}
          </button>
        )}
        <button onClick={() => setPaused(true)}>
          <span aria-hidden>☰</span>
          <span>Menu</span>
        </button>
      </nav>

      {overlay?.kind === 'sample' && <SampleCard sampleId={overlay.sampleId} />}
      {overlay?.kind === 'centrifuge' && <CentrifugeSheet />}
      {overlay?.kind === 'postspin' && <PostSpinSheet />}
      {overlay?.kind === 'analyzer' && <AnalyzerSheet />}
      {overlay?.kind === 'results' && <ResultsSheet />}
      {overlay?.kind === 'qc' && <QcSheet />}
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
/** Biển hiệu của phòng: màu khoa, tên phòng, tiến độ ca. */
function RoomBanner({ day }: { day: { chapter: number; day: number; title: string; room: string } }) {
  const shift = useGame((s) => s.shift)!;
  const waiting = Object.values(shift.samples).filter((s) => s.status === 'tray').length;
  const pct = Math.min(100, Math.round((shift.clock / shift.duration) * 100));
  return (
    <section className="banner" aria-label="Thông tin phòng">
      <h2>{t(`room.${day.room}`)}</h2>
      <span>
        Ngày {day.chapter}.{day.day} · {waiting} ống đang chờ · {shift.decisions.total} quyết định
      </span>
      <div className="banner-progress" aria-label={`Ca đã qua ${pct}%`}>
        <div style={{ width: `${pct}%` }} />
      </div>
      <span className="banner-hint">Chạm vào ống trong khay để kiểm tra</span>
    </section>
  );
}

function Orb({ state }: { state: 'ready' | 'busy' | 'error' }) {
  const label = state === 'ready' ? 'Sẵn sàng' : state === 'busy' ? 'Đang chạy' : 'Cảnh báo';
  return <span className={`orb ${state}`} role="img" aria-label={label} title={label} />;
}

function ReceptionStations() {
  const shift = useGame((s) => s.shift)!;
  const count = (pred: (s: (typeof shift.samples)[string]) => boolean) =>
    Object.values(shift.samples).filter(pred).length;
  return (
    <>
      {(['chem', 'heme'] as const).map((d) => (
        <div key={d} data-room={d} className="station card">
          <span className="station-head">
            <span className="name">🧺 Giỏ {t(`dept.${d}`)}</span>
          </span>
          <span className="status">{count((s) => s.status === 'routed' && s.routedTo === d)} ống</span>
        </div>
      ))}
      <div className="station card">
        <span className="station-head">
          <span className="name">🚫 Đã từ chối</span>
        </span>
        <span className="status">{count((s) => s.status === 'rejected')} ống</span>
      </div>
      <div className="station card">
        <span className="station-head">
          <span className="name">✔️ Đã xử lý</span>
        </span>
        <span className="status">{shift.decisions.total} quyết định</span>
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
  const resulted = Object.values(shift.orders).filter((o) => o.status === 'resulted').length;
  const c = chem.centrifuge;
  const spin = getContent().chemRules.centrifuge.spinSeconds;
  const per = getContent().chemRules.analyzer.secondsPerSample;
  const a = chem.analyzer;
  const qc = chem.qc;
  const qcBusy = !!qc && shift.clock < qc.blockedUntil;
  const cState = c.contaminated || c.unbalanced ? 'error' : c.running ? 'busy' : 'ready';
  return (
    <>
      {qc && (
        <button className="station card" onClick={() => setOverlay({ kind: 'qc' })}>
          <span className="station-head">
            <span className="name">🧪 QC đầu ca</span>
            <Orb
              state={qc.status === 'passed' && !qcBusy ? 'ready' : qc.status === 'failed' ? 'error' : 'busy'}
            />
          </span>
          <span className="status">
            {qcBusy
              ? 'Máy đang bận'
              : qc.status === 'passed'
                ? 'Đạt'
                : qc.status === 'judging'
                  ? 'Chờ em phán quyết'
                  : qc.status === 'failed'
                    ? 'Không đạt: cần khắc phục'
                    : 'Chưa chạy control'}
          </span>
        </button>
      )}
      <button className="station card" onClick={() => setOverlay({ kind: 'centrifuge' })}>
        <span className="station-head">
          <span className="name">🌀 Máy ly tâm</span>
          <Orb state={cState} />
        </span>
        {bench > 0 && <span className="badge">{bench}</span>}
        <span className="status">
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
        <span className="station-head">
          <span className="name">🧫 Khay sau ly tâm</span>
          <Orb state={spun > 0 ? 'busy' : 'ready'} />
        </span>
        {spun > 0 && <span className="badge">{spun}</span>}
        <span className="status">{spun} ống chờ nạp máy</span>
      </button>
      <button className="station card" onClick={() => setOverlay({ kind: 'analyzer' })}>
        <span className="station-head">
          <span className="name">⚗️ Máy hoá sinh</span>
          <Orb state={a.current ? 'busy' : 'ready'} />
        </span>
        <span className="status">
          {a.current
            ? `Đang chạy · chờ ${a.queue.length}`
            : a.queue.length > 0 && qc && (qc.status !== 'passed' || qcBusy)
              ? `⏳ ${a.queue.length} ống chờ QC đạt`
              : 'Rảnh'}
        </span>
        {a.current && (
          <div className="progress">
            <div style={{ width: `${100 - ((a.current.endsAt - shift.clock) / per) * 100}%` }} />
          </div>
        )}
      </button>
      <button className="station card" onClick={() => setOverlay({ kind: 'results' })}>
        <span className="station-head">
          <span className="name">📋 Kết quả</span>
          <Orb state={resulted > 0 ? 'busy' : 'ready'} />
        </span>
        {resulted > 0 && <span className="badge">{resulted}</span>}
        <span className="status">
          {Object.values(shift.orders).filter((o) => o.status === 'released').length} phiếu đã gửi
        </span>
      </button>
    </>
  );
}
