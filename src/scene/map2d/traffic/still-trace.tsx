import type { EntityRef } from '@/copy';
import { CatalogIcon } from '@/scene/map2d/entities/device';
import type { Point } from '@/scene/map2d/layout/graph';
import type { StillGlyph, StillPacket } from '@/scene/map2d/marks/still-packets';
import { PacketTag } from './packet-tag';

const LINE_MODIFIER: Partial<Record<StillPacket['end'], string>> = { blocked: 'map-trace__line--blocked', lost: 'map-trace__line--lost' };

function pathData(points: readonly Point[]): string {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}

function entityOf({ variant, intruder }: StillGlyph): EntityRef {
  return variant === 'warning' ? { kind: 'packet', variant } : { kind: 'packet', variant, intruder };
}

/** Takes a shape of the still map (its role, its variant, whether it is an intruder's and its box); returns it drawn as the icon of the catalog at the size of its box: the shape of its protocol, filled when it asks and a ring when it answers, with a second border of the same shape and the danger colour for an intruder, or the triangle with an exclamation mark for a warning. */
export function PacketGlyph({ glyph }: { glyph: StillGlyph }) {
  return (
    <g className={glyph.intruder ? 'map-packet map-packet--intruder' : 'map-packet'} data-role={glyph.role} data-shape={glyph.variant}>
      <CatalogIcon entity={entityOf(glyph)} box={glyph.box} />
    </g>
  );
}

/** Takes a packet of the still map; returns its trace: the line of its path, in danger when a known firewall blocked it and dashed when it was lost, and its shapes over it. */
export function StillTrace({ packet }: { packet: StillPacket }) {
  const modifier = LINE_MODIFIER[packet.end];
  return (
    <g className="map-trace" data-packet={packet.id} data-end={packet.end}>
      <path className={modifier ? `map-trace__line ${modifier}` : 'map-trace__line'} d={pathData(packet.path)} />
      {packet.glyphs.map((glyph) => (
        <PacketGlyph key={glyph.role} glyph={glyph} />
      ))}
    </g>
  );
}

/** Takes the packets of the still map; returns the trace of each one and, over all of them, the label of every packet that has a place for it. */
export function StillTraffic({ packets }: { packets: readonly StillPacket[] }) {
  return (
    <g className="map-traffic">
      {packets.map((packet) => (
        <StillTrace key={packet.id} packet={packet} />
      ))}
      <g className="map-packet-tags">
        {packets.flatMap(({ id, label }) => (label?.place ? [<PacketTag key={id} id={id} text={label.text} box={label.place.box} />] : []))}
      </g>
    </g>
  );
}
