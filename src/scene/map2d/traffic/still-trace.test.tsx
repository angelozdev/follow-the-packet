// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EntityRef } from '@/copy';
import { OFFICE_FLOORS, device, officeTwoFloorsNet, ping, tcp } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES, mapRun, mapRunWithPorts, type MapRunFixture } from '@/testing/map-pieces';
import type { Box } from '@/scene/map2d/layout/arrange/geometry';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import type { Point } from '@/scene/map2d/layout/graph';
import { fanStamps, stampsByPlace } from '@/scene/map2d/marks/stamp-fan';
import { stillPackets } from '@/scene/map2d/marks/still-packets';
import { CatalogIcon } from '@/scene/map2d/entities/device';
import { StillTraffic } from './still-trace';

const WORLD = officeTwoFloorsNet();
const LAYOUT = layoutMap(WORLD, FLOORS_LABEL_PIECES, { width: 1280 });
const { floor1, officeRouter, server } = OFFICE_FLOORS;
const YOU = device('your-laptop');

const toLucia = (id: string, extras: Partial<MapRunFixture> = {}) => mapRun(WORLD, ping(YOU, floor1.lucia), id, extras);
const toNobody = (id: string, extras: Partial<MapRunFixture> = {}) => mapRun(WORLD, ping(YOU, floor1.nobody), id, extras);
const toTheServer = (id: string) => mapRunWithPorts(WORLD, tcp(YOU, server.ip, 80), id, officeRouter.id);
const udpToLucia = (id: string) => mapRun(WORLD, { from: YOU, to: floor1.lucia, protocol: 'udp', port: 53 }, id);

function draw(runs: readonly MapRunFixture[]) {
  const packets = stillPackets(runs, LAYOUT, fanStamps(stampsByPlace(runs, LAYOUT.drawn), LAYOUT.marks));
  const view = render(
    <svg>
      <StillTraffic packets={packets} />
    </svg>,
  );
  return { packets, root: view.container.querySelector('svg') as SVGSVGElement, container: view.container };
}

const numbersOf = (text: string | null): number[] => (text?.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);
const pointsOf = (line: Element): Point[] => {
  const numbers = numbersOf(line.getAttribute('d'));
  return numbers.flatMap((value, index) => (index % 2 === 0 ? [[value, numbers[index + 1]] as Point] : []));
};
const boxOf = (glyph: Element): Box => {
  const icon = glyph.querySelector('svg') as SVGSVGElement;
  return { x: Number(icon.getAttribute('x')), y: Number(icon.getAttribute('y')), width: Number(icon.getAttribute('width')), height: Number(icon.getAttribute('height')) };
};
const centerOf = ({ x, y, width, height }: Box): Point => [x + width / 2, y + height / 2];
const traceOf = (root: ParentNode, id: string) => root.querySelector(`g.map-trace[data-packet="${id}"]`) as SVGGElement;
const glyphsOf = (trace: Element) => [...trace.querySelectorAll<SVGGElement>('g.map-packet')];
const roleOf = (trace: Element, role: string) => glyphsOf(trace).find((glyph) => glyph.dataset.role === role);
const drawnShape = (glyph: Element) => [...glyph.querySelectorAll('path')].map((path) => path.getAttribute('d'));

function catalogShape(entity: EntityRef): (string | null)[] {
  const view = render(
    <svg>
      <CatalogIcon entity={entity} box={{ x: 0, y: 0, width: 40, height: 40 }} />
    </svg>,
  );
  const paths = [...view.container.querySelectorAll('path')].map((path) => path.getAttribute('d'));
  view.unmount();
  return paths;
}

describe('StillTraffic', () => {
  it('a still scene draws the trace of every packet, with its shape halfway and a ring near its start when it was answered', () => {
    const { packets, root } = draw([toLucia('answered'), toNobody('lost')]);
    expect([...root.querySelectorAll('g.map-trace')].map((trace) => trace.getAttribute('data-packet'))).toEqual(['answered', 'lost']);
    for (const packet of packets) {
      const trace = traceOf(root, packet.id);
      expect(pointsOf(trace.querySelector('path.map-trace__line') as Element)).toEqual(packet.path);
      expect(glyphsOf(trace).map((glyph) => glyph.dataset.role)).toEqual(packet.glyphs.map(({ role }) => role));
      packet.glyphs.forEach((glyph, index) => expect(centerOf(boxOf(glyphsOf(trace)[index]))).toEqual(glyph.point));
    }
    const [answered, lost] = packets;
    expect(answered.glyphs.map(({ role }) => role)).toEqual(['going', 'answer']);
    expect(lost.glyphs.map(({ role }) => role)).toEqual(['going']);
    expect(roleOf(traceOf(root, 'answered'), 'answer')?.dataset.shape).toBe('echo-reply');
  });

  it('a blocked trace is in danger, a lost one is dashed and a warning of the sender stands at the end of the path', () => {
    const blocked = toLucia('blocked', { replied: false, reached: false, blocked: true });
    const fromTheSender = toNobody('sender', { warning: { term: 'host-unreachable', by: 'sender' } });
    const { packets, root } = draw([toLucia('answered'), blocked, toNobody('lost'), fromTheSender]);
    const line = (id: string) => traceOf(root, id).querySelector('path.map-trace__line') as Element;
    expect(line('blocked').classList.contains('map-trace__line--blocked')).toBe(true);
    expect(line('lost').classList.contains('map-trace__line--lost')).toBe(true);
    for (const id of ['answered', 'sender']) {
      expect(line(id).classList.contains('map-trace__line--blocked')).toBe(false);
      expect(line(id).classList.contains('map-trace__line--lost')).toBe(false);
    }
    expect(line('blocked').classList.contains('map-trace__line--lost')).toBe(false);
    expect(line('lost').classList.contains('map-trace__line--blocked')).toBe(false);
    const sender = traceOf(root, 'sender');
    expect(glyphsOf(sender).map((glyph) => [glyph.dataset.role, glyph.dataset.shape])).toEqual([['appears', 'warning']]);
    const path = packets[3].path;
    expect(centerOf(boxOf(glyphsOf(sender)[0]))).toEqual(path[path.length - 1]);
  });

  it('the shape of a packet says its protocol and its border says its role', () => {
    const { root } = draw([toLucia('ping'), mapRun(WORLD, { from: YOU, to: floor1.lucia, protocol: 'tcp', port: 80 }, 'tcp'), udpToLucia('udp'), toLucia('intruder', { intruder: true })]);
    const going = (id: string) => roleOf(traceOf(root, id), 'going') as SVGGElement;
    const answer = (id: string) => roleOf(traceOf(root, id), 'answer') as SVGGElement;
    expect(['ping', 'tcp', 'udp'].map((id) => going(id).dataset.shape)).toEqual(['echo-request', 'tcp-request', 'udp-request']);
    const forms = ['ping', 'tcp', 'udp'].map((id) => drawnShape(going(id)).join('|'));
    expect(new Set(forms).size).toBe(3);
    expect(drawnShape(going('ping'))).toEqual(catalogShape({ kind: 'packet', variant: 'echo-request' }));
    expect(drawnShape(going('tcp'))).toEqual(catalogShape({ kind: 'packet', variant: 'tcp-request' }));
    expect(drawnShape(going('udp'))).toEqual(catalogShape({ kind: 'packet', variant: 'udp-request' }));

    expect(going('ping').querySelector('path')?.getAttribute('fill')).toBe('currentColor');
    expect(answer('ping').querySelector('path')?.getAttribute('fill')).toBe('none');
    expect(answer('ping').dataset.shape).toBe('echo-reply');

    expect(going('ping').classList.contains('map-packet--intruder')).toBe(false);
    expect(going('intruder').classList.contains('map-packet--intruder')).toBe(true);
    expect(drawnShape(going('ping'))).toHaveLength(1);
    const [shape, border] = drawnShape(going('intruder'));
    expect(shape).toBe(drawnShape(going('ping'))[0]);
    expect(border).not.toBe(shape);
    expect(drawnShape(going('intruder'))).toEqual(catalogShape({ kind: 'packet', variant: 'echo-request', intruder: true }));
  });

  it('draws the warning of a router coming back as the triangle of the catalog, never as an intruder', () => {
    const { root } = draw([toLucia('warned', { replied: false, intruder: true, warning: { term: 'time-exceeded', by: 'router' } })]);
    const back = roleOf(traceOf(root, 'warned'), 'answer') as SVGGElement;
    expect(back.dataset.shape).toBe('warning');
    expect(back.classList.contains('map-packet--intruder')).toBe(false);
    expect(drawnShape(back)).toEqual(catalogShape({ kind: 'packet', variant: 'warning' }));
  });

  it('a still scene draws one packet-tag per packet with ports: the one of the leg where it stands', () => {
    const inside = mapRunWithPorts(WORLD, tcp(YOU, floor1.lucia, 3000), 'inside');
    const { packets, root } = draw([toTheServer('nat'), toLucia('ping'), inside]);
    const tags = [...root.querySelectorAll<SVGGElement>('g.packet-tag')];
    expect(tags.map((tag) => tag.getAttribute('data-packet'))).toEqual(['nat', 'inside']);
    expect(tags.map((tag) => tag.textContent)).toEqual(['TCP 51514 → 80', 'TCP 51514 → 3000']);
    tags.forEach((tag, index) => {
      const box = packets.filter(({ label }) => label?.place !== undefined)[index].label?.place?.box as Box;
      const rect = tag.querySelector('rect') as SVGRectElement;
      expect([rect.getAttribute('x'), rect.getAttribute('y'), rect.getAttribute('width'), rect.getAttribute('height')]).toEqual([box.x, box.y, box.width, box.height].map(String));
    });
  });

  it('draws no label for a packet that has no place for it, and keeps the others', () => {
    const crowd = Array.from({ length: 10 }, (_, index) => mapRunWithPorts(WORLD, tcp(YOU, floor1.you, 80 + index), `itself-${index + 1}`));
    const { packets, root } = draw(crowd);
    const placed = packets.filter(({ label }) => label?.place !== undefined);
    expect(placed.length).toBeLessThan(crowd.length);
    expect([...root.querySelectorAll('g.packet-tag')].map((tag) => tag.getAttribute('data-packet'))).toEqual(placed.map(({ id }) => id));
    expect(root.querySelectorAll('g.map-trace')).toHaveLength(crowd.length);
  });

  it('draws the labels over every trace and every shape', () => {
    const { root } = draw([toTheServer('nat'), toLucia('ping')]);
    const layer = root.querySelector('g.map-traffic') as Element;
    const order = [...layer.children].map((child) => child.getAttribute('class'));
    expect(order).toEqual(['map-trace', 'map-trace', 'map-packet-tags']);
    expect(layer.querySelectorAll('g.map-packet-tags g.packet-tag')).toHaveLength(1);
  });

  it('draws nothing for a scene with no packet', () => {
    const { root } = draw([]);
    expect(root.querySelectorAll('g.map-trace, g.packet-tag')).toHaveLength(0);
  });
});
