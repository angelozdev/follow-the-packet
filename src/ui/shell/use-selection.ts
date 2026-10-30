import { useWindowEvent } from '@mantine/hooks';
import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { inspect, type Inspection, type Session } from '@/game';
import { pieceDomId, type CameraControls, type GameSceneProps } from '@/scene';

type TriggerProps = ReturnType<GameSceneProps['inspectTrigger']>;

interface Choice {
  key: string;
  trigger: HTMLElement;
  markedSend?: number;
}

interface Arrival {
  key: string;
  focus: boolean;
  reveal: boolean;
}

const PANEL = '.incident__panel > .card';
const PANEL_ZONE = '.incident__panel';
const MAP = '.incident__map';
const NEAREST: ScrollIntoViewOptions = { block: 'nearest' };

function isPacketBox({ entity }: Inspection): boolean {
  return entity === undefined || entity.kind === 'packet';
}

function markedSendOf(session: Session, chosen: Choice | null): number | undefined {
  const send = chosen?.markedSend;
  return session.history.some((run) => run.send === send) ? send : undefined;
}

function revealThePanel(heading: HTMLElement | null) {
  const zone = heading?.closest(PANEL_ZONE);
  const map = zone?.closest('.incident')?.querySelector(MAP);
  if (!zone || !map || map.getBoundingClientRect().height === 0) return;
  if (zone.getBoundingClientRect().top >= map.getBoundingClientRect().bottom) zone.scrollIntoView(NEAREST);
}

/** Takes the session and returns the choice of the screen: the key of the piece, the packet or the list of stamps the player chose (`selected`, or null), its inspection (`inspection`, null when nothing is chosen) and the id of the chosen piece when it is a piece and not a packet or a list of stamps (`pieceId`, the one the map rings); the ref of the heading of its panel; `trigger(key, hover)`, which adds to the hover props of a trigger the click that chooses its key, the mark `data-pinned` while it is the chosen one and the silence of its focus while the focus is given back; `choosePiece(key)`, which chooses a piece with no click, as the terminal does when the player picks another origin, and leaves the focus where it is; `showRow(key, send)`, which chooses a piece for «Ver fila en la tabla de rutas», brings the focus to the heading of its panel whatever the player used, and keeps the number of the send whose row the table of routes marks (`markedSend`, which any other choice drops and which is `undefined` once the history no longer holds that send); and `release()`, which drops the choice. A click, a tap, Enter or Space chooses a key, and the choice lasts until another is chosen or `release()` is called, whatever the hover and the focus do. A choice made with the keyboard moves the focus to the heading of the panel, and Escape from inside the panel gives the focus back to the trigger and keeps the choice. Under 901 px, where the panel lies below the map, a choice brings the zone of the panel into view (the card with the padding around it, so the page ends right under it and a box above it that closes moves nothing), the least the player has to scroll, and a hover never does. A choice whose inspection no longer exists is released. */
export function useSelection(session: Session, camera?: RefObject<CameraControls | null>) {
  const [chosen, setChosen] = useState<Choice | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const arrival = useRef<Arrival | null>(null);
  const givingTheFocusBack = useRef(false);
  const inspection = chosen === null ? null : inspect(session, chosen.key);
  const gone = chosen !== null && inspection === null;

  const choose = (key: string, event: MouseEvent<HTMLElement>) => {
    arrival.current = { key, focus: event.detail === 0, reveal: true };
    setChosen({ key, trigger: event.currentTarget });
  };
  const choosePiece = (key: string) => {
    const label = document.getElementById(pieceDomId(key));
    if (label !== null) setChosen({ key, trigger: label });
  };
  const showPiece = (key: string, markedSend?: number) => {
    const label = document.getElementById(pieceDomId(key));
    if (label === null) return;
    arrival.current = { key, focus: true, reveal: true };
    setChosen({ key, trigger: label, markedSend });
  };
  const focusIsInThePanel = () => heading.current?.closest(PANEL)?.contains(document.activeElement) ?? false;
  const giveTheFocusBack = () => {
    if (chosen === null || !chosen.trigger.isConnected) return;
    givingTheFocusBack.current = true;
    chosen.trigger.focus();
    givingTheFocusBack.current = false;
  };
  const release = () => {
    if (focusIsInThePanel()) giveTheFocusBack();
    setChosen(null);
  };
  const trigger = (key: string, hover: TriggerProps): TriggerProps => ({
    ...hover,
    onFocus: (event) => {
      if (!givingTheFocusBack.current) hover.onFocus?.(event);
    },
    onClick: (event) => choose(key, event),
    'data-pinned': chosen?.key === key ? true : undefined,
  });

  useWindowEvent('keydown', (event) => {
    if (event.key === 'Escape' && focusIsInThePanel()) giveTheFocusBack();
  });

  useEffect(() => {
    const coming = arrival.current;
    if (chosen === null || coming?.key !== chosen.key) return;
    arrival.current = null;
    if (coming.focus) heading.current?.focus();
    if (coming.reveal) revealThePanel(heading.current);
  }, [chosen]);

  useEffect(() => {
    if (gone) setChosen(null);
  }, [gone]);

  useEffect(() => {
    if (chosen !== null) camera?.current?.revealChosen();
  }, [chosen, camera]);

  const packet = inspection !== null && isPacketBox(inspection);
  return { selected: chosen?.key ?? null, inspection, pieceId: chosen !== null && inspection !== null && !packet ? chosen.key : null, markedSend: markedSendOf(session, chosen), heading, trigger, choosePiece, showPiece, showRow: showPiece, release };
}
