import { ContactShadows, MapControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { Checkpoint, Network, PacketSpec, Trace } from '../engine/types';
import type { Candidate } from '../levels/schema';
import { checkpointPosition, computeLayout, pathFor } from './layout';
import { GuardList, StepNotes } from './overlays';
import { PacketRun } from './PacketRun';
import { ActorMark, Barrier, Building, Gateway, PredictRing, Road, Sheet, Zone } from './pieces';
import { ACCENT, INK } from './theme';

export interface GameSceneProps {
  network: Network;
  trace: Trace | null;
  packet: PacketSpec | null;
  runId: number;
  reducedMotion: boolean;
  packetColor: 'accent' | 'ink';
  candidates: Candidate[];
  onPredict: (cp: Checkpoint) => void;
}

export function GameScene({ network, trace, packet, runId, reducedMotion, packetColor, candidates, onPredict }: GameSceneProps) {
  // La distribución es pura y barata: se recalcula en cada render.
  const layout = computeLayout(network);
  const path = trace && packet ? pathFor(trace, packet, layout) : null;
  return (
    <Canvas
      orthographic
      camera={{ position: [14, 14, 14], zoom: 38, near: 0.1, far: 500 }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[8, 14, 6]} intensity={1.1} />
      <MapControls enableRotate={false} minZoom={18} maxZoom={110} screenSpacePanning />
      <Sheet layout={layout} />
      {network.subnets.map((s) => (
        <Zone key={s.id} spot={layout.subnets[s.id]} />
      ))}
      <Road layout={layout} />
      <Gateway position={layout.igw} />
      {network.instances.map((i) => (
        <group key={i.id}>
          <Building spot={layout.instances[i.id]} name={i.name} />
          <Barrier spot={layout.instances[i.id]} />
        </group>
      ))}
      {network.actors.map((a) => (
        <ActorMark key={a.id} position={layout.actors[a.id]} actor={a} />
      ))}
      {candidates.map((c) => (
        <PredictRing key={c.label} position={checkpointPosition(c.checkpoint, layout)} onSelect={() => onPredict(c.checkpoint)} />
      ))}
      {trace && path && (
        <PacketRun
          key={runId}
          path={path}
          reducedMotion={reducedMotion}
          color={packetColor === 'accent' ? ACCENT : INK}
          verdict={trace.outcome === 'replied' ? 'pass' : 'drop'}
        />
      )}
      {trace && <StepNotes trace={trace} layout={layout} />}
      {trace && <GuardList trace={trace} network={network} layout={layout} />}
      <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
    </Canvas>
  );
}
