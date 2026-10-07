import { useEffect } from 'react';
import { getContent } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';

/** Mẹo của người hướng dẫn (≤ 2 câu) và thông báo ngắn khi làm đúng/sai. */
export function Notices() {
  const tips = useGame((s) => s.tips);
  const toasts = useGame((s) => s.toasts);
  const dayId = useGame((s) => s.shift?.dayId);
  const dismissTip = useGame((s) => s.dismissTip);
  const dropToast = useGame((s) => s.dropToast);
  // Mẹo chờ tới khi không còn lớp phủ, để không che nút của thẻ mẫu hay mini-game.
  const busy = useGame((s) => s.overlay !== null || s.shift?.minigame != null || s.paused);
  const mentor = dayId ? getContent().dayById.get(dayId)?.mentor : undefined;

  useEffect(() => {
    const timers = toasts.map((x) => setTimeout(() => dropToast(x.id), x.kind === 'mistake' ? 5000 : 2200));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dropToast]);

  const tip = busy ? undefined : tips[0];
  return (
    <>
      <div className="toasts" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className={`toast ${x.kind}`}>
            {x.kind === 'mistake' ? '❌ ' : x.kind === 'good' ? '✅ ' : 'ℹ️ '}
            {x.text}
          </div>
        ))}
      </div>
      {tip && (
        <button className="tip" onClick={() => dismissTip(tip.id)}>
          <b>💬 {mentor ? t(`mentor.${mentor}`) : 'Người hướng dẫn'}</b>
          {tip.text}
          <span className="muted"> (chạm để đóng)</span>
        </button>
      )}
    </>
  );
}
