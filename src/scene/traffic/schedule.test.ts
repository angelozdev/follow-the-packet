import { describe, expect, it } from 'vitest';
import { PACKET_END_S, PACKET_SPEED } from '@/scene/entities';
import type { Vec2 } from '@/scene/layout';
import { FLOW_OFFSET_S, FLOW_PERIOD_S, runSeconds, sendsBetween } from './schedule';

const FRAME_S = 1 / 60;
const FRAMES_IN_TWO_PERIODS = Math.round((2 * FLOW_PERIOD_S) / FRAME_S);

describe('traffic schedule', () => {
  it('the first flow sends on the first frame, the second one FLOW_OFFSET_S later', () => {
    expect(sendsBetween(-Number.EPSILON, FRAME_S, 0)).toBe(true);
    expect(sendsBetween(-Number.EPSILON, FRAME_S, 1)).toBe(false);
    expect(sendsBetween(FLOW_OFFSET_S - FRAME_S, FLOW_OFFSET_S + FRAME_S, 1)).toBe(true);
  });

  it('each flow sends once per period', () => {
    let sent = 0;
    for (let frame = 0; frame < FRAMES_IN_TWO_PERIODS - 1; frame++) {
      const from = frame * FRAME_S - Number.EPSILON;
      if (sendsBetween(from, from + FRAME_S, 0)) sent++;
    }
    expect(sent).toBe(2);
  });

  it('a packet stays its travel time plus its end, and its travel back too when it is answered', () => {
    const path: Vec2[] = [[0, 0], [PACKET_SPEED, 0]];
    expect(runSeconds({ path, end: 'blocked' })).toBeCloseTo(1 + PACKET_END_S);
    expect(runSeconds({ path, end: 'replied' })).toBeCloseTo(2 + PACKET_END_S);
  });
});
