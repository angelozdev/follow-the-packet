import { describe, expect, it } from 'vitest';
import type { PacketSpec } from '@/engine';
import { flowLook, type FlowResult } from './flow-look';

const PING: PacketSpec = { from: { kind: 'device', id: 'your-laptop' }, to: '192.168.1.20', protocol: 'icmp', icmpType: 8 };
const ECHO_REPLY: PacketSpec = { ...PING, icmpType: 0 };
const flow = (result: Partial<FlowResult>): FlowResult => ({ kind: 'required', packet: PING, reached: false, replied: false, lost: false, ...result });

describe('flowLook', () => {
  it('an answered ping comes back and leaves ✓', () => {
    expect(flowLook(flow({ reached: true, replied: true }))).toEqual({ message: 'echo-request', intruder: false, end: 'replied', stamp: 'arrived' });
  });

  it('an Echo Reply that arrives stops there, drawn as a reply', () => {
    expect(flowLook(flow({ packet: ECHO_REPLY, reached: true }))).toEqual({ message: 'echo-reply', intruder: false, end: 'arrived', stamp: 'arrived' });
  });

  it('a blocked packet bursts and leaves ✕', () => {
    expect(flowLook(flow({}))).toMatchObject({ end: 'blocked', stamp: 'blocked' });
  });

  it('a lost packet fades and leaves its own stamp, not the one of a block', () => {
    expect(flowLook(flow({ lost: true }))).toMatchObject({ end: 'lost', stamp: 'lost' });
  });

  it('a forbidden flow is an intruder, and its stamp says so only when it gets in', () => {
    expect(flowLook(flow({ kind: 'forbidden', reached: true }))).toMatchObject({ intruder: true, stamp: 'intruder' });
    expect(flowLook(flow({ kind: 'forbidden' }))).toMatchObject({ intruder: true, stamp: 'blocked' });
  });

  it('a forbidden packet that is lost leaves the stamp of a lost packet, not the one of an intrusion', () => {
    expect(flowLook(flow({ kind: 'forbidden', lost: true }))).toEqual({ message: 'echo-request', intruder: true, end: 'lost', stamp: 'lost' });
  });
});
