// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GRACE_MS, useFloatingBox } from './use-floating-box';

const BEFORE_THE_GRACE_ENDS_MS = GRACE_MS / 4;
const AFTER_THE_GRACE_ENDS_MS = GRACE_MS * 2;
const BOX_OF_FIRST = 'Box of first';
const BOX_OF_SECOND = 'Box of second';
const PINNED = 'Pinned';

function Harness({ scope = 'test' }: { scope?: string }) {
  const box = useFloatingBox<string>(scope);
  return (
    <div>
      <button type="button" {...box.trigger('first')}>
        First
      </button>
      <button type="button" {...box.trigger('second')}>
        Second
      </button>
      <p>Outside</p>
      {box.shown !== null && (
        <section aria-label={`Box of ${box.shown}`} {...box.box}>
          <button type="button" onClick={box.release}>
            Release
          </button>
          {box.pinned && <span>{PINNED}</span>}
        </section>
      )}
    </div>
  );
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function fakeTimeUser() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

async function hoverTheFirstOfTwoHarnesses(user: ReturnType<typeof userEvent.setup>) {
  const [firstOfLeft, firstOfRight] = screen.getAllByRole('button', { name: 'First' });
  await user.hover(firstOfLeft);
  await user.unhover(firstOfLeft);
  await user.hover(firstOfRight);
  return { firstOfLeft, firstOfRight };
}

describe('useFloatingBox', () => {
  afterEach(() => vi.useRealTimers());

  function setup() {
    const user = fakeTimeUser();
    render(<Harness />);
    return { user, first: screen.getByRole('button', { name: 'First' }), second: screen.getByRole('button', { name: 'Second' }) };
  }

  it('a hover shows the box and leaving the trigger hides it after the grace', async () => {
    const { user, first } = setup();
    expect(screen.queryByRole('region')).toBeNull();
    await user.hover(first);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
    await user.unhover(first);
    wait(BEFORE_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('stays while the pointer is over the box and goes as soon as the pointer leaves it', async () => {
    const { user, first } = setup();
    await user.hover(first);
    await user.unhover(first);
    const box = screen.getByRole('region', { name: BOX_OF_FIRST });
    await user.hover(box);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
    await user.unhover(box);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('gives way at once to the next trigger the pointer reaches', async () => {
    const { user, first, second } = setup();
    await user.hover(first);
    await user.unhover(first);
    await user.hover(second);
    expect(screen.queryByRole('region', { name: BOX_OF_FIRST })).toBeNull();
    expect(screen.getByRole('region', { name: BOX_OF_SECOND })).toBeInTheDocument();
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: BOX_OF_SECOND })).toBeInTheDocument();
  });

  it('a click pins the box: leaving the trigger and hovering another one do not change it', async () => {
    const { user, first, second } = setup();
    await user.click(first);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toHaveTextContent(PINNED);
    expect(first).toHaveAttribute('data-pinned');
    expect(second).not.toHaveAttribute('data-pinned');
    await user.unhover(first);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
    await user.hover(second);
    await user.unhover(second);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: BOX_OF_SECOND })).toBeNull();
    await user.click(second);
    expect(screen.getByRole('region', { name: BOX_OF_SECOND })).toHaveTextContent(PINNED);
    expect(first).not.toHaveAttribute('data-pinned');
  });

  it('Escape, a pointerdown outside and release unpin it', async () => {
    const { user, first } = setup();
    await user.click(first);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region')).toBeNull();
    expect(first).not.toHaveAttribute('data-pinned');
    await user.click(first);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toHaveTextContent(PINNED);
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('region')).toBeNull();
    await user.click(first);
    await user.click(screen.getByRole('button', { name: 'Release' }));
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('a pointerdown inside the box or on the trigger that pinned it keeps it', async () => {
    const { user, first } = setup();
    await user.click(first);
    await user.click(first);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toHaveTextContent(PINNED);
    await user.click(screen.getByRole('region', { name: BOX_OF_FIRST }));
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toHaveTextContent(PINNED);
  });

  it('a pointerdown outside also closes a preview', async () => {
    const { user, first } = setup();
    await user.hover(first);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('Escape closes a preview and the focus that comes back does not reopen it', async () => {
    const { user, first, second } = setup();
    await user.tab();
    expect(first).toHaveFocus();
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region')).toBeNull();
    await user.click(second);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Release' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(second).toHaveFocus();
    expect(screen.queryByRole('region')).toBeNull();
    await user.tab({ shift: true });
    expect(first).toHaveFocus();
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
    await user.tab();
    expect(second).toHaveFocus();
    expect(screen.getByRole('region', { name: BOX_OF_SECOND })).toBeInTheDocument();
  });

  it('release from inside the box gives the focus back to the trigger that pinned it, without reopening', async () => {
    const { user, first } = setup();
    await user.click(first);
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Release' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('region')).toBeNull();
    expect(first).toHaveFocus();
  });

  it('a focus that reaches the trigger right after a release does not reopen the box', async () => {
    const { user, first, second } = setup();
    await user.click(first);
    await user.tab();
    expect(second).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region')).toBeNull();
    await user.tab({ shift: true });
    expect(first).toHaveFocus();
    expect(screen.queryByRole('region')).toBeNull();
    await user.tab();
    await user.tab({ shift: true });
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
  });

  it('a touch pointer shows no preview, and a tap pins', async () => {
    const { user, first } = setup();
    await user.pointer({ keys: '[TouchA>]', target: first });
    expect(screen.queryByRole('region')).toBeNull();
    await user.pointer({ keys: '[/TouchA]', target: first });
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toHaveTextContent(PINNED);
    wait(AFTER_THE_GRACE_ENDS_MS);
    expect(screen.getByRole('region', { name: BOX_OF_FIRST })).toBeInTheDocument();
    await user.pointer({ keys: '[TouchA]', target: screen.getByText('Outside') });
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('Enter and Space on a focused trigger pin it as keyboard clicks', async () => {
    const { user, first, second } = setup();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(first).toHaveAttribute('data-pinned');
    await user.keyboard('{Escape}');
    expect(first).not.toHaveAttribute('data-pinned');
    await user.tab();
    expect(second).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('region', { name: BOX_OF_SECOND })).toHaveTextContent(PINNED);
  });
});

describe('useFloatingBox with several boxes in one scope', () => {
  afterEach(() => vi.useRealTimers());

  function Pair({ scope }: { scope: string }) {
    return (
      <>
        <Harness scope={scope} />
        <Harness scope={scope} />
      </>
    );
  }

  it('a preview that another box of its scope takes goes at once, and a pinned one stays', async () => {
    const user = fakeTimeUser();
    render(<Pair scope="shared" />);
    const { firstOfLeft, firstOfRight } = await hoverTheFirstOfTwoHarnesses(user);
    expect(screen.getAllByRole('region')).toHaveLength(1);
    await user.click(firstOfRight);
    await user.unhover(firstOfRight);
    await user.hover(firstOfLeft);
    expect(screen.getAllByRole('region', { name: BOX_OF_FIRST })).toHaveLength(2);
  });

  it('boxes of other scopes do not take each other’s preview', async () => {
    const user = fakeTimeUser();
    render(
      <>
        <Harness scope="one" />
        <Harness scope="other" />
      </>,
    );
    await hoverTheFirstOfTwoHarnesses(user);
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });
});
