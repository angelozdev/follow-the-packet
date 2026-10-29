import { useElementSize } from '@mantine/hooks';
import { useEffect } from 'react';

const BAR_ROOM_VARIABLE = '--status-bar-room';

/** Returns the ref to give the bottom strip. While the strip is mounted, the bottom scroll padding of the page (`--status-bar-room`, read by `styles.css` at 900 px and under, where the strip sticks over the page) is the height of the strip, so what the browser or `scrollIntoView` brings into view stops above it. */
export function useRoomForTheBar() {
  const { ref, height } = useElementSize<HTMLDivElement>();
  useEffect(() => {
    document.documentElement.style.setProperty(BAR_ROOM_VARIABLE, `${height}px`);
    return () => {
      document.documentElement.style.removeProperty(BAR_ROOM_VARIABLE);
    };
  }, [height]);
  return ref;
}
