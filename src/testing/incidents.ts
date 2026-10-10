import { nameTag } from '@/copy';
import { ROUTE_DEFAULT, applyAction, type Firewall, type NetworkAction } from '@/engine';
import { INCIDENTS, type CaseSpec, type DiagnoseIncident, type ExplanationOption, type FilterIncident, type IdentifyIncident, type SendIncident } from '@/levels';
import { EVERY_TERM, OFFICE, OFFICE_FLOORS, actor, allOut, device, officeNet, officeTwoFloorsNet, ping, withDevice } from './fixtures';

/** Returns a registered incident that filters with rules, by its id; throws when there is none. */
export function filterIncident(id: string): FilterIncident {
  const found = INCIDENTS.find((incident) => incident.id === id);
  if (found?.mechanic !== 'filter') throw new Error(`${id} is not a filter incident`);
  return found;
}

const PEER_CHIPS = [
  { id: 'lucia', label: nameTag('lucia-laptop'), peer: { kind: 'cidr', cidr: `${OFFICE.lucia}/32` } },
  { id: 'printer', label: nameTag('printer'), peer: { kind: 'cidr', cidr: `${OFFICE.printer}/32` } },
] as const;

/** Returns a filter incident on the chapter 1 office, with every term introduced, where your laptop has a host firewall with no rules in either direction and the ping to lucia-laptop must come back. It offers the Echo Request as Type, lucia-laptop and the printer as Source and as Destination, and its solution is the outbound rule Echo Request to lucia-laptop. */
export function outboundFilterIncident(): FilterIncident {
  const { chapter, role, lesson, concept, takeaway, hints, explanation } = sendIncident();
  const firewall: Firewall = { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] };
  const flow = { id: 'ping-lucia', kind: 'required', packet: ping(device('your-laptop'), OFFICE.lucia) } as const;
  return {
    chapter,
    role,
    lesson,
    concept,
    takeaway,
    hints,
    explanation,
    id: '09-04',
    order: 4,
    title: 'Prueba de salida',
    introduces: [...EVERY_TERM],
    base: withDevice({ ...officeNet(), firewalls: [firewall] }, 'your-laptop', { firewallIds: [firewall.id] }),
    mechanic: 'filter',
    report: 'Tu {{ping}} a laptop-lucia no sale.',
    tasks: [{ id: 'leave', text: 'Que vuelva tu {{ping}} a laptop-lucia.', flowIds: [flow.id] }],
    flows: [flow],
    chips: {
      what: [{ id: 'echo-request', label: '{{icmp}} · {{echo-request}}', what: { kind: 'icmp', icmpType: 8 } }],
      from: PEER_CHIPS.map((chip) => ({ ...chip, id: `from-${chip.id}` })),
      to: PEER_CHIPS.map((chip) => ({ ...chip, id: `to-${chip.id}` })),
    },
    solution: [{ type: 'placeRule', firewallId: firewall.id, whatId: 'echo-request', toId: 'to-lucia', direction: 'outbound' }],
  };
}

/** Returns a filter incident on the chapter 1 office where only the inbound rules of a host firewall are open (no term of outbound rules is introduced): laptop-lucia has a firewall with no inbound rules that lets everything out, and the ping from your laptop must come back. It offers the Echo Request as Type, your laptop and the printer as Source, and its solution is the inbound rule Echo Request from your laptop. */
export function hostFirewallIncident(): FilterIncident {
  const outbound = outboundFilterIncident();
  const office = officeNet();
  const firewalls = office.firewalls.map((firewall) => ({ ...firewall, name: 'laptop-lucia' }));
  const [, printer] = outbound.chips.from;
  const you = { id: 'from-you', label: nameTag('your-laptop'), peer: { kind: 'cidr', cidr: `${OFFICE.you}/32` } } as const;
  return {
    ...outbound,
    id: '09-05',
    order: 5,
    title: 'Prueba de entrada',
    introduces: ['ping', 'icmp', 'echo-request', 'echo-reply', 'firewall', 'traffic', 'rule'],
    base: withDevice({ ...office, firewalls }, 'lucia-laptop', { firewallIds: firewalls.map(({ id }) => id) }),
    report: 'Tu {{ping}} a laptop-lucia no vuelve.',
    chips: { what: outbound.chips.what, from: [you, printer] },
    solution: [{ type: 'placeRule', firewallId: 'fw-lucia', whatId: 'echo-request', fromId: you.id }],
  };
}

/** Returns a send incident on the chapter 1 office: ping the printer from your laptop and get its reply, and send anything from the attacker. */
export function sendIncident(): SendIncident {
  return {
    id: '09-01',
    chapter: 9,
    order: 1,
    title: 'Prueba',
    role: 'defender',
    lesson: 'Una lección',
    concept: 'concepts/una-nota.md',
    introduces: ['ping', 'echo-request', 'echo-reply'],
    base: officeNet(),
    mechanic: 'send',
    report: 'Haz {{ping}} a la impresora.',
    tasks: [
      { id: 'printer', text: 'Que vuelva el {{ping}} a la impresora.', expect: { fromId: 'you', toId: 'printer', messageId: 'ping', outcome: 'replied' } },
      { id: 'outside', text: 'Prueba desde afuera.', expect: { fromId: 'attacker', toId: 'lucia', messageId: 'ping', outcome: 'any' } },
    ],
    flows: [],
    send: {
      from: [
        { id: 'you', endpoint: device('your-laptop') },
        { id: 'attacker', endpoint: actor('attacker') },
      ],
      to: [
        { id: 'printer', address: OFFICE.printer },
        { id: 'lucia', address: OFFICE.lucia },
        { id: 'nobody', address: OFFICE.nobody },
      ],
      message: [
        { id: 'ping', label: '{{ping}}', icmpType: 8 },
        { id: 'reply', label: '{{echo-reply}}', icmpType: 0 },
      ],
    },
    hints: ['Primera.', 'Segunda.'],
    question: '¿Por qué volvió el {{ping}}?',
    explanation: [
      { text: 'A', feedback: 'a', correct: false },
      { text: 'B', feedback: 'b', correct: true },
      { text: 'C', feedback: 'c', correct: false },
    ],
    solution: [
      { type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ping' },
      { type: 'sendPacket', fromId: 'attacker', toId: 'lucia', messageId: 'ping' },
    ],
    takeaway: 'Una idea.',
  };
}

/** Returns a send incident on the office of the map that grows, with every term introduced: from your laptop, a ping, a ping with a TTL of 2 or a traceroute to the printer, the server of the internet, a private IP of another network, an IP of the server's network that nobody has, an IP nobody has and its own loopback. A test about what is hidden sets `known` or `shown` itself. */
export function routedSendIncident(): SendIncident {
  const { floor1, server } = OFFICE_FLOORS;
  const echo = { icmpType: 8 as const };
  return {
    ...sendIncident(),
    introduces: [...EVERY_TERM],
    base: officeTwoFloorsNet(),
    send: {
      from: [{ id: 'you', endpoint: device('your-laptop') }],
      to: [
        { id: 'printer', address: floor1.printer },
        { id: 'server', address: server.ip },
        { id: 'no-server', address: server.nobody },
        { id: 'private', address: '10.0.0.10' },
        { id: 'nobody', address: floor1.nobody },
        { id: 'loopback', address: '127.0.0.1' },
      ],
      message: [
        { id: 'ping', label: '{{ping}}', command: 'ping', ...echo },
        { id: 'ping-2', label: 'TTL 2', command: 'ping', ttl: 2, ...echo },
        { id: 'trace', label: '{{traceroute}}', command: 'traceroute', ...echo },
      ],
    },
  };
}

/** Returns a send incident on the office of the map that grows, whose laptop was reinstalled and so has no default gateway: its ping to laptop-andres, on the other floor, cannot leave until the player sets the gateway on the card of the laptop, which offers none, the router of the floor, the printer (not a router) and an IP nobody has. The terminal offers only the address and the ping. */
export function gatewayIncident(): SendIncident {
  const { floor1, floor2 } = OFFICE_FLOORS;
  const chip = (id: string, value: string | null) => ({ id, label: value ?? 'Ninguna', value });
  return {
    ...routedSendIncident(),
    base: applyAction(officeTwoFloorsNet(), { type: 'setGateway', deviceId: 'your-laptop' }),
    tasks: [{ id: 'andres', text: 'Que vuelva el {{ping}} a laptop-andres.', expect: { fromId: 'you', toId: 'andres', messageId: 'ping', outcome: 'replied' } }],
    send: {
      from: [{ id: 'you', endpoint: device('your-laptop') }],
      to: [
        { id: 'printer', address: floor1.printer },
        { id: 'andres', address: floor2.andres },
      ],
      message: [{ id: 'ping', label: '{{ping}}', command: 'ping', icmpType: 8 }],
      settings: [
        {
          id: 'gateway',
          deviceId: 'your-laptop',
          name: '{{default-gateway|puerta de enlace predeterminada}}',
          chips: [chip('none', null), chip('router', floor1.gateway), chip('printer', floor1.printer), chip('nobody', floor1.nobody)],
        },
      ],
    },
    solution: [
      { type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId: 'router' },
      { type: 'sendPacket', fromId: 'you', toId: 'andres', messageId: 'ping' },
    ],
  };
}

export const NOTE_RULE = 'La nota de Lucía estaba mal: 192.168.1.300 no es IPv4, porque cada uno de los cuatro números va de 0 a 255.';

/** Returns an identify incident on the office of the map that grows, as 01-01 plays it: the card of laptop-visita (a yes or no, "¿Está en la red?") and the card of the printer ("¿Cuál es su dirección IP?"), whose tray starts with the 192.168.1.300 of Lucía's note picked and carries the rule of that note. The right IP of the printer is 192.168.1.21; the other valid one, 192.168.1.12, is the IP of laptop-marta. */
export function identifyIncident(): IdentifyIncident {
  const { printer, marta } = OFFICE_FLOORS.floor1;
  const { chapter, title, role, lesson, concept, explanation, takeaway } = sendIncident();
  return {
    chapter,
    title,
    role,
    lesson,
    concept,
    explanation,
    takeaway,
    id: '09-02',
    order: 2,
    introduces: ['network', 'device', 'ip-address', 'ipv4'],
    base: officeTwoFloorsNet(),
    mechanic: 'identify',
    report: 'Anoté la IP de la impresora, pero creo que la anoté mal. Revisa dos cosas.',
    tasks: [
      { id: 'guest', text: 'Que laptop-visita quede marcada como fuera de la red.', expect: { deviceId: 'guest-laptop', trayId: 'in-network', chipId: 'no' } },
      { id: 'printer', text: 'Que la impresora tenga su dirección IP.', expect: { deviceId: 'printer', trayId: 'ip', chipId: 'right' } },
    ],
    flows: [],
    identify: {
      cards: [
        {
          deviceId: 'guest-laptop',
          trays: [
            {
              id: 'in-network',
              name: '¿Está en la red?',
              segmented: true,
              chips: [
                { id: 'yes', label: 'Sí', feedback: 'Está conectada: tiene IP y está en la red.' },
                { id: 'no', label: 'No' },
              ],
            },
          ],
        },
        {
          deviceId: 'printer',
          question: '¿Cuál es su dirección IP?',
          trays: [
            {
              id: 'ip',
              name: 'Dirección IP',
              initialPick: 'note',
              initialPickRule: NOTE_RULE,
              chips: [
                { id: 'right', label: printer, feedback: 'Correcto.' },
                { id: 'note', label: '192.168.1.300', feedback: 'No es IPv4: cada uno de los cuatro números va de 0 a 255.' },
                { id: 'marta', label: marta, feedback: 'Esa es la IP de laptop-marta, que se ve en su caja.' },
              ],
            },
          ],
        },
      ],
    },
    hints: ['Cada dispositivo tiene su IP; pasa el mouse por la impresora.', 'Un número de una IP no pasa de 255.'],
    question: '¿Por qué 192.168.1.300 no puede ser la IP de la impresora?',
    solution: [
      { type: 'answerCard', deviceId: 'guest-laptop', picks: { 'in-network': 'no' } },
      { type: 'answerCard', deviceId: 'printer', picks: { ip: 'right' } },
    ],
  };
}

interface CaseSketch {
  from: string;
  to: [id: string, address: string][];
  right: 0 | 1 | 2;
  changes?: NetworkAction[];
}

function causeOption(number: number, index: number, right: number): ExplanationOption {
  const letter = String.fromCharCode('A'.charCodeAt(0) + index);
  return { text: `Causa ${number}${letter}`, feedback: `Porque ${number}${letter}.`, correct: index === right };
}

function diagnoseCase(number: number, { from, to, right, changes }: CaseSketch): CaseSpec {
  return {
    id: `case-${number}`,
    changes,
    report: `Caso ${number}: tu {{ping}} no vuelve.`,
    send: {
      from: [{ id: 'origin', endpoint: device(from) }],
      to: to.map(([id, address]) => ({ id, address })),
      message: [{ id: 'ping', label: '{{ping}}', command: 'ping', icmpType: 8 }],
    },
    hints: [`Primera pista del caso ${number}.`, `Segunda pista del caso ${number}.`],
    cause: { question: `¿Por qué falla el caso ${number}?`, options: [causeOption(number, 0, right), causeOption(number, 1, right), causeOption(number, 2, right)] },
  };
}

/** Returns a diagnose incident on the office of the map that grows, with every term introduced and seven cases that each start from the office plus their own changes: 1 takes the gateway of your laptop away, 2 changes nothing, 3 takes the gateway of laptop-andres away, 4 changes nothing, 5 sends the routes of the backbone back to the provider, 6 adds a firewall to laptop-lucia and 7 adds one with no outbound rules to your laptop. The right cause sits in a different place in the cases (the third option of the first, the first of the second, and so on) and every case has its own chips. */
export function diagnoseIncident(): DiagnoseIncident {
  const { floor1, floor2, server, provider, backbone, range } = OFFICE_FLOORS;
  const { chapter, title, role, lesson, concept, takeaway } = sendIncident();
  const firewall = (deviceId: string, name: string, outbound: ReturnType<typeof allOut>[]): NetworkAction => ({
    type: 'addFirewall',
    deviceId,
    firewall: { id: `fw-${deviceId}`, name, kind: 'host-firewall', inbound: [], outbound },
  });
  return {
    chapter,
    title,
    role,
    lesson,
    concept,
    takeaway,
    id: '09-03',
    order: 3,
    introduces: [...EVERY_TERM],
    base: officeTwoFloorsNet(),
    mechanic: 'diagnose',
    report: 'Hoy estás de guardia. Te llegan avisos de uno en uno.',
    flows: [],
    diagnose: {
      cases: [
        diagnoseCase(1, { from: 'your-laptop', right: 2, to: [['loopback', '127.0.0.1'], ['own', floor1.you], ['gateway', floor1.gateway], ['server', server.ip]], changes: [{ type: 'setGateway', deviceId: 'your-laptop' }] }),
        diagnoseCase(2, { from: 'your-laptop', right: 0, to: [['typo', '192.168.1.22'], ['printer', floor1.printer]] }),
        diagnoseCase(3, { from: 'andres-laptop', right: 1, to: [['loopback', '127.0.0.1'], ['own', floor2.andres], ['router', floor2.gateway], ['printer', floor1.printer]], changes: [{ type: 'setGateway', deviceId: 'andres-laptop' }] }),
        diagnoseCase(4, { from: 'marta-laptop', right: 2, to: [['server', server.ip], ['branch', '10.0.0.10']] }),
        diagnoseCase(5, { from: 'marta-laptop', right: 0, to: [['server', server.ip]], changes: [{ type: 'updateRouter', routerId: backbone.id, routes: [{ to: range, next: provider.id }, { to: ROUTE_DEFAULT, next: provider.id }] }] }),
        diagnoseCase(6, { from: 'your-laptop', right: 1, to: [['lucia', floor1.lucia], ['marta', floor1.marta], ['printer', floor1.printer]], changes: [firewall('lucia-laptop', 'laptop-lucia', [allOut('out-lucia')])] }),
        diagnoseCase(7, { from: 'your-laptop', right: 2, to: [['loopback', '127.0.0.1'], ['own', floor1.you], ['gateway', floor1.gateway]], changes: [firewall('your-laptop', 'tu-laptop', [])] }),
      ],
    },
  };
}
