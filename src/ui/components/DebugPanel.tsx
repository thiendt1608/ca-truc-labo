import { useState } from 'react';
import { useGame } from '../../store/game';

/** Bảng debug, chỉ hiện khi mở bằng ?debug=1 (07-TDD mục 11). */
export function DebugPanel() {
  const debug = useGame((s) => s.debug);
  const speed = useGame((s) => s.speed);
  const shift = useGame((s) => s.shift);
  const [open, setOpen] = useState(false);
  if (!debug.enabled || !shift) return null;
  const st = useGame.getState();

  const exportLog = async () => {
    const data = JSON.stringify(
      {
        dayId: shift.dayId,
        seed: shift.seed,
        difficulty: shift.difficulty,
        commands: useGame.getState().log,
      },
      null,
      1,
    );
    try {
      await navigator.clipboard.writeText(data);
      alert('Đã sao chép chuỗi lệnh vào bộ nhớ tạm.');
    } catch {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      a.download = `ca-${shift.dayId}-${shift.seed}.json`;
      a.click();
    }
  };

  return (
    <div className="debug">
      <button className="small" onClick={() => setOpen(!open)} aria-label="Bảng debug">
        🐞
      </button>
      {open && (
        <div className="panel card stack">
          <b>Debug · hạt giống {shift.seed}</b>
          <div className="row wrap">
            {[1, 2, 10].map((x) => (
              <button
                key={x}
                className={`small ${speed === x ? 'primary' : ''}`}
                onClick={() => st.setSpeed(x)}
              >
                ×{x}
              </button>
            ))}
          </div>
          <label className="row">
            <input
              type="checkbox"
              checked={debug.showHidden}
              onChange={(e) => st.setDebug({ showHidden: e.target.checked })}
            />
            Hiện lỗi ẩn của mẫu
          </label>
          <button
            className="small"
            onClick={() => {
              setOpen(false);
              st.dispatch({ type: 'debug/forceSpill' });
            }}
          >
            Gây đổ vỡ
          </button>
          <button
            className="small"
            onClick={() => {
              setOpen(false);
              st.dispatch({ type: 'debug/endShift' });
            }}
          >
            Kết thúc ca ngay
          </button>
          <button className="small" onClick={exportLog}>
            Xuất chuỗi lệnh
          </button>
        </div>
      )}
    </div>
  );
}
