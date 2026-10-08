import type { Network, PacketSpec } from './types';

export const APP_TARGET = '@appTarget';

/** Replaces the app target placeholder with the app target of the packet's source instance. */
export function materialize(packet: PacketSpec, net: Network): PacketSpec {
  if (packet.to !== APP_TARGET) return packet;
  const from = packet.from;
  const source = from.kind === 'instance' ? net.instances.find((i) => i.id === from.id) : undefined;
  if (!source?.appTarget) throw new Error(`${APP_TARGET} needs a source instance with an appTarget`);
  return { ...packet, to: source.appTarget };
}
