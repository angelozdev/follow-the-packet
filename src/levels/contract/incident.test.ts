import { describe, expect, it } from 'vitest';
import { actor, device, lab03Net, officeNet, ping, sendIncident } from '@/testing';
import { officeLeaks, packetFromChips } from './chips';
import { incidentSchema, ruleIdFor } from './incident';

const SEND = sendIncident();
const VALID: Record<string, unknown> = {
  id: '09-03',
  chapter: 9,
  order: 3,
  title: 'Prueba',
  role: 'defender',
  mechanic: 'filter',
  lesson: 'Una lección',
  concept: 'concepts/una-nota.md',
  introduces: ['ping'],
  base: lab03Net(),
  report: 'El {{ping}} falla.',
  tasks: [{ id: 'task', text: 'Que vuelva el {{ping}}.', flowIds: ['wanted', 'unwanted'] }],
  flows: [
    { id: 'wanted', kind: 'required', packet: ping(device('servidor1'), '172.31.38.97') },
    { id: 'unwanted', kind: 'forbidden', packet: ping(actor('attacker'), '34.244.254.100') },
  ],
  chips: {
    what: [{ id: 'echo', label: 'Eco', what: { kind: 'icmp', icmpType: 8 } }],
    from: [{ id: 'one', label: 'uno', peer: { kind: 'sg', sgId: 'sg-servidor1' } }],
  },
  hints: SEND.hints,
  explanation: SEND.explanation,
  solution: [{ type: 'placeRule', firewallId: 'sg-servidor2', whatId: 'echo', fromId: 'one' }],
  takeaway: 'Una idea.',
};

const BROKEN: [string, Record<string, unknown>][] = [
  ['two correct explanations', { explanation: [{ text: 'A', feedback: 'a', correct: true }, { text: 'B', feedback: 'b', correct: true }, { text: 'C', feedback: 'c', correct: false }] }],
  ['both a base and changes', { changes: [] }],
  ['neither a base nor changes', { base: undefined }],
  ['a task with an unknown flow', { tasks: [{ id: 'task', text: 'x', flowIds: ['wanted', 'unwanted', 'ghost'] }] }],
  ['a forbidden flow outside every task', { tasks: [{ id: 'task', text: 'x', flowIds: ['wanted'] }] }],
  ['a task without a required flow', { tasks: [{ id: 'task', text: 'x', flowIds: ['unwanted'] }, { id: 'other', text: 'y', flowIds: ['wanted'] }] }],
  ['a solution with a chip it does not offer', { solution: [{ type: 'placeRule', firewallId: 'sg-servidor2', whatId: 'ghost', fromId: 'one' }] }],
  ['an unknown term tag', { report: 'La {{puerta}} falla.' }],
  ['a term tag with capitals', { report: 'La {{Security-Group}} falla.' }],
  ['a term tag with an underscore', { report: 'La {{security_group}} falla.' }],
  ['a term tag with an empty word', { report: 'La {{rule|}} falla.' }],
  ['a term tag with spaces inside', { report: 'La {{ security-group }} falla.' }],
  ['a term tag opened inside the words', { report: 'La {{rule|a {{b}} falla.' }],
  ['an unknown introduced term', { introduces: ['puerta'] }],
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

  it('says which tag is wrong', () => {
    const result = incidentSchema.safeParse({ ...VALID, report: 'La {{rule|}} falla.' });
    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toEqual(['malformed term tag: {{rule|}}']);
  });

  it('names a placed rule after its chips', () => {
    expect(ruleIdFor('ping', 'servidor1')).toBe('ping-from-servidor1');
  });
});

const SEND_BROKEN: [string, Record<string, unknown>][] = [
  ['a send task with a chip it does not offer', { tasks: [{ ...SEND.tasks[0], expect: { ...SEND.tasks[0].expect, toId: 'ghost' } }] }],
  ['a send solution with a chip it does not offer', { solution: [{ type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ghost' }] }],
  ['a send solution that places a rule', { solution: [{ type: 'placeRule', firewallId: 'fw-lucia', whatId: 'echo', fromId: 'one' }] }],
  ['a flow that is not ambient', { flows: [{ id: 'wanted', kind: 'required', packet: ping(device('your-laptop'), '192.168.1.20') }] }],
  ['two origin chips with the same id', { send: { ...SEND.send, from: [SEND.send.from[0], SEND.send.from[0]] } }],
  ['an empty tray', { send: { ...SEND.send, message: [] } }],
  ['a message that is not an Echo Request or an Echo Reply', { send: { ...SEND.send, message: [{ id: 'other', label: 'Otro', icmpType: 3 }] } }],
];

describe('send incident contract', () => {
  it('accepts a send incident with ambient flows only', () => {
    expect(incidentSchema.safeParse(SEND).success).toBe(true);
    expect(incidentSchema.safeParse({ ...SEND, flows: [{ id: 'noise', kind: 'ambient', packet: ping(device('printer'), '192.168.1.11') }] }).success).toBe(true);
  });

  it.each(SEND_BROKEN)('rejects %s', (_name, patch) => {
    expect(incidentSchema.safeParse({ ...SEND, ...patch }).success).toBe(false);
  });

  it('builds the packet of three chips', () => {
    expect(packetFromChips(SEND, { fromId: 'you', toId: 'lucia', messageId: 'reply' })).toEqual({ from: device('your-laptop'), to: '192.168.1.11', protocol: 'icmp', icmpType: 0 });
    expect(packetFromChips(SEND, { fromId: 'you', toId: 'ghost', messageId: 'reply' })).toBeNull();
  });
});

describe('office leaks', () => {
  it('a chip that sends from the office to an address outside it is a leak, and from the internet it is not', () => {
    const leaking = { ...SEND, send: { ...SEND.send, to: [...SEND.send.to, { id: 'dns', address: '8.8.8.8' }] } };
    expect(officeLeaks(SEND, officeNet())).toEqual([]);
    expect(officeLeaks(leaking, officeNet())).toEqual(['your-laptop → 8.8.8.8', 'your-laptop → 8.8.8.8']);
  });

  it('a flow from the office to an address outside it is a leak, and a VPC has none', () => {
    const leaking = { ...SEND, flows: [{ id: 'out', kind: 'ambient' as const, packet: ping(device('printer'), '8.8.8.8') }] };
    expect(officeLeaks(leaking, officeNet())).toEqual(['printer → 8.8.8.8']);
    expect(officeLeaks(leaking, lab03Net())).toEqual([]);
  });
});
