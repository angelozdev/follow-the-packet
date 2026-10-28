// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SCREEN_TEXT } from '@/copy';
import { registryLines, startSession } from '@/game';
import { INCIDENTS } from '@/levels';
import { StatusBar } from './status-bar';

const INCIDENT_WITH_LINES = '04-01';
const REGISTRY_BUTTON = /^Registro \(\d+\)$/;
const lines = registryLines(startSession(INCIDENTS, INCIDENT_WITH_LINES));
const bar = (shown: typeof lines) => <StatusBar lines={shown} choose={() => ({})} seeRow={vi.fn()} />;

describe('the status bar', () => {
  it('with no line it says the empty line and draws no Registro button', () => {
    render(bar([]));

    expect(screen.getByText(SCREEN_TEXT.statusEmpty)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Registro/ })).toBeNull();
  });

  it('a registry that was open when the lines ran out stays closed when a line comes back', async () => {
    const user = userEvent.setup();
    const view = render(bar(lines));
    await user.click(screen.getByRole('button', { name: REGISTRY_BUTTON }));
    expect(screen.getByRole('button', { name: REGISTRY_BUTTON })).toHaveAttribute('aria-expanded', 'true');

    view.rerender(bar([]));
    view.rerender(bar(lines));

    expect(screen.getByRole('button', { name: REGISTRY_BUTTON })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: REGISTRY_BUTTON })).toBeNull();
  });
});
