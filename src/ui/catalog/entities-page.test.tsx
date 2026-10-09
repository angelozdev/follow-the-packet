// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CATALOG_TEXT, ENTITY_REFS, SCREEN_TEXT, entityName } from '@/copy';
import { EntitiesPage } from './entities-page';

vi.mock('@/scene/catalog/catalog-scene', () => ({
  CatalogScene: ({ still }: { still: boolean }) => <p>{still ? 'still' : 'moving'}</p>,
}));

describe('entities page', () => {
  it('names every entity in every variant beside its icon, and every stamp', () => {
    render(<EntitiesPage />);
    const icons = within(screen.getByRole('region', { name: CATALOG_TEXT.icons })).getAllByRole('listitem');
    expect(icons).toHaveLength(ENTITY_REFS.length + 4);
    for (const entity of ENTITY_REFS) expect(screen.getByText(entityName(entity))).toContainHTML('<svg');
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
