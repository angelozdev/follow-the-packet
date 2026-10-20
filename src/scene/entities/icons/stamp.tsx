import type { StampState } from '@/copy';
import { InkIcon } from './ink-icon';

const CHECK = 'M8 12.5l2.5 2.5L16 9.5';
const STAMP_ICON: Record<StampState, { mark: string; dashed: boolean; double: boolean }> = {
  arrived: { mark: CHECK, dashed: false, double: false },
  blocked: { mark: 'M9 9l6 6M15 9l-6 6', dashed: false, double: false },
  lost: { mark: 'M9.8 9.5a2.3 2.3 0 1 1 3.3 2.1c-.7.4-1.1.9-1.1 1.6v.6M12 17h.01', dashed: true, double: false },
  intruder: { mark: CHECK, dashed: false, double: true },
  warned: { mark: 'M12 7.5v6M12 17h.01', dashed: false, double: false },
};

/** The stamp's icon: its ring and its mark, dashed when the packet is lost and doubled for an intruder. */
export function StampIcon({ state }: { state: StampState }) {
  const { mark, dashed, double } = STAMP_ICON[state];
  return (
    <InkIcon>
      <circle cx="12" cy="12" r="9" strokeDasharray={dashed ? '3 2.4' : undefined} />
      {double && <circle cx="12" cy="12" r="6.6" />}
      <path d={mark} />
    </InkIcon>
  );
}
