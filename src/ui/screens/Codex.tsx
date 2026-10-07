import { useState } from 'react';
import { getContent } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';

/** S12 Sổ tay KTV: thẻ đã mở theo khoa. */
export function Codex() {
  const save = useGame((s) => s.save);
  const go = useGame((s) => s.go);
  const [open, setOpen] = useState<string | null>(null);
  const content = getContent();
  const rooms = [...new Set(content.codex.map((c) => c.dept))];
  return (
    <div className="screen">
      <h1>📖 Sổ tay KTV</h1>
      <p className="muted">
        Đã mở {save.codex.length}/{content.codex.length} thẻ. Thẻ mở khi em gặp lần đầu hoặc khi làm sai.
      </p>
      {rooms.map((room) => {
        const cards = content.codex.filter((c) => c.dept === room);
        return (
          <div key={room} className="card stack">
            <b>
              {t(`room.${room}`)} ({cards.filter((c) => save.codex.includes(c.id)).length}/{cards.length})
            </b>
            {cards.map((c) =>
              save.codex.includes(c.id) ? (
                <button key={c.id} style={{ textAlign: 'left' }} onClick={() => setOpen(c.id)}>
                  {c.title}
                </button>
              ) : (
                <span key={c.id} className="muted">
                  🔒 ???
                </span>
              ),
            )}
          </div>
        );
      })}
      {open && <CodexCardView id={open} onClose={() => setOpen(null)} />}
      <button onClick={() => go('home')}>↩ Về sảnh</button>
    </div>
  );
}

export function CodexCardView({ id, onClose }: { id: string; onClose: () => void }) {
  const card = getContent().codexById.get(id);
  if (!card) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>📖 {card.title}</h2>
          <button className="small" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <p>{card.body}</p>
        <details>
          <summary>Biết thêm</summary>
          <p>{card.more}</p>
        </details>
        <p className="muted">Nguồn: {card.source.join(' · ')}</p>
      </div>
    </div>
  );
}
