import { useState } from 'react';
import { getContent } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';
import { CodexCardView } from './Codex';

/** Màu thanh theo tiêu chí, lấy từ bảng màu khoa (DESIGN.md). */
const CRITERIA_COLOR = {
  accuracy: 'var(--info)',
  timeliness: 'var(--warn)',
  safety: 'var(--good)',
  skill: '#9b59b6',
} as const;

/** S10 Báo cáo giao ca: sao, 4 tiêu chí, "Chuyện hôm nay", Ngân sách. Nút chính cố định ở đáy. */
export function Report() {
  const report = useGame((s) => s.report);
  const shift = useGame((s) => s.shift);
  const { startShift, go, openDay } = useGame.getState();
  const [card, setCard] = useState<string | null>(null);
  if (!report || !shift) return null;
  const content = getContent();
  const nextDay = content.days[content.days.findIndex((d) => d.id === shift.dayId) + 1];
  const criteria = [
    ['accuracy', report.accuracy],
    ['timeliness', report.timeliness],
    ['safety', report.safety],
    ['skill', report.skill],
  ] as const;

  return (
    <div className="screen-with-footer">
      <div className="screen">
        <h1>Báo cáo giao ca</h1>
        {report.endReason === 'trust' && <div className="card">😔 {t('endReason.trust')}</div>}
        <div className="card stack">
          <div className="stars-row big" aria-label={`${report.stars} trên 5 sao`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={n <= report.stars ? 'star on' : 'star'}>
                ★
              </span>
            ))}
          </div>
          <div className="center">
            <b className="score">{report.total}/100</b>
            <div className="muted">
              {report.counts.samples} mẫu · {report.counts.mistakes} lỗi · 🚑 cấp cứu đúng hẹn{' '}
              {report.counts.statOnTime}
            </div>
          </div>
        </div>

        <div className="stack">
          {criteria.map(([key, value]) => (
            <div key={key} className="card crit-card stack">
              <div className="row">
                <b className="grow">{t(`criteria.${key}`)}</b>
                <b>{value}</b>
              </div>
              <div className="progress">
                <div style={{ width: `${value}%`, background: CRITERIA_COLOR[key] }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card row">
          <span className="grow">
            Ngân sách khoa <b>+{report.budget} điểm</b>
          </span>
          <span className="muted">Niềm tin cuối ca {Math.round(report.trust)}</span>
        </div>

        <div className="card stack">
          <h2>Chuyện hôm nay</h2>
          {report.stories.length === 0 ? (
            <p>Không có lỗi nào đáng kể. Chị Hạnh khen em làm tốt lắm! 🎉</p>
          ) : (
            report.stories.map((m, i) => (
              <div key={i} className="stack story">
                <span>
                  {m.trustDelta < 0 ? `🔻 ${m.trustDelta}` : '•'} {t(m.explanationKey)}
                </span>
                {m.codex && content.codexById.has(m.codex) && (
                  <button className="small" onClick={() => setCard(m.codex!)}>
                    📖 Sổ tay: {content.codexById.get(m.codex)!.title}
                  </button>
                )}
              </div>
            ))
          )}
          {card && <CodexCardView id={card} onClose={() => setCard(null)} />}
        </div>

        <div className="row wrap">
          <button className="grow" onClick={() => startShift(shift.seed)}>
            🔁 Chơi lại (cùng mẫu)
          </button>
          <button className="grow" onClick={() => startShift()}>
            🎲 Mẫu mới
          </button>
        </div>
      </div>
      <div className="bottombar">
        <button onClick={() => go('home')}>↩ Về sảnh</button>
        {nextDay && (
          <button className="primary grow2" onClick={() => openDay(nextDay.id)}>
            ▶ Ngày tiếp theo
          </button>
        )}
      </div>
    </div>
  );
}
