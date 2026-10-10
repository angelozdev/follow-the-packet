import type { Actor, ClientActor, Device, Lan, Network } from './types';

export const IMPLICIT_LAN_ID = 'lan';
const IMPLICIT_LAN_LATENCY_MS = 1;

/** Returns the local networks of an office: the ones it declares, or the single one of its range when it declares none. The single one takes the game's 1 ms for a hop of a local network. */
export function lansOf(net: Pick<Network, 'cidr' | 'lans'>): Lan[] {
  return net.lans ?? [{ id: IMPLICIT_LAN_ID, name: IMPLICIT_LAN_ID, cidr: net.cidr, latencyMs: IMPLICIT_LAN_LATENCY_MS }];
}

/** Returns the local network a device is on: the one it names, or the only one there is. It is undefined when the device names one that does not exist, or names none and there are several. */
export function lanOf(net: Pick<Network, 'cidr' | 'lans'>, device: Pick<Device, 'lanId'>): Lan | undefined {
  const lans = lansOf(net);
  if (device.lanId !== undefined) return lans.find((lan) => lan.id === device.lanId);
  return lans.length === 1 ? lans[0] : undefined;
}

/** True when the actor sends packets from outside the network (you, an attacker or a home); false for a server of the internet, which only answers. */
export function isClientActor(actor: Actor): actor is ClientActor {
  return actor.kind !== 'server';
}

/** True unless the device is plugged out: a device with no cable neither sends nor receives. */
export function isConnected(device: Pick<Device, 'connected'>): boolean {
  return device.connected !== false;
}
