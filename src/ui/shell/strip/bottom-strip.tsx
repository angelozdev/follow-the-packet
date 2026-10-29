import type { ReactNode } from 'react';
import { useRoomForTheBar } from './use-room-for-the-bar';

interface BottomStripProps {
  line: ReactNode;
  bar: ReactNode;
  box: ReactNode;
}

export function BottomStrip({ line, bar, box }: BottomStripProps) {
  const stripRef = useRoomForTheBar();
  return (
    <div ref={stripRef} className="incident__status">
      {line}
      {bar}
      {box}
    </div>
  );
}
