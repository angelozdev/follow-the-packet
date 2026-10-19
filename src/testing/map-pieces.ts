import { MAP_TEXT, nameTag, type EntityRef, type TermText } from '@/copy';
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
