import { useEffect } from 'react';
import { useGame } from '../store/game';
import { useGameLoop } from '../store/loop';
import { Home } from './screens/Home';
import { LazyBriefing, LazyCodex, LazyReport, LazySettings, preloadLazy, ScreenSuspense } from './lazy';
import { Room } from './screens/Room';

export function App() {
  const screen = useGame((s) => s.screen);
  const room = useGame((s) => s.shift?.room);
  const reducedMotion = useGame((s) => s.save.settings.reducedMotion);
  useGameLoop();
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [reducedMotion]);
  useEffect(() => {
    void useGame.getState().init();
    preloadLazy();
  }, []);
  return (
    <div className="app" data-room={screen === 'room' || screen === 'report' ? room : 'reception'}>
      {screen === 'home' && <Home />}
      {screen === 'room' && <Room />}
      <ScreenSuspense>
        {screen === 'briefing' && <LazyBriefing />}
        {screen === 'report' && <LazyReport />}
        {screen === 'codex' && <LazyCodex />}
        {screen === 'settings' && <LazySettings />}
      </ScreenSuspense>
    </div>
  );
}
