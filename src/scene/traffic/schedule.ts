import { pathLength, type Vec2 } from '@/scene/layout';

export const FLOW_PERIOD_S = 3.5;
export const FLOW_OFFSET_S = 1.1;
export const PACKET_SPEED = 3.2;
export const BURST_S = 0.5;

/** True when a flow sends a packet in the window (from, to]: one every FLOW_PERIOD_S seconds, shifted by the flow's position so flows do not leave together. */
export function sendsBetween(from: number, to: number, flowIndex: number): boolean {
  const offset = flowIndex * FLOW_OFFSET_S;
  return Math.floor((to - offset) / FLOW_PERIOD_S) > Math.floor((from - offset) / FLOW_PERIOD_S);
}

/** Seconds a packet stays on the map: its travel along the path plus the burst at the end. */
export function runSeconds(path: Vec2[]): number {
  return pathLength(path) / PACKET_SPEED + BURST_S;
}
