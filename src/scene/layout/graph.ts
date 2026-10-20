export type Point = [number, number];

/** A station of the map: a name, and the point of the drawing where it stands. */
export interface GraphNode {
  name: string;
  point: Point;
}

/** A link between two stations. `bends` are the points where the drawn link turns, listed from `from` to `to`. */
export interface GraphEdge {
  from: string;
  to: string;
  bends?: readonly Point[];
}

/** The stations of a map as nodes and its links as edges, which can be walked in either direction. The order of `nodes` breaks the ties of `route`. */
export interface Graph {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
}

interface Link {
  to: number;
  length: number;
  walk: Point[];
}

interface Arrival {
  from: number;
  link: Link;
}

const SAME_LENGTH = 1e-9;

/** Takes a path and returns the distance walked when each of its points is reached, the first being 0: the last one is the length of the path. */
export function lengthOf(path: readonly Point[]): number[] {
  const walked = [0];
  path.slice(1).forEach(([x, y], index) => {
    const [fromX, fromY] = path[index];
    walked.push(walked[index] + Math.hypot(x - fromX, y - fromY));
  });
  return walked;
}

/** Takes a path, what `lengthOf` measured on it and a distance along it; returns the point at that distance, and the nearest end of the path when the distance falls outside it. */
export function positionAt(path: readonly Point[], lengths: readonly number[], distance: number): Point {
  if (path.length === 1) return path[0];
  const along = Math.min(Math.max(distance, 0), lengths[lengths.length - 1]);
  const end = Math.max(1, Math.min(lengths.findIndex((length) => length >= along), lengths.length - 1));
  const [before, after] = [end - 1, end];
  const span = lengths[after] - lengths[before];
  const share = span === 0 ? 1 : (along - lengths[before]) / span;
  return [path[before][0] + (path[after][0] - path[before][0]) * share, path[before][1] + (path[after][1] - path[before][1]) * share];
}

function indexByName(graph: Graph): (name: string) => number {
  const indexes = new Map(graph.nodes.map(({ name }, index) => [name, index]));
  return (name) => {
    const index = indexes.get(name);
    if (index === undefined) throw new Error(`There is no station named ${name}`);
    return index;
  };
}

function linksOf(graph: Graph, indexOf: (name: string) => number): Link[][] {
  const links: Link[][] = graph.nodes.map(() => []);
  for (const { from, to, bends = [] } of graph.edges) {
    const [start, end] = [indexOf(from), indexOf(to)];
    const [startPoint, endPoint] = [graph.nodes[start].point, graph.nodes[end].point];
    const length = lengthOf([startPoint, ...bends, endPoint]).at(-1) ?? 0;
    links[start].push({ to: end, length, walk: [...bends, endPoint] });
    links[end].push({ to: start, length, walk: [...bends].reverse().concat([startPoint]) });
  }
  return links;
}

function closestUnsettled(distances: readonly number[], settled: readonly boolean[]): number | undefined {
  let closest: number | undefined;
  distances.forEach((distance, index) => {
    if (!settled[index] && distance < Infinity && (closest === undefined || distance < distances[closest])) closest = index;
  });
  return closest;
}

function arrivalsFrom(links: readonly Link[][], source: number): (Arrival | undefined)[] {
  const distances = links.map(() => Infinity);
  const settled = links.map(() => false);
  const arrivals: (Arrival | undefined)[] = links.map(() => undefined);
  distances[source] = 0;
  for (let current = closestUnsettled(distances, settled); current !== undefined; current = closestUnsettled(distances, settled)) {
    settled[current] = true;
    for (const link of links[current]) {
      if (settled[link.to]) continue;
      const reached = distances[current] + link.length;
      const shorter = reached < distances[link.to] - SAME_LENGTH;
      const tied = Math.abs(reached - distances[link.to]) <= SAME_LENGTH && current < (arrivals[link.to]?.from ?? Infinity);
      if (shorter) distances[link.to] = reached;
      if (shorter || tied) arrivals[link.to] = { from: current, link };
    }
  }
  return arrivals;
}

function legBetween(links: readonly Link[][], nodes: readonly GraphNode[], source: number, target: number): Point[] {
  const arrivals = arrivalsFrom(links, source);
  const walks: Point[][] = [];
  for (let at = target; at !== source; ) {
    const arrival = arrivals[at];
    if (arrival === undefined) throw new Error(`There is no way from ${nodes[source].name} to ${nodes[target].name}`);
    walks.unshift(arrival.link.walk);
    at = arrival.from;
  }
  return walks.flat();
}

/** Takes the graph of a map and the stations a packet goes through, in order; returns the points of its way: the point of the first station, and, for each next one, the points of the shortest way along the links from the one before it (the bends of the links included, the station last). Between two ways of the same length the one that goes through the node that comes first in `nodes` wins, so the same graph always gives the same way. Throws when a station is not in the graph or no links join two of them. */
export function route(graph: Graph, stations: readonly string[]): Point[] {
  const indexOf = indexByName(graph);
  const links = linksOf(graph, indexOf);
  const [first, ...rest] = stations.map(indexOf);
  if (first === undefined) return [];
  const legs = rest.map((target, leg) => legBetween(links, graph.nodes, leg === 0 ? first : rest[leg - 1], target));
  return [graph.nodes[first].point, ...legs.flat()];
}
