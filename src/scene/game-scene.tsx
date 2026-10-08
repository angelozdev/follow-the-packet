import { ContactShadows, MapControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import type { Network } from '@/engine';
import { HtmlLayerContext } from './html-layer';
import { computeLayout } from './layout';
import { ActorMark, Barrier, Building, Gateway, Road, Sheet, Zone } from './pieces';

export function GameScene({ network }: { network: Network }) {
  const layout = computeLayout(network);
  const [htmlLayer, setHtmlLayer] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <Canvas
        orthographic
        camera={{ position: [14, 14, 14], zoom: 38, near: 0.1, far: 500 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <HtmlLayerContext.Provider value={htmlLayer}>
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
          <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
        </HtmlLayerContext.Provider>
      </Canvas>
      <div ref={setHtmlLayer} className="html-layer" />
    </>
  );
}
