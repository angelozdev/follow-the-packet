// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TERMS } from '@/copy';
import { GRACE_MS } from './use-floating-box';
import { TermTip } from './term-tip';

const SECURITY_GROUP = TERMS['security-group'];
const BEFORE_THE_GRACE_ENDS_MS = GRACE_MS / 4;
const AFTER_THE_GRACE_ENDS_MS = GRACE_MS * 2;

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function crossPointer(from: Element, to: Element) {
  act(() => {
    from.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: to }));
    to.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, relatedTarget: from }));
  });
}

describe('TermTip', () => {
  afterEach(() => vi.useRealTimers());

  function setup(children = <TermTip id="security-group">{SECURITY_GROUP.name}</TermTip>) {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <>
        {children}
        <p>Outside</p>
      </>,
    );
    return { user, term: screen.getByText(SECURITY_GROUP.name) };
  }

  it('a term definition stays while the pointer moves onto it, a click pins it and Escape closes it', async () => {
    const { user, term } = setup();
    await user.hover(term);
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent(`${SECURITY_GROUP.name}: ${SECURITY_GROUP.definition}`);
    await user.unhover(term);
    await user.hover(tip);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.unhover(tip);
    expect(screen.queryByRole('tooltip')).toBeNull();

    await user.click(term);
    await user.unhover(term);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('a pointer that goes from the definition back onto its term keeps it, and leaving the term closes it after the grace', async () => {
    const { user, term } = setup();
    const outside = screen.getByText('Outside');
    await user.hover(term);
    const tip = screen.getByRole('tooltip');
    crossPointer(term, tip);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    crossPointer(tip, term);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    crossPointer(term, outside);
    wait(BEFORE_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('a pinned definition goes with a pointerdown outside the term and the definition, and not inside them', async () => {
    const { user, term } = setup();
    await user.click(term);
    await user.click(screen.getByRole('tooltip'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('a tap on the term pins its definition, and the term is no Tab stop', async () => {
    const { user, term } = setup();
    await user.pointer({ keys: '[TouchA>]', target: term });
    expect(screen.queryByRole('tooltip')).toBeNull();
    await user.pointer({ keys: '[/TouchA]', target: term });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.tab();
    expect(term).not.toHaveFocus();
  });

  it('a term inside a button previews on hover and neither pins on a click nor passes the clicks of its definition to the button', async () => {
    const onPick = vi.fn();
    const { user, term } = setup(
      <button type="button" onClick={onPick}>
        <TermTip id="security-group">{SECURITY_GROUP.name}</TermTip>
      </button>,
    );
    await user.hover(term);
    const tip = screen.getByRole('tooltip');
    await user.click(tip);
    expect(onPick).not.toHaveBeenCalled();
    await user.unhover(tip);
    await user.click(term);
    expect(onPick).toHaveBeenCalledTimes(1);
    await user.unhover(term);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
