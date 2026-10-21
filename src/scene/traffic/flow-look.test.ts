import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { applyAction, reachesHost, simulate, type Network, type PacketSpec } from '@/engine';
import { replyShape } from '@/copy';
import { NAME_SERVER_PIECES, OFFICE_FLOORS, device, officeWithNames, ping } from '@/testing';
import { flowLook, type FlowResult } from './flow-look';

const PING: PacketSpec = { from: { kind: 'device', id: 'your-laptop' }, to: '192.168.1.20', protocol: 'icmp', icmpType: 8 };
const ECHO_REPLY: PacketSpec = { ...PING, icmpType: 0 };
const SRC = fileURLToPath(new URL('../../', import.meta.url));
const RHOMBUS = /rombo|rhombus/i;

function sourcesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourcesUnder(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const TCP: PacketSpec = { from: { kind: 'device', id: 'your-laptop' }, to: '192.168.1.11', protocol: 'tcp', port: 3000 };
const UDP: PacketSpec = { ...TCP, protocol: 'udp', port: 53 };
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

  it('a tcp request is drawn with the filled shape of tcp and its reply with the ring, and a udp datagram with the shapes of udp', () => {
    const tcp = flowLook(flow({ packet: TCP, reached: true, replied: true }));
    const udp = flowLook(flow({ packet: UDP, reached: true, replied: true }));
    expect([tcp.message, replyShape(tcp.message)]).toEqual(['tcp-request', 'tcp-reply']);
    expect([udp.message, replyShape(udp.message)]).toEqual(['udp-request', 'udp-reply']);
    expect(flowLook(flow({ reached: true, replied: true })).message).toBe('echo-request');
    expect(replyShape('echo-request')).toBe('echo-reply');
  });

  it('the packet of an intruder has the shape of its protocol and the intruder border', () => {
    expect(flowLook(flow({ packet: TCP, intruder: true, reached: true }))).toEqual({ message: 'tcp-request', intruder: true, end: 'arrived', stamp: 'intruder' });
    expect(flowLook(flow({ packet: UDP, intruder: true, blocked: true }))).toMatchObject({ message: 'udp-request', intruder: true, end: 'blocked' });
    expect(flowLook(flow({ intruder: true, reached: true }))).toMatchObject({ message: 'echo-request', intruder: true });
  });

  it('no text of the game calls the intruder a rhombus', () => {
    const files = sourcesUnder(SRC);
    expect(files.length).toBeGreaterThan(100);
    expect(files.filter((file) => RHOMBUS.test(readFileSync(file, 'utf8')))).toEqual([]);
  });

  it('a datagram that reached its host and got a Port Unreachable is not an arrival: the warning comes back from the host and leaves the stamp of a warning', () => {
    const closed = flow({ packet: UDP, reached: true, warning: { term: 'port-unreachable', by: 'host' } });
    expect(flowLook(closed)).toEqual({ message: 'udp-request', intruder: false, end: 'warned', stamp: 'warned' });
    expect(flowLook({ ...closed, intruder: true })).toMatchObject({ intruder: true, end: 'warned', stamp: 'warned' });
  });

  it('a datagram that got a Port Unreachable the player cannot name yet keeps looking as it reached the host', () => {
    expect(flowLook(flow({ packet: UDP, reached: true, warning: null }))).toMatchObject({ end: 'arrived', stamp: 'arrived' });
  });

  it('the question of a send is drawn with the shapes of udp and ends replied, warned or lost like any packet', () => {
    const names = officeWithNames();
    const questionIn = (world: Network) => simulate(world, ping(device('your-laptop'), `www.${NAME_SERVER_PIECES.zone}`)).question!;
    const resultOf = ({ packet, trace }: ReturnType<typeof questionIn>, extras: Partial<FlowResult> = {}) => flow({ packet, reached: reachesHost(trace), replied: trace.outcome === 'replied', ...extras });
    const answered = questionIn(names);
    expect(answered.packet).toMatchObject({ protocol: 'udp', port: 53 });
    const replied = flowLook(resultOf(answered));
    expect(replied).toEqual({ message: 'udp-request', intruder: false, end: 'replied', stamp: 'arrived' });
    expect(replyShape(replied.message)).toBe('udp-reply');
    const toThePrinter = questionIn(applyAction(names, { type: 'setDnsServer', deviceId: 'your-laptop', server: OFFICE_FLOORS.floor1.printer }));
    expect(toThePrinter.trace.notice).toMatchObject({ kind: 'port-unreachable', fromId: 'printer' });
    expect(flowLook(resultOf(toThePrinter, { warning: { term: 'port-unreachable', by: 'host' } }))).toEqual({ message: 'udp-request', intruder: false, end: 'warned', stamp: 'warned' });
    const toNobody = questionIn(applyAction(names, { type: 'setDnsServer', deviceId: 'your-laptop', server: OFFICE_FLOORS.server.nobody }));
    expect(flowLook(resultOf(toNobody, { warning: { term: 'host-unreachable', by: 'router' } }))).toMatchObject({ message: 'udp-request', end: 'warned', stamp: 'warned' });
    const closed = applyAction(names, { type: 'addFirewall', deviceId: 'your-laptop', firewall: { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] } });
    const silenced = questionIn(closed);
    expect(silenced.trace.outcome).toBe('timeout');
    expect(flowLook(resultOf(silenced))).toEqual({ message: 'udp-request', intruder: false, end: 'lost', stamp: 'lost' });
    expect(flowLook(resultOf(silenced, { blocked: true }))).toMatchObject({ message: 'udp-request', end: 'blocked', stamp: 'blocked' });
  });
});
