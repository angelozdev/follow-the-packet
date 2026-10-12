import { toPlainText, type PacketPorts, type TermText } from '@/copy';
import type { Trace } from '@/engine';
import { PacketTrace, StampPiece } from '@/scene/entities';
import { pathFor, spreadStamps, startsOnMap, translationDistance, type Layout, type PacketTags, type Vec2 } from '@/scene/layout';
import type { OnInspect } from '@/scene/overlay/inspect-handlers';
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

/** The labels a packet wears beside it, with how far along its path they change: nothing for a packet with no ports. */
function tagsOf({ ports }: MapFlow, path: Vec2[], layout: Layout): { tags: PacketTags } | undefined {
  if (!ports) return undefined;
  const changesAt = ports.legs.length > 1 ? translationDistance(path, ports.changesAt, layout) : undefined;
  return { tags: { legs: ports.legs, ...(changesAt !== undefined && { changesAt }) } };
}

/** Draws every live flow and every packet the player sent along its path, each with its stamp at the end; without animations, each path is drawn still. A packet with ports wears a label with its protocol and ports, and the label changes where the router of the office translates them. A packet that starts at a piece the map does not draw is not drawn. */
export function Traffic({ flows, sent, layout, still, onInspect }: { flows: MapFlow[]; sent: MapSent[]; layout: Layout; still: boolean; onInspect: OnInspect }) {
  const packets: (MapFlow & { send?: number })[] = [...flows, ...sent].filter((packet) => startsOnMap(packet.packet, layout));
  const paths = packets.map((packet) => pathFor(packet.trace, packet.packet, layout, packet.hiddenStop));
  const stamps = spreadStamps(paths.map((path) => path[path.length - 1]));
  return (
    <>
      {packets.map((packet, index) => {
        const { stamp, ...look } = flowLook(packet);
        const moving = { path: paths[index], ...look, ...tagsOf(packet, paths[index], layout) };
        return (
          <group key={packet.id}>
            {still && <PacketTrace {...moving} />}
            {!still && (packet.send === undefined ? <FlowTraffic look={moving} index={index} /> : <SentTraffic look={moving} send={packet.send} />)}
            <StampPiece position={stamps[index]} state={stamp} name={toPlainText(packet.label)} pieceId={packet.pieceId} onInspect={onInspect} />
          </group>
        );
      })}
    </>
  );
}
