import { useTimeout } from '@mantine/hooks';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { MAP_MARKS } from '@/scene';
import { inspectionRoom, type Edges } from './inspection-room';

const GRACE_MS = 400;
const BODY = '.card__body';
const ROOM = '--inspection-room';

interface InspectionControls {
  inspecting: string | null;
  onInspect: (pieceId: string | null) => void;
  holder: {
    ref: RefObject<HTMLDivElement | null>;
    'data-scrolls': true | undefined;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

/** Returns the piece the box inspects, what a piece calls when the mouse or the focus reaches it (a piece id) or leaves it (null), and the props of the element that holds the box. The box lingers for a moment after the pointer leaves a piece, so the pointer can cross to it, and stays for as long as the pointer is over it, so a text that does not fit can be scrolled; it goes as soon as the pointer leaves it, and the next piece the pointer reaches takes it at once. Each time the box inspects another piece, and before the browser draws it, the height it may take is capped by the lowest mark of the map that lies over it (`inspectionRoom`), so it covers no label, stamp or floor name of the map as the player first sees it; what does not fit scrolls. The holder says when the body of the box has more text than it shows (`data-scrolls`): only then does the box take the mouse, so one that fits never stands between the pointer and the label under it. */
export function useInspection(): InspectionControls {
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [scrolls, setScrolls] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const overBox = useRef(false);
  const linger = useTimeout(() => {
    if (!overBox.current) setInspecting(null);
  }, GRACE_MS);

  useLayoutEffect(() => {
    const element = holder.current;
    if (element === null || element.parentElement === null) return;
    const edgesOf = (target: Element): Edges => {
      const { left, right, bottom } = target.getBoundingClientRect();
      return { left, right, bottom };
    };
    const room = inspectionRoom(edgesOf(element), [...element.parentElement.querySelectorAll(MAP_MARKS)].map(edgesOf));
    if (room === null) element.style.removeProperty(ROOM);
    else element.style.setProperty(ROOM, `${room}px`);
  }, [inspecting]);

  useEffect(() => {
    const element = holder.current;
    if (element === null || typeof ResizeObserver === 'undefined') return;
    const watcher = new ResizeObserver(() => {
      const body = element.querySelector(BODY);
      if (body === null) overBox.current = false;
      setScrolls(body !== null && body.scrollHeight > body.clientHeight + 1);
    });
    watcher.observe(element);
    return () => watcher.disconnect();
  }, [inspecting]);

  const onInspect = (pieceId: string | null) => {
    if (pieceId === null) {
      linger.start();
      return;
    }
    linger.clear();
    setInspecting(pieceId);
  };
  return {
    inspecting,
    onInspect,
    holder: {
      ref: holder,
      'data-scrolls': scrolls ? true : undefined,
      onMouseEnter: () => {
        overBox.current = true;
        linger.clear();
      },
      onMouseLeave: () => {
        overBox.current = false;
        setInspecting(null);
      },
    },
  };
}
