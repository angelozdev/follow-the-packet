import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { Vec2 } from '@/scene/layout';
import { runSeconds, sendsBetween } from './schedule';

export interface Trip {
  path: Vec2[];
  blocked: boolean;
}

interface Run extends Trip {
  key: number;
  endsAt: number;
}

/** Sends a packet along the latest trip once per period and forgets it when it finishes; packets already travelling keep the trip they started with. */
export function usePacketRuns(trip: Trip, flowIndex: number): Run[] {
  const [runs, setRuns] = useState<Run[]>([]);
  const clock = useRef(-Number.EPSILON);
  const nextKey = useRef(0);
  useFrame((_, delta) => {
    const from = clock.current;
    const now = from + delta;
    clock.current = now;
    const sends = sendsBetween(from, now, flowIndex);
    if (!sends && !runs.some((run) => run.endsAt <= now)) return;
    const key = nextKey.current;
    if (sends) nextKey.current += 1;
    const sent = sends ? [{ ...trip, key, endsAt: now + runSeconds(trip.path) }] : [];
    setRuns((current) => [...current.filter((run) => run.endsAt > now), ...sent]);
  });
  return runs;
}
