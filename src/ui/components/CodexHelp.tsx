import { getContent, type HelpContext } from '../../sim';
import { useGame } from '../../store/game';
import { CodexCardView } from './CodexCardView';

/**
 * Nút "?" (04-GDD mục 12): mở thẻ Sổ tay liên quan nhất tới màn đang xem (map ở content/codex/help.json).
 * Thẻ chưa mở thì hiện "mở khi ...". Thẻ nằm chồng lên màn hiện tại và dừng giờ, đóng lại là về đúng chỗ cũ.
 */
export function CodexHelp({ context }: { context: HelpContext }) {
  if (!getContent().codexHelp[context]) return null;
  return (
    <button
      className="small help-btn"
      aria-label="Mở thẻ Sổ tay liên quan"
      onClick={() => useGame.getState().openHelp(context)}
    >
      ?
    </button>
  );
}

/** Nơi hiện thẻ do nút "?" mở; đặt một lần ở phòng làm việc, trên cả lớp phủ và mini-game. */
export function HelpHost() {
  const help = useGame((s) => s.help);
  if (!help) return null;
  return <CodexCardView id={help} onClose={() => useGame.getState().closeHelp()} />;
}
