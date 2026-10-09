import { useState } from 'react';
import { getContent } from '../../sim';
import { t } from '../../i18n';
import { useGame } from '../../store/game';
import { InstallInfo } from '../components/PwaNotices';
import { CodexCardView } from '../components/CodexCardView';

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
  const installHint = useGame((s) => s.installHint);
  const shift = useGame((s) => s.shift);
  const { startShift, go, openDay, openSettings } = useGame.getState();
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
            report.stories.map((m) => (
              <div key={`${m.kind}|${m.explanationKey}`} className="stack story">
                <span>
                  {m.trustDelta < 0 ? `🔻 ${m.trustDelta}` : '•'} {t(m.explanationKey)}
                  {m.count > 1 && <b> ×{m.count}</b>}
                </span>
                {m.count === 1 && m.details[0] && <span className="muted">{m.details[0]}</span>}
                {m.count > 1 && m.details.length > 0 && (
                  <details className="story-more">
                    <summary>Chi tiết {m.count} lần</summary>
                    <ul className="muted notes">
                      {m.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </details>
                )}
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

        {installHint && (
          <section className="card stack" aria-label="Giữ tiến trình an toàn">
            <h3>📲 Giữ tiến trình an toàn</h3>
            <p>
              Tiến trình chỉ lưu trên trình duyệt này và có thể mất nếu xóa dữ liệu duyệt web. Thêm game vào
              màn hình chính và xuất mã lưu để cất riêng.
            </p>
            <InstallInfo />
            <button onClick={() => openSettings('home')}>Xuất mã lưu</button>
          </section>
        )}

        <div className="report-actions">
          <button onClick={() => startShift(shift.seed)} aria-label="Chơi lại với cùng mẫu">
            🔁 Cùng mẫu
          </button>
          <button onClick={() => startShift()}>🎲 Mẫu mới</button>
        </div>
      </div>
      <div className="bottombar">
        <button onClick={() => go('home')}>↩ Về sảnh</button>
        {nextDay && (
          <button className="primary grow2" onClick={() => openDay(nextDay.id)}>
            ▶ Ngày tiếp
          </button>
        )}
      </div>
    </div>
  );
}
