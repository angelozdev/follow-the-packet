import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom';
import { useMergedRef } from '@mantine/hooks';
import type { MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TERMS, type TermId } from '@/copy';
import { useFloatingBox } from './use-floating-box';

const GAP_PX = 6;
const WINDOW_MARGIN_PX = 8;
const SCOPE = 'term';
const CLICKABLE = 'button, a';

/** Renders a term with a dotted underline. While the mouse is on it, or it is pinned, its definition floats in a tooltip drawn in document.body, over every clipping box. The pointer can move onto the definition, and a click or a tap on the term pins it (not inside a button or a link, whose click is its own) until Escape or a pointerdown outside the term and the definition. It is not a Tab stop. */
export function TermTip({ id, children }: { id: TermId; children: ReactNode }) {
  const box = useFloatingBox<TermId>(SCOPE);
  const open = box.shown !== null;
  const { refs, floatingStyles } = useFloating({
    open,
    placement: 'top',
    strategy: 'fixed',
    middleware: [offset(GAP_PX), flip({ padding: WINDOW_MARGIN_PX }), shift({ padding: WINDOW_MARGIN_PX })],
    whileElementsMounted: autoUpdate,
  });
  const tipRef = useMergedRef(refs.setFloating, box.box.ref);
  const trigger = box.trigger(id);
  const pin = (event: MouseEvent<HTMLElement>) => {
    if (event.currentTarget.closest(CLICKABLE) === null) trigger.onClick(event);
  };
  return (
    <span ref={refs.setReference} className="term term--tip" {...trigger} onClick={pin}>
      {children}
      {open &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            className="term-tip"
            style={floatingStyles}
            onPointerEnter={box.box.onPointerEnter}
            onPointerLeave={box.box.onPointerLeave}
            onClick={(event) => event.stopPropagation()}
          >
            <strong>{TERMS[id].name}</strong>: {TERMS[id].definition}
          </span>,
          document.body,
        )}
    </span>
  );
}
