import { Html } from '@react-three/drei';
import { MAP_TEXT, toPlainText } from '@/copy';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec2 } from '@/scene/layout';
import { inspectHandlers, type OnInspect } from '@/scene/overlay/inspect-handlers';
import type { MapFlow } from './traffic';

const STAMP_Y = 0.9;
const STAMP_LAYERS: [number, number] = [15, 5];

function tone(flow: MapFlow): 'pass' | 'drop' | 'intruder' {
  if (!flow.reached) return 'drop';
  return flow.kind === 'forbidden' ? 'intruder' : 'pass';
}

/** The fixed stamp at the end of a flow's path: ✓ when it gets in, ✕ when it does not; hovering or focusing it inspects the packet. */
export function Stamp({ position, flow, onInspect }: { position: Vec2; flow: MapFlow; onInspect: OnInspect }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={[position[0], STAMP_Y, position[1]]} center zIndexRange={STAMP_LAYERS}>
      <button type="button" className={`stamp stamp--${tone(flow)}`} aria-label={MAP_TEXT.packet(toPlainText(flow.label))} {...inspectHandlers(flow.pieceId, onInspect)}>
        <span aria-hidden="true">{flow.reached ? '✓' : '✕'}</span>
      </button>
    </Html>
  );
}
