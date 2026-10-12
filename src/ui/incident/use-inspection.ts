import { useMergedRef } from '@mantine/hooks';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { inspect, type Session } from '@/game';
import { MAP_MARKS } from '@/scene';
import { useFloatingBox } from '@/ui/floating-box/use-floating-box';
import { inspectionRoom, type Edges } from './inspection-room';

const BODY = '.card__body';
const ROOM = '--inspection-room';
const SCOPE = 'inspection';

/** Returns what the inspection box shows (the inspection of the piece or the stamp on display, or null), whether it is pinned, the props of the trigger of a piece id, how to release the box, the ref of the box's heading and the props of the element that holds the box. It is the floating box of `useFloatingBox` over the inspections of the session: a piece whose inspection no longer exists is released. A pin from the keyboard moves the focus to the heading of the box, unless `opensCard` says, at the moment of the pin, that the same click opens a card, which keeps the focus: the decision is taken once, when the pin happens, and used once, so a later change of phase never moves the focus. Each time the box shows another piece, and before the browser draws it, the height it may take is capped by the lowest mark of the map that lies over it (`inspectionRoom`), so it covers no label, stamp or floor name of the map as the player first sees it; what does not fit scrolls. The holder says when the body of the box has more text than it shows (`data-scrolls`): only then does the box take the mouse, pinned or not, so one that fits never stands between the pointer and the label under it. */
export function useInspection(session: Session, opensCard: (pieceId: string) => boolean) {
  const focusOnPin = useRef<string | null>(null);
  const box = useFloatingBox<string>(SCOPE, {
    onPin: (key, fromKeyboard) => {
      focusOnPin.current = fromKeyboard && !opensCard(key) ? key : null;
    },
  });
  const { shown, pinned, release } = box;
  const [scrolls, setScrolls] = useState(false);
  const watched = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const holderRef = useMergedRef<HTMLDivElement>(box.box.ref, watched);
  const inspection = shown === null ? null : inspect(session, shown);
  const gone = shown !== null && inspection === null;

  useLayoutEffect(() => {
    const element = watched.current;
    if (element === null || element.parentElement === null) return;
    const edgesOf = (target: Element): Edges => {
      const { left, right, bottom } = target.getBoundingClientRect();
      return { left, right, bottom };
    };
    const room = inspectionRoom(edgesOf(element), [...element.parentElement.querySelectorAll(MAP_MARKS)].map(edgesOf));
    if (room === null) element.style.removeProperty(ROOM);
    else element.style.setProperty(ROOM, `${room}px`);
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

  useEffect(() => {
    if (!pinned || shown === null || focusOnPin.current !== shown) return;
    focusOnPin.current = null;
    heading.current?.focus();
  }, [pinned, shown]);

  return {
    inspection,
    pinned: pinned && inspection !== null,
    trigger: box.trigger,
    release,
    heading,
    holder: { ref: holderRef, 'data-scrolls': scrolls ? true : undefined, onPointerEnter: box.box.onPointerEnter, onPointerLeave: box.box.onPointerLeave },
  };
}
