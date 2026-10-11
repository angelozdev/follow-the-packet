import { useState } from 'react';
import { TERMINAL_TEXT, type TermText } from '@/copy';
import { Button, ChipTray } from '@/design';
import type { SendPicks, SendTrayName, TerminalCard as Terminal, ToolOutput, TracerouteView } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { ChipCard, trayChips } from '@/ui/incident/map-cards/chip-card';
import { OutputCard, type Printed } from './output-card';

interface TerminalCardProps {
  card: Terminal;
  describe: (picks: Partial<SendPicks>) => TermText | null;
  route: (picks: Partial<SendPicks>) => TracerouteView | null;
  printed?: (picks: Partial<SendPicks>) => ToolOutput | null;
  onPickOrigin: (fromId: string) => void;
  onSend: (picks: SendPicks) => void;
  onClose: () => void;
}

function printedBy(route: TracerouteView | null, tool: ToolOutput | null): Printed | null {
  if (route) return { kind: 'route', route };
  return tool ? { kind: 'tool', tool } : null;
}

/** The terminal of an origin: a chip from each tray it shows, the line those chips make (the real command, or a packet made by hand), "Enviar" and, once a traceroute, an `nc` or a `dig` was sent with those chips, what it printed. Picking another origin moves the card beside it; the other picks stay. Whether the output of a `dig` is unfolded is kept here, not in the output, and goes back to folded when another chip is picked. */
export function TerminalCard({ card, describe, route, printed, onPickOrigin, onSend, onClose }: TerminalCardProps) {
  const [picks, setPicks] = useState<Partial<SendPicks>>(card.fixed);
  const [unfolded, setUnfolded] = useState(false);
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const chosen: Partial<SendPicks> = { ...picks, from: card.fromId };
  const line = describe(chosen);
  const output = printedBy(route(chosen), printed?.(chosen) ?? null);
  const pick = (tray: SendTrayName, chipId: string) => {
    if (tray === 'from') onPickOrigin(chipId);
    else {
      setPicks({ ...picks, [tray]: chipId });
      setUnfolded(false);
    }
  };
  const send = () => {
    if (chosen.to && chosen.message) onSend({ from: card.fromId, to: chosen.to, message: chosen.message });
  };
  return (
    <ChipCard
      title={card.title}
      icon={<CardIcon kind="terminal" />}
      heading={heading}
      onClose={onClose}
      actions={
        <Button variant="primary" disabled={!line} onClick={send}>
          {TERMINAL_TEXT.send}
        </Button>
      }
    >
      <p className="slot" aria-live="polite">
        {line ? (
          <code>
            <TaggedText text={line} />
          </code>
        ) : (
          <span className="slot__empty">{TERMINAL_TEXT.incomplete}</span>
        )}
      </p>
      {output && <OutputCard printed={output} unfolded={unfolded} onToggle={() => setUnfolded(!unfolded)} />}
      {card.trays.map((tray) => (
        <ChipTray key={tray.name} name={TERMINAL_TEXT.trays[tray.name]} chips={trayChips(tray.chips)} picked={chosen[tray.name] ?? null} onPick={(chipId) => pick(tray.name, chipId)} />
      ))}
    </ChipCard>
  );
}
