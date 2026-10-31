import { useState } from 'react';
import { getContent, overAgeHint, routableDepts, type RejectReason } from '../../sim';
import { t } from '../../i18n';
import { clockText, secondsOfDayText, useGame, useHints } from '../../store/game';
import { Sheet } from './Overlay';
import { Tube } from './Tube';

/** Lỗi nằm ở chính ống/lọ: chạm vào ống để chọn một trong ba. */
const TUBE_REASONS: { reason: RejectReason; icon: string }[] = [
  { reason: 'container', icon: '🧪' },
  { reason: 'volume', icon: '📉' },
  { reason: 'leak', icon: '💧' },
];

/**
 * S5 Thẻ mẫu: phiếu và nhãn đặt cạnh nhau theo từng hàng để so; Nhận (ở tiếp nhận: bấm thẳng khoa) / Từ chối / Liên hệ.
 * Từ chối = chạm vào chỗ sai (hàng tên/năm/mã, giờ lấy, hoặc chính cái ống) thay vì chọn chữ trong danh sách.
 */
export function SampleCard({ sampleId }: { sampleId: string }) {
  const shift = useGame((s) => s.shift)!;
  const hints = useHints();
  const debug = useGame((s) => s.debug);
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const [mode, setMode] = useState<'main' | 'reject' | 'tube'>('main');
  const content = getContent();
  const day = content.dayById.get(shift.dayId)!;
  const sample = shift.samples[sampleId];
  if (!sample || sample.status !== 'tray') return null;
  const order = shift.orders[sample.orderId]!;
  const patient = shift.patients[order.patientId]!;
  const container = content.containers.find((c) => c.id === sample.container)!;
  const testNames = order.tests.map((code) => content.testByCode.get(code)?.name ?? code);

  const depts = routableDepts(day);
  const overAge = hints && overAgeHint(content, sample, order, shift.dayStart + shift.clock);
  const leaking = sample.defects.some((d) => d.kind === 'leak');
  const pointing = mode === 'reject' || mode === 'tube';

  const act = (fn: () => void) => {
    fn();
    close();
  };
  const reception = shift.room === 'reception';
  const reject = (reason: RejectReason) => act(() => dispatch({ type: 'rejectSample', sampleId, reason }));
  const label = sample.label;

  return (
    <Sheet
      title={
        <>
          Mẫu {sample.id.toUpperCase()}{' '}
          {order.priority === 'stat' && <span className="pill stat">🚑 Cấp cứu</span>}
        </>
      }
      help="sample"
      onClose={close}
    >
      <div className="sample-meta">
        <Field k="Khoa gửi" v={order.ward} />
        <Field k="Mức ưu tiên" v={order.priority === 'stat' ? '🚑 Cấp cứu' : 'Thường'} />
        <Field k="Xét nghiệm" v={testNames.join(', ')} />
        {sample.irreplaceable && <p className="v">🧬 Sinh thiết: không lấy lại được</p>}
        {hints && (
          <div className="field">
            <div className="k">Ống cần (gợi ý mức Dễ)</div>
            <div className="row">
              <Tube container={order.container} size={22} />
              <span className="v">{content.containers.find((c) => c.id === order.container)?.name}</span>
            </div>
          </div>
        )}
      </div>

      {pointing && <p className="point-hint">👆 Chạm vào chỗ sai</p>}
      <div className={`match ${pointing ? 'pointing' : ''}`}>
        <div className="mrow mhead">
          <span />
          <span>📄 Phiếu</span>
          <span>🏷️ Nhãn ống</span>
        </div>
        {label ? (
          <>
            <Row
              k="Họ tên"
              a={patient.name}
              b={label.name}
              on={pointing ? () => reject('identity') : undefined}
            />
            <Row
              k="Năm sinh"
              a={patient.birthYear}
              b={label.birthYear}
              on={pointing ? () => reject('identity') : undefined}
            />
            <Row
              k="Mã BN"
              a={patient.code}
              b={label.patientCode}
              on={pointing ? () => reject('identity') : undefined}
            />
            <Row
              k="Giờ"
              a={`bây giờ ${clockText(shift)}`}
              b={`lấy lúc ${secondsOfDayText(label.collectedAt)}`}
              on={pointing ? () => reject('time') : undefined}
            />
          </>
        ) : (
          <Row k="Nhãn" a="" b="⚠️ Không có nhãn" on={pointing ? () => reject('identity') : undefined} />
        )}
      </div>

      <button
        type="button"
        className={`tube-spot ${pointing ? 'pointable' : ''}`}
        disabled={!pointing}
        onClick={() => setMode(mode === 'tube' ? 'reject' : 'tube')}
        aria-label={pointing ? 'Lỗi ở chính ống' : undefined}
      >
        <Tube
          container={sample.container}
          size={34}
          underfill={sample.defects.some((d) => d.kind === 'underfill')}
          leak={leaking}
        />
        <span className="muted">
          {container.name} ({container.letter})
          {leaking && (
            <>
              <br />
              💧 Lọ ướt, dịch rỉ ra
            </>
          )}
        </span>
        {overAge && <span className="pill overage">⏰ Để quá giờ</span>}
      </button>
      {mode === 'tube' && (
        <div className="choices tube-reasons">
          {TUBE_REASONS.map(({ reason, icon }) => (
            <button key={reason} className="danger" onClick={() => reject(reason)}>
              {icon} {t(`reason.${reason}`)}
            </button>
          ))}
        </div>
      )}

      {debug.showHidden && (
        <div className="hidden-info">
          🐞 Lỗi ẩn: {JSON.stringify(sample.defects)} · tiếp nhận nên: {order.dept}
        </div>
      )}

      {mode === 'main' && (
        // Ở tiếp nhận, nhận = chọn luôn khoa nhận (một chạm thay cho "Nhận" rồi chọn khoa).
        <div className={`choices sample-actions ${reception && depts.length > 2 ? 'dense' : ''}`}>
          {reception && <p className="route-label">✅ Nhận, chuyển tới:</p>}
          {reception ? (
            depts.map((d) => (
              <button
                key={d}
                data-room={d}
                className="dept-btn"
                onClick={() => act(() => dispatch({ type: 'acceptSample', sampleId, target: d }))}
              >
                {t(`dept.${d}`)}
              </button>
            ))
          ) : (
            <button
              className="primary"
              onClick={() => act(() => dispatch({ type: 'acceptSample', sampleId }))}
            >
              ✅ Nhận
            </button>
          )}
          <button className="danger" onClick={() => setMode('reject')}>
            ❌ Từ chối
          </button>
          {day.unlocks.includes('contact') && (
            <button onClick={() => act(() => dispatch({ type: 'contactWard', sampleId }))}>📞 Liên hệ</button>
          )}
        </div>
      )}
      {pointing && (
        <div className="choices">
          <button onClick={() => setMode('main')}>↩ Quay lại</button>
        </div>
      )}
    </Sheet>
  );
}

/** Một hàng so khớp: tên trường | phiếu | nhãn. Khi đang chỉ lỗi, cả hàng là một nút. */
function Row({ k, a, b, on }: { k: string; a: string | number; b: string | number; on?: () => void }) {
  const cells = (
    <>
      <span className="k">{k}</span>
      <span className="v">{a}</span>
      <span className="v">{b}</span>
    </>
  );
  return on ? (
    <button type="button" className="mrow" onClick={on} aria-label={`Sai ở ${k}`}>
      {cells}
    </button>
  ) : (
    <div className="mrow">{cells}</div>
  );
}

function Field({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="field">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
