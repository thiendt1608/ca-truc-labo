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
    <Sheet title={`📋 Kết quả (${ready.length} chờ duyệt)`} onClose={close}>
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
  return (
    <div className="card stack">
      <div className="row">
        <b className="grow">
          {patient.name} · {patient.birthYear}
        </b>
        {order.priority === 'stat' && <span className="pill stat">🚑</span>}
      </div>
      <div className="muted">
        {patient.code} · {order.ward} · hẹn trả {clockText(shift, order.deadline)} {late ? '⚠️ trễ' : ''}
      </div>
      <table className="results">
        <thead>
          <tr>
            <th>Xét nghiệm</th>
            <th>Kết quả</th>
            <th>Đơn vị</th>
            <th>Tham chiếu</th>
          </tr>
        </thead>
        <tbody>
          {order.results?.map((r) => {
            const a = content.chemTests.flatMap((x) => x.analytes).find((x) => x.code === r.code)!;
            const [lo, hi] = patient.sex === 'F' && a.refF ? a.refF : a.ref;
            return (
              <tr key={r.code}>
                <td>{a.name}</td>
                <td className={`flag-${r.flag}`}>
                  {r.display} {r.flag} {r.critical && <span className="crit">‼️</span>}
                </td>
                <td className="muted">{a.unit}</td>
                <td className="muted">{lo === 0 ? `≤ ${hi}` : `${lo}–${hi}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="row wrap">
        <button
          className="primary small"
          onClick={() => dispatch({ type: 'releaseOrder', orderId: order.id })}
        >
          ✅ Duyệt và gửi
        </button>
        <button className="small" onClick={() => dispatch({ type: 'rerunOrder', orderId: order.id })}>
          🔁 Làm lại
        </button>
        <button
          className="small danger"
          onClick={() => dispatch({ type: 'cancelOrderRecollect', orderId: order.id })}
        >
          Huỷ, lấy mẫu mới
        </button>
        {critical && day.unlocks.includes('critical') && !order.criticalCalled && (
          <button
            className="small danger"
            onClick={() => dispatch({ type: 'callCritical', orderId: order.id })}
          >
            📞 Gọi báo ‼️
          </button>
        )}
      </div>
    </div>
  );
}
