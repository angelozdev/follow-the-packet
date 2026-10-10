// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CATALOG_TEXT, ENTITY_REFS, INTERFACE_TEXT, LUCIA_TEXT, RESULT_TEXT, SCREEN_TEXT, TERMINAL_TEXT, entityName, toPlainText } from '@/copy';
import { EntitiesPage } from './entities-page';

vi.mock('@/scene/catalog/catalog-scene', () => ({
  CatalogScene: ({ still }: { still: boolean }) => <p>{still ? 'still' : 'moving'}</p>,
}));

describe('entities page', () => {
  it('names every entity in every variant beside its icon, and every stamp', () => {
    render(<EntitiesPage />);
    const icons = within(screen.getByRole('region', { name: CATALOG_TEXT.icons }));
    expect(icons.getAllByRole('listitem')).toHaveLength(ENTITY_REFS.length + 4);
    for (const entity of ENTITY_REFS) expect(icons.getByText(toPlainText(entityName(entity))).closest('li')).toContainHTML('<svg');
  });

  it('shows the name of an actor as a name tag, apart from the entity', () => {
    render(<EntitiesPage />);
    expect(screen.getByText('Atacante')).toHaveClass('name-tag');
    expect(screen.getByText('Casa de Lucía')).toHaveClass('name-tag');
  });

  it('shows every element of the interface in its own region, each in its variants and states', () => {
    render(<EntitiesPage />);
    const elements = within(screen.getByRole('region', { name: INTERFACE_TEXT.title }));
    expect(elements.getByRole('button', { name: LUCIA_TEXT.submit })).toBeInTheDocument();
    expect(elements.getByRole('link', { name: RESULT_TEXT.next })).toHaveAttribute('href', '#/');
    expect(elements.getByRole('link', { name: SCREEN_TEXT.back })).toHaveAttribute('href', '#/');
    expect(elements.getAllByRole('button', { pressed: true })).toHaveLength(4);
    expect(elements.getByRole('button', { name: INTERFACE_TEXT.sample.chosen })).toBeDisabled();
    expect(elements.getByRole('button', { name: INTERFACE_TEXT.sample.option })).toBeEnabled();
    const [disabledSend, terminalSend] = elements.getAllByRole('button', { name: TERMINAL_TEXT.send });
    expect(disabledSend).toBeDisabled();
    expect(terminalSend).toBeEnabled();
    expect(elements.getByText(SCREEN_TEXT.stampLegend)).toHaveClass('muted');
  });

  it('draws the pieces moving, and still once "Sin animaciones" is checked', async () => {
    const user = userEvent.setup();
    render(<EntitiesPage />);
    const pieces = screen.getByRole('region', { name: CATALOG_TEXT.pieces });
    expect(pieces).toHaveTextContent('moving');
    await user.click(screen.getByLabelText(SCREEN_TEXT.motion));
    expect(pieces).toHaveTextContent('still');
  });
});
