import type { Dispatch, RefObject } from 'react';
import { panelOf, type Inspection, type Session, type SessionAction } from '@/game';
import { InspectionBox } from '@/ui/incident/inspection-box';
import { InspectHelp } from '@/ui/shell/inspect-help';
import { frameOfPart } from './frame-of-part';
import { panelHandlers } from './panel-handlers';
import { PiecePanel } from './piece-panel';
import { usePanelChoice, type PanelChoice } from './use-panel-choice';
import { usePanelDrafts } from './use-panel-drafts';

interface ShellPanelProps {
  session: Session;
  dispatch: Dispatch<SessionAction>;
  inspection: Inspection | null;
  pieceId: string | null;
  heading: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
  onChoose: (pieceId: string) => void;
  choice?: PanelChoice;
  markedSend?: number;
}

/** Takes the session, what the player chose (its inspection, null when nothing is chosen, and the id of the piece when it is a piece and not a packet or a list of stamps), the ref of the heading of the panel, what «Cerrar» and «Listo» do and how the screen chooses another piece, and returns the panel of the column. It is always on the screen, so the drafts and the choice of tab and ficha live here and outlive the piece chosen: nothing chosen is the help, a packet or a list of stamps is its box with «Cerrar», and a piece is its panel with the tabs it has. Picking another origin in the terminal chooses the piece of that origin and keeps the terminal in front. The choice of tab and ficha is the panel's own unless the screen gives its own (`choice`), which is how «Ver fila en la tabla de rutas» sets them from outside; `markedSend` is the send whose row the table of routes marks, and the last packet's when it is not given. */
export function ShellPanel({ session, dispatch, inspection, pieceId, heading, onClose, onChoose, choice: given, markedSend }: ShellPanelProps) {
  const drafts = usePanelDrafts();
  const own = usePanelChoice();
  const choice = given ?? own;
  if (inspection === null) return <InspectHelp />;
  if (pieceId === null) return <InspectionBox inspection={inspection} pinned heading={heading} onClose={onClose} />;
  const panel = panelOf(session, pieceId, markedSend);
  const terminal = panel.tabs.find(({ id }) => id === 'terminal')?.parts[0];
  const origins = terminal?.id === 'terminal' ? terminal.card.origins : undefined;
  const handlers = panelHandlers(session, dispatch, (fromId) => {
    const target = origins?.[fromId];
    if (target === undefined) return;
    choice.chooseTab(target, 'terminal');
    onChoose(target);
  });
  const refocus = () => heading.current?.focus();
  return <PiecePanel panel={panel} inspection={inspection} heading={heading} choice={choice} frameOf={(part) => frameOfPart(part, { handlers, drafts, onClose, refocus })} onClose={onClose} />;
}
