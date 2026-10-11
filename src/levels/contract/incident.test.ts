import { describe, expect, it } from 'vitest';
import { packetSchema } from '@/engine';
import { caseWorld } from '@/levels/world';
import { incidentTexts } from '@/levels/ladder';
import {
  NAME_SERVERS,
  NOTE_RULE,
  OFFICE_FLOORS,
  actor,
  classifyIncident,
  device,
  diagnoseIncident,
  dig,
  gatewayIncident,
  identifyIncident,
  lab03Net,
  namesSendIncident,
  officeNet,
  officeTwoFloorsNet,
  officeWithNames,
  outboundFilterIncident,
  ping,
  repairableDiagnoseIncident,
  routedSendIncident,
  sendIncident,
  tcp,
} from '@/testing';
import {
  missingShownIds,
  officeLeaks,
  packetFromChips,
  probeFromChips,
  revealsRoutersByTraceroute,
  sendCombinations,
  unknownCardDeviceIds,
  unknownClassifiedDeviceIds,
  unknownSettingDeviceIds,
  unknownTableOwnerIds,
} from './chips';
import { cardsOfPiece, firstCardOf, incidentSchema, isGuided, playerMoveSchema, ruleIdFor, settingKind, type MessageChip, type SendIncident, type TableSpec } from './incident';

const SEND = sendIncident();
const LOOPBACK_ADDRESSES = ['127.0.0.1', '127.1.2.3', 'localhost'];
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

describe('routers that wait for a traceroute', () => {
  const TRACEROUTE_ID = 'trace';
  const SERVER_ID = 'server';
  const ROUTED = {
    ...routedSendIncident(),
    tasks: [{ id: TRACEROUTE_ID, text: 'Corre un {{traceroute}}.', expect: { fromId: 'you', toId: SERVER_ID, messageId: TRACEROUTE_ID, outcome: 'any' as const } }],
    solution: [{ type: 'sendPacket' as const, fromId: 'you', toId: SERVER_ID, messageId: TRACEROUTE_ID }],
  };
  const waiting = { ...ROUTED, revealRoutersByTraceroute: true };
  const withoutTraceroute = { ...waiting, send: { ...waiting.send, message: waiting.send.message.filter((chip) => chip.id !== TRACEROUTE_ID) }, tasks: [{ ...ROUTED.tasks[0], expect: { ...ROUTED.tasks[0].expect, messageId: 'ping' } }], solution: [{ ...ROUTED.solution[0], messageId: 'ping' }] };

  it('accepts the flag on a send incident that offers a traceroute, set or not', () => {
    expect(incidentSchema.safeParse(ROUTED).success).toBe(true);
    expect(incidentSchema.safeParse(waiting).success).toBe(true);
    expect(incidentSchema.safeParse({ ...ROUTED, revealRoutersByTraceroute: false }).success).toBe(true);
    expect(ROUTED).not.toHaveProperty('revealRoutersByTraceroute');
  });

  it('rejects the flag on a send incident with no traceroute to name the routers: they would never be drawn', () => {
    expect(incidentSchema.safeParse({ ...withoutTraceroute, revealRoutersByTraceroute: false }).success).toBe(true);
    expect(incidentSchema.safeParse(withoutTraceroute).success).toBe(false);
  });

  it('is true only for a send incident that sets it', () => {
    expect(revealsRoutersByTraceroute(waiting)).toBe(true);
    expect([ROUTED, { ...ROUTED, revealRoutersByTraceroute: false }, SEND, diagnoseIncident(), identifyIncident()].map((incident) => revealsRoutersByTraceroute(incident))).toEqual([false, false, false, false, false]);
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

  it('a packet to a loopback address or to localhost is no leak: it never leaves the device', () => {
    const toItself = { ...SEND, send: { ...SEND.send, to: LOOPBACK_ADDRESSES.map((address, index) => ({ id: `itself-${index}`, address })) } };
    expect(officeLeaks(toItself, officeNet())).toEqual([]);
    expect(officeLeaks({ ...toItself, send: { ...toItself.send, to: [...toItself.send.to, { id: 'dns', address: '8.8.8.8' }] } }, officeNet())).toEqual(['your-laptop → 8.8.8.8', 'your-laptop → 8.8.8.8']);
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

  it('accepts a case with a list of shown ids of its own, and rejects one with a repeated id, an empty list or an empty id', () => {
    const shown = ['your-laptop', OFFICE_FLOORS.officeRouter.id];
    expect(incidentSchema.safeParse(withFirst({ shown })).success).toBe(true);
    expect(incidentSchema.safeParse(withFirst({ shown: [...shown, shown[0]] })).success).toBe(false);
    expect(incidentSchema.safeParse(withFirst({ shown: [] })).success).toBe(false);
    expect(incidentSchema.safeParse(withFirst({ shown: [''] })).success).toBe(false);
    expect(first).not.toHaveProperty('shown');
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

const NAMES = namesSendIncident();
const { floor1, server, provider, officeRouter } = OFFICE_FLOORS;
const WWW = `www.${NAME_SERVERS.zone}`;
const [, NC, DIG] = NAMES.send.message;
const [RESOLVER, LISTEN] = NAMES.send.settings ?? [];
const tableOf = <Kind extends TableSpec['kind']>(kind: Kind) => NAMES.send.tables!.find((table): table is Extract<TableSpec, { kind: Kind }> => table.kind === kind)!;
const ROUTES = tableOf('routes');
const RECORDS = tableOf('records');
const accepts = (incident: unknown) => incidentSchema.safeParse(incident).success;
const withSend = (patch: Record<string, unknown>) => ({ ...NAMES, send: { ...NAMES.send, ...patch } });
const withNamesMessage = (...message: Record<string, unknown>[]) => withSend({ message: [...NAMES.send.message, ...message] });
const withSettings = (...settings: unknown[]) => withSend({ settings });
const withTables = (...tables: unknown[]) => withSend({ tables });

describe('message chips of chapter 2', () => {
  it('accepts an nc message with a tcp port and a dig message', () => {
    expect(accepts(NAMES)).toBe(true);
    expect(NAMES.send.message.map(({ command }) => command)).toEqual(['ping', 'nc', 'dig']);
    expect(accepts(withNamesMessage({ ...NC, id: 'nc-implied', protocol: undefined }))).toBe(true);
    expect(accepts(withNamesMessage({ ...DIG, id: 'dig-explicit', protocol: 'udp', port: 53 }))).toBe(true);
  });

  it('rejects an nc message with no port', () => {
    expect(accepts(withNamesMessage({ ...NC, id: 'nc-bare', port: undefined }))).toBe(false);
    expect(accepts(withNamesMessage({ ...NC, id: 'nc-port-0', port: 0 }))).toBe(false);
    expect(accepts(withNamesMessage({ ...NC, id: 'nc-udp', protocol: 'udp' }))).toBe(false);
  });

  it('rejects a port on a ping', () => {
    const echo = { id: 'ping-port', label: '{{ping}}', icmpType: 8, port: 80 };
    expect(accepts(withNamesMessage({ ...echo, command: 'ping' }))).toBe(false);
    expect(accepts(withNamesMessage({ ...echo, command: 'traceroute' }))).toBe(false);
    expect(accepts(withNamesMessage(echo))).toBe(false);
    expect(accepts(withNamesMessage({ ...DIG, id: 'dig-80', port: 80 }))).toBe(false);
  });

  it('rejects an icmp type on an nc message', () => {
    expect(accepts(withNamesMessage({ ...NC, id: 'nc-echo', icmpType: 8 }))).toBe(false);
    expect(accepts(withNamesMessage({ ...DIG, id: 'dig-echo', icmpType: 8 }))).toBe(false);
    expect(accepts(withNamesMessage({ ...NC, id: 'nc-ttl', ttl: 3 }))).toBe(false);
    expect(accepts(withNamesMessage({ id: 'echo-untyped', label: '{{ping}}', command: 'ping' }))).toBe(false);
  });

  it('builds the tcp packet of an nc with the port of the message chip', () => {
    expect(packetFromChips(NAMES, { fromId: 'you', toId: 'lucia', messageId: 'nc' })).toEqual(tcp(device('your-laptop'), floor1.lucia, 3000));
    const other = withNamesMessage({ ...NC, id: 'nc-5432', port: 5432 }) as unknown as SendIncident;
    expect(packetFromChips(other, { fromId: 'you', toId: 'lucia', messageId: 'nc-5432' })).toMatchObject({ protocol: 'tcp', port: 5432 });
    expect(packetFromChips(NAMES, { fromId: 'you', toId: 'ghost', messageId: 'nc' })).toBeNull();
  });

  it('builds the udp datagram of a dig with the name as destination and lookup dig', () => {
    const packet = packetFromChips(NAMES, { fromId: 'you', toId: 'www', messageId: 'dig' });
    expect(packet).toEqual(dig(device('your-laptop'), WWW));
    expect(packet).toMatchObject({ protocol: 'udp', port: 53, lookup: 'dig', to: WWW });
    expect(packetSchema.safeParse(packet).success).toBe(true);
    expect(probeFromChips(NAMES, { fromId: 'you', toId: 'www', messageId: 'dig' })).toBeNull();
  });

  it('an address chip can be a name', () => {
    expect(NAMES.send.to.map(({ address }) => address)).toContain(WWW);
    expect(accepts(NAMES)).toBe(true);
    expect(packetFromChips(NAMES, { fromId: 'you', toId: 'www', messageId: 'ping' })).toEqual(ping(device('your-laptop'), WWW));
    expect(packetFromChips(NAMES, { fromId: 'you', toId: 'www', messageId: 'nc' })).toMatchObject({ protocol: 'tcp', to: WWW });
    expect(accepts(withSend({ to: [{ id: 'empty', address: '' }] }))).toBe(false);
  });

  it('an nc and a dig to an address outside an office with no router are leaks', () => {
    const toOutside = { ...SEND, send: { ...SEND.send, to: [{ id: 'dns', address: '8.8.8.8' }], message: [NC, DIG] } };
    expect(officeLeaks(toOutside, officeNet())).toEqual(['your-laptop → 8.8.8.8', 'your-laptop → 8.8.8.8']);
    expect(officeLeaks(toOutside, officeTwoFloorsNet())).toEqual([]);
    const inside = { ...toOutside, send: { ...toOutside.send, to: [{ id: 'printer', address: OFFICE_FLOORS.floor1.printer }] } };
    expect(officeLeaks(inside, officeTwoFloorsNet())).toEqual([]);
  });
});

describe('settings of chapter 2', () => {
  const [, loopback] = LISTEN.chips;
  const gateway = gatewayIncident();

  it('accepts a setting of kind gateway, dns-server or listen-address and rejects a chip value that does not fit its kind', () => {
    expect([RESOLVER, LISTEN].map(settingKind)).toEqual(['dns-server', 'listen-address']);
    expect(settingKind(gateway.send.settings![0])).toBe('gateway');
    expect(accepts(NAMES) && accepts(gateway)).toBe(true);
    expect(accepts(withSettings({ ...RESOLVER, kind: 'gateway' }, LISTEN))).toBe(true);
    const chip = (value: unknown) => ({ id: 'odd', label: 'Otro', value });
    const withChip = (setting: object, value: unknown) => withSettings({ ...setting, chips: [...(setting as typeof RESOLVER).chips, chip(value)] });
    for (const value of ['all', 'loopback', '192.168.1.300']) expect(accepts(withChip(RESOLVER, value)), `dns-server ${value}`).toBe(false);
    for (const value of [null, '198.51.100.8', 'everywhere']) expect(accepts(withChip(LISTEN, value)), `listen-address ${value}`).toBe(false);
    expect(accepts(withChip({ ...gateway.send.settings![0], deviceId: 'your-laptop' }, 'all'))).toBe(false);
  });

  it('a listen address names its service, the other kinds name none, and an unknown kind is rejected', () => {
    expect(accepts(withSettings(RESOLVER, { ...LISTEN, service: undefined }))).toBe(false);
    expect(accepts(withSettings({ ...RESOLVER, service: LISTEN.service }, LISTEN))).toBe(false);
    expect(accepts(withSettings(RESOLVER, { ...LISTEN, service: { protocol: 'icmp', port: 3000 } }))).toBe(false);
    expect(accepts(withSettings(RESOLVER, { ...LISTEN, service: { protocol: 'tcp', port: 0 } }))).toBe(false);
    expect(accepts(withSettings(RESOLVER, { ...LISTEN, kind: 'hosts' }))).toBe(false);
    expect(loopback.value).toBe('loopback');
  });

  it('a gateway or a DNS server belongs to a device that sends, and a listen address to any device', () => {
    expect(accepts(withSettings({ ...RESOLVER, deviceId: 'lucia-laptop' }))).toBe(false);
    expect(accepts(withSettings(RESOLVER, { ...LISTEN, deviceId: 'printer' }))).toBe(true);
    expect(accepts(withSettings(RESOLVER, LISTEN, { ...LISTEN, id: 'again' }))).toBe(true);
    expect(accepts(withSettings(RESOLVER, LISTEN, LISTEN))).toBe(false);
    expect(accepts(withSettings({ ...LISTEN, chips: [LISTEN.chips[0], { ...loopback, value: 'all' }] }))).toBe(false);
  });
});

describe('tables and clock of chapter 2', () => {
  it('accepts a table of routes with a destination tray and a next hop tray', () => {
    expect(ROUTES).toMatchObject({ kind: 'routes', ownerId: provider.id });
    expect(Object.keys(ROUTES.trays)).toEqual(['destination', 'nextHop']);
    expect(accepts(NAMES)).toBe(true);
    const tray = (patch: Record<string, unknown>) => withTables({ ...ROUTES, trays: { ...ROUTES.trays, ...patch } }, RECORDS);
    const chip = { id: 'chip', label: 'Otro' };
    expect(accepts(tray({ destination: [{ ...chip, value: '10.0.0.0/33' }] }))).toBe(false);
    expect(accepts(tray({ destination: [{ ...chip, value: '198.51.100.0/24' }] }))).toBe(true);
    expect(accepts(tray({ destination: [] }))).toBe(false);
    expect(accepts(tray({ nextHop: undefined }))).toBe(false);
    expect(accepts(tray({ nextHop: [{ ...chip, value: officeRouter.id }, { ...chip, value: provider.id }] }))).toBe(false);
    expect(accepts(withTables(ROUTES, RECORDS, ROUTES))).toBe(false);
  });

  it('accepts a table of records with a name tray, a type tray and a value tray', () => {
    expect(RECORDS).toMatchObject({ kind: 'records', ownerId: NAME_SERVERS.authoritative.id });
    expect(Object.keys(RECORDS.trays)).toEqual(['name', 'type', 'value']);
    const tray = (patch: Record<string, unknown>) => withTables(ROUTES, { ...RECORDS, trays: { ...RECORDS.trays, ...patch } });
    expect(accepts(tray({ type: [{ id: 'mx', label: 'MX', value: 'MX' }] }))).toBe(false);
    expect(accepts(tray({ type: [{ id: 'a', label: 'A', value: 'A' }, { id: 'cname', label: 'CNAME', value: 'CNAME' }] }))).toBe(true);
    expect(accepts(tray({ value: undefined }))).toBe(false);
    expect(accepts(tray({ name: [{ id: 'blank', label: 'Nada', value: '' }] }))).toBe(false);
    expect(accepts(withTables({ ...RECORDS, trays: ROUTES.trays }))).toBe(false);
  });

  it('rejects a table whose owner is not a router or a server of the world', () => {
    const world = officeWithNames();
    const owned = (ownerId: string, table: TableSpec = ROUTES) => withTables({ ...table, ownerId }) as unknown as SendIncident;
    expect(unknownTableOwnerIds(NAMES, world)).toEqual([]);
    expect(unknownTableOwnerIds(owned('router-ghost'), world)).toEqual(['router-ghost']);
    expect(unknownTableOwnerIds(owned(NAME_SERVERS.resolver.id), world)).toEqual([NAME_SERVERS.resolver.id]);
    expect(unknownTableOwnerIds(owned(provider.id, RECORDS), world)).toEqual([provider.id]);
    expect(unknownTableOwnerIds(owned('your-laptop'), world)).toEqual(['your-laptop']);
    expect(unknownTableOwnerIds(sendIncident(), world)).toEqual([]);
  });

  it('lists the owner of a table of the fix of a case in the world of that case', () => {
    const repairable = repairableDiagnoseIncident();
    const [spec] = repairable.diagnose.cases.filter(({ fix }) => fix);
    const world = caseWorld(officeTwoFloorsNet(), spec);
    expect(unknownTableOwnerIds(repairable, world, spec)).toEqual([]);
    expect(unknownTableOwnerIds(repairable, world)).toEqual([]);
    expect(unknownTableOwnerIds(repairable, officeNet(), spec)).toEqual([OFFICE_FLOORS.backbone.id]);
    expect(unknownTableOwnerIds(repairable, world, repairable.diagnose.cases[0])).toEqual([]);
  });

  it('lists the device of a setting that is not in the world', () => {
    expect(unknownSettingDeviceIds(NAMES, officeWithNames())).toEqual([]);
    expect(unknownSettingDeviceIds(NAMES, lab03Net())).toEqual(['your-laptop', 'lucia-laptop']);
    expect(unknownSettingDeviceIds(sendIncident(), officeNet())).toEqual([]);
  });

  it('accepts a clock with steps of seconds', () => {
    expect(NAMES.send.clock?.steps.map(({ seconds }) => seconds)).toEqual([60, 300]);
    expect(accepts(NAMES)).toBe(true);
    const [step] = NAMES.send.clock!.steps;
    expect(accepts(withSend({ clock: undefined }))).toBe(true);
    for (const patch of [{ seconds: 0 }, { seconds: -60 }, { seconds: 1.5 }, { label: '' }]) expect(accepts(withSend({ clock: { steps: [{ ...step, ...patch }] } })), JSON.stringify(patch)).toBe(false);
    expect(accepts(withSend({ clock: { steps: [] } }))).toBe(false);
    expect(accepts(withSend({ clock: { steps: [step, { ...step, seconds: 300 }] } }))).toBe(false);
  });
});

describe('what a send task expects of the DNS', () => {
  const [task] = NAMES.tasks;
  const expecting = (patch: Record<string, unknown>) => ({ ...NAMES, tasks: [{ ...task, expect: { ...task.expect, ...patch } }] });

  it('accepts an expected answer and an expected status', () => {
    expect(task.expect.answer).toEqual({ ip: server.ip });
    expect(NAMES.tasks[1].expect.status).toBe('NXDOMAIN');
    expect(accepts(NAMES)).toBe(true);
    expect(accepts(expecting({ answer: { ip: server.ip, alias: true } }))).toBe(true);
    expect(accepts(expecting({ answer: { alias: false } }))).toBe(true);
    expect(accepts(expecting({ answer: undefined, status: 'SERVFAIL' }))).toBe(true);
    expect(accepts(expecting({ answer: { alias: true }, status: 'NXDOMAIN' }))).toBe(true);
  });

  it('rejects an expected answer with nothing in it, a bad IP and a status no dig ends with', () => {
    expect(accepts(expecting({ answer: {} }))).toBe(false);
    expect(accepts(expecting({ answer: { ip: '198.51.100.300' } }))).toBe(false);
    expect(accepts(expecting({ status: 'REFUSED' }))).toBe(false);
    expect(accepts(expecting({ outcome: undefined }))).toBe(false);
  });
});

describe('the card a piece opens first', () => {
  const opening = (opensFirst: Record<string, string>) => withSend({ opensFirst });

  it('accepts the card a piece opens first and rejects a card the piece does not have', () => {
    expect(NAMES.send.opensFirst).toEqual({ 'your-laptop': 'settings' });
    expect(accepts(opening({ 'your-laptop': 'terminal' }))).toBe(true);
    expect(accepts(opening({ 'lucia-laptop': 'services', [provider.id]: 'routes', [NAME_SERVERS.authoritative.id]: 'records' }))).toBe(true);
    expect(accepts(opening({ 'lucia-laptop': 'terminal' }))).toBe(false);
    expect(accepts(opening({ 'your-laptop': 'services' }))).toBe(false);
    expect(accepts(opening({ 'lucia-laptop': 'settings' }))).toBe(false);
    expect(accepts(opening({ [provider.id]: 'records' }))).toBe(false);
    expect(accepts(opening({ printer: 'terminal' }))).toBe(false);
    expect(accepts(opening({ 'your-laptop': 'cache' }))).toBe(false);
  });

  it('lists the cards of a piece in the order it opens them, and opens first the one the incident names or, with none, the first it has', () => {
    const { send } = NAMES;
    expect(cardsOfPiece(send, 'your-laptop')).toEqual(['terminal', 'settings']);
    expect(cardsOfPiece(send, 'lucia-laptop')).toEqual(['services']);
    expect(cardsOfPiece(send, provider.id)).toEqual(['routes']);
    expect(cardsOfPiece(send, NAME_SERVERS.authoritative.id)).toEqual(['records']);
    expect(cardsOfPiece(send, 'printer')).toEqual([]);
    expect(firstCardOf(send, 'your-laptop')).toBe('settings');
    expect(firstCardOf({ ...send, opensFirst: undefined }, 'your-laptop')).toBe('terminal');
    expect(firstCardOf(send, 'lucia-laptop')).toBe('services');
    expect(firstCardOf(send, 'printer')).toBeUndefined();
    expect(firstCardOf(gatewayIncident().send, 'your-laptop')).toBe('terminal');
  });
});

describe('a case with a fix', () => {
  const repairable = repairableDiagnoseIncident();
  const index = repairable.diagnose.cases.findIndex(({ fix }) => fix);
  const [fixed] = repairable.diagnose.cases.filter(({ fix }) => fix);
  const fix = fixed.fix!;
  const withFix = (patch: Record<string, unknown>) => ({ ...repairable, diagnose: { cases: repairable.diagnose.cases.map((spec, at) => (at === index ? { ...spec, fix: { ...fix, ...patch } } : spec)) } });

  it('accepts a case with a fix and rejects a fix whose tasks name chips the case does not offer', () => {
    expect(accepts(repairable)).toBe(true);
    expect(accepts(diagnoseIncident())).toBe(true);
    const [task] = fix.tasks;
    for (const expectation of [{ toId: 'ghost' }, { fromId: 'ghost' }, { messageId: 'ghost' }]) {
      expect(accepts(withFix({ tasks: [{ ...task, expect: { ...task.expect, ...expectation } }] })), JSON.stringify(expectation)).toBe(false);
    }
  });

  it('rejects a fix with no table or no task, a repeated table or task id, and a table of a record that is not valid', () => {
    const [table] = fix.tables;
    const [task] = fix.tasks;
    expect(accepts(withFix({ tables: [] }))).toBe(false);
    expect(accepts(withFix({ tasks: [] }))).toBe(false);
    expect(accepts(withFix({ tables: [table, table] }))).toBe(false);
    expect(accepts(withFix({ tasks: [task, task] }))).toBe(false);
    expect(accepts(withFix({ tables: [{ ...table, kind: 'cache' }] }))).toBe(false);
    expect(accepts(withFix({ tasks: [{ ...task, text: 'La {{puerta}} falla.' }] }))).toBe(false);
  });

  it('keeps the other cases, which have no fix, as they were', () => {
    expect(repairable.diagnose.cases.filter((spec) => !spec.fix)).toHaveLength(repairable.diagnose.cases.length - 1);
    expect(fixed.fix).toBeDefined();
  });
});

describe('the card that classifies in an identify incident', () => {
  const CLASSIFY = classifyIncident();
  const { classify } = CLASSIFY.identify;
  const withClassify = (patch: Record<string, unknown>) => ({ ...CLASSIFY, identify: { ...CLASSIFY.identify, classify: { ...classify, ...patch } } });

  it('accepts an identify incident whose card classifies other devices into two named bins around a CIDR block', () => {
    expect(accepts(CLASSIFY)).toBe(true);
    expect(classify).toMatchObject({ deviceId: 'your-laptop', cidr: floor1.cidr, items: ['printer', 'andres-laptop'] });
    expect(classify?.bins.map(({ name }) => name)).toEqual([`Dentro de ${floor1.cidr}`, 'Fuera']);
    expect(accepts({ ...CLASSIFY, identify: { cards: CLASSIFY.identify.cards } })).toBe(false);
    expect(accepts(withClassify({ cidr: '192.168.1.0/28' }))).toBe(true);
  });

  it('rejects a classify card whose block is not a CIDR block, whose bins repeat an id or whose items repeat a device', () => {
    for (const cidr of ['mi-red', floor1.you, '192.168.1.0/33', '192.168.1.300/24', '']) expect(accepts(withClassify({ cidr })), cidr).toBe(false);
    const [inside, outside] = classify!.bins;
    expect(accepts(withClassify({ bins: [inside, { ...outside, id: inside.id }] }))).toBe(false);
    expect(accepts(withClassify({ bins: [inside] }))).toBe(false);
    expect(accepts(withClassify({ bins: [inside, outside, { id: 'maybe', name: 'Tal vez' }] }))).toBe(false);
    expect(accepts(withClassify({ items: ['printer', 'printer'] }))).toBe(false);
    expect(accepts(withClassify({ items: [] }))).toBe(false);
    expect(accepts(withClassify({ items: ['printer', 'your-laptop'] }))).toBe(false);
    expect(accepts(withClassify({ trayId: '' }))).toBe(false);
  });

  it('an identify task can expect the bin of a classified item and the solution can answer for it', () => {
    const [block, printer, andres] = CLASSIFY.tasks;
    expect(printer.expect).toEqual({ deviceId: 'printer', trayId: classify!.trayId, chipId: 'inside' });
    expect(CLASSIFY.solution).toContainEqual({ type: 'answerCard', deviceId: 'printer', picks: { [classify!.trayId]: 'inside' } });
    for (const expectation of [{ chipId: 'ghost' }, { trayId: 'ghost' }, { deviceId: 'guest-laptop' }, { deviceId: 'your-laptop' }]) {
      expect(accepts({ ...CLASSIFY, tasks: [block, { ...andres, expect: { ...andres.expect, ...expectation } }] }), JSON.stringify(expectation)).toBe(false);
    }
    const answering = (move: Record<string, unknown>) => ({ ...CLASSIFY, solution: [...CLASSIFY.solution, { type: 'answerCard', ...move }] });
    expect(accepts(answering({ deviceId: 'printer', picks: { [classify!.trayId]: 'ghost' } }))).toBe(false);
    expect(accepts(answering({ deviceId: 'guest-laptop', picks: { [classify!.trayId]: 'inside' } }))).toBe(false);
    expect(accepts(answering({ deviceId: 'printer', picks: { [classify!.trayId]: 'outside' } }))).toBe(true);
  });

  it('keeps the tray of a classified item apart from the trays of its own card', () => {
    const [yourCard] = CLASSIFY.identify.cards;
    const printerCard = { deviceId: 'printer', trays: [{ id: classify!.trayId, name: 'Otra', chips: yourCard.trays[0].chips }] };
    expect(accepts({ ...CLASSIFY, identify: { ...CLASSIFY.identify, cards: [yourCard, printerCard] } })).toBe(false);
    expect(accepts({ ...CLASSIFY, identify: { ...CLASSIFY.identify, cards: [yourCard, { ...printerCard, trays: [{ ...printerCard.trays[0], id: 'ip' }] }] } })).toBe(true);
  });

  it('lists the devices the card that classifies holds that the world does not have, its owner first', () => {
    expect(unknownClassifiedDeviceIds(CLASSIFY, officeTwoFloorsNet())).toEqual([]);
    expect(unknownClassifiedDeviceIds(CLASSIFY, officeNet())).toEqual(['andres-laptop']);
    expect(unknownClassifiedDeviceIds({ ...CLASSIFY, identify: { cards: CLASSIFY.identify.cards, classify: { ...classify!, deviceId: 'ghost' } } }, officeTwoFloorsNet())).toEqual(['ghost']);
    expect(unknownClassifiedDeviceIds(identifyIncident(), officeNet())).toEqual([]);
    expect(unknownClassifiedDeviceIds(sendIncident(), officeNet())).toEqual([]);
  });
});

describe('what an incident of chapter 2 draws and says', () => {
  const world = officeWithNames();
  const everything = ['your-laptop', 'lucia-laptop', server.id, provider.id, NAME_SERVERS.authoritative.id, officeRouter.id];

  it('asks the list of shown pieces for the devices that settings belong to, the owners of the tables and the routers a next hop chip names', () => {
    expect(missingShownIds({ ...NAMES, shown: everything }, world)).toEqual([]);
    expect(missingShownIds({ ...NAMES, shown: ['your-laptop', server.id] }, world)).toEqual(['lucia-laptop', provider.id, NAME_SERVERS.authoritative.id, officeRouter.id]);
    expect(missingShownIds({ ...NAMES, shown: everything.filter((id) => id !== officeRouter.id) }, world)).toEqual([officeRouter.id]);
  });

  it('asks the list of shown pieces of a case for the owners of its fix and of an identify incident for the devices its card classifies', () => {
    const repairable = repairableDiagnoseIncident();
    const [fixed] = repairable.diagnose.cases.filter(({ fix }) => fix);
    const only = { ...fixed, shown: ['marta-laptop', server.id] };
    expect(missingShownIds(repairable, officeTwoFloorsNet(), only)).toEqual([OFFICE_FLOORS.backbone.id, OFFICE_FLOORS.provider.id]);
    const classifying = classifyIncident();
    expect(missingShownIds({ ...classifying, shown: ['your-laptop'] }, officeTwoFloorsNet())).toEqual(['printer', 'andres-laptop']);
    expect(missingShownIds({ ...classifying, shown: ['your-laptop', 'printer', 'andres-laptop'] }, officeTwoFloorsNet())).toEqual([]);
  });

  it('reads the labels of the tables and of the clock, and the texts of the fix of a case, as texts of the incident', () => {
    const labelled = withSend({ tables: [{ ...ROUTES, trays: { ...ROUTES.trays, nextHop: [{ id: 'hop', label: '{{next-hop}}', value: officeRouter.id }] } }, RECORDS], clock: { steps: [{ id: 'wait', label: 'Esperar {{dns-ttl}}', seconds: 60 }] } });
    expect(incidentTexts(labelled as unknown as SendIncident)).toEqual(expect.arrayContaining(['{{next-hop}}', 'Esperar {{dns-ttl}}']));
    expect(incidentTexts(NAMES)).toEqual(expect.arrayContaining([...ROUTES.trays.destination.map(({ label }) => label), ...NAMES.send.clock!.steps.map(({ label }) => label)]));
    const repairable = repairableDiagnoseIncident();
    expect(incidentTexts(repairable)).toEqual(expect.arrayContaining(['Que vuelva el {{ping}} al servidor.']));
    expect(incidentTexts(diagnoseIncident())).not.toContain('Que vuelva el {{ping}} al servidor.');
  });
});
