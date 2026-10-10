import { describe, expect, it } from 'vitest';
import { NOTE_RULE, OFFICE_FLOORS, actor, device, identifyIncident, lab03Net, officeNet, officeTwoFloorsNet, ping, sendIncident } from '@/testing';
import { officeLeaks, packetFromChips, probeFromChips, unknownCardDeviceIds } from './chips';
import { incidentSchema, ruleIdFor, type MessageChip, type SendIncident } from './incident';

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

const PING_TTL_3 = { id: 'ping-3', label: 'TTL 3', icmpType: 8, command: 'ping', ttl: 3 } satisfies MessageChip;
const TRACEROUTE = { id: 'trace', label: 'traceroute', icmpType: 8, command: 'traceroute' } satisfies MessageChip;
const SERVER = { id: 'server', address: OFFICE_FLOORS.server.ip };

function withMessages(...message: MessageChip[]): SendIncident {
  return { ...SEND, send: { ...SEND.send, message: [...SEND.send.message, ...message] } };
}

function withMessage(message: Record<string, unknown>) {
  return { ...SEND, send: { ...SEND.send, message: [...SEND.send.message, message] } };
}

function expecting(outcome: string, by?: string) {
  return { ...SEND, tasks: [{ ...SEND.tasks[0], expect: { ...SEND.tasks[0].expect, outcome, by } }] };
}

describe('send task expectations', () => {
  it.each(['unreachable', 'ttl-exceeded', 'timeout', 'no-route', 'invalid-address', 'reached', 'any', 'replied'])('accepts %s as the expected outcome', (outcome) => {
    expect(incidentSchema.safeParse(expecting(outcome)).success).toBe(true);
  });

  it('accepts an expected outcome that is a warning, a silence or a local error', () => {
    expect(incidentSchema.safeParse(expecting('unreachable', 'your-laptop')).success).toBe(true);
    expect(incidentSchema.safeParse(expecting('timeout', 'fw-lucia')).success).toBe(true);
    expect(incidentSchema.safeParse(expecting('no-route')).success).toBe(true);
  });

  it('rejects an expected outcome that no packet can have', () => {
    expect(incidentSchema.safeParse(expecting('banana')).success).toBe(false);
  });

  it('rejects an empty id of whoever answers', () => {
    expect(incidentSchema.safeParse(expecting('replied', '')).success).toBe(false);
  });
});

describe('message chips', () => {
  it('rejects a ping with a TTL outside 1 to 255', () => {
    for (const ttl of [0, 256, -1, 1.5]) {
      expect(incidentSchema.safeParse(withMessage({ ...PING_TTL_3, ttl })).success).toBe(false);
    }
    for (const ttl of [1, 255]) {
      expect(incidentSchema.safeParse(withMessage({ ...PING_TTL_3, ttl })).success).toBe(true);
    }
  });

  it('rejects a TTL on a message that is not a ping', () => {
    expect(incidentSchema.safeParse(withMessage({ ...TRACEROUTE, ttl: 3 })).success).toBe(false);
    expect(incidentSchema.safeParse(withMessage({ ...PING_TTL_3, command: 'packet' })).success).toBe(false);
    expect(incidentSchema.safeParse(withMessage({ id: 'bare', label: 'Eco', icmpType: 8, ttl: 3 })).success).toBe(false);
  });

  it('rejects a ping or a traceroute that is not an Echo Request', () => {
    expect(incidentSchema.safeParse(withMessage({ ...PING_TTL_3, icmpType: 0, ttl: undefined })).success).toBe(false);
    expect(incidentSchema.safeParse(withMessage({ ...TRACEROUTE, icmpType: 0 })).success).toBe(false);
  });

  it('rejects a command that is not a packet, a ping or a traceroute', () => {
    expect(incidentSchema.safeParse(withMessage({ ...TRACEROUTE, command: 'curl' })).success).toBe(false);
  });

  it('accepts a ping with a TTL, a traceroute and a packet by hand', () => {
    expect(incidentSchema.safeParse(withMessages(PING_TTL_3, TRACEROUTE, { id: 'raw', label: 'Eco', icmpType: 0, command: 'packet' })).success).toBe(true);
  });

  it('builds the packet of three chips with the TTL of the message chip', () => {
    const incident = withMessages(PING_TTL_3);
    expect(packetFromChips(incident, { fromId: 'you', toId: 'printer', messageId: 'ping-3' })).toEqual({ from: device('your-laptop'), to: '192.168.1.20', protocol: 'icmp', icmpType: 8, ttl: 3 });
    expect(packetFromChips(incident, { fromId: 'you', toId: 'printer', messageId: 'ping' })).not.toHaveProperty('ttl');
  });

  it('a traceroute message builds no single packet', () => {
    const incident = withMessages(TRACEROUTE);
    expect(packetFromChips(incident, { fromId: 'you', toId: 'printer', messageId: 'trace' })).toBeNull();
  });

  it('a traceroute message stands for the Echo Request its probes repeat, and no other message does', () => {
    const incident = withMessages(TRACEROUTE, PING_TTL_3);
    expect(probeFromChips(incident, { fromId: 'you', toId: 'printer', messageId: 'trace' })).toEqual({ from: device('your-laptop'), to: '192.168.1.20', protocol: 'icmp', icmpType: 8 });
    expect(probeFromChips(incident, { fromId: 'you', toId: 'printer', messageId: 'ping-3' })).toBeNull();
    expect(probeFromChips(incident, { fromId: 'you', toId: 'ghost', messageId: 'trace' })).toBeNull();
  });
});

describe('shown pieces', () => {
  const SHOWN = ['your-laptop', OFFICE_FLOORS.officeRouter.id, OFFICE_FLOORS.server.id];

  it('accepts an incident with a list of shown ids and one without it', () => {
    expect(incidentSchema.safeParse({ ...SEND, shown: SHOWN }).success).toBe(true);
    expect(incidentSchema.safeParse({ ...VALID, shown: ['servidor1'] }).success).toBe(true);
    expect(incidentSchema.safeParse(SEND).success).toBe(true);
    expect(SEND).not.toHaveProperty('shown');
  });

  it('rejects a list of shown ids with a repeated id', () => {
    expect(incidentSchema.safeParse({ ...SEND, shown: [...SHOWN, SHOWN[0]] }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...VALID, shown: ['servidor1', 'servidor1'] }).success).toBe(false);
  });

  it('rejects a list that is empty or holds an empty id', () => {
    expect(incidentSchema.safeParse({ ...SEND, shown: [] }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...SEND, shown: [''] }).success).toBe(false);
  });
});

describe('office leaks', () => {
  it('a packet that leaves an office with no router is a leak; with a router it is allowed', () => {
    const toDns = { ...SEND, send: { ...SEND.send, to: [...SEND.send.to, { id: 'dns', address: '8.8.8.8' }] } };
    expect(officeLeaks(toDns, officeNet())).toEqual(['your-laptop → 8.8.8.8', 'your-laptop → 8.8.8.8']);
    expect(officeLeaks(toDns, officeTwoFloorsNet())).toEqual([]);
    const flowOut = { ...SEND, flows: [{ id: 'out', kind: 'ambient' as const, packet: ping(device('printer'), '8.8.8.8') }] };
    expect(officeLeaks(flowOut, officeNet())).toEqual(['printer → 8.8.8.8']);
    expect(officeLeaks(flowOut, officeTwoFloorsNet())).toEqual([]);
  });

  it('the probes of a traceroute count as packets that leave the office', () => {
    const tracing = { ...SEND, send: { ...SEND.send, to: [SERVER], message: [TRACEROUTE] } };
    expect(officeLeaks(tracing, officeNet())).toEqual([`your-laptop → ${OFFICE_FLOORS.server.ip}`]);
    expect(officeLeaks(tracing, officeTwoFloorsNet())).toEqual([]);
  });

  it('a chip that sends from the office with no router to an address outside it is a leak, and from the internet it is not', () => {
    const leaking = { ...SEND, send: { ...SEND.send, to: [...SEND.send.to, { id: 'dns', address: '8.8.8.8' }] } };
    expect(officeLeaks(SEND, officeNet())).toEqual([]);
    expect(officeLeaks(leaking, officeNet())).toEqual(['your-laptop → 8.8.8.8', 'your-laptop → 8.8.8.8']);
  });

  it('a flow from the office with no router to an address outside it is a leak, and a VPC has none', () => {
    const leaking = { ...SEND, flows: [{ id: 'out', kind: 'ambient' as const, packet: ping(device('printer'), '8.8.8.8') }] };
    expect(officeLeaks(leaking, officeNet())).toEqual(['printer → 8.8.8.8']);
    expect(officeLeaks(leaking, lab03Net())).toEqual([]);
  });
});

describe('identify incident contract', () => {
  const IDENTIFY = identifyIncident();
  const [guest, printer] = IDENTIFY.identify.cards;
  const [ipTray] = printer.trays;
  const withPrinterTray = (patch: Record<string, unknown>) => ({ ...IDENTIFY, identify: { cards: [guest, { ...printer, trays: [{ ...ipTray, ...patch }] }] } });

  it('accepts an identify incident', () => {
    expect(incidentSchema.safeParse(IDENTIFY).success).toBe(true);
    expect(IDENTIFY).not.toHaveProperty('send');
  });

  it('rejects an identify task whose chip the card does not offer', () => {
    const task = IDENTIFY.tasks[1];
    for (const expectation of [{ chipId: 'ghost' }, { trayId: 'ghost' }, { deviceId: 'lucia-laptop' }]) {
      const tasks = [IDENTIFY.tasks[0], { ...task, expect: { ...task.expect, ...expectation } }];
      expect(incidentSchema.safeParse({ ...IDENTIFY, tasks }).success).toBe(false);
    }
  });

  it('rejects a solution that answers with a chip the card does not offer', () => {
    expect(incidentSchema.safeParse({ ...IDENTIFY, solution: [{ type: 'answerCard', deviceId: 'printer', picks: { ip: 'ghost' } }] }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...IDENTIFY, solution: [{ type: 'answerCard', deviceId: 'ghost', picks: { ip: 'right' } }] }).success).toBe(false);
  });

  it('rejects two cards for the same device', () => {
    expect(incidentSchema.safeParse({ ...IDENTIFY, identify: { cards: [guest, guest] } }).success).toBe(false);
  });

  it('rejects two trays with the same id on a card, and two chips with the same id in a tray', () => {
    expect(incidentSchema.safeParse({ ...IDENTIFY, identify: { cards: [guest, { ...printer, trays: [ipTray, ipTray] }] } }).success).toBe(false);
    expect(incidentSchema.safeParse(withPrinterTray({ chips: [ipTray.chips[0], ipTray.chips[0]] })).success).toBe(false);
  });

  it('rejects a tray with a single chip, which leaves nothing to choose', () => {
    expect(incidentSchema.safeParse(withPrinterTray({ chips: [ipTray.chips[0]], initialPick: undefined, initialPickRule: undefined })).success).toBe(false);
  });

  it('rejects an identify incident that sends something', () => {
    expect(incidentSchema.safeParse({ ...IDENTIFY, flows: [{ id: 'noise', kind: 'ambient', packet: ping(device('printer'), '192.168.1.12') }] }).success).toBe(false);
  });

  it('accepts a tray that starts with a chip already picked', () => {
    expect(ipTray.initialPick).toBe('note');
    expect(incidentSchema.safeParse(withPrinterTray({ initialPick: 'note', initialPickRule: undefined })).success).toBe(true);
    expect(incidentSchema.safeParse(withPrinterTray({ initialPick: undefined, initialPickRule: undefined })).success).toBe(true);
  });

  it('rejects an initial pick that names no chip of its tray', () => {
    expect(incidentSchema.safeParse(withPrinterTray({ initialPick: 'ghost' })).success).toBe(false);
  });

  it('accepts a tray with the rule of its initial pick', () => {
    expect(ipTray.initialPickRule).toBe(NOTE_RULE);
    expect(incidentSchema.safeParse(withPrinterTray({ initialPick: 'note', initialPickRule: NOTE_RULE })).success).toBe(true);
  });

  it('rejects an initial pick rule on a tray with no initial pick', () => {
    expect(incidentSchema.safeParse(withPrinterTray({ initialPick: undefined, initialPickRule: NOTE_RULE })).success).toBe(false);
  });

  it('accepts a segmented tray of two chips and rejects one of three', () => {
    expect(guest.trays[0].segmented).toBe(true);
    expect(incidentSchema.safeParse(withPrinterTray({ segmented: true })).success).toBe(false);
  });

  it('lists the cards that name no device of the world', () => {
    expect(unknownCardDeviceIds(IDENTIFY, IDENTIFY.base ?? officeTwoFloorsNet())).toEqual([]);
    expect(unknownCardDeviceIds(IDENTIFY, officeNet())).toEqual(['guest-laptop']);
    expect(unknownCardDeviceIds(sendIncident(), officeNet())).toEqual([]);
  });
});
