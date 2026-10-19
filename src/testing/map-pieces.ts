import { vi } from 'vitest';
import { MAP_TEXT, nameTag, packetLabel, type EntityRef, type TermText, type Warning } from '@/copy';
import { reachesHost, simulate, type Network, type PacketSpec, type Trace } from '@/engine';
import { OFFICE_FLOORS } from './fixtures';

export type PieceEntity = Extract<EntityRef, { kind: 'device' | 'firewall' | 'edge' | 'internet' | 'actor' }>;

interface PieceFacts {
  id: string;
  anchorId: string;
  label: TermText;
  locked: boolean;
  state: 'normal' | 'intruded' | 'blocking';
  inOffice?: boolean;
  insideBlock?: true;
}

export type MapPieceFixture = PieceEntity & PieceFacts;

/** Takes the entity a piece of the map stands for (its kind and variant), the id of what it stands for in the world, its label and what the test changes of the rest; returns the piece as the game hands it to the map: its id is its kind and its anchor, and it starts unlocked and normal. */
export function mapPiece(entity: PieceEntity, anchorId: string, label: TermText, extras: Partial<PieceFacts> = {}): MapPieceFixture {
  return { ...entity, id: `${entity.kind}:${anchorId}`, anchorId, label, locked: false, state: 'normal', ...extras };
}

const { officeRouter, server } = OFFICE_FLOORS;

/** The pieces of the office with two floors that the labels of the map are tested with: four laptops (one under attack, one locked), the host firewall of the first laptop that blocks and is locked, the router of the office, the globe and the server of the internet. */
export const FLOORS_LABEL_PIECES: MapPieceFixture[] = [
  mapPiece({ kind: 'device', variant: 'laptop' }, 'your-laptop', nameTag('tu-laptop'), { state: 'intruded' }),
  mapPiece({ kind: 'device', variant: 'laptop' }, 'lucia-laptop', nameTag('laptop-lucia'), { locked: true }),
  mapPiece({ kind: 'device', variant: 'laptop' }, 'marta-laptop', nameTag('laptop-marta')),
  mapPiece({ kind: 'device', variant: 'laptop' }, 'andres-laptop', nameTag('laptop-andres')),
  { ...mapPiece({ kind: 'firewall', variant: 'host-firewall' }, 'your-firewall', MAP_TEXT.firewall['host-firewall']('tu-laptop')), anchorId: 'your-laptop', locked: true, state: 'blocking' },
  mapPiece({ kind: 'edge', variant: 'router' }, officeRouter.id, nameTag(officeRouter.id), { inOffice: true }),
  mapPiece({ kind: 'internet', variant: 'internet' }, 'internet', MAP_TEXT.internet),
  mapPiece({ kind: 'device', variant: 'internet-server' }, server.id, nameTag('servidor-internet')),
];

export interface MapRunFixture {
  id: string;
  pieceId: string;
  packet: PacketSpec;
  trace: Trace;
  label: TermText;
  hiddenStop: boolean;
  intruder: boolean;
  reached: boolean;
  replied: boolean;
  blocked: boolean;
  warning: Warning | null;
  send?: number;
}

function firewallDropped(trace: Trace): boolean {
  return trace.steps.some((step) => (step.stage === 'firewall-in' || step.stage === 'firewall-out') && step.verdict === 'drop');
}

/** Takes the world, the packet, the id of the run and what the test changes; returns the run of a packet as the game hands it to the scene: the trace the engine simulates, the label the packet wears, its piece id (`packet:` and its id), and the facts of its stamp as the trace gives them (it reached a host, was answered, was stopped by a firewall), with no warning, no hidden stop and no intruder. A sent run carries its `send` number in `extras`. */
export function mapRun(world: Network, packet: PacketSpec, id: string, extras: Partial<MapRunFixture> = {}): MapRunFixture {
  const trace = simulate(world, packet);
  return {
    id,
    pieceId: `packet:${id}`,
    packet,
    trace,
    label: packetLabel(packet, trace, world),
    hiddenStop: false,
    intruder: false,
    reached: reachesHost(trace),
    replied: trace.outcome === 'replied',
    blocked: firewallDropped(trace),
    warning: null,
    ...extras,
  };
}

/** Returns the props of a trigger, as the box of inspection gives them to a piece or a stamp, with a spy for each of its five handlers. */
export function triggerSpies() {
  return { onPointerEnter: vi.fn(), onPointerLeave: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onClick: vi.fn() };
}
