import { useState } from 'react';
import { TERMINAL_TEXT, type TermText } from '@/copy';
import { Button, ChipTray } from '@/design';
import type { SendPicks, SendTrayName, TerminalCard as Terminal, TracerouteView } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { ChipCard, trayChips } from '@/ui/incident/map-cards/chip-card';

interface TerminalCardProps {
  card: Terminal;
  describe: (picks: Partial<SendPicks>) => TermText | null;
  route: (picks: Partial<SendPicks>) => TracerouteView | null;
  onPickOrigin: (fromId: string) => void;
  onSend: (picks: SendPicks) => void;
  onClose: () => void;
}

/** What a traceroute printed: its hops as a numbered list, with the IP that answered (or a star) and the time of each, and the notes that say what the stars, the marks and the times mean. */
function RouteOutput({ route }: { route: TracerouteView }) {
  return (
    <>
      {route.error && (
        <p className="muted">
          <TaggedText text={route.error} />
        </p>
      )}
      {route.lines.length > 0 && (
        <ol className="rules" aria-label={TERMINAL_TEXT.route.label}>
          {route.lines.map((line) => {
            const aside = TERMINAL_TEXT.route.aside(line.time, line.mark);
            return (
              <li key={line.hop}>
                <span className="rules__text">
                  <code>{TERMINAL_TEXT.route.hop(line.hop, line.address)}</code>
                </span>
                {aside && (
                  <span className="muted">
                    <code>{aside}</code>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {route.notes.map((note) => (
        <p key={note} className="muted">
          <TaggedText text={note} />
        </p>
      ))}
    </>
  );
}

/** The terminal of an origin: a chip from each tray it shows, the line those chips make (the real ping command, or a packet made by hand), "Enviar" and, once a traceroute was sent with those chips, what it printed. Picking another origin moves the card beside it; the other picks stay. */
export function TerminalCard({ card, describe, route, onPickOrigin, onSend, onClose }: TerminalCardProps) {
  const [picks, setPicks] = useState<Partial<SendPicks>>(card.fixed);
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const chosen: Partial<SendPicks> = { ...picks, from: card.fromId };
  const line = describe(chosen);
  const output = route(chosen);
  const pick = (tray: SendTrayName, chipId: string) => {
    if (tray === 'from') onPickOrigin(chipId);
    else setPicks({ ...picks, [tray]: chipId });
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
      {output && <RouteOutput route={output} />}
      {card.trays.map((tray) => (
        <ChipTray key={tray.name} name={TERMINAL_TEXT.trays[tray.name]} chips={trayChips(tray.chips)} picked={chosen[tray.name] ?? null} onPick={(chipId) => pick(tray.name, chipId)} />
      ))}
    </ChipCard>
  );
}
