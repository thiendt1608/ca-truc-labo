import { getContent } from '../../sim';
import { t } from '../../i18n';
import { secondsOfDayText, useGame } from '../../store/game';

/** S3 Bảng giao ca: hôm nay ở đâu, có gì mới. Nút "Vào ca" cố định ở đáy màn hình. */
export function Briefing() {
  const dayId = useGame((s) => s.dayId);
  const { startShift, go } = useGame.getState();
  const day = getContent().dayById.get(dayId)!;
  const startTip = day.tips.find((x) => x.trigger === 'start');
  return (
    <div className="screen-with-footer" data-room={day.room}>
      <div className="screen">
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
