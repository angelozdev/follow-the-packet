import { describe, expect, it } from 'vitest';
import { TERMS, roundTripText, stampLabel, termsIn, toPlainText, type TermText } from '@/copy';
import { networkSchema } from '@/engine';
import { INCIDENTS, isGuided, solvedWorld, startWorld, type Incident } from '@/levels';
import { incidentTexts } from '@/levels/ladder';
import { ADDRESS, CARD, DEVICE, FIREWALL, GATEWAY, GUARD_PIECES, HIDDEN_FIREWALL, IP, MESSAGE, ORIGIN, PING_WITH_TTL, ROUTER, SERVER, TASK } from '@/levels/01-first-day/shared';
import type { SentPacket } from './flow-runs';
import { identifyCard } from './view/cards/identify-card';
import { settingsCard } from './view/cards/settings-card';
import { terminalCard, terminalLine } from './view/cards/terminal-card';
import { inspect } from './view/inspection';
import { PIECE_ID } from './view/piece-id';
import { drawsRouter, pieceViews } from './view/pieces';
import { routerPlace } from './view/router-place';
import { tracerouteLines } from './view/cards/traceroute-lines';
import { sessionReducer, startSession, starsOf, type Session } from './session';
import { taskHolds } from './tasks';

const THE_OFFICE = '01-01';
const THE_ENVELOPE = '01-02';
const ARE_YOU_THERE = '01-03';
const PING_YOURSELF = '01-04';
const WHEN_IT_DOES_NOT_COME_BACK = '01-05';
const YOUR_NETWORK = '01-06';
const WHO_GETS_WHAT_IS_OUTSIDE = '01-07';
const THE_NETWORK_OF_NETWORKS = '01-08';
const COUNTING_HOPS = '01-09';
const SEEING_THE_PATH = '01-10';
const THE_GUARD = '01-11';
const NOTE_FEEDBACK = 'No es IPv4: cada uno de los cuatro números va de 0 a 255.';
const NOTE_RULE = 'La nota de Lucía estaba mal: 192.168.1.300 no es IPv4, porque cada uno de los cuatro números va de 0 a 255.';
const RIGHT_FEEDBACK = 'Correcto.';
const CONNECTED_FEEDBACK = 'Sí está en la red: laptop-lucia está conectada. Su caja de inspección lo dice.';
const NOT_CONNECTED_FEEDBACK = 'No. laptop-visita no está conectada, así que no forma parte de la red. Su caja de inspección lo dice.';
const MARTA_FEEDBACK = 'Esa IP es de laptop-marta: se ve en su caja. La impresora tiene otra.';
const HEADER_LABEL = 'Encabezado';
const LOCAL_HEADER_LABEL = 'Encabezado (en tu red local)';
const LOCAL_REQUEST_HEADER_LABEL = 'Encabezado del Echo Request (en tu red local)';
const LOCAL_REPLY_HEADER_LABEL = 'Encabezado del Echo Reply (en tu red local)';
const HEADER_CHANGES = 'Fuera de la oficina el encabezado cambia: lo verás en el capítulo 2.';
const CONNECTED_LINE = 'Conectado a la red.';
const NOT_CONNECTED_LINE = 'No está conectado: no forma parte de la red.';
const RESULT_LABEL = 'Resultado';
const REQUEST_HEADER_LABEL = 'Encabezado del Echo Request';
const REPLY_HEADER_LABEL = 'Encabezado del Echo Reply';
const ROUND_TRIP_LABEL = 'Tiempo de ida y vuelta';
const EXAMPLE_FIGURE = 'Cifra de ejemplo.';
const STOPPED_LABEL = 'Dónde y por qué se detuvo';
const NOTHING_CAME_BACK = 'No volvió ninguna respuesta.';
const FIREWALL_WORDS = /firewall|regla|bloquead|permitid|descart/i;
const NOT_NETWORK_JARGON = /\b(ARP|MAC|Linux|macOS|Windows)\b/;
const SWITCHED_OFF = /apagad/i;
const PASSED_THROUGH_LABEL = 'Pasó por';
const ROUTER_LINE = `${ROUTER.office.name} (${IP.router})`;
const PROVIDER_LINE = `${ROUTER.provider.name} (${IP.provider})`;
const HOP_OR_TTL = /salto|TTL/i;
const NO_GATEWAY_TEXT = '192.168.2.15 no está en la red local de tu-laptop, y tu-laptop no tiene puerta de enlace predeterminada: no sabe por dónde sacar el paquete.';
const PRINTER_GATEWAY_TEXT = 'La IP 192.168.1.21, la puerta de enlace predeterminada guardada, es de impresora, que no es un router: recibe el paquete, no lo pasa a otra red y no vuelve nada.';
const NOBODY_GATEWAY_TEXT = 'tu-laptop buscó en su red quién tenía la IP 192.168.1.50, su puerta de enlace predeterminada, y nadie contestó. El propio dispositivo avisa que no pudo entregar el paquete.';
const SETTINGS_ENTRY = 'Ajustes de red de tu-laptop';
const GATEWAY_TRAY = 'puerta de enlace predeterminada';
const NO_GATEWAY_CHIP = 'Ninguna';
const OUTSIDE_THE_OFFICE = 'fuera de la oficina';
const HOPS_LABEL = 'Saltos';
const NAT_WORDS = /\bNAT\b|traduc/i;
const ROUTER_OUTSIDE = new RegExp(`${ROUTER.provider.name}|${ROUTER.destination.name}|203\\.0\\.113\\.`);
const TTL_VALUES = [1, 2, 3, 5, 64] as const;
const STAR = '*';
const TRACEROUTE_LINES = 8;
const ROUTER_OUTSIDE_THE_LOOP = new RegExp(`${ROUTER.destination.name}|${IP.destination.replaceAll('.', '\\.')}`);
const DROPPED_TEXT = 'El firewall de laptop-marta descartó el paquete sin avisar.';
const GUARD_PLACE = 1;
const NO_REASON_GIVEN = /revel|stateful|stateless|recuerda|mismo camino|esconde|oculta/i;
const ABOUT_RULES = /regla|entrada|salida|permit|deneg|privilegio/i;
const SENDER_LOOKED = 'tu-laptop buscó en su red quién tenía la IP 192.168.1.50 y nadie contestó. El propio dispositivo avisa que no pudo entregar el paquete.';

function guidedOf(id: string) {
  const incident = INCIDENTS.find((candidate) => candidate.id === id);
  if (!incident || !isGuided(incident)) throw new Error(`${id} is not a guided incident`);
  return incident;
}

function answer(session: Session, deviceId: string, picks: Record<string, string>): Session {
  return sessionReducer(session, { type: 'answerCard', deviceId, picks });
}

function openTasks(session: Session): string[] {
  return guidedOf(session.incident.id)
    .tasks.filter((task) => !taskHolds(task, session.runs, session.sent, session.answers))
    .map((task) => task.id);
}

function linesOnListo(session: Session, deviceId: string, trayId: string, chipId: string): string[] {
  const card = identifyCard(session, PIECE_ID.device(deviceId));
  const chip = card?.trays.find((tray) => tray.id === trayId)?.chips.find((candidate) => candidate.id === chipId);
  if (!chip) throw new Error(`no chip ${deviceId}/${trayId}/${chipId}`);
  return chip.lines.map((line: TermText) => toPlainText(line));
}

function boxLines(session: Session, deviceId: string): string[] {
  const box = inspect(session, PIECE_ID.device(deviceId));
  return (box?.fields ?? []).flatMap((field) => field.lines.map((line) => toPlainText(line)));
}

function printerLines(session: Session, chipId: string): string[] {
  return linesOnListo(session, DEVICE.printer.id, CARD.ip.tray, chipId);
}

function packetTo(session: Session, toId: string): Session {
  return sessionReducer(session, { type: 'sendPacket', fromId: ORIGIN.you.id, toId, messageId: MESSAGE.packet.id });
}

function pingTo(session: Session, ...toIds: string[]): Session {
  return toIds.reduce((current, toId) => sessionReducer(current, { type: 'sendPacket', fromId: ORIGIN.you.id, toId, messageId: MESSAGE.ping.id }), session);
}

function sendWith(session: Session, messageId: string, toId: string): Session {
  return sessionReducer(session, { type: 'sendPacket', fromId: ORIGIN.you.id, toId, messageId });
}

function pingWithTtl(session: Session, ttl: (typeof TTL_VALUES)[number]): Session {
  return sendWith(session, PING_WITH_TTL[ttl].id, ADDRESS.server.id);
}

function expectClosed(session: Session): void {
  expect(openTasks(session)).toEqual([]);
  expect(starsOf(sessionReducer(session, { type: 'submit' }))).toMatchObject({ closed: true, middle: true });
}

function hopIds(run: SentPacket): string[] {
  return (run.trace.hops ?? []).map((hop) => hop.routerId);
}

function plainBox(session: Session, pieceId: string): string[] {
  const box = inspect(session, pieceId);
  return box ? [box.title, ...box.fields.flatMap((field) => [field.label, ...field.lines])].map((text) => toPlainText(text)) : [];
}

function sentTo(session: Session, toId: string, messageId?: string): SentPacket {
  const found = session.sent.find((packet) => packet.toId === toId && (messageId === undefined || packet.messageId === messageId));
  if (!found) throw new Error(`nothing was sent to ${toId}`);
  return found;
}

function fieldLines(session: Session, pieceId: string, label: string): string[] | undefined {
  const field = inspect(session, pieceId)?.fields.find((candidate) => toPlainText(candidate.label) === label);
  return field?.lines.map((line) => toPlainText(line));
}

function deviceNameAt(session: Session, ip: string): string | undefined {
  return session.world.devices.find((device) => device.privateIp === ip)?.name;
}

function everythingShown(session: Session): string[] {
  const ids = [...pieceViews(session).map((piece) => piece.id), ...session.sent.map((packet) => packet.pieceId)];
  const boxes = ids.flatMap((id) => inspect(session, id)).flatMap((box) => (box ? [box.title, ...box.fields.flatMap((field) => [field.label, ...field.lines])] : []));
  const terminals = ids.flatMap((id) => terminalCard(session, id) ?? []).flatMap((card) => [card.title, ...card.trays.flatMap((tray) => tray.chips.map((chip) => chip.label))]);
  const lines = session.sent.flatMap((packet) => terminalLine(session, { to: packet.toId, message: packet.messageId }) ?? []);
  const stamps = session.sent.map((packet) => stampLabel(toPlainText(packet.label), packet.blocked ? 'blocked' : 'lost'));
  return [...pieceViews(session).map((piece) => piece.label), ...boxes, ...terminals, ...lines, ...stamps].map((text) => toPlainText(text));
}

describe('01-01, the office', () => {
  const start = startSession(INCIDENTS, THE_OFFICE);
  const markVisitor = (session: Session) => answer(session, DEVICE.visitor.id, { [CARD.network.tray]: CARD.network.no });
  const pickPrinter = (session: Session, chipId: string) => answer(session, DEVICE.printer.id, { [CARD.ip.tray]: chipId });

  it('01-01: marking laptop-visita and picking 192.168.1.21 for the printer closes the incident', () => {
    const marked = markVisitor(start);
    expect(openTasks(marked)).toEqual([TASK.printer]);
    const picked = pickPrinter(marked, CARD.ip.right);
    expect(openTasks(picked)).toEqual([]);
    const closed = sessionReducer(picked, { type: 'submit' });
    expect(closed.phase).toBe('explaining');
    expect(starsOf(closed)).toMatchObject({ closed: true, middle: true });
  });

  it('01-01: marking a connected laptop as outside leaves the task open and the box says it has an IP', () => {
    const marked = answer(start, DEVICE.lucia.id, { [CARD.network.tray]: CARD.network.no });
    expect(openTasks(marked)).toEqual([TASK.visitor, TASK.printer]);
    expect(linesOnListo(marked, DEVICE.lucia.id, CARD.network.tray, CARD.network.no)).toEqual([CONNECTED_FEEDBACK]);
    expect(boxLines(marked, DEVICE.lucia.id)).toEqual(expect.arrayContaining([IP.lucia, CONNECTED_LINE]));
  });

  it('01-01: the box of laptop-visita keeps its IP and says it is not connected, and marking it Yes says so', () => {
    expect(boxLines(start, DEVICE.visitor.id)).toEqual(expect.arrayContaining([IP.visitor, NOT_CONNECTED_LINE]));
    expect(boxLines(start, DEVICE.visitor.id)).not.toContain(CONNECTED_LINE);
    expect(linesOnListo(start, DEVICE.visitor.id, CARD.network.tray, CARD.network.yes)).toEqual([NOT_CONNECTED_FEEDBACK]);
    expect(linesOnListo(start, DEVICE.visitor.id, CARD.network.tray, CARD.network.no)).toEqual([]);
  });

  it("01-01: Lucía's note gives 192.168.1.300 and that chip starts picked for the printer, with its task open", () => {
    expect(guidedOf(THE_OFFICE).report).toContain(IP.note);
    expect(start.answers[DEVICE.printer.id]).toEqual({ [CARD.ip.tray]: CARD.ip.note });
    const tray = identifyCard(start, PIECE_ID.device(DEVICE.printer.id))?.trays.find((candidate) => candidate.id === CARD.ip.tray);
    expect(tray?.chips.map((chip) => toPlainText(chip.label))).toEqual([IP.printer, IP.note, IP.marta]);
    expect(tray?.chips.find((chip) => chip.id === tray.saved)?.label).toBe(IP.note);
    expect(openTasks(start)).toContain(TASK.printer);
  });

  it('01-01: pressing Listo with 192.168.1.300 picked shows that the numbers stop at 255 and leaves the task open', () => {
    expect(printerLines(start, CARD.ip.note)).toEqual([NOTE_FEEDBACK]);
    const confirmed = pickPrinter(start, CARD.ip.note);
    expect(confirmed.answers[DEVICE.printer.id]).toEqual({ [CARD.ip.tray]: CARD.ip.note });
    expect(openTasks(confirmed)).toContain(TASK.printer);
  });

  it('01-01: pressing Listo with 192.168.1.12 picked says it is the IP of laptop-marta', () => {
    const [own] = printerLines(start, CARD.ip.marta);
    expect(own).toBe(MARTA_FEEDBACK);
    expect(own).toContain(DEVICE.marta.name);
    expect(openTasks(pickPrinter(start, CARD.ip.marta))).toContain(TASK.printer);
  });

  it("01-01: every path through the printer's card shows the rule of the note", () => {
    expect(printerLines(start, CARD.ip.note)).toEqual([NOTE_FEEDBACK]);
    expect(printerLines(start, CARD.ip.right)).toEqual([RIGHT_FEEDBACK, NOTE_RULE]);
    expect(printerLines(start, CARD.ip.marta)).toEqual([MARTA_FEEDBACK, NOTE_RULE]);
    expect(printerLines(start, CARD.ip.right).join(' ')).toBe(`Correcto. ${NOTE_RULE}`);
    expect(openTasks(pickPrinter(start, CARD.ip.right))).not.toContain(TASK.printer);
    expect(openTasks(pickPrinter(start, CARD.ip.marta))).toContain(TASK.printer);
  });

  it('01-01: the printer task is not done until Listo is pressed with 192.168.1.21, so nobody completes it without the line', () => {
    expect(openTasks(start)).toEqual([TASK.visitor, TASK.printer]);
    expect(start.answers[DEVICE.printer.id]).toEqual({ [CARD.ip.tray]: CARD.ip.note });
    const sent = sessionReducer(markVisitor(start), { type: 'submit' });
    expect(sent.phase).toBe('playing');
    expect(sent.rejection?.failingTaskIds).toEqual([TASK.printer]);
    expect(sent.answers[DEVICE.printer.id]).toEqual({ [CARD.ip.tray]: CARD.ip.note });
    const confirmed = pickPrinter(sent, CARD.ip.right);
    expect(openTasks(confirmed)).toEqual([]);
    expect(printerLines(confirmed, CARD.ip.right)).toEqual([RIGHT_FEEDBACK, NOTE_RULE]);
  });

  it('01-01: no card and no task sends anything', () => {
    expect(start.runs).toEqual([]);
    expect(start.sent).toEqual([]);
  });
});

describe('01-02, the envelope', () => {
  const start = startSession(INCIDENTS, THE_ENVELOPE);

  it('01-02: a packet to 192.168.1.21 reaches the printer and completes the task', () => {
    expect(openTasks(start)).toEqual([TASK.packet]);
    const sent = packetTo(start, ADDRESS.printer.id);
    expect(sent.sent).toMatchObject([{ reached: true, replied: true, trace: { destinationId: DEVICE.printer.id } }]);
    expect(openTasks(sent)).toEqual([]);
    const closed = sessionReducer(sent, { type: 'submit' });
    expect(closed.phase).toBe('explaining');
    expect(starsOf(closed)).toMatchObject({ closed: true, middle: true });
  });

  it('01-02: a packet to 192.168.1.12 reaches laptop-marta and the task stays open', () => {
    const sent = packetTo(start, ADDRESS.marta.id);
    expect(sent.sent).toMatchObject([{ reached: true, trace: { destinationId: DEVICE.marta.id }, by: [DEVICE.marta.id] }]);
    expect(openTasks(sent)).toEqual([TASK.packet]);
    expect(sessionReducer(sent, { type: 'submit' }).rejection?.failingTaskIds).toEqual([TASK.packet]);
  });

  it('01-02: the box shows the header with the source and the destination IP', () => {
    const sent = packetTo(start, ADDRESS.printer.id);
    const box = inspect(sent, sent.sent[0].pieceId);
    const header = box?.fields.find((field) => toPlainText(field.label) === HEADER_LABEL);
    expect(header?.lines.map((line) => toPlainText(line))).toEqual([`IP de origen: ${IP.you}`, `IP de destino: ${IP.printer}`]);
    const result = box?.fields.find((field) => toPlainText(field.label) === RESULT_LABEL);
    expect(result?.lines.map((line) => toPlainText(line))).toEqual([`Llegó a ${DEVICE.printer.name}.`]);
    expect(box?.fields.map((field) => toPlainText(field.label)).filter((label) => label.includes('Echo Reply'))).toEqual([]);
  });

  it('01-02: laptop-visita is connected in the world of the envelope and its terminal sends a packet, not a ping', () => {
    expect(start.world.devices.find((device) => device.id === DEVICE.visitor.id)?.connected).toBe(true);
    expect(guidedOf(THE_ENVELOPE).mechanic).toBe('send');
    const offered = INCIDENTS.find((incident) => incident.id === THE_ENVELOPE);
    expect(offered?.mechanic === 'send' && offered.send.message.map((chip) => chip.command)).toEqual(['packet']);
  });
});

describe('the two incidents of block 1', () => {
  it('put the right explanation in a different place', () => {
    const places = [THE_OFFICE, THE_ENVELOPE].map((id) => guidedOf(id).explanation.findIndex((option) => option.correct));
    expect(new Set(places).size).toBe(places.length);
  });

  it('start with the base world and with the same world plus the cable of laptop-visita', () => {
    expect(startSession(INCIDENTS, THE_OFFICE).world.devices.find((device) => device.id === DEVICE.visitor.id)?.connected).toBe(false);
    expect(startSession(INCIDENTS, THE_ENVELOPE).world.devices.map((device) => device.id)).toEqual(
      startSession(INCIDENTS, THE_OFFICE).world.devices.map((device) => device.id),
    );
  });
});

describe('01-03, are you there', () => {
  const start = startSession(INCIDENTS, ARE_YOU_THERE);
  const pinged = pingTo(start, ADDRESS.printer.id);

  it('01-03: the reply header of a ping to the printer swaps source and destination', () => {
    const { trace, pieceId } = pinged.sent[0];
    expect(trace.header?.request).toMatchObject({ source: IP.you, destination: IP.printer });
    expect(trace.header?.reply).toEqual({ source: IP.printer, destination: IP.you });
    expect(fieldLines(pinged, pieceId, REQUEST_HEADER_LABEL)).toEqual([`IP de origen: ${IP.you}`, `IP de destino: ${IP.printer}`]);
    expect(fieldLines(pinged, pieceId, REPLY_HEADER_LABEL)).toEqual([`IP de origen: ${IP.printer}`, `IP de destino: ${IP.you}`]);
    expect(fieldLines(pinged, pieceId, HEADER_LABEL)).toBeUndefined();
    expect(fieldLines(pinged, pieceId, ROUND_TRIP_LABEL)).toBeUndefined();
  });

  it('01-03: the question asks for the origin and the destination of the Echo Reply, and the right option is the swapped pair', () => {
    const { question, explanation } = guidedOf(ARE_YOU_THERE);
    const header = pinged.sent[0].trace.header;
    const [source, destination] = [deviceNameAt(pinged, header?.reply?.source ?? ''), deviceNameAt(pinged, header?.reply?.destination ?? '')];
    expect([source, destination]).toEqual([DEVICE.printer.name, DEVICE.you.name]);
    expect(toPlainText(question ?? '')).toMatch(/Echo Reply.*IP de origen.*IP de destino/);
    const [right, ...wrong] = [...explanation].sort((a, b) => Number(b.correct) - Number(a.correct)).map((option) => toPlainText(option.text));
    expect(right).toMatch(new RegExp(`IP de origen es .*${source}.* IP de destino es .*${destination}`));
    expect(wrong.filter((text) => new RegExp(`IP de origen es .*${destination}.* IP de destino es .*${source}`).test(text))).toHaveLength(1);
    expect(wrong.filter((text) => /^Solo lleva la IP de destino/.test(text))).toHaveLength(1);
  });

  it('01-03: a ping to laptop-lucia comes back but does not complete the task', () => {
    const toLucia = pingTo(start, ADDRESS.lucia.id);
    expect(toLucia.sent).toMatchObject([{ replied: true, trace: { destinationId: DEVICE.lucia.id } }]);
    expect(openTasks(toLucia)).toEqual([TASK.ping]);
    expect(sessionReducer(toLucia, { type: 'submit' }).rejection?.failingTaskIds).toEqual([TASK.ping]);
  });

  it('01-03: a ping to the printer that comes back completes the task and closes the incident', () => {
    expect(openTasks(start)).toEqual([TASK.ping]);
    expect(openTasks(pinged)).toEqual([]);
    expect(starsOf(sessionReducer(pinged, { type: 'submit' }))).toMatchObject({ closed: true, middle: true });
  });
});

describe('01-04, ping yourself', () => {
  const start = startSession(INCIDENTS, PING_YOURSELF);
  const times = (session: Session, ...toIds: string[]) => toIds.map((toId) => sentTo(session, toId).trace.rttMs ?? Number.NaN);

  it("01-04: a ping to 127.0.0.1 and to localhost come back with a time smaller than the printer's", () => {
    const pinged = pingTo(start, ADDRESS.loopback.id, ADDRESS.localhost.id, ADDRESS.printer.id);
    const [loopback, localhost, printer] = times(pinged, ADDRESS.loopback.id, ADDRESS.localhost.id, ADDRESS.printer.id);
    expect(pinged.sent.map((packet) => packet.replied)).toEqual([true, true, true]);
    expect(loopback).toBeLessThan(printer);
    expect(localhost).toBeLessThan(printer);
    for (const toId of [ADDRESS.loopback.id, ADDRESS.localhost.id, ADDRESS.printer.id]) {
      expect(fieldLines(pinged, sentTo(pinged, toId).pieceId, ROUND_TRIP_LABEL)).toEqual([roundTripText(times(pinged, toId)[0]), EXAMPLE_FIGURE]);
    }
  });

  it('01-04: the pings to 127.0.0.1 and to localhost leave with source 127.0.0.1 and carry labels of their own', () => {
    const pinged = pingTo(start, ADDRESS.loopback.id, ADDRESS.localhost.id, ADDRESS.printer.id);
    const [loopback, localhost, printer] = [ADDRESS.loopback.id, ADDRESS.localhost.id, ADDRESS.printer.id].map((toId) => sentTo(pinged, toId));
    for (const packet of [loopback, localhost]) {
      expect(fieldLines(pinged, packet.pieceId, REQUEST_HEADER_LABEL)).toEqual([`IP de origen: ${IP.loopback}`, `IP de destino: ${IP.loopback}`]);
      expect(fieldLines(pinged, packet.pieceId, REPLY_HEADER_LABEL)).toEqual([`IP de origen: ${IP.loopback}`, `IP de destino: ${IP.loopback}`]);
    }
    expect(fieldLines(pinged, printer.pieceId, REQUEST_HEADER_LABEL)).toEqual([`IP de origen: ${IP.you}`, `IP de destino: ${IP.printer}`]);
    const labels = [loopback, localhost, printer].map((packet) => toPlainText(packet.label));
    expect(labels).toEqual([`ping de ${DEVICE.you.name} a ${IP.loopback}`, `ping de ${DEVICE.you.name} a ${ADDRESS.localhost.address}`, `ping de ${DEVICE.you.name} a ${DEVICE.printer.name}`]);
  });

  it('01-04: both pings must come back to close the incident', () => {
    expect(openTasks(start)).toEqual([TASK.loopback, TASK.ping]);
    expect(openTasks(pingTo(start, ADDRESS.loopback.id))).toEqual([TASK.ping]);
    expect(openTasks(pingTo(start, ADDRESS.printer.id))).toEqual([TASK.loopback]);
    expect(openTasks(pingTo(start, ADDRESS.localhost.id, ADDRESS.printer.id))).toEqual([TASK.loopback]);
    const both = pingTo(start, ADDRESS.loopback.id, ADDRESS.printer.id);
    expect(openTasks(both)).toEqual([]);
    expect(starsOf(sessionReducer(both, { type: 'submit' }))).toMatchObject({ closed: true, middle: true });
  });
});

describe('01-05, when it does not come back', () => {
  const start = startSession(INCIDENTS, WHEN_IT_DOES_NOT_COME_BACK);
  const silent = pingTo(start, ADDRESS.marta.id);
  const warned = pingTo(start, ADDRESS.nobody.id);

  it('01-05: a ping to laptop-marta ends in silence and no piece, stamp or text names a firewall', () => {
    const run = silent.sent[0];
    expect(start.world.devices.find((device) => device.id === DEVICE.marta.id)?.firewallIds).toEqual([HIDDEN_FIREWALL.type === 'addFirewall' ? HIDDEN_FIREWALL.firewall.id : '']);
    expect(run).toMatchObject({ replied: false, hiddenStop: true, blocked: false, warning: null, trace: { outcome: 'timeout' } });
    expect(run.trace.rttMs).toBeUndefined();
    expect(pieceViews(silent).filter((piece) => piece.kind === 'firewall')).toEqual([]);
    expect(fieldLines(silent, run.pieceId, STOPPED_LABEL)).toEqual([NOTHING_CAME_BACK]);
    expect(everythingShown(silent).filter((text) => FIREWALL_WORDS.test(text))).toEqual([]);
    expect(everythingShown(start).filter((text) => FIREWALL_WORDS.test(text))).toEqual([]);
    expect(incidentTexts(guidedOf(WHEN_IT_DOES_NOT_COME_BACK)).map((text) => toPlainText(text)).filter((text) => FIREWALL_WORDS.test(text))).toEqual([]);
  });

  it('01-05: the same ping shows the firewall once the incident introduces the term, so the check above can fail', () => {
    const teaching = INCIDENTS.map((incident): Incident => (incident.id === WHEN_IT_DOES_NOT_COME_BACK ? { ...incident, introduces: [...incident.introduces, 'firewall'] } : incident));
    const learned = pingTo(startSession(teaching, WHEN_IT_DOES_NOT_COME_BACK), ADDRESS.marta.id);
    expect(learned.sent[0]).toMatchObject({ blocked: true, hiddenStop: false });
    expect(pieceViews(learned).filter((piece) => piece.kind === 'firewall')).not.toEqual([]);
    expect(everythingShown(learned).filter((text) => FIREWALL_WORDS.test(text))).not.toEqual([]);
  });

  it('01-05: a ping to 192.168.1.50 ends in a warning from your own laptop', () => {
    const run = warned.sent[0];
    expect(run).toMatchObject({ replied: false, reached: false, by: [DEVICE.you.id], warning: { term: 'host-unreachable', by: 'sender' }, trace: { outcome: 'unreachable' } });
    expect(run.trace.notice).toMatchObject({ kind: 'host-unreachable', fromId: DEVICE.you.id });
    expect(run.trace.rttMs).toBeUndefined();
    expect(fieldLines(warned, run.pieceId, STOPPED_LABEL)).toEqual([SENDER_LOOKED]);
    expect(fieldLines(warned, run.pieceId, ROUND_TRIP_LABEL)).toBeUndefined();
    expect(everythingShown(warned).filter((text) => NOT_NETWORK_JARGON.test(text))).toEqual([]);
  });

  it('01-05: the incident closes only after both results were seen', () => {
    expect(openTasks(start)).toEqual([TASK.silence, TASK.warning]);
    expect(openTasks(silent)).toEqual([TASK.warning]);
    expect(openTasks(warned)).toEqual([TASK.silence]);
    expect(openTasks(pingTo(start, ADDRESS.printer.id))).toEqual([TASK.silence, TASK.warning]);
    const both = pingTo(start, ADDRESS.marta.id, ADDRESS.nobody.id);
    expect(openTasks(both)).toEqual([]);
    expect(starsOf(sessionReducer(both, { type: 'submit' }))).toMatchObject({ closed: true, middle: true });
  });

  it('01-05: nothing says the silence is a switched-off device except the wrong option that the feedback refutes', () => {
    const { explanation } = guidedOf(WHEN_IT_DOES_NOT_COME_BACK);
    const [offered] = explanation.filter((option) => SWITCHED_OFF.test(toPlainText(option.text)));
    expect(offered).toBeDefined();
    expect(offered.correct).toBe(false);
    const rest = incidentTexts(guidedOf(WHEN_IT_DOES_NOT_COME_BACK)).filter((text) => text !== offered.text && text !== offered.feedback);
    expect(rest.filter((text) => SWITCHED_OFF.test(toPlainText(text)))).toEqual([]);
  });
});

describe('the five incidents of blocks 1 and 2', () => {
  it('never put the right explanation in the same place as the incident before', () => {
    const places = [THE_OFFICE, THE_ENVELOPE, ARE_YOU_THERE, PING_YOURSELF, WHEN_IT_DOES_NOT_COME_BACK].map((id) => guidedOf(id).explanation.findIndex((option) => option.correct));
    expect(places.filter((place, index) => index > 0 && place === places[index - 1])).toEqual([]);
  });

  it('give 03, 04 and 05 their own place for the right explanation', () => {
    const places = [ARE_YOU_THERE, PING_YOURSELF, WHEN_IT_DOES_NOT_COME_BACK].map((id) => guidedOf(id).explanation.findIndex((option) => option.correct));
    expect(new Set(places).size).toBe(places.length);
  });

  it('start from the world of the incident before, and 05 adds the firewall of laptop-marta to it', () => {
    const [envelope, yourself, silence] = [THE_ENVELOPE, PING_YOURSELF, WHEN_IT_DOES_NOT_COME_BACK].map((id) => startSession(INCIDENTS, id).world);
    const toThePing = startSession(INCIDENTS, ARE_YOU_THERE).world;
    expect(toThePing).toEqual(envelope);
    expect(yourself).toEqual(envelope);
    expect(envelope.firewalls).toEqual([]);
    expect(silence.firewalls).toHaveLength(1);
    expect({ ...silence, firewalls: [], devices: silence.devices.map((device) => ({ ...device, firewallIds: [] })) }).toEqual(envelope);
  });
});

function drawnLabels(session: Session): string[] {
  return pieceViews(session)
    .map((piece) => `${piece.kind}:${toPlainText(piece.label)}`)
    .sort();
}

function gatewayOf(session: Session): string | undefined {
  return session.world.devices.find((device) => device.id === DEVICE.you.id)?.gateway;
}

function pickGateway(session: Session, chipId: string): Session {
  return sessionReducer(session, { type: 'setSetting', deviceId: DEVICE.you.id, settingId: GATEWAY.setting, chipId });
}

describe('01-06, your network and the router', () => {
  const start = startSession(INCIDENTS, YOUR_NETWORK);
  const pinged = pingTo(start, ADDRESS.printer.id, ADDRESS.andres.id);

  it('01-06: a ping to the printer goes straight and a ping to laptop-andres goes through the router', () => {
    const [printer, andres] = [ADDRESS.printer.id, ADDRESS.andres.id].map((toId) => sentTo(pinged, toId));
    expect(printer).toMatchObject({ replied: true, trace: { destinationId: DEVICE.printer.id } });
    expect(printer.trace.hops).toBeUndefined();
    expect(andres).toMatchObject({ replied: true, trace: { destinationId: DEVICE.andres.id, hops: [{ routerId: ROUTER.office.id, ip: IP.router }] } });
    expect(sentTo(pingTo(start, ADDRESS.lucia.id), ADDRESS.lucia.id).trace.hops).toBeUndefined();
  });

  it('01-06: the box says the ping to the second floor went through the router and shows its IP, without the word hop', () => {
    expect(fieldLines(pinged, sentTo(pinged, ADDRESS.andres.id).pieceId, PASSED_THROUGH_LABEL)).toEqual([ROUTER_LINE]);
    expect(fieldLines(pinged, sentTo(pinged, ADDRESS.printer.id).pieceId, PASSED_THROUGH_LABEL)).toBeUndefined();
    expect(everythingShown(pinged).filter((text) => HOP_OR_TTL.test(text))).toEqual([]);
    expect(incidentTexts(guidedOf(YOUR_NETWORK)).map((text) => toPlainText(text)).filter((text) => HOP_OR_TTL.test(text))).toEqual([]);
  });

  it('01-06: the ping through the router takes longer than the straight one, and floor 1 keeps the time a hop had before it was declared', () => {
    const [printer, andres] = [ADDRESS.printer.id, ADDRESS.andres.id].map((toId) => sentTo(pinged, toId).trace.rttMs ?? Number.NaN);
    expect(printer).toBeLessThan(andres);
    expect(sentTo(pingTo(startSession(INCIDENTS, PING_YOURSELF), ADDRESS.printer.id), ADDRESS.printer.id).trace.rttMs).toBe(printer);
  });

  it('01-06: the box of the office router shows its IP on each floor, in 01-06 and in 01-07', () => {
    const routerId = PIECE_ID.router(ROUTER.office.id);
    expect(fieldLines(start, routerId, 'IP en Piso 1')).toEqual([IP.router]);
    expect(fieldLines(start, routerId, 'IP en Piso 2')).toEqual([IP.routerSecondFloor]);
    expect(fieldLines(startSession(INCIDENTS, WHO_GETS_WHAT_IS_OUTSIDE), routerId, 'IP en Piso 1')).toEqual([IP.router]);
  });

  it('01-06: draws tu-laptop, laptop-lucia, the printer, laptop-andres and the office router, and no other device', () => {
    expect(drawnLabels(start)).toEqual(['device:impresora', 'device:laptop-andres', 'device:laptop-lucia', 'device:tu-laptop', 'edge:router-oficina']);
    expect(start.world.devices.map((device) => device.name)).toEqual(expect.arrayContaining([DEVICE.marta.name, DEVICE.visitor.name]));
    expect(drawnLabels(start)).not.toContain(`device:${DEVICE.marta.name}`);
  });

  it('01-06: draws no internet and no router of the provider', () => {
    expect(pieceViews(start).filter((piece) => piece.kind === 'internet' || piece.kind === 'actor')).toEqual([]);
    expect(start.world.routers?.map((router) => router.id)).toEqual([ROUTER.office.id]);
    expect(start.world.actors).toEqual([]);
  });

  it('01-06: both the ping to the printer and the ping to laptop-andres must come back to close the incident', () => {
    expect(openTasks(start)).toEqual([TASK.ping, TASK.andres]);
    expect(openTasks(pingTo(start, ADDRESS.printer.id))).toEqual([TASK.andres]);
    expect(openTasks(pingTo(start, ADDRESS.andres.id, ADDRESS.lucia.id))).toEqual([TASK.ping]);
    expect(openTasks(pinged)).toEqual([]);
    expect(starsOf(sessionReducer(pinged, { type: 'submit' }))).toMatchObject({ closed: true, middle: true });
  });

  it('01-06: the second floor, the router and the gateways make a valid world that starts from the world of 01-05', () => {
    expect(networkSchema.safeParse(start.world).success).toBe(true);
    expect(start.world.devices.filter((device) => device.id !== DEVICE.andres.id).map((device) => device.gateway)).toEqual(Array(5).fill(IP.router));
    expect(start.world.devices.find((device) => device.id === DEVICE.andres.id)).toMatchObject({ lanId: 'floor-2', gateway: IP.routerSecondFloor });
    const before = solvedWorld(INCIDENTS, WHEN_IT_DOES_NOT_COME_BACK);
    expect(start.world.devices.slice(0, before.devices.length).map((device) => ({ ...device, gateway: undefined }))).toEqual(before.devices.map((device) => ({ ...device, gateway: undefined })));
    expect(start.world.firewalls).toEqual(before.firewalls);
  });
});

describe('01-07, who gets whats outside', () => {
  const start = startSession(INCIDENTS, WHO_GETS_WHAT_IS_OUTSIDE);
  const stuck = pingTo(start, ADDRESS.andres.id);
  const gatewayAt = (chipId: string) => pingTo(pickGateway(start, chipId), ADDRESS.andres.id);

  it('01-07: draws the same pieces as 01-06', () => {
    const before = startSession(INCIDENTS, YOUR_NETWORK);
    expect(drawnLabels(start)).toEqual(drawnLabels(before));
    expect(guidedOf(WHO_GETS_WHAT_IS_OUTSIDE).shown).toEqual(guidedOf(YOUR_NETWORK).shown);
  });

  it('01-07: the ping to the second floor does not leave a laptop with no gateway', () => {
    expect(gatewayOf(start)).toBeUndefined();
    const [run] = stuck.sent;
    expect(run).toMatchObject({ replied: false, reached: false, warning: null, by: [DEVICE.you.id], trace: { outcome: 'no-route' } });
    expect(run.trace).not.toHaveProperty('hops');
    expect(run.trace.rttMs).toBeUndefined();
    expect(fieldLines(stuck, run.pieceId, STOPPED_LABEL)).toEqual([NO_GATEWAY_TEXT]);
    expect(openTasks(stuck)).toEqual([TASK.andres]);
  });

  it('01-07: the printer as a gateway receives the packet and nothing comes back', () => {
    const [run] = gatewayAt(GATEWAY.printer).sent;
    expect(run).toMatchObject({ replied: false, warning: null, trace: { outcome: 'timeout' } });
    expect(run.trace).not.toHaveProperty('hops');
    expect(run.trace.steps.at(-1)).toMatchObject({ at: DEVICE.printer.id, verdict: 'drop', reason: { code: 'route-gateway-not-a-router', ip: IP.printer } });
    expect(fieldLines(gatewayAt(GATEWAY.printer), run.pieceId, STOPPED_LABEL)).toEqual([PRINTER_GATEWAY_TEXT]);
    expect(openTasks(gatewayAt(GATEWAY.printer))).toEqual([TASK.andres]);
  });

  it('01-07: an IP nobody has as a gateway gives a warning from the laptop', () => {
    const [run] = gatewayAt(GATEWAY.nobody).sent;
    expect(run).toMatchObject({ replied: false, by: [DEVICE.you.id], warning: { term: 'host-unreachable', by: 'sender' }, trace: { outcome: 'unreachable' } });
    expect(run.trace.notice).toMatchObject({ kind: 'host-unreachable', fromId: DEVICE.you.id });
    expect(fieldLines(gatewayAt(GATEWAY.nobody), run.pieceId, STOPPED_LABEL)).toEqual([NOBODY_GATEWAY_TEXT]);
  });

  it('01-07: setting 192.168.1.1 as gateway makes the ping come back and clears the stamps of before', () => {
    expect(stuck.sent).toHaveLength(1);
    const set = pickGateway(stuck, GATEWAY.router);
    expect(gatewayOf(set)).toBe(IP.router);
    expect(set.sent).toEqual([]);
    expect(set.sends).toBe(stuck.sends);
    const done = pingTo(set, ADDRESS.andres.id);
    expect(done.sent).toMatchObject([{ replied: true, trace: { destinationId: DEVICE.andres.id, hops: [{ routerId: ROUTER.office.id }] } }]);
    expect(openTasks(done)).toEqual([]);
    expect(starsOf(sessionReducer(done, { type: 'submit' }))).toMatchObject({ closed: true, middle: true });
  });

  it('01-07: the gateway is set from the Ajustes de red card of the laptop, and its terminal offers no setting', () => {
    const entries = pieceViews(start).flatMap((piece) => (piece.settings ? [{ owner: piece.anchorId, id: piece.settings.id, label: toPlainText(piece.settings.label) }] : []));
    expect(entries).toEqual([{ owner: DEVICE.you.id, id: PIECE_ID.settings(DEVICE.you.id), label: SETTINGS_ENTRY }]);
    const card = settingsCard(start, entries[0].id);
    expect(card?.settings.map((setting) => ({ id: setting.id, name: toPlainText(setting.name), picked: setting.picked, chips: setting.chips.map((chip) => toPlainText(chip.label)) }))).toEqual([
      { id: GATEWAY.setting, name: GATEWAY_TRAY, picked: GATEWAY.none, chips: [NO_GATEWAY_CHIP, IP.router, IP.printer, IP.nobody] },
    ]);
    const terminal = terminalCard(start, PIECE_ID.device(DEVICE.you.id));
    expect(terminal?.trays.map((tray) => tray.name)).toEqual(['to']);
    expect(terminal?.trays.flatMap((tray) => tray.chips.map((chip) => toPlainText(chip.label)))).toEqual([IP.andres, IP.printer]);
    expect(settingsCard(pickGateway(start, GATEWAY.router), entries[0].id)?.settings[0].picked).toBe(GATEWAY.router);
  });

  it('01-07: the world is valid with every gateway the card offers', () => {
    expect([GATEWAY.none, GATEWAY.router, GATEWAY.printer, GATEWAY.nobody].map((chipId) => networkSchema.safeParse(pickGateway(start, chipId).world).success)).toEqual([true, true, true, true]);
  });
});

describe('01-08, the network of networks', () => {
  const start = startSession(INCIDENTS, THE_NETWORK_OF_NETWORKS);
  const toServer = pingTo(start, ADDRESS.server.id);
  const toOtherOffice = pingTo(start, ADDRESS.otherOffice.id);
  const both = pingTo(start, ADDRESS.server.id, ADDRESS.otherOffice.id);
  const STOPPED_TEXT = `${IP.otherOfficePrinter} es una IP privada: se repite en muchas redes y internet no la entrega. Un router, ya fuera de la oficina, descarta el paquete sin avisar.`;

  it('01-08: a ping to the server of the internet comes back', () => {
    const [run] = toServer.sent;
    expect(run).toMatchObject({ replied: true, reached: true, warning: null, by: [SERVER.id], trace: { outcome: 'replied', destinationId: SERVER.id } });
    expect(hopIds(run)).toEqual([ROUTER.office.id, ROUTER.provider.id, ROUTER.destination.id]);
    expect(run.trace.rttMs).toBeGreaterThan(sentTo(pingTo(start, ADDRESS.printer.id), ADDRESS.printer.id).trace.rttMs ?? Number.NaN);
    expect(fieldLines(toServer, run.pieceId, PASSED_THROUGH_LABEL)).toEqual([ROUTER_LINE, OUTSIDE_THE_OFFICE]);
    expect(openTasks(toServer)).toEqual([TASK.otherOffice]);
  });

  it('01-08: the headers of a trip that leaves the office are labelled as seen in the local network and say nothing of how they change', () => {
    const [run] = toServer.sent;
    expect(fieldLines(toServer, run.pieceId, LOCAL_REQUEST_HEADER_LABEL)).toEqual([`IP de origen: ${IP.you}`, `IP de destino: ${IP.server}`]);
    expect(fieldLines(toServer, run.pieceId, LOCAL_REPLY_HEADER_LABEL)).toEqual([`IP de origen: ${IP.server}`, `IP de destino: ${IP.you}`]);
    const notes = inspect(toServer, run.pieceId)?.fields.flatMap((field) => (field.notes ?? []).map((note) => toPlainText(note)));
    expect(notes).toEqual([HEADER_CHANGES]);
    const [lost] = toOtherOffice.sent;
    expect(fieldLines(toOtherOffice, lost.pieceId, LOCAL_HEADER_LABEL)).toEqual([`IP de origen: ${IP.you}`, `IP de destino: ${IP.otherOfficePrinter}`]);
    expect(JSON.stringify([inspect(toServer, run.pieceId), inspect(toOtherOffice, lost.pieceId)])).not.toMatch(/NAT|pública/);
    const inside = pingTo(startSession(INCIDENTS, YOUR_NETWORK), ADDRESS.andres.id);
    expect(fieldLines(inside, sentTo(inside, ADDRESS.andres.id).pieceId, REQUEST_HEADER_LABEL)).toEqual([`IP de origen: ${IP.you}`, `IP de destino: ${IP.andres}`]);
    expect(inspect(inside, sentTo(inside, ADDRESS.andres.id).pieceId)?.fields.flatMap((field) => field.notes ?? [])).toEqual([]);
  });

  it('01-08: a ping to the private IP of another office dies at the first router outside the office with no warning', () => {
    const [run] = toOtherOffice.sent;
    expect(run).toMatchObject({ replied: false, reached: false, warning: null, trace: { outcome: 'timeout', destinationId: null } });
    expect(run.trace.notice).toBeUndefined();
    expect(run.trace.rttMs).toBeUndefined();
    expect(hopIds(run)).toEqual([ROUTER.office.id, ROUTER.provider.id]);
    expect(run.trace.steps.at(-1)).toMatchObject({ stage: 'forward', at: ROUTER.provider.id, verdict: 'drop', reason: { code: 'forward-private-dropped', ip: IP.otherOfficePrinter } });
    expect(run.trace.steps.some((step) => step.at === ROUTER.office.id && step.verdict === 'drop')).toBe(false);
    expect(openTasks(toOtherOffice)).toEqual([TASK.server]);
  });

  it('01-08: no text or box of the trip names NAT', () => {
    expect(everythingShown(both).filter((text) => NAT_WORDS.test(text))).toEqual([]);
    expect(incidentTexts(guidedOf(THE_NETWORK_OF_NETWORKS)).map((text) => toPlainText(text)).filter((text) => NAT_WORDS.test(text))).toEqual([]);
    const steps = both.sent.flatMap((run) => run.trace.steps);
    expect(steps.filter((step) => /nat/i.test(`${step.stage} ${step.reason.code}`))).toEqual([]);
    expect(steps.some((step) => step.reason.code === 'route-leaves-office')).toBe(true);
  });

  it('01-08: draws the office of 01-06, the internet and the server, and no router of the provider', () => {
    const office = drawnLabels(startSession(INCIDENTS, YOUR_NETWORK));
    expect(drawnLabels(start)).toEqual([...office, 'device:servidor-internet', 'internet:internet'].sort());
    expect(start.world.routers?.map((router) => router.id)).toEqual([ROUTER.office.id, ROUTER.provider.id, ROUTER.destination.id]);
    expect(pieceViews(start).filter((piece) => piece.kind === 'edge').map((piece) => piece.anchorId)).toEqual([ROUTER.office.id]);
    expect(guidedOf(THE_NETWORK_OF_NETWORKS).shown).toEqual(expect.arrayContaining([...guidedOf(YOUR_NETWORK).shown ?? [], SERVER.id]));
  });

  it('01-08: the lost ping to 10.0.0.10 ends between the office router and the internet, and no text of its box names a router outside the office', () => {
    const [run] = toOtherOffice.sent;
    const dropper = run.trace.steps.at(-1)?.at ?? '';
    expect(routerPlace(toOtherOffice, dropper)).toBe('outside');
    expect((run.trace.hops ?? []).filter((hop) => drawsRouter(toOtherOffice, hop.routerId)).map((hop) => hop.routerId)).toEqual([ROUTER.office.id]);
    expect(pieceViews(toOtherOffice).filter((piece) => piece.kind === 'internet' || piece.kind === 'edge').map((piece) => piece.kind)).toEqual(['edge', 'internet']);
    expect(fieldLines(toOtherOffice, run.pieceId, STOPPED_LABEL)).toEqual([STOPPED_TEXT]);
    expect(plainBox(toOtherOffice, run.pieceId).filter((text) => ROUTER_OUTSIDE.test(text))).toEqual([]);
    expect(everythingShown(both).filter((text) => ROUTER_OUTSIDE.test(text))).toEqual([]);
  });

  it('01-08: both the ping to the server and the lost ping to 10.0.0.10 must be seen to close the incident', () => {
    expect(openTasks(start)).toEqual([TASK.server, TASK.otherOffice]);
    expect(openTasks(pingTo(start, ADDRESS.printer.id))).toEqual([TASK.server, TASK.otherOffice]);
    expectClosed(both);
  });

  it('01-08: starts from the world of 01-07 solved plus the internet, and the world is valid with the routers of the provider kept in it', () => {
    const solved = solvedWorld(INCIDENTS, WHO_GETS_WHAT_IS_OUTSIDE);
    expect(networkSchema.safeParse(start.world).success).toBe(true);
    expect(start.world.devices).toEqual(solved.devices);
    expect(start.world.actors.map((actor) => actor.id)).toEqual([SERVER.id]);
    expect(start.world.routers?.map((router) => router.id)).toEqual([ROUTER.office.id, ROUTER.provider.id, ROUTER.destination.id]);
  });
});

describe('01-09, counting hops', () => {
  const start = startSession(INCIDENTS, COUNTING_HOPS);
  const all = TTL_VALUES.reduce(pingWithTtl, start);

  it('01-09: a ping with TTL 3 gets Time Exceeded from the router of the office', () => {
    const sent = pingWithTtl(start, 3);
    const [run] = sent.sent;
    expect(run).toMatchObject({ replied: false, reached: false, by: [ROUTER.office.id], warning: { term: 'time-exceeded', by: 'router' }, trace: { outcome: 'ttl-exceeded' } });
    expect(run.trace.notice).toMatchObject({ kind: 'time-exceeded', fromId: ROUTER.office.id, fromIp: IP.router });
    expect(hopIds(run)).toEqual([ROUTER.office.id, ROUTER.provider.id, ROUTER.office.id]);
    expect(openTasks(sent)).toEqual([TASK.ttl64]);
    expect(terminalLine(sent, { to: ADDRESS.server.id, message: PING_WITH_TTL[3].id })).toBe(`ping -t 3 ${IP.server}`);
    expect(fieldLines(sent, run.pieceId, HOPS_LABEL)).toHaveLength(3);
  });

  it('01-09: a ping with TTL 64 gets Time Exceeded too, because the packet loops', () => {
    const sent = pingWithTtl(start, 64);
    const [run] = sent.sent;
    const routers = hopIds(run);
    expect(run).toMatchObject({ replied: false, reached: false, warning: { term: 'time-exceeded', by: 'router' }, trace: { outcome: 'ttl-exceeded' } });
    expect(routers).toHaveLength(64);
    expect(new Set(routers)).toEqual(new Set([ROUTER.office.id, ROUTER.provider.id]));
    expect(routers.filter((id, index) => index > 0 && id === routers[index - 1])).toEqual([]);
    expect(run.trace.hops?.at(-1)).toMatchObject({ ttlLeft: 0 });
    expect(fieldLines(sent, run.pieceId, HOPS_LABEL)?.at(-1)).toBe('y 56 saltos más');
    expect(run.trace.steps.some((step) => step.at === SERVER.id || step.at === ROUTER.destination.id)).toBe(false);
    expect(openTasks(sent)).toEqual([TASK.ttl3]);
    expectClosed(pingWithTtl(sent, 3));
  });

  it('01-09: with TTL 1 the router of the office warns and with TTL 2 the router of the provider', () => {
    const [one, two] = ([1, 2] as const).map((ttl) => pingWithTtl(start, ttl).sent[0]);
    expect(one.trace.notice).toMatchObject({ fromId: ROUTER.office.id, fromIp: IP.router });
    expect(two.trace.notice).toMatchObject({ fromId: ROUTER.provider.id, fromIp: IP.provider });
    expect(hopIds(one)).toEqual([ROUTER.office.id]);
    expect(hopIds(two)).toEqual([ROUTER.office.id, ROUTER.provider.id]);
    expect(openTasks(pingWithTtl(start, 1))).toEqual([TASK.ttl3, TASK.ttl64]);
  });

  it('01-09: draws tu-laptop, the two routers of the loop, the internet and the server, and no other device of the office', () => {
    expect(drawnLabels(start)).toEqual(['device:servidor-internet', 'device:tu-laptop', 'edge:router-oficina', 'edge:router-proveedor', 'internet:internet']);
    expect(start.world.routers?.map((router) => router.id)).toContain(ROUTER.destination.id);
    expect(drawnLabels(start)).not.toContain(`edge:${ROUTER.destination.name}`);
  });

  it('01-09: every router that sends Time Exceeded is drawn', () => {
    const warners = all.sent.flatMap((run) => (run.trace.outcome === 'ttl-exceeded' && run.trace.notice ? [run.trace.notice.fromId] : []));
    expect(all.sent).toHaveLength(TTL_VALUES.length);
    expect(new Set(warners)).toEqual(new Set([ROUTER.office.id, ROUTER.provider.id]));
    for (const id of warners) expect(drawsRouter(all, id), id).toBe(true);
    expect(everythingShown(all).filter((text) => ROUTER_OUTSIDE_THE_LOOP.test(text))).toEqual([]);
  });

  it('01-09: the box calls the routers it passed through hops, shows the TTL the ping left with and the figure of a warning that came back', () => {
    const sent = pingWithTtl(start, 5);
    const [run] = sent.sent;
    expect(fieldLines(sent, run.pieceId, LOCAL_HEADER_LABEL)).toEqual([`IP de origen: ${IP.you}`, `IP de destino: ${IP.server}`, 'TTL al salir: 5']);
    expect(fieldLines(sent, run.pieceId, HEADER_LABEL)).toBeUndefined();
    expect(fieldLines(sent, run.pieceId, HOPS_LABEL)).toEqual([ROUTER_LINE, PROVIDER_LINE, ROUTER_LINE, PROVIDER_LINE, ROUTER_LINE]);
    expect(fieldLines(sent, run.pieceId, PASSED_THROUGH_LABEL)).toBeUndefined();
    expect(fieldLines(sent, run.pieceId, ROUND_TRIP_LABEL)).toEqual([roundTripText(run.trace.rttMs ?? Number.NaN), EXAMPLE_FIGURE]);
  });
});

describe('01-10, seeing the path', () => {
  const start = startSession(INCIDENTS, SEEING_THE_PATH);
  const pinged = pingTo(start, ADDRESS.server.id);
  const traced = sendWith(start, MESSAGE.traceroute.id, ADDRESS.server.id);
  const both = sendWith(pinged, MESSAGE.traceroute.id, ADDRESS.server.id);
  const picks = { from: ORIGIN.you.id, to: ADDRESS.server.id, message: MESSAGE.traceroute.id };
  const lines = () => tracerouteLines(traced, picks)?.lines ?? [];
  const routerOwning = (ip: string) => start.world.routers?.find((router) => router.interfaces.some((face) => face.ip === ip))?.id;

  it('01-10: the ping to the server ends in silence', () => {
    const [run] = pinged.sent;
    expect(run).toMatchObject({ replied: false, reached: false, warning: null, trace: { outcome: 'timeout' } });
    expect(run.trace.notice).toBeUndefined();
    expect(run.trace.rttMs).toBeUndefined();
    expect(fieldLines(pinged, run.pieceId, 'Resultado')?.[0]).toMatch(/^timeout/);
    expect(openTasks(pinged)).toEqual([TASK.traceroute]);
  });

  it('01-10: a traceroute lists the two routers and then stars', () => {
    const view = tracerouteLines(traced, picks);
    expect(view?.lines.map((line) => line.hop)).toEqual(Array.from({ length: TRACEROUTE_LINES }, (_, index) => index + 1));
    expect(view?.lines.map((line) => line.address)).toEqual([IP.router, IP.provider, ...Array<string>(TRACEROUTE_LINES - 2).fill(STAR)]);
    expect(view?.lines.slice(0, 2).map((line) => line.time !== null)).toEqual([true, true]);
    expect(view?.lines.slice(2).map((line) => line.time)).toEqual(Array(TRACEROUTE_LINES - 2).fill(null));
    expect(view?.error).toBeNull();
    expect(terminalLine(traced, { to: ADDRESS.server.id, message: MESSAGE.traceroute.id })).toBe(`traceroute -I ${IP.server}`);
  });

  it('01-10: a traceroute is labelled, stamped and inspected as a traceroute, with no TTL line and not as the ping its last probe is', () => {
    const run = sentTo(both, ADDRESS.server.id, MESSAGE.traceroute.id);
    const ping = sentTo(both, ADDRESS.server.id, MESSAGE.ping.id);
    expect(toPlainText(run.label)).toBe(`traceroute de ${DEVICE.you.name} a ${IP.server}`);
    expect(toPlainText(ping.label)).toBe(`ping de ${DEVICE.you.name} a ${IP.server}`);
    expect(stampLabel(toPlainText(run.label), 'lost')).toBe(`Paquete: traceroute de ${DEVICE.you.name} a ${IP.server}. Perdido.`);
    expect(fieldLines(both, run.pieceId, 'Qué es')).toEqual([TERMS.traceroute.definition]);
    expect(fieldLines(both, run.pieceId, LOCAL_HEADER_LABEL)).toEqual([`IP de origen: ${IP.you}`, `IP de destino: ${IP.server}`]);
    expect(plainBox(both, run.pieceId).join(' ')).not.toContain(TERMS.ping.definition);
    expect(plainBox(both, run.pieceId).filter((text) => text.startsWith('TTL'))).toEqual([]);
    expect(fieldLines(both, ping.pieceId, LOCAL_HEADER_LABEL)).toEqual([`IP de origen: ${IP.you}`, `IP de destino: ${IP.server}`, 'TTL al salir: 64']);
  });

  it('01-10: the last router that answered is the one before the broken stretch', () => {
    const answered = lines().filter((line) => line.address !== STAR);
    expect(answered.map((line) => routerOwning(line.address))).toEqual([ROUTER.office.id, ROUTER.provider.id]);
    const [run] = pinged.sent;
    expect(run.trace.steps.at(-1)).toMatchObject({ stage: 'forward', at: ROUTER.provider.id, verdict: 'drop', reason: { code: 'forward-no-route', warns: false } });
    expect(hopIds(run)).toEqual([ROUTER.office.id, ROUTER.provider.id]);
    expect(lines().map((line) => line.address)).not.toContain(IP.destination);
    expect(sentTo(traced, ADDRESS.server.id, MESSAGE.traceroute.id).route?.lines.filter((line) => line.ip !== undefined).map((line) => line.ip)).toEqual([IP.router, IP.provider]);
  });

  it('01-10: tu-laptop is the only device of the office drawn, and the office router, the two routers of the provider, the internet and the server are drawn', () => {
    expect(drawnLabels(start)).toEqual(['device:servidor-internet', 'device:tu-laptop', 'edge:router-destino', 'edge:router-oficina', 'edge:router-proveedor', 'internet:internet']);
    expect(pieceViews(start).filter((piece) => piece.kind === 'device').map((piece) => piece.anchorId)).toEqual([DEVICE.you.id, SERVER.id]);
  });

  it('01-10: every router a line of the traceroute names is drawn', () => {
    const named = lines().flatMap((line) => (line.address === STAR ? [] : [routerOwning(line.address) ?? line.address]));
    expect(named.length).toBeGreaterThan(0);
    for (const id of named) expect(drawsRouter(traced, id), id).toBe(true);
    expect(everythingShown(both).filter((text) => text.includes(IP.destination))).toEqual([]);
  });

  it('01-10: the ping and the traceroute must both be sent to close the incident', () => {
    expect(openTasks(start)).toEqual([TASK.serverSilence, TASK.traceroute]);
    expect(openTasks(traced)).toEqual([TASK.serverSilence]);
    expectClosed(both);
  });

  it('01-10: starts from the world of 01-09 with no loop, and the router of the provider has no way to the server and does not warn', () => {
    const loop = solvedWorld(INCIDENTS, COUNTING_HOPS).routers?.find((router) => router.id === ROUTER.provider.id);
    const broken = start.world.routers?.find((router) => router.id === ROUTER.provider.id);
    expect(loop?.routes).toEqual([{ to: 'default', next: ROUTER.office.id }]);
    expect(broken).toMatchObject({ sendsUnreachable: false });
    expect(broken?.routes.map((route) => route.next)).toEqual([ROUTER.office.id]);
    expect(networkSchema.safeParse(start.world).success).toBe(true);
  });
});

describe('the ten incidents of blocks 1 to 3', () => {
  const TEN = [THE_OFFICE, THE_ENVELOPE, ARE_YOU_THERE, PING_YOURSELF, WHEN_IT_DOES_NOT_COME_BACK, YOUR_NETWORK, WHO_GETS_WHAT_IS_OUTSIDE, THE_NETWORK_OF_NETWORKS, COUNTING_HOPS, SEEING_THE_PATH];
  const places = TEN.map((id) => guidedOf(id).explanation.findIndex((option) => option.correct));

  it('never put the right explanation in the same place as the incident before', () => {
    expect(places.filter((place, index) => index > 0 && place === places[index - 1])).toEqual([]);
  });

  it('start and end in a world the network schema accepts, so the floors the base world declares break nothing in 01-01 to 01-05', () => {
    const problems = TEN.flatMap((id) => [startWorld(INCIDENTS, id), solvedWorld(INCIDENTS, id)].flatMap((world) => networkSchema.safeParse(world).error?.issues.map((issue) => `${id}: ${issue.message}`) ?? []));
    expect(problems).toEqual([]);
  });

  it('put the right explanation of 06 to 10 in places of their own', () => {
    expect(places.slice(-5)).toEqual([2, 0, 1, 0, 2]);
  });

  it('start 07 from the world of 06 solved, with the laptop of the player reinstalled and so with no gateway', () => {
    const { world } = startSession(INCIDENTS, WHO_GETS_WHAT_IS_OUTSIDE);
    const solved = solvedWorld(INCIDENTS, YOUR_NETWORK);
    expect(solved.devices.find((device) => device.id === DEVICE.you.id)?.gateway).toBe(IP.router);
    expect({ ...world, devices: world.devices.map((device) => ({ ...device, gateway: undefined })) }).toEqual({ ...solved, devices: solved.devices.map((device) => ({ ...device, gateway: undefined })) });
    expect(world.devices.filter((device) => device.gateway === undefined).map((device) => device.id)).toEqual([DEVICE.you.id]);
  });
});

describe('01-11, the guard', () => {
  const start = startSession(INCIDENTS, THE_GUARD);
  const dropped = pingTo(start, ADDRESS.marta.id);
  const answered = pingTo(start, ADDRESS.lucia.id);
  const both = pingTo(start, ADDRESS.marta.id, ADDRESS.lucia.id);
  const firewallBox = () => inspect(start, PIECE_ID.firewall(FIREWALL.marta));

  it('01-11: the ping to laptop-marta now leaves a blocked stamp on its firewall and the reason says it was dropped without a warning', () => {
    const [run] = dropped.sent;
    expect(run).toMatchObject({ replied: false, reached: false, blocked: true, hiddenStop: false, warning: null, by: [FIREWALL.marta], trace: { outcome: 'timeout' } });
    expect(fieldLines(dropped, run.pieceId, STOPPED_LABEL)).toEqual([DROPPED_TEXT]);
    expect(pieceViews(dropped).filter((piece) => piece.kind === 'firewall').map((piece) => ({ anchorId: piece.anchorId, label: toPlainText(piece.label) }))).toEqual([{ anchorId: DEVICE.marta.id, label: `firewall ${DEVICE.marta.name}` }]);
    expect(taskHolds(guidedOf(THE_GUARD).tasks[0], dropped.runs, dropped.sent)).toBe(true);
  });

  it('01-11: the ping to laptop-lucia comes back', () => {
    const [run] = answered.sent;
    expect(run).toMatchObject({ replied: true, blocked: false, hiddenStop: false, by: [DEVICE.lucia.id], trace: { outcome: 'replied' } });
    expect(pieceViews(answered).filter((piece) => piece.kind === 'firewall').map((piece) => piece.anchorId)).toEqual([DEVICE.marta.id]);
    expect(openTasks(answered)).toEqual([TASK.guard]);
    expect(openTasks(dropped)).toEqual([TASK.lucia]);
  });

  it('01-11: inspecting the firewall of laptop-marta says what a firewall is', () => {
    expect(firewallBox()?.fields.map((field) => toPlainText(field.label))).toEqual(['Qué es']);
    expect(firewallBox()?.fields.flatMap((field) => field.lines.map((line) => toPlainText(line)))).toEqual([TERMS.firewall.definition]);
    expect(TERMS.firewall.definition).not.toMatch(ABOUT_RULES);
    expect(TERMS.firewall.definition.length).toBeLessThanOrEqual(120);
  });

  it('01-11: draws tu-laptop, laptop-lucia and laptop-marta with its firewall, and no router, no printer and no globe of the internet, which no ping uses', () => {
    expect(drawnLabels(start)).toEqual(['device:laptop-lucia', 'device:laptop-marta', 'device:tu-laptop', `firewall:firewall ${DEVICE.marta.name}`].sort());
    expect(guidedOf(THE_GUARD).shown).toEqual(GUARD_PIECES);
    expect(pieceViews(start).filter((piece) => piece.kind === 'edge')).toEqual([]);
  });

  it('01-11: both pings must be sent to close the incident', () => {
    expect(openTasks(start)).toEqual([TASK.guard, TASK.lucia]);
    expect(openTasks(pingTo(start, ADDRESS.printer.id))).toEqual([TASK.guard, TASK.lucia]);
    expectClosed(both);
  });

  it('01-11: the inspection box of the dropped ping tells the firewall dropped it, and the device box of laptop-marta lists its firewall', () => {
    const [run] = dropped.sent;
    expect(fieldLines(dropped, run.pieceId, 'Resultado')?.[0]).toMatch(/^timeout/);
    expect(boxLines(start, DEVICE.marta.id)).toContain(`firewall ${DEVICE.marta.name}`);
    expect(boxLines(start, DEVICE.lucia.id).filter((text) => /firewall/i.test(text))).toEqual([]);
  });

  it('01-11: no text says what a firewall does with rules, in what direction, or why it drops or why a reply passes', () => {
    const guarded = incidentTexts(guidedOf(THE_GUARD)).map((text) => toPlainText(text));
    expect(guarded.filter((text) => ABOUT_RULES.test(text) || NO_REASON_GIVEN.test(text))).toEqual([]);
    expect(everythingShown(both).filter((text) => ABOUT_RULES.test(text) || NO_REASON_GIVEN.test(text))).toEqual([]);
    expect(everythingShown(start).filter((text) => ABOUT_RULES.test(text) || NO_REASON_GIVEN.test(text))).toEqual([]);
  });

  it('01-11: nothing says the silence is a switched-off device except the wrong option that the feedback refutes', () => {
    const { explanation } = guidedOf(THE_GUARD);
    const [offered] = explanation.filter((option) => SWITCHED_OFF.test(toPlainText(option.text)));
    expect(offered).toBeDefined();
    expect(offered.correct).toBe(false);
    const rest = incidentTexts(guidedOf(THE_GUARD)).filter((text) => text !== offered.text && text !== offered.feedback);
    expect(rest.filter((text) => SWITCHED_OFF.test(toPlainText(text)))).toEqual([]);
    expect(everythingShown(both).filter((text) => SWITCHED_OFF.test(text))).toEqual([]);
  });

  it('01-11: the question has three options, the right one says the firewall dropped the packet and did not warn, and each wrong one is a mistake the map refutes', () => {
    const { explanation } = guidedOf(THE_GUARD);
    expect(explanation).toHaveLength(3);
    expect(explanation.findIndex((option) => option.correct)).toBe(GUARD_PLACE);
    const [right] = explanation.filter((option) => option.correct);
    expect(termsIn(right.text)).toEqual(expect.arrayContaining(['firewall', 'drop']));
    expect(toPlainText(right.text)).toMatch(/sin avisar|no avisó/);
    for (const wrong of explanation.filter((option) => !option.correct)) expect(toPlainText(wrong.feedback)).toMatch(/^No\./);
  });

  it('01-11: the first task does not give the answer away, and the second hint names the field of the box that holds it', () => {
    const incident = guidedOf(THE_GUARD);
    expect(toPlainText(incident.tasks[0].text)).not.toMatch(/firewall|descart/i);
    expect(toPlainText(incident.hints[1])).toContain(`«${STOPPED_LABEL}»`);
    expect(fieldLines(dropped, dropped.sent[0].pieceId, STOPPED_LABEL)).toBeDefined();
    expect(firewallBox()?.fields.map((field) => toPlainText(field.label))).not.toContain(STOPPED_LABEL);
  });

  it('01-11: starts from the world of 01-10 solved with the broken stretch repaired, so the provider router is the one of 01-08 again', () => {
    const before = solvedWorld(INCIDENTS, SEEING_THE_PATH);
    const providerOf = (world: typeof before) => world.routers?.find((router) => router.id === ROUTER.provider.id);
    expect(providerOf(before)?.sendsUnreachable).toBe(false);
    expect(providerOf(start.world)).toEqual(providerOf(startWorld(INCIDENTS, THE_NETWORK_OF_NETWORKS)));
    expect({ ...start.world, routers: undefined }).toEqual({ ...before, routers: undefined });
    expect(networkSchema.safeParse(start.world).success).toBe(true);
  });
});

describe('the same ping of 01-05 and 01-11', () => {
  const hidden = pingTo(startSession(INCIDENTS, WHEN_IT_DOES_NOT_COME_BACK), ADDRESS.marta.id).sent[0];
  const shown = pingTo(startSession(INCIDENTS, THE_GUARD), ADDRESS.marta.id).sent[0];
  const stoppedLabel = (session: Session) => fieldLines(session, session.sent[0].pieceId, STOPPED_LABEL);

  it('the same ping of 01-05 and 01-11 has the same trace and only the words change', () => {
    expect(shown.packet).toEqual(hidden.packet);
    expect(shown.trace).toEqual(hidden.trace);
    expect([shown.by, shown.reached, shown.replied, shown.warning]).toEqual([hidden.by, hidden.reached, hidden.replied, hidden.warning]);
    expect(hidden).toMatchObject({ hiddenStop: true, blocked: false });
    expect(shown).toMatchObject({ hiddenStop: false, blocked: true });
    expect(stoppedLabel(pingTo(startSession(INCIDENTS, WHEN_IT_DOES_NOT_COME_BACK), ADDRESS.marta.id))).toEqual([NOTHING_CAME_BACK]);
    expect(stoppedLabel(pingTo(startSession(INCIDENTS, THE_GUARD), ADDRESS.marta.id))).toEqual([DROPPED_TEXT]);
  });
});

describe('the eleven incidents of blocks 1 to 4', () => {
  const places = [THE_OFFICE, THE_ENVELOPE, ARE_YOU_THERE, PING_YOURSELF, WHEN_IT_DOES_NOT_COME_BACK, YOUR_NETWORK, WHO_GETS_WHAT_IS_OUTSIDE, THE_NETWORK_OF_NETWORKS, COUNTING_HOPS, SEEING_THE_PATH, THE_GUARD].map((id) =>
    guidedOf(id).explanation.findIndex((option) => option.correct),
  );

  it('01-11: puts the right explanation in a place of its own, not the one of 01-10 and not the third', () => {
    expect(places.at(-1)).toBe(GUARD_PLACE);
    expect(places.at(-1)).not.toBe(places.at(-2));
    expect(places.at(-1)).not.toBe(2);
  });

  it('01-11: starts and ends in a world the network schema accepts', () => {
    expect([startWorld(INCIDENTS, THE_GUARD), solvedWorld(INCIDENTS, THE_GUARD)].flatMap((world) => networkSchema.safeParse(world).error?.issues.map((issue) => issue.message) ?? [])).toEqual([]);
  });
});

describe('the globe of the internet in blocks 3 and 4', () => {
  const globeIn = (session: Session) => pieceViews(session).some((piece) => piece.kind === 'internet');
  const knowingTheInternet = (id: string): Session => {
    const session = startSession(INCIDENTS, id);
    return { ...session, known: new Set([...session.known, 'internet']) };
  };

  it('is drawn in 01-08, 01-09 and 01-10, which list the server or a router of the provider, and in none of 01-06, 01-07 and 01-11', () => {
    expect([COUNTING_HOPS, SEEING_THE_PATH, THE_NETWORK_OF_NETWORKS].map((id) => globeIn(startSession(INCIDENTS, id)))).toEqual([true, true, true]);
    expect([YOUR_NETWORK, WHO_GETS_WHAT_IS_OUTSIDE, THE_GUARD].map((id) => globeIn(startSession(INCIDENTS, id)))).toEqual([false, false, false]);
  });

  it('is not drawn in 01-06, 01-07 or 01-11 even when the term internet is known, because no piece they list is outside the office', () => {
    expect([YOUR_NETWORK, WHO_GETS_WHAT_IS_OUTSIDE, THE_GUARD].map((id) => globeIn(knowingTheInternet(id)))).toEqual([false, false, false]);
  });
});
