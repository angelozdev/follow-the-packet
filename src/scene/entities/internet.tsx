import type { Box } from '@/scene/layout/arrange/geometry';
import { CatalogIcon } from './device';

/** Takes the box of the stop of the internet; returns its globe, the icon of the catalog drawn as large as the box, over the line that runs through it. */
export function InternetPiece({ box }: { box: Box }) {
  return <CatalogIcon entity={{ kind: 'internet', variant: 'internet' }} box={box} />;
}
