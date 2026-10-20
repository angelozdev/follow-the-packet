// @vitest-environment jsdom
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ENTITY_REFS, ENTITY_TERMS, type EntityKind, type EntityRef, type EntityVariants, type StampState } from '@/copy';
import { CATALOG_ROWS } from '@/scene/catalog/catalog-cells';
import { EntityIcon } from './entity-icon';
import { PACKET_SHAPES } from './packet';
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

describe('the shapes of the packets', () => {
  const SQUARE_TURN = Math.PI / 4;
  const RHOMBUS_PATH = 'M12 5l7 7-7 7-7-7z';
  const packets = ENTITY_REFS.filter((entity) => entity.kind === 'packet' && entity.variant !== 'warning');

  it('no packet is drawn as a rhombus', () => {
    for (const [variant, shape] of Object.entries(PACKET_SHAPES)) {
      if (shape.sides === 4) expect(shape.turn, variant).toBeCloseTo(SQUARE_TURN);
    }
    for (const entity of packets) expect(drawn(<EntityIcon entity={entity} />).innerHTML, JSON.stringify(entity)).not.toContain(RHOMBUS_PATH);
  });

  it('draws every protocol with a shape of its own, filled when it asks and a ring when it answers', () => {
    expect(Object.keys(PACKET_SHAPES).sort()).toEqual(['echo-reply', 'echo-request', 'tcp-reply', 'tcp-request', 'udp-reply', 'udp-request']);
    expect(Object.entries(PACKET_SHAPES).map(([variant, shape]) => [variant, shape.hollow])).toEqual([
      ['echo-request', false],
      ['echo-reply', true],
      ['tcp-request', false],
      ['tcp-reply', true],
      ['udp-request', false],
      ['udp-reply', true],
    ]);
    const sides = (protocol: string) => new Set(Object.entries(PACKET_SHAPES).filter(([variant]) => variant.startsWith(protocol)).map(([, shape]) => shape.sides));
    expect([sides('echo'), sides('tcp'), sides('udp')].map((set) => [...set])).toEqual([[24], [4], [6]]);
  });

  it('draws the intruder of every protocol with a border the packet of that protocol has not', () => {
    for (const variant of Object.keys(PACKET_SHAPES)) {
      const plain = drawn(<EntityIcon entity={{ kind: 'packet', variant, intruder: false } as EntityRef} />);
      const intruder = drawn(<EntityIcon entity={{ kind: 'packet', variant, intruder: true } as EntityRef} />);
      expect(intruder.querySelectorAll('path').length, variant).toBe(plain.querySelectorAll('path').length + 1);
      expect(intruder.innerHTML, variant).toContain(plain.innerHTML);
    }
  });
});

describe('every entity of the catalog', () => {
  const cellsOf = (prefix: string) => CATALOG_ROWS.flat().filter((cell) => cell.id === prefix || cell.id.startsWith(`${prefix}-`));

  it('every entity and every variant of the catalog has an icon', () => {
    for (const entity of ENTITY_REFS) {
      const svg = drawn(<EntityIcon entity={entity} />);
      expect(svg.innerHTML, JSON.stringify(entity)).not.toBe('');
      const intruder = 'intruder' in entity && entity.intruder === true;
      const prefix = entity.kind === 'packet' ? (entity.variant === 'warning' ? 'trace-warned' : `packet-${entity.variant}-${intruder}`) : entity.kind === 'internet' ? 'internet' : `${entity.kind}-${entity.variant}`;
      expect(cellsOf(prefix).length, JSON.stringify(entity)).toBeGreaterThan(0);
    }
  });
});

describe('the stamp icon', () => {
  it('tells every state apart by its shape, not only by colour', () => {
    expect(new Set(STAMP_STATES.map((state) => drawn(<StampIcon state={state} />).innerHTML)).size).toBe(STAMP_STATES.length);
  });
});
