import { useState } from 'react';
import { getContent } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';
import { CodexCardView } from './Codex';

/** S10 Báo cáo giao ca: sao, 4 tiêu chí, "Chuyện hôm nay", Ngân sách. */
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
    <div className="screen">
      <h1>Báo cáo giao ca</h1>
      {report.endReason === 'trust' && <div className="card">😔 {t('endReason.trust')}</div>}
      <div className="card stack">
        <div className="stars" aria-label={`${report.stars} sao`}>
          {'⭐'.repeat(report.stars)}
          <span style={{ opacity: 0.25 }}>{'⭐'.repeat(5 - report.stars)}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <b style={{ fontSize: 22 }}>{report.total}/100</b>
          <div className="muted">
            {report.counts.samples} mẫu · {report.counts.mistakes} lỗi · 🚑 cấp cứu đúng hẹn{' '}
            {report.counts.statOnTime}
          </div>
        </div>
        {criteria.map(([key, value]) => (
          <div key={key} className="crit-row">
            <span>{t(`criteria.${key}`)}</span>
            <div className="progress">
              <div style={{ width: `${value}%` }} />
            </div>
            <b>{value}</b>
          </div>
        ))}
        <span className="muted">
          Ngân sách khoa +{report.budget} điểm · Niềm tin cuối ca {Math.round(report.trust)}
        </span>
      </div>

      <div className="card stack">
        <h2>Chuyện hôm nay</h2>
        {report.stories.length === 0 ? (
          <p>Không có lỗi nào đáng kể. Chị Hạnh khen em làm tốt lắm! 🎉</p>
        ) : (
          report.stories.map((m, i) => (
            <div
              key={i}
              className="stack"
              style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}
            >
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

      <button onClick={() => startShift(shift.seed)}>🔁 Chơi lại ca này (cùng mẫu)</button>
      <button onClick={() => startShift()}>🎲 Chơi lại với mẫu mới</button>
      {nextDay && (
        <button className="primary" onClick={() => openDay(nextDay.id)}>
          ▶ Ngày tiếp theo: {nextDay.title}
        </button>
      )}
      <button onClick={() => go('home')}>↩ Về sảnh</button>
    </div>
  );
}
