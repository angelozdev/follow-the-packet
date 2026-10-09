import { MAP_TEXT, toPlainText, type EntityRef, type TermText } from '@/copy';
import { InkIcon } from '@/scene/ink';
import { inspectHandlers, type OnInspect } from './inspect-handlers';

export type MapPieceKind = 'device' | 'firewall' | 'edge' | 'internet' | 'actor';

export type MapPiece = Extract<EntityRef, { kind: MapPieceKind }> & {
  id: string;
  anchorId: string;
  label: TermText;
  locked: boolean;
  state: 'normal' | 'intruded' | 'blocking';
};

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
      {piece.state === 'intruded' && (
        <>
          <span className="map-button__alert" aria-hidden="true">
            !
          </span>{' '}
        </>
      )}
      {toPlainText(piece.label)}
      {piece.locked && (
        <>
          {' '}
          <span className="map-button__lock">
            <InkIcon>
              <rect x="5" y="11" width="14" height="10" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </InkIcon>
          </span>
          {' '}
          <span className="sr-only">{MAP_TEXT.locked}</span>
        </>
      )}
      {piece.state === 'intruded' && (
        <>
          {' '}
          <span className="sr-only">{MAP_TEXT.alert}</span>
        </>
      )}
    </button>
  );
}
