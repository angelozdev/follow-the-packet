import { describe, expect, it } from 'vitest';
import { INCIDENTS, type MessageChip, type SendIncident } from '@/levels';
import { diagnoseIncident, gatewayIncident, namesSendIncident, sendIncident } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { terminalCard, terminalLine } from './terminal-card';

const SENDING = sendIncident();
const session = startSession([SENDING], SENDING.id);
const YOURS = PIECE_ID.device('your-laptop');

function withTrays(send: Partial<SendIncident['send']>): Session {
  const incident = { ...SENDING, send: { ...SENDING.send, ...send } };
  return startSession([incident], incident.id);
}

describe('terminalCard', () => {
  it('opens from an origin with its title, the origin, every tray with a choice and where each origin sits', () => {
    expect(terminalCard(session, YOURS)).toEqual({
      fromId: 'you',
      title: 'Terminal de [[your-laptop]]',
      trays: [
        { name: 'from', chips: [{ id: 'you', label: '[[your-laptop]]' }, { id: 'attacker', label: '[[Atacante]]' }] },
        { name: 'to', chips: [{ id: 'printer', label: '192.168.1.20' }, { id: 'lucia', label: '192.168.1.11' }, { id: 'nobody', label: '192.168.1.30' }] },
        { name: 'message', chips: [{ id: 'ping', label: '{{ping}}' }, { id: 'reply', label: '{{echo-reply}}' }] },
      ],
      fixed: {},
      origins: { you: YOURS, attacker: PIECE_ID.actor('attacker') },
    });
  });

  it('opens from an actor that is an origin too', () => {
    expect(terminalCard(session, PIECE_ID.actor('attacker'))?.fromId).toBe('attacker');
  });

  it('a tray with a single chip is fixed: it is not shown and its chip is always picked', () => {
    const card = terminalCard(withTrays({ from: [SENDING.send.from[0]], message: [SENDING.send.message[0]] }), YOURS);
    expect(card?.trays.map((tray) => tray.name)).toEqual(['to']);
    expect(card?.fixed).toEqual({ from: 'you', message: 'ping' });
  });

  it('is null for a piece that is not an origin, and in an incident that does not send', () => {
    expect(terminalCard(session, PIECE_ID.device('printer'))).toBeNull();
    expect(terminalCard(startSession(INCIDENTS, '04-01'), PIECE_ID.device('servidor1'))).toBeNull();
  });
});

describe('terminalCard of a device that has settings', () => {
  const GATEWAY = gatewayIncident();
  const settings = startSession([GATEWAY], GATEWAY.id);

  it('the terminal of a device shows no setting tray, even when the incident offers settings for it', () => {
    expect(GATEWAY.send.settings?.map((setting) => setting.deviceId)).toEqual(['your-laptop']);
    expect(terminalCard(settings, YOURS)).toEqual({
      fromId: 'you',
      title: 'Terminal de [[tu-laptop]]',
      trays: [{ name: 'to', chips: [{ id: 'printer', label: '192.168.1.21' }, { id: 'andres', label: '192.168.2.15' }] }],
      fixed: { from: 'you', message: 'ping' },
      origins: { you: YOURS },
    });
    expect(terminalLine(settings, { to: 'andres', message: 'ping' })).toBe('ping 192.168.2.15');
  });

  it('opens from the piece of the device, the only button its label has, and from no other id', () => {
    expect(terminalCard(settings, PIECE_ID.device('your-laptop'))).not.toBeNull();
    expect(terminalCard(settings, 'settings:your-laptop')).toBeNull();
  });
});

describe('terminalLine', () => {
  it('an Echo Request is the real ping command', () => {
    expect(terminalLine(session, { to: 'printer', message: 'ping' })).toBe('ping 192.168.1.20');
  });

  it('an Echo Reply is a packet made by hand: no common command sends it', () => {
    expect(terminalLine(session, { to: 'lucia', message: 'reply' })).toBe('paquete armado a mano: {{echo-reply}} → 192.168.1.11');
  });

  it('is null until an address and a message are picked', () => {
    expect(terminalLine(session, { to: 'printer' })).toBeNull();
    expect(terminalLine(session, { message: 'ping' })).toBeNull();
  });
});

describe('terminalLine of a message with a command', () => {
  const PING_TTL_3: MessageChip = { id: 'ping-3', label: 'TTL 3', icmpType: 8, command: 'ping', ttl: 3 };
  const PING_PLAIN: MessageChip = { id: 'ping-plain', label: 'ping', icmpType: 8, command: 'ping' };
  const TRACEROUTE: MessageChip = { id: 'trace', label: 'traceroute', icmpType: 8, command: 'traceroute' };
  const PACKET: MessageChip = { id: 'raw', label: '{{echo-request}}', icmpType: 8, command: 'packet' };
  const commanded = withTrays({ message: [PING_TTL_3, PING_PLAIN, TRACEROUTE, PACKET] });

  it('the line of a ping with a TTL uses the option -t of Linux', () => {
    expect(terminalLine(commanded, { to: 'printer', message: 'ping-3' })).toBe('ping -t 3 192.168.1.20');
  });

  it('the line of a ping without a TTL is the plain command', () => {
    expect(terminalLine(commanded, { to: 'printer', message: 'ping-plain' })).toBe('ping 192.168.1.20');
  });

  it('the line of a traceroute is the Linux command with -I, because the engine sends ICMP Echo', () => {
    expect(terminalLine(commanded, { to: 'lucia', message: 'trace' })).toBe('traceroute -I 192.168.1.11');
  });

  it('the line of a packet message does not say ping', () => {
    const line = terminalLine(commanded, { from: 'you', to: 'lucia', message: 'raw' });
    expect(line).toBe('paquete de [[your-laptop]] a 192.168.1.11');
    expect(line).not.toMatch(/ping/i);
  });

  it('the line of a packet message names the origin that was picked', () => {
    expect(terminalLine(commanded, { from: 'attacker', to: 'lucia', message: 'raw' })).toBe('paquete de [[Atacante]] a 192.168.1.11');
  });

  it('the line of a packet message is null until its origin is picked too', () => {
    expect(terminalLine(commanded, { to: 'lucia', message: 'raw' })).toBeNull();
    expect(terminalLine(commanded, { from: 'ghost', to: 'lucia', message: 'raw' })).toBeNull();
  });

  it('a message of type 8 with a command that is a packet is still a packet and not a ping', () => {
    expect(terminalLine(commanded, { from: 'you', to: 'printer', message: 'raw' })).not.toMatch(/ping/i);
  });
});


describe('terminalLine of an nc and a dig', () => {
  const NAMES = namesSendIncident();
  const names = startSession([NAMES], NAMES.id);

  it('the line of an nc uses -vz and -w 3 in the Linux syntax', () => {
    expect(terminalLine(names, { to: 'lucia', message: 'nc' })).toBe('nc -vz -w 3 192.168.1.11 3000');
    expect(terminalLine(names, { to: 'www', message: 'nc' })).toBe('nc -vz -w 3 www.lucia.example 3000');
  });

  it('the line of a dig names the name and no server', () => {
    expect(terminalLine(names, { to: 'www', message: 'dig' })).toBe('dig www.lucia.example');
    expect(terminalLine(names, { to: 'missing', message: 'dig' })).not.toContain('@');
  });

  it('is null until an address is picked, as for any other message', () => {
    expect(terminalLine(names, { message: 'nc' })).toBeNull();
    expect(terminalLine(names, { message: 'dig' })).toBeNull();
  });
});

describe('terminalCard of a diagnose incident', () => {
  const DIAGNOSE = diagnoseIncident();
  const first = startSession([DIAGNOSE], DIAGNOSE.id);
  const pieceOfOrigin = PIECE_ID.device('your-laptop');
  const rightOfFirst = DIAGNOSE.diagnose.cases[0].cause.options.findIndex((option) => option.correct);
  const second = [{ type: 'nameCause', index: rightOfFirst } as const, { type: 'nextCase' } as const].reduce(sessionReducer, first);

  it('offers the chips of the case the incident is on', () => {
    const card = terminalCard(first, pieceOfOrigin);
    expect(card?.fromId).toBe('origin');
    expect(card?.fixed).toEqual({ from: 'origin', message: 'ping' });
    expect(card?.trays.map((tray) => [tray.name, tray.chips.map((chip) => chip.id)])).toEqual([['to', ['loopback', 'own', 'gateway', 'server']]]);
    expect(terminalCard(second, pieceOfOrigin)?.trays[0].chips.map((chip) => chip.id)).toEqual(['typo', 'printer']);
  });

  it('prints the line of a chip of the case, and none for a chip of another case', () => {
    expect(terminalLine(first, { from: 'origin', to: 'gateway', message: 'ping' })).toBe('ping 192.168.1.1');
    expect(terminalLine(first, { from: 'origin', to: 'typo', message: 'ping' })).toBeNull();
    expect(terminalLine(second, { from: 'origin', to: 'typo', message: 'ping' })).toBe('ping 192.168.1.22');
  });
});
