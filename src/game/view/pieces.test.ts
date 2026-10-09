import { describe, expect, it } from 'vitest';
import { MAP_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, S1, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { startSession } from '@/game/session';
import { barrierCard } from './barrier';
import { PIECE_ID } from './piece-id';
import { pieceViews } from './pieces';

const first = startSession(INCIDENTS, '04-01');

describe('pieceViews', () => {
  it('shows both instances locked, both Security Groups open to edit, the attacker and the Internet gateway, each with its term', () => {
    expect(pieceViews(first).map(({ id, term, label, locked, configurable }) => ({ id, term, label, locked, configurable }))).toEqual([
      { id: PIECE_ID.server(S1.id), term: 'ec2-instance', label: S1.id, locked: true, configurable: false },
      { id: PIECE_ID.server(S2.id), term: 'ec2-instance', label: S2.id, locked: true, configurable: false },
      { id: PIECE_ID.barrier(SG.servidor1), term: 'security-group', label: MAP_TEXT.barrier(S1.id), locked: false, configurable: true },
      { id: PIECE_ID.barrier(SG.servidor2), term: 'security-group', label: MAP_TEXT.barrier(S2.id), locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), term: null, label: 'Atacante', locked: false, configurable: false },
      { id: PIECE_ID.gateway, term: 'internet-gateway', label: MAP_TEXT.gateway, locked: true, configurable: false },
    ]);
  });
});

describe('barrierCard', () => {
  it('names the rules of a Security Group with the chips of the incident', () => {
    const second = startSession(INCIDENTS, '04-02');
    expect(barrierCard(second, PIECE_ID.barrier(SG.servidor2))).toEqual({
      sgId: SG.servidor2,
      title: MAP_TEXT.barrier(S2.id),
      rules: [{ id: DAY_SHIFT_RULE.id, what: WHAT.echoReply.label, from: FROM.anywhere.label }],
    });
  });

  it('is null for anything that is not a Security Group', () => {
    expect(barrierCard(first, PIECE_ID.server(S2.id))).toBeNull();
    expect(barrierCard(first, PIECE_ID.barrier('sg-ghost'))).toBeNull();
  });
});
