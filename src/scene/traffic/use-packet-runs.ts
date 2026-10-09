import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { PacketLook } from '@/scene/entities';
import { runSeconds, sendsBetween } from './schedule';

interface Run extends PacketLook {
  key: number;
  endsAt: number;
}

/** Sends a packet with the latest look once per period and forgets it when it finishes; packets already travelling keep the look they started with. */
export function usePacketRuns(look: PacketLook, flowIndex: number): Run[] {
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
    const sent = sends ? [{ ...look, key, endsAt: now + runSeconds(look) }] : [];
    setRuns((current) => [...current.filter((run) => run.endsAt > now), ...sent]);
  });
  return runs;
}
