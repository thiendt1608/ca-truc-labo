import { useEffect, useRef } from 'react';
import { getContent } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';

/** Danh sách thông báo ngắn (✅/❌/ℹ️). Dùng ở đáy phòng và ngay trên đầu tấm đang mở (xem `Sheet`). */
export function ToastList() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className={`toast ${x.kind}`}>
          {x.kind === 'mistake' ? '❌ ' : x.kind === 'good' ? '✅ ' : 'ℹ️ '}
          {x.text}
          {x.count > 1 && ` ×${x.count}`}
        </div>
      ))}
    </div>
  );
}

/** Mẹo của người hướng dẫn (≤ 2 câu) và thông báo ngắn khi làm đúng/sai. */
export function Notices() {
  const tips = useGame((s) => s.tips);
  const toasts = useGame((s) => s.toasts);
  const dayId = useGame((s) => s.shift?.dayId);
  const dismissTip = useGame((s) => s.dismissTip);
  const dropToast = useGame((s) => s.dropToast);
  // Mẹo chờ tới khi không còn lớp phủ, để không che nút của thẻ mẫu hay mini-game.
  const busy = useGame((s) => s.overlay !== null || s.shift?.minigame != null || s.paused);
  const inMinigame = useGame((s) => s.shift?.minigame != null);
  // Có tấm đang mở: thông báo nằm ngay trên đầu tấm (Sheet), không đè lên nút của tấm.
  const sheetOpen = useGame((s) => s.overlay !== null && s.shift?.minigame == null);
  const mentor = dayId ? getContent().dayById.get(dayId)?.mentor : undefined;

  // Mỗi thông báo có đồng hồ riêng, đặt đúng một lần: thông báo mới tới không làm các cái cũ sống lâu hơn.
  const timers = useRef(new Map<number, number>());
  useEffect(() => {
    const live = new Set(toasts.map((x) => x.id));
    for (const [id, h] of timers.current) {
      if (!live.has(id)) {
        window.clearTimeout(h);
        timers.current.delete(id);
      }
    }
    for (const x of toasts) {
      if (timers.current.has(x.id)) continue;
      timers.current.set(
        x.id,
        window.setTimeout(
          () => {
            timers.current.delete(x.id);
            dropToast(x.id);
          },
          // Chữ càng dài thì cần càng lâu để đọc (thông báo dạy học dài hơn thông báo ngắn).
          Math.min(9000, Math.max(x.kind === 'mistake' ? 5000 : 2200, 1500 + x.text.length * 60)),
        ),
      );
    }
  }, [toasts, dropToast]);
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((h) => window.clearTimeout(h));
      map.clear();
    };
  }, []);

  const tip = busy ? undefined : tips[0];
  // Mẹo và thông báo cùng nằm ở đáy (trên thanh lệnh) để không che HUD và khay mẫu.
  return (
    <div className={`floaters ${inMinigame ? 'in-mg' : ''}`}>
      {tip && (
        <button className="tip" onClick={() => dismissTip(tip.id)}>
          <b>💬 {mentor ? t(`mentor.${mentor}`) : 'Người hướng dẫn'}</b>
          {tip.text}
          <span className="muted" aria-hidden>
            {' '}
            ✕
          </span>
        </button>
      )}
      {!sheetOpen && <ToastList />}
    </div>
  );
}
