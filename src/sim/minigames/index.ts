import { holdTimer } from './holdTimer';
import { spillCleanup } from './spillCleanup';
import type { MinigameSpec } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MINIGAMES: Record<string, MinigameSpec<any>> = {
  [spillCleanup.id]: spillCleanup,
  [holdTimer.id]: holdTimer,
};

export { holdTimer, spillCleanup };
export type { MinigameSpec } from './types';
