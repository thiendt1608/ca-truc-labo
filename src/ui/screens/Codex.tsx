import { useState } from 'react';
import { getContent, type CodexCard, type RoomId } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';
import { CodexCardView } from '../components/CodexCardView';

/** Bỏ dấu và chữ hoa để tìm "tim" ra cả "Tím". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').toLowerCase();

function Progress({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((100 * done) / total);
  return (
    <div className="stack codex-progress">
      <div className="row">
        <span className="grow">{label}</span>
        <b>
          {done}/{total} · {pct}%
        </b>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** S12 Sổ tay KTV: % sưu tập tổng và theo khoa, lọc theo khoa, tìm kiếm, thẻ mới và gợi ý mở thẻ. */
export function Codex() {
  const save = useGame((s) => s.save);
  const go = useGame((s) => s.go);
  const [open, setOpen] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomId | 'all'>('all');
  const [query, setQuery] = useState('');
  const content = getContent();
  const rooms = [...new Set(content.codex.map((c) => c.dept))];
  const opened = new Set(save.codex);
  const seen = new Set(save.codexSeen);
  const fresh = save.codex.filter((id) => !seen.has(id)).length;
  const q = fold(query.trim());
  const matches = (c: CodexCard) => {
    if (q === '') return true;
    // Thẻ chưa mở chỉ khớp theo gợi ý, không lộ tên thẻ qua ô tìm kiếm.
    const text = opened.has(c.id) ? `${c.title} ${c.body} ${c.more}` : (c.unlockHint ?? '');
    return fold(text).includes(q);
  };
  const shownRooms = rooms.filter((r) => room === 'all' || r === room);
  const listed = shownRooms.flatMap((r) => content.codex.filter((c) => c.dept === r && matches(c)));

  return (
    <div className="screen">
      <h1>📖 Sổ tay KTV</h1>
      <p className="muted">
        Thẻ mở khi em gặp lần đầu hoặc khi làm sai.
        {fresh > 0 && ` Có ${fresh} thẻ mới chưa đọc.`}
      </p>

      <section className="card stack" aria-label="Tiến độ sưu tập">
        <Progress label="Tổng sưu tập" done={opened.size} total={content.codex.length} />
        {rooms.map((r) => {
          const cards = content.codex.filter((c) => c.dept === r);
          return (
            <Progress
              key={r}
              label={t(`room.${r}`)}
              done={cards.filter((c) => opened.has(c.id)).length}
              total={cards.length}
            />
          );
        })}
      </section>

      <div className="chips" role="group" aria-label="Lọc theo khoa">
        <button
          className={`chip ${room === 'all' ? 'selected' : ''}`}
          aria-pressed={room === 'all'}
          onClick={() => setRoom('all')}
        >
          Tất cả
        </button>
        {rooms.map((r) => (
          <button
            key={r}
            className={`chip ${room === r ? 'selected' : ''}`}
            aria-pressed={room === r}
            onClick={() => setRoom(r)}
          >
            {t(`room.${r}`)}
          </button>
        ))}
      </div>
      <input
        className="search"
        type="search"
        inputMode="search"
        placeholder="Tìm thẻ…"
        aria-label="Tìm thẻ Sổ tay"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {listed.length === 0 && <p className="muted">Không có thẻ nào khớp.</p>}
      {shownRooms.map((r) => {
        const cards = content.codex.filter((c) => c.dept === r && matches(c));
        if (cards.length === 0) return null;
        return (
          <div key={r} className="card stack">
            <b>{t(`room.${r}`)}</b>
            {cards.map((c) =>
              opened.has(c.id) ? (
                <button key={c.id} className="codex-card" onClick={() => setOpen(c.id)}>
                  <span className="grow">{c.title}</span>
                  {!seen.has(c.id) && <span className="new-badge">Mới</span>}
                </button>
              ) : (
                <div key={c.id} className="codex-locked">
                  <b>🔒 Chưa mở</b>
                  <span className="muted">{c.unlockHint}</span>
                </div>
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
