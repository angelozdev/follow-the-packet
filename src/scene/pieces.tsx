import { Html, Line } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { Actor } from '../engine/types';
import { boxEdgePoints } from './edges';
import { useHtmlPortal } from './htmlLayer';
import type { InstanceSpot, Layout, SubnetSpot, Vec2 } from './layout';
import { ACCENT, INK, PAPER_FILL, PAPER_SHADE } from './theme';

type V3 = [number, number, number];

/** Caja con relleno de papel y aristas de tinta de grosor real (Line2). */
export function InkBox({ size, position, fill = PAPER_FILL, lineWidth = 1.5 }: { size: V3; position: V3; fill?: string; lineWidth?: number }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={fill} roughness={1} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={boxEdgePoints(size[0], size[1], size[2])} segments color={INK} lineWidth={lineWidth} />
    </group>
  );
}

export function Label({ position, children, tone = 'plain' }: { position: V3; children: ReactNode; tone?: 'plain' | 'mono' | 'accent' }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={position} center zIndexRange={[10, 0]}>
      <span className={`label3d label3d--${tone}`}>{children}</span>
    </Html>
  );
}

export function Sheet({ layout }: { layout: Layout }) {
  return <InkBox size={[layout.sheet.width, 0.2, layout.sheet.depth]} position={[0, -0.1, 0]} lineWidth={2} />;
}

export function Zone({ spot }: { spot: SubnetSpot }) {
  const { x, z, width: w, depth: d } = spot;
  const corners: V3[] = [
    [x - w / 2, 0.01, z - d / 2],
    [x + w / 2, 0.01, z - d / 2],
    [x + w / 2, 0.01, z + d / 2],
    [x - w / 2, 0.01, z + d / 2],
    [x - w / 2, 0.01, z - d / 2],
  ];
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.005, z]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color={PAPER_SHADE} />
      </mesh>
      <Line points={corners} color={INK} lineWidth={1.2} dashed dashSize={0.3} gapSize={0.18} />
      <Label position={[x - w / 2 + 0.9, 0.05, z + d / 2 - 0.35]} tone="mono">
        {spot.az}
      </Label>
    </group>
  );
}

export function Road({ layout }: { layout: Layout }) {
  const { roadZ: z, roadFromX: x1, roadToX: x2 } = layout;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[(x1 + x2) / 2, 0.012, z]}>
        <planeGeometry args={[x2 - x1, 0.7]} />
        <meshBasicMaterial color={PAPER_SHADE} />
      </mesh>
      <Line points={[[x1, 0.02, z - 0.35], [x2, 0.02, z - 0.35]]} color={INK} lineWidth={1} />
      <Line points={[[x1, 0.02, z + 0.35], [x2, 0.02, z + 0.35]]} color={INK} lineWidth={1} />
      {Object.entries(layout.instances).map(([id, spot]) => (
        <mesh key={id} rotation-x={-Math.PI / 2} position={[spot.x, 0.012, (spot.door[1] + z) / 2]}>
          <planeGeometry args={[0.5, z - spot.door[1]]} />
          <meshBasicMaterial color={PAPER_SHADE} />
        </mesh>
      ))}
    </group>
  );
}

export function Building({ spot, name }: { spot: InstanceSpot; name: string }) {
  return (
    <group>
      <InkBox size={[1.6, 1.1, 1.2]} position={[spot.x, 0.55, spot.z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[spot.x, 1.16, spot.z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[spot.x, 0.28, spot.z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
      <Label position={[spot.x, 1.75, spot.z]}>{name}</Label>
    </group>
  );
}

export function Barrier({ spot }: { spot: InstanceSpot }) {
  const [x, z] = spot.barrier;
  return (
    <group>
      <InkBox size={[0.1, 0.5, 0.1]} position={[x - 0.6, 0.25, z]} />
      <InkBox size={[0.1, 0.5, 0.1]} position={[x + 0.6, 0.25, z]} />
      <InkBox size={[1.2, 0.07, 0.07]} position={[x, 0.46, z]} fill={ACCENT} lineWidth={1} />
    </group>
  );
}

export function Gateway({ position }: { position: Vec2 }) {
  const [x, z] = position;
  return (
    <group>
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z - 0.65]} />
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z + 0.65]} />
      <InkBox size={[0.3, 0.2, 1.6]} position={[x, 1.38, z]} fill={PAPER_SHADE} />
      <Label position={[x, 1.95, z]}>internet gateway</Label>
    </group>
  );
}

export function ActorMark({ position, actor }: { position: Vec2; actor: Actor }) {
  const [x, z] = position;
  return (
    <group>
      <InkBox size={[0.5, 0.5, 0.5]} position={[x, 0.25, z]} fill={actor.kind === 'attacker' ? INK : PAPER_FILL} />
      <Label position={[x, 0.95, z]}>{actor.name}</Label>
      <Label position={[x, 0.05, z + 0.65]} tone="mono">
        {actor.ip}
      </Label>
    </group>
  );
}

export function PredictRing({ position, onSelect }: { position: Vec2; onSelect: () => void }) {
  const [x, z] = position;
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[x, 0.04, z]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <ringGeometry args={[0.4, 0.55, 40]} />
      <meshBasicMaterial color={ACCENT} transparent opacity={0.85} />
    </mesh>
  );
}
