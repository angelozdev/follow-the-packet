import { describe, expect, it } from 'vitest';
import { actor, inst, lab03Net, ping } from '@/testing';
import { incidentSchema, ruleIdFor } from './incident';

const VALID: Record<string, unknown> = {
  id: '09-03',
  chapter: 9,
  order: 3,
  title: 'Prueba',
  role: 'defender',
  lesson: 'Una lección',
  concept: 'concepts/una-nota.md',
  introduces: ['ping'],
  base: lab03Net(),
  report: 'El {{ping}} falla.',
  tasks: [{ id: 'task', text: 'Que vuelva el {{ping}}.', flowIds: ['wanted', 'unwanted'] }],
  flows: [
    { id: 'wanted', kind: 'required', packet: ping(inst('servidor1'), '172.31.38.97') },
    { id: 'unwanted', kind: 'forbidden', packet: ping(actor('attacker'), '34.244.254.100') },
  ],
  chips: {
    what: [{ id: 'echo', label: 'Eco', what: { kind: 'icmp', icmpType: 8 } }],
    from: [{ id: 'one', label: 'uno', peer: { kind: 'sg', sgId: 'sg-servidor1' } }],
  },
  hints: ['Primera.', 'Segunda.'],
  explanation: [
    { text: 'A', feedback: 'a', correct: false },
    { text: 'B', feedback: 'b', correct: true },
    { text: 'C', feedback: 'c', correct: false },
  ],
  solution: [{ type: 'placeRule', sgId: 'sg-servidor2', whatId: 'echo', fromId: 'one' }],
  takeaway: 'Una idea.',
};

const BROKEN: [string, Record<string, unknown>][] = [
  ['two correct explanations', { explanation: [{ text: 'A', feedback: 'a', correct: true }, { text: 'B', feedback: 'b', correct: true }, { text: 'C', feedback: 'c', correct: false }] }],
  ['both a base and changes', { changes: [] }],
  ['neither a base nor changes', { base: undefined }],
  ['a task with an unknown flow', { tasks: [{ id: 'task', text: 'x', flowIds: ['wanted', 'unwanted', 'ghost'] }] }],
  ['a forbidden flow outside every task', { tasks: [{ id: 'task', text: 'x', flowIds: ['wanted'] }] }],
  ['a task without a required flow', { tasks: [{ id: 'task', text: 'x', flowIds: ['unwanted'] }, { id: 'other', text: 'y', flowIds: ['wanted'] }] }],
  ['a solution with a chip it does not offer', { solution: [{ type: 'placeRule', sgId: 'sg-servidor2', whatId: 'ghost', fromId: 'one' }] }],
  ['an unknown term tag', { report: 'El {{firewall}} falla.' }],
  ['an unknown introduced term', { introduces: ['firewall'] }],
  ['a term introduced twice', { introduces: ['ping', 'ping'] }],
  ['an id that does not match chapter and order', { id: '09-04' }],
  ['one hint only', { hints: ['Solo una.'] }],
  ['two chips with the same id', { chips: { what: [{ id: 'echo', label: 'Eco', what: { kind: 'icmp', icmpType: 8 } }], from: [{ id: 'one', label: 'uno', peer: { kind: 'sg', sgId: 'sg-servidor1' } }, { id: 'one', label: 'otro', peer: { kind: 'cidr', cidr: '0.0.0.0/0' } }] } }],
];

describe('incident contract', () => {
  it('accepts a complete incident', () => {
    expect(incidentSchema.safeParse(VALID).success).toBe(true);
  });

  it.each(BROKEN)('rejects %s', (_name, patch) => {
    expect(incidentSchema.safeParse({ ...VALID, ...patch }).success).toBe(false);
  });

  it('names a placed rule after its chips', () => {
    expect(ruleIdFor('ping', 'servidor1')).toBe('ping-from-servidor1');
  });
});
