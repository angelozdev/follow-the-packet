import { MAP_TEXT, toPlainText, type TermText } from '@/copy';
import { inspectHandlers, type OnInspect } from './inspect-handlers';

export type MapPieceKind = 'server' | 'barrier' | 'actor' | 'gateway';

export interface MapPiece {
  id: string;
  kind: MapPieceKind;
  anchorId: string;
  label: TermText;
  locked: boolean;
}

/** Returns the DOM id of a piece's label, so the focus can come back to it. */
export function pieceDomId(pieceId: string): string {
  return `piece-${pieceId.replaceAll(':', '-')}`;
}

export function PieceLabel({ piece, onInspect, onActivate }: { piece: MapPiece; onInspect: OnInspect; onActivate: (pieceId: string) => void }) {
  return (
    <button
      type="button"
      id={pieceDomId(piece.id)}
      className={piece.locked ? 'map-button map-button--locked' : 'map-button'}
      onClick={() => onActivate(piece.id)}
      {...inspectHandlers(piece.id, onInspect)}
    >
      {toPlainText(piece.label)}
      {piece.locked && (
        <>
          {' '}
          <span aria-hidden="true">🔒</span>
          {' '}
          <span className="sr-only">{MAP_TEXT.locked}</span>
        </>
      )}
    </button>
  );
}
