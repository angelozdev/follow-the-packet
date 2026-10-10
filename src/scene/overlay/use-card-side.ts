import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { Vector3, type Camera } from 'three';
import { sideForNdc, terminalSide, type CardPlacement, type CardSide, type Vec3 } from '@/scene/layout';

function pickSide(projected: Vector3, { position, gap, avoid }: CardPlacement, camera: Camera, width: number): CardSide {
  const ndcX = (point: Vec3) => projected.set(...point).project(camera).x;
  const pixelX = (point: Vec3) => ((ndcX(point) + 1) / 2) * width;
  return avoid ? terminalSide(pixelX(position), avoid.map(pixelX), width, gap) : sideForNdc(ndcX(position));
}

/** Returns the side of its anchor a card should open on, from its first frame and then following the camera while the player pans and zooms: the side with more room, or, for a card that avoids labels, the side where it is clear of them and inside the map. */
export function useCardSide(placement: CardPlacement): CardSide {
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const projected = useMemo(() => new Vector3(), []);
  const [side, setSide] = useState<CardSide>(() => pickSide(projected, placement, camera, width));
  useFrame((state) => {
    const next = pickSide(projected, placement, state.camera, state.size.width);
    if (next !== side) setSide(next);
  });
  return side;
}
