// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CATALOG_TEXT, ENTITY_REFS, MAP_TEXT, entityName, toPlainText, type EntityRef } from '@/copy';
import { MORE_SPECIMENS } from '@/scene/entities/stamp';
import { CASILLAS } from '@/scene/layout/arrange/geometry';
import { CatalogScene } from './catalog-scene';

type PieceEntity = Extract<EntityRef, { kind: 'device' | 'firewall' | 'edge' | 'internet' | 'actor' }>;
type State = keyof typeof CATALOG_TEXT.state;

const DEVICE_STATES: readonly State[] = ['normal', 'locked', 'selected', 'alert'];
const FIREWALL_STATES: readonly State[] = ['locked', 'configurable', 'selected', 'blocking'];
const ROW_SIZES = [3, 4, 4, 5, 4, 4, 3, 3, 5, 5, 4, 4, 3];
const COLUMNS = 5;
const TRACES: { caption: string; end: string; stamp: string }[] = [
  { caption: CATALOG_TEXT.state.replied, end: 'replied', stamp: 'arrived' },
  { caption: CATALOG_TEXT.state.arrived, end: 'arrived', stamp: 'arrived' },
  { caption: CATALOG_TEXT.state.blocked, end: 'blocked', stamp: 'blocked' },
  { caption: CATALOG_TEXT.state.lost, end: 'lost', stamp: 'lost' },
  { caption: CATALOG_TEXT.intruder, end: 'arrived', stamp: 'intruder' },
  { caption: CATALOG_TEXT.state.warned, end: 'warned', stamp: 'warned' },
];

function statesOf(entity: PieceEntity): readonly State[] {
  switch (entity.kind) {
    case 'device':
      return entity.variant === 'internet-server' ? ['normal'] : DEVICE_STATES;
    case 'firewall':
      return FIREWALL_STATES;
    case 'edge':
      return ['locked'];
    case 'internet':
    case 'actor':
      return ['normal'];
  }
}

const nameOf = (entity: EntityRef) => toPlainText(entityName(entity));
const captionOf = (entity: PieceEntity, state: State) => `${nameOf(entity)} · ${CATALOG_TEXT.state[state]}`;
const figure = (caption: string) => screen.getByRole('figure', { name: caption });
const has = (root: ParentNode, selector: string) => root.querySelector(selector) !== null;

function morePair(hidden: number, hidesProblem: boolean) {
  return { hidden, caption: hidesProblem ? CATALOG_TEXT.more.stampsWithProblem(hidden) : CATALOG_TEXT.more.stamps(hidden) };
}

describe('the 2D entity catalog', () => {
  it('the catalog draws every entity in every variant and state with its caption', () => {
    render(<CatalogScene still />);
    for (const entity of ENTITY_REFS) {
      if (entity.kind === 'network') {
        const drawn = figure(nameOf(entity));
        expect(has(drawn, `.map-group[data-kind="${entity.variant}"]`), nameOf(entity)).toBe(true);
        expect(has(drawn, '.map-wall'), nameOf(entity)).toBe(entity.variant === 'office');
        expect(has(drawn, '.map-tab'), nameOf(entity)).toBe(entity.variant === 'block');
        expect(has(drawn, '.map-group[data-kind="floor"]'), nameOf(entity)).toBe(entity.variant === 'office');
        expect(has(drawn, '.map-group[data-kind="subnet"]'), nameOf(entity)).toBe(entity.variant === 'vpc');
      } else if (entity.kind === 'packet') {
        const drawn = figure(entity.variant === 'warning' ? CATALOG_TEXT.state.warned : nameOf(entity));
        const shape = drawn.querySelector(`g.map-packet[data-shape="${entity.variant}"]`);
        expect(shape, nameOf(entity)).not.toBeNull();
        expect(shape?.classList.contains('map-packet--intruder'), nameOf(entity)).toBe('intruder' in entity && entity.intruder === true);
        if (entity.variant !== 'warning') expect(drawn.querySelectorAll('g.map-packet'), nameOf(entity)).toHaveLength(1);
      } else {
        for (const state of statesOf(entity)) {
          const caption = captionOf(entity, state);
          const drawn = figure(caption);
          const piece = drawn.querySelector(`.map-piece[data-kind="${entity.kind}"][data-variant="${entity.variant}"]`);
          expect(piece, caption).not.toBeNull();
          expect(drawn.querySelector('.map-button')?.classList.contains('map-button--locked'), caption).toBe(state === 'locked');
          expect(has(drawn, '.map-button__alert'), caption).toBe(state === 'alert');
          expect(has(drawn, '.map-piece__mat'), caption).toBe(entity.kind === 'device' && state === 'selected');
          expect(has(drawn, '.map-piece__border'), caption).toBe(state === 'alert');
          expect(has(drawn, '.map-bar--blocking'), caption).toBe(state === 'blocking');
          expect(has(drawn, '.map-bar--selected'), caption).toBe(entity.kind === 'firewall' && state === 'selected');
        }
      }
    }
  });

  it('the catalog draws a trace with its stamp for every way a packet ends', () => {
    render(<CatalogScene still />);
    for (const { caption, end, stamp } of TRACES) {
      const drawn = figure(caption);
      expect(has(drawn, `g.map-trace[data-end="${end}"]`), caption).toBe(true);
      expect(has(drawn, `button.stamp--${stamp}`), caption).toBe(true);
    }
  });

  it('the specimens of «+2» and «+12» are in the catalog', () => {
    render(<CatalogScene still />);
    const specimens = MORE_SPECIMENS.map(({ hidden, hidesProblem }) => morePair(hidden, hidesProblem));
    expect(specimens.map(({ hidden }) => hidden)).toEqual([2, 12, 2]);
    expect(new Set(specimens.map(({ caption }) => caption)).size).toBe(3);
    for (const [index, { hidden, caption }] of specimens.entries()) {
      const { hidesProblem } = MORE_SPECIMENS[index];
      const more = figure(caption).querySelector('button.stamp--more');
      expect(more, caption).toHaveTextContent(`+${hidden}`);
      expect(more?.classList.contains('stamp--tight'), caption).toBe(hidden === 12);
      expect(has(more as Element, '.stamp__dot'), caption).toBe(hidesProblem);
      const total = hidden + CASILLAS - 1;
      expect(more?.getAttribute('aria-label'), caption).toBe(hidesProblem ? MAP_TEXT.moreStampsWithProblem(hidden, total) : MAP_TEXT.moreStamps(hidden, total));
    }
  });

  it('the caption of the «+N» with a dot names the four states of the stamps it hides, as the name of its button does', () => {
    const problemStates = MAP_TEXT.hiddenProblem.replace(/^Entre los escondidos hay |\.$/g, '');
    expect(problemStates).toBe('alguno bloqueado, perdido, con un aviso o que entró y no debía');
    for (const hidden of [2, 12]) expect(CATALOG_TEXT.more.stampsWithProblem(hidden)).toBe(`${hidden} sellos más, ${problemStates}`);
    render(<CatalogScene still />);
    const withDot = MORE_SPECIMENS.filter(({ hidesProblem }) => hidesProblem);
    expect(withDot).toHaveLength(1);
    expect(figure(CATALOG_TEXT.more.stampsWithProblem(withDot[0].hidden)).querySelector('.stamp__dot')).not.toBeNull();
  });

  it('every specimen of the 2D catalog is hidden from screen readers and its caption is its name', () => {
    const { container } = render(<CatalogScene still />);
    const figures = screen.getAllByRole('figure');
    expect(figures.length).toBe(ROW_SIZES.reduce((total, size) => total + size, 0));
    for (const each of figures) {
      const caption = each.querySelector('figcaption')?.textContent ?? '';
      expect(caption).not.toBe('');
      expect(each).toHaveAccessibleName(caption);
      expect([...each.children].map((child) => child.tagName)).toEqual(['DIV', 'FIGCAPTION']);
      expect(each.children[0]).toHaveAttribute('aria-hidden', 'true');
      expect(each.children[0]).toHaveAttribute('inert');
    }
    expect(new Set(figures.map((each) => each.querySelector('figcaption')?.textContent)).size).toBe(figures.length);
    expect(screen.queryAllByRole('button')).toEqual([]);
    for (const drawn of container.querySelectorAll('svg, button, [tabindex]')) expect(drawn.closest('[aria-hidden="true"][inert]'), drawn.outerHTML.slice(0, 80)).not.toBeNull();
    for (const entity of ENTITY_REFS.filter((each) => each.kind !== 'packet')) {
      const name = nameOf(entity);
      expect(figures.some((each) => (each.querySelector('figcaption')?.textContent ?? '').startsWith(name)), name).toBe(true);
    }
  });

  it('the catalog lines up in 5 columns and each family starts its own row', () => {
    const { container } = render(<CatalogScene still />);
    const rows = [...container.querySelectorAll<HTMLElement>('.catalog2d__row')];
    expect(rows.map((row) => row.querySelectorAll('figure').length)).toEqual(ROW_SIZES);
    expect(Math.max(...ROW_SIZES)).toBe(COLUMNS);
    for (const row of rows) expect(row.style.gridTemplateColumns).toMatch(new RegExp(`^repeat\\(${COLUMNS}, `));
    const ids = [...container.querySelectorAll('[id]')].map((each) => each.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('draws the states that move with animations on, and as still marks with them off', () => {
    const moving = render(<CatalogScene still={false} />);
    const alert = figure(captionOf({ kind: 'device', variant: 'laptop' }, 'alert'));
    const selectedBar = figure(captionOf({ kind: 'firewall', variant: 'security-group' }, 'selected'));
    expect(has(alert, 'animateTransform'), 'a laptop under attack shakes').toBe(true);
    expect(has(alert, '.map-piece__border')).toBe(false);
    expect(has(selectedBar, 'animateTransform'), 'a selected bar pulses').toBe(true);
    expect(has(selectedBar, '.map-bar--selected')).toBe(false);
    moving.unmount();
    render(<CatalogScene still />);
    expect(document.querySelectorAll('animateTransform')).toHaveLength(0);
  });
});
