import { Canvas } from '@react-three/fiber';
import { useState, type ReactNode } from 'react';
import { HtmlLayerContext } from './html-layer';
import type { Vec3 } from './layout';

const FAR = 500;

/** The canvas every map is drawn on: an orthographic camera at this position looking at the origin, paper light, and an HTML layer for labels, stamps and cards. */
export function MapCanvas({ camera, zoom, children }: { camera: Vec3; zoom: number; children: ReactNode }) {
  const [htmlLayer, setHtmlLayer] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <Canvas orthographic camera={{ position: camera, zoom, near: 0.1, far: FAR }} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} dpr={[1, 2]}>
        <HtmlLayerContext.Provider value={htmlLayer}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[8, 14, 6]} intensity={1.1} />
          {children}
        </HtmlLayerContext.Provider>
      </Canvas>
      <div ref={setHtmlLayer} className="html-layer" />
    </>
  );
}
