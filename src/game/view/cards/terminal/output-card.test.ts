import { describe, expect, it } from 'vitest';
import { digOutput, ncOutput, type DigResult } from '@/copy';
import type { Network, ServerActor } from '@/engine';
import { NAME_SERVERS, OFFICE_FLOORS, allOut, namesSendIncident, routedSendIncident, tcpService, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { toolOutput, type OutputSegment, type ToolOutput } from './output-card';

const NAMES = namesSendIncident();
const start = startSession([NAMES], NAMES.id);
const { zone, resolver } = NAME_SERVERS;
const { floor1, backbone, server } = OFFICE_FLOORS;
const WWW = `www.${zone}`;
const picks = (to: string, message: string) => ({ from: 'you', to, message });
const sent = (session: Session, to: string, message: string) => sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId: to, messageId: message });
const outputOf = (session: Session, to: string, message: string) => toolOutput(sent(session, to, message), picks(to, message));
const inWorld = (session: Session, change: (world: Network) => Network): Session => ({ ...session, world: change(session.world) });
const listening = (session: Session) => inWorld(session, (world) => withDevice(world, 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [tcpService(3000)] } }));
const behindDroppingFirewall = (session: Session) =>
  inWorld(listening(session), (world) => ({
    ...world,
    firewalls: [{ id: 'fw-lucia', name: 'lucia-laptop', kind: 'host-firewall', inbound: [], outbound: [allOut('fw-lucia-out')] }],
    devices: world.devices.map((device) => (device.id === 'lucia-laptop' ? { ...device, firewallIds: ['fw-lucia'] } : device)),
  }));
const serving = (session: Session) =>
  inWorld(session, (world) => ({
    ...world,
    actors: world.actors.map((actor): typeof actor => (actor.kind === 'server' && actor.id === server.id ? ({ ...actor, services: [tcpService(3000)] } satisfies ServerActor) : actor)),
  }));
const resolverAt = (session: Session, ip: string | undefined) => inWorld(session, (world) => withDevice(world, 'your-laptop', { dnsServer: ip }));
const silentBackbone = (session: Session) =>
  inWorld(session, (world) => ({ ...world, routers: (world.routers ?? []).map((router) => (router.id === backbone.id ? { ...router, sendsUnreachable: false } : router)) }));
const textsOf = (output: ToolOutput | null) =>
  (output?.segments ?? []).flatMap((segment: OutputSegment) => (segment.kind === 'line' ? [segment.text] : segment.lines));
const keyTexts = (output: ToolOutput | null) => (output?.segments ?? []).flatMap((segment) => (segment.kind === 'line' && segment.key ? [segment.text] : []));
const foldedCounts = (output: ToolOutput | null) => (output?.segments ?? []).flatMap((segment) => (segment.kind === 'folded' ? [segment.lines.length] : []));

describe('toolOutput of an nc', () => {
  it('the card lists the lines of the tool as written', () => {
    const open = outputOf(listening(start), 'lucia', 'nc');
    expect(open?.command).toBe('nc');
    expect(textsOf(open)).toEqual(ncOutput({ kind: 'open', ip: floor1.lucia, port: 3000, elapsedMs: 2 }));
    expect(textsOf(outputOf(start, 'lucia', 'nc'))).toEqual(ncOutput({ kind: 'refused' }));
    expect(textsOf(outputOf(behindDroppingFirewall(start), 'lucia', 'nc'))).toEqual(ncOutput({ kind: 'timeout' }));
  });

  it('the output of nc and the output of a traceroute are not folded', () => {
    const output = outputOf(listening(start), 'lucia', 'nc');
    expect(output?.segments.every(({ kind }) => kind === 'line')).toBe(true);
    expect(output?.folded).toBe(0);
    expect(output?.segments.some((segment) => segment.kind === 'line' && segment.key)).toBe(false);
    const ROUTED = routedSendIncident();
    const routed = sessionReducer(startSession([ROUTED], ROUTED.id), { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'trace' });
    expect(toolOutput(routed, picks('server', 'trace'))).toBeNull();
  });

  it('an nc by name prints no line of the lookup of the name and connects to the IP it gave', () => {
    const output = outputOf(serving(start), 'www', 'nc');
    expect(textsOf(output)).toEqual(ncOutput({ kind: 'open', ip: server.ip, port: 3000, elapsedMs: 84 }));
    expect(textsOf(output).filter((line) => /dns|dig|resolv|lucia|www|servidor/i.test(line))).toEqual([]);
    expect(textsOf(outputOf(start, 'www', 'nc'))).toEqual(ncOutput({ kind: 'refused' }));
  });

  it('prints the lines of an nc to the loopback address and nothing for one to the name localhost, which ncat resolves to more than one address', () => {
    const own = { ...NAMES, send: { ...NAMES.send, to: [...NAMES.send.to, { id: 'loopback', address: '127.0.0.1' }, { id: 'localhost', address: 'localhost' }] } };
    const session = startSession([own], own.id);
    expect(textsOf(outputOf(session, 'loopback', 'nc'))).toEqual(ncOutput({ kind: 'refused' }));
    expect(outputOf(session, 'localhost', 'nc')).toBeNull();
  });

  it('prints nothing when the source does not confirm the line: a warning that came back and a name that gave no IP', () => {
    expect(outputOf(start, 'missing', 'nc')).toBeNull();
    expect(outputOf(inWorld(start, (world) => withDevice(world, 'lucia-laptop', { connected: false })), 'lucia', 'nc')).toBeNull();
    expect(toolOutput(start, picks('lucia', 'nc'))).toBeNull();
  });
});

describe('toolOutput of a dig', () => {
  it('the card lists the lines of the tool as written', () => {
    const output = outputOf(start, 'www', 'dig');
    expect(output?.command).toBe('dig');
    const reply: DigResult = { kind: 'reply', name: WWW, status: 'NOERROR', answers: [{ name: WWW, type: 'A', value: server.ip, ttl: 300 }], server: resolver.ip, queryMs: 84, at: 0 };
    expect(textsOf(output)).toEqual(digOutput(reply).map(({ text }) => text));
  });

  it('the output of dig shows only the status line and the answer until the rest is unfolded', () => {
    const output = outputOf(start, 'www', 'dig');
    expect(keyTexts(output)).toEqual([expect.stringContaining('status: NOERROR'), ';; ANSWER SECTION:', expect.stringContaining('198.51.100.50')]);
    expect(outputOf(start, 'missing', 'dig')?.segments.filter((segment) => segment.kind === 'line')).toEqual([{ kind: 'line', text: expect.stringContaining('status: NXDOMAIN'), key: true }]);
  });

  it('a mark between the visible lines says how many lines are folded there', () => {
    const output = outputOf(start, 'www', 'dig');
    expect(output?.segments.map(({ kind }) => kind)).toEqual(['folded', 'line', 'folded', 'line', 'line', 'folded']);
    expect(foldedCounts(output)).toEqual([4, 7, 6]);
    expect(output?.folded).toBe(17);
  });

  it('the folded lines are printed, not dropped', () => {
    const output = outputOf(start, 'missing', 'dig');
    expect(textsOf(output)).toHaveLength(19 + 1);
    expect(textsOf(output)).toContain(`${zone}.\t\t300\tIN\tSOA\tns1.${zone}. hostmaster.${zone}. 2026101101 1800 900 1209600 1200`);
    expect(output?.folded).toBe(19);
  });

  it('prints the date of the game clock and the TTL the answer has left, from the send that was made last', () => {
    const waited = sessionReducer(sent(start, 'www', 'dig'), { type: 'wait', seconds: 60 });
    const output = toolOutput(sent(waited, 'www', 'dig'), picks('www', 'dig'));
    expect(textsOf(output)).toContain(';; WHEN: Sun Oct 11 10:16:00 UTC 2026');
    expect(textsOf(output)).toContain(`${WWW}.\t240\tIN\tA\t${server.ip}`);
  });

  it('a dig that got no answer prints the lines of a timeout or of a refusal, and none of an answer', () => {
    const timeout = outputOf(silentBackbone(resolverAt(start, server.nobody)), 'www', 'dig');
    expect(textsOf(timeout)).toEqual(digOutput({ kind: 'timeout', name: WWW, server: server.nobody }).map(({ text }) => text));
    expect(timeout?.folded).toBe(0);
    const refusal = outputOf(resolverAt(start, server.ip), 'www', 'dig');
    expect(textsOf(refusal)).toEqual(digOutput({ kind: 'refused', name: WWW, server: server.ip }).map(({ text }) => text));
  });

  it('prints nothing for a dig whose result the source does not confirm: a warning from a router and a device with no resolver', () => {
    expect(outputOf(resolverAt(start, server.nobody), 'www', 'dig')).toBeNull();
    expect(outputOf(resolverAt(start, undefined), 'www', 'dig')).toBeNull();
  });

  it('is null until that dig was sent, and for a combination of chips that is no tool', () => {
    expect(toolOutput(start, picks('www', 'dig'))).toBeNull();
    expect(toolOutput(sent(start, 'lucia', 'ping'), picks('lucia', 'ping'))).toBeNull();
  });
});
