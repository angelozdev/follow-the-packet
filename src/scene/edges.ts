export type Point3 = [number, number, number];

/** Las 12 aristas de una caja centrada, como 24 puntos (pares inicio-fin) para drei <Line segments>. */
export function boxEdgePoints(w: number, h: number, d: number): Point3[] {
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  const c: Point3[] = [
    [-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z],
    [-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z],
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  return edges.flatMap(([a, b]) => [c[a], c[b]]);
}
