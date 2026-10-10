// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('is a button that does not submit a form, with the secondary look unless it says otherwise', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Listo</Button>);
    const button = screen.getByRole('button', { name: 'Listo' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('btn', { exact: true });
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is a link once it has an href, with the look of its variant', () => {
    render(
      <>
        <Button variant="primary" href="#/level/04-02">
          Siguiente
        </Button>
        <Button variant="text" href="#/">
          Volver
        </Button>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Siguiente' })).toHaveClass('btn btn--primary', { exact: true });
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveClass('link', { exact: true });
  });
});
