import { getContent, type Difficulty } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';

const DIFFICULTIES: { id: Difficulty; name: string; note: string }[] = [
  { id: 'easy', name: 'Dễ', note: 'Đồng hồ chậm, có gợi ý ống cần dùng, Niềm tin không dưới 30' },
  { id: 'normal', name: 'Thường', note: 'Như một ca thật' },
  { id: 'hard', name: 'Khó', note: 'Đồng hồ nhanh, lỗi tinh vi hơn' },
];

const CHAPTERS = [
  'Tiếp nhận',
  'Hoá sinh',
  'Huyết học – Truyền máu',
  'Vi sinh – Ký sinh trùng',
  'Miễn dịch',
  'Giải phẫu bệnh – Tế bào học',
  'Ca trực đêm',
];

/** S1 Mở đầu + S2 Bản đồ chiến dịch (bản hộp xám: chỉ các ngày đã làm). */
export function Home() {
  const save = useGame((s) => s.save);
  const difficulty = useGame((s) => s.difficulty);
  const { setDifficulty, openDay, go } = useGame.getState();
  const days = getContent().days;
  const collected = save.codex.length;
  const totalCards = getContent().codex.length;

  return (
    <div className="screen">
      <div>
        <h1>🧪 CA TRỰC LABO</h1>
        <p className="muted">Năm đầu đi làm của một kỹ thuật viên xét nghiệm. Bản thử nghiệm hộp xám.</p>
      </div>

      <div className="card stack">
        <h2>Chiến dịch "Năm đầu đi làm"</h2>
        {CHAPTERS.map((name, chapter) => {
          const chapterDays = days.filter((d) => d.chapter === chapter);
          return (
            <div key={chapter} className="stack">
              <b>
                Chương {chapter} · {name}
              </b>
              {chapterDays.length === 0 ? (
                <span className="muted">Chưa có trong bản này</span>
              ) : (
                chapterDays.map((d) => {
                  const best = save.days[d.id];
                  return (
                    <button
                      key={d.id}
                      className="row"
                      style={{ justifyContent: 'space-between' }}
                      onClick={() => openDay(d.id)}
                    >
                      <span>
                        Ngày {d.chapter}.{d.day} · {d.title}
                      </span>
                      <span>{best ? '⭐'.repeat(best.stars) : '▶'}</span>
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      <div className="card stack">
        <b>Độ khó</b>
        <div className="row">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              className={`grow ${difficulty === d.id ? 'primary' : ''}`}
              onClick={() => setDifficulty(d.id)}
            >
              {d.name}
            </button>
          ))}
        </div>
        <span className="muted">{DIFFICULTIES.find((d) => d.id === difficulty)?.note}</span>
      </div>

      <button onClick={() => go('codex')}>
        📖 Sổ tay KTV ({collected}/{totalCards} thẻ)
      </button>
      <p className="muted" style={{ fontSize: 12 }}>
        {t('disclaimer')}
      </p>
    </div>
  );
}
