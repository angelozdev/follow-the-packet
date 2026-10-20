import type { PacketShape, PacketVariant } from '@/copy';
import { InkIcon } from './ink-icon';

const ROUND_SEGMENTS = 24;
const SQUARE_SEGMENTS = 4;
const HEXAGON_SEGMENTS = 6;
const SQUARE_TURN = Math.PI / 4;

/** How one packet is formed: a regular polygon of `sides` sides, turned `turn` radians, filled when it asks and a ring when it answers (`hollow`). A dot has 24 sides, TCP is a square and UDP a hexagon, so the shape says the protocol. */
export interface PacketShapeLook {
  sides: number;
  turn: number;
  hollow: boolean;
}

const DOT: Pick<PacketShapeLook, 'sides' | 'turn'> = { sides: ROUND_SEGMENTS, turn: 0 };
const SQUARE: Pick<PacketShapeLook, 'sides' | 'turn'> = { sides: SQUARE_SEGMENTS, turn: SQUARE_TURN };
const HEXAGON: Pick<PacketShapeLook, 'sides' | 'turn'> = { sides: HEXAGON_SEGMENTS, turn: 0 };

/** The shape of every packet that a sender sends or that answers it: ICMP is a dot, TCP a square and UDP a hexagon, each filled to ask and a ring to answer. */
export const PACKET_SHAPES: Record<PacketShape, PacketShapeLook> = {
  'echo-request': { ...DOT, hollow: false },
  'echo-reply': { ...DOT, hollow: true },
  'tcp-request': { ...SQUARE, hollow: false },
  'tcp-reply': { ...SQUARE, hollow: true },
  'udp-request': { ...HEXAGON, hollow: false },
  'udp-reply': { ...HEXAGON, hollow: true },
};

const PACKET_ICON_PATH: Record<'round' | 'square' | 'hexagon', { shape: string; border: string }> = {
  round: { shape: 'M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10z', border: 'M12 3.4a8.6 8.6 0 1 0 0 17.2a8.6 8.6 0 1 0 0-17.2z' },
  square: { shape: 'M7.5 7.5h9v9h-9z', border: 'M3.5 3.5h17v17h-17z' },
  hexagon: { shape: 'M6 12l3-5h6l3 5l-3 5H9z', border: 'M2.5 12l4.6-8.3h9.8l4.6 8.3l-4.6 8.3H7.1z' },
};
const PACKET_ICON_FORM: Record<PacketShape, keyof typeof PACKET_ICON_PATH> = {
  'echo-request': 'round',
  'echo-reply': 'round',
  'tcp-request': 'square',
  'tcp-reply': 'square',
  'udp-request': 'hexagon',
  'udp-reply': 'hexagon',
};
const WARNING_ICON_PATH = { triangle: 'M12 4.5l8.5 15h-17z', mark: 'M12 10v4.5M12 17.2h.01' } as const;

/** The packet's icon, the same shape as on the map: the shape of its protocol, filled for a packet that asks and hollow for one that answers, with a second border of the same shape around it for an intruder, and a triangle with an exclamation mark for a warning. */
export function PacketIcon({ message, intruder }: { message: PacketVariant; intruder: boolean }) {
  if (message === 'warning') {
    return (
      <InkIcon>
        <path d={WARNING_ICON_PATH.triangle} />
        <path d={WARNING_ICON_PATH.mark} />
      </InkIcon>
    );
  }
  const paths = PACKET_ICON_PATH[PACKET_ICON_FORM[message]];
  const asks = !PACKET_SHAPES[message].hollow;
  return (
    <InkIcon>
      <path d={paths.shape} fill={asks ? 'currentColor' : 'none'} strokeWidth={asks ? 1.6 : 2.6} />
      {intruder && <path d={paths.border} />}
    </InkIcon>
  );
}
