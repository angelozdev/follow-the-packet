import { PacketRun } from '@/scene/entities';
import { roundTrip, type Vec2 } from '@/scene/layout';
import type { MapFlow } from './traffic';
import { usePacketRuns } from './use-packet-runs';

export function FlowTraffic({ path, flow, index }: { path: Vec2[]; flow: MapFlow; index: number }) {
  const runs = usePacketRuns({ path: flow.replied ? roundTrip(path) : path, blocked: !flow.reached }, index);
  return (
    <>
      {runs.map((run) => (
        <PacketRun key={run.key} path={run.path} blocked={run.blocked} intruder={flow.kind === 'forbidden'} />
      ))}
    </>
  );
}
