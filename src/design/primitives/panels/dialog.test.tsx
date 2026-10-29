// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './dialog';

const NAME = 'Registro';
const CLOSE_TEXT = '×';
const CLOSE_LABEL = 'Cerrar la ventana';
const CONTENT = 'Lo último que pasó';
const OUTSIDE = 'Afuera';
const OVERLAY = '.dialog__overlay';

function renderDialog(modal: boolean, onOpenChange = vi.fn()) {
  render(
    <>
      <button type="button">{OUTSIDE}</button>
      <Dialog name={NAME} closeText={CLOSE_TEXT} closeLabel={CLOSE_LABEL} open modal={modal} onOpenChange={onOpenChange}>
        <p>{CONTENT}</p>
      </Dialog>
    </>,
  );
  return onOpenChange;
}

describe('Dialog', () => {
  it('a Dialog is named by its title and draws a close button and its content', () => {
    renderDialog(false);

    const dialog = screen.getByRole('dialog', { name: NAME });
    expect(within(dialog).getByRole('heading', { name: NAME })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: CLOSE_LABEL })).toHaveTextContent(CLOSE_TEXT);
    expect(dialog).toHaveTextContent(CONTENT);
  });

  it('with modal false a Dialog draws no overlay and leaves the rest of the page reachable', async () => {
    const user = userEvent.setup();
    const onOpenChange = renderDialog(false);

    expect(document.querySelector(OVERLAY)).toBeNull();
    const outside = screen.getByRole('button', { name: OUTSIDE });
    await user.click(outside);
    expect(outside).toHaveFocus();
    expect(onOpenChange, 'a press outside does not ask to close').not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: NAME })).toBeInTheDocument();
  });

  it('with modal true a Dialog draws an overlay and hides the rest of the page', () => {
    renderDialog(true);

    expect(document.querySelector(OVERLAY)).not.toBeNull();
    expect(screen.queryByRole('button', { name: OUTSIDE })).toBeNull();
  });

  it('Escape and the close button ask to close', async () => {
    const user = userEvent.setup();
    const onOpenChange = renderDialog(false);

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByRole('button', { name: CLOSE_LABEL }));
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
