import type { FocusEventHandler, MouseEventHandler, PointerEventHandler } from 'react';

export interface TriggerProps {
  onPointerEnter?: PointerEventHandler<HTMLElement>;
  onPointerLeave?: PointerEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
  onBlur?: FocusEventHandler<HTMLElement>;
  onClick?: MouseEventHandler<HTMLElement>;
  'data-pinned'?: true;
}

export type InspectTrigger = (pieceId: string) => TriggerProps;
