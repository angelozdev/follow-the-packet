import { describe, expect, it } from 'vitest';
import { roundTripText, stampLabel, toPlainText, type TermText } from '@/copy';
import { networkSchema } from '@/engine';
import { INCIDENTS, isGuided, solvedWorld, startWorld, type Incident } from '@/levels';
import { incidentTexts } from '@/levels/ladder';
import { ADDRESS, CARD, DEVICE, GATEWAY, HIDDEN_FIREWALL, IP, MESSAGE, ORIGIN, ROUTER, TASK } from '@/levels/01-first-day/shared';
import type { SentPacket } from './flow-runs';
import { identifyCard } from './view/cards/identify-card';
import { settingsCard } from './view/cards/settings-card';
import { terminalCard, terminalLine } from './view/cards/terminal-card';
import { inspect } from './view/inspection';
import { PIECE_ID } from './view/piece-id';
import { pieceViews } from './view/pieces';
import { sessionReducer, startSession, starsOf, type Session } from './session';
import { taskHolds } from './tasks';

const THE_OFFICE = '01-01';
const THE_ENVELOPE = '01-02';
const ARE_YOU_THERE = '01-03';
const PING_YOURSELF = '01-04';
const WHEN_IT_DOES_NOT_COME_BACK = '01-05';
const YOUR_NETWORK = '01-06';
const WHO_GETS_WHAT_IS_OUTSIDE = '01-07';
const NOTE_FEEDBACK = 'No es IPv4: cada uno de los cuatro números va de 0 a 255.';
const NOTE_RULE = 'La nota de Lucía estaba mal: 192.168.1.300 no es IPv4, porque cada uno de los cuatro números va de 0 a 255.';
const RIGHT_FEEDBACK = 'Correcto.';
const CONNECTED_FEEDBACK = 'Sí está en la red: laptop-lucia está conectada. Su caja de inspección lo dice.';
const NOT_CONNECTED_FEEDBACK = 'No. laptop-visita no está conectada, así que no forma parte de la red. Su caja de inspección lo dice.';
const MARTA_FEEDBACK = 'Esa IP es de laptop-marta: se ve en su caja. La impresora tiene otra.';
const HEADER_LABEL = 'Encabezado';
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
const HOP_OR_TTL = /salto|TTL/i;
const NO_GATEWAY_TEXT = '192.168.2.15 no está en la red local de tu-laptop, y tu-laptop no tiene puerta de enlace predeterminada: no sabe por dónde sacar el paquete.';
const PRINTER_GATEWAY_TEXT = 'La IP 192.168.1.21, la puerta de enlace predeterminada guardada, es de impresora, que no es un router: recibe el paquete, no lo pasa a otra red y no vuelve nada.';
const NOBODY_GATEWAY_TEXT = 'tu-laptop buscó en su red quién tenía la IP 192.168.1.50, su puerta de enlace predeterminada, y nadie contestó. El propio dispositivo avisa que no pudo entregar el paquete.';
const SETTINGS_ENTRY = 'Ajustes de red de tu-laptop';
const GATEWAY_TRAY = 'puerta de enlace predeterminada';
const NO_GATEWAY_CHIP = 'Ninguna';
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

function sentTo(session: Session, toId: string): SentPacket {
  const found = session.sent.find((packet) => packet.toId === toId);
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

describe('the seven incidents of blocks 1 to 3', () => {
  const SEVEN = [THE_OFFICE, THE_ENVELOPE, ARE_YOU_THERE, PING_YOURSELF, WHEN_IT_DOES_NOT_COME_BACK, YOUR_NETWORK, WHO_GETS_WHAT_IS_OUTSIDE];
  const places = SEVEN.map((id) => guidedOf(id).explanation.findIndex((option) => option.correct));

  it('never put the right explanation in the same place as the incident before', () => {
    expect(places.filter((place, index) => index > 0 && place === places[index - 1])).toEqual([]);
  });

  it('start and end in a world the network schema accepts, so the floors the base world declares break nothing in 01-01 to 01-05', () => {
    const problems = SEVEN.flatMap((id) => [startWorld(INCIDENTS, id), solvedWorld(INCIDENTS, id)].flatMap((world) => networkSchema.safeParse(world).error?.issues.map((issue) => `${id}: ${issue.message}`) ?? []));
    expect(problems).toEqual([]);
  });

  it('put the right explanation of 06 and 07 in places of their own', () => {
    expect(places.slice(-2)).toEqual([2, 0]);
  });

  it('start 07 from the world of 06 solved, with the laptop of the player reinstalled and so with no gateway', () => {
    const { world } = startSession(INCIDENTS, WHO_GETS_WHAT_IS_OUTSIDE);
    const solved = solvedWorld(INCIDENTS, YOUR_NETWORK);
    expect(solved.devices.find((device) => device.id === DEVICE.you.id)?.gateway).toBe(IP.router);
    expect({ ...world, devices: world.devices.map((device) => ({ ...device, gateway: undefined })) }).toEqual({ ...solved, devices: solved.devices.map((device) => ({ ...device, gateway: undefined })) });
    expect(world.devices.filter((device) => device.gateway === undefined).map((device) => device.id)).toEqual([DEVICE.you.id]);
  });
});
