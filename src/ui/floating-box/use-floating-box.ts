import { useClickOutside, useTimeout, useWindowEvent } from '@mantine/hooks';
import { useCallback, useId, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from 'react';

export const GRACE_MS = 400;
const TOUCH = 'touch';
const OUTSIDE_EVENTS = ['pointerdown'];
const TAKEN_EVENT = 'floating-box-taken';

interface BoxState<K extends string> {
  key: K | null;
  pinned: boolean;
  trigger: HTMLElement | null;
}

interface Trigger {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  'data-pinned': true | undefined;
}

interface FloatingBoxOptions<K extends string> {
  onPin?: (key: K, fromKeyboard: boolean) => void;
}

const IDLE: BoxState<never> = { key: null, pinned: false, trigger: null };

/** Takes the scope of the box (the boxes of one scope hand a preview to each other at once) and the options, and returns what a box that many triggers open needs. `trigger(key)` gives the props of one trigger: hovering it (not with a touch) or focusing it previews the box of its key; when the pointer or the focus leaves, the preview waits for `GRACE_MS` and stays while the pointer is over the box, and the pointer can go from the box straight back onto the trigger without closing it; another trigger takes it at once; a click, a tap, Enter or Space pins it (`data-pinned`), and a pinned box ignores hover and focus on other triggers. `box` gives the props of the element that holds the box. `shown` is the key on display or null, `pinned` whether it is pinned, and `release()` closes it and, when the focus was inside the box, gives it back to the trigger that opened it without reopening the box. Escape and a pointerdown outside the box and the trigger release it too. The optional `onPin(key, fromKeyboard)` runs once, when a click newly pins a key (`fromKeyboard` is true for Enter and Space), before the box shows it. */
export function useFloatingBox<K extends string>(scope: string, { onPin }: FloatingBoxOptions<K> = {}) {
  const [state, setState] = useState<BoxState<K>>(IDLE);
  const [boxElement, setBoxElement] = useState<HTMLElement | null>(null);
  const latest = useRef<BoxState<K>>(IDLE);
  const overBox = useRef(false);
  const dismissed = useRef<K | null>(null);
  const owner = useId();
  const takenEvent = `${TAKEN_EVENT}:${scope}`;

  const commit = useCallback(
    (next: BoxState<K>) => {
      latest.current = next;
      if (next.key === null) overBox.current = false;
      else window.dispatchEvent(new CustomEvent(takenEvent, { detail: owner }));
      setState(next);
    },
    [owner, takenEvent],
  );
  const { start: startGrace, clear: stopGrace } = useTimeout(() => {
    if (!overBox.current && !latest.current.pinned) commit(IDLE);
  }, GRACE_MS);

  const preview = (key: K, element: HTMLElement) => {
    if (latest.current.pinned) return;
    stopGrace();
    if (latest.current.key !== key) commit({ key, pinned: false, trigger: element });
  };
  const pin = (key: K, event: MouseEvent<HTMLElement>) => {
    stopGrace();
    if (latest.current.pinned && latest.current.key === key) return;
    onPin?.(key, event.detail === 0);
    commit({ key, pinned: true, trigger: event.currentTarget });
  };
  const release = useCallback(() => {
    const { key, trigger } = latest.current;
    stopGrace();
    if (key !== null) {
      dismissed.current = key;
      if (trigger?.isConnected && boxElement?.contains(document.activeElement)) trigger.focus();
    }
    commit(IDLE);
  }, [boxElement, commit, stopGrace]);

  useWindowEvent(takenEvent, (event) => {
    if (latest.current.key !== null && event.detail !== owner && !latest.current.pinned) commit(IDLE);
  });
  useWindowEvent('keydown', (event) => {
    if (event.key === 'Escape' && latest.current.key !== null) release();
  });
  useClickOutside(
    () => {
      stopGrace();
      commit(IDLE);
    },
    OUTSIDE_EVENTS,
    [boxElement, state.trigger].filter((node) => node !== null),
    state.key !== null,
    true,
  );

  const trigger = (key: K): Trigger => ({
    onPointerEnter: (event) => {
      if (event.pointerType === TOUCH) return;
      dismissed.current = null;
      preview(key, event.currentTarget);
    },
    onPointerLeave: (event) => {
      if (event.pointerType === TOUCH) return;
      if (dismissed.current === key) dismissed.current = null;
      startGrace();
    },
    onFocus: (event) => {
      if (dismissed.current !== key) preview(key, event.currentTarget);
    },
    onBlur: () => {
      if (dismissed.current === key) dismissed.current = null;
      startGrace();
    },
    onClick: (event) => pin(key, event),
    'data-pinned': state.pinned && state.key === key ? true : undefined,
  });
  const box = {
    ref: setBoxElement,
    onPointerEnter: () => {
      overBox.current = true;
      stopGrace();
    },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      overBox.current = false;
      const { pinned, trigger: opener } = latest.current;
      const backOnTrigger = event.relatedTarget instanceof Node && opener?.contains(event.relatedTarget);
      if (!pinned && !backOnTrigger) commit(IDLE);
    },
  };

  return { shown: state.key, pinned: state.pinned, release, trigger, box };
}
