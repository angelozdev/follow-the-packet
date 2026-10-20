// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CATALOG_TEXT, ENTITY_REFS, INTERFACE_TEXT, LUCIA_TEXT, RESULT_TEXT, SCREEN_TEXT, TERMINAL_TEXT, entityName, toPlainText } from '@/copy';
import { EntitiesPage } from './entities-page';

const catalog = vi.hoisted(() => ({ drawsItsSpecimens: false }));

vi.mock('@/scene/catalog/catalog-scene', async () => {
  const { CatalogScene } = await vi.importActual<typeof import('@/scene/catalog/catalog-scene')>('@/scene/catalog/catalog-scene');
  return {
    CatalogScene: ({ still }: { still: boolean }) => (catalog.drawsItsSpecimens ? <CatalogScene still={still} /> : <p>{still ? 'still' : 'moving'}</p>),
  };
});

const BLOCK_CAPTION = 'contorno del bloque';
const SHAPE_CAPTIONS = ['TCP pide', 'TCP contesta', 'UDP pide', 'UDP contesta'];
const INTRUDER_CAPTIONS = ['Echo Request · intruso', 'Echo Reply · intruso', ...SHAPE_CAPTIONS.map((caption) => `${caption} · intruso`)];

describe('entities page', () => {
  it('names every entity in every variant beside its icon, and every stamp', () => {
    render(<EntitiesPage />);
    const icons = within(screen.getByRole('region', { name: CATALOG_TEXT.icons }));
    expect(icons.getAllByRole('listitem')).toHaveLength(ENTITY_REFS.length + 5);
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
    expect(elements.getAllByRole('button', { pressed: true })).toHaveLength(5);
    expect(elements.getByRole('group', { name: INTERFACE_TEXT.sample.yesNo })).toHaveClass('tray--segmented');
    expect(elements.getByRole('button', { name: INTERFACE_TEXT.sample.no, pressed: true })).toBeInTheDocument();
    expect(elements.getByRole('button', { name: INTERFACE_TEXT.sample.chosen })).toBeDisabled();
    expect(elements.getByRole('button', { name: INTERFACE_TEXT.sample.option })).toBeEnabled();
    const [disabledSend, terminalSend] = elements.getAllByRole('button', { name: TERMINAL_TEXT.send });
    expect(disabledSend).toBeDisabled();
    expect(disabledSend).toHaveClass('btn btn--primary', { exact: true });
    expect(terminalSend).toBeEnabled();
    expect(terminalSend).toHaveClass('btn btn--primary', { exact: true });
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

describe('entities page with the scene of the catalog', () => {
  beforeEach(() => {
    catalog.drawsItsSpecimens = true;
  });

  afterEach(() => {
    catalog.drawsItsSpecimens = false;
    vi.restoreAllMocks();
  });

  it('the specimens of the outline of the block and of the intruders are in the catalog', () => {
    render(<EntitiesPage />);
    const pieces = within(screen.getByRole('region', { name: CATALOG_TEXT.pieces }));
    for (const caption of [BLOCK_CAPTION, ...SHAPE_CAPTIONS, ...INTRUDER_CAPTIONS]) {
      const specimen = pieces.getByRole('figure', { name: caption });
      expect(specimen.querySelector('svg'), caption).not.toBeNull();
      expect(pieces.getAllByText(caption, { exact: true }), caption).toHaveLength(1);
    }
  });

  it('the entity catalog also runs with its animations, without errors', () => {
    const consoleErrors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<EntitiesPage />);
    expect(screen.getByLabelText(SCREEN_TEXT.motion)).not.toBeChecked();
    const pieces = screen.getByRole('region', { name: CATALOG_TEXT.pieces });
    expect(pieces.querySelectorAll('animateTransform').length).toBeGreaterThan(0);
    expect(consoleErrors).not.toHaveBeenCalled();
  });
});
