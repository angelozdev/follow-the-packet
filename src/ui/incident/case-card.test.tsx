// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { CASE_TEXT, EXPLANATION_TEXT, RESULT_TEXT, toPlainText } from '@/copy';
import { caseCard, caseSummary, sessionReducer, startSession, starsOf, type SessionAction } from '@/game';
import { diagnoseIncident } from '@/testing/incidents';
import { CaseCard } from './case-card';
import { ResultCard } from './result-card';

const DIAGNOSE = diagnoseIncident();
const { cases } = DIAGNOSE.diagnose;
const rightIndex = (number: number) => cases[number - 1].cause.options.findIndex((option) => option.correct);
const wrongIndex = (number: number) => cases[number - 1].cause.options.findIndex((option) => !option.correct);
const named = (index: number): SessionAction => ({ type: 'nameCause', index });
const NEXT: SessionAction = { type: 'nextCase' };
const KNOW = CASE_TEXT.know;
const optionText = (number: number, index: number) => toPlainText(cases[number - 1].cause.options[index].text);

function Harness({ actions = [] }: { actions?: SessionAction[] }) {
  const [session, dispatch] = useReducer(sessionReducer, actions, (initial) => initial.reduce(sessionReducer, startSession([DIAGNOSE], DIAGNOSE.id)));
  const card = caseCard(session);
  return (
    <>
      {card && <CaseCard key={card.number} card={card} onNameCause={(index) => dispatch(named(index))} onNext={() => dispatch(NEXT)} onShowResult={() => dispatch({ type: 'showResult' })} />}
      <output data-testid="phase">{session.phase}</output>
    </>
  );
}

describe('the case card', () => {
  it('a case asks one question', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const question = toPlainText(EXPLANATION_TEXT.asks(cases[0].cause.question));
    expect(screen.queryByText(question)).toBeNull();
    expect(screen.getAllByRole('list')).toHaveLength(1);
    expect(screen.getByRole('region')).toHaveTextContent(toPlainText(CASE_TEXT.says(cases[0].report)));
    await user.click(screen.getByRole('button', { name: KNOW }));
    expect(screen.getAllByText(question)).toHaveLength(1);
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getByText(question)).toHaveFocus();
    expect(screen.queryByRole('button', { name: KNOW })).toBeNull();
    const options = within(screen.getByText(question).parentElement as HTMLElement).getAllByRole('button');
    expect(options.map((option) => option.textContent)).toEqual(cases[0].cause.options.map((option) => toPlainText(option.text)));
    expect(options.every((option) => option.getAttribute('aria-pressed') === 'false')).toBe(true);
    await user.click(screen.getByRole('button', { name: optionText(1, wrongIndex(1)) }));
    expect(screen.getAllByText(question)).toHaveLength(1);
  });

  it('shows the report and the tests the origin can send, each ticked once sent', () => {
    render(<Harness actions={[{ type: 'sendPacket', fromId: 'origin', toId: 'own', messageId: 'ping' }]} />);
    expect(screen.getByRole('heading', { name: CASE_TEXT.title(1, cases.length) })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Pruebas que puedes enviar desde tu-laptop/ })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '☐ ping 127.0.0.1 (sin enviar)',
      '✓ ping 192.168.1.10 (enviada)',
      '☐ ping 192.168.1.1 (sin enviar)',
      '☐ ping 198.51.100.50 (sin enviar)',
    ]);
  });

  it('a wrong cause shows its feedback and leaves the others to try', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: KNOW }));
    const wrong = screen.getByRole('button', { name: optionText(1, wrongIndex(1)) });
    await user.click(wrong);
    expect(wrong).toBeDisabled();
    expect(screen.getByText(EXPLANATION_TEXT.wrong).closest('p')).toHaveTextContent(toPlainText(cases[0].cause.options[wrongIndex(1)].feedback));
    expect(screen.queryByText(EXPLANATION_TEXT.right)).toBeNull();
    expect(screen.queryByRole('button', { name: CASE_TEXT.next })).toBeNull();
    expect(screen.getByRole('button', { name: optionText(1, rightIndex(1)) })).toBeEnabled();
    expect(screen.getByTestId('phase')).toHaveTextContent('playing');
  });

  it('the right cause shows its feedback, locks the options and offers the next case, whose question starts closed', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: KNOW }));
    await user.click(screen.getByRole('button', { name: optionText(1, rightIndex(1)) }));
    expect(screen.getByText(EXPLANATION_TEXT.right).closest('p')).toHaveTextContent(toPlainText(cases[0].cause.options[rightIndex(1)].feedback));
    expect(screen.getAllByRole('button').filter((button) => button.classList.contains('option')).every((button) => button.hasAttribute('disabled'))).toBe(true);
    expect(screen.getByRole('button', { name: CASE_TEXT.next })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: CASE_TEXT.next }));
    expect(screen.getByRole('heading', { name: CASE_TEXT.title(2, cases.length) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: KNOW })).toBeInTheDocument();
    expect(screen.queryByText(EXPLANATION_TEXT.right)).toBeNull();
  });

  it('a wrong cause shows its feedback as an error message that starts with No es eso and the right one as a success message that starts with Correcto', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: KNOW }));
    await user.click(screen.getByRole('button', { name: optionText(1, wrongIndex(1)) }));
    const wrong = screen.getByText(EXPLANATION_TEXT.wrong).closest('p');
    expect(wrong).toHaveClass('message message--error', { exact: true });
    expect(wrong?.querySelector('.message__tab')).toHaveTextContent('✕ Error');
    expect(wrong?.querySelector('strong')?.textContent).toBe(EXPLANATION_TEXT.wrong);
    await user.click(screen.getByRole('button', { name: optionText(1, rightIndex(1)) }));
    const right = screen.getByText(EXPLANATION_TEXT.right).closest('p');
    expect(right).toHaveClass('message message--success', { exact: true });
    expect(right?.querySelector('.message__tab')).toHaveTextContent('✓ Correcto');
    expect(right?.querySelector('strong')?.textContent).toBe(EXPLANATION_TEXT.right);
  });

  it('after the last case it offers the result and no next case', async () => {
    const user = userEvent.setup();
    const beforeLast = cases.slice(0, -1).flatMap((_, index) => [named(rightIndex(index + 1)), NEXT]);
    render(<Harness actions={beforeLast} />);
    expect(screen.getByRole('heading', { name: CASE_TEXT.title(cases.length, cases.length) })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: KNOW }));
    await user.click(screen.getByRole('button', { name: optionText(cases.length, rightIndex(cases.length)) }));
    expect(screen.queryByRole('button', { name: CASE_TEXT.next })).toBeNull();
    await user.click(screen.getByRole('button', { name: EXPLANATION_TEXT.seeResult }));
    expect(screen.getByTestId('phase')).toHaveTextContent('result');
  });
});

describe('the result card of a diagnose', () => {
  const closeCases = (wrongFirst: number[]): SessionAction[] =>
    cases.flatMap((_, index) => [...(wrongFirst.includes(index + 1) ? [named(wrongIndex(index + 1))] : []), named(rightIndex(index + 1)), ...(index < cases.length - 1 ? [NEXT] : [])]);
  const resultOf = (wrongFirst: number[]) => {
    const session = closeCases(wrongFirst).reduce(sessionReducer, startSession([DIAGNOSE], DIAGNOSE.id));
    return render(<ResultCard stars={starsOf(session)} mechanic="diagnose" takeaway="Una idea." nextId={null} cases={caseSummary(session)} />);
  };

  it('the result card tells which cases failed the first time', () => {
    resultOf([2, 5]);
    expect(screen.getByRole('heading', { name: RESULT_TEXT.cases.title })).toBeInTheDocument();
    expect(screen.getByText('No acertaste a la primera los casos 2 y 5.')).toBeInTheDocument();
    expect(screen.queryByText(RESULT_TEXT.cases.allFirstTry(cases.length))).toBeNull();
  });

  it('names a single case in the singular, and three with commas and a y', () => {
    resultOf([4]);
    expect(screen.getByText('No acertaste a la primera el caso 4.')).toBeInTheDocument();
  });

  it('lists three cases with commas and a y', () => {
    resultOf([1, 3, 7]);
    expect(screen.getByText('No acertaste a la primera los casos 1, 3 y 7.')).toBeInTheDocument();
  });

  it('says so when every case was right at the first try, with the three stars worded for the cases', () => {
    resultOf([]);
    expect(screen.getByText(RESULT_TEXT.cases.allFirstTry(cases.length))).toBeInTheDocument();
    expect(screen.getByText(RESULT_TEXT.cases.stars.closed, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(RESULT_TEXT.cases.stars.middle, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(RESULT_TEXT.cases.stars.explained, { exact: false })).toBeInTheDocument();
  });

  it('marks the explained star as missed when a case failed the first time', () => {
    resultOf([6]);
    expect(screen.getByText(RESULT_TEXT.cases.stars.explained, { exact: false })).toHaveTextContent(RESULT_TEXT.missed);
    expect(screen.getByText(RESULT_TEXT.cases.stars.closed, { exact: false })).toHaveTextContent(RESULT_TEXT.earned);
  });
});
