import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useState, type RefObject } from 'react';
import { Vector3, type Camera } from 'three';
import { cardTop, dockHeight, dockOffset, dockRoom, sideHeight, terminalSide, type CardPlacement, type CardPosition, type Vec2, type Vec3 } from '@/scene/layout';

/** Where a card sits: its position, how far from its anchor, in pixels, the map's bottom left corner is (what a docked card hangs from), how far above its anchor the top of a card beside it may rise, and how tall the card may be. */
interface CardSlot {
  position: CardPosition;
  dock: Vec2;
  top: number;
  room: number;
}

/** Returns the value of the CSS length that caps the height of a card. */
export function roomLength(room: number): string {
  return `${room}px`;
}

function pickSlot(projected: Vector3, { position, gap, avoid, labels, rooted }: CardPlacement, camera: Camera, map: { width: number; height: number }): CardSlot {
  const project = (point: Vec3) => projected.set(...point).project(camera);
  const pixelX = (point: Vec3) => ((project(point).x + 1) / 2) * map.width;
  const pixelY = (point: Vec3) => ((1 - project(point).y) / 2) * map.height;
  const anchor: Vec2 = [pixelX(position), pixelY(position)];
  const side = terminalSide(anchor[0], (avoid ?? []).map(pixelX), map.width, gap);
  const docked = dockRoom(labels.map((label, index) => ({ x: pixelX(label), bottom: pixelY(rooted[index]) })), map) ?? dockHeight(map);
  return { position: side, dock: dockOffset(anchor, map), top: cardTop(anchor), room: side === 'dock' ? docked : sideHeight(map) };
}

/** Returns where a card should open, from its first frame and then following the camera while the player pans and zooms: the side with more room, or, for a card that avoids labels, the side where it is clear of them and inside the map, or the dock at the map's bottom left corner when neither side is. The position is state, because it changes the class of the card. The dock offset, the highest a card beside its anchor may rise and the height a card may take are not: they are written on the card's element in the same frame that drei moves the anchor, so a docked card stays on its screen spot while the anchor moves (a pan, or another origin) and never shows a frame between the two. The first value is the one the card renders with. */
export function useCardSide(placement: CardPlacement, card: RefObject<HTMLElement | null>): CardSlot {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const projected = useMemo(() => new Vector3(), []);
  const [first] = useState(() => pickSlot(projected, placement, camera, size));
  const [position, setPosition] = useState(first.position);
  useFrame((state) => {
    const next = pickSlot(projected, placement, state.camera, state.size);
    card.current?.style.setProperty('--card-x', `${next.dock[0]}px`);
    card.current?.style.setProperty('--card-y', `${next.dock[1]}px`);
    card.current?.style.setProperty('--card-top', `${next.top}px`);
    card.current?.style.setProperty('--card-room', roomLength(next.room));
    if (next.position !== position) setPosition(next.position);
  });
  return { position, dock: first.dock, top: first.top, room: first.room };
}
