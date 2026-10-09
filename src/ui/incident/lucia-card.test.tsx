// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, TERMS } from '@/copy';
import { STABLE_MS, sessionReducer, startSession, type SessionAction } from '@/game';
import { INCIDENTS } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { LuciaCard } from './lucia-card';

const FIX: SessionAction = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id };
const WIDE: SessionAction = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id };

function Harness({ incidentId = INCIDENTS[0].id, actions = [] }: { incidentId?: string; actions?: SessionAction[] }) {
  const [session, dispatch] = useReducer(sessionReducer, actions, (initial) => initial.reduce(sessionReducer, startSession(INCIDENTS, incidentId)));
  return <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} />;
}

function glossary(): HTMLElement {
  const details = screen.getByText(LUCIA_TEXT.glossary).closest('details');
  if (!details) throw new Error('missing glossary');
  return details;
}

function newWords(): HTMLElement {
  const list = screen.getByText(LUCIA_TEXT.newTerms).nextElementSibling;
  if (!(list instanceof HTMLElement)) throw new Error('missing new words');
  return list;
}

describe("Lucía's card", () => {
  it('reports the problem and lists the task as pending', () => {
    render(<Harness />);
    expect(screen.getByText(/no logra hacer/)).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent(LUCIA_TEXT.pending);
  });

  it('defines the new terms of the incident', () => {
    render(<Harness />);
    expect(within(newWords()).getByText(TERMS['security-group'].definition)).toBeInTheDocument();
    expect(within(newWords()).getByText(TERMS['inbound-rule'].definition)).toBeInTheDocument();
  });

  it('folds a glossary with every known term, from earlier incidents too, in alphabetical order', () => {
    render(<Harness incidentId="04-02" />);
    const names = [...startSession(INCIDENTS, '04-02').known].map((id) => TERMS[id].name).sort((a, b) => a.localeCompare(b, 'es'));
    expect(glossary()).not.toHaveAttribute('open');
    expect([...glossary().querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual(names);
    expect(within(glossary()).getByText(TERMS['security-group'].definition)).toBeInTheDocument();
  });

  it('the glossary of 04-01 has no term from a later incident', () => {
    render(<Harness />);
    expect(glossary()).not.toHaveTextContent(TERMS['echo-reply'].name);
    expect(glossary()).not.toHaveTextContent(TERMS['least-privilege'].name);
  });

  it('gives hint 1, then hint 2, then no more', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(1)).closest('p')).toHaveTextContent('Mira el Security Group de servidor2: ¿qué deja pasar hoy?');
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(2)).closest('p')).toHaveTextContent('En el Security Group de servidor2, agrega una regla de entrada: ICMP · Echo Request, desde SG servidor1.');
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

  it('marks the task done once it holds for 3 seconds', () => {
    render(<Harness actions={[FIX, { type: 'tick', ms: STABLE_MS }]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent(LUCIA_TEXT.done);
  });
});
