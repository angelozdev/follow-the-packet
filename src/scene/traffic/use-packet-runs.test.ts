// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PACKET_END_S, PACKET_SPEED, travelPath, type PacketEnd, type PacketLook } from '@/scene/entities';
import { pathLength, roundTrip, type Vec2 } from '@/scene/layout';
import { usePacketRuns, useSendOnce } from './use-packet-runs';

type Frame = (state: unknown, delta: number) => void;

const frame = vi.hoisted(() => ({ run: null as Frame | null }));

vi.mock('@react-three/fiber', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useFrame: (callback: Frame) => {
    frame.run = callback;
  },
}));

const FRAME_S = 1 / 60;
const PATH: Vec2[] = [
  [0, 0],
  [PACKET_SPEED, 0],
  [PACKET_SPEED, PACKET_SPEED],
];

function firstRun(end: PacketEnd) {
  const look: PacketLook = { path: PATH, message: 'echo-request', intruder: false, end };
  const { result } = renderHook(() => usePacketRuns(look, () => true));
  act(() => frame.run?.({}, FRAME_S));
  return result.current[0];
}

describe('usePacketRuns', () => {
  it('a warning travels back to the sender along the path', () => {
    const route = travelPath(PATH, 'warned');
    expect(route).toEqual(roundTrip(PATH));
    expect(route.slice(0, PATH.length)).toEqual(PATH);
    expect(route.slice(PATH.length - 1)).toEqual([...PATH].reverse());
    expect(route.at(-1)).toEqual(PATH[0]);
    const run = firstRun('warned');
    expect(run).toMatchObject({ path: PATH, end: 'warned' });
    expect(run.endsAt - FRAME_S).toBeCloseTo((2 * pathLength(PATH)) / PACKET_SPEED + PACKET_END_S);
  });

  it('a warning that the sender generates itself never travels back: its run lasts only the way out', () => {
    expect(travelPath(PATH, 'self-warned')).toEqual(PATH);
    expect(firstRun('self-warned').endsAt - FRAME_S).toBeCloseTo(pathLength(PATH) / PACKET_SPEED + PACKET_END_S);
  });

  it('a run keeps the labels of the packet, which the packet shows along its trip', () => {
    const tags = { legs: [{ request: '{{tcp}} 51514 → 80', reply: '{{tcp}} 80 → 51514' }], changesAt: 1 };
    const look: PacketLook = { path: PATH, message: 'tcp-request', intruder: false, end: 'replied', tags };
    const { result } = renderHook(() => usePacketRuns(look, () => true));
    act(() => frame.run?.({}, FRAME_S));
    expect(result.current[0]).toMatchObject({ message: 'tcp-request', tags });
  });

  it('a reply and a warning take the same trip, and a packet that is lost or blocked only goes out', () => {
    expect(travelPath(PATH, 'replied')).toEqual(travelPath(PATH, 'warned'));
    expect(travelPath(PATH, 'lost')).toEqual(PATH);
    expect(travelPath(PATH, 'blocked')).toEqual(PATH);
  });
});

describe('useSendOnce', () => {
  it('says yes once for a new send number and no on later calls with the same number', () => {
    const { result } = renderHook(({ send }) => useSendOnce(send), { initialProps: { send: 1 } });
    expect(result.current(0, 1)).toBe(true);
    expect(result.current(1, 2)).toBe(false);
    expect(result.current(2, 3)).toBe(false);
  });

  it('keeps saying no after the component renders again with the same number', () => {
    const { result, rerender } = renderHook(({ send }) => useSendOnce(send), { initialProps: { send: 1 } });
    expect(result.current(0, 1)).toBe(true);
    rerender({ send: 1 });
    expect(result.current(1, 2)).toBe(false);
  });

  it('says yes again, once, after the number grows', () => {
    const { result, rerender } = renderHook(({ send }) => useSendOnce(send), { initialProps: { send: 1 } });
    expect(result.current(0, 1)).toBe(true);
    rerender({ send: 2 });
    expect(result.current(1, 2)).toBe(true);
    expect(result.current(2, 3)).toBe(false);
  });

  it('says no while nothing has been sent', () => {
    const { result } = renderHook(({ send }) => useSendOnce(send), { initialProps: { send: 0 } });
    expect(result.current(0, 1)).toBe(false);
  });
});
