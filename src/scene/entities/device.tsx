import type { EntityRef, EntityVariants } from '@/copy';
import { tokenPx } from '@/design';
import { EntityIcon } from '@/scene/entities/icons/entity-icon';
import { LABEL_GAP, type Box } from '@/scene/layout/arrange/geometry';

/** Every kind of device the map draws: the ones of a network and the server of the internet. */
export type DeviceVariant = EntityVariants['device'];

interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const ICON_GRID = 24;
const SHAKE_AMPLITUDE = 2;
const SHAKE_DURATION = '0.16s';
const BORDER_GAP = 3;
const MAT_RADIUS = tokenPx('--radius-tile');
const MAT_PAD = LABEL_GAP - tokenPx('--stroke-thin') / 2;
const SHAKE_VALUES = ['0 0', `${SHAKE_AMPLITUDE} 0`, '0 0', `${-SHAKE_AMPLITUDE} 0`, '0 0'].join(';');
const SHAPE_BOUNDS: Record<DeviceVariant, Bounds> = {
  laptop: { left: 3, top: 5, right: 21, bottom: 19 },
  printer: { left: 3, top: 4, right: 21, bottom: 20 },
  'ec2-instance': { left: 4, top: 5, right: 20, bottom: 20 },
  'internet-server': { left: 7, top: 2, right: 17, bottom: 21 },
};

/** Takes an entity of the catalog and the box the layout holds for it; returns its icon of the catalog drawn as large as the box, with a stroke the width of the scale however large it is drawn. */
export function CatalogIcon({ entity, box }: { entity: EntityRef; box: Box }) {
  return (
    <svg className="map-piece__icon" x={box.x} y={box.y} width={box.width} height={box.height}>
      <EntityIcon entity={entity} />
    </svg>
  );
}

function borderOf({ x, y, width }: Box, { left, top, right, bottom }: Bounds): Box {
  const scale = width / ICON_GRID;
  return { x: x + left * scale - BORDER_GAP, y: y + top * scale - BORDER_GAP, width: (right - left) * scale + 2 * BORDER_GAP, height: (bottom - top) * scale + 2 * BORDER_GAP };
}

/** Takes the box of a device, its variant, whether its card is open, whether a forbidden packet got in and whether animations are off; returns its icon of the catalog, larger, on a shaded mat while selected, and, while something forbidden gets in, shaking with animations or, without them, inside a second border. */
export function DevicePiece({ box, variant, selected, intruded, still }: { box: Box; variant: DeviceVariant; selected: boolean; intruded: boolean; still: boolean }) {
  const border = borderOf(box, SHAPE_BOUNDS[variant]);
  return (
    <>
      {selected && <rect className="map-piece__mat" x={box.x - MAT_PAD} y={box.y - MAT_PAD} width={box.width + 2 * MAT_PAD} height={box.height + 2 * MAT_PAD} rx={MAT_RADIUS} />}
      <g>
        {intruded && !still && <animateTransform attributeName="transform" type="translate" values={SHAKE_VALUES} dur={SHAKE_DURATION} repeatCount="indefinite" />}
        <CatalogIcon entity={{ kind: 'device', variant }} box={box} />
        {intruded && still && <rect className="map-piece__border" {...border} />}
      </g>
    </>
  );
}
