import type { TermText } from '@/copy';
import type { PacketSpec, Trace } from '@/engine';
import type { FlowKind } from '@/levels';
import { pathFor, spreadStamps, type Layout } from '@/scene/layout';
import type { OnInspect } from '@/scene/overlay/inspect-handlers';
import { FlowTraffic } from './flow-traffic';
import { Stamp } from './stamp';
import { StillPath } from './still-path';

export interface MapFlow {
  id: string;
  pieceId: string;
  kind: FlowKind;
  packet: PacketSpec;
  trace: Trace;
  reached: boolean;
  replied: boolean;
  label: TermText;
}

export function Traffic({ flows, layout, still, onInspect }: { flows: MapFlow[]; layout: Layout; still: boolean; onInspect: OnInspect }) {
  const paths = flows.map((flow) => pathFor(flow.trace, flow.packet, layout));
  const stamps = spreadStamps(paths.map((path) => path[path.length - 1]));
  return (
    <>
      {flows.map((flow, index) => (
        <group key={flow.id}>
          {still ? <StillPath path={paths[index]} reached={flow.reached} /> : <FlowTraffic path={paths[index]} flow={flow} index={index} />}
          <Stamp position={stamps[index]} flow={flow} onInspect={onInspect} />
        </group>
      ))}
    </>
  );
}
