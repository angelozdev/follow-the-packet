import { useState } from 'react';
import { TERMINAL_TEXT, type TermText } from '@/copy';
import { Button, ChipTray } from '@/design';
import type { SendPicks, SendTrayName, TerminalCard as Terminal, ToolOutput, TracerouteView } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { FramedCard, trayChips, type CardFrame } from '@/ui/incident/map-cards/chip-card';
import { OutputCard, type Printed } from './output-card';

/** What the terminal asks of its screen: the line the picks make, what a traceroute, an `nc` or a `dig` sent with them printed, moving the card to another origin and sending. */
export interface TerminalHandlers {
  describe: (picks: Partial<SendPicks>) => TermText | null;
  route: (picks: Partial<SendPicks>) => TracerouteView | null;
  printed?: (picks: Partial<SendPicks>) => ToolOutput | null;
  onPickOrigin: (fromId: string) => void;
  onSend: (picks: SendPicks) => void;
}

/** What the player has half done in a terminal: the chips picked and whether the output of a `dig` is unfolded. It lives above the card, so a card that shows the terminal as one tab among others keeps it when the player switches tabs. */
export interface TerminalDraft {
  picks: Partial<SendPicks>;
  unfolded: boolean;
  setPicks: (picks: Partial<SendPicks>) => void;
  setUnfolded: (unfolded: boolean) => void;
}

export function useTerminalDraft(card: Terminal | null): TerminalDraft {
  const [picks, setPicks] = useState<Partial<SendPicks>>(card?.fixed ?? {});
  const [unfolded, setUnfolded] = useState(false);
  return { picks, unfolded, setPicks, setUnfolded };
}

function printedBy(route: TracerouteView | null, tool: ToolOutput | null): Printed | null {
  if (route) return { kind: 'route', route };
  return tool ? { kind: 'tool', tool } : null;
}

/** Returns what the terminal of an origin puts in its card: a chip from each tray it shows, the line those chips make (the real command, or a packet made by hand), "Enviar" and, once a traceroute, an `nc` or a `dig` was sent with those chips, what it printed. Picking another origin moves the card beside it; the other picks stay. The draft is the caller's: whether the output of a `dig` is unfolded goes back to folded when another chip is picked. */
export function terminalFrame(card: Terminal, draft: TerminalDraft, { describe, route, printed, onPickOrigin, onSend }: TerminalHandlers): CardFrame {
  const chosen: Partial<SendPicks> = { ...card.fixed, ...draft.picks, from: card.fromId };
  const line = describe(chosen);
  const output = printedBy(route(chosen), printed?.(chosen) ?? null);
  const pick = (tray: SendTrayName, chipId: string) => {
    if (tray === 'from') onPickOrigin(chipId);
    else {
      draft.setPicks({ ...draft.picks, [tray]: chipId });
      draft.setUnfolded(false);
    }
  };
  const send = () => {
    if (chosen.to && chosen.message) onSend({ from: card.fromId, to: chosen.to, message: chosen.message });
  };
  return {
    title: card.title,
    icon: <CardIcon kind="terminal" />,
    actions: (
      <Button variant="primary" disabled={!line} onClick={send}>
        {TERMINAL_TEXT.send}
      </Button>
    ),
    body: (
      <>
        <p className="slot" aria-live="polite">
          {line ? (
            <code>
              <TaggedText text={line} />
            </code>
          ) : (
            <span className="slot__empty">{TERMINAL_TEXT.incomplete}</span>
          )}
        </p>
        {output && <OutputCard printed={output} unfolded={draft.unfolded} onToggle={() => draft.setUnfolded(!draft.unfolded)} />}
        {card.trays.map((tray) => (
          <ChipTray key={tray.name} name={TERMINAL_TEXT.trays[tray.name]} chips={trayChips(tray.chips)} picked={chosen[tray.name] ?? null} onPick={(chipId) => pick(tray.name, chipId)} />
        ))}
      </>
    ),
  };
}

interface TerminalCardProps extends TerminalHandlers {
  card: Terminal;
  draft?: TerminalDraft;
  onClose: () => void;
}

/** The terminal of an origin as a card of its own, for a piece whose only card it is. It keeps its own draft unless the caller gives one, which a screen does to keep what was picked when the card moves to the piece of another origin that shows its terminal in tabs. */
export function TerminalCard({ card, draft, onClose, ...handlers }: TerminalCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const own = useTerminalDraft(card);
  return <FramedCard frame={terminalFrame(card, draft ?? own, handlers)} heading={heading} onClose={onClose} />;
}
