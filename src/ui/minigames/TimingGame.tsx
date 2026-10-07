import { useEffect, useRef, useState } from 'react';
import type { HoldInput } from '../../sim/minigames/holdTimer';

/** Khung "giữ đúng thời gian": nhấn giữ nút, thả tay khi thanh nằm trong vùng xanh. */
export function TimingGame({
  input,
  label,
  onPress,
  onRelease,
}: {
  input: HoldInput;
  label: string;
  onPress: () => void;
  onRelease: (fraction: number) => void;
}) {
  const [fraction, setFraction] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const down = () => {
    if (start.current !== null) return;
    start.current = performance.now();
    onPress();
    const loop = () => {
      if (start.current === null) return;
      setFraction(Math.min(1.2, (performance.now() - start.current) / input.fillMs));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };
  const up = () => {
    if (start.current === null) return;
    const f = (performance.now() - start.current) / input.fillMs;
    start.current = null;
    cancelAnimationFrame(raf.current);
    setFraction(0);
    onRelease(f);
  };

  const [lo, hi] = input.zone;
  return (
    <div className="stack">
      <div className="holdbar" aria-hidden>
        <div className="zone" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
        <div className="fill" style={{ width: `${Math.min(100, fraction * 100)}%` }} />
      </div>
      <button
        className="holdbtn primary"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          down();
        }}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && down()}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && up()}
      >
        {label}
      </button>
    </div>
  );
}
