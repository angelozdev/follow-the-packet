import { useInterval } from '@mantine/hooks';
import type { SessionAction } from '@/game';

export const TICK_MS = 100;

/** Sends a tick to the session every TICK_MS; the session ignores ticks once the incident is closed. */
export function useStabilityClock(dispatch: (action: SessionAction) => void): void {
  useInterval(() => dispatch({ type: 'tick', ms: TICK_MS }), TICK_MS, { autoInvoke: true });
}
