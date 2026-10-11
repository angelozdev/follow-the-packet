import { toPlainText, type TermText } from '@/copy';
import type { Trace } from '@/engine';
import { PacketTrace, StampPiece } from '@/scene/entities';
import { pathFor, spreadStamps, startsOnMap, type Layout } from '@/scene/layout';
import type { InspectTrigger } from '@/scene/overlay/inspect-trigger';
import { flowLook, type FlowResult } from './flow-look';
import { FlowTraffic, SentTraffic } from './flow-traffic';

export interface MapFlow extends FlowResult {
  id: string;
  pieceId: string;
  trace: Trace;
  label: TermText;
  hiddenStop: boolean;
}

export interface MapSent extends MapFlow {
  send: number;
}

/** Draws every live flow and every packet the player sent along its path, each with its stamp at the end; without animations, each path is drawn still. A packet that starts at a piece the map does not draw is not drawn. */
export function Traffic({ flows, sent, layout, still, inspectTrigger }: { flows: MapFlow[]; sent: MapSent[]; layout: Layout; still: boolean; inspectTrigger: InspectTrigger }) {
  const packets: (MapFlow & { send?: number })[] = [...flows, ...sent].filter((packet) => startsOnMap(packet.packet, layout));
  const paths = packets.map((packet) => pathFor(packet.trace, packet.packet, layout, packet.hiddenStop));
  const stamps = spreadStamps(paths.map((path) => path[path.length - 1]));
  return (
    <>
      {packets.map((packet, index) => {
        const { stamp, ...look } = flowLook(packet);
        const moving = { path: paths[index], ...look };
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
