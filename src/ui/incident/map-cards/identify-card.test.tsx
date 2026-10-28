// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useReducer, useState, type Dispatch } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT } from '@/copy';
import { inspect, sessionReducer, startSession, taskHolds, type Session, type SessionAction } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { NOTE_RULE, identifyIncident } from '@/testing/incidents';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';

const INCIDENT = identifyIncident();
const START = startSession([INCIDENT], INCIDENT.id);
const PRINTER = PIECE_ID.device('printer');
const NOTE = '192.168.1.300';
const RIGHT = '192.168.1.21';
const OTHER = '192.168.1.12';
const NOTE_FEEDBACK = 'No es IPv4: cada uno de los cuatro números va de 0 a 255.';
const SUCCESS = `Correcto. ${NOTE_RULE}`;
const OTHER_FEEDBACK = `Esa es la IP de laptop-marta, que se ve en su caja. ${NOTE_RULE}`;
const LISTO = TASK_CARD_TEXT.done;
const PATHS = [
  [NOTE, NOTE_FEEDBACK, 'open'],
  [RIGHT, SUCCESS, 'done'],
  [OTHER, OTHER_FEEDBACK, 'open'],
] as const;

const panelFor = (session: Session, pieceId: string | null, dispatch: Dispatch<SessionAction> = vi.fn(), onClose: () => void = vi.fn()) => <ShellPanel session={session} dispatch={dispatch} inspection={pieceId === null ? null : inspect(session, pieceId)} pieceId={pieceId} heading={createRef()} onClose={onClose} onChoose={vi.fn()} />;

function renderCard(pieceId = PRINTER) {
  const spies = { dispatch: vi.fn(), onClose: vi.fn() };
  render(panelFor(START, pieceId, spies.dispatch, spies.onClose));
  return spies;
}

function ReopeningPrinter() {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([INCIDENT], INCIDENT.id));
  const [chosen, choose] = useState<string | null>(PRINTER);
  const printerTask = INCIDENT.tasks[1];
  return (
    <>
      <span data-testid="saved">{session.answers.printer?.ip}</span>
      <span data-testid="printer-task">{taskHolds(printerTask, session.runs, session.sent, session.answers) ? 'done' : 'open'}</span>
      <button type="button" onClick={() => choose(null)}>
        away
      </button>
      <button type="button" onClick={() => choose(PRINTER)}>
        reopen
      </button>
      {panelFor(session, chosen, dispatch, () => choose(null))}
    </>
  );
}

const chip = (name: string) => screen.getByRole('button', { name });
const pressed = (name: string) => chip(name).getAttribute('aria-pressed');

describe('identify card', () => {
  it('shows the trays of the device and reports the picks only when Listo is pressed', async () => {
    const user = userEvent.setup();
    const { dispatch, onClose } = renderCard(PIECE_ID.device('guest-laptop'));
    expect(screen.getByRole('region', { name: 'laptop-visita' })).toBeInTheDocument();
    expect(screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual(['¿Está en la red?']);
    await user.click(chip('No'));
    expect(pressed('No')).toBe('true');
    expect(dispatch).not.toHaveBeenCalled();
    await user.click(chip(LISTO));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'answerCard', deviceId: 'guest-laptop', picks: { 'in-network': 'no' } });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the question of the card and draws a yes or no as one segmented pill', () => {
    renderCard();
    expect(screen.getByRole('region', { name: 'impresora' })).toHaveTextContent('¿Cuál es su dirección IP?');
    expect(screen.getByRole('group', { name: 'Dirección IP' })).not.toHaveClass('tray--segmented');
    renderCard(PIECE_ID.device('guest-laptop'));
    expect(screen.getByRole('group', { name: '¿Está en la red?' })).toHaveClass('tray--segmented');
  });

  it('a tray starts with the chip already picked and announces it as pressed', () => {
    renderCard();
    expect(pressed(NOTE)).toBe('true');
    expect(pressed(RIGHT)).toBe('false');
    expect(pressed(OTHER)).toBe('false');
  });

  it('shows no feedback line when a chip is picked, only after pressing Listo', async () => {
    const user = userEvent.setup();
    renderCard();
    expect(screen.queryByText(NOTE_FEEDBACK)).toBeNull();
    await user.click(chip(RIGHT));
    expect(screen.queryByText(/Correcto/)).toBeNull();
    expect(screen.queryByText(NOTE_FEEDBACK)).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    await user.click(chip(LISTO));
    expect(screen.getByRole('status')).toHaveTextContent(SUCCESS);
  });

  it('pressing Listo with the wrong IP picked shows its feedback and leaves the task open', async () => {
    const user = userEvent.setup();
    render(<ReopeningPrinter />);
    await user.click(chip(LISTO));
    expect(screen.getByRole('status')).toHaveTextContent(NOTE_FEEDBACK);
    expect(screen.getByRole('status')).not.toHaveTextContent(NOTE_RULE);
    expect(screen.getByRole('region', { name: 'impresora' })).toBeInTheDocument();
    expect(pressed(NOTE)).toBe('true');
    expect(screen.getByTestId('printer-task')).toHaveTextContent('open');
    expect(screen.getByTestId('saved')).toHaveTextContent('note');
  });

  it('the rule of the note shows on Listo in the three paths: the note\'s IP kept, the right IP, and the other valid IP', async () => {
    const user = userEvent.setup();
    render(<ReopeningPrinter />);
    for (const [ip, line, task] of PATHS) {
      await user.click(chip(ip));
      await user.click(chip(LISTO));
      expect(screen.getByRole('status')).toHaveTextContent(line);
      expect(screen.getByTestId('printer-task')).toHaveTextContent(task);
      expect(screen.getByRole('region', { name: 'impresora' })).toBeInTheDocument();
    }
  });

  it('writes the line of a right chip as a success message and the line of a wrong chip as an error', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(chip(LISTO));
    expect(screen.getByRole('status')).toHaveClass('message', 'message--error');
    await user.click(chip(RIGHT));
    await user.click(chip(LISTO));
    expect(screen.getByRole('status')).toHaveClass('message', 'message--success');
    expect(screen.getByRole('status')).not.toHaveClass('message--error');
  });

  it('a wrong chip shows its lines as an error message and a right one as a success message', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(chip(LISTO));
    const wrong = screen.getByRole('status');
    expect(wrong.tagName).toBe('P');
    expect(wrong).toHaveClass('message message--error', { exact: true });
    expect(wrong.querySelector('.message__tab')).toHaveTextContent('✕ Error');
    expect(wrong).toHaveTextContent(NOTE_FEEDBACK);
    await user.click(chip(RIGHT));
    await user.click(chip(LISTO));
    const right = screen.getByRole('status');
    expect(right).toHaveClass('message message--success', { exact: true });
    expect(right.querySelector('.message__tab')).toHaveTextContent('✓ Correcto');
    expect(right).toHaveTextContent(SUCCESS);
  });

  it('a pick counts only after Listo, and the pick stays as a draft when the panel goes away and comes back', async () => {
    const user = userEvent.setup();
    render(<ReopeningPrinter />);
    expect(screen.getByTestId('saved')).toHaveTextContent('note');
    await user.click(chip(RIGHT));
    expect(screen.getByTestId('saved')).toHaveTextContent('note');
    expect(screen.getByTestId('printer-task')).toHaveTextContent('open');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('region', { name: 'impresora' }), 'Escape closes nothing').toBeInTheDocument();
    await user.click(chip('away'));
    expect(screen.queryByRole('region', { name: 'impresora' })).toBeNull();
    expect(screen.getByTestId('saved')).toHaveTextContent('note');
    expect(screen.getByTestId('printer-task')).toHaveTextContent('open');
    await user.click(chip('reopen'));
    expect(pressed(RIGHT)).toBe('true');
    expect(pressed(NOTE)).toBe('false');
    expect(screen.getByTestId('saved')).toHaveTextContent('note');

    await user.click(chip(LISTO));
    expect(screen.getByTestId('saved')).toHaveTextContent('right');
    expect(screen.getByTestId('printer-task')).toHaveTextContent('done');
    expect(screen.getByRole('status')).toHaveTextContent(SUCCESS);
  });

  it('reopens showing the answer confirmed with Listo', async () => {
    const user = userEvent.setup();
    render(<ReopeningPrinter />);
    await user.click(chip(RIGHT));
    await user.click(chip(LISTO));
    await user.click(chip(LISTO));
    expect(screen.queryByRole('region', { name: 'impresora' })).toBeNull();
    await user.click(chip('reopen'));
    expect(pressed(RIGHT)).toBe('true');
    expect(pressed(NOTE)).toBe('false');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('pressing Listo with a chip that has no feedback closes the card', async () => {
    const user = userEvent.setup();
    const { dispatch, onClose } = renderCard(PIECE_ID.device('guest-laptop'));
    await user.click(chip('No'));
    await user.click(chip(LISTO));
    expect(screen.queryByRole('status')).toBeNull();
    expect(dispatch).toHaveBeenCalledWith({ type: 'answerCard', deviceId: 'guest-laptop', picks: { 'in-network': 'no' } });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('pressing Listo with a chip that has feedback keeps the card open', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard(PIECE_ID.device('guest-laptop'));
    await user.click(chip('Sí'));
    await user.click(chip(LISTO));
    expect(screen.getByRole('status')).toHaveTextContent('Está conectada: tiene IP y está en la red.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('pressing Listo again with the lines showing closes the card', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard();
    await user.click(chip(LISTO));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(chip(LISTO));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('picking another chip hides the feedback line', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(chip(LISTO));
    expect(screen.getByRole('status')).toBeInTheDocument();
    await user.click(chip(OTHER));
    expect(screen.queryByRole('status')).toBeNull();
    await user.click(chip(LISTO));
    expect(screen.getByRole('status')).toHaveTextContent(OTHER_FEEDBACK);
  });

  it('picking the chip that is already picked keeps the feedback line, so the next Listo closes the card', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard();
    await user.click(chip(LISTO));
    await user.click(chip(NOTE));
    expect(screen.getByRole('status')).toHaveTextContent(NOTE_FEEDBACK);
    await user.click(chip(LISTO));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('Escape closes nothing, not even when the chip picked has a feedback line', async () => {
    const user = userEvent.setup();
    const { dispatch, onClose } = renderCard();
    await user.click(chip(LISTO));
    expect(screen.getByRole('status')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('picks and confirms with the keyboard', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderCard(PIECE_ID.device('guest-laptop'));
    chip('Sí').focus();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(pressed('No')).toBe('true');
    await user.tab();
    expect(chip(LISTO)).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(dispatch).toHaveBeenCalledWith({ type: 'answerCard', deviceId: 'guest-laptop', picks: { 'in-network': 'no' } });
  });
});
