import { describe, expect, it } from 'vitest';
import { nameTag } from '@/copy';
import { OFFICE_FLOORS, lab03Net, officeTwoFloorsNet } from '@/testing';
import { CAPTION, GROUP_PAD, type Group, type PieceKind, type RowPiece } from './arrange/geometry';
import { CAPTION_CELL, captionBoxes } from './captions';
import { layoutMap } from './map-layout';

const piece = (kind: PieceKind, anchorId: string): RowPiece => ({ id: `${kind}:${anchorId}`, kind, anchorId, label: nameTag(anchorId), locked: false, state: 'normal' });
const devices = (...ids: string[]) => ids.map((id) => piece('device', id));
const { floor1, floor2 } = OFFICE_FLOORS;
const BOTH_FLOORS = layoutMap(officeTwoFloorsNet(), devices('your-laptop', 'lucia-laptop', 'andres-laptop'), { width: 1440 });
const CAPTIONS = captionBoxes(BOTH_FLOORS.groups);
const groupOf = (id: string) => BOTH_FLOORS.groups.find((group) => group.id === id) as Group;

describe('captionBoxes', () => {
  it('the name of a group stands in its top left corner, 14 px from both edges, in the strip of 18 px over its first row', () => {
    for (const id of [floor1.id, floor2.id, 'office']) {
      const { box } = groupOf(id);
      expect(CAPTIONS[id]).toMatchObject({ x: box.x + GROUP_PAD, y: box.y + GROUP_PAD, height: CAPTION });
    }
    const { box: first } = groupOf(floor1.id);
    const firstRow = Math.min(...Object.values(BOTH_FLOORS.icons).filter(({ x, y }) => x >= first.x && y >= first.y && y < first.y + first.height).map(({ y }) => y));
    expect(CAPTIONS[floor1.id].y + CAPTION).toBeLessThanOrEqual(firstRow);
  });

  it('its width is every part of the name joined by a space, at 10 px a character, whether or not the player knows the term of a part', () => {
    expect(CAPTION_CELL).toBe(10);
    expect(CAPTIONS[floor1.id].width).toBe(`${floor1.name} ${floor1.cidr}`.length * 10);
    expect(CAPTIONS.office.width).toBe(OFFICE_FLOORS.range.length * 10);
    const vpc = layoutMap(lab03Net(), devices('servidor1'), { width: 900 });
    expect(captionBoxes(vpc.groups)['subnet-a'].width).toBe('subnet-a 172.31.16.0/20'.length * 10);
  });

  it('a group with no name, the outline of a block, has no caption', () => {
    const block: Group = { id: 'block:floor-1:150', kind: 'block', name: [], box: { x: 0, y: 0, width: 200, height: 100 } };
    expect(captionBoxes([block])).toEqual({});
    expect(Object.keys(captionBoxes([block, groupOf(floor1.id)]))).toEqual([floor1.id]);
  });

  it('counts a letter with an accent and the arrow as one character, composed or not', () => {
    const named = (text: string): Group => ({ id: 'g', kind: 'floor', name: [{ text }], box: { x: 0, y: 0, width: 400, height: 100 } });
    expect(captionBoxes([named('Piso Ñ→')]).g.width).toBe(70);
    expect(captionBoxes([named('Pi\u0301so')]).g.width).toBe(40);
  });

  it('every group of a map that has a name has a caption, and no other', () => {
    const named = BOTH_FLOORS.groups.filter(({ name }) => name.length > 0).map(({ id }) => id);
    expect(Object.keys(CAPTIONS)).toEqual(named);
    expect(named).toEqual(expect.arrayContaining([floor1.id, floor2.id, 'office']));
  });
});
