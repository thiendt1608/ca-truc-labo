import { useEffect } from 'react';
import { useGame } from './game';

/**
 * Vòng lặp khung hình: gọi tickReal theo requestAnimationFrame.
 * Lõi tự gộp thời gian thành bước 1 giây game (fixed timestep). Ẩn tab → tạm dừng.
 */
export function useGameLoop() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(250, now - last);
      last = now;
      useGame.getState().tickReal(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const onVisibility = () => {
      if (document.hidden && useGame.getState().screen === 'room') useGame.getState().setPaused(true);
      last = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
