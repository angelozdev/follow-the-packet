import type { ReactNode } from 'react';
import type { Network } from '@/engine';
import { tokenPx } from '@/design';
import type { Box } from '@/scene/map2d/layout/arrange/geometry';

const BODY_RADIUS = tokenPx('--radius');
const BODY_LEFT = 6;
const BODY_WIDTH = 36;
const PORT_XS = [12, 21, 30];
const ANTENNAS = ['M15 15L10 2', 'M33 15L38 2'];
const DOOR = 'M19 38V25a5 5 0 0 1 10 0v13';

function Body({ top, height }: { top: number; height: number }) {
  return <rect className="map-piece__shade" x={BODY_LEFT} y={top} width={BODY_WIDTH} height={height} rx={BODY_RADIUS} />;
}

function Router() {
  return (
    <>
      {ANTENNAS.map((antenna) => (
        <path key={antenna} className="map-antenna map-piece__line" d={antenna} />
      ))}
      <Body top={15} height={18} />
      {PORT_XS.map((x) => (
        <rect key={x} className="map-port map-piece__ink map-piece__thin" x={x} y={22} width={6} height={4} />
      ))}
    </>
  );
}

function InternetGateway() {
  return (
    <>
      <Body top={10} height={28} />
      <path d={DOOR} />
    </>
  );
}

const EDGE_FRONT: Record<Network['edge'], ReactNode> = { router: <Router />, 'internet-gateway': <InternetGateway /> };

/** Takes the box of a stop of the main line and the variant of the edge; returns its front, drawn over the line: a low box with two antennas in a V and three ports for a router, and a taller box with no antennas and an arched door for an Internet gateway. */
export function EdgePiece({ box, variant }: { box: Box; variant: Network['edge'] }) {
  return <g transform={`translate(${box.x} ${box.y})`}>{EDGE_FRONT[variant]}</g>;
}
