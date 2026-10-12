import { PacketRun, type PacketLook } from '@/scene/entities';
import { sendsBetween } from './schedule';
import { usePacketRuns, useSendOnce, type SendsBetween } from './use-packet-runs';

function PacketRuns({ look, sends }: { look: PacketLook; sends: SendsBetween }) {
  const runs = usePacketRuns(look, sends);
  return (
    <>
      {runs.map(({ key, ...run }) => (
        <PacketRun key={key} {...run} />
      ))}
    </>
  );
}

/** A live flow: it sends a packet every few seconds, shifted by its position among the flows. */
export function FlowTraffic({ look, index }: { look: PacketLook; index: number }) {
  return <PacketRuns look={look} sends={(from, to) => sendsBetween(from, to, index)} />;
}

/** A packet the player sent: it travels once for each send. */
export function SentTraffic({ look, send }: { look: PacketLook; send: number }) {
  return <PacketRuns look={look} sends={useSendOnce(send)} />;
}
