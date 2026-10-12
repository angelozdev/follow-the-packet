import { toPlainText, type PacketPorts, type TermText } from '@/copy';
import type { Trace } from '@/engine';
import { PacketTrace, StampPiece } from '@/scene/entities';
import { pathFor, spreadStamps, spreadTags, startsOnMap, translationDistance, type Layout, type PacketTags, type Vec2 } from '@/scene/layout';
import type { InspectTrigger } from '@/scene/overlay/inspect-trigger';
import { flowLook, type FlowResult } from './flow-look';
import { FlowTraffic, SentTraffic } from './flow-traffic';

export interface MapFlow extends FlowResult {
  id: string;
  pieceId: string;
  trace: Trace;
  label: TermText;
  hiddenStop: boolean;
  ports?: PacketPorts;
}

export interface MapSent extends MapFlow {
  send: number;
}

/** The labels a packet wears beside it, with how far along its path they change and how far on the ground its label stands from the middle of the path (`apart`, from `spreadTags`): nothing for a packet with no ports. */
function tagsOf({ ports }: MapFlow, path: Vec2[], layout: Layout, apart: Vec2): { tags: PacketTags } | undefined {
  if (!ports) return undefined;
  const changesAt = ports.legs.length > 1 ? translationDistance(path, ports.changesAt, layout) : undefined;
  return { tags: { legs: ports.legs, apart, ...(changesAt !== undefined && { changesAt }) } };
}

/** Draws every live flow and every packet the player sent along its path, each with its stamp at the end; without animations, each path is drawn still. A packet with ports wears a label with its protocol and ports, and the label changes where the router of the office translates them. A packet that starts at a piece the map does not draw is not drawn. */
export function Traffic({ flows, sent, layout, still, inspectTrigger }: { flows: MapFlow[]; sent: MapSent[]; layout: Layout; still: boolean; inspectTrigger: InspectTrigger }) {
  const packets: (MapFlow & { send?: number })[] = [...flows, ...sent].filter((packet) => startsOnMap(packet.packet, layout));
  const paths = packets.map((packet) => pathFor(packet.trace, packet.packet, layout, packet.hiddenStop));
  const stamps = spreadStamps(paths.map((path) => path[path.length - 1]));
  const wearing = packets.flatMap((packet, index) => (packet.ports ? [index] : []));
  const apart = spreadTags(wearing.map((index) => paths[index]), Object.values(layout.floors).map(({ label }): Vec2 => [label[0], label[2]]));
  return (
    <>
      {packets.map((packet, index) => {
        const { stamp, ...look } = flowLook(packet);
        const moving = { path: paths[index], ...look, ...tagsOf(packet, paths[index], layout, apart[wearing.indexOf(index)] ?? [0, 0]) };
        return (
          <group key={packet.id}>
            {still && <PacketTrace {...moving} />}
            {!still && (packet.send === undefined ? <FlowTraffic look={moving} index={index} /> : <SentTraffic look={moving} send={packet.send} />)}
            <StampPiece position={stamps[index]} state={stamp} name={toPlainText(packet.label)} trigger={inspectTrigger(packet.pieceId)} />
          </group>
        );
      })}
    </>
  );
}
