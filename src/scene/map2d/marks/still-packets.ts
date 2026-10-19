import { replyShape, type PacketPorts, type PacketVariant } from '@/copy';
import { graphOf } from '@/scene/map2d/layout/arrange/assemble';
import type { Box, MapLayout } from '@/scene/map2d/layout/arrange/geometry';
import { captionBoxes } from '@/scene/map2d/layout/captions';
import { lengthOf, route, type Point } from '@/scene/map2d/layout/graph';
import { LABEL_HEIGHT, labelWidth } from '@/scene/map2d/layout/metrics';
import { startsOnMap, station, stationsFor } from '@/scene/map2d/layout/stations';
import { flowLook, type FlowLook } from '@/scene/traffic/flow-look';
import { changeDistance, legTextAt, placeTags, separateGlyphs, type PacketTag, type PlacedTag } from './packet-tags';
import type { Fan, StampedRun } from './stamp-fan';

export const GLYPH_BOX = 40;
export const REPLY_MARK_DISTANCE = 24;

const OUTSIDE = 1000;

const DOORSTEP_PREFIX = station.doorstep('');
const ANSWERED_ENDS: readonly FlowLook['end'][] = ['replied', 'warned'];

export interface StillRun extends StampedRun {
  replied: boolean;
  ports?: PacketPorts;
}

export type GlyphRole = 'going' | 'answer' | 'appears';

export interface StillGlyph {
  role: GlyphRole;
  variant: PacketVariant;
  intruder: boolean;
  point: Point;
  box: Box;
}

export interface StillLabel {
  text: string;
  staysInDevice: boolean;
  place?: PlacedTag;
}

export interface StillPacket {
  id: string;
  path: Point[];
  end: FlowLook['end'];
  glyphs: StillGlyph[];
  label?: StillLabel;
}

export interface Way {
  run: StillRun;
  look: FlowLook;
  stations: string[];
  path: Point[];
  length: number;
}

export interface Seed {
  role: GlyphRole;
  variant: PacketVariant;
  intruder: boolean;
  at: number;
}

/** Takes a run, the layout and the graph of its links (`graphOf`); returns the way of the run: its look, the stations it stops at, the points of its path and the length of the path. */
export function wayOf(run: StillRun, layout: MapLayout, graph: ReturnType<typeof graphOf>): Way {
  const stations = stationsFor(run.trace, run.packet, layout.drawn, { hiddenStop: run.hiddenStop });
  const path = route(graph, stations);
  return { run, look: flowLook(run), stations, path, length: lengthOf(path).at(-1) ?? 0 };
}

function answerOf({ end, message, intruder }: FlowLook): Pick<Seed, 'variant' | 'intruder'> {
  return end === 'warned' ? { variant: 'warning', intruder: false } : { variant: replyShape(message), intruder };
}

/** Takes a way; returns the shapes it draws, each with its role, its variant, whether it is an intruder's and the distance along the path where it stands: the shape of the protocol halfway, the ring or the warning that comes back near the start of an answered packet, and the warning of the sender's own device at the end of the path, where nothing leaves. */
export function seedsOf({ look, length }: Way): Seed[] {
  if (look.end === 'self-warned') return [{ role: 'appears', variant: 'warning', intruder: false, at: length }];
  const going: Seed = { role: 'going', variant: look.message, intruder: look.intruder, at: length / 2 };
  return ANSWERED_ENDS.includes(look.end) ? [going, { role: 'answer', ...answerOf(look), at: Math.min(REPLY_MARK_DISTANCE, length / 4) }] : [going];
}

function boxAround([x, y]: Point): Box {
  return { x: x - GLYPH_BOX / 2, y: y - GLYPH_BOX / 2, width: GLYPH_BOX, height: GLYPH_BOX };
}

function glyphsOf(ways: readonly Way[]): Map<string, StillGlyph[]> {
  const entries = ways.flatMap((way) => seedsOf(way).map((seed) => ({ way, seed })));
  const placed = separateGlyphs(entries.map(({ way, seed }) => ({ id: `${way.run.id}:${seed.role}`, path: way.path, at: seed.at })));
  const glyphs = new Map<string, StillGlyph[]>(ways.map(({ run }) => [run.id, []]));
  entries.forEach(({ way, seed: { role, variant, intruder } }, index) => {
    const { point } = placed[index];
    glyphs.get(way.run.id)?.push({ role, variant, intruder, point, box: boxAround(point) });
  });
  return glyphs;
}

function outsideOf({ width, height }: MapLayout['size']): Box[] {
  return [
    { x: -OUTSIDE, y: -OUTSIDE, width: OUTSIDE, height: height + 2 * OUTSIDE },
    { x: width, y: -OUTSIDE, width: OUTSIDE, height: height + 2 * OUTSIDE },
    { x: -OUTSIDE, y: -OUTSIDE, width: width + 2 * OUTSIDE, height: OUTSIDE },
    { x: -OUTSIDE, y: height, width: width + 2 * OUTSIDE, height: OUTSIDE },
  ];
}

/** Takes a run, the points of its path and the layout; returns how far along the path the ports of the packet change, where the router that translates them stands on it: undefined when the packet has one leg, when the map does not draw that router or when the path does not pass there. */
export function translationAt({ ports }: StillRun, path: readonly Point[], layout: MapLayout): number | undefined {
  const router = ports?.changesAt === undefined ? undefined : layout.stations[station.router(ports.changesAt)];
  return changeDistance(path, router);
}

function labelRequest({ run, look, stations, path, length }: Way, layout: MapLayout): { text: string; staysInDevice: boolean; tag: PacketTag } | undefined {
  if (run.ports === undefined || look.end === 'self-warned') return undefined;
  const text = legTextAt(run.ports.legs, translationAt(run, path, layout), length / 2);
  const staysInDevice = stations.at(-1)?.startsWith(DOORSTEP_PREFIX) === true;
  const size = { width: labelWidth(text), height: LABEL_HEIGHT };
  return { text, staysInDevice, tag: { id: run.id, stamp: run.id, staysInDevice, path, size } };
}

function obstaclesOf(layout: MapLayout, fans: readonly Fan[], glyphs: readonly StillGlyph[]): Box[] {
  const stamps = fans.flatMap(({ stamps: drawn, more }) => [...drawn.map(({ box }) => box), ...(more ? [more.box] : [])]);
  return [...Object.values(layout.labels), ...Object.values(layout.icons), ...Object.values(captionBoxes(layout.groups)), ...stamps, ...glyphs.map(({ box }) => box), ...outsideOf(layout.size)];
}

/** Takes the runs the map draws (the live flows and what the player sent, in the order they stand), the layout and the fans of the stamps; returns, for each run that starts at a piece the map draws, what the still map draws of it: the points of its path, how its run ends, its shapes (the shape of its protocol halfway, the ring of the answer or the warning that came back 24 px from the start, a quarter of the way along a short path, and the warning of the sender's own device at the end of the path, where nothing leaves) and, for a packet with ports that has a shape halfway, its label. A shape that falls on the point of another moves 12 px along its own path. The label says, in plain text, the leg where the packet stands halfway (the second leg when the router that translates its ports lies before the middle of the path) and stands where `placeTags` puts it, clear of the labels of the pieces, the icons, the names of the groups, the stamps and every shape, its own included, and inside the drawing; the label of a packet whose stamp went into a «+N», and that of a packet that never leaves its device and finds no place, have text and no place. */
export function stillPackets(runs: readonly StillRun[], layout: MapLayout, fans: readonly Fan[]): StillPacket[] {
  const graph = graphOf(layout);
  const ways = runs.filter((run) => startsOnMap(run.packet, layout.drawn)).map((run) => wayOf(run, layout, graph));
  const glyphs = glyphsOf(ways);
  const requests = ways.map((way) => labelRequest(way, layout));
  const obstacles = obstaclesOf(layout, fans, [...glyphs.values()].flat());
  const places = new Map(placeTags(requests.flatMap((request) => (request ? [request.tag] : [])), obstacles, fans).map((place) => [place.id, place]));
  return ways.map(({ run, look, path }, index) => {
    const request = requests[index];
    const place = places.get(run.id);
    return {
      id: run.id,
      path,
      end: look.end,
      glyphs: glyphs.get(run.id) ?? [],
      ...(request && { label: { text: request.text, staysInDevice: request.staysInDevice, ...(place && { place }) } }),
    };
  });
}
