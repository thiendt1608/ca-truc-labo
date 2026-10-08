import { useEffect } from 'react';
import { getContent } from '../../sim';
import { clockText, useGame } from '../../store/game';
import { Sheet } from './Overlay';

/** S9 Cuộc gọi (lớp phủ, dừng giờ): khoa lâm sàng hỏi về một phiếu; chọn câu trả lời có sẵn. */
export function PhoneSheet() {
  const shift = useGame((s) => s.shift)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const options = getContent().events.phone.options;
  return (
    <Sheet title="📞 Điện thoại" onClose={close}>
      {shift.phone.calls.length === 0 && <p className="muted">Không có cuộc gọi nào đang chờ.</p>}
      {shift.phone.calls.map((call) => {
        const order = shift.orders[call.orderId];
        const status = order
          ? order.status === 'resulted' || order.status === 'released'
            ? 'đã có kết quả'
            : 'chưa xong'
          : '';
        return (
          <div key={call.id} className="card stack">
            <b>{call.from}</b>
            <p>“{call.text}”</p>
            <span className="muted">
              Phiếu {status}. Cuộc gọi hết hạn lúc {clockText(shift, call.expiresAt)}.
            </span>
            {(['report', 'wait', 'later'] as const).map((choice) => (
              <button
                key={choice}
                className={choice === 'later' ? '' : 'primary'}
                onClick={() => dispatch({ type: 'answerPhone', callId: call.id, choice })}
              >
                {options[choice]}
              </button>
            ))}
          </div>
        );
      })}
    </Sheet>
  );
}

/** S9 Sự kiện (lớp phủ, dừng giờ): máy lỗi hoặc câu hỏi của sinh viên thực tập. */
export function EventSheet() {
  const shift = useGame((s) => s.shift)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = () => useGame.getState().setOverlay(null);
  const content = getContent();
  const ev = shift.pending[0];
  // Hết việc cần quyết định thì tự đóng, không để lại sheet trống.
  useEffect(() => {
    if (!ev) useGame.getState().setOverlay(null);
  }, [ev]);
  if (!ev) return null;
  const def = content.events.events[ev.eventId];
  const quiz = ev.quizId ? content.events.quizzes.find((q) => q.id === ev.quizId) : undefined;
  return (
    <Sheet title={def.title} onClose={close}>
      <p>{quiz ? quiz.question : def.text}</p>
      <div className="stack">
        {quiz
          ? quiz.options.map((label, i) => (
              <button
                key={label}
                className="primary"
                onClick={() => dispatch({ type: 'resolveEvent', id: ev.id, choice: String(i) })}
              >
                {label}
              </button>
            ))
          : def.options?.map((o) => (
              <button
                key={o.id}
                className={o.id === 'engineer' ? '' : 'primary'}
                onClick={() => dispatch({ type: 'resolveEvent', id: ev.id, choice: o.id })}
              >
                {o.label}
              </button>
            ))}
      </div>
      {shift.pending.length > 1 && (
        <p className="muted">Còn {shift.pending.length - 1} việc khác đang chờ.</p>
      )}
    </Sheet>
  );
}
