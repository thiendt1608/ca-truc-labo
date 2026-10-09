import { useEffect } from 'react';
import { getContent } from '../../sim';
import { isCardUnlocked, useGame } from '../../store/game';
import { useEscape } from '../useEscape';

/**
 * Xem một thẻ: nội dung nếu đã mở (và đánh dấu đã đọc), còn chưa mở thì hiện "mở khi ..." (không lộ nội dung).
 * Luôn nằm trên cùng (cả trên mini-game) để nút "?" dùng được ở mọi màn.
 */
export function CodexCardView({ id, onClose }: { id: string; onClose: () => void }) {
  const card = getContent().codexById.get(id);
  const unlocked = useGame((s) => isCardUnlocked(s, id));
  useEffect(() => {
    if (unlocked) useGame.getState().markCodexSeen(id);
  }, [id, unlocked]);
  useEscape(onClose);
  if (!card) return null;
  return (
    <div className="overlay top" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{unlocked ? `📖 ${card.title}` : '🔒 Thẻ chưa mở'}</h2>
          <button className="small" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        {unlocked ? (
          <>
            <p>{card.body}</p>
            <details>
              <summary>Biết thêm</summary>
              <p>{card.more}</p>
            </details>
            <p className="muted">Nguồn: {card.source.join(' · ')}</p>
          </>
        ) : (
          <p>{card.unlockHint}</p>
        )}
      </div>
    </div>
  );
}
