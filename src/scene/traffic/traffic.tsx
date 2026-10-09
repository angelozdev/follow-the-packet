import { MAP_TEXT, toPlainText, type TermText } from '@/copy';
import type { PacketSpec, Trace } from '@/engine';
import type { FlowKind } from '@/levels';
import { PacketTrace, StampPiece, type StampState } from '@/scene/entities';
import { pathFor, spreadStamps, type Layout } from '@/scene/layout';
import type { OnInspect } from '@/scene/overlay/inspect-handlers';
import { FlowTraffic } from './flow-traffic';

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

function stampState(flow: MapFlow): StampState {
  if (!flow.reached) return 'blocked';
  return flow.kind === 'forbidden' ? 'intruder' : 'arrived';
}

export function Traffic({ flows, layout, still, onInspect }: { flows: MapFlow[]; layout: Layout; still: boolean; onInspect: OnInspect }) {
  const paths = flows.map((flow) => pathFor(flow.trace, flow.packet, layout));
  const stamps = spreadStamps(paths.map((path) => path[path.length - 1]));
  return (
    <>
      {flows.map((flow, index) => (
        <group key={flow.id}>
          {still ? <PacketTrace path={paths[index]} reached={flow.reached} /> : <FlowTraffic path={paths[index]} flow={flow} index={index} />}
          <StampPiece position={stamps[index]} state={stampState(flow)} name={MAP_TEXT.packet(toPlainText(flow.label))} pieceId={flow.pieceId} onInspect={onInspect} />
        </group>
      ))}
    </>
  );
}
