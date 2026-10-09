import type { ReactNode } from 'react';
import type { HelpContext } from '../../sim';
import { useClockFactor, useGame } from '../../store/game';
import { useEscape } from '../useEscape';
import { CodexHelp } from './CodexHelp';
import { ToastList } from './Notices';

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
  const factor = useClockFactor();
  useEscape(onClose, escapeClose && !inMinigame);
  return (
    <div className="overlay sheet-overlay" onClick={onClose}>
      {/* Thông báo nằm trên đầu tấm, ngoài vùng cuộn: không bao giờ đè lên nút hay tiêu đề của tấm. */}
      {!inMinigame && <ToastList />}
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="sheet-title">
            <h2>{title}</h2>
            {factor > 0 && factor < 1 && (
              <span className="slow-chip">🐢 Giờ chậm ×{String(factor).replace('.', ',')}</span>
            )}
          </div>
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
