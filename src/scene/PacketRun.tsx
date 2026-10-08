import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { cumulativeLengths, pointAt, type Vec2 } from './layout';
import { InkBox } from './pieces';

const SPEED = 3.2; // unidades por segundo

/** El paquete viaja por el recorrido y deja un sello al final. Montar con key nueva en cada envío. */
export function PacketRun({ path, reducedMotion, color, verdict }: { path: Vec2[]; reducedMotion: boolean; color: string; verdict: 'pass' | 'drop' }) {
  const group = useRef<Group>(null);
  const travelled = useRef(0);
  const lengths = useMemo(() => cumulativeLengths(path), [path]);
  const total = lengths[lengths.length - 1];
  const [arrived, setArrived] = useState(reducedMotion || total === 0);

  useFrame((_, delta) => {
    if (arrived || !group.current) return;
    travelled.current = Math.min(travelled.current + delta * SPEED, total);
    const [x, z] = pointAt(path, lengths, travelled.current);
    group.current.position.set(x, 0.3, z);
    if (travelled.current >= total) setArrived(true);
  });

  const end = path[path.length - 1];
  const start = arrived ? end : path[0];
  return (
    <>
      <group ref={group} position={[start[0], 0.3, start[1]]}>
        <InkBox size={[0.36, 0.36, 0.36]} position={[0, 0, 0]} fill={color} />
      </group>
      {arrived && (
        <Html position={[end[0], 1.3, end[1]]} center>
          <span className={`stamp stamp--${verdict}`} aria-label={verdict === 'pass' ? 'Pasa' : 'Descartado'}>
            {verdict === 'pass' ? '✓' : '✕'}
          </span>
        </Html>
      )}
    </>
  );
}
