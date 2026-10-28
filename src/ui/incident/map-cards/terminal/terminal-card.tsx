import { useState } from 'react';
import { TERMINAL_TEXT, type TermText } from '@/copy';
import { Button, ChipTray } from '@/design';
import { pickedParts, stripAddress, type SendPicks, type SendTrayName, type TerminalCard as Terminal, type ToolOutput, type TracerouteView, type UrlPartName, type UrlPicks } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { trayChips, type CardFrame } from '@/ui/incident/map-cards/card-frame';
import { UrlStripTray } from '@/ui/incident/map-cards/web/url-strip';
import { CommandLine } from './command-line';
import { OutputCard, type Printed } from './output-card';

/** What the terminal asks of its screen: the line the picks make, whether that line is a command a shell runs and so wears the `$ ` prompt (a screen that does not say it gets the prompt), what a traceroute, an `nc`, a `dig` or a `curl` sent with them printed (one block, or a block for each send of a `curl`), moving the card to another origin and sending. */
export interface TerminalHandlers {
  describe: (picks: Partial<SendPicks>) => TermText | null;
  shell?: (picks: Partial<SendPicks>) => boolean;
  route: (picks: Partial<SendPicks>) => TracerouteView | null;
  printed?: (picks: Partial<SendPicks>) => ToolOutput | ToolOutput[] | null;
  onPickOrigin: (fromId: string) => void;
  onSend: (picks: SendPicks) => void;
}

/** What the player has half done in a terminal: the chips picked and whether the output of a `dig` is unfolded. It lives above the tabs of the panel, so the panel keeps it when the player switches tabs and pieces. */
export interface TerminalDraft {
  picks: Partial<SendPicks>;
  parts: UrlPicks;
  unfolded: boolean;
  setPicks: (picks: Partial<SendPicks>) => void;
  setParts: (parts: UrlPicks) => void;
  setUnfolded: (unfolded: boolean) => void;
}

export function useTerminalDraft(): TerminalDraft {
  const [picks, setPicks] = useState<Partial<SendPicks>>({});
  const [parts, setParts] = useState<UrlPicks>({});
  const [unfolded, setUnfolded] = useState(false);
  return { picks, parts, unfolded, setPicks, setParts, setUnfolded };
}

function panelOf(line: TermText | null, prompted: boolean): string {
  if (!line) return 'slot';
  return prompted ? 'command' : 'command command--no-prompt';
}

function printedBy(route: TracerouteView | null, tools: ToolOutput | ToolOutput[] | null): Printed[] {
  return route ? [{ kind: 'route', route }] : [tools ?? []].flat().map((tool) => ({ kind: 'tool', tool }));
}

/** Returns what the terminal of an origin puts in its card: a chip from each tray it shows, the line those chips make (the real command, or a packet made by hand), "Enviar" and, once a traceroute, an `nc`, a `dig` or a `curl` was sent with those chips, what it printed. Picking another origin moves the card beside it; the other picks stay. The draft is the caller's: whether the output of a `dig` is unfolded goes back to folded when another chip is picked. */
export function terminalFrame(card: Terminal, draft: TerminalDraft, { describe, shell, route, printed, onPickOrigin, onSend }: TerminalHandlers): CardFrame {
  const parts = card.strip ? pickedParts(card.strip, draft.parts) : {};
  const address = card.strip && stripAddress(card.strip, parts);
  const chosen: Partial<SendPicks> = { ...card.fixed, ...draft.picks, ...(address && { to: address }), from: card.fromId };
  const line = describe(chosen);
  const outputs = printedBy(route(chosen), printed?.(chosen) ?? null);
  const pick = (tray: SendTrayName, chipId: string) => {
    if (tray === 'from') onPickOrigin(chipId);
    else {
      draft.setPicks({ ...draft.picks, [tray]: chipId });
      draft.setUnfolded(false);
    }
  };
  const pickPart = (part: UrlPartName, value: string) => {
    draft.setParts({ ...draft.parts, [part]: value });
    draft.setUnfolded(false);
  };
  const trayOf = (tray: Terminal['trays'][number]) => (
    <ChipTray key={tray.name} name={TERMINAL_TEXT.trays[tray.name]} chips={trayChips(tray.chips)} picked={chosen[tray.name] ?? null} onPick={(chipId) => pick(tray.name, chipId)} />
  );
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
        <p className={panelOf(line, shell?.(chosen) ?? true)} aria-live="polite">
          {line ? <CommandLine line={line} /> : <span className="slot__empty">{TERMINAL_TEXT.incomplete}</span>}
        </p>
        {outputs.map((printedOutput, index) => (
          <OutputCard key={index} printed={printedOutput} unfolded={draft.unfolded} onToggle={() => draft.setUnfolded(!draft.unfolded)} />
        ))}
        {card.trays.filter(({ name }) => name === 'from').map(trayOf)}
        {card.strip && <UrlStripTray strip={card.strip} picked={parts} onPick={pickPart} />}
        {card.trays.filter(({ name }) => name !== 'from').map(trayOf)}
      </>
    ),
  };
}
