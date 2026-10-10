// @vitest-environment jsdom
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ENTITY_TERMS, type EntityKind, type EntityRef, type EntityVariants, type StampState } from '@/copy';
import { CATALOG_ROWS } from '@/scene/catalog/catalog-cells';
import { EntityIcon } from './entity-icon';
import { StampIcon } from './stamp';

const STAMP_STATES: StampState[] = ['arrived', 'blocked', 'lost', 'intruder', 'warned'];

function variantsOf(kind: EntityKind): EntityRef[] {
  return Object.keys(ENTITY_TERMS[kind]).flatMap((variant) => {
    if (kind !== 'packet') return [{ kind, variant } as EntityRef];
    return variant === 'warning' ? [{ kind, variant }] : [false, true].map((intruder) => ({ kind, variant, intruder }) as EntityRef);
  });
}

function drawn(icon: ReactElement): SVGElement {
  const svg = render(icon).container.querySelector('svg');
  if (!svg) throw new Error('no icon drawn');
  return svg;
}

describe.each(Object.keys(ENTITY_TERMS) as EntityKind[])('the %s icon', (kind) => {
  const variants = variantsOf(kind);

  it('is drawn in the colour of the text around it and hidden from screen readers', () => {
    for (const entity of variants) {
      const svg = drawn(<EntityIcon entity={entity} />);
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('tells every variant apart by its shape', () => {
    const shapes = new Set(variants.map((entity) => drawn(<EntityIcon entity={entity} />).innerHTML));
    expect(shapes.size).toBe(variants.length);
  });
});

describe('the device icon', () => {
  const variants = Object.keys(ENTITY_TERMS.device) as EntityVariants['device'][];
  const iconOf = (variant: EntityVariants['device']) => drawn(<EntityIcon entity={{ kind: 'device', variant }} />);

  it('draws the server of the internet as a device', () => {
    const server = iconOf('internet-server');
    expect(server).toHaveClass('entity-icon');
    expect(server).toHaveAttribute('stroke', 'currentColor');
    expect(server).toHaveAttribute('aria-hidden', 'true');
    expect(variants.filter((variant) => variant !== 'internet-server').map((variant) => iconOf(variant).innerHTML)).not.toContain(server.innerHTML);
  });

  it('every device variant has an icon and a catalog cell', () => {
    const cells = CATALOG_ROWS.flat().map((cell) => cell.id);
    expect(variants).toContain('internet-server');
    for (const variant of variants) {
      expect(iconOf(variant).innerHTML, variant).not.toBe('');
      expect(cells.some((id) => id.startsWith(`device-${variant}-`)), variant).toBe(true);
    }
  });
});

describe('the packet icon', () => {
  const iconOf = (variant: EntityVariants['packet']) => drawn(<EntityIcon entity={{ kind: 'packet', variant } as EntityRef} />).innerHTML;

  it('every packet variant has an icon and every stamp state has its own shape', () => {
    const variants = Object.keys(ENTITY_TERMS.packet) as EntityVariants['packet'][];
    const cells = CATALOG_ROWS.flat().map((cell) => cell.id);
    for (const variant of variants) expect(iconOf(variant), variant).not.toBe('');
    for (const variant of variants.filter((other) => other !== 'warning')) expect(cells.some((id) => id.startsWith(`packet-${variant}-`)), variant).toBe(true);
    expect(cells).toContain('trace-warned-warned');
    expect(new Set(STAMP_STATES.map((state) => drawn(<StampIcon state={state} />).innerHTML)).size).toBe(STAMP_STATES.length);
  });

  it('draws the warning as a triangle, apart from the dot of an Echo Request and the ring of an Echo Reply', () => {
    expect([iconOf('echo-request'), iconOf('echo-reply')]).not.toContain(iconOf('warning'));
  });
});

describe('the stamp icon', () => {
  it('tells every state apart by its shape, not only by colour', () => {
    expect(new Set(STAMP_STATES.map((state) => drawn(<StampIcon state={state} />).innerHTML)).size).toBe(STAMP_STATES.length);
  });
});
