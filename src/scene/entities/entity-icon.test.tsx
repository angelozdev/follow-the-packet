// @vitest-environment jsdom
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ENTITY_TERMS, type EntityKind, type EntityRef } from '@/copy';
import { EntityIcon } from './entity-icon';
import { StampIcon, type StampState } from './stamp';

const STAMP_STATES: StampState[] = ['arrived', 'blocked', 'lost', 'intruder'];

function variantsOf(kind: EntityKind): EntityRef[] {
  return Object.keys(ENTITY_TERMS[kind]).flatMap((variant) =>
    kind === 'packet' ? [false, true].map((intruder) => ({ kind, variant, intruder }) as EntityRef) : [{ kind, variant } as EntityRef],
  );
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

describe('the stamp icon', () => {
  it('tells every state apart by its shape, not only by colour', () => {
    expect(new Set(STAMP_STATES.map((state) => drawn(<StampIcon state={state} />).innerHTML)).size).toBe(STAMP_STATES.length);
  });
});
