import type { ReactNode } from 'react';
import type { HelpContext } from '../../sim';
import { useGame } from '../../store/game';
import { useEscape } from '../useEscape';
import { CodexHelp } from './CodexHelp';

/**
 * Lớp phủ dạng tấm. `help` thêm nút "?" mở thẻ Sổ tay liên quan (04-GDD mục 12).
 * Escape đóng tấm, trừ khi `escapeClose={false}` (quyết định bắt buộc) hoặc đang có mini-game phía trên.
 */
export function Sheet({
  title,
  onClose,
  help,
  escapeClose = true,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  help?: HelpContext;
  escapeClose?: boolean;
  children: ReactNode;
}) {
  const inMinigame = useGame((s) => s.shift?.minigame != null);
  useEscape(onClose, escapeClose && !inMinigame);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          {help && <CodexHelp context={help} />}
          <button className="small" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
