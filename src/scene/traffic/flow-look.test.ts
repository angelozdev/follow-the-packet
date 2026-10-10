import { describe, expect, it } from 'vitest';
import type { PacketSpec } from '@/engine';
import { flowLook, type FlowResult } from './flow-look';

const PING: PacketSpec = { from: { kind: 'device', id: 'your-laptop' }, to: '192.168.1.20', protocol: 'icmp', icmpType: 8 };
const ECHO_REPLY: PacketSpec = { ...PING, icmpType: 0 };
const flow = (result: Partial<FlowResult>): FlowResult => ({ packet: PING, intruder: false, reached: false, replied: false, blocked: false, warning: null, ...result });

describe('flowLook', () => {
  it('an answered ping comes back and leaves ✓', () => {
    expect(flowLook(flow({ reached: true, replied: true }))).toEqual({ message: 'echo-request', intruder: false, end: 'replied', stamp: 'arrived' });
  });

  it('an Echo Reply that arrives stops there, drawn as a reply', () => {
    expect(flowLook(flow({ packet: ECHO_REPLY, reached: true }))).toEqual({ message: 'echo-reply', intruder: false, end: 'arrived', stamp: 'arrived' });
  });

  it('a packet a firewall blocks bursts and leaves ✕', () => {
    expect(flowLook(flow({ blocked: true }))).toMatchObject({ end: 'blocked', stamp: 'blocked' });
  });

  it('a packet that reaches no device and that no firewall stopped is lost, not blocked: it fades and leaves its own stamp', () => {
    expect(flowLook(flow({}))).toMatchObject({ end: 'lost', stamp: 'lost' });
  });

  it('an intruder is drawn as one, and its stamp says so only when it gets in', () => {
    expect(flowLook(flow({ intruder: true, reached: true }))).toMatchObject({ intruder: true, stamp: 'intruder' });
    expect(flowLook(flow({ intruder: true, blocked: true }))).toMatchObject({ intruder: true, stamp: 'blocked' });
  });

  it('a forbidden packet that is lost leaves the stamp of a lost packet, not the one of an intrusion', () => {
    expect(flowLook(flow({ intruder: true }))).toEqual({ message: 'echo-request', intruder: true, end: 'lost', stamp: 'lost' });
  });

  it('a packet that ends in a warning looks like its warning and leaves the stamp of the warning', () => {
    expect(flowLook(flow({ warning: { term: 'time-exceeded', by: 'router' } }))).toEqual({ message: 'echo-request', intruder: false, end: 'warned', stamp: 'warned' });
    expect(flowLook(flow({ warning: { term: 'host-unreachable', by: 'router' } }))).toMatchObject({ end: 'warned', stamp: 'warned' });
  });

  it('a warning that the sender generates itself leaves the same stamp, but never travels back', () => {
    expect(flowLook(flow({ warning: { term: 'host-unreachable', by: 'sender' } }))).toEqual({ message: 'echo-request', intruder: false, end: 'self-warned', stamp: 'warned' });
  });

  it('a packet that ends in silence leaves the lost stamp', () => {
    expect(flowLook(flow({}))).toEqual({ message: 'echo-request', intruder: false, end: 'lost', stamp: 'lost' });
  });

  it('the packet of an intruder keeps its shape on the way out, and the warning that comes back is not an intruder', () => {
    expect(flowLook(flow({ intruder: true, warning: { term: 'time-exceeded', by: 'router' } }))).toMatchObject({ intruder: true, end: 'warned', stamp: 'warned' });
  });
});
