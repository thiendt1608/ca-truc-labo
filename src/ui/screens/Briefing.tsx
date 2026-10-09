import { getContent } from '../../sim';
import { t } from '../../i18n';
import { secondsOfDayText, useGame } from '../../store/game';

/** S3 Bảng giao ca: hôm nay ở đâu, có gì mới. Nút "Vào ca" cố định ở đáy màn hình. */
export function Briefing() {
  const dayId = useGame((s) => s.dayId);
  const difficulty = useGame((s) => s.difficulty);
  const best = useGame((s) => s.save.days[dayId]);
  const { startShift, go } = useGame.getState();
  const content = getContent();
  const day = content.dayById.get(dayId)!;
  const startTip = day.tips.find((x) => x.trigger === 'start');
  const level = content.difficulty.levels[difficulty];
  const expected = day.waves.reduce((n, w) => n + w.count, 0);
  return (
    <div className="screen-with-footer" data-room={day.room}>
      <div className="screen">
        <div className="brief">
          <span className="eyebrow">Bảng giao ca</span>
          <h1>
            Ngày {day.chapter}.{day.day}
          </h1>
          <h2>{day.title}</h2>
          <div className="row wrap">
            <span className="dept-chip">🏥 {t(`room.${day.room}`)}</span>
            <span className="dept-chip neutral">
              🕖 {secondsOfDayText(day.start)} – {secondsOfDayText(day.end)}
            </span>
          </div>
          {startTip && (
            <div className="card mentor-quote row">
              <span className="avatar" aria-hidden>
                👩‍⚕️
              </span>
              <div>
                <b>{t(`mentor.${day.mentor}`)}</b>
                <p>“{startTip.text}”</p>
              </div>
            </div>
          )}
          <div className="card goals">
            <b>🎯 Hôm nay có gì mới</b>
            {day.newThings.map((x) => (
              <span key={x} className="goal">
                {x}
              </span>
            ))}
          </div>
          <div className="card stack summary">
            <b>📋 Tóm tắt ca</b>
            <span>🧪 Khoảng {expected} mẫu dự kiến (chưa kể mẫu lấy lại)</span>
            <span>
              🎚 Mức {level.name}: {level.note}
            </span>
            <span>⭐ Kỷ lục: {best ? `${best.stars}/5 sao · ${best.score} điểm` : 'chưa chơi ca này'}</span>
            <span>
              🐢 Mở thẻ mẫu, máy hoặc kết quả thì giờ chạy chậm ×
              {String(content.difficulty.workSheetClockFactor).replace('.', ',')}.
            </span>
          </div>
        </div>
      </div>
      <div className="bottombar">
        <button onClick={() => go('home')}>↩ Về sảnh</button>
        <button className="primary grow2" onClick={() => startShift()}>
          ▶ Vào ca
        </button>
      </div>
    </div>
  );
}
