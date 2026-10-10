import { Fragment } from 'react';
import { MAP_TEXT, parseTermText, type EntityRef, type TermSegment, type TermText } from '@/copy';
import { NameTag } from '@/design';
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

function isOnlyName(segments: TermSegment[]): boolean {
  return segments.every((segment) => segment.kind === 'name');
}

function buttonClass(segments: TermSegment[], locked: boolean): string {
  return ['map-button', isOnlyName(segments) && 'map-button--name', locked && 'map-button--locked'].filter(Boolean).join(' ');
}

export function PieceLabel({ piece, onInspect, onActivate }: { piece: MapPiece; onInspect: OnInspect; onActivate: (pieceId: string) => void }) {
  const segments = parseTermText(piece.label);
  return (
    <button
      type="button"
      id={pieceDomId(piece.id)}
      className={buttonClass(segments, piece.locked)}
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
      {segments.map((segment, index) =>
        segment.kind === 'name' ? (
          <NameTag key={index}>{segment.text}</NameTag>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
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
