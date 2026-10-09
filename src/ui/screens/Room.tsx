import { getContent, overAgeHint, routableDepts } from '../../sim';
import { t } from '../../i18n';
import { runProgress, useGame } from '../../store/game';
import { HelpHost } from '../components/CodexHelp';
import { Hud } from '../components/Hud';
import { Notices } from '../components/Notices';
import { CodexSheet, EventSheet, PhoneSheet } from '../components/EventSheets';
import { SampleCard } from '../components/SampleCard';
import { Tube } from '../components/Tube';
import {
  LazyAnalyzerSheet,
  LazyCentrifugeSheet,
  LazyDebugPanel,
  LazyMinigameHost,
  LazyPostSpinSheet,
  LazyQcSheet,
  LazyResultsSheet,
  LazyUrineSheet,
  QuietSuspense,
} from '../lazy';

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
  const hints = getContent().difficulty.levels[shift.difficulty].hints;
  const resulted = Object.values(shift.orders).filter((o) => o.status === 'resulted').length;
  const calls = shift.phone.calls.length;
  const hasPhone = calls > 0 || day.events.some((e) => e.id === 'E2');

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
          const overAge = hints && overAgeHint(content, s, o, shift.dayStart + shift.clock);
          const waited = Math.floor((shift.clock - s.arrivedAt) / 60);
          return (
            <button
              key={s.id}
              className={`tray-item ${s.lateCharged ? 'late' : ''}`}
              onClick={() => openSample(s.id)}
            >
              {o.priority === 'stat' && <span className="stat">🚑 KHẨN</span>}
              {overAge && (
                <span className="overage-flag" role="img" aria-label="Để quá giờ">
                  ⏰
                </span>
              )}
              <Tube
                container={s.container}
                size={30}
                underfill={s.defects.some((d) => d.kind === 'underfill')}
                leak={s.defects.some((d) => d.kind === 'leak')}
              />
              <span className="who">{who}</span>
              <span className="age">
                <span className="letter-chip">
                  {getContent().containers.find((c) => c.id === s.container)?.letter}
                </span>{' '}
                {s.id.toUpperCase()} · {waited}′
              </span>
            </button>
          );
        })}
      </div>
      <div
        className={`stations ${shift.room === 'reception' && routableDepts(day).length > 2 ? 'dense' : ''}`}
      >
        {shift.room === 'reception' ? <ReceptionStations /> : <ChemStations />}
      </div>
      <nav className="bottombar navbar" aria-label="Thanh lệnh">
        {shift.room !== 'reception' && (
          <button onClick={() => setOverlay({ kind: 'results' })}>
            <span aria-hidden>📋</span>
            <span>Kết quả</span>
            {resulted > 0 && <span className="dot">{resulted}</span>}
          </button>
        )}
        {hasPhone && (
          <button onClick={() => setOverlay({ kind: 'phone' })}>
            <span aria-hidden>📞</span>
            <span>Điện thoại</span>
            {calls > 0 && <span className="dot ring">{calls}</span>}
          </button>
        )}
        {shift.pending.length > 0 && (
          <button onClick={() => setOverlay({ kind: 'event' })}>
            <span aria-hidden>❗</span>
            <span>Sự kiện</span>
            <span className="dot">{shift.pending.length}</span>
          </button>
        )}
        <button onClick={() => setOverlay({ kind: 'codex' })}>
          <span aria-hidden>📖</span>
          <span>Sổ tay</span>
        </button>
        <button onClick={() => setPaused(true)}>
          <span aria-hidden>☰</span>
          <span>Menu</span>
        </button>
      </nav>

      {overlay?.kind === 'sample' && <SampleCard sampleId={overlay.sampleId} />}
      {overlay?.kind === 'centrifuge' && (
        <QuietSuspense>
          <LazyCentrifugeSheet />
        </QuietSuspense>
      )}
      {overlay?.kind === 'postspin' && (
        <QuietSuspense>
          <LazyPostSpinSheet />
        </QuietSuspense>
      )}
      {overlay?.kind === 'analyzer' && (
        <QuietSuspense>
          <LazyAnalyzerSheet />
        </QuietSuspense>
      )}
      {overlay?.kind === 'results' && (
        <QuietSuspense>
          <LazyResultsSheet />
        </QuietSuspense>
      )}
      {overlay?.kind === 'qc' && (
        <QuietSuspense>
          <LazyQcSheet />
        </QuietSuspense>
      )}
      {overlay?.kind === 'phone' && <PhoneSheet />}
      {overlay?.kind === 'event' && <EventSheet />}
      {overlay?.kind === 'codex' && <CodexSheet />}
      {overlay?.kind === 'urine' && (
        <QuietSuspense>
          <LazyUrineSheet />
        </QuietSuspense>
      )}
      {paused && (
        <div className="overlay" style={{ alignItems: 'center', background: 'var(--bg)' }}>
          <div className="sheet stack" style={{ borderRadius: 16, margin: 16 }}>
            <h2>⏸ Tạm dừng</h2>
            <button className="primary" onClick={() => setPaused(false)}>
              ▶ Tiếp tục
            </button>
            <button onClick={() => useGame.getState().openSettings('room')}>⚙️ Cài đặt</button>
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
      <QuietSuspense>
        <LazyMinigameHost />
      </QuietSuspense>
      <HelpHost />
      <Notices />
      <QuietSuspense>
        <LazyDebugPanel />
      </QuietSuspense>
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
  const day = getContent().dayById.get(shift.dayId)!;
  const count = (pred: (s: (typeof shift.samples)[string]) => boolean) =>
    Object.values(shift.samples).filter(pred).length;
  return (
    <>
      {routableDepts(day).map((d) => (
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
      {day.unlocks.includes('contact') && (
        <div className="station card">
          <span className="station-head">
            <span className="name">📞 Đã liên hệ</span>
          </span>
          <span className="status">{count((s) => s.status === 'contacted')} ống</span>
        </div>
      )}
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
  const urineCount = samples.filter((s) => s.status === 'urine').length;
  const resulted = Object.values(shift.orders).filter((o) => o.status === 'resulted').length;
  const c = chem.centrifuge;
  const spin = getContent().chemRules.centrifuge.spinSeconds;
  const per = getContent().chemRules.analyzer.secondsPerSample;
  const a = chem.analyzer;
  const qc = chem.qc;
  const unlocked = getContent().dayById.get(shift.dayId)!.unlocks;
  const qcBusy = !!qc && shift.clock < qc.blockedUntil;
  const powerOut = shift.clock < shift.effects.powerOutUntil;
  const analyzerDown = shift.clock < shift.effects.analyzerDownUntil;
  const cState = c.contaminated || c.unbalanced || powerOut ? 'error' : c.running ? 'busy' : 'ready';
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
          {powerOut
            ? '⚡ Mất điện'
            : c.contaminated
              ? '⚠️ Cần dọn'
              : c.running
                ? c.unbalanced
                  ? '⚠️ Đang rung!'
                  : 'Đang quay'
                : `${bench} ống chờ`}
        </span>
        {c.running && !c.unbalanced && (
          <div className="progress">
            <div style={{ width: `${runProgress(shift, c.endsAt, spin)}%` }} />
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
      {unlocked.includes('urine') && (
        <button className="station card" onClick={() => setOverlay({ kind: 'urine' })}>
          <span className="station-head">
            <span className="name">🧪 Bàn nước tiểu</span>
            <Orb state={urineCount > 0 ? 'busy' : 'ready'} />
          </span>
          {urineCount > 0 && <span className="badge">{urineCount}</span>}
          <span className="status">{urineCount} lọ chờ nhúng que</span>
        </button>
      )}
      <button className="station card" onClick={() => setOverlay({ kind: 'analyzer' })}>
        <span className="station-head">
          <span className="name">⚗️ Máy hoá sinh</span>
          <Orb state={analyzerDown || powerOut ? 'error' : a.current ? 'busy' : 'ready'} />
        </span>
        <span className="status">
          {powerOut
            ? '⚡ Mất điện'
            : analyzerDown
              ? '⚙️ Máy đang lỗi'
              : a.current
                ? `Đang chạy · chờ ${a.queue.length}`
                : a.queue.length > 0 && qc && (qc.status !== 'passed' || qcBusy)
                  ? `⏳ ${a.queue.length} ống chờ QC đạt`
                  : 'Rảnh'}
        </span>
        {a.current && (
          <div className="progress">
            <div style={{ width: `${runProgress(shift, a.current.endsAt, per)}%` }} />
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
