import { describe, expect, it } from 'vitest';
import { MAP_TEXT, type TermId } from '@/copy';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, S1, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { startSession } from '@/game/session';
import { barrierCard } from './barrier';
import { PIECE_ID } from './piece-id';
import { gatewayLabel, pieceViews } from './pieces';

const first = startSession(INCIDENTS, '04-01');

describe('pieceViews', () => {
  it('shows both servers locked, both doors open to edit, the attacker and the internet entrance', () => {
    expect(pieceViews(first).map(({ id, label, locked, configurable }) => ({ id, label, locked, configurable }))).toEqual([
      { id: PIECE_ID.server(S1.id), label: S1.id, locked: true, configurable: false },
      { id: PIECE_ID.server(S2.id), label: S2.id, locked: true, configurable: false },
      { id: PIECE_ID.barrier(SG.servidor1), label: MAP_TEXT.barrier(S1.id), locked: false, configurable: true },
      { id: PIECE_ID.barrier(SG.servidor2), label: MAP_TEXT.barrier(S2.id), locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), label: 'Atacante', locked: false, configurable: false },
      { id: PIECE_ID.gateway, label: MAP_TEXT.gatewayPlain, locked: true, configurable: false },
    ]);
  });

  it('names the internet gateway once its term is known', () => {
    expect(gatewayLabel(new Set<TermId>(['internet-gateway']))).toBe(MAP_TEXT.gateway);
  });
});

describe('barrierCard', () => {
  it('names the rules of a door with the chips of the incident', () => {
    const second = startSession(INCIDENTS, '04-02');
    expect(barrierCard(second, PIECE_ID.barrier(SG.servidor2))).toEqual({
      sgId: SG.servidor2,
      title: MAP_TEXT.barrier(S2.id),
      rules: [{ id: DAY_SHIFT_RULE.id, what: WHAT.echoReply.label, from: FROM.anywhere.label }],
    });
  });

  it('is null for anything that is not a door', () => {
    expect(barrierCard(first, PIECE_ID.server(S2.id))).toBeNull();
    expect(barrierCard(first, PIECE_ID.barrier('sg-ghost'))).toBeNull();
  });
});
