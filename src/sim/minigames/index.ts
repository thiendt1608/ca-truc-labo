import { holdTimer } from './holdTimer';
import { spillCleanup } from './spillCleanup';
import { urineStrip } from './urineStrip';
import type { MinigameSpec } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MINIGAMES: Record<string, MinigameSpec<any>> = {
  [spillCleanup.id]: spillCleanup,
  [holdTimer.id]: holdTimer,
  [urineStrip.id]: urineStrip,
};

export { holdTimer, spillCleanup, urineStrip };
export type { MinigameSpec } from './types';
