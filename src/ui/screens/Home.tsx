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

/** S1 Mở đầu + S2 Bản đồ chiến dịch (bản hiện tại: chỉ các ngày đã có nội dung). */
export function Home() {
  const save = useGame((s) => s.save);
  const difficulty = useGame((s) => s.difficulty);
  const { setDifficulty, openDay, go } = useGame.getState();
  const content = getContent();
  const days = content.days;
  const collected = save.codex.length;
  const totalCards = content.codex.length;
  // Nhiệm vụ hiện tại: ngày đầu tiên chưa chơi, hoặc ngày cuối nếu đã chơi hết.
  const current = days.find((d) => !save.days[d.id]) ?? days[days.length - 1]!;
  const best = save.days[current.id];
  const startTip = current.tips.find((x) => x.trigger === 'start');
  const played = days.filter((d) => save.days[d.id]).length;

  return (
    <>
      <div className="screen">
        <header className="row home-head">
          <span className="logo" aria-hidden>
            🔬
          </span>
          <div className="grow">
            <h1>CA TRỰC LABO</h1>
            <span className="muted">
              Năm đầu đi làm · {played}/{days.length} ngày trong bản này đã chơi
            </span>
          </div>
        </header>

        <section className="card mission stack" aria-label="Nhiệm vụ hiện tại">
          <span className="eyebrow">Nhiệm vụ hiện tại</span>
          <h2>
            Ngày {current.chapter}.{current.day}: {current.title}
          </h2>
          <div className="stars-row" aria-label={`${best?.stars ?? 0} trên 5 sao`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={n <= (best?.stars ?? 0) ? 'star on' : 'star'}>
                ★
              </span>
            ))}
          </div>
          {startTip && (
            <div className="mentor-quote row">
              <span className="avatar" aria-hidden>
                👩‍⚕️
              </span>
              <div>
                <b>{t(`mentor.${current.mentor}`)}</b>
                <p>“{startTip.text}”</p>
              </div>
            </div>
          )}
          <div className="goals">
            <b>🎯 Hôm nay có gì mới</b>
            {current.newThings.map((x) => (
              <span key={x} className="goal">
                {x}
              </span>
            ))}
          </div>
        </section>

        <button className="primary cta" onClick={() => openDay(current.id)}>
          ▶ VÀO CA TRỰC NGAY
        </button>

        <section className="card stack">
          <h3>Chiến dịch "Năm đầu đi làm"</h3>
          {CHAPTERS.map((name, chapter) => {
            const chapterDays = days.filter((d) => d.chapter === chapter);
            return (
              <div key={chapter} className="stack">
                <b>
                  Chương {chapter} · {name}
                </b>
                {chapterDays.length === 0 ? (
                  <span className="chip-locked">🔒 Sắp có</span>
                ) : (
                  chapterDays.map((d) => {
                    const r = save.days[d.id];
                    return (
                      <button key={d.id} className="day-btn row" onClick={() => openDay(d.id)}>
                        <span className="grow">
                          Ngày {d.chapter}.{d.day} · {d.title}
                        </span>
                        <span>{r ? `${r.stars}★` : '▶'}</span>
                      </button>
                    );
                  })
                )}
              </div>
            );
          })}
        </section>

        <section className="card stack">
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
        </section>

        <p className="muted">{t('disclaimer')}</p>
      </div>
      <nav className="bottombar" aria-label="Điều hướng">
        <button className="primary" onClick={() => openDay(current.id)}>
          🏥 Ca trực
        </button>
        <button onClick={() => go('codex')}>
          📖 Sổ tay {collected}/{totalCards}
        </button>
      </nav>
    </>
  );
}
