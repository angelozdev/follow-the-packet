import { useEventListener, useMergedRef, useMutationObserver } from '@mantine/hooks';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { inspect, type Session } from '@/game';
import { MAP_CARD, MAP_MARKS } from '@/scene';
import { useFloatingBox } from '@/ui/floating-box/use-floating-box';
import { inspectionPlace, type Frame, type InspectionPlace } from './inspection-place';
import { inspectionRoom } from './inspection-room';

const BODY = '.card__body';
const MAP = '.incident__map';
const ROOM = '--inspection-room';
const PLACE = 'data-place';
const SCOPE = 'inspection';
const TALLEST_SHARE = 0.45;
const WATCHED: MutationObserverInit = { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] };
const SCROLLED: AddEventListenerOptions = { capture: true, passive: true };

function frameOf(target: Element): Frame {
  const { left, top, right, bottom } = target.getBoundingClientRect();
  return { left, top, right, bottom };
}

function lieUnder(map: DOMRect, own: DOMRect): boolean {
  return map.height > 0 && own.top >= map.bottom;
}

function inside(map: Frame, mark: Frame): boolean {
  return mark.left < map.right && map.left < mark.right && mark.top < map.bottom && map.top < mark.bottom;
}

/** Takes the session, the key of the piece or the stamp the player chose (or null) and whether the screen has asked for a card to open, and returns what the inspection box shows (the inspection of the piece or the stamp on a preview, or null), whether that preview repeats what the panel already shows (`duplicate`: the box is drawn but hidden from assistive technology), the props of the trigger of a piece id (hover and focus only: a click is the choice of the screen), how to release the preview, whether the box has no room (`noRoom`), the ref callback that the map takes so the hook watches it (`useMutationObserver` and `useEventListener` of `@mantine/hooks`, merged) and the props of the element that holds the box. It is the floating box of `useFloatingBox` over the inspections of the session, which only previews: a piece whose inspection no longer exists is released. The box never covers a card of the map: it has two places, the bottom right corner of the map, where it opens, and the bottom left one (`inspectionPlace`), and it takes the one that stays clear of the card (`MAP_CARD`) that is open, written as `data-place` on the holder. It looks at the map instead of being told: a mutation observer on the map fires when the card appears, changes tab, height or side, and a scroll listener in the capture phase (a scroll does not bubble) fires when a stage scrolls under the card, and the holder is arranged right then, before the browser draws, so no frame shows the box over the card; a box that lies over the card in the place it has moves to the other, and when neither place is free a preview is not drawn. `noRoom` says that a piece asked for its box and no place was free: it starts at that first attempt and stays, though the pointer leaves, as long as the card stays asked for, so the screen's reason does not blink; it ends when the card closes or when a box asked for finds a place. The box of the click that opens a card waits, hidden (`data-hold`), until the card is in the map and measured. Each time the box shows another piece or changes place, and before the browser draws, the height it may take is capped by the lowest mark of the map that lies over it in its place (`inspectionRoom`), so it covers no label, stamp or floor name of the map as the player first sees it; what does not fit scrolls. Under 901 px the box is a block under the map and none of this applies, and a hover scrolls nothing. The holder says when the body of the box has more text than it shows (`data-scrolls`): only then does the box take the mouse, so one that fits never stands between the pointer and the label under it. */
export function useInspection(session: Session, selected: string | null, cardAsked: boolean) {
  const box = useFloatingBox<string>(SCOPE);
  const { shown, release } = box;
  const [scrolls, setScrolls] = useState(false);
  const [place, setPlace] = useState<InspectionPlace | null>('right');
  const [cardDrawn, setCardDrawn] = useState(false);
  const [noRoom, setNoRoom] = useState(false);
  const watched = useRef<HTMLDivElement>(null);
  const latest = useRef({ shown, asked: cardAsked });
  const placed = useRef<InspectionPlace | null>(null);
  const capped = useRef<{ key: string | null; place: InspectionPlace | null }>({ key: null, place: null });
  const holderRef = useMergedRef<HTMLDivElement>(box.box.ref, watched);
  const inspection = shown === null ? null : inspect(session, shown);
  const gone = shown !== null && inspection === null;

  const arrange = useCallback(() => {
    const holder = watched.current;
    const map = holder?.parentElement?.querySelector(MAP);
    if (!holder || !map) return;
    const card = map.querySelector(MAP_CARD);
    setCardDrawn(card !== null);
    const { shown: key, asked } = latest.current;
    const mapFrame = map.getBoundingClientRect();
    const own = holder.getBoundingClientRect();
    const marks = [...(holder.parentElement?.querySelectorAll(MAP_MARKS) ?? [])].map(frameOf).filter((mark) => inside(mapFrame, mark));
    const underTheMap = lieUnder(mapFrame, own);
    const chosen =
      key === null || underTheMap
        ? 'right'
        : inspectionPlace({ map: mapFrame, width: own.width, tallest: TALLEST_SHARE * mapFrame.height, margin: mapFrame.bottom - own.bottom, card: card?.getBoundingClientRect() ?? null, current: placed.current, marks });
    placed.current = key === null ? null : chosen;
    setPlace(chosen);
    if (key !== null) setNoRoom(chosen === null);
    else if (!asked || card === null) setNoRoom(false);
    if (chosen === null) return;
    holder.setAttribute(PLACE, chosen);
    if (capped.current.key === key && capped.current.place === chosen) return;
    capped.current = { key, place: chosen };
    const room = inspectionRoom(frameOf(holder), marks);
    if (room === null) holder.style.removeProperty(ROOM);
    else holder.style.setProperty(ROOM, `${room}px`);
  }, []);
  const onMapChange = useCallback(() => {
    if (latest.current.shown !== null || latest.current.asked) arrange();
    else setCardDrawn(watched.current?.parentElement?.querySelector(`${MAP} ${MAP_CARD}`) != null);
  }, [arrange]);
  const watchMutations = useMutationObserver(onMapChange, WATCHED);
  const watchScrolls = useEventListener('scroll', onMapChange, SCROLLED);
  const watchTheMap = useMergedRef(watchMutations, watchScrolls);

  useLayoutEffect(() => {
    latest.current = { shown, asked: cardAsked };
  });

  useLayoutEffect(() => {
    arrange();
  }, [arrange, shown, cardAsked]);

  useEffect(() => {
    const element = watched.current;
    if (element === null || typeof ResizeObserver === 'undefined') return;
    const watcher = new ResizeObserver(() => {
      const body = element.querySelector(BODY);
      setScrolls(body !== null && body.scrollHeight > body.clientHeight + 1);
    });
    watcher.observe(element);
    return () => watcher.disconnect();
  }, [shown]);

  useEffect(() => {
    if (gone) release();
  }, [gone, release]);

  const drawn = place === null ? null : inspection;

  return {
    inspection: drawn,
    duplicate: shown !== null && shown === selected,
    noRoom: noRoom && cardAsked,
    trigger: box.trigger,
    release,
    watchTheMap,
    holder: { ref: holderRef, 'data-scrolls': scrolls ? true : undefined, 'data-hold': cardAsked && !cardDrawn && shown !== null ? true : undefined, onPointerEnter: box.box.onPointerEnter, onPointerLeave: box.box.onPointerLeave },
  };
}
