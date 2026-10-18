import { describe, expect, it } from 'vitest';
import { lengthOf, positionAt, route, type Graph, type Point } from './graph';

const node = (name: string, x: number, y: number) => ({ name, point: [x, y] as Point });

describe('route', () => {
  const crossroads: Graph = {
    nodes: [node('A', 0, 0), node('B', 4, 0), node('C', 8, 0), node('D', 0, 6)],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'A', to: 'D' },
      { from: 'D', to: 'C' },
    ],
  };

  it('route finds the shortest way between two stations along the links', () => {
    expect(route(crossroads, ['A', 'C'])).toEqual([[0, 0], [4, 0], [8, 0]]);
    expect(route(crossroads, ['C', 'A'])).toEqual([[8, 0], [4, 0], [0, 0]]);
    expect(lengthOf(route(crossroads, ['A', 'C'])).at(-1)).toBe(8);
  });

  it('route completes every leg between the stations it is given and joins them at the station', () => {
    expect(route(crossroads, ['A', 'C', 'D'])).toEqual([[0, 0], [4, 0], [8, 0], [0, 6]]);
    expect(route(crossroads, ['B'])).toEqual([[4, 0]]);
    expect(route(crossroads, [])).toEqual([]);
    expect(route(crossroads, ['A', 'A'])).toEqual([[0, 0]]);
  });

  describe('when two ways are equally short', () => {
    const corners = { A: node('A', 0, 0), B: node('B', 2, 2), C: node('C', 2, -2), D: node('D', 4, 0) };
    const diamond = (order: ('A' | 'B' | 'C' | 'D')[]): Graph => ({
      nodes: order.map((name) => corners[name]),
      edges: [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
        { from: 'B', to: 'D' },
        { from: 'C', to: 'D' },
      ],
    });
    const viaB: Point[] = [[0, 0], [2, 2], [4, 0]];
    const viaC: Point[] = [[0, 0], [2, -2], [4, 0]];

    it('route breaks a tie by the order of the nodes, so the same graph gives the same way', () => {
      expect(lengthOf(viaB).at(-1)).toBe(lengthOf(viaC).at(-1));
      expect(route(diamond(['A', 'B', 'C', 'D']), ['A', 'D'])).toEqual(viaB);
      expect(route(diamond(['A', 'C', 'B', 'D']), ['A', 'D'])).toEqual(viaC);
      expect(route(diamond(['A', 'B', 'C', 'D']), ['A', 'D'])).toEqual(route(diamond(['A', 'B', 'C', 'D']), ['A', 'D']));
    });

    it('the order in which the links are listed does not decide the way', () => {
      const graph = diamond(['A', 'C', 'B', 'D']);
      expect(route({ ...graph, edges: [...graph.edges].reverse() }, ['A', 'D'])).toEqual(viaC);
      expect(route({ ...graph, edges: graph.edges.map(({ from, to }) => ({ from: to, to: from })) }, ['A', 'D'])).toEqual(viaC);
    });

    it('route breaks a tie by the order of the nodes even when the other way reaches its last link first', () => {
      const corner = (order: ('B' | 'C')[]): Graph => ({
        nodes: [node('A', 0, 0), ...order.map((name) => (name === 'B' ? node('B', 3, 0) : node('C', 0, 4))), node('D', 3, 4)],
        edges: [
          { from: 'A', to: 'B' },
          { from: 'A', to: 'C' },
          { from: 'B', to: 'D' },
          { from: 'C', to: 'D' },
        ],
      });
      expect(route(corner(['B', 'C']), ['A', 'D'])).toEqual([[0, 0], [3, 0], [3, 4]]);
      expect(route(corner(['C', 'B']), ['A', 'D'])).toEqual([[0, 0], [0, 4], [3, 4]]);
    });

    it('a tie in the middle of a longer way is broken the same way', () => {
      const graph: Graph = { ...diamond(['A', 'B', 'C', 'D']), nodes: [...diamond(['A', 'B', 'C', 'D']).nodes, node('E', 6, 0)], edges: [...diamond(['A', 'B', 'C', 'D']).edges, { from: 'D', to: 'E' }] };
      expect(route(graph, ['A', 'E'])).toEqual([...viaB, [6, 0]]);
    });
  });

  describe('a link with bends', () => {
    const bent: Graph = {
      nodes: [node('A', 0, 0), node('B', 6, 0), node('C', 3, 5)],
      edges: [{ from: 'A', to: 'B', bends: [[0, 3], [6, 3]] }],
    };

    it('a bend of a link is part of the route', () => {
      expect(route(bent, ['A', 'B'])).toEqual([[0, 0], [0, 3], [6, 3], [6, 0]]);
      expect(route(bent, ['B', 'A'])).toEqual([[6, 0], [6, 3], [0, 3], [0, 0]]);
      expect(lengthOf(route(bent, ['A', 'B'])).at(-1)).toBe(12);
    });

    it('a bend lengthens its link, so a straighter way around can be the shortest', () => {
      const around: Graph = { ...bent, edges: [...bent.edges, { from: 'A', to: 'C' }, { from: 'C', to: 'B' }] };
      expect(route(around, ['A', 'B'])).toEqual([[0, 0], [3, 5], [6, 0]]);
      const unbent: Graph = { ...around, edges: around.edges.map((edge) => ({ from: edge.from, to: edge.to })) };
      expect(route(unbent, ['A', 'B'])).toEqual([[0, 0], [6, 0]]);
    });

    it('the bends of every link of a way come in order', () => {
      const chain: Graph = {
        nodes: [node('A', 0, 0), node('B', 4, 4), node('C', 8, 0)],
        edges: [{ from: 'A', to: 'B', bends: [[0, 4]] }, { from: 'B', to: 'C', bends: [[8, 4]] }],
      };
      expect(route(chain, ['A', 'C'])).toEqual([[0, 0], [0, 4], [4, 4], [8, 4], [8, 0]]);
      expect(route(chain, ['C', 'A'])).toEqual([[8, 0], [8, 4], [4, 4], [0, 4], [0, 0]]);
    });
  });

  it('a route to a station that does not exist throws', () => {
    expect(() => route(crossroads, ['A', 'nowhere'])).toThrow('nowhere');
    expect(() => route(crossroads, ['nowhere', 'A'])).toThrow('nowhere');
    expect(() => route(crossroads, ['nowhere'])).toThrow('nowhere');
    expect(() => route(crossroads, ['A', 'B', 'nowhere', 'C'])).toThrow('nowhere');
  });

  it('a link to a station that does not exist throws', () => {
    expect(() => route({ nodes: [node('A', 0, 0)], edges: [{ from: 'A', to: 'nowhere' }] }, ['A'])).toThrow('nowhere');
  });

  it('a route between stations that no link joins throws', () => {
    const apart: Graph = { nodes: [node('A', 0, 0), node('B', 1, 0), node('C', 5, 5)], edges: [{ from: 'A', to: 'B' }] };
    expect(() => route(apart, ['A', 'C'])).toThrow('C');
  });
});

describe('positionAt', () => {
  const path: Point[] = [[0, 0], [2, 0], [2, 2]];

  it('positionAt walks the segments in order, as lengthOf measures them', () => {
    const lengths = lengthOf(path);
    expect(lengths).toEqual([0, 2, 4]);
    expect(positionAt(path, lengths, 1)).toEqual([1, 0]);
    expect(positionAt(path, lengths, 3)).toEqual([2, 1]);
    expect(positionAt(path, lengths, 99)).toEqual([2, 2]);
  });

  it('positionAt holds the ends of the path for a distance outside it', () => {
    const lengths = lengthOf(path);
    expect(positionAt(path, lengths, -5)).toEqual([0, 0]);
    expect(positionAt(path, lengths, 0)).toEqual([0, 0]);
    expect(positionAt(path, lengths, 4)).toEqual([2, 2]);
  });

  it('a path of one point stands where it is, and a segment of no length does not divide by zero', () => {
    expect(positionAt([[3, 4]], lengthOf([[3, 4]]), 10)).toEqual([3, 4]);
    const doubled: Point[] = [[0, 0], [0, 0], [4, 0]];
    expect(positionAt(doubled, lengthOf(doubled), 2)).toEqual([2, 0]);
  });
});

describe('lengthOf', () => {
  it('lengthOf gives the distance walked at each point of a path', () => {
    expect(lengthOf([[0, 0], [3, 4], [3, 10]])).toEqual([0, 5, 11]);
    expect(lengthOf([[1, 1]])).toEqual([0]);
  });
});
