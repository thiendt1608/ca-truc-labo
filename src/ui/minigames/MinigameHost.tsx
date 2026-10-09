import { useMemo } from 'react';
import { MINIGAMES, type HelpContext, type PlayerAction } from '../../sim';
import type { SpillInput } from '../../sim/minigames/spillCleanup';
import { useGame, useHints } from '../../store/game';
import { CodexHelp } from '../components/CodexHelp';
import type { UrineInput } from '../../sim/minigames/urineStrip';
import type { DilutionInput } from '../../sim/minigames/dilution';
import { MeasureGame } from './MeasureGame';
import { SequenceGame } from './SequenceGame';
import { UrineStripGame } from './UrineStripGame';

const INTRO: Record<string, { icon: string; text: string }> = {
  spillCleanup: { icon: '🧽', text: 'Một ống vỡ! Chạm các bước theo đúng thứ tự để dọn an toàn.' },
  urineStrip: { icon: '🧪', text: 'Chọn mức khớp bảng màu cho từng ô, đúng thời điểm đọc.' },
  dilution: { icon: '💧', text: 'Chọn tỉ lệ pha loãng nhỏ nhất đưa kết quả vào dải đo, rồi nhân lại hệ số.' },
};

/** S6 Mini-game toàn màn hình. Đồng hồ ca vẫn chạy (04-GDD mục 4). */
export function MinigameHost() {
  const mg = useGame((s) => s.shift?.minigame ?? null);
  const difficulty = useGame((s) => s.shift?.difficulty ?? 'normal');
  const hints = useHints();
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
    <div className="mg" role="dialog" aria-label={spec.title} onContextMenu={(e) => e.preventDefault()}>
      <div className="mg-head row">
        <div className="grow">
          <span className="eyebrow">Thao tác kỹ thuật</span>
          <h2>
            {INTRO[spec.id]?.icon} {spec.title}
          </h2>
          <p className="muted">
            {mg.context === 'spill' && mg.sampleId
              ? 'Lọ rò rỉ! Chạm các bước theo đúng thứ tự để dọn an toàn sinh học.'
              : INTRO[spec.id]?.text}
          </p>
        </div>
        <CodexHelp context={spec.id as HelpContext} />
      </div>
      <div className="mg-body">
        {spec.id === 'dilution' && (
          <MeasureGame input={input as DilutionInput} hint={hints} onDone={finish} />
        )}
        {spec.id === 'urineStrip' && <UrineStripGame input={input as UrineInput} onDone={finish} />}
        {spec.id === 'spillCleanup' && (
          <SequenceGame input={input as SpillInput} hint={hints} onDone={finish} />
        )}
      </div>
    </div>
  );
}
