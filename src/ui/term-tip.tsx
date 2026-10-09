import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom';
import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TERMS, type TermId } from '@/copy';

const GAP_PX = 6;
const WINDOW_MARGIN_PX = 8;

/** Renders a term with a dotted underline; while the mouse is on it, its definition floats in a tooltip drawn in document.body, over every clipping box. It is not a Tab stop. */
export function TermTip({ id, children }: { id: TermId; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open,
    placement: 'top',
    strategy: 'fixed',
    middleware: [offset(GAP_PX), flip({ padding: WINDOW_MARGIN_PX }), shift({ padding: WINDOW_MARGIN_PX })],
    whileElementsMounted: autoUpdate,
  });
  return (
    <span ref={refs.setReference} className="term term--tip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      {open &&
        createPortal(
          <span ref={refs.setFloating} role="tooltip" className="term-tip" style={floatingStyles}>
            <strong>{TERMS[id].name}</strong>: {TERMS[id].definition}
          </span>,
          document.body,
        )}
    </span>
  );
}
