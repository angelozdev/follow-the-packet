import type { EntityRef } from '@/copy';
import type { MapPiece, MapPieceKind } from '@/scene/overlay/piece-label';
import { ActorPiece } from '@/scene/entities/actor';
import { DevicePiece } from '@/scene/entities/device';
import { EdgePiece } from '@/scene/entities/edge';
import { FirewallPiece } from '@/scene/entities/firewall';
import { InternetPiece } from '@/scene/entities/internet';
import type { Box } from '@/scene/layout/arrange/geometry';

/** What a piece of the map is drawn as: its kind and variant and the state the game gives it. */
export type PieceLook = Extract<EntityRef, { kind: MapPieceKind }> & Pick<MapPiece, 'state'> & { id?: string };

interface PieceDrawing {
  piece: PieceLook;
  box: Box;
  selected: boolean;
  still: boolean;
}

function Shape({ piece, box, selected, still }: PieceDrawing) {
  switch (piece.kind) {
    case 'device':
      return <DevicePiece box={box} variant={piece.variant} selected={selected} intruded={piece.state === 'intruded'} still={still} />;
    case 'firewall':
      return <FirewallPiece box={box} variant={piece.variant} selected={selected} blocking={piece.state === 'blocking'} still={still} />;
    case 'edge':
      return <EdgePiece box={box} variant={piece.variant} />;
    case 'internet':
      return <InternetPiece box={box} />;
    case 'actor':
      return <ActorPiece box={box} variant={piece.variant} />;
  }
}

/** Takes a piece of the map, the box the layout holds for it, whether its card is open and whether animations are off; returns the piece drawn in that box, marked with its kind and variant (and its id, when it has one). */
export function PieceShape(drawing: PieceDrawing) {
  const { piece } = drawing;
  return (
    <g className="map-piece" aria-hidden="true" data-piece={piece.id} data-kind={piece.kind} data-variant={piece.variant}>
      <Shape {...drawing} />
    </g>
  );
}

/** Takes the pieces of the map, the boxes of the layout by piece id, the id of the piece whose card is open and whether animations are off; returns every piece the layout holds a box for, in the order they come, the active one selected. */
export function Pieces({ pieces, icons, activePieceId, still }: { pieces: readonly (PieceLook & { id: string })[]; icons: Readonly<Record<string, Box>>; activePieceId: string | null; still: boolean }) {
  return (
    <g>
      {pieces.map((piece) => {
        const box = icons[piece.id];
        return box === undefined ? null : <PieceShape key={piece.id} piece={piece} box={box} selected={piece.id === activePieceId} still={still} />;
      })}
    </g>
  );
}
