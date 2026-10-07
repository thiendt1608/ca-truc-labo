import { useMemo } from 'react';
import { MINIGAMES, type PlayerAction } from '../../sim';
import type { SpillInput } from '../../sim/minigames/spillCleanup';
import { useGame } from '../../store/game';
import { SequenceGame } from './SequenceGame';

/** S6 Mini-game toàn màn hình. Đồng hồ ca vẫn chạy (04-GDD mục 4). */
export function MinigameHost() {
  const mg = useGame((s) => s.shift?.minigame ?? null);
  const difficulty = useGame((s) => s.shift?.difficulty ?? 'normal');
  const dispatch = useGame((s) => s.dispatch);
  const input = useMemo(
    () => (mg ? MINIGAMES[mg.minigameId]!.generate(mg.seed, difficulty) : null),
    [mg, difficulty],
  );
  if (!mg || !input) return null;
  const spec = MINIGAMES[mg.minigameId]!;
  const finish = (actions: PlayerAction[]) => {
    setTimeout(() => dispatch({ type: 'minigameResult', taskId: mg.taskId, actions }), 400);
  };
  return (
    <div className="mg" role="dialog" aria-label={spec.title}>
      <div className="mg-head">
        <h2>🧽 {spec.title}</h2>
        <p className="muted">Một ống vỡ! Chạm các bước theo đúng thứ tự để dọn an toàn.</p>
      </div>
      <div className="mg-body">
        {spec.id === 'spillCleanup' && (
          <SequenceGame input={input as SpillInput} hint={difficulty === 'easy'} onDone={finish} />
        )}
      </div>
    </div>
  );
}
