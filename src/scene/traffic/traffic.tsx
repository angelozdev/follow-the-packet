import { MAP_TEXT, toPlainText, type TermText } from '@/copy';
import type { Trace } from '@/engine';
import { PacketTrace, StampPiece } from '@/scene/entities';
import { pathFor, spreadStamps, type Layout } from '@/scene/layout';
import type { OnInspect } from '@/scene/overlay/inspect-handlers';
import { flowLook, type FlowResult } from './flow-look';
import { FlowTraffic } from './flow-traffic';

export interface MapFlow extends FlowResult {
  id: string;
  pieceId: string;
  trace: Trace;
  label: TermText;
}

export function Traffic({ flows, layout, still, onInspect }: { flows: MapFlow[]; layout: Layout; still: boolean; onInspect: OnInspect }) {
  const paths = flows.map((flow) => pathFor(flow.trace, flow.packet, layout));
  const stamps = spreadStamps(paths.map((path) => path[path.length - 1]));
  return (
    <>
      {flows.map((flow, index) => {
        const { stamp, ...look } = flowLook(flow);
        return (
          <group key={flow.id}>
            {still ? <PacketTrace path={paths[index]} {...look} /> : <FlowTraffic look={{ path: paths[index], ...look }} index={index} />}
            <StampPiece position={stamps[index]} state={stamp} name={MAP_TEXT.packet(toPlainText(flow.label))} pieceId={flow.pieceId} onInspect={onInspect} />
          </group>
        );
      })}
    </>
  );
}
