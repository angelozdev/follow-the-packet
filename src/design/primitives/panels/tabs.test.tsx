// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, type TabItem } from './tabs';

const NAME = 'Sentido';
const TABS: TabItem[] = [
  { id: 'in', label: 'Entrada', panel: <p>Reglas de entrada</p> },
  { id: 'out', label: 'Salida', panel: <p>Reglas de salida</p> },
  { id: 'log', label: 'Registro', panel: <p>Registro de paquetes</p> },
];
const [FIRST, SECOND, LAST] = TABS;
const RADIX_OWN_STYLE = ['outline', 'animation-duration'];

function Harness({ initial = FIRST.id, onSelect }: { initial?: string; onSelect?: (tabId: string) => void }) {
  const [selected, setSelected] = useState(initial);
  const select = (tabId: string) => {
    onSelect?.(tabId);
    setSelected(tabId);
  };
  return (
    <>
      <Tabs name={NAME} tabs={TABS} selected={selected} onSelect={select} />
      <button type="button">Fuera</button>
    </>
  );
}

function labelOf({ label }: TabItem): string {
  return String(label);
}

function tabOf(item: TabItem): HTMLElement {
  return screen.getByRole('tab', { name: labelOf(item) });
}

describe('Tabs', () => {
  it('renders only the panel of the selected tab', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.getByRole('tabpanel', { name: labelOf(FIRST) })).toHaveTextContent('Reglas de entrada');
    expect(screen.queryByText('Reglas de salida')).not.toBeInTheDocument();
    expect(screen.queryByText('Registro de paquetes')).not.toBeInTheDocument();
    await user.click(tabOf(SECOND));
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.getByRole('tabpanel', { name: labelOf(SECOND) })).toHaveTextContent('Reglas de salida');
    expect(screen.queryByText('Reglas de entrada')).not.toBeInTheDocument();
  });

  it('marks the selected tab with aria-selected and the others without it', () => {
    render(<Harness initial={SECOND.id} />);
    expect(tabOf(SECOND)).toHaveAttribute('aria-selected', 'true');
    expect(tabOf(FIRST)).toHaveAttribute('aria-selected', 'false');
    expect(tabOf(LAST)).toHaveAttribute('aria-selected', 'false');
    expect(screen.getAllByRole('tab', { selected: true })).toEqual([tabOf(SECOND)]);
  });

  it('selects a tab when it is clicked and reports its id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    await user.click(tabOf(SECOND));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(SECOND.id);
  });

  it('moves the selection with the arrow keys, from the last tab to the first', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(tabOf(SECOND)).toHaveAttribute('aria-selected', 'true');
    expect(tabOf(SECOND)).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tabOf(LAST)).toHaveAttribute('aria-selected', 'true');
    expect(tabOf(LAST)).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tabOf(FIRST)).toHaveAttribute('aria-selected', 'true');
    expect(tabOf(FIRST)).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Reglas de entrada');
    await user.keyboard('{ArrowLeft}');
    expect(tabOf(LAST)).toHaveAttribute('aria-selected', 'true');
  });

  it('goes to the first tab with Home and to the last with End', async () => {
    const user = userEvent.setup();
    render(<Harness initial={SECOND.id} />);
    await user.tab();
    await user.keyboard('{End}');
    expect(tabOf(LAST)).toHaveAttribute('aria-selected', 'true');
    expect(tabOf(LAST)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(tabOf(FIRST)).toHaveAttribute('aria-selected', 'true');
    expect(tabOf(FIRST)).toHaveFocus();
  });

  it('puts one tab in the tab order and the panel of the selected tab right after it', async () => {
    const user = userEvent.setup();
    render(<Harness initial={SECOND.id} />);
    expect(tabOf(FIRST)).toHaveAttribute('tabindex', '-1');
    expect(tabOf(LAST)).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(tabOf(SECOND)).toHaveFocus();
    expect(tabOf(SECOND)).toHaveAttribute('tabindex', '0');
    await user.tab();
    expect(screen.getByRole('tabpanel')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Fuera' })).toHaveFocus();
  });

  it('names the tab list for screen readers', () => {
    render(<Harness />);
    const list = screen.getByRole('tablist', { name: NAME });
    expect(within(list).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(TABS.map((tab) => tab.label));
  });

  it('wears the classes of the design system and no inline style', () => {
    const { container } = render(<Tabs name={NAME} tabs={TABS} selected={FIRST.id} onSelect={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass('tabs', { exact: true });
    expect(screen.getByRole('tablist')).toHaveClass('tabs__list', { exact: true });
    for (const tab of screen.getAllByRole('tab')) expect(tab).toHaveClass('tabs__tab', { exact: true });
    expect(screen.getByRole('tabpanel')).toHaveClass('tabs__panel', { exact: true });
    const inlineProperties = Array.from(container.querySelectorAll<HTMLElement>('*')).flatMap((element) => Array.from(element.style));
    expect(inlineProperties.filter((property) => !RADIX_OWN_STYLE.includes(property))).toEqual([]);
  });
});
