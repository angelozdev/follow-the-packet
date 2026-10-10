import { describe, expect, it } from 'vitest';
import { toPlainText, type TermText } from '@/copy';
import { INCIDENTS, isGuided } from '@/levels';
import { ADDRESS, CARD, DEVICE, IP, MESSAGE, ORIGIN, TASK } from '@/levels/01-first-day/shared';
import { identifyCard } from './view/cards/identify-card';
import { inspect } from './view/inspection';
import { PIECE_ID } from './view/piece-id';
import { sessionReducer, startSession, starsOf, type Session } from './session';
import { taskHolds } from './tasks';

const THE_OFFICE = '01-01';
const THE_ENVELOPE = '01-02';
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
