import { useEffect, useRef, type RefObject } from 'react';

/** Returns a ref whose element gets the focus once, right after it mounts. */
export function useFocusOnMount<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}
