import { getContent, type Order } from '../../sim';
import { clockText, useGame } from '../../store/game';
import { Sheet } from './Overlay';

/** S8 Kết quả (LIS): xem cờ, duyệt và gửi, làm lại, huỷ và lấy mẫu mới, gọi báo ‼️. */
export function ResultsSheet() {
  const shift = useGame((s) => s.shift)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const content = getContent();
  const day = content.dayById.get(shift.dayId)!;
  const ready = Object.values(shift.orders)
    .filter((o) => o.status === 'resulted')
    .sort((a, b) => (a.priority === b.priority ? a.deadline - b.deadline : a.priority === 'stat' ? -1 : 1));
  const released = Object.values(shift.orders).filter((o) => o.status === 'released').length;
  const unflagged = ready.filter((o) => o.results?.every((r) => !r.flag && !r.critical));

  return (
    <Sheet title={`📋 Kết quả (${ready.length} chờ duyệt)`} help="results" onClose={close}>
      <p className="muted">
        Đã gửi {released} phiếu. Kỹ thuật viên chỉ kiểm tra và gửi kết quả; bác sĩ mới là người kết luận bệnh.
      </p>
      {day.unlocks.includes('releaseAllUnflagged') && unflagged.length > 1 && (
        <button onClick={() => unflagged.forEach((o) => dispatch({ type: 'releaseOrder', orderId: o.id }))}>
          Gửi tất cả phiếu không có cờ ({unflagged.length})
        </button>
      )}
      {ready.length === 0 && <p className="muted">Chưa có kết quả nào chờ duyệt.</p>}
      {ready.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </Sheet>
  );
}

function OrderCard({ order }: { order: Order }) {
  const shift = useGame((s) => s.shift)!;
  const dispatch = useGame((s) => s.dispatch);
  const content = getContent();
  const day = content.dayById.get(shift.dayId)!;
  const patient = shift.patients[order.patientId]!;
  const critical = order.results?.some((r) => r.critical);
  const late = shift.clock > order.deadline;
  const analytes = content.chemTests.flatMap((x) => x.analytes);
  const urinePads = content.chemUrine.pads;
  const overRange = order.results?.filter((r) => r.overRange) ?? [];
  const hasDelta = order.results?.some((r) => r.delta);
  return (
    <div className="card stack">
      <div className="row">
        <b className="grow">
          {patient.name} · {patient.birthYear}
        </b>
        {order.priority === 'stat' && <span className="pill stat">🚑 KHẨN</span>}
      </div>
      <div className="muted">
        {patient.code} · {order.ward} · hẹn trả {clockText(shift, order.deadline)} {late ? '⚠️ trễ' : ''}
      </div>
      <div className="result-grid">
        {order.results?.map((r) => {
          const pad = urinePads.find((x) => x.id === r.code);
          if (pad) {
            return (
              <div key={r.code} className={`result-cell ${r.flag ? 'abn' : 'ok'}`}>
                <span className="rname">{pad.name}</span>
                <span className="rverdict">{r.flag ? '▲ Bất thường' : 'Bình thường'}</span>
                <b className="rval">{r.display}</b>
              </div>
            );
          }
          const a = analytes.find((x) => x.code === r.code)!;
          const [lo, hi] = patient.sex === 'F' && a.refF ? a.refF : a.ref;
          const verdict = r.critical
            ? '‼️ Nguy hiểm'
            : r.overRange
              ? '⚠ Vượt dải đo'
              : r.flag === 'H'
                ? '▲ Cao'
                : r.flag === 'L'
                  ? '▼ Thấp'
                  : 'Chuẩn';
          return (
            <div
              key={r.code}
              className={`result-cell ${r.critical ? 'crit' : r.flag || r.overRange ? 'abn' : 'ok'}`}
            >
              <span className="rname">{a.name}</span>
              <span className="rverdict">{verdict}</span>
              <span>
                <b className="rval">{r.display}</b> <span className="muted">{a.unit}</span>
              </span>
              {r.dilution && !r.overRange && (
                <span className="muted">
                  Đo {r.dilution.reading} × {r.dilution.ratio} (pha loãng 1:{r.dilution.ratio})
                </span>
              )}
              {r.delta && (
                <span className="delta-chip">
                  Δ Lần trước: {r.delta.previous}
                  {order.deltaChecked ? ' · đã làm lại, vẫn lệch' : ''}
                </span>
              )}
              <span className="muted">Chuẩn: {lo === 0 ? `≤ ${hi}` : `${lo}–${hi}`}</span>
            </div>
          );
        })}
      </div>
      {overRange.length > 0 && day.unlocks.includes('dilution') && (
        <div className="card stack dilute-box">
          <b>⚠ Có kết quả vượt dải đo ({overRange.map((r) => r.display).join(', ')})</b>
          <span className="muted">
            Pha loãng mẫu, chạy lại rồi nhân với hệ số. Chọn tỉ lệ nhỏ nhất đưa kết quả vào dải đo.
          </span>
          <button
            className="primary"
            onClick={() => {
              dispatch({ type: 'chem/startDilution', orderId: order.id });
              useGame.getState().setOverlay(null);
            }}
          >
            🧪 Pha loãng mẫu
          </button>
        </div>
      )}
      {hasDelta && (
        <p className="muted">
          {order.deltaChecked
            ? 'Đã làm lại mà vẫn lệch. Nghi nhầm người thì Huỷ, lấy mẫu mới; nếu bệnh nhân thật sự thay đổi thì có thể trả.'
            : 'Δ: kết quả khác nhiều so với lần trước. Bấm Làm lại để kiểm tra; vẫn lệch mà nghi nhầm người thì Huỷ, lấy mẫu mới.'}
        </p>
      )}
      <button className="primary" onClick={() => dispatch({ type: 'releaseOrder', orderId: order.id })}>
        ✅ Duyệt và gửi
      </button>
      <div className="row wrap">
        <button className="small grow" onClick={() => dispatch({ type: 'rerunOrder', orderId: order.id })}>
          🔁 Làm lại
        </button>
        <button
          className="small danger grow"
          onClick={() => dispatch({ type: 'cancelOrderRecollect', orderId: order.id })}
        >
          Huỷ, lấy mẫu mới
        </button>
        {critical && day.unlocks.includes('critical') && !order.criticalCalled && (
          <button
            className="small danger grow"
            onClick={() => dispatch({ type: 'callCritical', orderId: order.id })}
          >
            📞 Gọi báo ‼️
          </button>
        )}
        {critical && order.criticalCalled && <span className="pill">✅ Đã báo bác sĩ</span>}
      </div>
    </div>
  );
}
