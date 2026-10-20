import { lengthOf, positionAt, route, type Graph, type GraphNode, type Point } from '@/scene/layout/graph';
import { station } from '@/scene/layout/stations';
import { CASILLAS, HELPER_PREFIX, fanBox, overlaps, type Box, type FanAxis, type Link, type LinkKind, type Mark, type RowLayout } from './geometry';

export type Waypoint = { name: string; point: Point } | { point: Point };

export interface Road {
  kind: LinkKind;
  via: Waypoint[];
}

export interface MarkSpec {
  station: string;
  facing: string;
  back: number;
}

export interface Plan {
  roads: Road[];
  legs: [string, string][];
  marks: MarkSpec[];
  obstacles: Box[];
}

export type Assembled = Pick<RowLayout, 'nodes' | 'links' | 'stations' | 'marks'>;

const ON_THE_LINE = 1e-6;

function isNamed(waypoint: Waypoint): waypoint is { name: string; point: Point } {
  return 'name' in waypoint;
}

function nodesOf(roads: readonly Road[]): GraphNode[] {
  const found = new Map<string, Point>();
  for (const waypoint of roads.flatMap(({ via }) => via).filter(isNamed)) {
    const known = found.get(waypoint.name);
    if (known !== undefined && (known[0] !== waypoint.point[0] || known[1] !== waypoint.point[1])) throw new Error(`The station ${waypoint.name} stands at two points`);
    found.set(waypoint.name, waypoint.point);
  }
  return [...found].map(([name, point]) => ({ name, point }));
}

function linksOf({ kind, via }: Road): Link[] {
  const links: Link[] = [];
  let start: { name: string; point: Point } | undefined;
  let bends: Point[] = [];
  for (const waypoint of via) {
    if (!isNamed(waypoint)) bends.push(waypoint.point);
    else {
      if (start) links.push({ from: start.name, to: waypoint.name, kind, points: [start.point, ...bends, waypoint.point] });
      [start, bends] = [waypoint, []];
    }
  }
  return links;
}

/** Takes the nodes and links of a layout; returns the graph that `route` walks: the links become edges whose bends are the inner points of the link. */
export function graphOf({ nodes, links }: Pick<RowLayout, 'nodes' | 'links'>): Graph {
  return { nodes, edges: links.map(({ from, to, points }) => ({ from, to, bends: points.slice(1, -1) })) };
}

function isOnSegment([x, y]: Point, [startX, startY]: Point, [endX, endY]: Point): boolean {
  if (startX === endX && startY === endY) return Math.abs(x - startX) <= ON_THE_LINE && Math.abs(y - startY) <= ON_THE_LINE;
  const [along, across] = [(x - startX) * (endX - startX) + (y - startY) * (endY - startY), (x - startX) * (endY - startY) - (y - startY) * (endX - startX)];
  const squared = (endX - startX) ** 2 + (endY - startY) ** 2;
  return Math.abs(across) <= ON_THE_LINE * Math.sqrt(squared) && along >= -ON_THE_LINE && along <= squared + ON_THE_LINE;
}

function isAt([x, y]: Point, [otherX, otherY]: Point): boolean {
  return Math.abs(x - otherX) <= ON_THE_LINE && Math.abs(y - otherY) <= ON_THE_LINE;
}

function splitAt(link: Link, point: Point, name: string): [Link, Link] | undefined {
  const index = link.points.slice(1).findIndex((end, at) => isOnSegment(point, link.points[at], end));
  if (index < 0) return undefined;
  const { from, to, kind, points } = link;
  return [
    { from, to: name, kind, points: [...points.slice(0, index + 1), point] },
    { from: name, to, kind, points: [point, ...points.slice(index + 1)] },
  ];
}

function withMid(nodes: GraphNode[], links: Link[], [before, after]: [string, string]): { nodes: GraphNode[]; links: Link[] } {
  const way = route(graphOf({ nodes, links }), [before, after]);
  const lengths = lengthOf(way);
  const point = positionAt(way, lengths, lengths[lengths.length - 1] / 2);
  const name = station.mid(before, after);
  const onNode = nodes.find((node) => isAt(node.point, point));
  if (onNode) {
    const kind = links.find((link) => link.from === onNode.name || link.to === onNode.name)?.kind ?? 'line';
    return { nodes: [...nodes, { name, point }], links: [...links, { from: onNode.name, to: name, kind, points: [onNode.point, point] }] };
  }
  const halves = links.map((link) => splitAt(link, point, name));
  const at = halves.findIndex((half) => half !== undefined);
  const split = halves[at];
  if (split === undefined) throw new Error(`The middle of ${before} and ${after} falls on no link`);
  return { nodes: [...nodes, { name, point }], links: [...links.slice(0, at), ...split, ...links.slice(at + 1)] };
}

function directionAt(way: readonly Point[], lengths: readonly number[], back: number): FanAxis {
  const end = Math.max(1, lengths.findIndex((length) => length >= back));
  const [from, to] = [way[end - 1], way[end]];
  return from === undefined || to === undefined || Math.abs(to[0] - from[0]) >= Math.abs(to[1] - from[1]) ? 'y' : 'x';
}

function markOf(graph: Graph, { station: name, facing, back }: MarkSpec, avoiding: readonly Box[]): Mark {
  const way = route(graph, [name, facing]);
  const lengths = lengthOf(way);
  const point = positionAt(way, lengths, back);
  const axis = directionAt(way, lengths, back);
  const fits = (casillas: number) => !avoiding.some((other) => overlaps(fanBox(point, axis, casillas), other));
  return { station: name, point, axis, casillas: [CASILLAS, 2, 1].find(fits) ?? 1 };
}

function marksOf(graph: Graph, specs: readonly MarkSpec[], obstacles: readonly Box[]): Mark[] {
  const marks: Mark[] = [];
  for (const spec of specs) marks.push(markOf(graph, spec, [...obstacles, ...marks.map(({ point, axis, casillas }) => fanBox(point, axis, casillas))]));
  return marks;
}

/** Takes the roads of a map (lists of waypoints, named or not), the pairs of stops whose middle the map needs to name, the marks to place and the boxes a fan of stamps must keep clear of; returns the nodes of the graph (one for each name, in the order they first appear, and then the middles), its links with their points, where each station stands (helper nodes left out) and the marks. A middle stands half way along the shortest way between its two stops and splits the link it falls on, so the way through it is the way without it. A mark stands `back` px from its station along the way to the station it faces, and its fan opens across the link there; it holds three casillas, or fewer when a box or the fan of a mark placed before it is in the way. */
export function assemble({ roads, legs, marks, obstacles }: Plan): Assembled {
  const start = { nodes: nodesOf(roads), links: roads.flatMap(linksOf) };
  const { nodes, links } = legs.reduce((built, leg) => withMid(built.nodes, built.links, leg), start);
  const graph = graphOf({ nodes, links });
  const specs = [...marks, ...legs.map(([before, after]) => ({ station: station.mid(before, after), facing: before, back: 0 }))];
  return {
    nodes,
    links,
    stations: Object.fromEntries(nodes.filter(({ name }) => !name.startsWith(HELPER_PREFIX)).map(({ name, point }) => [name, point])),
    marks: marksOf(graph, specs, obstacles),
  };
}
