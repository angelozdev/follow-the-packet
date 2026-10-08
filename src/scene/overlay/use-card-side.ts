import { useFrame } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { Vector3 } from 'three';
import { sideForNdc, type CardSide, type Vec3 } from '@/scene/layout';

/** Returns the side of its anchor a card should open on, following the camera while the player pans and zooms. */
export function useCardSide([x, y, z]: Vec3): CardSide {
  const [side, setSide] = useState<CardSide>('right');
  const projected = useMemo(() => new Vector3(), []);
  useFrame(({ camera }) => {
    const next = sideForNdc(projected.set(x, y, z).project(camera).x);
    if (next !== side) setSide(next);
  });
  return side;
}
