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
  settings?: { id: string; label: TermText };
};

/** Returns the DOM id of a piece's label, so the focus can come back to it. */
export function pieceDomId(pieceId: string): string {
  return `piece-${pieceId.replaceAll(':', '-')}`;
}

function Segments({ segments }: { segments: TermSegment[] }) {
  return segments.map((segment, index) =>
    segment.kind === 'name' ? (
      <NameTag key={index}>{segment.text}</NameTag>
    ) : (
      <Fragment key={index}>{segment.text}</Fragment>
    ),
  );
}

function isOnlyName(segments: TermSegment[]): boolean {
  return segments.every((segment) => segment.kind === 'name');
}

function buttonClass(segments: TermSegment[], locked: boolean): string {
  return ['map-button', isOnlyName(segments) && 'map-button--name', locked && 'map-button--locked'].filter(Boolean).join(' ');
}

/** The label of a piece: a button that opens its card, with its name, its lock and its alert. A piece with a second entry, such as the settings card of a device, has a second button under it. */
export function PieceLabel({ piece, onInspect, onActivate }: { piece: MapPiece; onInspect: OnInspect; onActivate: (pieceId: string) => void }) {
  const segments = parseTermText(piece.label);
  const label = (
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
      <Segments segments={segments} />
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
  const { settings } = piece;
  if (!settings) return label;
  return (
    <div className="map-labels">
      {label}
      <button type="button" id={pieceDomId(settings.id)} className="map-button" onClick={() => onActivate(settings.id)}>
        <Segments segments={parseTermText(settings.label)} />
      </button>
    </div>
  );
}
