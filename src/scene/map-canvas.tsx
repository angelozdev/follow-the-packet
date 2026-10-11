import { Canvas } from '@react-three/fiber';
import { useState, type ReactNode } from 'react';
import { OrthographicCamera } from 'three';
import { HtmlLayerContext } from './html-layer';
import type { Vec3 } from './layout';

const FAR = 500;
const ORIGIN: Vec3 = [0, 0, 0];

function rotationToFace(from: Vec3, target: Vec3): Vec3 {
  const camera = new OrthographicCamera();
  camera.position.set(...from);
  camera.lookAt(...target);
  return [camera.rotation.x, camera.rotation.y, camera.rotation.z];
}

/** The canvas every map is drawn on: an orthographic camera at `camera` that faces `target` (the origin unless given another point) from its first frame, paper light, and an HTML layer for labels, stamps and cards. */
export function MapCanvas({ camera, target = ORIGIN, zoom, children }: { camera: Vec3; target?: Vec3; zoom: number; children: ReactNode }) {
  const [htmlLayer, setHtmlLayer] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <Canvas orthographic camera={{ position: camera, rotation: rotationToFace(camera, target), zoom, near: 0.1, far: FAR }} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} dpr={[1, 2]}>
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
