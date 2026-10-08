import { useEffect } from 'react';
import { useGame } from '../store/game';
import { useGameLoop } from '../store/loop';
import { Briefing } from './screens/Briefing';
import { Codex } from './screens/Codex';
import { Home } from './screens/Home';
import { Report } from './screens/Report';
import { Room } from './screens/Room';

export function App() {
  const screen = useGame((s) => s.screen);
  const room = useGame((s) => s.shift?.room);
  useGameLoop();
  useEffect(() => {
    void useGame.getState().init();
  }, []);
  return (
    <div className="app" data-room={screen === 'room' || screen === 'report' ? room : 'reception'}>
      {screen === 'home' && <Home />}
      {screen === 'briefing' && <Briefing />}
      {screen === 'room' && <Room />}
      {screen === 'report' && <Report />}
      {screen === 'codex' && <Codex />}
    </div>
  );
}
