import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { PacketLook } from '@/scene/entities';
import { runSeconds } from './schedule';

interface Run extends PacketLook {
  key: number;
  endsAt: number;
}

export type SendsBetween = (from: number, to: number) => boolean;

/** Sends a packet with the latest look whenever `sendsBetween` says one leaves in the last frame, and forgets it when it finishes; packets already travelling keep the look they started with. */
export function usePacketRuns(look: PacketLook, sendsBetween: SendsBetween): Run[] {
  const [runs, setRuns] = useState<Run[]>([]);
  const clock = useRef(-Number.EPSILON);
  const nextKey = useRef(0);
  useFrame((_, delta) => {
    const from = clock.current;
    const now = from + delta;
    clock.current = now;
    const sends = sendsBetween(from, now);
    if (!sends && !runs.some((run) => run.endsAt <= now)) return;
    const key = nextKey.current;
    if (sends) nextKey.current += 1;
    const sent = sends ? [{ ...look, key, endsAt: now + runSeconds(look) }] : [];
    setRuns((current) => [...current.filter((run) => run.endsAt > now), ...sent]);
  });
  return runs;
}

/** Returns a check for `usePacketRuns` that says yes once for each new send number, so each send of the player leaves one packet. */
export function useSendOnce(send: number): SendsBetween {
  const seen = useRef(0);
  return () => {
    if (seen.current === send) return false;
    seen.current = send;
    return true;
  };
}
