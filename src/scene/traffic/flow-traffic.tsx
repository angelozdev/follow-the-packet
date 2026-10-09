import { PacketRun, type PacketLook } from '@/scene/entities';
import { usePacketRuns } from './use-packet-runs';

export function FlowTraffic({ look, index }: { look: PacketLook; index: number }) {
  const runs = usePacketRuns(look, index);
  return (
    <>
      {runs.map((run) => (
        <PacketRun key={run.key} path={run.path} message={run.message} intruder={run.intruder} end={run.end} />
      ))}
    </>
  );
}
