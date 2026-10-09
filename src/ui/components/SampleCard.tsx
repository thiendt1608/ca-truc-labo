import { useState } from 'react';
import { getContent, overAgeHint, routableDepts, type RejectReason } from '../../sim';
import { t } from '../../i18n';
import { clockText, secondsOfDayText, useGame, useHints } from '../../store/game';
import { Sheet } from './Overlay';
import { Tube } from './Tube';

const TRAY_REASONS: RejectReason[] = ['identity', 'container', 'volume', 'time', 'leak'];

/** S5 Thẻ mẫu: phiếu chỉ định bên trái, nhãn ống bên phải để so; Nhận / Từ chối (lý do) / Liên hệ. */
export function SampleCard({ sampleId }: { sampleId: string }) {
  const shift = useGame((s) => s.shift)!;
  const hints = useHints();
  const debug = useGame((s) => s.debug);
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const [mode, setMode] = useState<'main' | 'route' | 'reject'>('main');
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

  const act = (fn: () => void) => {
    fn();
    close();
  };
  const accept = () => {
    if (shift.room === 'reception') setMode('route');
    else act(() => dispatch({ type: 'acceptSample', sampleId }));
  };

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
      <div className="compare">
        <div className="col">
          <h3>Phiếu chỉ định</h3>
          <Field k="Họ tên" v={patient.name} />
          <Field k="Năm sinh" v={patient.birthYear} />
          <Field k="Mã bệnh nhân" v={patient.code} />
          <Field k="Khoa gửi" v={order.ward} />
          <Field k="Xét nghiệm" v={testNames.join(', ')} />
          {sample.irreplaceable && <Field k="Ghi chú" v="🧬 Bệnh phẩm sinh thiết, không lấy lại được" />}
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
        <div className="col">
          <h3>Nhãn trên ống</h3>
          {sample.label ? (
            <>
              <Field k="Họ tên" v={sample.label.name} />
              <Field k="Năm sinh" v={sample.label.birthYear} />
              <Field k="Mã bệnh nhân" v={sample.label.patientCode} />
              <Field k="Giờ lấy mẫu" v={secondsOfDayText(sample.label.collectedAt)} />
            </>
          ) : (
            <p className="v">⚠️ Ống không có nhãn</p>
          )}
          <div className="row">
            <Tube
              container={sample.container}
              size={30}
              underfill={sample.defects.some((d) => d.kind === 'underfill')}
              leak={leaking}
            />
            <span className="muted">
              {container.name} ({container.letter})
              <br />
              Bây giờ: {clockText(shift)}
            </span>
          </div>
          {overAge && <span className="pill overage">⏰ Để quá giờ</span>}
          {leaking && <p className="v">💧 Lọ ướt, có dịch rỉ ra ngoài</p>}
        </div>
      </div>

      {debug.showHidden && (
        <div className="hidden-info">
          🐞 Lỗi ẩn: {JSON.stringify(sample.defects)} · tiếp nhận nên: {order.dept}
        </div>
      )}

      {mode === 'main' && (
        <div className="choices">
          <button className="primary" onClick={accept}>
            ✅ Nhận
          </button>
          <button className="danger" onClick={() => setMode('reject')}>
            ❌ Từ chối
          </button>
          {day.unlocks.includes('contact') && (
            <button onClick={() => act(() => dispatch({ type: 'contactWard', sampleId }))}>📞 Liên hệ</button>
          )}
        </div>
      )}
      {mode === 'route' && (
        <>
          <p className="muted">Chuyển tới khoa nào? (xem xét nghiệm trên phiếu)</p>
          <div className="choices">
            {depts.map((d) => (
              <button
                key={d}
                data-room={d}
                className="dept-btn"
                onClick={() => act(() => dispatch({ type: 'acceptSample', sampleId, target: d }))}
              >
                {t(`dept.${d}`)}
              </button>
            ))}
            <button onClick={() => setMode('main')}>↩ Quay lại</button>
          </div>
        </>
      )}
      {mode === 'reject' && (
        <>
          <p className="muted">Lý do từ chối?</p>
          <div className="choices">
            {TRAY_REASONS.map((r) => (
              <button
                key={r}
                className="danger"
                onClick={() => act(() => dispatch({ type: 'rejectSample', sampleId, reason: r }))}
              >
                {t(`reason.${r}`)}
              </button>
            ))}
            <button onClick={() => setMode('main')}>↩ Quay lại</button>
          </div>
        </>
      )}
    </Sheet>
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
