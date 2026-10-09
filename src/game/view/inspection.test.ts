import { describe, expect, it } from 'vitest';
import { ACTOR_ROLE_TEXT, toPlainText, type TermId } from '@/copy';
import { INCIDENTS } from '@/levels';
import { FLOWS, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { inspect, type Inspection } from './inspection';
import { PIECE_ID } from './piece-id';

const first = startSession(INCIDENTS, '04-01');
const fixed = sessionReducer(first, { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id });

function plain(inspection: Inspection | null) {
  return inspection && { title: toPlainText(inspection.title), fields: inspection.fields.map((f) => [toPlainText(f.label), ...f.lines.map(toPlainText)]) };
}

function knowing(session: Session, ...terms: TermId[]): Session {
  return { ...session, known: new Set([...session.known, ...terms]) };
}

describe('inspect', () => {
  it('a server shows its private IP and its door, and nothing of later terms', () => {
    expect(plain(inspect(first, PIECE_ID.server(S2.id)))).toEqual({
      title: 'servidor2',
      fields: [
        ['IP privada', S2.private],
        ['Security Groups', 'Security Group servidor2'],
      ],
    });
  });

  it('later terms add their fields', () => {
    const fields = plain(inspect(knowing(first, 'public-ip', 'dns'), PIECE_ID.server(S2.id)))?.fields.map(([label]) => label);
    expect(fields).toEqual(['IP privada', 'IP pública', 'Nombres DNS', 'Security Groups']);
  });

  it('a door without rules says it lets nothing in', () => {
    expect(plain(inspect(first, PIECE_ID.barrier(SG.servidor2)))?.fields).toEqual([['Reglas de entrada', 'Ninguna: no deja entrar nada.']]);
  });

  it('a door lists what it lets in as chips', () => {
    expect(plain(inspect(startSession(INCIDENTS, '04-02'), PIECE_ID.barrier(SG.servidor2)))?.fields).toEqual([
      ['Reglas de entrada', 'ICMP · Echo Reply ← Anywhere-IPv4 (0.0.0.0/0)'],
    ]);
  });

  it('a blocked packet says where and why it stopped', () => {
    expect(plain(inspect(first, PIECE_ID.packet(FLOWS.attackerPing.id)))).toEqual({
      title: 'ping de Atacante a servidor2',
      fields: [
        ['Resultado', 'No llegó: no volvió ninguna respuesta.'],
        ['Dónde y por qué se detuvo', 'Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.'],
      ],
    });
  });

  it('a packet that gets its reply has no stop', () => {
    expect(plain(inspect(fixed, PIECE_ID.packet(FLOWS.pingToServer2.id)))?.fields).toEqual([['Resultado', 'Llegó y volvió la respuesta.']]);
  });

  it('the attacker says who it is, but not its IP yet', () => {
    expect(plain(inspect(first, PIECE_ID.actor('attacker')))?.fields).toEqual([['Quién es', toPlainText(ACTOR_ROLE_TEXT.attacker)]]);
  });

  it('the internet entrance explains what it does', () => {
    expect(plain(inspect(first, PIECE_ID.gateway))?.title).toBe('entrada desde internet');
  });

  it('an id that names nothing shows nothing', () => {
    expect(inspect(first, PIECE_ID.server('ghost'))).toBeNull();
    expect(inspect(first, 'nonsense')).toBeNull();
  });
});
