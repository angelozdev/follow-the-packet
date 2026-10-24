import { describe, expect, it } from 'vitest';
import { packetSchema } from '@/engine';
import { caseWorld } from '@/levels/world';
import { incidentTexts } from '@/levels/ladder';
import {
  APP_PORT,
  BLOG_CONTENT,
  BLOG_NAME,
  LUCIA_FIREWALL,
  NAME_SERVER_PIECES,
  NOTE_RULE,
  OFFICE_FLOORS,
  WEB_PORT,
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
  webNet,
  webSendIncident,
} from '@/testing';
import {
  chipsOfRule,
  curlsOutsideWebServices,
  missingShownIds,
  officeLeaks,
  packetFromChips,
  probeFromChips,
  revealsRoutersByTraceroute,
  ruleChipsOf,
  ruleFromChips,
  sendCombinations,
  unknownCardDeviceIds,
  unknownClassifiedDeviceIds,
  unknownSettingDeviceIds,
  unknownTableOwnerIds,
} from './chips';
import { placementOf } from './tables';
import { cardsOfPiece, firstCardOf, incidentSchema, isGuided, playerMoveSchema, ruleIdFor, settingKind, urlOfChip, type MessageChip, type SendIncident, type TableSpec } from './incident';

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
  ['a lesson that is an empty string', { lesson: '' }],
  ['a concept note that is an empty string', { concept: '' }],
  ['two chips with the same id', { chips: { what: [{ id: 'echo', label: 'Eco', what: { kind: 'icmp', icmpType: 8 } }], from: [{ id: 'one', label: 'uno', peer: { kind: 'sg', sgId: 'sg-servidor1' } }, { id: 'one', label: 'otro', peer: { kind: 'cidr', cidr: '0.0.0.0/0' } }] } }],
];

describe('incident contract', () => {
  it('accepts a complete incident', () => {
    expect(incidentSchema.safeParse(VALID).success).toBe(true);
  });

  it('accepts an incident that gives no lesson and no concept note', () => {
    expect(incidentSchema.safeParse({ ...VALID, lesson: undefined, concept: undefined }).success).toBe(true);
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
const WWW = `www.${NAME_SERVER_PIECES.zone}`;
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
    expect(RECORDS).toMatchObject({ kind: 'records', ownerId: NAME_SERVER_PIECES.authoritative.id });
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
    expect(unknownTableOwnerIds(owned(NAME_SERVER_PIECES.resolver.id), world)).toEqual([NAME_SERVER_PIECES.resolver.id]);
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
    expect(unknownTableOwnerIds(repairable, officeNet(), spec)).toEqual([OFFICE_FLOORS.provider.id]);
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
    expect(accepts(opening({ 'lucia-laptop': 'services', [provider.id]: 'routes', [NAME_SERVER_PIECES.authoritative.id]: 'records' }))).toBe(true);
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
    expect(cardsOfPiece(send, NAME_SERVER_PIECES.authoritative.id)).toEqual(['records']);
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

  const moveOfFix = <Type extends (typeof fix.solution)[number]['type']>(type: Type) =>
    fix.solution.find((candidate): candidate is Extract<(typeof fix.solution)[number], { type: Type }> => candidate.type === type)!;

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

  it('needs the reference solution of the fix, made of sends and of moves on its own tables', () => {
    expect(fix.solution.map(({ type }) => type)).toEqual(['removeEntry', 'placeEntry', 'sendPacket']);
    expect(accepts(withFix({ solution: [] }))).toBe(false);
    expect(accepts(withFix({ solution: undefined }))).toBe(false);
  });

  it('rejects a fix solution that sends chips the case does not offer or moves on a table, a tray or a chip the fix does not have', () => {
    const [remove, place, send] = [moveOfFix('removeEntry'), moveOfFix('placeEntry'), moveOfFix('sendPacket')];
    for (const patch of [{ toId: 'ghost' }, { fromId: 'ghost' }, { messageId: 'ghost' }]) expect(accepts(withFix({ solution: [{ ...send, ...patch }] })), JSON.stringify(patch)).toBe(false);
    expect(accepts(withFix({ solution: [{ ...remove, tableId: 'ghost' }, send] }))).toBe(false);
    expect(accepts(withFix({ solution: [{ ...place, tableId: 'ghost' }, send] }))).toBe(false);
    expect(accepts(withFix({ solution: [{ ...place, picks: { ...place.picks, nextHop: 'ghost' } }, send] }))).toBe(false);
    expect(accepts(withFix({ solution: [{ ...place, picks: { destination: place.picks.destination } }, send] }))).toBe(false);
  });

  it('rejects a fix solution that sets a setting or waits, which a fix does not offer', () => {
    const send = moveOfFix('sendPacket');
    expect(accepts(withFix({ solution: [{ type: 'setSetting', deviceId: 'origin', settingId: 'gateway', chipId: 'none' }, send] }))).toBe(false);
    expect(accepts(withFix({ solution: [{ type: 'wait', seconds: 60 }, send] }))).toBe(false);
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
  const everything = ['your-laptop', 'lucia-laptop', server.id, provider.id, NAME_SERVER_PIECES.authoritative.id, officeRouter.id];

  it('asks the list of shown pieces for the devices that settings belong to, the owners of the tables and the routers a next hop chip names', () => {
    expect(missingShownIds({ ...NAMES, shown: everything }, world)).toEqual([]);
    expect(missingShownIds({ ...NAMES, shown: ['your-laptop', server.id] }, world)).toEqual(['lucia-laptop', provider.id, NAME_SERVER_PIECES.authoritative.id, officeRouter.id]);
    expect(missingShownIds({ ...NAMES, shown: everything.filter((id) => id !== officeRouter.id) }, world)).toEqual([officeRouter.id]);
  });

  it('asks the list of shown pieces of a case for the owners of its fix and of an identify incident for the devices its card classifies', () => {
    const repairable = repairableDiagnoseIncident();
    const [fixed] = repairable.diagnose.cases.filter(({ fix }) => fix);
    const only = { ...fixed, shown: ['marta-laptop', server.id] };
    expect(missingShownIds(repairable, officeTwoFloorsNet(), only)).toEqual([OFFICE_FLOORS.provider.id, OFFICE_FLOORS.officeRouter.id, OFFICE_FLOORS.backbone.id]);
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

describe('the moves on tables and on the clock', () => {
  const place = { type: 'placeEntry', tableId: ROUTES.id, picks: { destination: 'default', nextHop: officeRouter.id } };
  const record = { type: 'placeEntry', tableId: RECORDS.id, picks: { name: WWW, type: 'A', value: server.ip } };
  const remove = { type: 'removeEntry', tableId: RECORDS.id, entryId: 'any-row' };
  const wait = { type: 'wait', seconds: 60 };
  const solving = (...moves: unknown[]) => ({ ...NAMES, solution: [...NAMES.solution, ...moves] });

  it('accepts a solution that places an entry, removes one and waits a step of the clock', () => {
    expect(accepts(solving(place, record, remove, wait))).toBe(true);
    expect(accepts(solving({ ...wait, seconds: 300 }))).toBe(true);
  });

  it('rejects a solution that places an entry in a table, a tray or with a chip the incident does not offer', () => {
    for (const patch of [{ tableId: 'ghost' }, { picks: { ...place.picks, destination: 'ghost' } }, { picks: { ...place.picks, nextHop: 'ghost' } }]) expect(accepts(solving({ ...place, ...patch })), JSON.stringify(patch)).toBe(false);
    expect(accepts(solving({ ...remove, tableId: 'ghost' }))).toBe(false);
  });

  it('rejects a placement that leaves a tray empty or names one the table does not have', () => {
    expect(accepts(solving({ ...place, picks: { destination: 'default' } }))).toBe(false);
    expect(accepts(solving({ ...place, picks: {} }))).toBe(false);
    expect(accepts(solving({ ...place, picks: { ...place.picks, type: 'A' } }))).toBe(false);
    expect(accepts(solving({ ...record, tableId: ROUTES.id }))).toBe(false);
  });

  it('rejects a wait that is not a step of the clock, and any wait when the incident has no clock', () => {
    for (const seconds of [30, 0, -60, 1.5]) expect(accepts(solving({ ...wait, seconds })), String(seconds)).toBe(false);
    expect(accepts({ ...solving(wait), send: { ...NAMES.send, clock: undefined } })).toBe(false);
  });

  it('is a move of the player when it names a table and its picks or a whole number of seconds', () => {
    for (const move of [place, record, remove, wait]) expect(playerMoveSchema.safeParse(move).success, JSON.stringify(move)).toBe(true);
    for (const move of [{ ...place, picks: undefined }, { ...remove, entryId: '' }, { ...wait, seconds: 0 }, { ...wait, seconds: 0.5 }, { type: 'wait' }]) expect(playerMoveSchema.safeParse(move).success, JSON.stringify(move)).toBe(false);
  });

  it('stays out of the solution of an incident that is not a send', () => {
    const classifying = classifyIncident();
    expect(accepts({ ...classifying, solution: [...classifying.solution, wait] })).toBe(false);
    const filtering = outboundFilterIncident();
    expect(accepts({ ...filtering, solution: [...filtering.solution, place] })).toBe(false);
  });
});

const WEB = webSendIncident();
const WEB_SITES = WEB.send.tables!.find((table): table is Extract<TableSpec, { kind: 'sites' }> => table.kind === 'sites')!;
const withWeb = (patch: Record<string, unknown>) => ({ ...WEB, send: { ...WEB.send, ...patch } });
const withUrlChips = (...chips: Record<string, unknown>[]) => withWeb({ to: [...WEB.send.to, ...chips] });
const webPacket = (fromId: string, toId: string, messageId: string, incident: SendIncident = WEB) => packetFromChips(incident, { fromId, toId, messageId });
const LUCIA_LAPTOP = device('lucia-laptop');

describe('the url of a send incident', () => {
  const parts = { id: 'parts', address: 'localhost', scheme: 'http', port: APP_PORT, path: '/pedidos', query: 'id=7' } as const;
  const whole = { id: 'whole', address: 'localhost', url: `http://localhost:${APP_PORT}/pedidos?id=7` };

  it('a url chip is built from its parts or given whole, and the whole url is what is sent', () => {
    const incident = withUrlChips(
      parts,
      whole,
      { id: 'fragment', address: 'localhost', url: `${whole.url}#top` },
      { id: 'bare', address: 'www.lucia.example', scheme: 'https' },
      { id: 'no-query', address: 'localhost', scheme: 'http', port: 8080, path: '/a' },
    ) as unknown as SendIncident;
    expect(accepts(incident)).toBe(true);
    const sent = (toId: string) => webPacket('lucia', toId, 'curl', incident);
    expect(sent('parts')).toEqual(sent('whole'));
    expect(sent('whole')).toEqual({ from: LUCIA_LAPTOP, to: 'localhost', protocol: 'tcp', port: APP_PORT, message: { method: 'GET', url: whole.url } });
    expect(sent('fragment')?.message?.url).toBe(`${whole.url}#top`);
    expect(sent('bare')).toMatchObject({ to: 'www.lucia.example', port: 443, message: { url: 'https://www.lucia.example/' } });
    expect(sent('no-query')).toMatchObject({ port: 8080, message: { url: 'http://localhost:8080/a' } });
    expect(urlOfChip(parts)).toBe(whole.url);
    expect(urlOfChip({ address: 'localhost' })).toBeUndefined();
  });

  it('rejects a url chip that mixes parts and a whole url', () => {
    const chips: Record<string, unknown>[] = [
      { ...whole, scheme: 'http' },
      { ...whole, port: APP_PORT },
      { ...whole, path: '/pedidos' },
      { ...whole, query: 'id=7' },
      { ...parts, url: whole.url },
      { id: 'no-scheme', address: 'localhost', port: APP_PORT },
      { id: 'no-address', scheme: 'http' },
      { id: 'not-a-url', address: 'localhost', url: 'localhost:3000/pedidos' },
      { id: 'ftp', address: 'localhost', url: 'ftp://localhost/' },
      { id: 'other-host', address: 'otherhost', url: whole.url },
      { ...parts, query: '?id=7' },
      { ...parts, path: 'pedidos' },
      { ...parts, port: 0 },
      { ...parts, scheme: 'ftp' },
    ];
    for (const chip of chips) expect(accepts(withUrlChips(chip)), JSON.stringify(chip)).toBe(false);
    expect(accepts(withUrlChips(parts, whole))).toBe(true);
    expect(accepts(withUrlChips({ id: 'upper', address: 'WWW.Lucia.example', scheme: 'http' }))).toBe(true);
  });

  it('builds the tcp packet of a curl with the message of its url', () => {
    const you = device('your-laptop');
    expect(webPacket('lucia', 'app-7', 'curl')).toEqual({ from: LUCIA_LAPTOP, to: 'localhost', protocol: 'tcp', port: APP_PORT, message: { method: 'GET', url: `http://localhost:${APP_PORT}/pedidos?id=7` } });
    const orders = { from: you, to: OFFICE_FLOORS.floor1.lucia, protocol: 'tcp', port: APP_PORT };
    const url = `http://${OFFICE_FLOORS.floor1.lucia}:${APP_PORT}/pedidos`;
    expect(webPacket('you', 'orders', 'curl-post')).toEqual({ ...orders, message: { method: 'POST', url, body: 'item=coffee' } });
    expect(webPacket('you', 'orders', 'curl-put')).toEqual({ ...orders, message: { method: 'PUT', url, body: 'item=tea' } });
    for (const messageId of ['curl-i', 'curl-timeout', 'browser']) expect(webPacket('you', 'orders', messageId), messageId).toEqual({ ...orders, message: { method: 'GET', url } });
    expect(webPacket('you', 'shop', 'curl')).toEqual({ from: you, to: 'www.lucia.example', protocol: 'tcp', port: WEB_PORT, message: { method: 'GET', url: 'http://www.lucia.example/' } });
    expect(packetSchema.safeParse(webPacket('you', 'blog', 'curl')).success).toBe(true);
    expect(probeFromChips(WEB, { fromId: 'you', toId: 'shop', messageId: 'curl' })).toBeNull();
    expect(webPacket('you', 'ghost', 'curl')).toBeNull();
  });

  it('builds no packet of a curl or a browser from a plain address, and sends a url chip to its address with any other message', () => {
    const plain = { id: 'plain', address: OFFICE_FLOORS.server.ip };
    const ping = { id: 'ping', label: 'ping', command: 'ping', icmpType: 8 };
    const incident = withWeb({ to: [...WEB.send.to, plain], message: [...WEB.send.message, ping, { id: 'nc', label: 'nc', command: 'nc', port: APP_PORT }] }) as unknown as SendIncident;
    expect(accepts(incident)).toBe(true);
    expect(webPacket('you', 'plain', 'curl', incident)).toBeNull();
    expect(webPacket('you', 'plain', 'browser', incident)).toBeNull();
    expect(webPacket('you', 'plain', 'ping', incident)).toMatchObject({ protocol: 'icmp', to: OFFICE_FLOORS.server.ip });
    expect(webPacket('you', 'shop', 'ping', incident)).toMatchObject({ protocol: 'icmp', to: 'www.lucia.example' });
    expect(webPacket('you', 'shop', 'nc', incident)).toMatchObject({ protocol: 'tcp', to: 'www.lucia.example', port: APP_PORT });
    expect(webPacket('you', 'shop', 'nc', incident)).not.toHaveProperty('message');
    expect(sendCombinations(WEB)).toHaveLength(WEB.send.from.length * WEB.send.to.length * WEB.send.message.length);
  });

  it('a curl to an address outside an office with no router is a leak', () => {
    const toOutside = withWeb({
      from: [WEB.send.from[0]],
      to: [
        { id: 'dns', address: '8.8.8.8', url: 'http://8.8.8.8/' },
        { id: 'name', address: 'www.lucia.example', url: 'http://www.lucia.example/' },
        { id: 'local', address: 'localhost', url: `http://localhost:${APP_PORT}/` },
        { id: 'inside', address: OFFICE_FLOORS.floor1.printer, url: `http://${OFFICE_FLOORS.floor1.printer}/` },
      ],
      message: WEB.send.message.filter(({ command }) => command === 'browser' || command === 'curl').slice(0, 2),
    }) as unknown as SendIncident;
    expect(officeLeaks(toOutside, officeNet())).toEqual(['your-laptop → 8.8.8.8', 'your-laptop → 8.8.8.8']);
    expect(officeLeaks(toOutside, officeTwoFloorsNet())).toEqual([]);
    expect(officeLeaks(WEB, webNet())).toEqual([]);
  });

  it('reads the url of the address chips and the labels of the rules as texts of the incident', () => {
    const texts = incidentTexts(WEB);
    expect(texts).toEqual(expect.arrayContaining([`http://localhost:${APP_PORT}/pedidos?id=7`, 'http://www.lucia.example/', 'curl -i', 'TCP · 3000', 'tu-laptop']));
    const plain = incidentTexts({ ...WEB, send: { ...WEB.send, to: [{ id: 'plain', address: '198.51.100.50' }], rules: undefined } });
    expect(plain.filter((text) => text.startsWith('http'))).toEqual([]);
  });
});

describe('where a curl goes', () => {
  const world = webNet();
  const ssh = { id: 'ssh', address: OFFICE_FLOORS.floor1.lucia, scheme: 'http', port: 22 };

  it('finds nothing wrong with a curl that reaches a web service or no service at all', () => {
    expect(curlsOutsideWebServices(WEB, world)).toEqual([]);
    expect(WEB.send.to.map(({ id }) => id)).toContain('app-80');
  });

  it('lists the combination that reaches a service that speaks no http, and the message that reaches no web service', () => {
    const toSsh = withUrlChips(ssh) as unknown as SendIncident;
    expect(curlsOutsideWebServices(toSsh, world)).toEqual(WEB.send.from.flatMap(({ id: fromId }) => WEB.send.message.map(({ id }) => `${fromId} → ssh via ${id}`)));
    const onlyClosed = withWeb({ to: [WEB.send.to.find(({ id }) => id === 'app-80')] }) as unknown as SendIncident;
    expect(curlsOutsideWebServices(onlyClosed, world)).toEqual(WEB.send.message.map(({ id }) => `${id} reaches no web service`));
    expect(curlsOutsideWebServices(sendIncident(), world)).toEqual([]);
  });
});

describe('curl and the browser as message chips', () => {
  const curl = { id: 'extra', label: 'curl', command: 'curl' };
  const withMessageChip = (chip: Record<string, unknown>) => withWeb({ message: [...WEB.send.message, chip] });

  it('accepts the options of curl and the browser', () => {
    expect(accepts(WEB)).toBe(true);
    expect(WEB.send.message.map(({ command }) => command)).toEqual(['curl', 'curl', 'curl', 'curl', 'curl', 'browser']);
    expect(accepts(withMessageChip({ ...curl, options: { include: true, request: 'PUT', data: 'item=tea', connectTimeout: 3 } }))).toBe(true);
  });

  it('rejects an option curl does not have, an option on another command and a curl or browser with a port, a TTL or an ICMP type', () => {
    const rejected: Record<string, unknown>[] = [
      { ...curl, options: { verbose: true } },
      { ...curl, options: { include: false } },
      { ...curl, options: { data: '' } },
      { ...curl, options: { request: 'DELETE' } },
      { ...curl, options: { connectTimeout: 0 } },
      { ...curl, options: { connectTimeout: 1.5 } },
      { ...curl, port: APP_PORT },
      { ...curl, ttl: 3 },
      { ...curl, icmpType: 8 },
      { ...curl, protocol: 'udp' },
      { id: 'extra', label: 'Navegador', command: 'browser', options: { include: true } },
      { id: 'extra', label: 'Navegador', command: 'browser', port: APP_PORT },
      { id: 'extra', label: 'ping', command: 'ping', icmpType: 8, options: { include: true } },
      { id: 'extra', label: 'nc', command: 'nc', port: APP_PORT, options: { include: true } },
      { id: 'extra', label: 'sin comando', icmpType: 8, options: { include: true } },
    ];
    for (const chip of rejected) expect(accepts(withMessageChip(chip)), JSON.stringify(chip)).toBe(false);
    expect(accepts(withMessageChip({ ...curl, protocol: 'tcp' }))).toBe(true);
  });

  it('lists the browser card of an origin that offers the browser and the sites card of the owner of a table of sites', () => {
    expect(cardsOfPiece(WEB.send, 'your-laptop')).toEqual(['terminal', 'browser']);
    expect(cardsOfPiece(WEB.send, OFFICE_FLOORS.server.id)).toEqual(['sites']);
    expect(cardsOfPiece({ ...WEB.send, message: WEB.send.message.filter(({ command }) => command !== 'browser') }, 'your-laptop')).toEqual(['terminal']);
    expect(accepts(withWeb({ opensFirst: { 'your-laptop': 'browser', [OFFICE_FLOORS.server.id]: 'sites' } }))).toBe(true);
    for (const opensFirst of [{ printer: 'browser' }, { 'your-laptop': 'sites' }, { [OFFICE_FLOORS.server.id]: 'browser' }]) expect(accepts(withWeb({ opensFirst })), JSON.stringify(opensFirst)).toBe(false);
    expect(firstCardOf(WEB.send, OFFICE_FLOORS.server.id)).toBe('sites');
  });
});

describe('the rules card of a send incident', () => {
  const move = { type: 'placeRule', firewallId: LUCIA_FIREWALL, whatId: 'tcp-3000', fromId: 'you' };
  const solving = (...moves: unknown[]) => ({ ...WEB, solution: [...WEB.solution, ...moves] });
  const rules = WEB.send.rules!;

  it('accepts a rules card in a send incident and the placeRule move', () => {
    expect(rules.firewallId).toBe(LUCIA_FIREWALL);
    expect(accepts(WEB)).toBe(true);
    expect(WEB.solution).toContainEqual(move);
    expect(accepts({ ...withWeb({ rules: undefined }), solution: WEB.solution.filter(({ type }) => type !== 'placeRule') })).toBe(true);
    expect(playerMoveSchema.safeParse(move).success).toBe(true);
    expect(accepts(solving({ ...move, fromId: 'anyone', whatId: 'tcp-3001' }))).toBe(true);
    expect(ruleFromChips(WEB, move)).toEqual({ id: ruleIdFor('tcp-3000', 'you'), what: { kind: 'tcp', fromPort: APP_PORT, toPort: APP_PORT }, peer: { kind: 'cidr', cidr: `${OFFICE_FLOORS.floor1.you}/32` } });
    expect(chipsOfRule(WEB, ruleFromChips(WEB, move)!)).toEqual({ what: rules.what[0], peer: rules.from[0] });
  });

  it('rejects a placement the card does not offer: other chips, another firewall, an outbound rule, or no card at all', () => {
    for (const patch of [{ whatId: 'ghost' }, { fromId: 'ghost' }, { firewallId: 'fw-ghost' }, { fromId: undefined, toId: 'you', direction: 'outbound' }]) expect(accepts(solving({ ...move, ...patch })), JSON.stringify(patch)).toBe(false);
    expect(accepts({ ...withWeb({ rules: undefined }), solution: [move, ...WEB.solution] })).toBe(false);
    expect(ruleFromChips(WEB, { ...move, firewallId: 'fw-ghost' })).toBeNull();
    expect(ruleFromChips(WEB, { ...move, whatId: 'ghost' })).toBeNull();
    expect(ruleFromChips(WEB, { whatId: 'tcp-3000', firewallId: LUCIA_FIREWALL, toId: 'you', direction: 'outbound' })).toBeNull();
    expect(ruleFromChips(withWeb({ rules: undefined }) as unknown as SendIncident, move)).toBeNull();
    expect(chipsOfRule(WEB, { what: { kind: 'all' }, peer: rules.from[0].peer })).toBeNull();
  });

  it('rejects a rules card with an empty tray or with two chips that share an id', () => {
    for (const patch of [{ what: [] }, { from: [] }, { what: [rules.what[0], rules.what[0]] }, { from: [rules.from[0], rules.from[0]] }, { firewallId: '' }]) expect(accepts(withWeb({ rules: { ...rules, ...patch } })), JSON.stringify(patch)).toBe(false);
  });

  it('names the firewall of the card in the world of the incident, and only there', () => {
    expect(ruleChipsOf(WEB, LUCIA_FIREWALL)).toBe(rules);
    expect(ruleChipsOf(WEB, 'fw-ghost')).toBeNull();
    expect(ruleChipsOf(WEB)).toBe(rules);
    expect(ruleChipsOf(withWeb({ rules: undefined }) as unknown as SendIncident)).toBeNull();
    expect(ruleChipsOf(outboundFilterIncident(), 'any')?.what).toHaveLength(1);
    expect(ruleChipsOf(identifyIncident())).toBeNull();
  });
});

describe('the table of sites', () => {
  const server = OFFICE_FLOORS.server;
  const owned = (patch: Record<string, unknown>) => withWeb({ tables: [{ ...WEB_SITES, ...patch }] }) as unknown as SendIncident;
  const trays = (patch: Record<string, unknown>) => withWeb({ tables: [{ ...WEB_SITES, trays: { ...WEB_SITES.trays, ...patch } }] });

  it('accepts a table of sites', () => {
    expect(WEB_SITES).toMatchObject({ kind: 'sites', ownerId: server.id, port: WEB_PORT });
    expect(Object.keys(WEB_SITES.trays)).toEqual(['name', 'serves']);
    expect(accepts(WEB)).toBe(true);
    const { name, serves } = WEB_SITES.trays;
    expect(accepts(trays({ name: [...name, { id: 'shop', label: 'tienda', value: 'tienda.lucia.example' }] }))).toBe(true);
    const wrong = [
      { name: [] },
      { serves: [] },
      { name: undefined },
      { name: [...name, { id: 'ip', label: 'IP', value: server.ip }] },
      { name: [...name, { id: 'com', label: 'com', value: 'blog.lucia.com' }] },
      { serves: [...serves, { id: 'bare', label: 'Nada', value: {} }] },
      { serves: [...serves, { ...serves[0], label: 'otra' }] },
    ];
    for (const patch of wrong) expect(accepts(trays(patch)), JSON.stringify(patch)).toBe(false);
    expect(accepts(owned({ port: 0 }))).toBe(false);
    expect(accepts(owned({ port: undefined }))).toBe(false);
    expect(accepts(withWeb({ tables: [WEB_SITES, WEB_SITES] }))).toBe(false);
  });

  it('places a site with the name and the content picked, named after its name', () => {
    expect(placementOf(WEB_SITES, { name: 'blog', serves: 'serve-blog' })).toEqual({ type: 'addSite', ownerId: server.id, port: WEB_PORT, site: { id: BLOG_NAME, names: [BLOG_NAME], ...BLOG_CONTENT } });
    expect(placementOf(WEB_SITES, { name: 'blog' })).toBeNull();
    expect(placementOf(WEB_SITES, { name: 'ghost', serves: 'serve-blog' })).toBeNull();
  });

  it('rejects a table whose owner is not a server with a web service', () => {
    const world = webNet();
    expect(unknownTableOwnerIds(WEB, world)).toEqual([]);
    for (const ownerId of ['router-office', NAME_SERVER_PIECES.resolver.id, 'your-laptop', 'fw-ghost']) expect(unknownTableOwnerIds(owned({ ownerId }), world), ownerId).toEqual([ownerId]);
    expect(unknownTableOwnerIds(owned({ port: 8080 }), world)).toEqual([server.id]);
    expect(unknownTableOwnerIds(owned({ ownerId: 'lucia-laptop', port: 22 }), world)).toEqual(['lucia-laptop']);
    expect(unknownTableOwnerIds(owned({}), officeWithNames())).toEqual([server.id]);
  });
});

describe('what a send task expects of the page', () => {
  const [task] = WEB.tasks;
  const expecting = (patch: Record<string, unknown>) => ({ ...WEB, tasks: [{ ...task, expect: { ...task.expect, ...patch } }] });

  it('accepts an expected body and an expected nth send', () => {
    expect(WEB.tasks.map(({ expect: wanted }) => [wanted.body, wanted.nth])).toEqual([['Pedido 7: 2 cafés', undefined], ['El blog', undefined], ['Pedido 10: item=coffee', 2]]);
    expect(accepts(WEB)).toBe(true);
    expect(accepts(expecting({ body: '', nth: 1 }))).toBe(true);
    expect(accepts(expecting({ body: undefined, nth: undefined }))).toBe(true);
    for (const patch of [{ nth: 0 }, { nth: -1 }, { nth: 1.5 }, { body: 7 }]) expect(accepts(expecting(patch)), JSON.stringify(patch)).toBe(false);
  });

  it('accepts an expected status code and rejects one that no app of the game answers', () => {
    for (const statusCode of [200, 400, 404]) expect(accepts(expecting({ statusCode })), String(statusCode)).toBe(true);
    expect(accepts(expecting({ statusCode: undefined }))).toBe(true);
    for (const statusCode of [201, 418, 500, 4.5, '404']) expect(accepts(expecting({ statusCode })), String(statusCode)).toBe(false);
  });
});
