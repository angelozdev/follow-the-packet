// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { LUCIA_TEXT, TERMS } from '@/copy';
import { STABLE_MS, sessionReducer, startSession, type SessionAction } from '@/game';
import { INCIDENTS } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { LuciaCard } from './lucia-card';

const FIX: SessionAction = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.servidor1.id };
const WIDE: SessionAction = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.internet.id };

function Harness({ actions = [] }: { actions?: SessionAction[] }) {
  const [session, dispatch] = useReducer(sessionReducer, actions, (initial) => initial.reduce(sessionReducer, startSession(INCIDENTS, INCIDENTS[0].id)));
  return <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} />;
}

describe("Lucía's card", () => {
  it('reports the problem and lists the task as pending', () => {
    render(<Harness />);
    expect(screen.getByText(/no logra hacer/)).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent(LUCIA_TEXT.pending);
  });

  it('defines the new terms of the incident', () => {
    render(<Harness />);
    expect(screen.getByText(TERMS['security-group'].definition)).toBeInTheDocument();
    expect(screen.getByText(TERMS.rule.definition)).toBeInTheDocument();
  });

  it('gives hint 1, then hint 2, then no more', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(1)).closest('p')).toHaveTextContent('Mira la puerta de servidor2: ¿qué deja pasar hoy?');
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.askHint }));
    expect(screen.getByText(LUCIA_TEXT.hint(2)).closest('p')).toHaveTextContent('En la puerta de servidor2, agrega: Ping, desde servidor1.');
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
    await user.tab();
    const button = screen.getByRole('button', { name: LUCIA_TEXT.askHint });
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
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
