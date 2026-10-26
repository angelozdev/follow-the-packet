import { Fragment } from 'react';
import { MAP_TEXT, parseTermText, toPlainText, type EntityRef, type Role, type TermSegment, type TermText } from '@/copy';
import { NameTag } from '@/design';
import { InkIcon } from '@/scene/entities/icons/ink-icon';
import { labelFitting } from '@/scene/layout/label-cut';
import type { TriggerProps } from './inspect-trigger';

export type MapPieceKind = 'device' | 'firewall' | 'edge' | 'internet' | 'actor';

export type MapPiece = Extract<EntityRef, { kind: MapPieceKind }> & {
  id: string;
  anchorId: string;
  label: TermText;
  locked: boolean;
  state: 'normal' | 'intruded' | 'blocking';
  inOffice?: boolean;
  insideBlock?: true;
  roles?: readonly Role[];
  role?: Role;
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

/** The label of a piece: one button that opens its card, whatever the number of cards the piece has, with its name, its lock and its alert; a piece with roles also holds a description, hidden from sight, that the button points to with `aria-describedby` and that lists every role in words, so the roles are never part of the accessible name; the props of its trigger inspect the piece (its click goes with the one that opens the card). Given the width of the box the layout holds for it (`boxWidth`), a label of one line whose text does not fit it shows the first characters and an ellipsis, hidden from screen readers, and the button is read by the whole text, so its accessible name never changes. */
export function PieceLabel({ piece, boxWidth, trigger, onActivate }: { piece: MapPiece; boxWidth?: number; trigger: TriggerProps; onActivate: (pieceId: string) => void }) {
  const shown = boxWidth === undefined ? piece.label : labelFitting(piece.label, { locked: piece.locked, alert: piece.state === 'intruded' }, boxWidth);
  const segments = parseTermText(shown);
  const isCut = shown !== piece.label;
  const rolesId = `${pieceDomId(piece.id)}-roles`;
  return (
    <>
      <button
        type="button"
        id={pieceDomId(piece.id)}
        aria-describedby={piece.roles && rolesId}
        className={buttonClass(segments, piece.locked)}
        {...trigger}
        onClick={(event) => {
          trigger.onClick?.(event);
          onActivate(piece.id);
        }}
      >
        {piece.state === 'intruded' && (
          <>
            <span className="map-button__alert" aria-hidden="true">
              !
            </span>{' '}
          </>
        )}
        {isCut ? (
          <>
            <span aria-hidden="true">
              <Segments segments={segments} />
            </span>
            <span className="sr-only">{toPlainText(piece.label)}</span>
          </>
        ) : (
          <Segments segments={segments} />
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
      {piece.roles && (
        <span id={rolesId} className="sr-only">
          {toPlainText(MAP_TEXT.roles(piece.roles))}
        </span>
      )}
    </>
  );
}
