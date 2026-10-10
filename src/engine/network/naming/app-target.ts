import type { Network, PacketSpec } from '@/engine/network/types';

export const APP_TARGET = '@appTarget';

/** Replaces the app target placeholder with the app target of the packet's source device. */
export function materialize(packet: PacketSpec, net: Network): PacketSpec {
  if (packet.to !== APP_TARGET) return packet;
  const from = packet.from;
  const source = from.kind === 'device' ? net.devices.find((d) => d.id === from.id) : undefined;
  if (!source?.appTarget) throw new Error(`${APP_TARGET} needs a source device with an appTarget`);
  return { ...packet, to: source.appTarget };
}
