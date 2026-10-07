import { getContent } from '../../sim';
import { t } from '../../i18n';
import { secondsOfDayText, useGame } from '../../store/game';

/** S3 Bảng giao ca: hôm nay ở đâu, có gì mới. */
export function Briefing() {
  const dayId = useGame((s) => s.dayId);
  const { startShift, go } = useGame.getState();
  const day = getContent().dayById.get(dayId)!;
  return (
    <div className="screen">
      <h1>
        Ngày {day.chapter}.{day.day}
      </h1>
      <h2>{day.title}</h2>
      <div className="card stack">
        <span>
          🏥 Phòng: <b>{t(`room.${day.room}`)}</b>
        </span>
        <span>
          🕖 Ca: {secondsOfDayText(day.start)} – {secondsOfDayText(day.end)}
        </span>
        <span>
          💬 Người hướng dẫn: <b>{t(`mentor.${day.mentor}`)}</b>
        </span>
      </div>
      <div className="card stack">
        <b>Hôm nay có gì mới</b>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {day.newThings.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
      <button className="primary" onClick={() => startShift()}>
        Vào ca
      </button>
      <button onClick={() => go('home')}>↩ Về sảnh</button>
    </div>
  );
}
