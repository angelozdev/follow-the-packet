import { useMergedRef } from '@mantine/hooks';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { inspect, type Session } from '@/game';
import { MAP_MARKS } from '@/scene';
import { useFloatingBox } from '@/ui/floating-box/use-floating-box';
import { inspectionPlace, type Frame, type InspectionPlace } from './inspection-place';
import { inspectionRoom } from './inspection-room';

const BODY = '.card__body';
const MAP = '.incident__map';
const ROOM = '--inspection-room';
const PLACE = 'data-place';
const SCOPE = 'inspection';

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

/** Takes the session and the key of the piece or the stamp the player chose (or null), and returns what the inspection box shows (the inspection of the piece or the stamp on a preview, or null), whether that preview repeats what the panel already shows (`duplicate`: the box is drawn but hidden from assistive technology), the props of the trigger of a piece id (hover and focus only: a click is the choice of the screen), how to release the preview and the props of the element that holds the box. It is the floating box of `useFloatingBox` over the inspections of the session, which only previews: a piece whose inspection no longer exists is released. The box has two places, the bottom right corner of the map, where it opens, and the bottom left one (`inspectionPlace`), and it takes the one that stays clear of the marks of the map, written as `data-place` on the holder. Each time the box shows another piece, and before the browser draws, the place is chosen and the height it may take is capped by the lowest mark of the map that lies over it in its place (`inspectionRoom`), so it covers no label, stamp or floor name of the map as the player first sees it; what does not fit scrolls. Under 901 px the box is a block under the map and none of this applies, and a hover scrolls nothing. The holder says when the body of the box has more text than it shows (`data-scrolls`): only then does the box take the mouse, so one that fits never stands between the pointer and the label under it. */
export function useInspection(session: Session, selected: string | null) {
  const box = useFloatingBox<string>(SCOPE);
  const { shown, release } = box;
  const [scrolls, setScrolls] = useState(false);
  const watched = useRef<HTMLDivElement>(null);
  const placed = useRef<InspectionPlace | null>(null);
  const capped = useRef<{ key: string | null; place: InspectionPlace | null }>({ key: null, place: null });
  const holderRef = useMergedRef<HTMLDivElement>(box.box.ref, watched);
  const inspection = shown === null ? null : inspect(session, shown);
  const gone = shown !== null && inspection === null;

  useLayoutEffect(() => {
    const holder = watched.current;
    const map = holder?.parentElement?.querySelector(MAP);
    if (!holder || !map) return;
    const mapFrame = map.getBoundingClientRect();
    const own = holder.getBoundingClientRect();
    const marks = [...(holder.parentElement?.querySelectorAll(MAP_MARKS) ?? [])].map(frameOf).filter((mark) => inside(mapFrame, mark));
    const chosen = shown === null || lieUnder(mapFrame, own) ? 'right' : inspectionPlace({ map: mapFrame, width: own.width, margin: mapFrame.bottom - own.bottom, current: placed.current, marks });
    placed.current = shown === null ? null : chosen;
    holder.setAttribute(PLACE, chosen);
    if (capped.current.key === shown && capped.current.place === chosen) return;
    capped.current = { key: shown, place: chosen };
    const room = inspectionRoom(frameOf(holder), marks);
    if (room === null) holder.style.removeProperty(ROOM);
    else holder.style.setProperty(ROOM, `${room}px`);
  }, [shown]);

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

  return {
    inspection,
    duplicate: shown !== null && shown === selected,
    trigger: box.trigger,
    release,
    holder: { ref: holderRef, 'data-scrolls': scrolls ? true : undefined, onPointerEnter: box.box.onPointerEnter, onPointerLeave: box.box.onPointerLeave },
  };
}
