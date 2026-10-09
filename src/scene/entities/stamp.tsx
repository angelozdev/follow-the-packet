import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec2 } from '@/scene/layout';
import { inspectHandlers, type OnInspect } from '@/scene/overlay/inspect-handlers';

export type StampState = 'arrived' | 'blocked' | 'intruder';

const STAMP_Y = 0.9;
const STAMP_LAYERS: [number, number] = [15, 5];
const STAMP_GLYPH: Record<StampState, string> = { arrived: '✓', blocked: '✕', intruder: '✓' };

/** The fixed stamp at the end of a packet's path: ✓ when it gets in, ✕ when it is blocked, a double ring for an intruder; hovering or focusing it inspects the packet. */
export function StampPiece({ position, state, name, pieceId, onInspect }: { position: Vec2; state: StampState; name: string; pieceId: string; onInspect: OnInspect }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={[position[0], STAMP_Y, position[1]]} center zIndexRange={STAMP_LAYERS}>
      <button type="button" className={`stamp stamp--${state}`} aria-label={name} {...inspectHandlers(pieceId, onInspect)}>
        <span aria-hidden="true">{STAMP_GLYPH[state]}</span>
      </button>
    </Html>
  );
}
