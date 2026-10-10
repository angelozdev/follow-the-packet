import { applyAction } from '@/engine';
import { INCIDENTS, type FilterIncident, type IdentifyIncident, type SendIncident } from '@/levels';
import { EVERY_TERM, OFFICE, OFFICE_FLOORS, actor, device, officeNet, officeTwoFloorsNet } from './fixtures';

/** Returns a registered incident that filters with rules, by its id; throws when there is none. */
export function filterIncident(id: string): FilterIncident {
  const found = INCIDENTS.find((incident) => incident.id === id);
  if (found?.mechanic !== 'filter') throw new Error(`${id} is not a filter incident`);
  return found;
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
