import type { ReactNode } from 'react';
import type { HelpContext } from '../../sim';
import { CodexHelp } from './CodexHelp';

/** Lớp phủ dạng tấm. `help` thêm nút "?" mở thẻ Sổ tay liên quan (04-GDD mục 12). */
export function Sheet({
  title,
  onClose,
  help,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  help?: HelpContext;
  children: ReactNode;
}) {
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
