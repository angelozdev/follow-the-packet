import { describe, expect, it } from 'vitest';
import { TERMINAL_TEXT, TERMS, roundTripText, stampLabel, termsIn, toPlainText, type TermText } from '@/copy';
import { applyAction, extraOpenings, networkSchema, simulate, simulateSequence, stopStep } from '@/engine';
import { INCIDENTS, caseWorld, isGuided, revealsRoutersByTraceroute, sendCombinations, solvedWorld, startWorld, type DiagnoseIncident, type Flow, type Incident } from '@/levels';
import { routersCrossedByTraceroutes } from '@/levels/contract/chips';
import { incidentTexts } from '@/levels/ladder';
import { chapter1Worlds } from '@/testing';
import { ADDRESS, CARD, DEVICE, FIREWALL, FLOOR, FLOW, FROM, GATEWAY, GUARD_PIECES, HIDDEN_FIREWALL, IP, MESSAGE, ORIGIN, PING_WITH_TTL, ROUTER, REPAIRED_STRETCH, RULE_PIECES, SERVER, TASK, TO, WHAT } from '@/levels/01-first-day/shared';
import type { FlowRun, SentPacket } from '@/game/flow-runs';
import { firewallCard } from '@/game/view/cards/firewall-card';
import { identifyCard } from '@/game/view/cards/identify-card';
import { pieceCard } from '@/game/view/cards/piece-card';
import { settingsCard } from '@/game/view/cards/settings-card';
import { terminalCard, terminalLine } from '@/game/view/cards/terminal/terminal-card';
import { inspect } from '@/game/view/inspection';
import { PIECE_ID } from '@/game/view/piece-id';
import { drawsRouter } from '@/game/view/drawn';
import { pieceViews } from '@/game/view/pieces';
import { routerPlace } from '@/game/view/router-place';
import { caseCard, caseSummary } from '@/game/view/cards/case-card';
import { tracerouteLines } from '@/game/view/cards/terminal/traceroute-lines';
import { canConfigure, currentCase, isIntruding, sessionReducer, startSession, starsOf, type Session } from '@/game/session';
import { isTight } from '@/game/stars';
import { taskHolds } from '@/game/tasks';

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
const YOUR_FIRST_RULE = '01-12';
const IN_AND_OUT = '01-13';
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
const SETTINGS_TAB = 'Ajustes de red';
const GATEWAY_TRAY = 'puerta de enlace predeterminada';
const NO_GATEWAY_CHIP = 'Ninguna';
const OUTSIDE_THE_OFFICE = 'fuera de la oficina';
const HOPS_LABEL = 'Saltos';
const NAT_WORDS = /\bNAT\b|traduc/i;
const ROUTER_OUTSIDE = new RegExp(`${ROUTER.provider.name}|${ROUTER.destination.name}|203\\.0\\.113\\.`);
const TTL_VALUES = [1, 2, 3, 5, 64] as const;
const STAR = '*';
const TRACEROUTE_LINES = 8;
const A_SILENT_HOP = /\*|callaba|nadie contesta|no contestó a tiempo|sin respuesta|no avisa/i;
const WHERE_THE_PACKET_DIED = /murió|se cortó|se perdió|se detuvo|se frenó|el corte|tramo roto|se rompe|se rompió/i;
const A_HEDGE = /lo más probable|no siempre|no lo prueba/i;
const SENTENCE_BREAK = /(?<=[.!?:])\s+/;
const LOOP_CASE = 5;
const LOOP_CAUSE_TEXT = `Alguien cambió la configuración de ${ROUTER.provider.name}: ahora todo lo que recibe se lo devuelve a ${ROUTER.office.name}.`;
const THE_PINGS_DO_NOT_ARRIVE = 'Los pings al servidor ya no llegan.';
const THE_CHAIN_OF_THE_LOOP = [
  `${ROUTER.office.name} le pasa el paquete a ${ROUTER.provider.name}`,
  `${ROUTER.provider.name} sigue su configuración nueva y se lo devuelve`,
  'lo que está mal es esa configuración',
  'decide solo mirando la IP de destino',
  'Ninguno recuerda si el paquete ya pasó por él',
  'el paquete va y viene hasta que el TTL llega a 0',
];
const EACH_ONE_SENDS_IT_TO_THE_OTHER = 'quedan configurados de modo que cada uno se lo manda al otro';
const A_ROUTER_THAT_IS_CONFUSED_OR_A_ROUTE = /confund|equivoc|\bpiensa|\bcree\b|\brutas?\b|tabla/i;
const EVERY_DEVICE_SENDS_TO_THE_ROUTER = `Cada dispositivo del ${FLOOR.first.name} y del ${FLOOR.second.name} le manda a ${ROUTER.office.name} lo que va a otra red local.`;
const THE_OFFICE_ROUTER_SENDS_OUT = `alguien cambió la configuración de ${ROUTER.office.name}: ahora manda hacia internet todo lo que no es de la oficina.`;
const THE_PROVIDER_ROUTER_DOES_NOT_KNOW_THE_WAY = `alguien cambió la configuración de ${ROUTER.provider.name}, que ya no sabe a dónde mandar lo que va al servidor y tampoco avisa.`;
const THE_PROVIDER_FIXED_THE_STRETCH = `el proveedor arregló el tramo roto de «Ver el camino»: ${ROUTER.provider.name} volvió a su configuración de antes.`;
const YOUR_FIREWALL_LETS_EVERYTHING_OUT = `alguien cambió la configuración del firewall de ${DEVICE.you.name}: ahora deja salir todo.`;
const SOMEONE_TOOK_THE_OPEN_RULE_AWAY = 'Alguien quitó la regla que dejaba salir todo, y su salida quedó sin ninguna regla que lo permita.';
const CLOSED_CASE = 7;
const READINGS_OF_A_SILENT_HOP_THE_GAME_ONCE_MADE = [
  'No. El salto 3 ya callaba y el servidor está más allá: el corte empieza antes de llegar a él.',
  'Eso es. El traceroute listó router-oficina y router-proveedor, y desde el salto 3 solo hay *. El corte está en el último router que contestó o justo después.',
  'traceroute lista los routers del camino: cada línea es la IP de uno que avisó con Time Exceeded. Si de pronto salen *, el corte está en el último router que contestó o justo después.',
];
const TEXTS_THAT_READ_A_TRACEROUTE = [TERMS.traceroute.definition, TERMS['time-exceeded'].definition, TERMS.hop.definition, ...Object.values(TERMINAL_TEXT.route.notes)];
const AFTER_THE_LAST_ROUTER_THAT_ANSWERED = /sigue a router-proveedor, el último router que contestó/;
const NO_ROUTER_AFTER_THE_PROVIDER_IS_LISTED = /El traceroute no listó ningún router después de router-proveedor: desde el salto 3 nadie contesta hasta el máximo de saltos\. Lo más probable es que el paquete ni llegue al servidor/;
const THE_LAST_ROUTER_THAT_ANSWERED_HINT = /último router que sí contestó/;
const NOTHING_ANSWERS_UP_TO_THE_MAXIMUM = /(nadie contesta|no contesta nadie) hasta el máximo de saltos/;
const THE_PING_DOES_NOT_COME_BACK = /ping tampoco vuelve/;
const VERY_PROBABLY_AFTER = /lo más probable es que el tramo roto esté después de/;
const A_ROUTER_THAT_DOES_NOT_WARN = /no siempre es el corte: algunos reenvían el paquete sin avisar/;
const A_SINGLE_STAR_PROVES_NOTHING = /Un solo \* no lo prueba: algunos routers reenvían el paquete sin avisar/;
const ROUTER_OUTSIDE_THE_LOOP = new RegExp(`${ROUTER.destination.name}|${IP.destination.replaceAll('.', '\\.')}`);
const TIMED_OUT = 'timeout: pasó el tiempo de espera y no volvió nada.';
const ROUTER_IPS = [IP.router, IP.provider, IP.destination];
const A_ROUTER_THAT_ALWAYS_DROPS = /\bde afuera\b[^.]*\bdescarta\b|\bfuera de la oficina,? descarta\b|\brouters? (de afuera )?descartan\b/i;
const THE_FIRST_ROUTER_OUTSIDE_DROPPED_IT = 'el primer router fuera de la oficina lo descartó y no avisó';
const YOUR_LAPTOP_IN_WORDS = /\btu laptop\b/i;
const A_ROUTER_OR_ITS_IP = new RegExp([...Object.values(ROUTER).map((router) => router.name), ...ROUTER_IPS.map((ip) => `(?<!\\d)${ip.replaceAll('.', '\\.')}(?!\\d)`)].join('|'));
const A_HOP = /salto|pasó por/i;
const A_ROUTER_THAT_DISCARDS = /descarta|no sabe a qué/;
const ROUTERS_NOT_DRAWN_YET = ['device:servidor-internet', 'device:tu-laptop', 'internet:internet'];
const ROUTERS_THAT_ANSWERED = [...ROUTERS_NOT_DRAWN_YET, `edge:${ROUTER.office.name}`, `edge:${ROUTER.provider.name}`].sort();
const DROPPED_TEXT = 'El firewall de laptop-marta descartó el paquete sin avisar.';
const GUARD_PLACE = 1;
const NO_REASON_GIVEN = /revel|stateful|stateless|recuerda|mismo camino|esconde|oculta/i;
const ABOUT_RULES = /regla|entrada|salida|permit|deneg|privilegio/i;
const FIRST_RULE_PLACE = 0;
const IN_AND_OUT_PLACE = 2;
const BY_DEFAULT = /por defecto|de fábrica|normalmente/i;
const CLOSED_BY_SOMEONE = 'Se queda en el firewall de tu-laptop: su salida está cerrada, alguien la configuró así.';
const NO_RULE_LETS_IT_OUT = 'Se queda en el firewall de tu-laptop: ninguna regla lo deja salir.';
const ANY_SOURCE_LABEL = 'Cualquier IP de origen';
const LUCIA_CHIP_LABEL = 'laptop-lucia (IP 192.168.1.11)';
const PRINTER_CHIP_LABEL = 'impresora (IP 192.168.1.21)';
const ECHO_REQUEST_LABEL = 'ICMP · Echo Request';
const GENERAL_RULE_OF_FIREWALLS = /\b(un|el|todo) firewall (cierra|bloquea|descarta|deniega)|los firewalls|todos los firewalls|siempre/i;
const A_RULE_THAT_DENIES = /regla[^.]*(?<!no )(prohíbe|prohíben|deniega|deniegan|niega|bloquea)/i;
const NO_INBOUND_RULES = 'Este firewall no tiene reglas.';
const SENDER_LOOKED = 'tu-laptop buscó en su red quién tenía la IP 192.168.1.50 y nadie contestó. El propio dispositivo avisa que no pudo entregar el paquete.';

const FINAL_WATCH = '01-14';
const WATCH_CASES = 7;
const OUTBOUND_LABEL = 'Salida';
const CHAPTER_1_INCIDENTS = 14;
const TESTS_OF_THE_SEQUENCE = [IP.loopback, IP.you, IP.router, IP.server].map((address) => `ping ${address}`);
const NO_GATEWAY_TO_SERVER = NO_GATEWAY_TEXT.replace(IP.andres, IP.server);
const NO_GATEWAY_TO_PRINTER = NO_GATEWAY_TEXT.replace(IP.andres, IP.printer).replaceAll(DEVICE.you.name, DEVICE.andres.name);
const WATCH_ROUTES_BY_CASE = [2, 2, 2, 2, 1, 2, 2];
const LETS_EVERYTHING_OUT = 'deja salir todo el tráfico';
const ANY_IPV4 = '0.0.0.0/0';
const NO_RULE_AT_ALL = 'Ninguna.';
const YOUR_OUTBOUND_RULES_BY_CASE = [1, 1, 1, 1, 1, 1, 0];
const YOUR_OUTBOUND_BY_CASE = [LETS_EVERYTHING_OUT, LETS_EVERYTHING_OUT, LETS_EVERYTHING_OUT, LETS_EVERYTHING_OUT, LETS_EVERYTHING_OUT, LETS_EVERYTHING_OUT, NO_RULE_AT_ALL];
const CASE_WITHOUT_YOUR_LAPTOP = 3;
const YOUR_LAPTOP_DRAWN = [`device:${DEVICE.you.name}`, `firewall:firewall ${DEVICE.you.name}`];
const THE_ROAD_TO_THE_SERVER = [`device:${SERVER.name}`, `edge:${ROUTER.office.name}`, 'internet:internet'];
const WATCH_DRAWN_BY_CASE = [
  [...YOUR_LAPTOP_DRAWN, ...THE_ROAD_TO_THE_SERVER],
  [...YOUR_LAPTOP_DRAWN, `device:${DEVICE.printer.name}`],
  [`device:${DEVICE.andres.name}`, `device:${DEVICE.printer.name}`, `edge:${ROUTER.office.name}`],
  [...YOUR_LAPTOP_DRAWN, ...THE_ROAD_TO_THE_SERVER, `edge:${ROUTER.provider.name}`],
  [...YOUR_LAPTOP_DRAWN, ...THE_ROAD_TO_THE_SERVER, `edge:${ROUTER.provider.name}`],
  [...YOUR_LAPTOP_DRAWN, ...THE_ROAD_TO_THE_SERVER, `device:${DEVICE.lucia.name}`, `device:${DEVICE.printer.name}`, `firewall:firewall ${DEVICE.lucia.name}`],
  [...YOUR_LAPTOP_DRAWN, ...THE_ROAD_TO_THE_SERVER],
];
const RIGHT_PLACES_OF_THE_WATCH = [1, 2, 0, 2, 0, 1, 2];
const WEB_VERBS = /\b(abr\w+|entr\w+|carg\w+|naveg\w+|visit\w+|ingres\w+|acced\w+)\b/i;
const A_PING_THAT_DOES_NOT_COME_BACK = [/\bpings?\b.*\bno vuelv/i, /\bning[uú]n ping\b.*\bvuelv/i];
const SWITCHED_OFF_OR_DOWN = /apagad|ca[ií]d[oa]|encendid|prendid/i;
const FEEDBACK_ECHO = /^(No\.|No es eso\.|Eso es\.|Correcto\.)/;
const LONGEST_OVER_SHORTEST = 1.4;
const QUESTIONS_BEFORE_THE_WATCH = 13;
const A_THIRD = 3;
const END_OF_SENTENCE = /(?<=[.!?])\s+/;
const MOST_SENTENCES_OF_A_CHAIN = 6;
const LONGEST_SENTENCE_OF_A_CHAIN = 150;

function incidentOf(id: string): Incident {
  const found = INCIDENTS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`missing incident ${id}`);
  return found;
}

function guidedOf(id: string) {
  const incident = incidentOf(id);
  if (!isGuided(incident)) throw new Error(`${id} is not a guided incident`);
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

/** Returns true when a text that shows a hop nobody answered says, in a sentence with no hedge, where the packet died or the path broke: a router that does not warn may still forward the packet. */
function readsSilenceAsTheBreak(text: string): boolean {
  return A_SILENT_HOP.test(text) && text.split(SENTENCE_BREAK).some((sentence) => WHERE_THE_PACKET_DIED.test(sentence) && !A_HEDGE.test(sentence));
}

function providerOf(world: Session['world']) {
  return world.routers?.find((router) => router.id === ROUTER.provider.id);
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

  it('01-01: the report says that the tab Estado shows if a device is connected and its IP', () => {
    expect(toPlainText(guidedOf(THE_OFFICE).report)).toContain('En su pestaña «Estado» ves si está conectada y cuál es su IP.');
  });

  it('01-01: the report says that the answers are chosen in the tab Preguntas', () => {
    expect(toPlainText(guidedOf(THE_OFFICE).report)).toContain('En su pestaña «Preguntas» eliges la respuesta.');
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
    const laptop = PIECE_ID.device(DEVICE.you.id);
    const tabs = pieceCard(start, laptop)?.tabs.map((tab) => ({ id: tab.id, label: toPlainText(tab.label) }));
    expect(tabs).toEqual([{ id: 'terminal', label: 'Terminal' }, { id: 'settings', label: SETTINGS_TAB }]);
    expect(pieceViews(start).filter((piece) => piece.id === laptop)).toHaveLength(1);
    expect(pieceViews(start).find((piece) => piece.id === laptop)).not.toHaveProperty('settings');
    const card = settingsCard(start, laptop);
    expect(card?.settings.map((setting) => ({ id: setting.id, name: toPlainText(setting.name), picked: setting.picked, chips: setting.chips.map((chip) => toPlainText(chip.label)) }))).toEqual([
      { id: GATEWAY.setting, name: GATEWAY_TRAY, picked: GATEWAY.none, chips: [NO_GATEWAY_CHIP, IP.router, IP.printer, IP.nobody] },
    ]);
    const terminal = terminalCard(start, laptop);
    expect(terminal?.trays.map((tray) => tray.name)).toEqual(['to']);
    expect(terminal?.trays.flatMap((tray) => tray.chips.map((chip) => toPlainText(chip.label)))).toEqual([IP.andres, IP.printer]);
    expect(settingsCard(pickGateway(start, GATEWAY.router), laptop)?.settings[0].picked).toBe(GATEWAY.router);
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
  const STOPPED_TEXT = `${IP.otherOfficePrinter} es una IP privada: se repite en muchas redes y internet no la entrega. Un router, ya fuera de la oficina, descartó el paquete y no avisó.`;

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

  it('01-08: the right explanation says what happened to this ping, that the first router outside the office dropped it and did not warn, and no text states it as a rule of routers', () => {
    const right = guidedOf(THE_NETWORK_OF_NETWORKS).explanation.find((option) => option.correct);
    expect(toPlainText(right?.feedback ?? '')).toContain(THE_FIRST_ROUTER_OUTSIDE_DROPPED_IT);
    expect(incidentTexts(guidedOf(THE_NETWORK_OF_NETWORKS)).map((text) => toPlainText(text)).filter((text) => A_ROUTER_THAT_ALWAYS_DROPS.test(text))).toEqual([]);
    expect(everythingShown(both).filter((text) => A_ROUTER_THAT_ALWAYS_DROPS.test(text))).toEqual([]);
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

  it('01-09: the report names router-proveedor and router-oficina and says its configuration changed, before saying the pings do not arrive', () => {
    const report = toPlainText(guidedOf(COUNTING_HOPS).report);
    expect(report).toContain(`${LOOP_CAUSE_TEXT} ${THE_PINGS_DO_NOT_ARRIVE}`);
    expect(report.startsWith(LOOP_CAUSE_TEXT)).toBe(true);
  });

  it('01-09: the right explanation gives the whole chain, in order: the office router passes it on, the router of the provider hands it back, each router looks only at the destination IP, and the fault is the configuration', () => {
    const right = guidedOf(COUNTING_HOPS).explanation.find((option) => option.correct);
    const feedback = toPlainText(right?.feedback ?? '');
    const positions = THE_CHAIN_OF_THE_LOOP.map((part) => feedback.indexOf(part));
    expect(positions.filter((position) => position < 0)).toEqual([]);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(toPlainText(guidedOf(COUNTING_HOPS).takeaway)).toContain(EACH_ONE_SENDS_IT_TO_THE_OTHER);
  });

  it('01-09: no text of the incident says that a router got confused, and none says ruta or tabla, which chapter 2 teaches', () => {
    expect(incidentTexts(guidedOf(COUNTING_HOPS)).map((text) => toPlainText(text)).filter((text) => A_ROUTER_THAT_IS_CONFUSED_OR_A_ROUTE.test(text))).toEqual([]);
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

  it('01-10: concludes that the break is very probably after the last router that answered, and that a router that does not warn is not always the break', () => {
    const incident = guidedOf(SEEING_THE_PATH);
    const right = incident.explanation.filter((option) => option.correct);
    expect(right).toHaveLength(1);
    const [{ text, feedback }] = right.map((option) => ({ text: toPlainText(option.text), feedback: toPlainText(option.feedback) }));
    expect(text).toMatch(AFTER_THE_LAST_ROUTER_THAT_ANSWERED);
    expect([NOTHING_ANSWERS_UP_TO_THE_MAXIMUM, THE_PING_DOES_NOT_COME_BACK, VERY_PROBABLY_AFTER, A_ROUTER_THAT_DOES_NOT_WARN].filter((pattern) => !pattern.test(feedback))).toEqual([]);
    expect([NOTHING_ANSWERS_UP_TO_THE_MAXIMUM, THE_PING_DOES_NOT_COME_BACK, VERY_PROBABLY_AFTER, A_SINGLE_STAR_PROVES_NOTHING].filter((pattern) => !pattern.test(toPlainText(incident.takeaway)))).toEqual([]);
    expect(toPlainText(incident.hints.at(-1) ?? '')).toMatch(THE_LAST_ROUTER_THAT_ANSWERED_HINT);
    expect(toPlainText(incident.explanation[1].feedback)).toMatch(NO_ROUTER_AFTER_THE_PROVIDER_IS_LISTED);
  });

  it('01-10: no text of the incident names router-destino or its IP, which the map never draws', () => {
    expect(incidentTexts(guidedOf(SEEING_THE_PATH)).map((text) => toPlainText(text)).filter((text) => ROUTER_OUTSIDE_THE_LOOP.test(text))).toEqual([]);
  });

  it('01-10: tu-laptop is the only device of the office drawn; before a traceroute no router is drawn, and after it the office router and router-proveedor are', () => {
    for (const session of [start, pinged]) expect(drawnLabels(session)).toEqual(ROUTERS_NOT_DRAWN_YET);
    for (const session of [traced, both]) expect(drawnLabels(session)).toEqual(ROUTERS_THAT_ANSWERED);
    for (const session of [start, pinged, traced, both]) expect(pieceViews(session).filter((piece) => piece.kind === 'device').map((piece) => piece.anchorId)).toEqual([DEVICE.you.id, SERVER.id]);
  });

  it('01-10: before a traceroute, the map draws no router and the lost ping stops just outside tu-laptop', () => {
    for (const session of [start, pinged]) {
      expect(pieceViews(session).filter((piece) => piece.kind === 'edge')).toEqual([]);
      expect(Object.values(ROUTER).filter((router) => drawsRouter(session, router.id))).toEqual([]);
    }
    const [run] = pinged.sent;
    expect(run).toMatchObject({ hiddenStop: true, blocked: false, replied: false, reached: false, warning: null, trace: { outcome: 'timeout' } });
    expect(run.trace.steps.at(-1)).toMatchObject({ stage: 'forward', at: ROUTER.provider.id, verdict: 'drop' });
  });

  it("01-10: before a traceroute, no text of the ping's box names a router or a hop", () => {
    const [run] = pinged.sent;
    expect(plainBox(pinged, run.pieceId).filter((text) => A_ROUTER_OR_ITS_IP.test(text) || A_HOP.test(text))).toEqual([]);
    expect(fieldLines(pinged, run.pieceId, RESULT_LABEL)).toEqual([TIMED_OUT]);
    expect([HOPS_LABEL, PASSED_THROUGH_LABEL, STOPPED_LABEL].map((label) => fieldLines(pinged, run.pieceId, label))).toEqual([undefined, undefined, undefined]);
  });

  it('01-10: the question about the broken stretch cannot be answered from the map before a traceroute', () => {
    const incident = guidedOf(SEEING_THE_PATH);
    const whileTheTasksAreOpen = [incident.report, ...incident.tasks.map((task) => task.text), ...incident.hints].map((text) => toPlainText(text));
    for (const session of [start, pinged]) {
      for (const router of Object.values(ROUTER)) expect(inspect(session, PIECE_ID.router(router.id)), router.id).toBeNull();
      expect(sessionReducer(session, { type: 'submit' }).phase).toBe('playing');
      expect(everythingShown(session).filter((text) => A_ROUTER_OR_ITS_IP.test(text) || A_HOP.test(text))).toEqual([]);
      expect(whileTheTasksAreOpen.filter((text) => A_ROUTER_OR_ITS_IP.test(text))).toEqual([]);
    }
  });

  it('01-10: after a traceroute, the routers that answered appear and router-destino does not', () => {
    for (const session of [traced, both]) {
      expect(Object.values(ROUTER).filter((router) => drawsRouter(session, router.id)).map((router) => router.id)).toEqual([ROUTER.office.id, ROUTER.provider.id]);
      for (const router of [ROUTER.office, ROUTER.provider]) expect(toPlainText(inspect(session, PIECE_ID.router(router.id))?.title ?? ''), router.id).toBe(router.name);
      expect(inspect(session, PIECE_ID.router(ROUTER.destination.id))).toBeNull();
      expect(everythingShown(session).filter((text) => ROUTER_OUTSIDE_THE_LOOP.test(text))).toEqual([]);
    }
  });

  it('01-10: the routers appear whichever of the two messages is sent first, and sending the ping again hides nothing', () => {
    expect(drawnLabels(sendWith(traced, MESSAGE.ping.id, ADDRESS.server.id))).toEqual(ROUTERS_THAT_ANSWERED);
    expect(drawnLabels(sendWith(both, MESSAGE.ping.id, ADDRESS.server.id))).toEqual(ROUTERS_THAT_ANSWERED);
  });

  it("01-10: after a traceroute, the lost ping's stamp stays just outside tu-laptop and its box still says only the timeout", () => {
    for (const session of [both, sendWith(traced, MESSAGE.ping.id, ADDRESS.server.id)]) {
      const ping = sentTo(session, ADDRESS.server.id, MESSAGE.ping.id);
      expect(ping).toMatchObject({ hiddenStop: true, blocked: false, replied: false, reached: false });
      expect(plainBox(session, ping.pieceId).filter((text) => A_ROUTER_OR_ITS_IP.test(text) || A_HOP.test(text))).toEqual([]);
      expect(fieldLines(session, ping.pieceId, RESULT_LABEL)).toEqual([TIMED_OUT]);
      expect([HOPS_LABEL, PASSED_THROUGH_LABEL, STOPPED_LABEL].map((label) => fieldLines(session, ping.pieceId, label))).toEqual([undefined, undefined, undefined]);
    }
  });

  it('01-10: the box of the traceroute lists its routers as before, once they are drawn, and says nothing of where its last probe stopped', () => {
    const run = sentTo(both, ADDRESS.server.id, MESSAGE.traceroute.id);
    expect(run.hiddenStop).toBe(false);
    expect(fieldLines(both, run.pieceId, HOPS_LABEL)).toEqual([ROUTER_LINE, PROVIDER_LINE]);
    expect(fieldLines(both, run.pieceId, STOPPED_LABEL)).toBeUndefined();
    expect(plainBox(both, run.pieceId).filter((text) => A_ROUTER_THAT_DISCARDS.test(text))).toEqual([]);
  });

  it('01-10: is the only incident whose routers wait for a traceroute to be drawn', () => {
    expect(INCIDENTS.filter((incident) => revealsRoutersByTraceroute(incident)).map((incident) => incident.id)).toEqual([SEEING_THE_PATH]);
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

describe('the texts that read a traceroute', () => {
  const texts = (): string[] => [...incidentTexts(guidedOf(SEEING_THE_PATH)), ...incidentTexts(watchOf()), ...TEXTS_THAT_READ_A_TRACEROUTE].map((text) => toPlainText(text));

  it('no text reads a silent traceroute hop as the place where the packet died', () => {
    expect(texts().length).toBeGreaterThan(TEXTS_THAT_READ_A_TRACEROUTE.length);
    expect(texts().filter(readsSilenceAsTheBreak)).toEqual([]);
  });

  it('the scan catches the readings of a silent hop that the game once made', () => {
    expect(READINGS_OF_A_SILENT_HOP_THE_GAME_ONCE_MADE.filter(readsSilenceAsTheBreak)).toEqual(READINGS_OF_A_SILENT_HOP_THE_GAME_ONCE_MADE);
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
    for (const wrong of explanation.filter((option) => !option.correct)) expect(toPlainText(wrong.feedback)).toContain('mapa');
  });

  it('01-11: the first task does not give the answer away, and the second hint names the field of the box that holds it', () => {
    const incident = guidedOf(THE_GUARD);
    expect(toPlainText(incident.tasks[0].text)).not.toMatch(/firewall|descart/i);
    expect(toPlainText(incident.hints[1])).toContain(`«${STOPPED_LABEL}»`);
    expect(fieldLines(dropped, dropped.sent[0].pieceId, STOPPED_LABEL)).toBeDefined();
    expect(firewallBox()?.fields.map((field) => toPlainText(field.label))).not.toContain(STOPPED_LABEL);
  });

  it('01-11: starts from the world of 01-10 solved, with no change of its own, so the provider router keeps the broken stretch', () => {
    const before = solvedWorld(INCIDENTS, SEEING_THE_PATH);
    expect(guidedOf(THE_GUARD).changes).toEqual([]);
    expect(start.world).toEqual(before);
    expect(providerOf(start.world)?.sendsUnreachable).toBe(false);
    expect(networkSchema.safeParse(start.world).success).toBe(true);
  });

  it('01-11: its report says nothing of router-proveedor or of the stretch, which the map of 01-11 does not draw', () => {
    expect(toPlainText(guidedOf(THE_GUARD).report)).not.toMatch(new RegExp(`${ROUTER.provider.name}|tramo|proveedor`));
  });
});

describe('the same ping of 01-05 and 01-11', () => {
  const hidden = pingTo(startSession(INCIDENTS, WHEN_IT_DOES_NOT_COME_BACK), ADDRESS.marta.id).sent[0];
  const shown = pingTo(startSession(INCIDENTS, THE_GUARD), ADDRESS.marta.id).sent[0];
  const stoppedLabel = (session: Session) => fieldLines(session, session.sent[0].pieceId, STOPPED_LABEL);

  it('the same ping of 01-05 and 01-11 has the same trace and only the words change', () => {
    expect(shown.packet).toEqual(hidden.packet);
    expect({ ...shown.trace, routes: undefined }).toEqual({ ...hidden.trace, routes: undefined });
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

function runOf(session: Session, flow: Flow): FlowRun {
  const found = session.runs.find((candidate) => candidate.id === flow.id);
  if (!found) throw new Error(`no run for ${flow.id}`);
  return found;
}

function allowFrom(session: Session, fromId: string, firewallId: string = FIREWALL.marta): Session {
  return sessionReducer(session, { type: 'placeRule', firewallId, whatId: WHAT.echoRequest.id, fromId });
}

function allowTo(session: Session, toId: string): Session {
  return sessionReducer(session, { type: 'placeRule', firewallId: FIREWALL.you, whatId: WHAT.echoRequest.id, toId, direction: 'outbound' });
}

function expectedPackets(session: Session) {
  return session.incident.flows.filter((flow) => flow.kind !== 'forbidden').map((flow) => flow.packet);
}

describe('01-12, your first rule', () => {
  const start = startSession(INCIDENTS, YOUR_FIRST_RULE);
  const support = allowFrom(start, FROM.lucia.id);
  const open = allowFrom(start, FROM.anyone.id);
  const marta = PIECE_ID.firewall(FIREWALL.marta);

  it('01-12: Echo Request from laptop-lucia lets her ping in and keeps the visitor out, with the middle star', () => {
    expect(runOf(support, FLOW.support)).toMatchObject({ replied: true, blocked: false });
    expect(runOf(support, FLOW.visitor)).toMatchObject({ reached: false, blocked: true, by: [FIREWALL.marta] });
    expect(isIntruding(support)).toBe(false);
    expect(support.alerts).toBe(0);
    expectClosed(support);
  });

  it('01-12: any source lets the visitor in and raises the alert', () => {
    expect(runOf(open, FLOW.support)).toMatchObject({ replied: true });
    expect(runOf(open, FLOW.visitor)).toMatchObject({ reached: true, intruder: true });
    expect(isIntruding(open)).toBe(true);
    expect(open.alerts).toBe(1);
    expect(sessionReducer(open, { type: 'submit' }).rejection).toMatchObject({ intruding: true, failingTaskIds: [TASK.rule] });
  });

  it('01-12: the probe battery finds the extra opening of any source and none of laptop-lucia', () => {
    const extra = extraOpenings(open.world, expectedPackets(open));
    expect(extra.length).toBeGreaterThan(0);
    expect(extra.map((packet) => packet.from.id)).toContain(DEVICE.visitor.id);
    expect(isTight(open.world, open.incident.flows)).toBe(false);
    expect(extraOpenings(support.world, expectedPackets(support))).toEqual([]);
    expect(isTight(support.world, support.incident.flows)).toBe(true);
  });

  it('01-12: starts with the firewall of laptop-marta open to rules, with none, and both pings stopped by it', () => {
    expect(canConfigure(start, FIREWALL.marta)).toBe(true);
    expect(start.world.firewalls.find((firewall) => firewall.id === FIREWALL.marta)?.inbound).toEqual([]);
    expect([runOf(start, FLOW.support), runOf(start, FLOW.visitor)].map((run) => [run.blocked, run.replied, run.by])).toEqual([
      [true, false, [FIREWALL.marta]],
      [true, false, [FIREWALL.marta]],
    ]);
    expect(openTasks(start)).toEqual([TASK.rule]);
    const card = firewallCard(start, marta);
    expect(card?.outbound).toBeUndefined();
    expect(card && toPlainText(card.empty)).toBe(NO_INBOUND_RULES);
  });

  it('01-12: the Type is Echo Request and the Source is Cualquier IP de origen or laptop-lucia with its IP, each chip naming a term by its official name', () => {
    const incident = INCIDENTS.find((candidate) => candidate.id === YOUR_FIRST_RULE);
    if (incident?.mechanic !== 'filter') throw new Error('01-12 is a filter incident');
    expect(incident.chips.what.map((chip) => toPlainText(chip.label))).toEqual([ECHO_REQUEST_LABEL]);
    expect(incident.chips.from.map((chip) => toPlainText(chip.label))).toEqual([ANY_SOURCE_LABEL, LUCIA_CHIP_LABEL]);
    expect(termsIn(incident.chips.from[0].label)).toEqual(['source-ip']);
    expect(termsIn(incident.chips.from[1].label)).toEqual(['ip-address']);
    expect(incident.chips.to).toBeUndefined();
  });

  it('01-12: draws laptop-lucia, laptop-visita and laptop-marta with its firewall, and no globe, router or sender of its own', () => {
    expect(drawnLabels(start)).toEqual(['device:laptop-lucia', 'device:laptop-marta', 'device:laptop-visita', `firewall:firewall ${DEVICE.marta.name}`].sort());
    expect(guidedOf(YOUR_FIRST_RULE).shown).toEqual(RULE_PIECES);
    expect(pieceViews(start).filter((piece) => piece.kind === 'edge' || piece.kind === 'internet')).toEqual([]);
  });

  it('01-12: a rule only allows: no chip, task, hint or option offers a rule that denies, and the visitor is refused by what no rule allows', () => {
    const incident = guidedOf(YOUR_FIRST_RULE);
    const wrong = incident.explanation.filter((option) => !option.correct).map((option) => option.text);
    const texts = incidentTexts(incident).filter((text) => !wrong.includes(text));
    expect(texts.map((text) => toPlainText(text)).filter((text) => A_RULE_THAT_DENIES.test(text))).toEqual([]);
    expect(incident.solution.every((move) => move.type === 'placeRule')).toBe(true);
  });

  it('01-12: introduces the five terms and uses each one in a text the player reads', () => {
    const incident = guidedOf(YOUR_FIRST_RULE);
    expect([...incident.introduces].sort()).toEqual(['allow', 'default-deny', 'deny', 'least-privilege', 'rule']);
    const used = new Set(incidentTexts(incident).flatMap((text) => termsIn(text)));
    expect(incident.introduces.filter((term) => !used.has(term))).toEqual([]);
  });

  it('01-12: the question has three options, the right one is the default deny and each wrong one is a mistake its feedback refutes', () => {
    const { explanation } = guidedOf(YOUR_FIRST_RULE);
    expect(explanation).toHaveLength(3);
    const [right] = explanation.filter((option) => option.correct);
    expect(termsIn(right.feedback)).toEqual(expect.arrayContaining(['default-deny']));
    expect(termsIn(right.text)).toEqual(expect.arrayContaining(['rule', 'allow', 'deny']));
    for (const wrong of explanation.filter((option) => !option.correct)) expect(toPlainText(wrong.feedback)).toMatch(/\breglas?\b/);
  });

  it('01-12: the hints name the chips of the card and the second ones names the least privilege', () => {
    const [first, second] = guidedOf(YOUR_FIRST_RULE).hints;
    expect(termsIn(first)).toEqual(expect.arrayContaining(['firewall', 'rule', 'allow']));
    expect(termsIn(second)).toEqual(expect.arrayContaining(['echo-request', 'least-privilege']));
    expect(toPlainText(second)).toContain(DEVICE.lucia.name);
  });

  it('01-12: starts from the world of 01-11 solved, with the visitor connected, and the schema accepts its two worlds', () => {
    expect(start.world).toEqual(solvedWorld(INCIDENTS, THE_GUARD));
    expect(start.world.devices.find((device) => device.id === DEVICE.visitor.id)?.connected).not.toBe(false);
    expect([start.world, solvedWorld(INCIDENTS, YOUR_FIRST_RULE)].flatMap((world) => networkSchema.safeParse(world).error?.issues.map((issue) => issue.message) ?? [])).toEqual([]);
  });

  it('01-12: none of its texts uses the words entrada and salida, which 01-13 introduces', () => {
    const texts = [...incidentTexts(guidedOf(YOUR_FIRST_RULE)), ...everythingShown(support), ...everythingShown(start)].map((text) => toPlainText(text));
    expect(texts.filter((text) => /\b(entrada|salida)\b/i.test(text))).toEqual([]);
  });
});

describe('01-13, in and out', () => {
  const start = startSession(INCIDENTS, IN_AND_OUT);
  const outbound = allowTo(start, TO.lucia.id);
  const inbound = allowFrom(start, FROM.lucia.id, FIREWALL.you);
  const yours = PIECE_ID.firewall(FIREWALL.you);
  const stoppedAt = (session: Session) => stopStep(runOf(session, FLOW.leave).trace);

  it('01-13: an outbound rule for laptop-lucia lets the ping leave and come back', () => {
    expect(runOf(outbound, FLOW.leave)).toMatchObject({ replied: true, blocked: false, by: [DEVICE.lucia.id] });
    expect(runOf(start, FLOW.leave)).toMatchObject({ replied: false, blocked: true });
    expectClosed(outbound);
  });

  it('01-13: an inbound rule does not let the ping leave', () => {
    expect(runOf(inbound, FLOW.leave)).toMatchObject({ replied: false, reached: false, blocked: true, by: [FIREWALL.you] });
    expect(openTasks(inbound)).toEqual([TASK.leave]);
    expect(sessionReducer(inbound, { type: 'submit' }).phase).toBe('playing');
    expect(sessionReducer(inbound, { type: 'submit' }).rejection).toMatchObject({ failingTaskIds: [TASK.leave] });
  });

  it('01-13: the stamp stays on your own laptop until the rule is outbound', () => {
    for (const session of [start, inbound]) {
      expect(stoppedAt(session)).toMatchObject({ stage: 'firewall-out', at: DEVICE.you.id, verdict: 'drop' });
      expect(runOf(session, FLOW.leave)).toMatchObject({ blocked: true, by: [FIREWALL.you] });
    }
    expect(stoppedAt(outbound)?.stage).not.toBe('firewall-out');
    expect(runOf(outbound, FLOW.leave).blocked).toBe(false);
  });

  it('01-13: the firewall card of your laptop shows the tabs Entrada and Salida, and a rule placed in Entrada leaves the ping stopped', () => {
    const card = firewallCard(start, yours);
    expect(card?.outbound && Object.values(card.outbound.tabs).map((tab) => toPlainText(tab))).toEqual(['entrada', 'salida']);
    expect(card?.rules).toEqual([]);
    expect(card?.outbound?.rules).toEqual([]);
    expect(canConfigure(start, FIREWALL.you, 'inbound')).toBe(true);
    expect(canConfigure(start, FIREWALL.you, 'outbound')).toBe(true);
    const placed = firewallCard(inbound, yours);
    expect(placed?.rules).toHaveLength(1);
    expect(placed?.outbound?.rules).toEqual([]);
    expect(runOf(inbound, FLOW.leave)).toMatchObject({ replied: false, blocked: true });
    expect(firewallCard(outbound, yours)?.outbound?.rules).toHaveLength(1);
  });

  it('01-13: no text of the incident says or suggests that a firewall closes its outbound side by default', () => {
    const card = firewallCard(start, yours);
    const words = [card?.title, card?.empty, card?.outbound?.empty, card?.slot, card?.outbound?.slot, ...Object.values(card?.outbound?.tabs ?? {})].filter((text): text is string => text !== undefined);
    const texts = [...incidentTexts(guidedOf(IN_AND_OUT)), ...words, ...everythingShown(start), ...everythingShown(inbound), ...everythingShown(outbound)].map((text) => toPlainText(text));
    expect(texts.filter((text) => BY_DEFAULT.test(text))).toEqual([]);
    expect(texts.filter((text) => GENERAL_RULE_OF_FIREWALLS.test(text))).toEqual([]);
    expect(card?.outbound && toPlainText(card.outbound.empty)).toBe('Este firewall tiene la salida cerrada: alguien lo configuró así.');
    expect(termsIn(guidedOf(IN_AND_OUT).explanation.map((option) => option.text).join(' '))).not.toContain('default-deny');
  });

  it('01-13: the reason of the drop on your own laptop says that its outbound side was set closed, and states no general rule about firewalls', () => {
    for (const session of [start, inbound]) {
      const reason = fieldLines(session, runOf(session, FLOW.leave).pieceId, STOPPED_LABEL);
      expect(reason).toEqual([CLOSED_BY_SOMEONE]);
      expect(reason?.filter((text) => GENERAL_RULE_OF_FIREWALLS.test(text) || BY_DEFAULT.test(text))).toEqual([]);
    }
  });

  it('01-13: with an outbound rule for another destination the reason no longer says the side is closed, but that no rule lets the ping out', () => {
    const elsewhere = allowTo(start, TO.printer.id);
    expect(runOf(elsewhere, FLOW.leave)).toMatchObject({ blocked: true, replied: false });
    expect(fieldLines(elsewhere, runOf(elsewhere, FLOW.leave).pieceId, STOPPED_LABEL)).toEqual([NO_RULE_LETS_IT_OUT]);
  });

  it('01-13: the reply comes back through a firewall with no inbound rule, and no text says why', () => {
    expect(firewallCard(outbound, yours)?.rules).toEqual([]);
    expect(outbound.world.firewalls.find((firewall) => firewall.id === FIREWALL.you)?.inbound).toEqual([]);
    const reply = outbound.runs.find((run) => run.id === FLOW.leave.id)?.trace.steps.find((step) => step.stage === 'reply');
    expect(reply).toMatchObject({ verdict: 'pass' });
    const shown = everythingShown(outbound);
    expect(shown.filter((text) => NO_REASON_GIVEN.test(text))).toEqual([]);
    const card = firewallCard(outbound, yours);
    expect(card && toPlainText(card.empty)).toBe(NO_INBOUND_RULES);
    expect(boxLines(outbound, DEVICE.you.id).concat(plainBox(outbound, yours)).filter((text) => /nada|no deja entrar/i.test(text))).toEqual([]);
    expect(shown.filter((text) => SWITCHED_OFF.test(text))).toEqual([]);
  });

  it('01-13: opening the inbound side too is more than the incident needs, so it keeps the stars but the middle one', () => {
    const both = allowFrom(outbound, FROM.lucia.id, FIREWALL.you);
    expect(isTight(outbound.world, outbound.incident.flows)).toBe(true);
    expect(isTight(both.world, both.incident.flows)).toBe(false);
    expect(starsOf(sessionReducer(both, { type: 'submit' }))).toMatchObject({ closed: true, middle: false });
  });

  it('01-13: keeps the rule of 01-12 working in the background, as an ambient flow that counts for the battery and closes no task', () => {
    const incident = guidedOf(IN_AND_OUT);
    expect(incident.flows.map((flow) => [flow.id, flow.kind])).toEqual([[FLOW.leave.id, 'required'], [FLOW.support.id, 'ambient']]);
    expect(runOf(start, FLOW.support)).toMatchObject({ replied: true });
    expect(incident.tasks.flatMap((task) => ('flowIds' in task ? task.flowIds : []))).toEqual([FLOW.leave.id]);
    expect(isTight(outbound.world, [FLOW.leave])).toBe(false);
    expect(isTight(outbound.world, incident.flows)).toBe(true);
  });

  it('01-13: draws tu-laptop, laptop-lucia and laptop-marta with their firewalls and no globe', () => {
    expect(guidedOf(IN_AND_OUT).shown).toEqual(GUARD_PIECES);
    expect(drawnLabels(start)).toEqual(
      ['device:laptop-lucia', 'device:laptop-marta', 'device:tu-laptop', `firewall:firewall ${DEVICE.marta.name}`, `firewall:firewall ${DEVICE.you.name}`].sort(),
    );
    expect(pieceViews(start).filter((piece) => piece.kind === 'edge' || piece.kind === 'internet')).toEqual([]);
  });

  it('01-13: the Type is Echo Request, and the Source and the Destination are laptop-lucia or the printer, each with its IP', () => {
    const incident = INCIDENTS.find((candidate) => candidate.id === IN_AND_OUT);
    if (incident?.mechanic !== 'filter') throw new Error('01-13 is a filter incident');
    expect(incident.chips.what.map((chip) => toPlainText(chip.label))).toEqual([ECHO_REQUEST_LABEL]);
    expect(incident.chips.from.map((chip) => toPlainText(chip.label))).toEqual([LUCIA_CHIP_LABEL, PRINTER_CHIP_LABEL]);
    expect((incident.chips.to ?? []).map((chip) => toPlainText(chip.label))).toEqual([LUCIA_CHIP_LABEL, PRINTER_CHIP_LABEL]);
    for (const chip of [...incident.chips.from, ...(incident.chips.to ?? [])]) expect(termsIn(chip.label)).toEqual(['ip-address']);
  });

  it('01-13: introduces entrada and salida, and no text says a regla de entrada or a regla de salida, which are the names of the terms of chapter 4', () => {
    const incident = guidedOf(IN_AND_OUT);
    expect([...incident.introduces].sort()).toEqual(['inbound', 'outbound']);
    const texts = [...incidentTexts(incident), ...everythingShown(start)].map((text) => toPlainText(text));
    expect(texts.filter((text) => /regla de (entrada|salida)/i.test(text))).toEqual([]);
  });

  it('01-13: starts from the world of 01-12 solved plus the firewall of your laptop with nothing in either direction, and the schema accepts its two worlds', () => {
    const before = solvedWorld(INCIDENTS, YOUR_FIRST_RULE);
    expect(start.world.firewalls).toEqual([...before.firewalls, { id: FIREWALL.you, name: DEVICE.you.name, kind: 'host-firewall', inbound: [], outbound: [] }]);
    expect(start.world.devices.find((device) => device.id === DEVICE.you.id)?.firewallIds).toEqual([FIREWALL.you]);
    expect([start.world, solvedWorld(INCIDENTS, IN_AND_OUT)].flatMap((world) => networkSchema.safeParse(world).error?.issues.map((issue) => issue.message) ?? [])).toEqual([]);
  });
});

describe('the rules of 01-12 and 01-13', () => {
  it('01-12 and 01-13: no text names a switched-off device as the cause of anything', () => {
    for (const id of [YOUR_FIRST_RULE, IN_AND_OUT]) {
      const session = startSession(INCIDENTS, id);
      expect(incidentTexts(guidedOf(id)).filter((text) => SWITCHED_OFF.test(toPlainText(text))), id).toEqual([]);
      expect(everythingShown(session).filter((text) => SWITCHED_OFF.test(text)), id).toEqual([]);
    }
  });

  it('01-12 and 01-13: the question is one question and each wrong option is refuted by its own feedback', () => {
    for (const id of [YOUR_FIRST_RULE, IN_AND_OUT]) {
      const { question, explanation } = guidedOf(id);
      expect(toPlainText(question ?? '').match(/\?/g), id).toHaveLength(1);
      expect(new Set(explanation.map((option) => toPlainText(option.feedback))).size, id).toBe(explanation.length);
    }
  });

  it('01-12 and 01-13: use no internet, so the broken stretch of router-proveedor changes none of their results', () => {
    for (const id of [YOUR_FIRST_RULE, IN_AND_OUT]) {
      const world = startWorld(INCIDENTS, id);
      const repaired = REPAIRED_STRETCH.reduce(applyAction, world);
      expect(providerOf(world), id).toEqual(providerOf(solvedWorld(INCIDENTS, SEEING_THE_PATH)));
      expect(providerOf(repaired), id).not.toEqual(providerOf(world));
      for (const { packet } of guidedOf(id).flows) expect(simulate(world, packet), id).toEqual(simulate(repaired, packet));
    }
  });
});

describe('the thirteen incidents of blocks 1 to 4', () => {
  const places = [
    THE_OFFICE,
    THE_ENVELOPE,
    ARE_YOU_THERE,
    PING_YOURSELF,
    WHEN_IT_DOES_NOT_COME_BACK,
    YOUR_NETWORK,
    WHO_GETS_WHAT_IS_OUTSIDE,
    THE_NETWORK_OF_NETWORKS,
    COUNTING_HOPS,
    SEEING_THE_PATH,
    THE_GUARD,
    YOUR_FIRST_RULE,
    IN_AND_OUT,
  ].map((id) => guidedOf(id).explanation.findIndex((option) => option.correct));

  it('01-12 and 01-13: put the right explanation in places of their own, neither the second nor the one of the incident before', () => {
    expect(places.slice(-2)).toEqual([FIRST_RULE_PLACE, IN_AND_OUT_PLACE]);
    expect(places.filter((place, index) => index > 0 && place === places[index - 1])).toEqual([]);
    expect(places.at(-2)).not.toBe(GUARD_PLACE);
  });

  it('01-12 and 01-13: start and end in a world the network schema accepts', () => {
    for (const id of [YOUR_FIRST_RULE, IN_AND_OUT]) {
      expect([startWorld(INCIDENTS, id), solvedWorld(INCIDENTS, id)].flatMap((world) => networkSchema.safeParse(world).error?.issues.map((issue) => issue.message) ?? []), id).toEqual([]);
    }
  });

  it('01-12 and 01-13: draw no globe of the internet even when the term internet is known, because no piece they list is outside the office', () => {
    for (const id of [YOUR_FIRST_RULE, IN_AND_OUT]) {
      const session = startSession(INCIDENTS, id);
      expect(pieceViews({ ...session, known: new Set([...session.known, 'internet']) }).some((piece) => piece.kind === 'internet'), id).toBe(false);
    }
  });
});

describe('the options and the right explanations of 01-01 to 01-13', () => {
  const questions = INCIDENTS.filter((incident) => incident.chapter === 1 && incident.id !== FINAL_WATCH).map((incident) => guidedOf(incident.id));
  const sizes = questions.map((incident) => incident.explanation.map((option) => toPlainText(option.text).length));
  const rightSizes = questions.map((incident, index) => sizes[index][incident.explanation.findIndex((option) => option.correct)]);

  it('in no incident is the longest of the three options more than 1.4 times the shortest', () => {
    expect(questions).toHaveLength(QUESTIONS_BEFORE_THE_WATCH);
    expect(questions.filter((_, index) => Math.max(...sizes[index]) > Math.min(...sizes[index]) * LONGEST_OVER_SHORTEST).map((incident) => incident.id)).toEqual([]);
  });

  it('the right option is the longest in at most a third of the questions and the shortest in at most a third, so its length gives nothing away', () => {
    const longest = questions.filter((_, index) => rightSizes[index] === Math.max(...sizes[index]));
    const shortest = questions.filter((_, index) => rightSizes[index] === Math.min(...sizes[index]));
    expect(longest.length).toBeLessThanOrEqual(Math.floor(QUESTIONS_BEFORE_THE_WATCH / A_THIRD));
    expect(shortest.length).toBeLessThanOrEqual(Math.floor(QUESTIONS_BEFORE_THE_WATCH / A_THIRD));
  });

  it('01-09 and 01-10: the right explanation is the essential chain, in at most six short sentences with one idea each', () => {
    for (const id of [COUNTING_HOPS, SEEING_THE_PATH]) {
      const sentences = toPlainText(guidedOf(id).explanation.find((option) => option.correct)?.feedback ?? '').split(END_OF_SENTENCE);
      expect(sentences.length, id).toBeLessThanOrEqual(MOST_SENTENCES_OF_A_CHAIN);
      expect(sentences.filter((sentence) => sentence.length > LONGEST_SENTENCE_OF_A_CHAIN), id).toEqual([]);
    }
  });
});

function watchOf(): DiagnoseIncident {
  const found = INCIDENTS.find((candidate) => candidate.id === FINAL_WATCH);
  if (found?.mechanic !== 'diagnose') throw new Error(`${FINAL_WATCH} is not a diagnose incident`);
  return found;
}

function caseOf(session: Session) {
  const spec = currentCase(session);
  if (!spec) throw new Error('the session is not on a case');
  return spec;
}

function closeCase(session: Session): Session {
  const right = caseOf(session).cause.options.findIndex((option) => option.correct);
  return sessionReducer(sessionReducer(session, { type: 'nameCause', index: right }), { type: 'nextCase' });
}

function atCase(number: number): Session {
  return Array.from({ length: number - 1 }).reduce<Session>(closeCase, startSession(INCIDENTS, FINAL_WATCH));
}

function sendFrom(session: Session, fromId: string, toId: string, messageId: string = MESSAGE.ping.id): Session {
  return sessionReducer(session, { type: 'sendPacket', fromId, toId, messageId });
}

function pingsFrom(session: Session, fromId: string, ...toIds: string[]): Session {
  return toIds.reduce((current, toId) => sendFrom(current, fromId, toId), session);
}

function allTests(session: Session): Session {
  return sendCombinations(caseOf(session)).reduce((current, { fromId, toId, messageId }) => sendFrom(current, fromId, toId, messageId), session);
}

function outcomesOf(session: Session): string[] {
  return session.sent.map((packet) => packet.trace.outcome);
}

function stopCodesOf(session: Session): string {
  const codes = session.sent.flatMap((packet) => (packet.replied ? [] : [stopStep(packet.trace)?.reason.code ?? 'no-stop']));
  return [...new Set(codes)].sort().join(',');
}

function caseWorlds(): Session['world'][] {
  const before = startWorld(INCIDENTS, FINAL_WATCH);
  return watchOf().diagnose.cases.map((spec) => caseWorld(before, spec));
}

function yourDevice(world: Session['world']) {
  return world.devices.find((device) => device.id === DEVICE.you.id);
}

function watchTexts(): string[] {
  return incidentTexts(watchOf()).map((text) => toPlainText(text));
}

describe('01-14, the final watch', () => {
  it('01-14: case 1 shows the four tests and the fourth does not leave the laptop', () => {
    const start = atCase(1);
    expect(caseCard(start)?.origins.flatMap((origin) => origin.tests.map((test) => toPlainText(test.line)))).toEqual(TESTS_OF_THE_SEQUENCE);
    const tested = pingsFrom(start, ORIGIN.you.id, ADDRESS.loopback.id, ADDRESS.you.id, ADDRESS.gateway.id, ADDRESS.server.id);
    expect(outcomesOf(tested)).toEqual(['replied', 'replied', 'replied', 'no-route']);
    const [, , gateway, server] = tested.sent;
    expect(gateway.trace.destinationId).toBe(ROUTER.office.id);
    expect(server).toMatchObject({ replied: false, reached: false, blocked: false, warning: null, by: [DEVICE.you.id] });
    expect(stopStep(server.trace)).toMatchObject({ stage: 'route', at: DEVICE.you.id, reason: { code: 'route-no-gateway' } });
    expect(server.trace.hops).toBeUndefined();
    expect(fieldLines(tested, server.pieceId, STOPPED_LABEL)).toEqual([NO_GATEWAY_TO_SERVER]);
    expect(caseCard(tested)?.origins.every((origin) => origin.tests.every((test) => test.sent))).toBe(true);
    expect(toPlainText(caseOf(start).hints[1])).toContain(STOPPED_LABEL);
  });

  it('01-14: case 2 warns from your own laptop for 192.168.1.22', () => {
    const tested = pingsFrom(atCase(2), ORIGIN.you.id, ADDRESS.typo.id, ADDRESS.printer.id);
    const [typo, printer] = tested.sent;
    expect(deviceNameAt(tested, IP.typo)).toBeUndefined();
    expect(typo).toMatchObject({ replied: false, reached: false, blocked: false, by: [DEVICE.you.id] });
    expect(typo.trace).toMatchObject({ outcome: 'unreachable', notice: { kind: 'host-unreachable', fromId: DEVICE.you.id, fromIp: IP.you } });
    expect(typo.warning).not.toBeNull();
    expect(typo.trace.rttMs).toBeUndefined();
    expect(fieldLines(tested, typo.pieceId, STOPPED_LABEL)).toEqual([SENDER_LOOKED.replace(IP.nobody, IP.typo)]);
    expect(printer).toMatchObject({ replied: true, blocked: false, trace: { destinationId: DEVICE.printer.id } });
    expect(boxLines(tested, DEVICE.printer.id).some((line) => line.includes(IP.printer))).toBe(true);
  });

  it('01-14: case 3 fails from the second floor and the router answers', () => {
    const start = atCase(3);
    expect(caseOf(start).send.from).toEqual([ORIGIN.andres]);
    expect(start.world.devices.find((device) => device.id === DEVICE.andres.id)?.gateway).toBeUndefined();
    const tested = pingsFrom(start, ORIGIN.andres.id, ADDRESS.loopback.id, ADDRESS.andres.id, ADDRESS.secondFloorRouter.id, ADDRESS.printer.id);
    expect(outcomesOf(tested)).toEqual(['replied', 'replied', 'replied', 'no-route']);
    const [, , router, printer] = tested.sent;
    expect(router.trace.destinationId).toBe(ROUTER.office.id);
    expect(printer).toMatchObject({ replied: false, reached: false, blocked: false, warning: null, by: [DEVICE.andres.id] });
    expect(stopStep(printer.trace)).toMatchObject({ stage: 'route', at: DEVICE.andres.id, reason: { code: 'route-no-gateway' } });
    expect(printer.trace.hops).toBeUndefined();
    expect(fieldLines(tested, printer.pieceId, STOPPED_LABEL)).toEqual([NO_GATEWAY_TO_PRINTER]);
  });

  it('01-14: case 4 reaches the server and is silent towards 10.0.0.10', () => {
    const start = atCase(4);
    const tested = pingsFrom(start, ORIGIN.you.id, ADDRESS.server.id, ADDRESS.otherOffice.id);
    const [server, branch] = tested.sent;
    expect(server).toMatchObject({ replied: true, trace: { destinationId: SERVER.id } });
    expect(hopIds(server)).toEqual([ROUTER.office.id, ROUTER.provider.id, ROUTER.destination.id]);
    expect(branch).toMatchObject({ replied: false, reached: false, blocked: false, hiddenStop: false, warning: null, by: [ROUTER.provider.id], trace: { outcome: 'timeout' } });
    expect(branch.trace.notice).toBeUndefined();
    expect(hopIds(branch)).toEqual([ROUTER.office.id, ROUTER.provider.id]);
    expect(stopStep(branch.trace)).toMatchObject({ stage: 'forward', at: ROUTER.provider.id, reason: { code: 'forward-private-dropped' } });
    expect(drawsRouter(start, ROUTER.provider.id)).toBe(true);
    expect(everythingShown(tested).filter((text) => NAT_WORDS.test(text))).toEqual([]);
  });

  it('01-14: case 5 alternates two routers in its Time Exceeded', () => {
    const start = atCase(5);
    const byTtl = ([1, 2, 3] as const).map((ttl) => sendWith(start, PING_WITH_TTL[ttl].id, ADDRESS.server.id).sent[0]);
    expect(byTtl.map((run) => run.trace.notice)).toEqual([
      { kind: 'time-exceeded', fromId: ROUTER.office.id, fromIp: IP.router },
      { kind: 'time-exceeded', fromId: ROUTER.provider.id, fromIp: IP.provider },
      { kind: 'time-exceeded', fromId: ROUTER.office.id, fromIp: IP.router },
    ]);
    expect(byTtl.every((run) => run.trace.outcome === 'ttl-exceeded' && run.warning !== null && !run.replied && !run.reached)).toBe(true);
    expect(plainBox(start, PIECE_ID.actor(SERVER.id))).toContain(IP.server);
    const plain = sendWith(start, MESSAGE.ping.id, ADDRESS.server.id).sent[0];
    expect(plain).toMatchObject({ replied: false, reached: false, trace: { outcome: 'ttl-exceeded' } });
    const traced = sendWith(start, MESSAGE.traceroute.id, ADDRESS.server.id).sent[0];
    const ips = traced.route?.lines.map((line) => line.ip);
    expect(ips).toEqual(Array.from({ length: TRACEROUTE_LINES }, (_, index) => (index % 2 === 0 ? IP.router : IP.provider)));
    expect(new Set(ips).size).toBe(2);
    expect([ROUTER.office.id, ROUTER.provider.id].map((id) => drawsRouter(start, id))).toEqual([true, true]);
    const session = sendWith(start, MESSAGE.traceroute.id, ADDRESS.server.id);
    expect(fieldLines(session, traced.pieceId, HOPS_LABEL)?.length).toBeGreaterThan(0);
    expect(fieldLines(session, traced.pieceId, STOPPED_LABEL)).toBeUndefined();
    expect(plainBox(session, traced.pieceId).filter((text) => A_ROUTER_THAT_DISCARDS.test(text))).toEqual([]);
  });

  it('01-14: the right cause of case 5 names router-proveedor and the change of its configuration, its report does not give the cause away, and no text says a router got confused or says ruta', () => {
    const spec = watchOf().diagnose.cases[LOOP_CASE - 1];
    const right = spec.cause.options.find((option) => option.correct);
    expect(toPlainText(right?.feedback ?? '')).toContain(`${LOOP_CAUSE_TEXT} ${ROUTER.office.name} se lo manda otra vez a ${ROUTER.provider.name}`);
    expect(toPlainText(spec.report)).not.toContain(ROUTER.provider.name);
    const texts = [spec.report, spec.cause.question, ...spec.cause.options.flatMap((option) => [option.text, option.feedback])].map((text) => toPlainText(text));
    expect(texts.filter((text) => A_ROUTER_THAT_IS_CONFUSED_OR_A_ROUTE.test(text))).toEqual([]);
  });

  it('01-14: case 6 is silent towards one laptop only, and its firewall is visible', () => {
    const start = atCase(6);
    const tested = pingsFrom(start, ORIGIN.you.id, ADDRESS.lucia.id, ADDRESS.printer.id, ADDRESS.gateway.id, ADDRESS.server.id);
    expect(outcomesOf(tested)).toEqual(['timeout', 'replied', 'replied', 'replied']);
    const [lucia] = tested.sent;
    expect(lucia).toMatchObject({ replied: false, reached: false, blocked: true, warning: null, by: [FIREWALL.lucia] });
    expect(stopStep(lucia.trace)).toMatchObject({ stage: 'firewall-in', at: DEVICE.lucia.id, verdict: 'drop' });
    expect(lucia.trace.hops).toBeUndefined();
    expect([DEVICE.you, DEVICE.lucia].map(({ id }) => start.world.devices.find((device) => device.id === id)?.lanId)).toEqual([FLOOR.first.id, FLOOR.first.id]);
    expect(drawnLabels(start)).toContain(`firewall:firewall ${DEVICE.lucia.name}`);
    expect(inspect(start, PIECE_ID.firewall(FIREWALL.lucia))).not.toBeNull();
    expect(drawnLabels(atCase(5))).not.toContain(`firewall:firewall ${DEVICE.lucia.name}`);
    expect(fieldLines(tested, PIECE_ID.firewall(FIREWALL.you), OUTBOUND_LABEL)).toEqual([LETS_EVERYTHING_OUT]);
  });

  it('01-14: case 7 stops everything at your own laptop, even the ping to the gateway', () => {
    const tested = pingsFrom(atCase(7), ORIGIN.you.id, ADDRESS.loopback.id, ADDRESS.you.id, ADDRESS.gateway.id, ADDRESS.server.id);
    expect(outcomesOf(tested)).toEqual(['replied', 'replied', 'timeout', 'timeout']);
    const [, , gateway, server] = tested.sent;
    for (const run of [gateway, server]) {
      expect(run).toMatchObject({ replied: false, blocked: true, warning: null, by: [FIREWALL.you] });
      expect(run.trace.destinationId).toBeNull();
      expect(run.trace.hops).toBeUndefined();
      expect(stopStep(run.trace)).toMatchObject({ stage: 'firewall-out', at: DEVICE.you.id, verdict: 'drop' });
      expect(fieldLines(tested, run.pieceId, STOPPED_LABEL)).toEqual([CLOSED_BY_SOMEONE]);
    }
    expect(tested.world.routers?.find((router) => router.id === ROUTER.office.id)?.interfaces).toContainEqual({ ip: IP.router, faces: yourDevice(tested.world)?.lanId });
    expect(firewallCard(tested, PIECE_ID.firewall(FIREWALL.you))).toMatchObject({ rules: [] });
    expect(firewallCard(tested, PIECE_ID.firewall(FIREWALL.you))?.outbound).toBeUndefined();
  });

  it('01-14: naming the right cause of the seven cases earns three stars', () => {
    const finished = Array.from({ length: WATCH_CASES }).reduce<Session>(closeCase, startSession(INCIDENTS, FINAL_WATCH));
    expect(finished.phase).toBe('explaining');
    expect(finished.caseResults).toHaveLength(WATCH_CASES);
    expect(starsOf(finished)).toEqual({ closed: true, middle: true, explained: true });
    expect(caseSummary(finished)).toEqual({ total: WATCH_CASES, missed: [] });
    expect(sessionReducer(finished, { type: 'showResult' }).phase).toBe('result');
  });

  it('01-14: a wrong name first costs the explained star, and a hint costs the middle one, but neither stops the close', () => {
    const wrongFirst = (session: Session) => sessionReducer(session, { type: 'nameCause', index: caseOf(session).cause.options.findIndex((option) => !option.correct) });
    const slipped = Array.from({ length: WATCH_CASES }).reduce<Session>((session, _, index) => closeCase(index === 2 ? wrongFirst(session) : session), startSession(INCIDENTS, FINAL_WATCH));
    expect(starsOf(slipped)).toEqual({ closed: true, middle: true, explained: false });
    expect(caseSummary(slipped)?.missed).toEqual([3]);
    const hinted = Array.from({ length: WATCH_CASES }).reduce<Session>((session, _, index) => closeCase(index === 4 ? sessionReducer(session, { type: 'showHint' }) : session), startSession(INCIDENTS, FINAL_WATCH));
    expect(starsOf(hinted)).toEqual({ closed: true, middle: false, explained: true });
  });

  it('01-14: each case has a different cause or is the declared repeat of case 1', () => {
    const causes = Array.from({ length: WATCH_CASES }, (_, index) => stopCodesOf(allTests(atCase(index + 1))));
    expect(causes.filter((cause) => cause === '')).toEqual([]);
    const repeats = causes.flatMap((cause, index) => causes.slice(index + 1).flatMap((other, offset) => (other === cause ? [[index + 1, index + offset + 2]] : [])));
    expect(repeats).toEqual([[1, 3]]);
  });

  it('01-14: no report and no correct option names a switched-off device as the cause', () => {
    const { cases } = watchOf().diagnose;
    const options = cases.flatMap((spec) => spec.cause.options);
    const spoken = [...cases.map((spec) => spec.report), ...options.filter((option) => option.correct).flatMap((option) => [option.text, option.feedback])].map((text) => toPlainText(text));
    expect(spoken.filter((text) => SWITCHED_OFF_OR_DOWN.test(text))).toEqual([]);
    expect(options.filter((option) => !option.correct).some((option) => SWITCHED_OFF_OR_DOWN.test(toPlainText(option.text)))).toBe(true);
    expect(Array.from({ length: WATCH_CASES }, (_, index) => everythingShown(allTests(atCase(index + 1))).filter((text) => SWITCHED_OFF.test(text)))).toEqual(Array.from({ length: WATCH_CASES }, () => []));
  });

  it('01-14: every case report names a ping that does not come back and none uses a verb of the web', () => {
    const reports = watchOf().diagnose.cases.map((spec) => toPlainText(spec.report));
    expect(reports).toHaveLength(WATCH_CASES);
    expect(reports.filter((report) => !A_PING_THAT_DOES_NOT_COME_BACK.some((pattern) => pattern.test(report)))).toEqual([]);
    expect(reports.filter((report) => WEB_VERBS.test(report))).toEqual([]);
  });

  it('01-14: each case asks one question, and no feedback repeats the No es eso. or the Correcto. that the card already says', () => {
    for (const spec of watchOf().diagnose.cases) {
      expect(toPlainText(spec.cause.question).match(/\?/g), spec.id).toHaveLength(1);
      expect(spec.cause.options.map((option) => FEEDBACK_ECHO.test(toPlainText(option.feedback))), spec.id).toEqual([false, false, false]);
    }
  });

  it('01-14: in no case is the right option the longest by far, and it is the longest in at most half of the cases', () => {
    const lengths = watchOf().diagnose.cases.map((spec) => spec.cause.options.map((option) => toPlainText(option.text).length));
    expect(lengths.filter((sizes) => Math.max(...sizes) > Math.min(...sizes) * LONGEST_OVER_SHORTEST)).toEqual([]);
    const places = watchOf().diagnose.cases.map((spec) => spec.cause.options.findIndex((option) => option.correct));
    const longestIsRight = lengths.filter((sizes, index) => sizes[places[index]] === Math.max(...sizes));
    expect(longestIsRight.length).toBeLessThanOrEqual(Math.floor(WATCH_CASES / 2));
  });

  it('01-14: puts the right cause in more than one place, never twice in a row, and not in the place of 01-13', () => {
    const places = watchOf().diagnose.cases.map((spec) => spec.cause.options.findIndex((option) => option.correct));
    expect(places).toEqual(RIGHT_PLACES_OF_THE_WATCH);
    expect(new Set(places).size).toBe(3);
    expect(places.filter((place, index) => index > 0 && place === places[index - 1])).toEqual([]);
    expect(places[0]).not.toBe(IN_AND_OUT_PLACE);
  });

  it('01-14: starts from the world of 01-13 solved, and each case adds only its own changes to it, never to the case before', () => {
    const worlds = caseWorlds();
    expect(startWorld(INCIDENTS, FINAL_WATCH)).toEqual((watchOf().changes ?? []).reduce(applyAction, solvedWorld(INCIDENTS, IN_AND_OUT)));
    expect(solvedWorld(INCIDENTS, FINAL_WATCH)).toEqual(startWorld(INCIDENTS, FINAL_WATCH));
    expect(worlds.map((world) => yourDevice(world)?.gateway)).toEqual([undefined, ...Array.from({ length: WATCH_CASES - 1 }, () => IP.router)]);
    expect(worlds.map((world) => world.firewalls.find((firewall) => firewall.id === FIREWALL.you)?.outbound.length)).toEqual(YOUR_OUTBOUND_RULES_BY_CASE);
    expect(worlds.map((world) => world.firewalls.some((firewall) => firewall.id === FIREWALL.lucia))).toEqual([false, false, false, false, false, true, false]);
    expect(worlds.map((world) => world.routers?.find((router) => router.id === ROUTER.provider.id)?.routes.length)).toEqual(WATCH_ROUTES_BY_CASE);
    expect(worlds.map((world) => world.devices.find((device) => device.id === DEVICE.andres.id)?.gateway === undefined)).toEqual([false, false, true, false, false, false, false]);
    expect(worlds.flatMap((world) => networkSchema.safeParse(world).error?.issues.map((issue) => issue.message) ?? [])).toEqual([]);
  });

  it('each case of 01-14 draws only the pieces it uses', () => {
    const { cases } = watchOf().diagnose;
    expect(watchOf().shown).toBeUndefined();
    expect(cases.map((spec) => spec.shown?.length)).not.toContain(undefined);
    const drawn = Array.from({ length: WATCH_CASES }, (_, index) => drawnLabels(atCase(index + 1)));
    expect(drawn).toEqual(WATCH_DRAWN_BY_CASE.map((labels) => [...labels].sort()));
    for (const labels of drawn) expect(labels.filter((label) => label.includes(DEVICE.marta.name) || label.includes(DEVICE.visitor.name))).toEqual([]);
  });

  it('01-14: the firewall of your laptop reads in each case that draws it as the case needs it: everything out, and no rule in case 7; case 3 does not draw it, and its world has the same rule that lets everything out', () => {
    const outbound = (session: Session) => fieldLines(session, PIECE_ID.firewall(FIREWALL.you), OUTBOUND_LABEL);
    const read = Array.from({ length: WATCH_CASES }, (_, index) => outbound(atCase(index + 1)));
    expect(read).toEqual(YOUR_OUTBOUND_BY_CASE.map((line, index) => (index + 1 === CASE_WITHOUT_YOUR_LAPTOP ? undefined : [line])));
    const kept = atCase(CASE_WITHOUT_YOUR_LAPTOP).world.firewalls.find((firewall) => firewall.id === FIREWALL.you)?.outbound.map((rule) => rule.peer);
    expect(kept).toEqual([{ kind: 'cidr', cidr: ANY_IPV4 }]);
  });

  it('01-14: the routers the traceroute of case 5 crosses are in the list of shown pieces of that case, and case 5 is the only case that offers a traceroute', () => {
    const { cases } = watchOf().diagnose;
    const shown = cases[4].shown ?? [];
    const crossed = routersCrossedByTraceroutes(cases[4], caseWorlds()[4]);
    expect(crossed).toEqual([ROUTER.office.id, ROUTER.provider.id]);
    expect(crossed.filter((id) => !shown.includes(id))).toEqual([]);
    expect(cases.filter((spec) => spec.send.message.some((chip) => chip.command === 'traceroute')).map((spec) => spec.id)).toEqual(['case-5']);
  });

  it('01-14: introduces no term, uses none that is later, and says nothing of a firewall closing its outbound side by default', () => {
    expect(watchOf().introduces).toEqual([]);
    expect(watchTexts().filter((text) => BY_DEFAULT.test(text) || GENERAL_RULE_OF_FIREWALLS.test(text))).toEqual([]);
    const shown = Array.from({ length: WATCH_CASES }, (_, index) => everythingShown(allTests(atCase(index + 1)))).flat();
    expect(shown.filter((text) => BY_DEFAULT.test(text) || GENERAL_RULE_OF_FIREWALLS.test(text) || NOT_NETWORK_JARGON.test(text) || NAT_WORDS.test(text))).toEqual([]);
  });

  it('01-14: only chapters 2, 3 and 4 come after it, and the bridge of 04-01 is empty now that the fourteen introduce every term of the chapter', () => {
    const ids = INCIDENTS.map((incident) => incident.id);
    const chapter2 = INCIDENTS.filter((incident) => incident.chapter === 2).map((incident) => incident.id);
    const chapter3 = INCIDENTS.filter((incident) => incident.chapter === 3).map((incident) => incident.id);
    expect(ids.indexOf(FINAL_WATCH)).toBe(ids.indexOf(IN_AND_OUT) + 1);
    expect(ids.slice(ids.indexOf(FINAL_WATCH) + 1)).toEqual([...chapter2, ...chapter3, '04-01', '04-02']);
    expect(INCIDENTS.filter((incident) => incident.chapter === 1)).toHaveLength(CHAPTER_1_INCIDENTS);
  });
});

describe('the changes to the world that chapter 1 explains', () => {
  const plainReport = (id: string) => toPlainText(incidentOf(id).report);
  const rightFeedback = (id: string) => toPlainText(guidedOf(id).explanation.find((option) => option.correct)?.feedback ?? '');

  it('01-06: the report says in plain words that every device of both floors sends to router-oficina what goes to another local network, and uses no term of 01-07', () => {
    expect(plainReport(YOUR_NETWORK)).toContain(EVERY_DEVICE_SENDS_TO_THE_ROUTER);
    expect(termsIn(incidentOf(YOUR_NETWORK).report)).not.toContain('default-gateway');
  });

  it('01-08: the report says that someone changed the configuration of router-oficina so that it sends everything outside the office towards internet', () => {
    expect(plainReport(THE_NETWORK_OF_NETWORKS)).toContain(THE_OFFICE_ROUTER_SENDS_OUT);
  });

  it('01-10: the right explanation says that someone changed the configuration of router-proveedor, which no longer knows where to send what goes to the server and does not warn', () => {
    expect(rightFeedback(SEEING_THE_PATH)).toContain(THE_PROVIDER_ROUTER_DOES_NOT_KNOW_THE_WAY);
  });

  it('01-14: the report says that the provider fixed the broken stretch and router-proveedor went back to its earlier configuration, and the repair is one of its own changes', () => {
    expect(plainReport(FINAL_WATCH)).toContain(THE_PROVIDER_FIXED_THE_STRETCH);
    expect(watchOf().changes).toEqual(expect.arrayContaining(REPAIRED_STRETCH));
    expect(providerOf(solvedWorld(INCIDENTS, IN_AND_OUT))).toEqual(providerOf(solvedWorld(INCIDENTS, SEEING_THE_PATH)));
    expect(providerOf(startWorld(INCIDENTS, FINAL_WATCH))).toEqual(providerOf(startWorld(INCIDENTS, THE_NETWORK_OF_NETWORKS)));
  });

  it('01-14: the report says that someone changed the firewall of tu-laptop to let everything out, and the right cause of case 7 says that someone took that rule away', () => {
    expect(plainReport(FINAL_WATCH)).toContain(YOUR_FIREWALL_LETS_EVERYTHING_OUT);
    const right = watchOf().diagnose.cases[CLOSED_CASE - 1].cause.options.find((option) => option.correct);
    expect(toPlainText(right?.feedback ?? '')).toContain(SOMEONE_TOOK_THE_OPEN_RULE_AWAY);
  });

  it('no text of chapter 1 names your laptop with words, as «tu laptop», instead of its name tag', () => {
    const texts = INCIDENTS.filter((incident) => incident.chapter === 1).flatMap((incident) => incidentTexts(incident).map((text) => toPlainText(text)));
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.filter((text) => YOUR_LAPTOP_IN_WORDS.test(text))).toEqual([]);
  });

  it('no text of 01-06, 01-08, 01-10, 01-11 or 01-14 says that a router got confused, and none says ruta or tabla, which chapter 2 teaches', () => {
    const texts = [YOUR_NETWORK, THE_NETWORK_OF_NETWORKS, SEEING_THE_PATH, THE_GUARD, FINAL_WATCH].flatMap((id) => incidentTexts(incidentOf(id)).map((text) => toPlainText(text)));
    expect(texts.filter((text) => A_ROUTER_THAT_IS_CONFUSED_OR_A_ROUTE.test(text))).toEqual([]);
  });
});

describe('the question of a lookup by name', () => {
  it('no trace of chapter 1 carries a question', () => {
    const worlds = chapter1Worlds();
    const traces = worlds.flatMap(({ world, packets }) => [...packets.map((packet) => simulate(world, packet)), ...simulateSequence(world, packets.map((packet) => ({ packet, at: 0 })))]);
    expect(traces.length).toBeGreaterThan(0);
    expect(traces.some((trace) => trace.outcome === 'replied')).toBe(true);
    for (const trace of traces) expect(trace).not.toHaveProperty('question');
  });
});
