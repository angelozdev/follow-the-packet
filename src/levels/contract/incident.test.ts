import { describe, expect, it } from 'vitest';
import { NOTE_RULE, OFFICE_FLOORS, actor, device, diagnoseIncident, gatewayIncident, identifyIncident, lab03Net, officeNet, officeTwoFloorsNet, outboundFilterIncident, ping, sendIncident } from '@/testing';
import { missingShownIds, officeLeaks, packetFromChips, probeFromChips, sendCombinations, unknownCardDeviceIds } from './chips';
import { incidentSchema, isGuided, playerMoveSchema, ruleIdFor, type MessageChip, type SendIncident } from './incident';

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

const OUTBOUND = outboundFilterIncident();
const OUTBOUND_MOVE = { type: 'placeRule', firewallId: 'fw-you', whatId: 'echo-request', toId: 'to-lucia', direction: 'outbound' };
const INBOUND_MOVE = { type: 'placeRule', firewallId: 'fw-you', whatId: 'echo-request', fromId: 'from-lucia' };

describe('outbound rules in the contract', () => {
  it('accepts outbound chips and a placeRule with a direction', () => {
    expect(OUTBOUND.chips.to?.map((chip) => chip.id)).toEqual(['to-lucia', 'to-printer']);
    expect(incidentSchema.safeParse(OUTBOUND).success).toBe(true);
    expect(playerMoveSchema.safeParse(OUTBOUND_MOVE).success).toBe(true);
    expect(playerMoveSchema.safeParse({ ...OUTBOUND_MOVE, direction: 'inbound', toId: undefined, fromId: 'from-lucia' }).success).toBe(true);
    expect(playerMoveSchema.safeParse(INBOUND_MOVE).success).toBe(true);
    expect(playerMoveSchema.safeParse({ type: 'removeRule', firewallId: 'fw-you', ruleId: 'rule', direction: 'outbound' }).success).toBe(true);
    expect(incidentSchema.safeParse({ ...OUTBOUND, solution: [INBOUND_MOVE, OUTBOUND_MOVE] }).success).toBe(true);
  });

  it('rejects an outbound move without a destination chip', () => {
    expect(playerMoveSchema.safeParse({ ...OUTBOUND_MOVE, toId: undefined }).success).toBe(false);
    expect(playerMoveSchema.safeParse({ ...OUTBOUND_MOVE, toId: undefined, fromId: 'from-lucia' }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...OUTBOUND, solution: [{ ...OUTBOUND_MOVE, toId: undefined }] }).success).toBe(false);
  });

  it('rejects a move that names the chip of the other direction too, or an inbound move without a source chip', () => {
    expect(playerMoveSchema.safeParse({ ...OUTBOUND_MOVE, fromId: 'from-lucia' }).success).toBe(false);
    expect(playerMoveSchema.safeParse({ ...INBOUND_MOVE, toId: 'to-lucia' }).success).toBe(false);
    expect(playerMoveSchema.safeParse({ ...INBOUND_MOVE, fromId: undefined }).success).toBe(false);
  });

  it('rejects a solution that uses a destination chip the incident does not offer, or one when it offers none', () => {
    expect(incidentSchema.safeParse({ ...OUTBOUND, solution: [{ ...OUTBOUND_MOVE, toId: 'to-ghost' }] }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...OUTBOUND, solution: [{ ...OUTBOUND_MOVE, toId: 'from-lucia' }] }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...OUTBOUND, chips: { ...OUTBOUND.chips, to: undefined } }).success).toBe(false);
  });

  it('rejects two destination chips with the same id and an empty destination tray', () => {
    const [first] = OUTBOUND.chips.to ?? [];
    expect(incidentSchema.safeParse({ ...OUTBOUND, chips: { ...OUTBOUND.chips, to: [first, first] } }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...OUTBOUND, chips: { ...OUTBOUND.chips, to: [] } }).success).toBe(false);
  });

  it('names the id of an outbound rule after its destination, apart from an inbound one with the same chips', () => {
    expect(ruleIdFor('ping', 'lucia')).toBe('ping-from-lucia');
    expect(ruleIdFor('ping', 'lucia', 'inbound')).toBe('ping-from-lucia');
    expect(ruleIdFor('ping', 'lucia', 'outbound')).toBe('ping-to-lucia');
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

describe('send settings contract', () => {
  const GATEWAY = gatewayIncident();
  const [gateway] = GATEWAY.send.settings ?? [];
  const withSettings = (settings: unknown) => ({ ...GATEWAY, send: { ...GATEWAY.send, settings } });
  const withChips = (chips: unknown) => withSettings([{ ...gateway, chips }]);
  const [none, router] = gateway.chips;

  it('accepts a gateway setting with its chips', () => {
    expect(incidentSchema.safeParse(GATEWAY).success).toBe(true);
    expect(gateway.chips.map((chip) => chip.value)).toEqual([null, OFFICE_FLOORS.floor1.gateway, OFFICE_FLOORS.floor1.printer, OFFICE_FLOORS.floor1.nobody]);
    expect(incidentSchema.safeParse({ ...GATEWAY, send: { ...GATEWAY.send, settings: undefined }, solution: [GATEWAY.solution[1]] }).success).toBe(true);
  });

  it('rejects a setting for a device that is not an origin', () => {
    expect(incidentSchema.safeParse(withSettings([{ ...gateway, deviceId: 'printer' }])).success).toBe(false);
    expect(incidentSchema.safeParse(withSettings([{ ...gateway, deviceId: 'ghost' }])).success).toBe(false);
  });

  it('rejects a setting for an actor that is an origin, because only a device has a gateway', () => {
    const fromActor = { ...GATEWAY.send, from: [...GATEWAY.send.from, { id: 'server', endpoint: actor('internet-server') }] };
    expect(incidentSchema.safeParse({ ...GATEWAY, send: { ...fromActor, settings: [{ ...gateway, deviceId: 'internet-server' }] } }).success).toBe(false);
  });

  it('rejects a chip whose value is not an IPv4 address, two chips with the same id and a tray with a single chip', () => {
    expect(incidentSchema.safeParse(withChips([none, { ...router, value: '192.168.1.300' }])).success).toBe(false);
    expect(incidentSchema.safeParse(withChips([none, { ...router, id: none.id }])).success).toBe(false);
    expect(incidentSchema.safeParse(withChips([router])).success).toBe(false);
    expect(incidentSchema.safeParse(withSettings([])).success).toBe(false);
  });

  it('rejects the same setting twice for a device, and two chips with the same value', () => {
    expect(incidentSchema.safeParse(withSettings([gateway, gateway])).success).toBe(false);
    expect(incidentSchema.safeParse(withChips([none, { ...router, value: null }])).success).toBe(false);
  });

  it('accepts a solution that sets a setting the incident offers, and rejects one it does not', () => {
    const [set, send] = GATEWAY.solution;
    expect(set).toMatchObject({ type: 'setSetting' });
    for (const patch of [{ chipId: 'ghost' }, { settingId: 'ghost' }, { deviceId: 'printer' }]) {
      expect(incidentSchema.safeParse({ ...GATEWAY, solution: [{ ...set, ...patch }, send] }).success).toBe(false);
    }
  });

  it('keeps a send solution from placing a rule or answering a card', () => {
    const [set, send] = GATEWAY.solution;
    expect(incidentSchema.safeParse({ ...GATEWAY, solution: [set, send, { type: 'answerCard', deviceId: 'your-laptop', picks: {} }] }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...GATEWAY, solution: [set, send, { type: 'placeRule', firewallId: 'fw', whatId: 'a', fromId: 'b' }] }).success).toBe(false);
  });
});

describe('diagnose incident contract', () => {
  const DIAGNOSE = diagnoseIncident();
  const SEVEN = 7;
  const [first, ...others] = DIAGNOSE.diagnose.cases;
  const withCases = (...cases: unknown[]) => ({ ...DIAGNOSE, diagnose: { cases } });
  const withFirst = (patch: Record<string, unknown>) => withCases({ ...first, ...patch }, ...others);
  const { options } = first.cause;
  const withOptions = (...list: unknown[]) => withFirst({ cause: { ...first.cause, options: list } });

  it('accepts a diagnose incident with seven cases', () => {
    expect(DIAGNOSE.diagnose.cases).toHaveLength(SEVEN);
    expect(incidentSchema.safeParse(DIAGNOSE).success).toBe(true);
    expect(DIAGNOSE).not.toHaveProperty('tasks');
    expect(DIAGNOSE).not.toHaveProperty('solution');
    expect(isGuided(DIAGNOSE)).toBe(false);
    expect(isGuided(SEND)).toBe(true);
  });

  it('rejects a case without a cause question', () => {
    expect(incidentSchema.safeParse(withFirst({ cause: undefined })).success).toBe(false);
    expect(incidentSchema.safeParse(withFirst({ cause: { options: first.cause.options } })).success).toBe(false);
  });

  it('rejects a case with two correct causes', () => {
    expect(incidentSchema.safeParse(withOptions(...options.map((option) => ({ ...option, correct: true })))).success).toBe(false);
    expect(incidentSchema.safeParse(withOptions(...options.map((option, index) => ({ ...option, correct: index < 2 })))).success).toBe(false);
  });

  it('rejects a case with no correct cause, and one with two options or four', () => {
    expect(incidentSchema.safeParse(withOptions(...options.map((option) => ({ ...option, correct: false })))).success).toBe(false);
    expect(incidentSchema.safeParse(withOptions(options[0], options[1])).success).toBe(false);
    expect(incidentSchema.safeParse(withOptions(...options, options[0])).success).toBe(false);
  });

  it('rejects a case with one hint, a diagnose with no case and two cases with the same id', () => {
    expect(incidentSchema.safeParse(withFirst({ hints: ['Solo una.'] })).success).toBe(false);
    expect(incidentSchema.safeParse(withCases()).success).toBe(false);
    expect(incidentSchema.safeParse(withCases(first, { ...others[0], id: first.id })).success).toBe(false);
  });

  it('rejects a case that repeats a chip id or has an empty tray', () => {
    expect(incidentSchema.safeParse(withFirst({ send: { ...first.send, to: [first.send.to[0], first.send.to[0]] } })).success).toBe(false);
    expect(incidentSchema.safeParse(withFirst({ send: { ...first.send, message: [] } })).success).toBe(false);
  });

  it('rejects an unknown term tag in a case, and a flow that is not ambient', () => {
    expect(incidentSchema.safeParse(withFirst({ report: 'La {{puerta}} falla.' })).success).toBe(false);
    expect(incidentSchema.safeParse({ ...DIAGNOSE, flows: [{ id: 'wanted', kind: 'required', packet: ping(device('your-laptop'), '192.168.1.21') }] }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...DIAGNOSE, flows: [{ id: 'noise', kind: 'ambient', packet: ping(device('printer'), '192.168.1.11') }] }).success).toBe(true);
  });

  it('builds the packets of the chips of a case, which are the chips of the case and no other', () => {
    expect(sendCombinations(first)).toHaveLength(first.send.to.length);
    expect(packetFromChips(first, { fromId: 'origin', toId: 'gateway', messageId: 'ping' })).toEqual({ from: device('your-laptop'), to: OFFICE_FLOORS.floor1.gateway, protocol: 'icmp', icmpType: 8 });
    expect(packetFromChips(first, { fromId: 'origin', toId: 'branch', messageId: 'ping' })).toBeNull();
  });

  it('counts the chips of every case in the office leaks and in the pieces an incident must show', () => {
    expect(officeLeaks(DIAGNOSE, officeNet())).toEqual(expect.arrayContaining([`your-laptop → ${OFFICE_FLOORS.server.ip}`, 'marta-laptop → 10.0.0.10', 'andres-laptop → 192.168.2.1']));
    expect(officeLeaks(DIAGNOSE, officeTwoFloorsNet())).toEqual([]);
    expect(missingShownIds({ ...DIAGNOSE, shown: ['your-laptop'] }, officeTwoFloorsNet())).toEqual(expect.arrayContaining(['andres-laptop', 'marta-laptop', 'printer', 'internet-server']));
    expect(missingShownIds(DIAGNOSE, officeTwoFloorsNet())).toEqual([]);
  });
});
