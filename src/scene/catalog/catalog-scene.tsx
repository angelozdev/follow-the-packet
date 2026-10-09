import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
import { MapCanvas } from '@/scene/map-canvas';
import { CATALOG_ROWS } from './catalog-cells';
import { CATALOG_ZOOM, catalogSize, catalogTarget, cellPosition, screenToGround } from './catalog-grid';

const CAMERA_OFFSET = 60;
const CAPTION_DOWN = 1.55;
const [CAPTION_X, CAPTION_Z] = screenToGround(0, CAPTION_DOWN);
const COLUMNS = Math.max(...CATALOG_ROWS.map((row) => row.length));
const [TARGET_X, TARGET_Z] = catalogTarget(COLUMNS, CATALOG_ROWS.length);

function Caption({ text }: { text: string }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={[CAPTION_X, 0, CAPTION_Z]} center>
      <p className="catalog__caption">{text}</p>
    </Html>
  );
}

/** Draws the whole entity catalog on one isometric canvas: each cell is a piece in one variant and one state, with a caption under it. */
export function CatalogScene({ still }: { still: boolean }) {
  return (
    <div className="catalog__canvas" style={catalogSize(COLUMNS, CATALOG_ROWS.length)}>
      <MapCanvas camera={[CAMERA_OFFSET, CAMERA_OFFSET, CAMERA_OFFSET]} zoom={CATALOG_ZOOM}>
        <group position={[-TARGET_X, 0, -TARGET_Z]}>
          {CATALOG_ROWS.flatMap((row, rowIndex) =>
            row.map((cell, column) => {
              const [x, z] = cellPosition(column, rowIndex);
              return (
                <group key={cell.id} position={[x, 0, z]}>
                  {cell.draw(still)}
                  <Caption text={cell.caption} />
                </group>
              );
            }),
          )}
        </group>
      </MapCanvas>
    </div>
  );
}
