// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, TERMS, toPlainText, type TermId } from '@/copy';
import { sessionReducer, startSession, type SessionAction } from '@/game';
import { INCIDENTS } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident } from '@/testing/incidents';
import { LuciaCard } from './lucia-card';

const FIRST = filterIncident('04-01');
const FIX: SessionAction = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id };
const WIDE: SessionAction = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id };
const SUBMIT: SessionAction = { type: 'submit' };
const NOT_YET = toPlainText(LUCIA_TEXT.failing(FIRST.tasks[0].text));

function Harness({ incidentId = FIRST.id, actions = [] }: { incidentId?: string; actions?: SessionAction[] }) {
  const [session, dispatch] = useReducer(sessionReducer, actions, (initial) => initial.reduce(sessionReducer, startSession(INCIDENTS, incidentId)));
  return <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} onSubmit={() => dispatch(SUBMIT)} />;
}

function usesOf(container: HTMLElement, id: TermId): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('.term')].filter((term) => term.textContent === TERMS[id].name && !term.closest('.lucia__glossary'));
}

describe("Lucía's card", () => {
  it('reports the problem and lists the task as pending', () => {
    render(<Harness />);
    expect(screen.getByText(/no logra hacer/)).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent(LUCIA_TEXT.pending);
  });

  it('marks the task done as soon as it holds, with no wait', () => {
    render(<Harness actions={[FIX]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent(LUCIA_TEXT.done);
  });

  it('the card of Lucía holds no glossary', () => {
    const { container } = render(<Harness />);
    expect(screen.queryByText(LUCIA_TEXT.glossary)).toBeNull();
    expect(container.querySelector('dl')).toBeNull();
    expect(container.querySelector('details')).toBeNull();
  });

  it('marks a new term once on the card, at its first appearance, however often the report and the tasks use it', () => {
    const { container } = render(<Harness incidentId="01-03" />);
    for (const id of ['ping', 'echo-reply'] as const) {
      const uses = usesOf(container, id);
      expect(uses.length, id).toBeGreaterThan(1);
      expect(uses.filter((use) => use.nextElementSibling?.classList.contains('term__new')), id).toEqual([uses[0]]);
    }
    expect(screen.getByRole('listitem').querySelector('.term__new')).toBeNull();
  });

  it('sending with the task failing: Lucía says which one, and the game goes on', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByRole('status')).toHaveTextContent(NOT_YET);
    expect(screen.getByRole('status')).not.toHaveTextContent(LUCIA_TEXT.intruding);
    expect(screen.getByRole('button', { name: LUCIA_TEXT.submit })).toBeInTheDocument();
  });

  it('sending with Anywhere-IPv4 open also says that something forbidden is getting in', async () => {
    const user = userEvent.setup();
    render(<Harness actions={[FIX, WIDE]} />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByRole('status')).toHaveTextContent(NOT_YET);
    expect(screen.getByRole('status')).toHaveTextContent(LUCIA_TEXT.intruding);
  });

  it('sending again repeats the reply as a new message, so it is announced again', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const submit = screen.getByRole('button', { name: LUCIA_TEXT.submit });
    await user.click(submit);
    const status = screen.getByRole('status');
    const firstReply = status.firstElementChild;
    await user.click(submit);
    expect(status.firstElementChild).not.toBe(firstReply);
    expect(status).toHaveTextContent(NOT_YET);
  });

  it('the button and the reply go away once the incident is closed', () => {
    render(<Harness actions={[FIX, SUBMIT]} />);
    expect(screen.queryByRole('button', { name: LUCIA_TEXT.submit })).toBeNull();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('gives hint 1, then hint 2, then no more', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(1)).closest('p')).toHaveTextContent('Mira el Security Group de servidor2: ¿qué deja pasar hoy?');
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(2)).closest('p')).toHaveTextContent(
      'En el Security Group de servidor2, agrega una regla de entrada: ICMP · Echo Request, desde SG servidor1.',
    );
    expect(screen.queryByRole('button', { name: LUCIA_TEXT.askHint })).toBeNull();
  });

  it('announces each hint through an always-mounted polite region', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(region).toHaveTextContent(LUCIA_TEXT.hint(1));
  });

  it('keeps the focus on the button after hint 1, then moves it to the last hint', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const button = screen.getByRole('button', { name: LUCIA_TEXT.askHint });
    await user.click(button);
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    const lastHint = screen.getByText(LUCIA_TEXT.hint(2)).closest('p');
    expect(lastHint).toHaveFocus();
    expect(document.body).not.toHaveFocus();
    expect(screen.getByRole('region', { name: new RegExp(LUCIA_TEXT.name) })).toContainElement(lastHint);
  });

  it('warns when something forbidden gets in', () => {
    render(<Harness actions={[WIDE]} />);
    expect(screen.getByRole('alert')).toHaveTextContent(LUCIA_TEXT.intrusion);
  });

  it('the intrusion alert is an error message and is still announced as an alert', () => {
    render(<Harness actions={[WIDE]} />);
    const alert = screen.getByRole('alert');
    expect(alert.tagName).toBe('P');
    expect(alert).toHaveClass('message message--error', { exact: true });
    expect(alert.querySelector('.message__tab')).toHaveTextContent('✕ Error');
    expect(alert).toHaveTextContent(LUCIA_TEXT.intrusion);
  });

  it('the rejection of a solution shows an error message per failing task and one for an intruder, inside the status region that was already there', async () => {
    const user = userEvent.setup();
    render(<Harness actions={[FIX, WIDE]} />);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(screen.getByRole('status')).toBe(status);
    const replies = Array.from(status.children);
    expect(replies).toHaveLength(FIRST.tasks.length + 1);
    for (const reply of replies) {
      expect(reply.tagName).toBe('P');
      expect(reply).toHaveClass('message message--error', { exact: true });
      expect(reply).not.toHaveAttribute('role');
    }
    expect(replies[0]).toHaveTextContent(NOT_YET);
    expect(replies[1]).toHaveTextContent(LUCIA_TEXT.intruding);
  });
});
