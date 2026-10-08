import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { cumulativeLengths, pointAt } from '@/scene/layout';
import { ACCENT, INK } from '@/scene/theme';
import { PACKET_SPEED } from './schedule';
import type { Trip } from './use-packet-runs';

export const PACKET_Y = 0.3;
const DOT_RADIUS = 0.17;
const RHOMBUS_RADIUS = 0.24;
const BURST_GROWTH = 3;
const BURST_RING: [number, number, number] = [0.22, 0.3, 24];

/** One packet travelling its trip: an ink dot for legitimate traffic, a vermilion rhombus for the attacker, and a burst where a blocked one stops. */
export function PacketRun({ path, blocked, attacker }: Trip & { attacker: boolean }) {
  const lengths = useMemo(() => cumulativeLengths(path), [path]);
  const total = lengths.at(-1) ?? 0;
  const packet = useRef<Group>(null);
  const burst = useRef<Group>(null);
  const travelled = useRef(0);
  useFrame((_, delta) => {
    travelled.current += delta * PACKET_SPEED;
    const over = travelled.current - total;
    const [x, z] = pointAt(path, lengths, travelled.current);
    if (packet.current) {
      packet.current.position.set(x, PACKET_Y, z);
      packet.current.visible = over <= 0;
    }
    if (burst.current) {
      burst.current.visible = blocked && over > 0;
      burst.current.scale.setScalar(1 + Math.max(over, 0) * BURST_GROWTH);
    }
  });
  const [startX, startZ] = path[0];
  const [endX, endZ] = path[path.length - 1];
  return (
    <>
      <group ref={packet} position={[startX, PACKET_Y, startZ]}>
        <mesh>
          {attacker ? <octahedronGeometry args={[RHOMBUS_RADIUS]} /> : <sphereGeometry args={[DOT_RADIUS, 16, 12]} />}
          <meshStandardMaterial color={attacker ? ACCENT : INK} roughness={1} />
        </mesh>
      </group>
      <group ref={burst} position={[endX, PACKET_Y, endZ]} visible={false}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={BURST_RING} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
      </group>
    </>
  );
}
