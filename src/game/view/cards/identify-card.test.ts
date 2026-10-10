import { describe, expect, it } from 'vitest';
import type { TraySpec } from '@/levels';
import { NOTE_RULE, identifyIncident, sendIncident } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { identifyCard, identifyPieces } from './identify-card';

const INCIDENT = identifyIncident();
const START = startSession([INCIDENT], INCIDENT.id);
const PRINTER = PIECE_ID.device('printer');
const GUEST = PIECE_ID.device('guest-laptop');
const NOTE_FEEDBACK = 'No es IPv4: cada uno de los cuatro números va de 0 a 255.';

function cardOf(pieceId: string, session = START) {
  const card = identifyCard(session, pieceId);
  if (!card) throw new Error(`no card for ${pieceId}`);
  return card;
}

describe('identify card', () => {
  it('lists the trays of the device, the answer saved from the start and the lines each chip shows on Listo', () => {
    expect(cardOf(PRINTER)).toEqual({
      deviceId: 'printer',
      entity: { kind: 'device', variant: 'printer' },
      title: '[[impresora]]',
      question: '¿Cuál es su dirección IP?',
      trays: [
        {
          id: 'ip',
          name: 'Dirección IP',
          segmented: false,
          saved: 'note',
          chips: [
            { id: 'right', label: '192.168.1.21', correct: true, lines: ['Correcto.', NOTE_RULE] },
            { id: 'note', label: '192.168.1.300', correct: false, lines: [NOTE_FEEDBACK] },
            { id: 'marta', label: '192.168.1.12', correct: false, lines: ['Esa es la IP de laptop-marta, que se ve en su caja.', NOTE_RULE] },
          ],
        },
      ],
    });
  });

  it('has no question when the card has none, and saves nothing for a tray that starts with no pick', () => {
    const guest = cardOf(GUEST);
    expect(guest.question).toBeNull();
    expect(guest.title).toBe('[[laptop-visita]]');
    expect(guest.trays.map((tray) => [tray.id, tray.saved])).toEqual([['in-network', null]]);
  });

  it('adds the rule of the initial pick to the lines of a chip that is not the initial one, and only to those', () => {
    const lines = Object.fromEntries(cardOf(PRINTER).trays[0].chips.map((chip) => [chip.id, chip.lines]));
    expect(lines.note).not.toContain(NOTE_RULE);
    expect(lines.right).toEqual(['Correcto.', NOTE_RULE]);
    expect(lines.marta.at(-1)).toBe(NOTE_RULE);
    const [guestTray] = cardOf(GUEST).trays;
    expect(guestTray.chips.flatMap((chip) => chip.lines)).not.toContain(NOTE_RULE);
  });

  it('gives a chip with no feedback only the rule, and a chip with neither no lines at all', () => {
    const withPrinterTray = (change: (tray: TraySpec) => TraySpec): Session => {
      const [guest, printer] = INCIDENT.identify.cards;
      const incident = { ...INCIDENT, identify: { cards: [guest, { ...printer, trays: printer.trays.map(change) }] } };
      return startSession([incident], incident.id);
    };
    const bare = (tray: TraySpec): TraySpec => ({ ...tray, chips: tray.chips.map(({ id, label }) => ({ id, label })) });
    const linesOfPrinter = (session: Session) => cardOf(PRINTER, session).trays[0].chips.map((chip) => chip.lines);
    expect(linesOfPrinter(withPrinterTray(bare))).toEqual([[NOTE_RULE], [], [NOTE_RULE]]);
    expect(linesOfPrinter(withPrinterTray((tray) => ({ ...bare(tray), initialPickRule: undefined })))).toEqual([[], [], []]);
  });

  it('lists a tray marked segmented as segmented', () => {
    expect(cardOf(GUEST).trays.map((tray) => tray.segmented)).toEqual([true]);
    expect(cardOf(PRINTER).trays.map((tray) => tray.segmented)).toEqual([false]);
  });

  it('marks as correct the chip a task expects, and no other', () => {
    expect(cardOf(PRINTER).trays[0].chips.filter((chip) => chip.correct).map((chip) => chip.id)).toEqual(['right']);
    expect(cardOf(GUEST).trays[0].chips.filter((chip) => chip.correct).map((chip) => chip.id)).toEqual(['no']);
  });

  it('saves the answer the player confirmed, tray by tray', () => {
    const answered = sessionReducer(START, { type: 'answerCard', deviceId: 'printer', picks: { ip: 'right' } });
    expect(cardOf(PRINTER, answered).trays[0].saved).toBe('right');
    expect(cardOf(PRINTER, START).trays[0].saved).toBe('note');
  });

  it('opens from the piece of a device with a card, and from no other piece or incident', () => {
    expect(identifyPieces(START)).toEqual([GUEST, PRINTER]);
    expect(identifyCard(START, PIECE_ID.device('your-laptop'))).toBeNull();
    expect(identifyCard(START, 'edge')).toBeNull();
    const sending = sendIncident();
    expect(identifyPieces(startSession([sending], sending.id))).toEqual([]);
    expect(identifyCard(startSession([sending], sending.id), PIECE_ID.device('your-laptop'))).toBeNull();
  });
});
