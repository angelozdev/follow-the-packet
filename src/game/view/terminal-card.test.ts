import { describe, expect, it } from 'vitest';
import { INCIDENTS, type SendIncident } from '@/levels';
import { sendIncident } from '@/testing';
import { startSession, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';
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
