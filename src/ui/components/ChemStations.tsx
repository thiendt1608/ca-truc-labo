import { useState } from 'react';
import { getContent, isBalanced } from '../../sim';
import { t } from '../../i18n';
import { clockText, runProgress, useGame } from '../../store/game';
import { Sheet } from './Overlay';
import { Tube } from './Tube';

/** Máy ly tâm: chọn ống ở bàn chờ rồi chạm vào ô trong rổ; ống nào cũng cần ống đối diện. */
export function CentrifugeSheet() {
  const shift = useGame((s) => s.shift)!;
  const difficulty = useGame((s) => s.difficulty);
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const [selected, setSelected] = useState<string | null>(null);
  const c = shift.chem!.centrifuge;
  const bench = Object.values(shift.samples).filter((s) => s.status === 'bench');
  const n = c.slots.length;
  const half = n / 2;
  const radius = 100;

  const onSlot = (i: number) => {
    if (c.running) return;
    if (c.slots[i] !== null) dispatch({ type: 'chem/clearSlot', slot: i });
    else if (selected) {
      dispatch({ type: 'chem/placeTube', slot: i, content: selected });
      if (selected !== 'water') setSelected(null);
    }
  };
  const missingPair = (i: number) => c.slots[i] !== null && c.slots[(i + half) % n] === null;
  const tubes = c.slots.filter((x) => x && x !== 'water').length;

  return (
    <Sheet title="🌀 Máy ly tâm" onClose={close}>
      {c.contaminated ? (
        <p>⚠️ Có ống vỡ trong máy. Cần dọn theo quy trình an toàn trước khi dùng lại.</p>
      ) : c.running ? (
        <>
          <p>
            {c.unbalanced ? '⚠️ Máy đang rung mạnh...' : `Đang quay, xong lúc ${clockText(shift, c.endsAt)}.`}
          </p>
          <div className="progress">
            <div
              style={{
                width: `${runProgress(shift, c.endsAt, getContent().chemRules.centrifuge.spinSeconds)}%`,
              }}
            />
          </div>
        </>
      ) : (
        <p className="muted">
          Chọn ống ở dưới rồi chạm vào ô trong rổ. Mỗi ống cần một ống ở ô đối diện (cách nhau 6 ô, ví dụ ô 1
          và ô 7). Chạm ô có ống để lấy ra.
        </p>
      )}
      <div className={`rotor ${c.running ? 'running' : ''}`} aria-label="Rổ máy ly tâm">
        <div className="hub" />
        {c.slots.map((content, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = 130 + radius * Math.cos(angle) - 24;
          const y = 130 + radius * Math.sin(angle) - 24;
          const sample = content && content !== 'water' ? shift.samples[content] : null;
          return (
            <button
              key={i}
              className={`slot ${difficulty === 'easy' && missingPair(i) ? 'warn' : ''}`}
              style={{ left: x, top: y }}
              onClick={() => onSlot(i)}
              disabled={c.running || c.contaminated}
              aria-label={`Ô ${i + 1}${content ? (content === 'water' ? ': ống nước' : ': ống mẫu') : ': trống'}`}
            >
              {content === 'water' ? '💧' : sample ? <Tube container={sample.container} size={16} /> : i + 1}
            </button>
          );
        })}
      </div>
      {difficulty === 'easy' && tubes > 0 && !c.running && (
        <p className="muted">
          {isBalanced(c.slots) ? '✅ Đã cân bằng' : '⚠️ Ô viền đỏ chưa có ống đối diện'}
        </p>
      )}
      {!c.running && !c.contaminated && (
        <>
          <div className="chips">
            {bench.map((s) => {
              const o = shift.orders[s.orderId]!;
              return (
                <button
                  key={s.id}
                  className={`chip ${selected === s.id ? 'selected' : ''}`}
                  onClick={() => setSelected(s.id)}
                >
                  <Tube container={s.container} size={14} />
                  {s.id.toUpperCase()} {o.priority === 'stat' ? '🚑' : ''}
                </button>
              );
            })}
            <button
              className={`chip ${selected === 'water' ? 'selected' : ''}`}
              onClick={() => setSelected('water')}
            >
              💧 Ống nước
            </button>
          </div>
          {bench.length === 0 && tubes === 0 && <p className="muted">Chưa có ống nào chờ ly tâm.</p>}
          <button
            className="primary"
            disabled={tubes === 0}
            onClick={() => dispatch({ type: 'startCentrifuge', centrifugeId: 'c1' })}
          >
            ▶ Bắt đầu ly tâm ({tubes} ống)
          </button>
        </>
      )}
    </Sheet>
  );
}

/** Khay sau ly tâm: xem màu huyết thanh rồi nạp máy (hoặc từ chối / ly tâm tốc độ cao khi đã mở). */
export function PostSpinSheet() {
  const shift = useGame((s) => s.shift)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const day = getContent().dayById.get(shift.dayId)!;
  const check = day.unlocks.includes('postSpinCheck');
  const spun = Object.values(shift.samples).filter((s) => s.status === 'spun');
  return (
    <Sheet title="🧫 Khay sau ly tâm" onClose={close}>
      {spun.length === 0 && <p className="muted">Chưa có ống nào. Ống ly tâm xong sẽ nằm ở đây.</p>}
      {!check && spun.length > 1 && (
        <button
          className="primary"
          onClick={() => spun.forEach((s) => dispatch({ type: 'chem/loadAnalyzer', sampleId: s.id }))}
        >
          Nạp tất cả vào máy hoá sinh
        </button>
      )}
      {spun.map((s) => {
        const o = shift.orders[s.orderId]!;
        return (
          <div key={s.id} className="card row">
            <Tube container={s.container} spun={s.container !== 'purple'} defects={s.defects} size={30} />
            <div className="grow">
              <b>{s.id.toUpperCase()}</b> {o.priority === 'stat' ? '🚑' : ''}
              <div className="muted">{o.tests.join(', ')}</div>
            </div>
            <div className="stack">
              <button
                className="small primary"
                onClick={() => dispatch({ type: 'chem/loadAnalyzer', sampleId: s.id })}
              >
                Nạp máy
              </button>
              {check && (
                <>
                  <button
                    className="small"
                    onClick={() => dispatch({ type: 'chem/highSpeedSpin', sampleId: s.id })}
                  >
                    Ly tâm tốc độ cao
                  </button>
                  <button
                    className="small danger"
                    onClick={() => dispatch({ type: 'rejectSample', sampleId: s.id, reason: 'hemolysis' })}
                  >
                    {t('reason.hemolysis')}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </Sheet>
  );
}

export function AnalyzerSheet() {
  const shift = useGame((s) => s.shift)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const a = shift.chem!.analyzer;
  const per = getContent().chemRules.analyzer.secondsPerSample;
  const qc = shift.chem!.qc;
  const qcWaiting = a.queue.length > 0 && !!qc && (qc.status !== 'passed' || shift.clock < qc.blockedUntil);
  const label = (orderId: string) => {
    const o = shift.orders[orderId]!;
    return `${o.sampleId.toUpperCase()} ${o.priority === 'stat' ? '🚑' : ''} · ${o.tests.join(', ')}`;
  };
  return (
    <Sheet title="⚗️ Máy hoá sinh" onClose={close}>
      {a.current ? (
        <div className="card stack">
          <b>Đang chạy: {label(a.current.orderId)}</b>
          <div className="progress">
            <div style={{ width: `${runProgress(shift, a.current.endsAt, per)}%` }} />
          </div>
        </div>
      ) : (
        <div className="stack">
          {qcWaiting ? (
            <>
              <p>⏳ Máy chưa chạy mẫu bệnh nhân vì QC chưa đạt.</p>
              <button className="primary" onClick={() => useGame.getState().setOverlay({ kind: 'qc' })}>
                🧪 Mở QC
              </button>
            </>
          ) : (
            <p className="muted">Máy đang rảnh.</p>
          )}
        </div>
      )}
      <b>Hàng chờ ({a.queue.length})</b>
      {a.queue.map((id, i) => (
        <div key={id} className="row card">
          <span className="grow">
            {i + 1}. {label(id)}
          </span>
          {i > 0 && (
            <button className="small" onClick={() => dispatch({ type: 'prioritize', orderId: id })}>
              🚑 Ưu tiên
            </button>
          )}
        </div>
      ))}
    </Sheet>
  );
}

/** Bàn nước tiểu: lọ đã nhận chờ nhúng que (mini-game so màu). */
export function UrineSheet() {
  const shift = useGame((s) => s.shift)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const cups = Object.values(shift.samples).filter((s) => s.status === 'urine');
  return (
    <Sheet title="🧪 Bàn nước tiểu" onClose={close}>
      {cups.length === 0 && <p className="muted">Chưa có lọ nước tiểu nào chờ. Nhận lọ ở khay trước.</p>}
      {cups.map((s) => {
        const o = shift.orders[s.orderId]!;
        const who = shift.patients[o.patientId]?.name ?? s.id;
        return (
          <div key={s.id} className="row card">
            <Tube container={s.container} size={26} />
            <span className="grow">
              {s.id.toUpperCase()} {o.priority === 'stat' ? '🚑' : ''} · {who}
            </span>
            <button
              className="primary small"
              onClick={() => {
                dispatch({ type: 'chem/startUrine', sampleId: s.id });
                close();
              }}
            >
              Nhúng que
            </button>
          </div>
        );
      })}
    </Sheet>
  );
}
