// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MAP_TEXT, TERMS, nameTag, type TermId } from '@/copy';
import { INCIDENTS, knownTerms, startWorld } from '@/levels';
import { OFFICE_FLOORS } from '@/testing/fixtures';
import { frameOf } from '@/scene/map2d/frame';
import type { MapLayout, RowPiece } from '@/scene/map2d/layout/arrange/geometry';
import { shownParts } from '@/scene/map2d/layout/arrange/groups';
import { blockTabBoxes } from '@/scene/map2d/layout/captions';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { BlockNames, GroupCaptions } from './group-captions';

const WIDTH = 1280;
const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();
const CIDR_ONLY: ReadonlySet<TermId> = new Set<TermId>(['cidr']);
const BLOCK_NAME = OFFICE_FLOORS.floor1.cidr;

function layoutOf(incidentId: string, extras: Partial<RowPiece> = {}, blockTab = false): MapLayout {
  const world = startWorld(INCIDENTS, incidentId);
  const shown = INCIDENTS.find(({ id }) => id === incidentId)?.shown;
  const drawn = world.devices.filter(({ id }) => shown === undefined || shown.includes(id));
  const pieces = drawn.map(({ id }): RowPiece => ({ id: `device:${id}`, kind: 'device', anchorId: id, label: nameTag(id), locked: false, state: 'normal', ...extras }));
  return layoutMap(world, pieces, { width: WIDTH, blockTab });
}

function captionsOf(incidentId: string, known: ReadonlySet<TermId> = knownTerms(INCIDENTS, incidentId)): Map<string, string> {
  const { groups, size } = layoutOf(incidentId);
  const { container } = render(<GroupCaptions groups={groups} known={known} frame={frameOf(WIDTH, size)} />);
  return new Map([...container.querySelectorAll<HTMLElement>('.caption')].map((each) => [each.dataset.group ?? '', each.textContent ?? '']));
}

const said = (incidentId: string, known?: ReadonlySet<TermId>) => [...captionsOf(incidentId, known).values()];

describe('the names of the groups', () => {
  it('the names of the groups say only what the player knows', () => {
    const { office } = MAP_TEXT.groups;
    expect(said('01-01')).toEqual(['Piso 1']);
    expect(said('01-06')).toEqual([office.text, 'Piso 1', 'Piso 2']);
    expect(said('02-03')).toEqual(['Piso 1']);
    expect(said('02-04')).toEqual([`${office.text} ${OFFICE_FLOORS.range}`, `Piso 1 ${OFFICE_FLOORS.floor1.cidr}`, `Piso 2 ${OFFICE_FLOORS.floor2.cidr}`]);
    expect(said('04-01')).toEqual(['VPC 172.31.0.0/16', 'subnet-a 172.31.16.0/20', 'subnet-b 172.31.32.0/20']);
    expect(said('04-01', CIDR_ONLY)).toEqual(['172.31.0.0/16', '172.31.16.0/20', '172.31.32.0/20']);
    expect(said('04-01', NOTHING_KNOWN)).toEqual([]);
  });

  it('in every registered incident no group says a part whose term the player has not met, and an office always says its name', () => {
    for (const { id } of INCIDENTS) {
      const known = knownTerms(INCIDENTS, id);
      const captions = captionsOf(id);
      for (const { id: groupId, kind, name } of layoutOf(id).groups) {
        const text = captions.get(groupId) ?? '';
        expect(text, `${id}, ${groupId}`).toBe(shownParts(name, known).join(' '));
        for (const part of name.filter(({ term }) => term !== undefined && !known.has(term))) expect(text, `${id}, ${groupId}, ${part.text}`).not.toContain(part.text);
        if (kind === 'office') expect(text.startsWith(MAP_TEXT.groups.office.text), `${id}, ${groupId}`).toBe(true);
        if (kind === 'vpc' && known.has('vpc')) expect(text.startsWith(MAP_TEXT.groups.vpc.text), `${id}, ${groupId}`).toBe(true);
      }
    }
  });

  it('the word of the heading of a VPC is the official name of the term that frees it, and the office has no term to wait for', () => {
    expect(MAP_TEXT.groups.vpc).toEqual({ text: TERMS.vpc.name, term: 'vpc' });
    expect('term' in MAP_TEXT.groups.office).toBe(false);
  });
});

describe('the name of the outline of a block', () => {
  const roomy = layoutOf('02-04', { insideBlock: true }, true);
  const tabs = blockTabBoxes(roomy.groups, BLOCK_NAME);
  const frame = frameOf(WIDTH, roomy.size);

  it('is written on its tab, at the pixels of the layout with the frame added', () => {
    const { container } = render(<BlockNames tabs={tabs} name={BLOCK_NAME} frame={frame} />);
    const drawn = [...container.querySelectorAll<HTMLElement>('.caption')];
    expect(drawn.map((each) => each.dataset.group)).toEqual(Object.keys(tabs));
    expect(drawn.length).toBeGreaterThan(1);
    for (const each of drawn) {
      const box = tabs[each.dataset.group ?? ''];
      expect(each.textContent).toBe(BLOCK_NAME);
      expect([each.style.left, each.style.top, each.style.width, each.style.height]).toEqual([`${frame.x + box.x}px`, `${frame.y + box.y}px`, `${box.width}px`, `${box.height}px`]);
    }
  });

  it('is no caption of the groups: the outline has no name of its own', () => {
    const { container } = render(<GroupCaptions groups={roomy.groups} known={CIDR_ONLY} frame={frame} />);
    const captioned = [...container.querySelectorAll<HTMLElement>('.caption')].map((each) => each.dataset.group ?? '');
    expect(captioned.length).toBeGreaterThan(0);
    expect(captioned.filter((id) => id in tabs)).toEqual([]);
  });
});
